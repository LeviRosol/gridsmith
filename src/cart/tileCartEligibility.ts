import type { TileSetCatalogItem } from '../data/placeholderTileSets';
import type { TileCartLine } from './tileCartStorage';

export function isTileSetBuyable(set: TileSetCatalogItem): boolean {
  const id = set.stripePriceId?.trim();
  return Boolean(id && !set.disabled && !set.addToCartDisabled);
}

export function cartHasPriceId(items: readonly TileCartLine[], priceId: string | undefined): boolean {
  const id = priceId?.trim();
  if (!id) return false;
  return items.some((row) => row.priceId === id);
}

/** True if Stripe capabilities lists this catalog row's price or product as owned. */
export function isCatalogItemOwnedWithSets(
  set: TileSetCatalogItem,
  ownedPrices: ReadonlySet<string>,
  ownedProducts: ReadonlySet<string>,
): boolean {
  const priceId = set.stripePriceId?.trim();
  if (priceId && ownedPrices.has(priceId)) return true;
  const productId = set.stripeProductId?.trim();
  if (productId && ownedProducts.has(productId)) return true;
  return false;
}
