import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchGridSmithCapabilities } from '../billing/gridSmithBilling';
import {
  clearStoredTileCart,
  readStoredTileCart,
  TILE_CART_STORAGE_KEY,
  type TileCartLine,
  writeStoredTileCart,
} from './tileCartStorage';
import { isCatalogItemOwnedWithSets } from './tileCartEligibility';
import type { TileSetCatalogItem } from '../data/placeholderTileSets';
import { tilePackCatalogApiConfigured } from '../data/tilePackCatalog';
import { useAuth } from '../components/AuthContext';

type TileCartContextValue = {
  items: TileCartLine[];
  itemCount: number;
  drawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  /** One unit per price; replaces existing line for the same priceId. No-op if user already owns that price. */
  addOrUpdateLine: (line: TileCartLine) => void;
  removeLine: (priceId: string) => void;
  clearCart: () => void;
  /** True when signed in, API configured, capabilities loaded, and this pack is in owned price/product ids. */
  isPackOwned: (set: TileSetCatalogItem) => boolean;
};

const TileCartContext = createContext<TileCartContextValue | null>(null);

export function TileCartProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const signedIn = auth.isSignedIn && !auth.loading;
  const shopApiConfigured = tilePackCatalogApiConfigured();

  const [items, setItems] = useState<TileCartLine[]>(() =>
    typeof window === 'undefined' ? [] : readStoredTileCart(),
  );
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [ownedPriceIds, setOwnedPriceIds] = useState<string[]>([]);
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([]);
  const [ownershipLoaded, setOwnershipLoaded] = useState(false);

  const ownedPriceSet = useMemo(() => new Set(ownedPriceIds), [ownedPriceIds]);
  const ownedProductSet = useMemo(() => new Set(ownedProductIds), [ownedProductIds]);

  useEffect(() => {
    writeStoredTileCart(items);
  }, [items]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TILE_CART_STORAGE_KEY) return;
      setItems(readStoredTileCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!shopApiConfigured || !signedIn) {
      setOwnedPriceIds([]);
      setOwnedProductIds([]);
      setOwnershipLoaded(true);
      return undefined;
    }
    let cancelled = false;
    setOwnershipLoaded(false);
    void fetchGridSmithCapabilities()
      .then((caps) => {
        if (cancelled) return;
        setOwnedPriceIds(Array.isArray(caps.ownedPriceIds) ? caps.ownedPriceIds : []);
        setOwnedProductIds(Array.isArray(caps.ownedProductIds) ? caps.ownedProductIds : []);
      })
      .catch(() => {
        if (!cancelled) {
          setOwnedPriceIds([]);
          setOwnedProductIds([]);
        }
      })
      .finally(() => {
        if (!cancelled) setOwnershipLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, shopApiConfigured]);

  useEffect(() => {
    if (!ownershipLoaded || ownedPriceSet.size === 0) return;
    setItems((prev) => {
      const next = prev.filter((row) => !ownedPriceSet.has(row.priceId));
      return next.length === prev.length ? prev : next;
    });
  }, [ownershipLoaded, ownedPriceSet]);

  const isPackOwned = useCallback(
    (set: TileSetCatalogItem) => {
      if (!shopApiConfigured || !signedIn || !ownershipLoaded) return false;
      return isCatalogItemOwnedWithSets(set, ownedPriceSet, ownedProductSet);
    },
    [shopApiConfigured, signedIn, ownershipLoaded, ownedPriceSet, ownedProductSet],
  );

  const addOrUpdateLine = useCallback(
    (line: TileCartLine) => {
      const pid = line.priceId?.trim();
      if (!pid || ownedPriceSet.has(pid)) return;
      setItems((prev) => {
        const rest = prev.filter((p) => p.priceId !== line.priceId);
        return [...rest, line];
      });
    },
    [ownedPriceSet],
  );

  const removeLine = useCallback((priceId: string) => {
    setItems((prev) => prev.filter((p) => p.priceId !== priceId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    clearStoredTileCart();
  }, []);

  const value = useMemo<TileCartContextValue>(
    () => ({
      items,
      itemCount: items.length,
      drawerVisible,
      openDrawer: () => setDrawerVisible(true),
      closeDrawer: () => setDrawerVisible(false),
      toggleDrawer: () => setDrawerVisible((v) => !v),
      addOrUpdateLine,
      removeLine,
      clearCart,
      isPackOwned,
    }),
    [items, drawerVisible, addOrUpdateLine, removeLine, clearCart, isPackOwned],
  );

  return <TileCartContext.Provider value={value}>{children}</TileCartContext.Provider>;
}

export function useTileCart(): TileCartContextValue {
  const ctx = useContext(TileCartContext);
  if (!ctx) {
    throw new Error('useTileCart must be used within TileCartProvider');
  }
  return ctx;
}
