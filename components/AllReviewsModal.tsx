'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, MapPin, Search, Star, X, ShieldCheck, Filter } from 'lucide-react';
import { getAllReviews } from '@/lib/reviews';

export default function AllReviewsModal() {
  const brenLocale = useLocale() as Locale;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(25);

  const reviews = useMemo(() => getAllReviews(), []);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setVisibleCount(25);
    };
    window.addEventListener('open-all-reviews', handleOpen);
    return () => window.removeEventListener('open-all-reviews', handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (starFilter !== 'all' && r.rating !== starFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.author.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.productName && r.productName.toLowerCase().includes(q))
      );
    });
  }, [reviews, search, starFilter]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    localizeNode(<div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-reviews-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-orange-600 px-5 py-4 text-white sm:px-8 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-amber-300">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 id="all-reviews-title" className="text-lg font-black tracking-tight sm:text-xl leading-tight">
                584 Avis Clients Vérifiés
              </h2>
              <p className="text-xs text-orange-100 font-medium">Retours d’expérience authentiques & certifiés</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
            aria-label="Fermer la fenêtre d’avis"
          >
            <X size={19} />
          </button>
        </div>

        {/* Global Rating Summary Banner inside Modal */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-amber-50/70 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-gray-950">4.8</span>
            <div>
              <div className="flex items-center text-amber-400 gap-0.5" aria-label="Note de 4.8 sur 5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">Basé sur 584 évaluations réelles</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-300/60">
            ✓ 100 % Avis Vérifiés
          </span>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50 p-4 sm:px-8 sm:py-3.5">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un mot-clé, une ville, un nom ou un produit..."
              className="w-full rounded-2xl border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="flex items-center gap-1 font-bold text-gray-500 shrink-0 pr-1">
              <Filter size={13} /> Filtrer :
            </span>
            <button
              type="button"
              onClick={() => setStarFilter('all')}
              className={`rounded-full px-3 py-1.5 font-bold transition shrink-0 ${
                starFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Tous (584)
            </button>
            <button
              type="button"
              onClick={() => setStarFilter(5)}
              className={`rounded-full px-3 py-1.5 font-bold transition shrink-0 flex items-center gap-1 ${
                starFilter === 5 ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              5 Étoiles <Star size={12} className="fill-amber-400 text-amber-400 inline" />
            </button>
            <button
              type="button"
              onClick={() => setStarFilter(4)}
              className={`rounded-full px-3 py-1.5 font-bold transition shrink-0 flex items-center gap-1 ${
                starFilter === 4 ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              4 Étoiles <Star size={12} className="fill-amber-400 text-amber-400 inline" />
            </button>
          </div>
        </div>

        {/* Scrollable Reviews List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 bg-stone-100/50">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="font-bold text-base">Aucun avis ne correspond à votre recherche.</p>
              <button
                type="button"
                onClick={() => { setSearch(''); setStarFilter('all'); }}
                className="mt-3 text-xs font-bold text-orange-600 underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredReviews.slice(0, visibleCount).map((rev) => (
              <article key={rev.id} className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:border-orange-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 font-extrabold text-orange-800 text-sm shrink-0">
                      {rev.author.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-gray-950 text-sm sm:text-base">{rev.author}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Achat vérifié
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin size={12} className="text-gray-400" /> {rev.location} · {rev.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}
                      />
                    ))}
                  </div>
                </div>

                {rev.productName && (
                  <p className="mt-2.5 text-xs font-bold text-orange-700 bg-orange-50 inline-block px-2.5 py-1 rounded-lg border border-orange-200/60">
                    Produit : {rev.productName}
                  </p>
                )}

                <h3 data-original-content className="mt-2 font-black text-gray-900 text-sm sm:text-base">{rev.title}</h3>
                <p data-original-content className="mt-1.5 text-xs sm:text-sm leading-relaxed text-gray-700 font-normal">{rev.comment}</p>
              </article>
            ))
          )}

          {visibleCount < filteredReviews.length && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 25)}
                className="rounded-full bg-orange-600 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-orange-700 transition"
              >
                Afficher plus d’avis ({filteredReviews.length - visibleCount} restants)
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 bg-white px-5 py-3 text-center text-xs text-gray-500">
          Consultez tous nos retours d’expérience vérifiés sur combustibles bois & granulés.
        </div>
      </div>
    </div>, brenLocale),
    document.body
  );
}
