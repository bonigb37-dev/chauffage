import { locales, localizedPath } from '@/i18n/routing';
import type { MetadataRoute } from 'next';
import { getServerCatalog } from '@/lib/server-catalog';
import { productPathSegment } from '@/lib/products';
import { productCategories } from '@/lib/product-categories';
import { siteUrl } from '@/lib/seo';
import { deliveryRegions } from '@/lib/delivery-regions';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getServerCatalog();
  const pages = ['', '/produits', '/guide-pellets', '/services', '/frais-livraison', '/faq', '/a-propos', '/contact', '/avis-juridique', '/agb', '/datenschutz', '/retractation'];
  const entries = [
    ...deliveryRegions.map(region => ({ url: `${siteUrl}/livraison/${region.slug}` })),
    ...pages.map((path) => ({ url: `${siteUrl}${path}` })),
    ...productCategories.map((category) => ({ url: `${siteUrl}/produits/categorie/${category.slug}` })),
    ...products.map((product) => ({ url: `${siteUrl}/produits/${productPathSegment(product)}` })),
  ];
  return entries.flatMap(entry => locales.map(locale => {
    const path = new URL(entry.url).pathname;
    return { url: siteUrl + localizedPath(path, locale), alternates: { languages: Object.fromEntries(locales.map(language => [language, siteUrl + localizedPath(path, language)])) } };
  }));
}
