import type { GridSmithCapabilities, OwnedPurchaseRow } from '../billing/gridSmithBilling';
import type { TileSetCatalogItem } from './placeholderTileSets';

export type OwnedPackWithPurchase = TileSetCatalogItem & { purchasedAt: string | null };

function latestPurchaseIsoForProduct(
  ownedPurchases: OwnedPurchaseRow[] | undefined,
  productId: string,
): string | null {
  if (!ownedPurchases?.length) return null;
  let best: string | null = null;
  for (const row of ownedPurchases) {
    if (row.productId !== productId || !row.purchasedAt) continue;
    if (!best || row.purchasedAt > best) best = row.purchasedAt;
  }
  return best;
}

/** Catalog rows the user owns, with purchase time when the API returns `ownedPurchases`. */
export function catalogOwnedPacksWithPurchases(
  catalog: TileSetCatalogItem[],
  caps: GridSmithCapabilities,
): OwnedPackWithPurchase[] {
  const purchases = caps.ownedPurchases ?? [];
  const byPrice = new Map<string, string>();
  for (const row of purchases) {
    if (!row.priceId?.startsWith('price_') || !row.purchasedAt) continue;
    const cur = byPrice.get(row.priceId);
    if (!cur || row.purchasedAt > cur) byPrice.set(row.priceId, row.purchasedAt);
  }
  const priceSet = new Set(caps.ownedPriceIds);
  const productSet = new Set(caps.ownedProductIds);
  const bySlug = new Map<string, OwnedPackWithPurchase>();
  for (const item of catalog) {
    const matchPrice = Boolean(item.stripePriceId && priceSet.has(item.stripePriceId));
    const matchProduct = Boolean(item.stripeProductId && productSet.has(item.stripeProductId));
    if (!matchPrice && !matchProduct) continue;
    let purchasedAt: string | null = null;
    if (item.stripePriceId && byPrice.has(item.stripePriceId)) {
      purchasedAt = byPrice.get(item.stripePriceId) ?? null;
    } else if (item.stripeProductId && matchProduct) {
      purchasedAt = latestPurchaseIsoForProduct(purchases, item.stripeProductId);
    }
    if (!bySlug.has(item.slug)) {
      bySlug.set(item.slug, { ...item, purchasedAt });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.order - b.order);
}

/** Catalog rows the user owns (by Stripe price or product id). Deduped by slug, sorted by `order`. */
export function catalogPacksMatchingCapabilities(
  catalog: TileSetCatalogItem[],
  caps: GridSmithCapabilities,
): TileSetCatalogItem[] {
  return catalogOwnedPacksWithPurchases(catalog, caps).map(({ purchasedAt: _p, ...item }) => item);
}

/** Stripe price ids returned by capabilities that do not match any catalog row (e.g. retired products). */
export function ownedPriceIdsWithoutCatalogRow(
  catalog: TileSetCatalogItem[],
  ownedPriceIds: readonly string[],
): string[] {
  const catalogPrices = new Set(
    catalog.map((c) => c.stripePriceId).filter((id): id is string => Boolean(id?.trim())),
  );
  return ownedPriceIds.filter((id) => !catalogPrices.has(id));
}
