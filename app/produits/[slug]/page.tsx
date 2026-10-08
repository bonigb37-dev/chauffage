import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailAddButton from '@/components/ProductDetailAddButton';
import { productPathSegment, products } from '@/lib/products';

type Props = { params: Promise<{ slug: string }> };

function findProduct(slug: string) {
  const id = Number(slug.split('-', 1)[0]);
  return Number.isInteger(id) ? products.find((item) => item.id === id) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return { title: 'Produit introuvable — Bren-nholz' };
  return { title: `${product.name} — Bren-nholz`, description: product.description };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const canonicalSlug = productPathSegment(product);
  if (slug !== canonicalSlug) permanentRedirect(`/produits/${canonicalSlug}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.gallery?.length ? product.gallery : [product.image],
    sku: product.articleNumber,
    offers: product.priceAmount !== undefined && product.stock !== undefined ? {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: (product.priceAmount / 100).toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    } : undefined,
  };

  return <main className="min-h-[65vh] bg-[#faf9f6] py-8 sm:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <div className="container">
      <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-gray-500"><Link href="/produits" className="hover:text-orange-700">Produits</Link><span aria-hidden="true"> / </span><span className="text-gray-900">{product.name}</span></nav>
      <article className="grid gap-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-stone-100 sm:min-h-[480px]">
          <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-4" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-700">{product.type}</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">{product.name}</h1>
          {product.articleNumber && <p className="mt-3 text-sm text-gray-500">N° d’article : {product.articleNumber}</p>}
          <p className="mt-5 leading-7 text-gray-700">{product.description}</p>
          <dl className="mt-6 grid gap-3 border-y border-stone-200 py-5 sm:grid-cols-2">
            <div><dt className="text-xs font-bold uppercase tracking-wide text-gray-500">Conditionnement</dt><dd className="mt-1 font-semibold">{product.quantity}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-gray-500">Disponibilité</dt><dd className="mt-1 font-semibold">{product.stock === undefined ? 'À confirmer avant commande' : product.stock === 0 ? 'Rupture de stock' : `${product.stock} en stock`}</dd></div>
          </dl>
          <p className="mt-6 text-3xl font-black text-gray-950">{product.price}</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">Livraison incluse dans le prix du produit en Allemagne. Aucun frais supplémentaire à régler au transporteur.</p>
          <div className="mt-6 flex flex-wrap gap-3"><ProductDetailAddButton product={product} /><Link href="/devis" className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 font-bold text-gray-800 hover:border-orange-500 hover:text-orange-700">Demander un devis</Link></div>
        </div>
      </article>
    </div>
  </main>;
}
