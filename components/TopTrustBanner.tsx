'use client';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Star, Truck } from 'lucide-react';
import { getTotalReviewsSummary } from '@/lib/reviews';

export default function TopTrustBanner() {
  const locale = useLocale() as Locale;
  const { totalReviews, averageRating } = getTotalReviewsSummary();
  const displayCount = totalReviews || 584;
  const rating = averageRating || 4.8;

  const handleOpenReviews = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-all-reviews'));
    }
  };

  return localizeNode(
    <aside
      aria-label="Avis clients et livraison"
      className="border-b border-orange-700/60 bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-inner select-none sm:text-sm"
    >
      <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mx-auto sm:mx-0">
          <button
            type="button"
            onClick={handleOpenReviews}
            className="flex items-center justify-center gap-2 text-left focus:outline-none hover:opacity-95 transition-opacity sm:gap-3"
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
            <span className="font-black text-sm tracking-tight sm:text-base">{rating.toFixed(1)}</span>
            <span className="hidden font-bold text-orange-100 min-[400px]:inline">
              {locale === 'de' ? 'Sehr gut' : 'Très bien'}
            </span>
            <span className="font-extrabold text-white underline underline-offset-4 hover:text-amber-200 cursor-pointer">
              {displayCount} {locale === 'de' ? 'Kundenbewertungen' : 'avis clients'}
            </span>
          </button>

          <span className="flex items-center gap-1.5 whitespace-nowrap text-orange-100">
            <Truck size={17} aria-hidden="true" className="shrink-0 text-amber-300" />
            <span>
              {locale === 'de'
                ? 'Kostenlose Lieferung in Deutschland · Keine Zusatzkosten beim Spediteur'
                : 'Livraison gratuite en Allemagne · Aucun frais supplémentaire à régler au transporteur'}
            </span>
          </span>
        </div>
      </div>
    </aside>,
    locale
  );
}
