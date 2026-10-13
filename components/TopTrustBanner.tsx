'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Truck } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
export default function TopTrustBanner() {
 const locale = useLocale() as Locale;
 return localizeNode(<aside aria-label="Livraison" className="border-b border-orange-700/60 bg-orange-600 px-3 py-2 text-xs font-semibold text-white sm:text-sm"><div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><Truck size={18} aria-hidden="true" />Livraison en Allemagne · Frais calculés selon la distance</span><LanguageSelector /></div></aside>, locale);
}
