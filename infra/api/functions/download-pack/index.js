'use strict';

const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getStripe } = require('./stripeClient');
const { verifyIdToken } = require('./cognitoVerify');

const cors = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
};

const PRESIGN_TTL_SECONDS = 300;

/** Shown to clients when `STAGE=prod` for any failure that would expose ops/setup details. */
const MSG_PROD_DOWNLOAD_SAFE =
  'There was an error downloading your file. Please try again later or contact support.';

function isProdStage(stage) {
  return String(stage || '').toLowerCase() === 'prod';
}

function clientErrorMessage(stage, devDetail, prodSafe = MSG_PROD_DOWNLOAD_SAFE) {
  return isProdStage(stage) ? prodSafe : devDetail;
}

function json(status, body) {
  return { statusCode: status, headers: cors, body: JSON.stringify(body) };
}

function headerGet(headers, name) {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return headers[k];
  }
  return undefined;
}

function escapeSearchValue(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findCustomerId(stripe, sub) {
  const q = `metadata['cognito_sub']:'${escapeSearchValue(sub)}'`;
  const found = await stripe.customers.search({ query: q, limit: 1 });
  if (!found.data.length) return null;
  return found.data[0].id;
}

/** Price ids from paid Checkout Sessions (same source as capabilities). */
async function collectOwnedPriceIds(stripe, customerId) {
  const ids = new Set();
  const list = await stripe.checkout.sessions.list({
    customer: customerId,
    status: 'complete',
    limit: 40,
  });
  const paid = list.data.filter((s) => s.payment_status === 'paid');
  const expanded = await Promise.all(
    paid.map((s) => stripe.checkout.sessions.retrieve(s.id, { expand: ['line_items'] })),
  );
  for (const full of expanded) {
    const rows = full.line_items && full.line_items.data ? full.line_items.data : [];
    for (const li of rows) {
      let priceId = null;
      if (li.price && typeof li.price === 'object' && li.price.id) {
        priceId = li.price.id;
      } else if (typeof li.price === 'string') {
        priceId = li.price;
      }
      if (priceId && String(priceId).startsWith('price_')) {
        ids.add(priceId);
      }
    }
  }
  return ids;
}

function parseJsonBody(event) {
  if (!event.body) return null;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeS3Key(raw) {
  if (raw == null) return '';
  let k = String(raw).trim();
  if (!k) return '';
  k = k.replace(/^\/+/, '');
  if (k.includes('..') || k.startsWith('\\')) {
    return '';
  }
  return k;
}

exports.handler = async (event) => {
  const stage = process.env.STAGE || 'unknown';
  const bucket = (process.env.DOWNLOADS_BUCKET_NAME || '').trim();

  if (!bucket) {
    return json(500, {
      error: 'server_misconfigured',
      message: clientErrorMessage(
        stage,
        'Downloads bucket is not configured.',
        MSG_PROD_DOWNLOAD_SAFE,
      ),
      stage,
    });
  }

  try {
    const authHeader = headerGet(event.headers, 'authorization');
    const { sub } = await verifyIdToken(authHeader);

    const body = parseJsonBody(event);
    if (!body || typeof body !== 'object') {
      return json(400, {
        error: 'invalid_json',
        message: clientErrorMessage(stage, 'Expected JSON body.', 'Invalid request.'),
        stage,
      });
    }
    const priceId = typeof body.priceId === 'string' ? body.priceId.trim() : '';
    if (!priceId.startsWith('price_')) {
      return json(400, {
        error: 'invalid_body',
        message: clientErrorMessage(
          stage,
          'Body must include priceId (Stripe price_… id).',
          'Invalid request.',
        ),
        stage,
      });
    }

    const stripe = await getStripe();
    const customerId = await findCustomerId(stripe, sub);
    if (!customerId) {
      return json(403, { error: 'not_entitled', message: 'No purchases found for this account.', stage });
    }

    const owned = await collectOwnedPriceIds(stripe, customerId);
    if (!owned.has(priceId)) {
      return json(403, { error: 'not_entitled', message: 'This pack is not in your purchase history.', stage });
    }

    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const product = price.product && typeof price.product === 'object' ? price.product : null;
    if (!product || !product.metadata) {
      return json(404, {
        error: 'pack_not_configured',
        message: clientErrorMessage(
          stage,
          'Product metadata is missing for this price.',
          MSG_PROD_DOWNLOAD_SAFE,
        ),
        stage,
      });
    }

    const meta = product.metadata;
    const rawKey =
      (typeof meta.pack_download_s3_key === 'string' && meta.pack_download_s3_key.trim()) ||
      (typeof meta.packDownloadS3Key === 'string' && meta.packDownloadS3Key.trim()) ||
      '';
    const objectKey = normalizeS3Key(rawKey);
    if (!objectKey) {
      return json(404, {
        error: 'pack_not_configured',
        message: clientErrorMessage(
          stage,
          'Set Stripe Product metadata pack_download_s3_key to the object key inside the downloads bucket (e.g. tavern-core-set/v1/pack.zip).',
          MSG_PROD_DOWNLOAD_SAFE,
        ),
        stage,
      });
    }

    const region = process.env.AWS_REGION || 'us-east-1';
    const s3 = new S3Client({ region });
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    } catch (e) {
      if (
        e &&
        (e.name === 'NotFound' ||
          e.name === 'NoSuchKey' ||
          e.$metadata?.httpStatusCode === 404)
      ) {
        return json(404, {
          error: 'object_not_found',
          message: clientErrorMessage(
            stage,
            'Pack file is not in storage yet. Try again later or contact support.',
            MSG_PROD_DOWNLOAD_SAFE,
          ),
          stage,
        });
      }
      throw e;
    }

    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
    const url = await getSignedUrl(s3, getCmd, { expiresIn: PRESIGN_TTL_SECONDS });

    return json(200, {
      url,
      expiresIn: PRESIGN_TTL_SECONDS,
      stage,
    });
  } catch (err) {
    if (err.statusCode === 401) {
      return json(401, {
        error: 'unauthorized',
        message: 'Sign in required or session expired.',
        stage,
      });
    }
    console.error('download-pack error', err);
    const payload = {
      error: 'download_failed',
      message: clientErrorMessage(stage, 'Could not prepare download.', MSG_PROD_DOWNLOAD_SAFE),
      stage,
    };
    if (!isProdStage(stage) && err.message) {
      payload.diagnostic = String(err.message).slice(0, 400);
    }
    return json(500, payload);
  }
};
