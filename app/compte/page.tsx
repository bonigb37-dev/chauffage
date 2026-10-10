import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import AccountPageContent from '@/components/AccountPageContent';

export async function generateMetadata() { return localizeMetadata(await ({
  title: 'Mon compte — Bren-nholz',
  robots: { index: false, follow: true },
  description: 'Créez votre compte client Bren-nholz ou connectez-vous.',
})); }

export default function AccountPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<AccountPageContent />, brenLocale);
}
