import { vatLabel } from '@/lib/vat';

import { translate, localizeNode } from '@/i18n/copy';
import { localizedPath, type Locale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/i18n/navigation';
import { headers } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';

import { Check } from 'lucide-react';
import ProductDetailAddButton from '@/components/ProductDetailAddButton';
import { productPathSegment } from '@/lib/products';

import { getServerCatalog } from '@/lib/server-catalog';
import DeliveryInformation from '@/components/DeliveryInformation';
import { publicMetadata, siteUrl } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

async function findProduct(slug: string) {
  const id = Number(slug.split('-', 1)[0]);
  return Number.isInteger(id) ? (await getServerCatalog()).find((item) => item.id === id) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: 'Produit introuvable — Bren-nholz' };
  const locale = await getLocale() as Locale;
  return publicMetadata(`${translate(product.name, locale)} — Bren-nholz`, `${translate(product.description, locale)} ${translate('Conditionnement :', locale)} ${translate(product.quantity, locale)}.`, `/produits/${productPathSegment(product)}`);
}

export default async function ProductDetailPage({ params }: Props) {
  const brenLocale = await getLocale() as Locale;

  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();
  const canonicalSlug = productPathSegment(product);
  if (slug !== canonicalSlug) permanentRedirect(localizedPath(`/produits/${canonicalSlug}`, brenLocale));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: translate(product.name, brenLocale),
    description: translate(product.description, brenLocale),
    image: (product.gallery?.length ? product.gallery : (product.image ? [product.image] : [])).map((image) => new URL(image, siteUrl).href),
    url: `${siteUrl}${localizedPath(`/produits/${canonicalSlug}`, brenLocale)}`,
    sku: product.articleNumber,
    offers: product.priceAmount !== undefined ? {
      '@type': 'Offer',
      url: `${siteUrl}${localizedPath(`/produits/${canonicalSlug}`, brenLocale)}`,
      itemCondition: 'https://schema.org/NewCondition',
      priceCurrency: 'EUR',
      price: (product.priceAmount / 100).toFixed(2),
      priceSpecification: {'@type':'UnitPriceSpecification', price:(product.priceAmount/100).toFixed(2),priceCurrency:'EUR',valueAddedTaxIncluded:true},
      shippingDetails: {'@type':'OfferShippingDetails',shippingRate:{'@type':'MonetaryAmount',value:'0.00',currency:'EUR'},shippingDestination:{'@type':'DefinedRegion',addressCountry:'DE'}},
      availability: product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    } : undefined,
  };

  return localizeNode((
    <main className="min-h-[65vh] bg-[#FDFBF7] py-8 sm:py-12 text-[#1C1917]">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="container">
        <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-[#6B5E55]">
          <Link href="/produits" className="hover:text-[#A33D1E]">Produits</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-[#A33D1E] font-bold">{product.name}</span>
        </nav>

        <article className="grid gap-8 rounded-3xl border border-[#E6DCce] bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-[#FAF6F0] sm:min-h-[480px]">
            <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-4" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#009705]">{product.type}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[#1C1917] sm:text-4xl">{product.name}</h1>

            {product.articleNumber && <p className="mt-2 text-sm text-[#6B5E55]">N° d’article : {product.articleNumber}</p>}
            <p className="mt-5 leading-7 text-[#1C1917]">{product.description}</p>

            <dl className="mt-6 grid gap-3 border-y border-[#E6DCce] py-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-[#6B5E55]">Conditionnement</dt><dd className="mt-1 font-semibold text-[#009705]">{product.quantity}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-[#6B5E55]">Disponibilité</dt><dd className={`mt-1 flex items-center gap-2 ${product.stock === 0 ? 'text-red-700' : 'text-[#009705] font-bold'}`}>{product.stock !== 0 && <Check size={24} strokeWidth={3} aria-hidden="true" />}{product.stock === 0 ? 'Rupture de stock' : 'En stock'}</dd></div>
            </dl>
            <p className="mt-6 text-3xl font-black text-[#009705]">{product.price}</p><p data-original-content className="mt-1 text-xs text-[#6B5E55]">{vatLabel(product,brenLocale)}</p>
            <DeliveryInformation />
            <div className="mt-6 flex flex-wrap gap-3"><ProductDetailAddButton product={product} /></div>
          </div>
        </article>
      </div>
    </main>
  ), brenLocale);
}
