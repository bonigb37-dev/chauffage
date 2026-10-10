import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Choisir et stocker ses granulés de bois | Bren-nholz", "Comprenez les certifications indiquées sur les granulés, comparez les sacs et palettes et obtenez une estimation indicative de vos besoins.", "/guide-pellets"))); }

import PelletGuide from '@/components/PelletGuide';

export default function GuidePelletsPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <main>
      <PelletGuide />
    </main>
  ), brenLocale);
}
