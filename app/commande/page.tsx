import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
export async function generateMetadata() { return localizeMetadata(await ({ title: "Passer commande — Bren-nholz", robots: { index: false, follow: true } })); }

import CheckoutPageContent from '@/components/CheckoutPageContent';

export default function CheckoutPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<CheckoutPageContent />, brenLocale);
}
