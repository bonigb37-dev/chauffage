'use client';
import { useLocale } from 'next-intl';
import { locales, localizedPath } from '@/i18n/routing';

export default function LanguageSelector() {
  const active = useLocale();
  return <nav aria-label="Language / Sprache / Langue" className="flex shrink-0 items-center gap-1 text-xs font-bold">
    {locales.map(locale => <button key={locale} type="button" lang={locale} aria-pressed={active === locale}
      className={`rounded-md px-2 py-1 transition ${active === locale ? 'bg-white text-orange-700' : 'text-white hover:bg-white/15'}`}
      onClick={() => {
        document.cookie = `bren_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        location.assign(localizedPath(location.pathname, locale) + location.search + location.hash);
      }}>{locale.toUpperCase()}</button>)}
  </nav>;
}
