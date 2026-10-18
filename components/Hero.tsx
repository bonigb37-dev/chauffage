'use client';
import BrandWordmark from '@/components/BrandWordmark';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { motion, useReducedMotion } from 'framer-motion';
import Link from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Boxes, Flame, Sparkles, Truck } from 'lucide-react';
import FireBrazier from '@/components/FireBrazier';

export default function Hero() {
  const brenLocale = useLocale() as Locale;
  const reduceMotion = useReducedMotion();

  return localizeNode((
    <section data-analytics-section="hero" className="relative isolate overflow-hidden bg-[#FDFBF7]">
      <FireBrazier variant="light" intensity="high" className="z-0" />
      <div className="container relative z-10 grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:min-h-[680px] lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-7 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0"
        >
          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight min-[390px]:text-5xl sm:text-6xl text-[#1c1917]">
            Bois de chauffage, granulés et briquettes{' '}
            <span className="text-[#a33d1e]">avec livraison en Allemagne.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#57534e]">
            Bei Brennholz-direk finden Sie Brennholz, Holzpellets und Holzbriketts – je nach Produkt in Säcken, Paketen oder auf Paletten.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/#categories-produits"
              className="inline-flex items-center gap-2 rounded-full bg-[#a33d1e] px-6 py-4 font-bold text-white shadow-lg hover:bg-[#883015] transition"
            >
              <span>Choisir une catégorie</span> <ArrowRight size={18} />
            </Link>
            <Link
              href="/produits#catalogue"
              className="inline-flex items-center gap-2 rounded-full border border-[#e8decb] bg-[#f9f5ee] px-6 py-4 font-bold text-[#a33d1e] shadow-lg hover:bg-white transition"
            >
              Achetez maintenant <ArrowRight size={18} />
            </Link>
            <Link
              href="/guide-granules"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#a33d1e]/30 bg-white px-5 py-4 font-extrabold text-[#a33d1e] hover:bg-[#f9f5ee] transition"
            >
              <Sparkles size={18} className="text-[#a33d1e]" /> Guide Granulés
            </Link>
          </div>
          <div className="hero-benefits mt-10 grid max-w-xl grid-cols-3 gap-2 text-xs min-[390px]:gap-4 min-[390px]:text-sm">
            <div>
              <BadgeCheck className="mb-2 text-[#a33d1e]" />
              <b className="text-[#a33d1e]">Sélection</b>
              <p className="mt-1 text-[#57534e]">Combustibles bois</p>
            </div>
            <div>
              <Boxes className="mb-2 text-[#a33d1e]" />
              <b className="text-[#a33d1e]">Formats</b>
              <p className="mt-1 text-[#57534e]">Sac, filet, palette</p>
            </div>
            <div>
              <Truck className="mb-2 text-[#a33d1e]" />
              <b className="text-[#a33d1e]">Livraison</b>
              <p className="mt-1 text-[#57534e]">Incluse en Allemagne</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
          style={{ perspective: 1200 }}
        >
          <div className="absolute -inset-5 rounded-[3rem] bg-[#a33d1e]/20 blur-3xl" />
          <motion.div
            animate={reduceMotion ? undefined : {
              y: [0, -10, 0],
              rotateX: [1.5, -1.5, 1.5],
              rotateY: [-3, 3, -3],
            }}
            transition={reduceMotion ? undefined : {
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformStyle: 'preserve-3d', transformOrigin: 'center' }}
            className="relative overflow-hidden rounded-[2.5rem] bg-[#a33d1e] p-5 shadow-2xl will-change-transform"
          >
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 text-white">
              <span className="flex items-center gap-2 font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#a33d1e] text-white"><Flame size={18} strokeWidth={2.2} fill="currentColor" /></span><BrandWordmark hyphenClass="text-[#f9f5ee]" /></span>
              <span className="text-xs text-[#f9f5ee]">COMBUSTIBLES BOIS</span>
            </div>
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#f9f5ee]">
              <Image
                src="/hero-feu-20261013.jpg"
                alt="Bûches en feu dans un foyer de chauffage"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="hero-fire-photo object-cover"
              />
              <div aria-hidden="true" className="hero-fire-glow pointer-events-none absolute inset-0" />
            </div>
          </motion.div>
          <div className="absolute -bottom-3 left-2 rounded-2xl bg-white p-3 shadow-xl sm:-bottom-5 sm:-left-5 sm:p-4 border border-[#e8decb]">
            <p className="text-xs font-semibold text-[#57534e]">
              Formats disponibles
            </p>
            <p className="mt-1 text-base font-black sm:text-xl text-[#a33d1e]">Sac · Filet · Palette</p>
          </div>
        </motion.div>
      </div>
    </section>
  ), brenLocale);
}
