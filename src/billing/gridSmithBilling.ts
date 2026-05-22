import { ensureFreshCognitoIdToken } from '../cognito/ensureIdToken.ts';

function apiBase(): string {
  return (process.env.GRIDSMITH_API_BASE_URL ?? '').trim().replace(/\/$/, '');
}

export type CreateCheckoutSessionParams = {
  /** Single-item checkout (backward compatible). */
  priceId?: string;
  /** Multi-item checkout; each line is quantity 1. Ignored if `priceId` is set. */
  lineItems?: { priceId: string }[];
  successPath?: string;
  cancelPath?: string;
};

export type CreateCheckoutSessionResult = {
  url: string;
  sessionId?: string;
};

export async function createGridSmithCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CreateCheckoutSessionResult> {
  const base = apiBase();
  if (!base) {
    throw new Error('GRIDSMITH_API_BASE_URL is not configured');
  }
  const token = await ensureFreshCognitoIdToken();
  if (!token) {
    throw new Error('Sign in to continue to checkout.');
  }
  const single = typeof params.priceId === 'string' ? params.priceId.trim() : '';
  const multi =
    Array.isArray(params.lineItems) && !single
      ? params.lineItems
          .map((row) => (typeof row.priceId === 'string' ? row.priceId.trim() : ''))
          .filter((id) => id.startsWith('price_'))
      : [];
  if (!single && multi.length === 0) {
    throw new Error('Provide priceId or at least one lineItems entry.');
  }

  const body: Record<string, unknown> = {
    successPath: params.successPath ?? '/tiles',
    cancelPath: params.cancelPath ?? '/tiles',
  };
  if (single) {
    body.priceId = single;
  } else {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const id of multi) {
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(id);
    }
    if (deduped.length === 0) {
      throw new Error('No valid price ids in lineItems.');
    }
    if (deduped.length === 1) {
      body.priceId = deduped[0];
    } else {
      body.lineItems = deduped.map((priceId) => ({ priceId, quantity: 1 }));
    }
  }

  const r = await fetch(`${base}/api/billing/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    let detail = text || r.statusText;
    try {
      const j = JSON.parse(text) as { diagnostic?: string; message?: string };
      if (typeof j.diagnostic === 'string' && j.diagnostic.trim()) {
        detail = `${detail}\n(diagnostic) ${j.diagnostic.trim()}`;
      } else if (typeof j.message === 'string' && j.message.trim()) {
        detail = j.message.trim();
      }
      if (r.status === 401) {
        const reason = typeof j.reason === 'string' ? j.reason.trim() : '';
        if (reason) {
          detail = `${detail} (${reason})`;
        }
        detail =
          `${detail} Try signing out and back in. If it persists, production Cognito settings on the API may not match the site.`;
      }
    } catch {
      /* ignore */
    }
    throw new Error(`${r.status}: ${detail}`);
  }
  const data = JSON.parse(text) as { url?: string; sessionId?: string };
  if (!data.url) {
    throw new Error('Checkout response missing url');
  }
  return { url: data.url, sessionId: data.sessionId };
}

const DEFAULT_CART_CHECKOUT_SUCCESS = '/cart?checkout=success';
const DEFAULT_CART_CHECKOUT_CANCEL = '/cart';

/**
 * Starts Stripe Checkout for the given cart price ids (deduped, order preserved).
 * Single pack: sends top-level `priceId` only (required by older checkout Lambdas).
 * Multiple packs: sends `lineItems` (requires a deployed Lambda that supports multi-line checkout).
 */
export async function startGridSmithCheckoutForCartPriceIds(
  priceIds: string[],
  options?: { successPath?: string; cancelPath?: string },
): Promise<CreateCheckoutSessionResult> {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of priceIds) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id.startsWith('price_') || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (ids.length === 0) {
    throw new Error('Cart is empty.');
  }
  const successPath = options?.successPath ?? DEFAULT_CART_CHECKOUT_SUCCESS;
  const cancelPath = options?.cancelPath ?? DEFAULT_CART_CHECKOUT_CANCEL;

  if (ids.length === 1) {
    return createGridSmithCheckoutSession({
      priceId: ids[0],
      successPath,
      cancelPath,
    });
  }

  try {
    return await createGridSmithCheckoutSession({
      lineItems: ids.map((priceId) => ({ priceId })),
      successPath,
      cancelPath,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      /\b400\b/.test(msg) &&
      (msg.includes('priceId') || msg.includes('invalid_price') || msg.includes('invalid_body'))
    ) {
      throw new Error(
        `${msg} — Multi-pack checkout needs an updated checkout API. Your cart has ${ids.length} packs; remove packs until one remains, or redeploy the checkout Lambda with multi-line support.`,
      );
    }
    throw e;
  }
}

export type OwnedPurchaseRow = {
  priceId: string;
  /** ISO 8601 from Checkout Session completion (see capabilities Lambda). */
  purchasedAt: string;
  productId?: string;
};

export type GridSmithCapabilities = {
  sub: string;
  stripeCustomerId: string | null;
  ownedPriceIds: string[];
  ownedProductIds: string[];
  /** Per-price purchase times from paid Checkout Sessions (newer capabilities API). */
  ownedPurchases?: OwnedPurchaseRow[];
};

export async function fetchGridSmithCapabilities(): Promise<GridSmithCapabilities> {
  const base = apiBase();
  if (!base) {
    throw new Error('GRIDSMITH_API_BASE_URL is not configured');
  }
  const token = await ensureFreshCognitoIdToken();
  if (!token) {
    throw new Error('Sign in to load your purchases.');
  }
  const r = await fetch(`${base}/api/capabilities/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  if (!r.ok) {
    let detail = text || r.statusText;
    try {
      const j = JSON.parse(text) as { diagnostic?: string; message?: string };
      if (typeof j.diagnostic === 'string' && j.diagnostic.trim()) {
        detail = `${detail}\n(diagnostic) ${j.diagnostic.trim()}`;
      } else if (typeof j.message === 'string' && j.message.trim()) {
        detail = j.message.trim();
      }
    } catch {
      /* ignore */
    }
    throw new Error(`${r.status}: ${detail}`);
  }
  const data = JSON.parse(text) as GridSmithCapabilities;
  const ownedPurchases = Array.isArray(data.ownedPurchases)
    ? data.ownedPurchases.filter(
        (row): row is OwnedPurchaseRow =>
          !!row &&
          typeof row === 'object' &&
          typeof row.priceId === 'string' &&
          row.priceId.startsWith('price_') &&
          typeof row.purchasedAt === 'string' &&
          row.purchasedAt.length > 0,
      )
    : [];
  return { ...data, ownedPurchases };
}

export type TilePackDownloadResponse = {
  url: string;
  expiresIn?: number;
};

/** Request a short-lived S3 GET URL for one owned pack (`priceId`). Navigate to `url` to start the download. */
export async function fetchTilePackDownloadUrl(priceId: string): Promise<TilePackDownloadResponse> {
  const id = typeof priceId === 'string' ? priceId.trim() : '';
  if (!id.startsWith('price_')) {
    throw new Error('Invalid price id.');
  }
  const base = apiBase();
  if (!base) {
    throw new Error('GRIDSMITH_API_BASE_URL is not configured');
  }
  const token = await ensureFreshCognitoIdToken();
  if (!token) {
    throw new Error('Sign in to download.');
  }
  const r = await fetch(`${base}/api/downloads/tile-pack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId: id }),
  });
  const text = await r.text();
  if (!r.ok) {
    let detail = text || r.statusText;
    try {
      const j = JSON.parse(text) as { diagnostic?: string; message?: string };
      if (typeof j.diagnostic === 'string' && j.diagnostic.trim()) {
        detail = `${detail}\n(diagnostic) ${j.diagnostic.trim()}`;
      } else if (typeof j.message === 'string' && j.message.trim()) {
        detail = j.message.trim();
      }
    } catch {
      /* ignore */
    }
    throw new Error(`${r.status}: ${detail}`);
  }
  const data = JSON.parse(text) as { url?: string; expiresIn?: number };
  if (!data.url || typeof data.url !== 'string') {
    throw new Error('Download response missing url');
  }
  return { url: data.url, expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : undefined };
}
