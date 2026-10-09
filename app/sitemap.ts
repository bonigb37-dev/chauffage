import type { MetadataRoute } from 'next';
import { getServerCatalog } from '@/lib/server-catalog';
import { productPathSegment } from '@/lib/products';
import { productCategories } from '@/lib/product-categories';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getServerCatalog();
  const pages = ['', '/produits', '/guide-pellets', '/services', '/faq', '/a-propos', '/contact', '/devis', '/avis-juridique', '/agb', '/datenschutz', '/retractation'];
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}` })),
    ...productCategories.map((category) => ({ url: `${siteUrl}/produits/categorie/${category.slug}` })),
    ...products.map((product) => ({ url: `${siteUrl}/produits/${productPathSegment(product)}` })),
  ];
}
