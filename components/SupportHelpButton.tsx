'use client';
import { MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import Link, { usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { supportCopy } from '@/lib/support-copy';
import { SupportUnreadBadge } from './SupportNotifications';

export default function SupportHelpButton() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  if (pathname === '/aide' || /^\/(admin|super-admin)(\/|$)/.test(pathname)) return null;
  return <Link href="/aide" aria-label={supportCopy[locale].help} className="fixed bottom-5 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-white bg-orange-600 px-5 py-3 font-bold shadow-xl transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 sm:bottom-6 sm:right-6" style={{ color: '#ffffff' }}>
    <MessageCircle size={22} aria-hidden="true" />
    <span>{locale === 'de' ? 'Hilfe' : locale === 'fr' ? 'Aide' : 'Help'}</span>
    <SupportUnreadBadge />
  </Link>;
}
