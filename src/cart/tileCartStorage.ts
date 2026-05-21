/** Persisted tile-pack cart lines (quantity is always 1 per Stripe price). */

export const TILE_CART_STORAGE_KEY = 'gridsmith.tileCart.v1';

export type TileCartLine = {
  priceId: string;
  slug: string;
  name: string;
  priceLabel?: string;
  imageSrc: string;
};

export type TileCartSnapshot = {
  version: 1;
  items: TileCartLine[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseLine(raw: unknown): TileCartLine | null {
  if (!isRecord(raw)) return null;
  const priceId = typeof raw.priceId === 'string' ? raw.priceId.trim() : '';
  const slug = typeof raw.slug === 'string' ? raw.slug.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const imageSrc = typeof raw.imageSrc === 'string' ? raw.imageSrc.trim() : '';
  if (!priceId.startsWith('price_') || !slug || !name || !imageSrc) return null;
  const priceLabel = typeof raw.priceLabel === 'string' ? raw.priceLabel.trim() : undefined;
  return { priceId, slug, name, imageSrc, ...(priceLabel ? { priceLabel } : {}) };
}

export function readStoredTileCart(): TileCartLine[] {
  try {
    const raw = localStorage.getItem(TILE_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return [];
    if (parsed.version !== 1) return [];
    if (!Array.isArray(parsed.items)) return [];
    const out: TileCartLine[] = [];
    const seen = new Set<string>();
    for (const row of parsed.items) {
      const line = parseLine(row);
      if (!line || seen.has(line.priceId)) continue;
      seen.add(line.priceId);
      out.push(line);
    }
    return out;
  } catch {
    return [];
  }
}

export function writeStoredTileCart(items: TileCartLine[]): void {
  const snapshot: TileCartSnapshot = { version: 1, items };
  try {
    localStorage.setItem(TILE_CART_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredTileCart(): void {
  try {
    localStorage.removeItem(TILE_CART_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
