'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from '@/i18n/navigation';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Expand, Heart, ShoppingCart, Star, X, ZoomIn, ZoomOut } from 'lucide-react';
import { productPathSegment, type Product } from '@/lib/products';
import { getAverageRating } from '@/lib/reviews';
import { useCart } from '@/components/CartProvider';


export default function ProductCard({ p }: { p: Product }) {
  const brenLocale = useLocale() as Locale;
  const formatPrice = (amount: number) => new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' }).format(amount / 100);

  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [stockOpen, setStockOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const activeImage = gallery[imageIndex] ?? p.image;
  const { addItem, items } = useCart();
  const cartQuantity = items.find((item) => item.productId === p.id)?.quantity ?? 0;
  const reachedStock = p.stock !== undefined && cartQuantity >= p.stock;

  const { average, count } = getAverageRating(p.id);
  const productUrl = `/produits/${productPathSegment(p)}`;

  const handleAddToCart = () => {
    if (p.stock === 0 || p.priceAmount === undefined || reachedStock) return;
    addItem(p.id, quantityToAdd);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

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

  return localizeNode((
    <article className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Product Image Section */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-t-2xl border-b border-stone-100 bg-stone-50/50">
        <button type="button" onClick={() => { setImageIndex(0); setZoomed(false); setOpen(true); }} className="absolute inset-0 block h-full w-full" aria-label={`Agrandir la photo : ${p.name}`}>
          <Image src={p.image} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-contain p-1 sm:p-2 transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-800 shadow-sm backdrop-blur-sm">
            <Expand size={12} /> Agrandir
          </span>
        </button>

        {/* Floating Rating Badge on top left of image */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col gap-1 items-start">
          <Link
            href={`${productUrl}#avis-clients`}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black text-gray-900 shadow-sm backdrop-blur-sm hover:bg-orange-50 hover:text-orange-600 transition"
          >
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{average.toFixed(1)}</span>
            <span className="text-[10px] font-semibold text-gray-500">({count})</span>
          </Link>
          {p.badge && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm ${p.badge.includes('%') ? 'bg-orange-600' : 'bg-gray-900'}`}>
              {p.badge}
            </span>
          )}
        </div>

        <button type="button" aria-label={favorite ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`} aria-pressed={favorite} onClick={() => setFavorite(!favorite)} className={`absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm transition hover:scale-110 ${favorite ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} strokeWidth={2.2} /></button>
      </div>

      {/* Modal image zoom */}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[150] grid place-items-center bg-gray-950/90 p-4" role="dialog" aria-modal="true" aria-label={`Photo du produit : ${p.name}`} onClick={() => setOpen(false)}>
          <div className="relative flex h-[min(90dvh,900px)] max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-widest text-orange-600">{p.type} · {p.quantity}</p>
                <h2 className="mt-0.5 line-clamp-1 text-base font-black sm:text-lg">{p.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-900">{average.toFixed(1)} / 5</span>
                  <span className="text-xs text-gray-500">({count} avis vérifiés)</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-1.5">
                {gallery.length > 1 && <span className="mr-1 text-xs font-semibold text-gray-500">{imageIndex + 1} / {gallery.length}</span>}
                {gallery.length > 1 && <button type="button" onClick={() => { setImageIndex((imageIndex + gallery.length - 1) % gallery.length); setZoomed(false); }} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-orange-100" aria-label="Photo précédente"><ArrowLeft size={16} /></button>}
                {gallery.length > 1 && <button type="button" onClick={() => { setImageIndex((imageIndex + 1) % gallery.length); setZoomed(false); }} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-orange-100" aria-label="Photo suivante"><ArrowRight size={16} /></button>}
                <button type="button" onClick={() => setZoomed(!zoomed)} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-orange-100" aria-label={zoomed ? 'Réduire l’image' : 'Zoomer sur l’image'}>{zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}</button>
                <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Fermer"><X size={17} /></button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1 overflow-auto bg-stone-100">
              <div className={`relative mx-auto h-full min-h-[220px] w-full transition-transform duration-300 sm:min-h-[360px] ${zoomed ? 'scale-150' : ''}`}>
                <Image src={activeImage} alt={`${p.name} — photo ${imageIndex + 1}`} fill sizes="100vw" className="object-contain p-2 sm:p-4" />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="min-w-0 text-xs leading-5 text-gray-600">{p.description}</p><Link href="/devis" onClick={() => setOpen(false)} className="inline-flex shrink-0 justify-center rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">Demander un devis</Link></div>
          </div>
        </div>, document.body
      )}

      {/* Compact Card Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-orange-600">
          <span className="truncate">{p.type}</span>
          <span className="shrink-0 text-right font-medium text-gray-400">{p.quantity}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-snug text-gray-950 sm:text-[15px] flex items-center">
          <Link href={productUrl} className="hover:text-orange-700">{p.name}</Link>
        </h3>

        {/* Rating Stars Row directly on the product card */}
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <Link href={`${productUrl}#avis-clients`} className="flex items-center gap-1.5 group/stars hover:text-orange-600">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
                />
              ))}
            </div>
            <span className="font-extrabold text-gray-900 text-xs group-hover/stars:text-orange-600">{average.toFixed(1)}</span>
            <span className="text-xs text-gray-500 font-semibold group-hover/stars:underline">({count} avis)</span>
          </Link>
        </div>

        <div className={`mt-1.5 flex min-h-[1.25rem] items-center gap-2 text-sm ${p.stock === 0 ? 'text-red-700' : 'text-green-600'}`}>
          {p.stock !== 0 && <Check size={22} strokeWidth={3} aria-hidden="true" />}
          <span>{p.stock === 0 ? 'Rupture de stock' : 'En stock'}</span>
        </div>

        <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-snug text-gray-500">{p.description}</p>

        <div className="mt-auto pt-2.5 space-y-2 border-t border-gray-100">
          {/* Price row */}
          <div className="flex h-7 items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <b className="text-base font-black text-gray-950 sm:text-lg">{p.price}</b>
              {p.compareAtPriceAmount && <del className="text-[11px] text-gray-400">{formatPrice(p.compareAtPriceAmount)}</del>}
            </div>
            {cartQuantity > 0 ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {cartQuantity} au panier
              </span>
            ) : (
              <div className="h-5" />
            )}
          </div>

          {/* Quantity Selector + Ajouter au Panier Button */}
          <div className="flex h-10 items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex shrink-0 items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setQuantityToAdd((q) => Math.max(1, q - 1))}
                disabled={quantityToAdd <= 1 || p.stock === 0}
                className="grid h-8 w-7 place-items-center rounded-md bg-white text-xs font-black text-gray-800 shadow-2xs transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Diminuer la quantité"
              >
                -
              </button>
              <span className="w-7 text-center text-xs font-bold text-gray-900">
                {quantityToAdd}
              </span>
              <button
                type="button"
                onClick={() => setQuantityToAdd((q) => p.stock !== undefined ? Math.min(p.stock, q + 1) : q + 1)}
                disabled={reachedStock || (p.stock !== undefined && quantityToAdd >= p.stock)}
                className="grid h-8 w-7 place-items-center rounded-md bg-white text-xs font-black text-gray-800 shadow-2xs transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              id={`acheter-produit-${p.id}`}
              type="button"
              onClick={handleAddToCart}
              disabled={p.stock === 0 || p.priceAmount === undefined || reachedStock}
              aria-label={`Ajouter ${p.name} au panier`}
              className={`flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-xs font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 shadow-sm ${
                justAdded ? 'bg-emerald-600' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {justAdded ? (
                <>
                  <Check size={15} strokeWidth={3} />
                  <span>Ajouté !</span>
                </>
              ) : p.stock === 0 ? (
                <span>Rupture</span>
              ) : (
                <>
                  <ShoppingCart size={15} />
                  <span>Ajouter au panier</span>
                </>
              )}
            </button>
          </div>

          {/* Reserved slot for quick link so every card has identical height & alignment */}
          <div className="flex h-5 items-center justify-end">
            {cartQuantity > 0 ? (
              <Link
                href="/panier"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Voir mon panier & payer <ArrowRight size={12} />
              </Link>
            ) : (
              <span className="invisible text-[11px]" aria-hidden="true">
                Voir mon panier
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  ), brenLocale);
}
