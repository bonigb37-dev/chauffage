
import { translate, localizeNode } from '@/i18n/copy';
import { localizedPath, type Locale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/i18n/navigation';
import { headers } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';

import { Check, CheckCircle2, MapPin, Star } from 'lucide-react';
import ProductDetailAddButton from '@/components/ProductDetailAddButton';
import { productPathSegment } from '@/lib/products';
import { getAverageRating, getReviewsForProduct } from '@/lib/reviews';

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

  const reviews = getReviewsForProduct(product.id);
  const { average, count } = getAverageRating(product.id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: translate(product.name, brenLocale),
    description: translate(product.description, brenLocale),
    image: (product.gallery?.length ? product.gallery : [product.image]).map((image) => new URL(image, siteUrl).href),
    url: `${siteUrl}${localizedPath(`/produits/${canonicalSlug}`, brenLocale)}`,
    sku: product.articleNumber,
    aggregateRating: count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: average,
      reviewCount: count,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    review: reviews.map((r) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: r.author,
      },
      reviewBody: r.comment,
    })),
    offers: product.priceAmount !== undefined ? {
      '@type': 'Offer',
      url: `${siteUrl}${localizedPath(`/produits/${canonicalSlug}`, brenLocale)}`,
      itemCondition: 'https://schema.org/NewCondition',
      priceCurrency: 'EUR',
      price: (product.priceAmount / 100).toFixed(2),
      availability: product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    } : undefined,
  };

  return localizeNode((
    <main className="min-h-[65vh] bg-[#faf9f6] py-8 sm:py-12">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="container">
        <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-gray-500">
          <Link href="/produits" className="hover:text-orange-700">Produits</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <article className="grid gap-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-stone-100 sm:min-h-[480px]">
            <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-4" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-widest text-orange-700">{product.type}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">{product.name}</h1>

            {/* Rating Stars Summary Header */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                  />
                ))}
              </div>
              <span className="font-black text-gray-950 text-sm">{average.toFixed(1)} / 5</span>
              <a href="#avis-clients" className="text-sm font-semibold text-orange-600 hover:underline">
                ({count} {count === 1 ? 'Kundenbewertung' : 'Kundenbewertungen'})
              </a>
            </div>

            {product.articleNumber && <p className="mt-2 text-sm text-gray-500">N° d’article : {product.articleNumber}</p>}
            <p className="mt-5 leading-7 text-gray-700">{product.description}</p>

            <dl className="mt-6 grid gap-3 border-y border-stone-200 py-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-gray-500">Conditionnement</dt><dd className="mt-1 font-semibold">{product.quantity}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-gray-500">Disponibilité</dt><dd className={`mt-1 flex items-center gap-2 ${product.stock === 0 ? 'text-red-700' : 'text-green-600'}`}>{product.stock !== 0 && <Check size={24} strokeWidth={3} aria-hidden="true" />}{product.stock === 0 ? 'Rupture de stock' : 'En stock'}</dd></div>
            </dl>
            <p className="mt-6 text-3xl font-black text-gray-950">{product.price}</p>
            <DeliveryInformation />
            <div className="mt-6 flex flex-wrap gap-3"><ProductDetailAddButton product={product} /><Link href="/devis" className="inline-flex items-center rounded-full border border-stone-300 px-6 py-3 font-bold text-gray-800 hover:border-orange-500 hover:text-orange-700">Demander un devis</Link></div>
          </div>
        </article>

        {/* Customer Reviews Section */}
        <section id="avis-clients" className="mt-12 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 border-b border-stone-200 pb-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Retours d’expérience</p>
              <h2 className="mt-1 text-2xl font-black text-gray-950 sm:text-3xl">Avis vérifiés de nos clients</h2>
              <p className="mt-1 text-sm text-gray-500">Tous les avis sont rédigés par des acheteurs ayant commandé ce produit.</p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 p-4">
              <div className="text-center">
                <span className="text-4xl font-black text-gray-950">{average.toFixed(1)}</span>
                <span className="text-sm text-gray-500"> / 5</span>
              </div>
              <div className="border-l border-amber-200 pl-4">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold text-gray-700">
                  Basé sur {count} {count === 1 ? 'Kundenbewertung' : 'Kundenbewertungen'}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="mt-8 space-y-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-stone-100 bg-stone-50/60 p-5 transition hover:bg-stone-50">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 font-bold text-orange-800 text-sm">
                      {rev.author.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-950 text-sm sm:text-base">{rev.author}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Achat vérifié
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin size={12} className="text-gray-400" /> {rev.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          className={star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-gray-400">{rev.date}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 data-original-content className="font-bold text-gray-900 text-sm sm:text-base">{rev.title}</h3>
                  <p data-original-content className="mt-1 text-sm leading-relaxed text-gray-700">{rev.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  ), brenLocale);
}
