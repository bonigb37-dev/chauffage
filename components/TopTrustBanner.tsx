'use client';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Star } from 'lucide-react';
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
      aria-label="Avis clients"
      className="border-b border-orange-700/60 bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-inner select-none sm:text-sm"
    >
      <div className="container mx-auto flex max-w-7xl items-center justify-center">
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
      </div>
    </aside>,
    locale
  );
}
