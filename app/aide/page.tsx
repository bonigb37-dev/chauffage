import { getLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { publicMetadata } from '@/lib/seo';
import { supportCopy } from '@/lib/support-copy';
import SupportMessenger from '@/components/SupportMessenger';
export async function generateMetadata() {
  const copy = supportCopy[await getLocale() as Locale];
  return { ...await publicMetadata(`${copy.title} | Bren-nholz`, copy.intro, '/aide'), robots: { index: false, follow: true } };
}
export default async function HelpPage() {
  const copy = supportCopy[await getLocale() as Locale];
  return <main className="container max-w-4xl py-12 sm:py-16"><h1 className="text-3xl font-black sm:text-4xl">{copy.title}</h1><p className="mt-4 leading-7 text-gray-600">{copy.intro}</p><SupportMessenger /></main>;
}
