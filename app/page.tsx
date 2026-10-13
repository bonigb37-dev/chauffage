import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Bois de chauffage et granulés en Allemagne | Bren-nholz", "Découvrez nos bûches, granulés de bois, briquettes et allume-feux. Comparez les conditionnements et commandez avec frais de livraison calculés selon votre adresse.", "/"))); }

import Hero from '@/components/Hero'; import ProductCategories from '@/components/ProductCategories'; import Products from '@/components/Products'; import Services from '@/components/Services'; import ContactCTA from '@/components/ContactCTA'; import LogisticsGallery from '@/components/LogisticsGallery';
export default function Home(){
  const brenLocale = useLocale() as Locale;
return localizeNode(<><main><Hero/><ProductCategories/><Products/><LogisticsGallery/><Services/><ContactCTA/></main></>, brenLocale)}
