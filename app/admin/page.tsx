import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import AdminWorkspace from '@/components/AdminWorkspace';

export async function generateMetadata() { return localizeMetadata(await ({ robots: { index: false, follow: false } })); }

export default function AdminPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<AdminWorkspace />, brenLocale);
}
