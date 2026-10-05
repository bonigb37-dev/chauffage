import Link from 'next/link';
import { products } from '@/lib/products';
import ProductCard from './ProductCard';

const featured = products.filter((product) => [2, 51, 52].includes(product.id));

export default function Products() {
  return (
    <section className="container py-24">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-bold uppercase tracking-[.2em] text-orange-500">Notre sélection</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black sm:text-5xl">Des combustibles pour accompagner votre confort.</h2>
        </div>
        <Link href="/produits#catalogue" className="font-bold text-orange-600">Voir toute la boutique →</Link>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}
