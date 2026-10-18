'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { Locale } from '@/i18n/routing';

const copy = {
  fr: { zoom: 'Agrandir la photo', close: 'Fermer', previous: 'Photo précédente', next: 'Photo suivante', gallery: 'Photos du produit', view: 'Vue du produit' },
  de: { zoom: 'Bild vergrößern', close: 'Schließen', previous: 'Vorheriges Bild', next: 'Nächstes Bild', gallery: 'Produktbilder', view: 'Produktansicht' },
  en: { zoom: 'Enlarge photo', close: 'Close', previous: 'Previous photo', next: 'Next photo', gallery: 'Product photos', view: 'Product view' },
};

export default function ProductGallery({ name, image, gallery, descriptions }: {
  name: string; image: string; gallery?: string[]; descriptions?: Product['galleryDescriptions'];
}) {
  const locale = useLocale() as Locale;
  const labels = copy[locale] ?? copy.de;
  const images = [...new Set([image, ...(gallery ?? [])].filter(Boolean))];
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const active = images[index] ?? image;
  const caption = descriptions?.[active]?.[locale] ?? `${name} — ${labels.view} ${index + 1}`;
  const move = (direction: number) => setIndex(current => (current + direction + images.length) % images.length);

  const navigation = images.length > 1 && <div className="flex items-center gap-2">
    <button type="button" onClick={() => move(-1)} aria-label={labels.previous} className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 bg-white text-stone-800 hover:bg-stone-100"><ChevronLeft size={20} /></button>
    <span className="min-w-12 text-center text-sm tabular-nums">{index + 1} / {images.length}</span>
    <button type="button" onClick={() => move(1)} aria-label={labels.next} className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 bg-white text-stone-800 hover:bg-stone-100"><ChevronRight size={20} /></button>
  </div>;

  if (!images.length) return <section aria-label={labels.gallery} className="grid aspect-[4/3] place-items-center rounded-2xl bg-[#FAF6F0] text-stone-500">Produktfoto folgt</section>;

  return <section aria-label={labels.gallery} className="min-w-0 self-start">
    <figure>
      <button type="button" aria-label={labels.zoom} onClick={() => { setZoomed(true); dialog.current?.showModal(); }} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#FAF6F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A33D1E]">
        <Image src={active} alt={caption} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
        <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold shadow-sm"><ZoomIn size={18} />{labels.zoom}</span>
      </button>
      <figcaption aria-live="polite" className="mt-3 min-h-12 text-sm leading-6 text-[#6B5E55]">{caption}</figcaption>
    </figure>
    {images.length > 1 && <>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {images.map((src, position) => <button key={src} type="button" aria-pressed={position === index} aria-label={descriptions?.[src]?.[locale] ?? `${name} — ${labels.view} ${position + 1}`} onClick={() => setIndex(position)} className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-[#FAF6F0] transition ${position === index ? 'border-[#A33D1E] ring-2 ring-[#A33D1E]/20' : 'border-stone-200 hover:border-stone-400'}`}>
          <Image src={src} alt="" fill sizes="(max-width: 640px) 22vw, 100px" className="object-cover" />
        </button>)}
      </div>
      <div className="mt-4 flex justify-end">{navigation}</div>
    </>}
    <dialog ref={dialog} aria-label={labels.zoom} onClose={() => setZoomed(false)} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }} className="fixed inset-0 m-auto max-h-[94dvh] w-[96vw] max-w-6xl overflow-auto rounded-2xl bg-white p-4 text-stone-800 shadow-2xl backdrop:bg-black/80 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-4"><p className="font-bold">{name}</p><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label={labels.close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-100"><X size={22} /></button></div>
      {zoomed && <div className="relative h-[60dvh] w-full"><Image src={active} alt={caption} fill sizes="96vw" className="object-contain" /></div>}
      <p aria-live="polite" className="my-3 text-sm leading-6">{caption}</p>
      <div className="flex justify-center">{navigation}</div>
    </dialog>
  </section>;
}
