import type { TileSetCatalogItem } from '../data/placeholderTileSets';

/** SCAD `tile_set` value → Stripe catalog `slug` rows that license Med/High for that in-app set. */
export const TILE_SET_VAR_TO_CATALOG_SLUGS: Record<string, readonly string[]> = {
  tavern: ['tavern-set', 'tavern-core-set'],
  cave: ['cave-set', 'cave-core-set'],
};

/** Catalog `slug` → SCAD `tile_set` value (inverse of `TILE_SET_VAR_TO_CATALOG_SLUGS`). */
export function tileSetVarForCatalogSlug(slug: string): string | undefined {
  const s = typeof slug === 'string' ? slug.trim() : '';
  if (!s) return undefined;
  for (const [varName, slugs] of Object.entries(TILE_SET_VAR_TO_CATALOG_SLUGS)) {
    if ((slugs as readonly string[]).includes(s)) return varName;
  }
  return undefined;
}

export function catalogSlugsForTileSetVar(tileSet: string): readonly string[] {
  const key = typeof tileSet === 'string' ? tileSet.trim() : '';
  return key ? TILE_SET_VAR_TO_CATALOG_SLUGS[key] ?? [] : [];
}

/** True when catalog marks this row for Tile Builder Med/High (Stripe-driven; see catalog Lambda). */
export function catalogItemGrantsTileBuilderPro(set: TileSetCatalogItem): boolean {
  return set.tileBuilderFeatures === true;
}

/**
 * Med/High for a specific SCAD `tile_set`: user must own a catalog row for that set with
 * `tileBuilderFeatures` (owns matching price or product).
 */
export function computeTileBuilderProEntitledForTileSet(
  tileSet: string,
  ownedPriceIds: readonly string[],
  ownedProductIds: readonly string[],
  catalog: readonly TileSetCatalogItem[],
): boolean {
  const slugs = new Set(catalogSlugsForTileSetVar(tileSet));
  if (slugs.size === 0) return false;

  const priceSet = new Set(ownedPriceIds);
  const productSet = new Set(ownedProductIds);
  for (const row of catalog) {
    if (!slugs.has(row.slug)) continue;
    if (!catalogItemGrantsTileBuilderPro(row)) continue;
    const pid = row.stripePriceId?.trim();
    const prod = row.stripeProductId?.trim();
    if (pid && priceSet.has(pid)) return true;
    if (prod && productSet.has(prod)) return true;
  }
  return false;
}
