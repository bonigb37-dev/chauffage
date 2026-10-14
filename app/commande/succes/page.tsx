import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
export async function generateMetadata() { return localizeMetadata(await ({ title: "Bestellbestätigung & Rechnung — Bren-nholz", robots: { index: false, follow: true } })); }

import CheckoutSuccessContent from '@/components/CheckoutSuccessContent';

export default function CheckoutSuccessPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<CheckoutSuccessContent />, brenLocale);
}
