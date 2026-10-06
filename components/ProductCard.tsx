'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Boxes, Check, Expand, Heart, ShoppingCart, Star, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { Product } from '@/lib/products';
import { useCart } from '@/components/CartProvider';
import { getDemoReviews } from '@/lib/demo-reviews';

const formatPrice = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount / 100);

export default function ProductCard({ p }: { p: Product }) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [stockOpen, setStockOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const router = useRouter();
  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const activeImage = gallery[imageIndex] ?? p.image;
  const { addItem, items } = useCart();
  const demoReviews = getDemoReviews(p);
  const demoRating = demoReviews.reduce((sum, review) => sum + review.rating, 0) / demoReviews.length;
  const cartQuantity = items.find((item) => item.productId === p.id)?.quantity ?? 0;
  const reachedStock = p.stock !== undefined && cartQuantity >= p.stock;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!stockOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStockOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [stockOpen]);

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-gray-100 bg-white shadow-soft transition-shadow hover:shadow-lg">
      <div className="relative h-44 overflow-hidden border-b border-gray-100 bg-white sm:h-52">
        <button type="button" onClick={() => { setImageIndex(0); setZoomed(false); setOpen(true); }} className="absolute inset-0 block h-full w-full" aria-label={`Agrandir la photo : ${p.name}`}>
          <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-5" />
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-gray-800 shadow">
            <Expand size={14} /> Agrandir
          </span>
        </button>
        {p.badge && <span className={`pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm ${p.badge.includes('%') ? 'bg-orange-600' : 'bg-gray-900'}`}>{p.badge}</span>}
        <button type="button" aria-label={favorite ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`} aria-pressed={favorite} onClick={() => setFavorite(!favorite)} className={`absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110 ${favorite ? 'text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} strokeWidth={2.2} /></button>
      </div>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[150] grid place-items-center bg-gray-950/90 p-4" role="dialog" aria-modal="true" aria-label={`Photo du produit : ${p.name}`} onClick={() => setOpen(false)}>
          <div className="relative flex h-[min(90dvh,900px)] max-h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-7 sm:py-4">
              <div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-widest text-orange-600">{p.type} · {p.quantity}</p><h2 className="mt-1 line-clamp-2 text-base font-black sm:text-xl">{p.name}</h2>{p.articleNumber && <p className="mt-1 text-sm text-gray-500">N° d’article : {p.articleNumber}</p>}</div>
              <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
                {gallery.length > 1 && <span className="mr-1 text-xs font-semibold text-gray-500 sm:text-sm">{imageIndex + 1} / {gallery.length}</span>}
                {gallery.length > 1 && <button type="button" onClick={() => { setImageIndex((imageIndex + gallery.length - 1) % gallery.length); setZoomed(false); }} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-orange-100 sm:h-11 sm:w-11" aria-label="Photo précédente"><ArrowLeft size={18} /></button>}
                {gallery.length > 1 && <button type="button" onClick={() => { setImageIndex((imageIndex + 1) % gallery.length); setZoomed(false); }} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-orange-100 sm:h-11 sm:w-11" aria-label="Photo suivante"><ArrowRight size={18} /></button>}
                <button type="button" onClick={() => setZoomed(!zoomed)} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-orange-100 sm:h-11 sm:w-11" aria-label={zoomed ? 'Réduire l’image' : 'Zoomer sur l’image'}>{zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}</button>
                <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-gray-200 sm:h-11 sm:w-11" aria-label="Fermer"><X size={19} /></button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1 overflow-auto bg-stone-100">
              <div className={`relative mx-auto h-full min-h-[220px] w-full transition-transform duration-300 sm:min-h-[360px] ${zoomed ? 'scale-150' : ''}`}>
                <Image src={activeImage} alt={`${p.name} — photo ${imageIndex + 1}`} fill sizes="100vw" className="object-contain p-4 sm:p-8" />
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-7 sm:py-4"><p className="min-w-0 text-sm leading-6 text-gray-500">{p.description}</p><Link href="/contact" onClick={() => setOpen(false)} className="inline-flex shrink-0 justify-center rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600">Demander un devis</Link></div>
          </div>
        </div>, document.body
      )}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3 text-xs font-bold uppercase tracking-wide text-orange-600">
          <span>{p.type}</span>
          <span className="text-right text-gray-500">{p.quantity}</span>
        </div>
        <h3 className="mt-1.5 min-h-12 text-base font-extrabold leading-snug text-gray-950 sm:text-lg">{p.name}</h3>
        {p.articleNumber && <p className="mt-1 text-xs font-medium text-gray-400">N° d’article : {p.articleNumber}</p>}
        <span className="mt-1.5 inline-flex min-h-5 items-center gap-1.5 text-xs text-amber-800">
          <span className="flex items-center gap-0.5 text-amber-500" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < Math.floor(demoRating) ? 'currentColor' : 'none'} />)}</span>
          {demoRating.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/5
        </span>
        <p className="mt-1.5 min-h-9 text-[13px] leading-[1.15rem] text-gray-600">{p.description}</p>
        <div className={`mt-2 flex min-h-5 items-center gap-1.5 text-xs font-semibold ${p.stock === 0 ? 'text-red-700' : p.stock !== undefined || p.availability?.startsWith('En stock') ? 'text-emerald-700' : 'text-gray-500'}`}>
          {(p.stock !== undefined && p.stock > 0) || p.availability?.startsWith('En stock') ? <Check size={17} strokeWidth={2.7} /> : null}
          <span>{p.stock === 0 ? 'Rupture de stock' : p.stock !== undefined ? `En stock · ${p.stock} unités` : p.availability ?? 'Disponibilité à confirmer'}</span>
        </div>
        <div className="mt-auto pt-3">
          <div className="flex min-h-[3.75rem] items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><b className="text-lg font-extrabold text-gray-950">{p.price}</b>{p.compareAtPriceAmount && <del className="text-xs text-gray-400">{formatPrice(p.compareAtPriceAmount)}</del>}</div>
              {p.volumePriceAmount && <p className="mt-1 text-xs text-gray-500">Tarif dès {p.volumePriceQuantity ?? 1} unités : {formatPrice(p.volumePriceAmount)}</p>}
            </div>
            <button id={`acheter-produit-${p.id}`} type="button" onClick={() => { addItem(p.id); router.push('/panier'); }} disabled={reachedStock} aria-label={`Ajouter ${p.name} au panier`} className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"><ShoppingCart size={19} /></button>
          </div>
        </div>
      </div>
      <details className="border-t border-amber-100 bg-amber-50/60 px-3 py-2.5 sm:px-4">
        <summary className="cursor-pointer text-sm font-bold text-amber-900">Voir 20 avis clients</summary>
        <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          {demoReviews.map((review) => <li key={review.id} className="rounded-xl border border-amber-100 bg-white p-3">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-gray-700">{review.label}</span><span className="flex items-center gap-0.5 text-amber-500" aria-label={`${review.rating} étoiles sur 5`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill={index < review.rating ? 'currentColor' : 'none'} />)}</span></div>
            <p className="mt-1.5 text-sm leading-5 text-gray-600">{review.text}</p>
          </li>)}
        </ul>
      </details>
      {stockOpen && p.stock !== undefined && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] grid place-items-center bg-gray-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`stock-title-${p.id}`} onClick={() => setStockOpen(false)}>
          <section className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Boxes size={24} /></div>
              <button type="button" onClick={() => setStockOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Fermer les informations de stock"><X size={19} /></button>
            </div>
            <p className="mt-5 text-sm font-bold uppercase tracking-widest text-emerald-700">Stock disponible</p>
            <h2 id={`stock-title-${p.id}`} className="mt-1 text-2xl font-black text-gray-950">{p.stock} palettes prêtes à commander</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{p.name}</p>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Boxes size={21} /></div>
              <div><p className="font-bold text-gray-900">Palette complète</p><p className="mt-1 text-sm text-gray-600">65 sacs papier · 975 kg</p></div>
            </div>
            <button type="button" onClick={() => setStockOpen(false)} className="mt-6 w-full rounded-xl bg-gray-950 px-4 py-3 font-bold text-white transition hover:bg-orange-600">Fermer</button>
          </section>
        </div>, document.body
      )}
    </article>
  );
}
