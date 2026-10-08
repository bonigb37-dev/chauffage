'use client';

import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import type { Product } from '@/lib/products';

export default function ProductDetailAddButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-stone-200 px-6 py-3 font-bold text-stone-600">Rupture de stock</button>;
  }

  return <button type="button" onClick={() => { addItem(product.id, 1); setAdded(true); }} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700">
    {added ? <Check size={18} /> : <ShoppingCart size={18} />}{added ? 'Ajouté au panier' : 'Ajouter au panier'}
  </button>;
}
