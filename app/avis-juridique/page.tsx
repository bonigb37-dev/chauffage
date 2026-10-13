import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Avis juridique — Bren-nholz", "Informations de Bren-nholz — Leylines Park : responsable Leslynes Moser, siège en Allemagne, TVA et coordonnées de contact.", "/avis-juridique"))); }

import LegalNotice from '@/components/LegalNotice';

export default function LegalNoticePage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<main><LegalNotice /></main>, brenLocale);
}
