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
  const featuredIds = [9206, 9208, 9210, 2, 51, 10];
  const featured = featuredIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return localizeNode((
    <section data-analytics-section="products" className="container py-20">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-bold uppercase tracking-[.2em] text-[#a33d1e]">Notre sélection</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black text-[#a33d1e] sm:text-5xl">Notre sélection de bois de chauffage, granulés et briquettes</h2>
        </div>
        <Link href="/produits#catalogue" className="font-bold text-[#a33d1e] hover:text-[#883015]">Voir toute la boutique →</Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  ), brenLocale);
}
