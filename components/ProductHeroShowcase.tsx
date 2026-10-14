'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, ZoomIn } from 'lucide-react';

const slides = [
  {
    image: '/bois-chauffage.webp',
    alt: 'Bûches de bois de chauffage sèches sur palette',
    badge: 'Bois de chauffage',
    title: 'Bûches de chêne & hêtre séchées',
  },
  {
    image: '/briquettes-hexagonales.webp',
    alt: 'Briquettes de bois densifiées Pini-Kay',
    badge: 'Briquettes densifiées',
    title: 'Briquettes RUF & Pini-Kay haute performance',
  },
  {
    image: '/eph-premium-palette.webp',
    alt: 'Palette EPH Premium 975 kg',
    badge: 'Offre Phare',
    title: 'Palette EPH Premium 975 kg (65 sacs)',
  },
];

export default function ProductHeroShowcase() {
  const brenLocale = useLocale() as Locale;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = slides[index];

  return localizeNode((
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      {/* Glow background effect */}
      <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-r from-[#a33d1e]/30 to-[#a33d1e]/20 blur-2xl transition-all duration-700" />

      {/* Main card */}
      <div className="relative aspect-[1.12/1] overflow-hidden rounded-[2.5rem] bg-[#a33d1e] shadow-2xl border border-stone-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.image}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 h-full w-full"
          >
            <Image
              src={current.image}
              alt={current.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

        {/* Navigation Arrows */}
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-auto z-20">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#a33d1e] backdrop-blur-md shadow-lg transition hover:bg-white hover:scale-105 active:scale-95"
            aria-label="Image précédente"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#a33d1e] backdrop-blur-md shadow-lg transition hover:bg-white hover:scale-105 active:scale-95"
            aria-label="Image suivante"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Product details card */}
        <div className="absolute inset-x-4 bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-5 border border-white/40">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#a33d1e]">
                  <Flame size={14} className="fill-[#a33d1e] text-[#a33d1e]" />
                  {current.badge}
                </p>
                <p className="mt-1 font-black text-[#a33d1e] text-sm sm:text-base truncate">
                  {current.title}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#a33d1e] text-white shadow-md">
            <ZoomIn size={20} />
          </span>
        </div>

        {/* Dots indicators */}
        <div className="absolute top-4 inset-x-0 z-20 flex justify-center gap-2 pointer-events-auto">
          {slides.map((s, i) => (
            <button
              key={s.image}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-[#a33d1e]' : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Aller à la diapositive ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  ), brenLocale);
}
