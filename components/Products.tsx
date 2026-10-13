'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import Link from '@/i18n/navigation';
import { useCart } from '@/components/CartProvider';
import ProductCard from './ProductCard';

export default function Products() {
  const brenLocale = useLocale() as Locale;

  const { products } = useCart();
  const featured = products.filter((product) => [2, 51, 52].includes(product.id));
  return localizeNode((
    <section data-analytics-section="products" className="container py-20">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-bold uppercase tracking-[.2em] text-[#A54829]">Notre sélection</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black text-[#123524] sm:text-5xl">Notre sélection de granulés et de briquettes de bois</h2>
        </div>
        <Link href="/produits#catalogue" className="font-bold text-[#A54829] hover:text-[#8c3b20]">Voir toute la boutique →</Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  ), brenLocale);
}
