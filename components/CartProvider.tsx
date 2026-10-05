'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products } from '@/lib/products';

type CartLine = { productId: number; quantity: number };
type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  ready: boolean;
  addItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = 'thermopro-cart-v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(stored)) {
        setItems(stored.flatMap((line): CartLine[] => {
          const product = products.find((item) => item.id === line?.productId);
          if (!product || !Number.isInteger(line?.quantity) || line.quantity < 1) return [];
          return [{ productId: product.id, quantity: product.stock ? Math.min(line.quantity, product.stock) : line.quantity }];
        }));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(items)); } catch { /* Keep the in-memory cart available for this visit. */ }
    }
  }, [items, ready]);

  const addItem = useCallback((productId: number) => {
    setItems((current) => {
      const existing = current.find((line) => line.productId === productId);
      const stock = products.find((product) => product.id === productId)?.stock;
      if (existing && stock && existing.quantity >= stock) return current;
      return existing
        ? current.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { productId, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    const stock = products.find((product) => product.id === productId)?.stock;
    const nextQuantity = stock ? Math.min(quantity, stock) : quantity;
    setItems((current) => quantity < 1
      ? current.filter((line) => line.productId !== productId)
      : current.map((line) => line.productId === productId ? { ...line, quantity: nextQuantity } : line));
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
    ready,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  }), [items, ready, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart doit être utilisé à l’intérieur de CartProvider.');
  return context;
}
