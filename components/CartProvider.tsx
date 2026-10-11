'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products as initialProducts, type Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { mergeCatalog } from '@/lib/catalog';
import { emitAnalytics } from '@/lib/analytics';

type CartLine = { productId: number; quantity: number };
type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  ready: boolean;
  addItem: (productId: number, quantityToAdd?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  products: Product[];
  bankDetails: string;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = 'thermopro-cart-v1';

export function CartProvider({ children, initialCatalog = initialProducts }: { children: React.ReactNode; initialCatalog?: Product[] }) {
  const brenLocale = useLocale() as Locale;

  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialCatalog);
  const [bankDetails, setBankDetails] = useState('');
  const [catalogReady, setCatalogReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void Promise.all([
      supabase.from('product_overrides').select('product_id, data, is_deleted'),
      supabase.from('site_settings').select('value').eq('key', 'bank_transfer').maybeSingle(),
    ]).then(([productResult, settingsResult]) => {
      if (!active) return;
      if (!productResult.error && productResult.data) {
        setProducts(mergeCatalog(productResult.data));
      }
      if (!settingsResult.error && settingsResult.data?.value && typeof settingsResult.data.value === 'object') {
        setBankDetails(String((settingsResult.data.value as { details?: unknown }).details ?? ''));
      }
      setCatalogReady(true);
    }).catch(() => setCatalogReady(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch { /* Some mobile browsers block local storage. */ }
    if (raw === null) {
      try { raw = window.sessionStorage.getItem(storageKey); } catch { /* Keep the in-memory cart. */ }
    }
    try {
      const stored: unknown = JSON.parse(raw ?? '[]');
      if (Array.isArray(stored)) {
        setItems(stored.flatMap((line): CartLine[] => {
          if (!Number.isInteger(line?.productId) || line.productId < 1 || !Number.isInteger(line?.quantity) || line.quantity < 1) return [];
          return [{ productId: line.productId, quantity: line.quantity }];
        }));
      }
    } catch { /* Ignore malformed saved carts without accessing blocked storage. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!catalogReady || !ready) return;
    // Reconcile the current cart, rather than restoring an older saved cart
    // over products added while the catalogue was loading.
    setItems((current) => current.flatMap((line): CartLine[] => {
      const product = products.find((item) => item.id === line.productId);
      if (!product || product.stock === 0) return [];
      const quantity = product.stock !== undefined ? Math.min(line.quantity, product.stock) : line.quantity;
      return quantity > 0 ? [{ productId: product.id, quantity }] : [];
    }));
  }, [products, catalogReady, ready]);

  useEffect(() => {
    if (ready) {
      const saved = JSON.stringify(items);
      try { window.localStorage.setItem(storageKey, saved); } catch { /* Use session storage or memory. */ }
      try { window.sessionStorage.setItem(storageKey, saved); } catch { /* Keep the in-memory cart available for this visit. */ }
    }
  }, [items, ready]);

  const addItem = useCallback((productId: number, quantityToAdd: number = 1) => {
    if (products.some(product => product.id === productId && product.stock !== 0)) emitAnalytics('cart_add', `product-${productId}`);
    setItems((current) => {
      const existing = current.find((line) => line.productId === productId);
      const stock = products.find((product) => product.id === productId)?.stock;
      const addCount = Math.max(1, quantityToAdd);
      if (existing) {
        const newQty = existing.quantity + addCount;
        const finalQty = stock !== undefined ? Math.min(newQty, stock) : newQty;
        return current.map((line) => line.productId === productId ? { ...line, quantity: finalQty } : line);
      }
      const finalQty = stock !== undefined ? Math.min(addCount, stock) : addCount;
      return [...current, { productId, quantity: finalQty }];
    });
  }, [products]);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    const stock = products.find((product) => product.id === productId)?.stock;
    const nextQuantity = stock !== undefined ? Math.min(quantity, stock) : quantity;
    setItems((current) => quantity < 1 || nextQuantity < 1
      ? current.filter((line) => line.productId !== productId)
      : current.map((line) => line.productId === productId ? { ...line, quantity: nextQuantity } : line));
  }, [products]);

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
    ready: ready && catalogReady,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    products,
    bankDetails,
  }), [items, ready, catalogReady, addItem, setQuantity, removeItem, clearCart, products, bankDetails]);

  return localizeNode(<CartContext.Provider value={value}>{children}</CartContext.Provider>, brenLocale);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart doit être utilisé à l’intérieur de CartProvider.');
  return context;
}
