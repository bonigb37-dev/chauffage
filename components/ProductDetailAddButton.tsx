'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import type { Product } from '@/lib/products';

export default function ProductDetailAddButton({ product }: { product: Product }) {
  const brenLocale = useLocale() as Locale;

  const { addItem, products } = useCart();
  const currentProduct = products.find((item) => item.id === product.id) ?? product;
  const [added, setAdded] = useState(false);

  if (currentProduct.stock === 0 || currentProduct.priceAmount === undefined) {
    return localizeNode(<button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-stone-200 px-6 py-3 font-bold text-stone-600">Rupture de stock</button>, brenLocale);
  }

  const handleClick = () => {
    addItem(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return localizeNode((
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full bg-[#009705] px-6 py-3 font-bold text-white transition hover:bg-[#008204] shadow-md"
    >
      {added ? (
        <>
          <Check size={18} />
          <span>Ajouté au panier !</span>
        </>
      ) : (
        <>
          <ShoppingCart size={18} />
          <span>Ajouter au panier</span>
        </>
      )}
    </button>
  ), brenLocale);
}
