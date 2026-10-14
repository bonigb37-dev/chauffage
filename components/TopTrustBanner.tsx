'use client';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Truck } from 'lucide-react';

export default function TopTrustBanner() {
  const locale = useLocale() as Locale;

  return localizeNode(
    <aside
      aria-label="Livraison"
      className="border-b border-[#883015] bg-[#a33d1e] px-3 py-2 text-xs font-semibold text-white shadow-inner select-none sm:text-sm"
    >
      <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mx-auto sm:mx-0">
          <span className="flex items-center gap-2 whitespace-nowrap text-[#F5F7F8] font-medium">
            <Truck size={17} aria-hidden="true" className="shrink-0 text-[#F5F7F8]" />
            <span>
              {locale === 'de' ? 'Kostenlose Lieferung in Deutschland' : 'Livraison gratuite en Allemagne'}
            </span>
          </span>
        </div>
      </div>
    </aside>,
    locale
  );
}
