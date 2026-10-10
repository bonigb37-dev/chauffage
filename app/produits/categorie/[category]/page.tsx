
import { localizeNode, translate } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import ProductsPageContent from '@/components/ProductsPageContent';
import { productCategories } from '@/lib/product-categories';
import { publicMetadata } from '@/lib/seo';
type Props = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: Props) {
  const { category: slug } = await params;
  const category = productCategories.find((item) => item.slug === slug);
  if (!category) return { title: 'Catégorie introuvable — Bren-nholz', robots: { index: false } };
  const locale = await getLocale() as Locale;
  return publicMetadata(`${translate(category.title, locale)} ${translate('avec livraison en Allemagne | Bren-nholz', locale)}`, category.description, `/produits/categorie/${slug}`);
}
export default async function CategoryPage({ params }: Props) {
  const brenLocale = await getLocale() as Locale;

  const { category } = await params;
  if (!productCategories.some((item) => item.slug === category)) notFound();
  return localizeNode(<ProductsPageContent categorySlug={category} />, brenLocale);
}
