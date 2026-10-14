'use client';
import BrandWordmark from '@/components/BrandWordmark';
import { useEffect, useRef } from 'react';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { motion, useReducedMotion } from 'framer-motion';
import Link from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Boxes, Flame, Sparkles, Truck } from 'lucide-react';

export default function Hero() {
  const brenLocale = useLocale() as Locale;

  const reduceMotion = useReducedMotion();
  const fireVideo = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = fireVideo.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const update = () => {
      video.autoplay = !preference.matches;
      if (preference.matches || document.hidden || !visible) video.pause();
      else void video.play().catch(() => { /* The poster remains visible if autoplay is unavailable. */ });
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(video);
    document.addEventListener('visibilitychange', update);
    preference.addEventListener('change', update);
    update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); preference.removeEventListener('change', update); video.pause(); };
  }, []);

  return localizeNode((
    <section data-analytics-section="hero" className="relative isolate overflow-hidden bg-[#A54829]">
      <Image
        src="/hero-fire-poster-20261013.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className="z-0 object-cover object-center opacity-30"
      />
      <video
        ref={fireVideo}
        src="/hero-fire-loop-20261013.mp4"
        poster="/hero-fire-poster-20261013.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        className="hero-fire-video pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center opacity-30"
      />
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[#A54829]/85 lg:bg-gradient-to-r lg:from-[#A54829]/95 lg:via-[#A54829]/90 lg:to-[#A54829]/60" />
      <div className="container relative z-10 grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:min-h-[680px] lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-[#A54829]/95 p-5 shadow-lg backdrop-blur-sm sm:p-7 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0"
        >
          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight min-[390px]:text-5xl sm:text-6xl text-white">
            Bois de chauffage, granulés et briquettes{' '}
            <span className="text-[#F4F0E5]">avec livraison en Allemagne.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white">
            Découvrez nos bûches, granulés de bois et briquettes, en sacs,
            paquets ou palettes selon les références.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/#categories-produits"
              className="inline-flex items-center gap-2 rounded-full bg-[#123524] px-6 py-4 font-bold text-white shadow-lg hover:bg-[#1b4d35] transition"
            >
              <span>Choisir une catégorie</span> <ArrowRight size={18} />
            </Link>
            <Link
              href="/produits#catalogue"
              className="inline-flex items-center gap-2 rounded-full border border-[#F4F0E5] bg-[#F4F0E5] px-6 py-4 font-bold text-[#123524] shadow-lg hover:bg-white transition"
            >
              Achetez maintenant <ArrowRight size={18} />
            </Link>
            <Link
              href="/guide-granules"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#A54829]/30 bg-white px-5 py-4 font-extrabold text-[#A54829] hover:bg-[#F4F0E5] transition"
            >
              <Sparkles size={18} className="text-[#A54829]" /> Guide Granulés
            </Link>
          </div>
          <div className="hero-benefits mt-10 grid max-w-xl grid-cols-3 gap-2 text-xs min-[390px]:gap-4 min-[390px]:text-sm">
            <div>
              <BadgeCheck className="mb-2 text-[#A54829]" />
              <b className="text-[#123524]">Sélection</b>
              <p className="mt-1 text-[#57534e]">Combustibles bois</p>
            </div>
            <div>
              <Boxes className="mb-2 text-[#A54829]" />
              <b className="text-[#123524]">Formats</b>
              <p className="mt-1 text-[#57534e]">Sac, filet, palette</p>
            </div>
            <div>
              <Truck className="mb-2 text-[#A54829]" />
              <b className="text-[#123524]">Livraison</b>
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
          <div className="absolute -inset-5 rounded-[3rem] bg-[#A54829]/20 blur-3xl" />
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
            className="relative overflow-hidden rounded-[2.5rem] bg-[#123524] p-5 shadow-2xl will-change-transform"
          >
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 text-white">
              <span className="flex items-center gap-2 font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#A54829] text-white"><Flame size={18} strokeWidth={2.2} fill="currentColor" /></span><BrandWordmark hyphenClass="text-[#F4F0E5]" /></span>
              <span className="text-xs text-[#F4F0E5]">COMBUSTIBLES BOIS</span>
            </div>
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#F4F0E5]">
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
          <div className="absolute -bottom-3 left-2 rounded-2xl bg-white p-3 shadow-xl sm:-bottom-5 sm:-left-5 sm:p-4 border border-[#E7E0D3]">
            <p className="text-xs font-semibold text-[#57534e]">
              Formats disponibles
            </p>
            <p className="mt-1 text-base font-black sm:text-xl text-[#123524]">Sac · Filet · Palette</p>
          </div>
        </motion.div>
      </div>
    </section>
  ), brenLocale);
}
