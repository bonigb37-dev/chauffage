import { vatLabel } from '@/lib/vat';

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
    <main className="min-h-[65vh] bg-[#F4F0E5] py-8 sm:py-12 text-[#1c1917]">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="container">
        <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-[#57534e]">
          <Link href="/produits" className="hover:text-[#A54829]">Produits</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-[#123524] font-bold">{product.name}</span>
        </nav>

        <article className="grid gap-8 rounded-3xl border border-[#E7E0D3] bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-[#FAF8F3] sm:min-h-[480px]">
            <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-4" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#A54829]">{product.type}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[#123524] sm:text-4xl">{product.name}</h1>

            {/* Rating Stars Summary Header - without count number */}
            {count > 0 && (
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
              <a href="#avis-clients" className="text-sm font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                <CheckCircle2 size={13} /> Vérifié
              </a>
            </div>
            )}

            {product.articleNumber && <p className="mt-2 text-sm text-[#57534e]">N° d’article : {product.articleNumber}</p>}
            <p className="mt-5 leading-7 text-[#1c1917]">{product.description}</p>

            <dl className="mt-6 grid gap-3 border-y border-[#E7E0D3] py-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-[#57534e]">Conditionnement</dt><dd className="mt-1 font-semibold text-[#123524]">{product.quantity}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-[#57534e]">Disponibilité</dt><dd className={`mt-1 flex items-center gap-2 ${product.stock === 0 ? 'text-red-700' : 'text-emerald-700 font-bold'}`}>{product.stock !== 0 && <Check size={24} strokeWidth={3} aria-hidden="true" />}{product.stock === 0 ? 'Rupture de stock' : 'En stock'}</dd></div>
            </dl>
            <p className="mt-6 text-3xl font-black text-[#123524]">{product.price}</p><p data-original-content className="mt-1 text-xs text-[#57534e]">{vatLabel(product,brenLocale)}</p>
            <DeliveryInformation />
            <div className="mt-6 flex flex-wrap gap-3"><ProductDetailAddButton product={product} /></div>
          </div>
        </article>

        {/* Customer Reviews Section */}
        {count > 0 && <section id="avis-clients" className="mt-12 rounded-3xl border border-[#E7E0D3] bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 border-b border-[#E7E0D3] pb-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A54829]">Retours d’expérience</p>
              <h2 className="mt-1 text-2xl font-black text-[#123524] sm:text-3xl">Avis vérifiés de nos clients</h2>
              <p className="mt-1 text-sm text-[#57534e]">Tous les avis sont rédigés par des acheteurs ayant commandé ce produit.</p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E0D3] p-4">
              <div className="text-center">
                <span className="text-4xl font-black text-[#123524]">{average.toFixed(1)}</span>
                <span className="text-sm text-[#57534e]"> / 5</span>
              </div>
              <div className="border-l border-[#E7E0D3] pl-4">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Vérifié
                </p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="mt-8 space-y-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-[#E7E0D3] bg-[#FAF8F3] p-5 transition hover:bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E0D3] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F0E5] font-bold text-[#A54829] text-sm border border-[#E7E0D3]">
                      {rev.author.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#123524] text-sm sm:text-base">{rev.author}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Vérifié
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-xs text-[#57534e] mt-0.5">
                        <MapPin size={12} className="text-[#A54829]" /> {rev.location}
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
                    <span className="text-[11px] font-medium text-[#57534e]">{rev.date}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 data-original-content className="font-bold text-[#123524] text-sm sm:text-base">{rev.title}</h3>
                  <p data-original-content className="mt-1 text-sm leading-relaxed text-[#1c1917]">{rev.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>}
      </div>
    </main>
  ), brenLocale);
}
