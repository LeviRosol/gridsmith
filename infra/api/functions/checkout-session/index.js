'use strict';

const { getStripe } = require('./stripeClient');
const { verifyIdToken } = require('./cognitoVerify');

const cors = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
};

function json(status, body) {
  return { statusCode: status, headers: cors, body: JSON.stringify(body) };
}

function parseJsonBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

function normalizePath(p, fallback) {
  const raw = typeof p === 'string' && p.trim() ? p.trim() : fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes('://')) return fallback;
  return raw.split('?')[0] || fallback;
}

async function findOrCreateCustomer(stripe, sub, email) {
  const q = `metadata['cognito_sub']:'${escapeSearchValue(sub)}'`;
  const found = await stripe.customers.search({ query: q, limit: 1 });
  if (found.data.length) return found.data[0].id;
  const create = await stripe.customers.create({
    metadata: { cognito_sub: sub },
    ...(email ? { email } : {}),
  });
  return create.id;
}

exports.handler = async (event) => {
  const stage = process.env.STAGE || 'unknown';
  const origin = (process.env.PUBLIC_APP_ORIGIN || '').replace(/\/$/, '');
  if (!origin) {
    return json(500, {
      error: 'server_misconfigured',
      message: 'PUBLIC_APP_ORIGIN is not set on the checkout Lambda.',
      stage,
    });
  }

  try {
    const authHeader = headerGet(event.headers, 'authorization');
    const { sub, email } = await verifyIdToken(authHeader);

    const body = parseJsonBody(event);
    if (!body || typeof body !== 'object') {
      return json(400, { error: 'invalid_json', stage });
    }

    const MAX_LINE_ITEMS = 20;
    /** @type {{ priceId: string, quantity: number }[]} */
    let lineItemInputs = [];
    const singlePrice = typeof body.priceId === 'string' ? body.priceId.trim() : '';
    if (singlePrice.startsWith('price_')) {
      lineItemInputs = [{ priceId: singlePrice, quantity: 1 }];
    } else if (Array.isArray(body.lineItems)) {
      const seen = new Set();
      for (const row of body.lineItems) {
        if (!row || typeof row !== 'object') continue;
        const pid = typeof row.priceId === 'string' ? row.priceId.trim() : '';
        if (!pid.startsWith('price_') || seen.has(pid)) continue;
        const qtyRaw = row.quantity;
        const qty = qtyRaw === undefined ? 1 : Number(qtyRaw);
        if (qty !== 1) {
          return json(400, {
            error: 'invalid_quantity',
            message: 'Each pack must use quantity 1.',
            stage,
          });
        }
        seen.add(pid);
        lineItemInputs.push({ priceId: pid, quantity: 1 });
      }
    } else {
      return json(400, {
        error: 'invalid_body',
        message: 'Body must include priceId or lineItems (array of { priceId, quantity?: 1 }).',
        stage,
      });
    }

    if (lineItemInputs.length === 0) {
      return json(400, { error: 'invalid_line_items', message: 'No valid price ids.', stage });
    }
    if (lineItemInputs.length > MAX_LINE_ITEMS) {
      return json(400, {
        error: 'too_many_items',
        message: `Maximum ${MAX_LINE_ITEMS} packs per checkout.`,
        stage,
      });
    }

    const successPath = normalizePath(body.successPath, '/tiles');
    const cancelPath = normalizePath(body.cancelPath, '/tiles');

    const stripe = await getStripe();
    /** @type {{ price: string, quantity: number }[]} */
    const stripeLineItems = [];
    for (const { priceId } of lineItemInputs) {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        return json(400, { error: 'price_inactive', message: priceId, stage });
      }
      if (price.type !== 'one_time') {
        return json(400, { error: 'price_not_one_time', message: priceId, stage });
      }
      stripeLineItems.push({ price: priceId, quantity: 1 });
    }

    const customerId = await findOrCreateCustomer(stripe, sub, email);

    const successUrl = `${origin}${successPath}${successPath.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${cancelPath}${cancelPath.includes('?') ? '&' : '?'}checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      client_reference_id: sub,
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: false },
      metadata: { cognito_sub: sub },
    });

    if (!session.url) {
      return json(500, { error: 'no_checkout_url', stage });
    }

    return json(200, { url: session.url, sessionId: session.id, stage });
  } catch (err) {
    const code = err.statusCode === 401 ? 401 : 500;
    const payload = {
      error: code === 401 ? 'unauthorized' : 'checkout_failed',
      message: code === 401 ? 'Sign in required or session expired.' : 'Could not start checkout.',
      stage,
    };
    if (stage === 'dev' && err.message) {
      payload.diagnostic = String(err.message).slice(0, 400);
    }
    if (err.statusCode === 401) {
      return json(401, payload);
    }
    console.error('checkout-session error', err);
    return json(500, payload);
  }
};
