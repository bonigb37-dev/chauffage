'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { Star, ShieldCheck, Truck } from 'lucide-react';
import { getTotalReviewsSummary } from '@/lib/reviews';
import LanguageSelector from '@/components/LanguageSelector';

export default function TopTrustBanner() {
  const brenLocale = useLocale() as Locale;

  const { totalReviews, averageRating } = getTotalReviewsSummary();
  const displayCount = totalReviews;
  const rating = averageRating || 4.8;

  const handleOpenReviews = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-all-reviews'));
  };

  return localizeNode((
    <aside aria-label="Avis clients et livraison" className="bg-orange-600 text-white border-b border-orange-700/60 py-2 px-3 text-xs sm:text-sm font-semibold shadow-inner select-none">
      <div className="container flex flex-wrap items-center justify-center sm:justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={handleOpenReviews}
          className="flex items-center justify-center gap-2 sm:gap-3 hover:opacity-95 transition-opacity text-left focus:outline-none"
        >
          {/* Yellow Stars */}
          <div className="flex items-center text-amber-300 gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= Math.round(rating) ? 'fill-amber-300 text-amber-300' : 'text-orange-300/50'}
              />
            ))}
          </div>

          {/* Rating Score & Text */}
          <span className="font-black text-sm sm:text-base tracking-tight">{rating.toFixed(1)}</span>
          <span className="hidden min-[400px]:inline font-bold text-orange-100">Très bien</span>
          <span className="text-white font-extrabold underline decoration-white underline-offset-4 cursor-pointer hover:text-amber-200">
            {displayCount} avis clients
          </span>
        </button>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Truck size={18} aria-hidden="true" className="shrink-0" />
          Livraison : 2 à 4 jours ouvrables
        </span>
        </div>

        {/* Trusted Guarantee Badge Style Icon */}
        <LanguageSelector />
        <div className="hidden sm:flex items-center gap-1.5 bg-orange-700/60 rounded-full px-2.5 py-1 text-xs text-orange-100 border border-orange-400/30 shrink-0">
          <ShieldCheck size={15} className="text-amber-300 shrink-0" />
          <span className="font-extrabold text-[11px] tracking-wide uppercase">Garantie Avis Vérifiés</span>
          <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-orange-950 text-[10px] font-black">e</span>
        </div>
      </div>
    </aside>
  ), brenLocale);
}
