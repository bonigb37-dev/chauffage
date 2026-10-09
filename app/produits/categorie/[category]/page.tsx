import { notFound } from 'next/navigation';
import ProductsPageContent from '@/components/ProductsPageContent';
import { productCategories } from '@/lib/product-categories';
import { publicMetadata } from '@/lib/seo';
type Props = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: Props) {
  const { category: slug } = await params;
  const category = productCategories.find((item) => item.slug === slug);
  if (!category) return { title: 'Catégorie introuvable — Bren-nholz', robots: { index: false } };
  return publicMetadata(`${category.title} avec livraison en Allemagne | Bren-nholz`, category.description, `/produits/categorie/${slug}`);
}
export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!productCategories.some((item) => item.slug === category)) notFound();
  return <ProductsPageContent categorySlug={category} />;
}
