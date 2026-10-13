import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import ProductsPageContent from '@/components/ProductsPageContent';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata('Bois de chauffage, granulés et briquettes | Bren-nholz', 'Comparez les bûches, granulés de bois, briquettes et allume-feux par format et conditionnement. Livraison en Allemagne sans supplément.', '/produits'))); }

export default function ProductsPage() {
  const brenLocale = useLocale() as Locale;
 return localizeNode(<ProductsPageContent />, brenLocale); }
