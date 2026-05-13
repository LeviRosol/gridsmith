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

/**
 * Collect paid one-time price IDs from completed Checkout Sessions for this customer.
 * Session list does not expand line_items; retrieve each paid session (bounded).
 */
async function collectOwnedPriceIds(stripe, customerId) {
  const owned = new Set();
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
      if (li.price && typeof li.price === 'object' && li.price.id) {
        owned.add(li.price.id);
      } else if (typeof li.price === 'string') {
        owned.add(li.price);
      }
    }
  }
  return [...owned];
}

exports.handler = async (event) => {
  const stage = process.env.STAGE || 'unknown';

  try {
    const authHeader = headerGet(event.headers, 'authorization');
    const { sub } = await verifyIdToken(authHeader);

    const stripe = await getStripe();
    const customerId = await findCustomerId(stripe, sub);

    if (!customerId) {
      return json(200, {
        sub,
        stripeCustomerId: null,
        ownedPriceIds: [],
        ownedProductIds: [],
        stage,
      });
    }

    const ownedPriceIds = await collectOwnedPriceIds(stripe, customerId);
    const productIds = new Set();
    for (const pid of ownedPriceIds) {
      try {
        const price = await stripe.prices.retrieve(pid);
        if (price.product && typeof price.product === 'string') {
          productIds.add(price.product);
        } else if (price.product && typeof price.product === 'object' && price.product.id) {
          productIds.add(price.product.id);
        }
      } catch (e) {
        console.warn('capabilities price retrieve', pid, e.message);
      }
    }

    return json(200, {
      sub,
      stripeCustomerId: customerId,
      ownedPriceIds,
      ownedProductIds: [...productIds],
      stage,
    });
  } catch (err) {
    const code = err.statusCode === 401 ? 401 : 500;
    const payload = {
      error: code === 401 ? 'unauthorized' : 'capabilities_failed',
      message: code === 401 ? 'Sign in required or session expired.' : 'Could not load capabilities.',
      stage,
    };
    if (stage === 'dev' && err.message) {
      payload.diagnostic = String(err.message).slice(0, 400);
    }
    if (err.statusCode === 401) {
      return json(401, payload);
    }
    console.error('capabilities error', err);
    return json(500, payload);
  }
};
