import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import AccountPageContent from '@/components/AccountPageContent';

export async function generateMetadata() { return localizeMetadata(await ({
  title: 'Mon compte — Bren-nholz',
  robots: { index: false, follow: true },
  description: 'Créez votre compte client Bren-nholz ou connectez-vous.',
})); }

export default async function AccountPage({ searchParams }: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const brenLocale = await getLocale() as Locale;
  const { mode } = await searchParams;
  const initialMode = mode === 'signup' ? 'signup' : mode === 'forgot' ? 'forgot' : mode === 'recovery' ? 'update' : 'signin';

  return localizeNode(<AccountPageContent initialMode={initialMode} />, brenLocale);
}
