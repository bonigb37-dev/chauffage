import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
export async function generateMetadata() { return localizeMetadata(await ({ title: "Mon panier — Bren-nholz", robots: { index: false, follow: true } })); }

import CartPageContent from '@/components/CartPageContent';

export default function CartPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<CartPageContent />, brenLocale);
}
