'use strict';

const Stripe = require('stripe');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

/** Secrets Manager is regional; ARN must match the region you call (not always Lambda's region). */
function secretsManagerRegion() {
  const arn = process.env.STRIPE_SECRET_ARN || '';
  const m = arn.match(/^arn:aws:secretsmanager:([^:]+):/);
  return m ? m[1] : process.env.AWS_REGION || 'us-east-1';
}

function secretsClient() {
  return new SecretsManagerClient({ region: secretsManagerRegion() });
}

let stripeKeyCache;
let stripeClient;

const SK_KEY_RE = /^(sk|rk)_(test|live)_[A-Za-z0-9_]+$/;

function findStripeKeyInParsedJson(val, depth = 0) {
  if (depth > 8) return null;
  if (typeof val === 'string') {
    const s = val.trim().replace(/^['"]|['"]$/g, '');
    return SK_KEY_RE.test(s) ? s : null;
  }
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      for (const el of val) {
        const found = findStripeKeyInParsedJson(el, depth + 1);
        if (found) return found;
      }
      return null;
    }
    for (const k of Object.keys(val)) {
      const found = findStripeKeyInParsedJson(val[k], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function getStripeSecretKey() {
  if (stripeKeyCache) return stripeKeyCache;
  const arn = process.env.STRIPE_SECRET_ARN;
  if (!arn) {
    throw new Error('Missing STRIPE_SECRET_ARN');
  }
  const out = await secretsClient().send(new GetSecretValueCommand({ SecretId: arn }));
  const raw = out.SecretString;
  if (!raw) {
    throw new Error('Secret has no SecretString');
  }
  const trimmed = raw.trim();

  const bare = trimmed.replace(/^['"]|['"]$/g, '');
  if (SK_KEY_RE.test(bare)) {
    stripeKeyCache = bare;
    return stripeKeyCache;
  }

  if (trimmed.startsWith('{')) {
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Secret looks like JSON but is invalid: ${e.message || e}`);
    }
    const explicit =
      (typeof obj.STRIPE_SECRET_KEY === 'string' && obj.STRIPE_SECRET_KEY.trim()) ||
      (typeof obj.stripe_secret_key === 'string' && obj.stripe_secret_key.trim()) ||
      (typeof obj.secret === 'string' && obj.secret.trim()) ||
      (typeof obj.sk_test === 'string' && obj.sk_test.trim()) ||
      (typeof obj.sk_live === 'string' && obj.sk_live.trim()) ||
      (typeof obj.apiKey === 'string' && obj.apiKey.trim()) ||
      (typeof obj.api_key === 'string' && obj.api_key.trim());
    if (explicit && SK_KEY_RE.test(explicit.replace(/^['"]|['"]$/g, ''))) {
      stripeKeyCache = explicit.replace(/^['"]|['"]$/g, '');
      return stripeKeyCache;
    }
    const deep = findStripeKeyInParsedJson(obj);
    if (deep) {
      stripeKeyCache = deep;
      return stripeKeyCache;
    }
    throw new Error(
      'Secret is JSON but no sk_test_/sk_live_/rk_test_/rk_live_ value was found. Store the key as plain text, or use JSON whose values include your Stripe secret or restricted key string.',
    );
  }

  throw new Error(
    'Secret must be plain sk_/rk_ key text, or JSON containing that string (nested values are scanned).',
  );
}

async function getStripe() {
  if (stripeClient) return stripeClient;
  const key = await getStripeSecretKey();
  stripeClient = new Stripe(key);
  return stripeClient;
}

function truthyMetadata(val) {
  if (val == null) return false;
  const s = String(val).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function formatMoney(unitAmount, currency) {
  if (unitAmount == null || currency == null) return undefined;
  const cur = String(currency).toUpperCase();
  const n = Number(unitAmount);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n / 100);
  } catch {
    return `${(n / 100).toFixed(2)} ${cur}`;
  }
}

function parseOrder(meta) {
  const o = meta?.order;
  if (o == null || o === '') return 999;
  const n = Number.parseInt(String(o), 10);
  return Number.isFinite(n) ? n : 999;
}

function parseWhatYouGet(raw) {
  if (!raw || typeof raw !== 'string') return undefined;
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object' && Array.isArray(v.bullets) && typeof v.heading === 'string') {
      return {
        heading: v.heading,
        intro: typeof v.intro === 'string' ? v.intro : undefined,
        bullets: v.bullets.map(String),
        closing: typeof v.closing === 'string' ? v.closing : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function mapProductToItem(product, priceObj) {
  const meta = product.metadata || {};
  const slug = String(meta.slug || '').trim();
  if (!slug) return null;

  if (!priceObj || priceObj.object !== 'price') {
    return null;
  }
  if (priceObj.type !== 'one_time') {
    return null;
  }

  const imageFromStripe =
    product.images && product.images.length > 0 ? String(product.images[0]).trim() : '';
  const imageFromMeta = meta.image_src ? String(meta.image_src).trim() : '';
  const imageSrc = imageFromMeta || imageFromStripe || '/logo512.png';

  const description = (product.description && String(product.description).trim()) || '';

  const priceLabel = formatMoney(priceObj.unit_amount, priceObj.currency);

  const tagLabel = meta.tag_label ? String(meta.tag_label).trim() : 'Tile pack';
  const disabled = truthyMetadata(meta.disabled);
  const addToCartDisabled = truthyMetadata(meta.add_to_cart_disabled);

  const whatYouGet = parseWhatYouGet(meta.what_you_get);

  return {
    slug,
    name: product.name || slug,
    priceLabel,
    imageSrc,
    description,
    tagLabel,
    disabled,
    addToCartDisabled,
    order: parseOrder(meta),
    whatYouGet,
    stripeProductId: product.id,
    stripePriceId: priceObj.id,
  };
}

exports.handler = async () => {
  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
  };

  try {
    const stripe = await getStripe();
    const list = await stripe.products.list({
      active: true,
      limit: 100,
    });

    const items = [];
    for (const product of list.data) {
      const dp = product.default_price;
      if (!dp) continue;
      const priceId = typeof dp === 'string' ? dp : dp.id;
      const priceObj = await stripe.prices.retrieve(priceId);
      const item = mapProductToItem(product, priceObj);
      if (item) items.push(item);
    }

    items.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items,
        source: 'stripe',
        stage: process.env.STAGE || 'unknown',
      }),
    };
  } catch (err) {
    console.error('catalog error', err && err.message, err && err.stack, err && err.code);
    const stage = process.env.STAGE || 'unknown';
    const payload = {
      error: 'catalog_failed',
      message: 'Could not load tile pack catalog.',
      stage,
    };
    // Dev-only: safe hint for debugging (never include raw Stripe keys).
    if (stage === 'dev') {
      const raw = `${err && err.name ? `${err.name}: ` : ''}${err && err.message ? err.message : String(err)}`;
      payload.diagnostic = raw
        .replace(/\b(sk|rk)_(test|live)_[A-Za-z0-9_]+/gi, '$1_$2_***')
        .slice(0, 500);
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(payload),
    };
  }
};
