import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { siteIdentity } from '@/lib/site-identity';
import { storeConfig } from '@/lib/store-config';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return publicMetadata(
    `${storeConfig.name} | Brennholz, Holzpellets & Holzbriketts`,
    'Brennholz-direk: Brennholz, Holzpellets, Holzbriketts und Anzündholz online bestellen. Lieferung innerhalb Deutschlands ohne zusätzliche Versandkosten.',
    '/',
  );
}

import Hero from '@/components/Hero'; import ProductCategories from '@/components/ProductCategories'; import Products from '@/components/Products'; import Services from '@/components/Services'; import ContactCTA from '@/components/ContactCTA'; import LogisticsGallery from '@/components/LogisticsGallery';
export default async function Home(){
  const brenLocale = await getLocale() as Locale;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return localizeNode(
    <main>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentity()).replace(/</g, '\\u003c') }} />
      <Hero />
      <ProductCategories />
      <Products />
      <LogisticsGallery />
      <Services />
      <ContactCTA />
    </main>,
    brenLocale
  );
}
