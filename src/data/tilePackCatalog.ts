import {
  PLACEHOLDER_TILE_SETS,
  getTileSetBySlug,
  type TileSetCatalogItem,
  type TileSetWhatYouGet,
} from './placeholderTileSets';

/** API base URL including stage path, e.g. https://xxxxx.execute-api.us-east-2.amazonaws.com/dev */
function apiBase(): string {
  return (process.env.GRIDSMITH_API_BASE_URL ?? '').trim().replace(/\/$/, '');
}

export function tilePackCatalogApiConfigured(): boolean {
  return Boolean(apiBase());
}

/** Stripe slugs → legacy placeholder slugs (copy, images, whatYouGet) until fully driven by Stripe metadata. */
const SLUG_ENRICH_FROM_PLACEHOLDER: Record<string, string> = {
  'tavern-core-set': 'tavern-set',
  'cave-core-set': 'cave-set',
};

function enrichWithPlaceholderCompat(item: TileSetCatalogItem): TileSetCatalogItem {
  const phSlug = SLUG_ENRICH_FROM_PLACEHOLDER[item.slug];
  if (!phSlug) return item;
  const ph = getTileSetBySlug(phSlug);
  if (!ph) return item;
  return {
    ...item,
    whatYouGet: item.whatYouGet ?? ph.whatYouGet,
    description: item.description?.trim() ? item.description : ph.description,
    imageSrc: item.imageSrc && item.imageSrc !== '/logo512.png' ? item.imageSrc : ph.imageSrc,
  };
}

function isWhatYouGet(v: unknown): v is TileSetWhatYouGet {
  return (
    typeof v === 'object' &&
    v != null &&
    typeof (v as TileSetWhatYouGet).heading === 'string' &&
    Array.isArray((v as TileSetWhatYouGet).bullets)
  );
}

function normalizeItem(raw: unknown): TileSetCatalogItem | null {
  if (typeof raw !== 'object' || raw == null) return null;
  const o = raw as Record<string, unknown>;
  const slug = typeof o.slug === 'string' ? o.slug.trim() : '';
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!slug || !name) return null;

  return {
    slug,
    name,
    priceLabel: typeof o.priceLabel === 'string' ? o.priceLabel : undefined,
    imageSrc: typeof o.imageSrc === 'string' && o.imageSrc ? o.imageSrc : '/logo512.png',
    description: typeof o.description === 'string' ? o.description : '',
    tagLabel: typeof o.tagLabel === 'string' ? o.tagLabel : 'Tile pack',
    disabled: o.disabled === true,
    addToCartDisabled: o.addToCartDisabled === true,
    order: typeof o.order === 'number' && Number.isFinite(o.order) ? o.order : 999,
    whatYouGet: isWhatYouGet(o.whatYouGet) ? o.whatYouGet : undefined,
    stripeProductId: typeof o.stripeProductId === 'string' ? o.stripeProductId : undefined,
    stripePriceId: typeof o.stripePriceId === 'string' ? o.stripePriceId : undefined,
  };
}

let cachedSuccess: TileSetCatalogItem[] | null = null;

export function loadTilePackCatalog(): Promise<TileSetCatalogItem[]> {
  if (!tilePackCatalogApiConfigured()) {
    return Promise.resolve([...PLACEHOLDER_TILE_SETS]);
  }
  if (cachedSuccess) {
    return Promise.resolve(cachedSuccess);
  }

  const base = apiBase();
  return fetch(`${base}/api/catalog/tile-packs`)
    .then(async (r) => {
      if (!r.ok) {
        const t = await r.text();
        let detail = t || r.statusText;
        try {
          const j = JSON.parse(t) as { diagnostic?: string };
          if (typeof j.diagnostic === 'string' && j.diagnostic.trim()) {
            detail = `${detail}\n(diagnostic) ${j.diagnostic.trim()}`;
          }
        } catch {
          /* not JSON */
        }
        throw new Error(`${r.status} ${r.statusText}: ${detail}`);
      }
      return r.json() as Promise<{ items?: unknown[] }>;
    })
    .then((data) => {
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const parsed = rawItems.map(normalizeItem).filter((x): x is TileSetCatalogItem => x != null);
      const enriched = parsed.map(enrichWithPlaceholderCompat);
      enriched.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
      cachedSuccess = enriched;
      return enriched;
    })
    .catch((e) => {
      console.warn('tile pack catalog fetch failed', e);
      return [...PLACEHOLDER_TILE_SETS];
    });
}

export function findTileSetBySlug(
  list: TileSetCatalogItem[],
  slug: string,
): TileSetCatalogItem | undefined {
  return list.find((t) => t.slug === slug);
}
