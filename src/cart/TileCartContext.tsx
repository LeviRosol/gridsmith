import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredTileCart,
  readStoredTileCart,
  TILE_CART_STORAGE_KEY,
  type TileCartLine,
  writeStoredTileCart,
} from './tileCartStorage';

type TileCartContextValue = {
  items: TileCartLine[];
  itemCount: number;
  drawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  /** One unit per price; replaces existing line for the same priceId. */
  addOrUpdateLine: (line: TileCartLine) => void;
  removeLine: (priceId: string) => void;
  clearCart: () => void;
};

const TileCartContext = createContext<TileCartContextValue | null>(null);

export function TileCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TileCartLine[]>(() =>
    typeof window === 'undefined' ? [] : readStoredTileCart(),
  );
  const [drawerVisible, setDrawerVisible] = useState(false);

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

  const addOrUpdateLine = useCallback((line: TileCartLine) => {
    setItems((prev) => {
      const rest = prev.filter((p) => p.priceId !== line.priceId);
      return [...rest, line];
    });
  }, []);

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
    }),
    [items, drawerVisible, addOrUpdateLine, removeLine, clearCart],
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
