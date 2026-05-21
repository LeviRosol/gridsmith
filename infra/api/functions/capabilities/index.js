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
 * From paid Checkout Sessions, collect each Stripe price ID with the latest completion time
 * (Checkout Session `created` used as purchase timestamp; typically within seconds of payment).
 * @returns {{ priceId: string, purchasedAtUnix: number }[]}
 */
async function collectOwnedPurchasesFromSessions(stripe, customerId) {
  /** @type {Map<string, number>} */
  const best = new Map();
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
    const t = typeof full.created === 'number' ? full.created : 0;
    const rows = full.line_items && full.line_items.data ? full.line_items.data : [];
    for (const li of rows) {
      let priceId = null;
      if (li.price && typeof li.price === 'object' && li.price.id) {
        priceId = li.price.id;
      } else if (typeof li.price === 'string') {
        priceId = li.price;
      }
      if (!priceId || !String(priceId).startsWith('price_')) continue;
      const prev = best.get(priceId);
      if (prev == null || t > prev) {
        best.set(priceId, t);
      }
    }
  }
  return [...best.entries()].map(([priceId, purchasedAtUnix]) => ({ priceId, purchasedAtUnix }));
}

async function resolveOwnedPurchasesPayload(stripe, fromSessions) {
  const unixByPrice = new Map(fromSessions.map((r) => [r.priceId, r.purchasedAtUnix]));
  const productIds = new Set();
  /** @type {{ priceId: string, purchasedAt: string, productId?: string }[]} */
  const ownedPurchases = [];

  for (const pid of unixByPrice.keys()) {
    try {
      const price = await stripe.prices.retrieve(pid);
      const unix = unixByPrice.get(pid);
      const purchasedAt =
        typeof unix === 'number' ? new Date(unix * 1000).toISOString() : new Date(0).toISOString();
      let productId;
      if (price.product && typeof price.product === 'string') {
        productId = price.product;
        productIds.add(price.product);
      } else if (price.product && typeof price.product === 'object' && price.product.id) {
        productId = price.product.id;
        productIds.add(price.product.id);
      }
      const row = { priceId: pid, purchasedAt };
      if (productId) row.productId = productId;
      ownedPurchases.push(row);
    } catch (e) {
      console.warn('capabilities price retrieve', pid, e.message);
    }
  }

  return {
    ownedPriceIds: ownedPurchases.map((r) => r.priceId),
    ownedProductIds: [...productIds],
    ownedPurchases,
  };
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
        ownedPurchases: [],
        stage,
      });
    }

    const fromSessions = await collectOwnedPurchasesFromSessions(stripe, customerId);
    const { ownedPriceIds, ownedProductIds, ownedPurchases } = await resolveOwnedPurchasesPayload(
      stripe,
      fromSessions,
    );

    return json(200, {
      sub,
      stripeCustomerId: customerId,
      ownedPriceIds,
      ownedProductIds,
      ownedPurchases,
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
