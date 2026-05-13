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
