'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Boxes, Flame, Sparkles, Truck } from 'lucide-react';

export default function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#fffaf5]">
      <Image
        src="/BD.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className="z-0 object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[#fffaf5]/45 lg:bg-gradient-to-r lg:from-[#fffaf5]/90 lg:via-[#fffaf5]/45 lg:to-transparent" />
      <div className="container relative z-10 grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:min-h-[680px] lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-[#fffaf5]/80 p-5 shadow-lg backdrop-blur-sm sm:p-7 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0"
        >
          <Link
            href="/guide-pellets"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/25 px-4 py-2 text-xs sm:text-sm font-bold text-orange-800 hover:bg-orange-500/20 transition mb-6 shadow-sm"
          >
            <Sparkles size={16} className="text-orange-600" />
            <span>Guide de sélection des granulés de bois</span>
            <ArrowRight size={14} className="text-orange-600" />
          </Link>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight min-[390px]:text-5xl sm:text-6xl">
            Bois de chauffage, granulés et briquettes{' '}
            <span className="gradient-text">avec livraison en Allemagne.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600">
            Découvrez nos bûches, granulés de bois et briquettes, en sacs,
            paquets ou palettes selon les références.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/#categories-produits"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-4 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
            >
              Choisir une catégorie <ArrowRight size={18} />
            </Link>
            <Link
              href="/produits#catalogue"
              className="rounded-full border border-gray-200 bg-white px-6 py-4 font-bold hover:border-orange-300"
            >
              Achetez maintenant
            </Link>
            <Link
              href="/guide-pellets"
              className="inline-flex items-center gap-2 rounded-full border-2 border-orange-500/30 bg-orange-50/90 px-5 py-4 font-extrabold text-orange-950 hover:bg-orange-100 hover:border-orange-500 transition"
            >
              <Sparkles size={18} className="text-orange-600" /> Guide Granulés
            </Link>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-2 text-xs min-[390px]:gap-4 min-[390px]:text-sm">
            <div>
              <BadgeCheck className="mb-2 text-orange-500" />
              <b>Sélection</b>
              <p className="mt-1 text-gray-500">Combustibles bois</p>
            </div>
            <div>
              <Boxes className="mb-2 text-orange-500" />
              <b>Formats</b>
              <p className="mt-1 text-gray-500">Sac, filet, palette</p>
            </div>
            <div>
              <Truck className="mb-2 text-orange-500" />
              <b>Livraison</b>
              <p className="mt-1 text-gray-500">Incluse en Allemagne</p>
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
          <div className="absolute -inset-5 rounded-[3rem] bg-orange-200/50 blur-3xl" />
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
            className="relative overflow-hidden rounded-[2.5rem] bg-gray-950 p-5 shadow-2xl will-change-transform"
          >
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 text-white">
              <span className="flex items-center gap-2 font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 text-white"><Flame size={18} strokeWidth={2.2} fill="currentColor" /></span>Bren-nholz</span>
              <span className="text-xs text-orange-300">COMBUSTIBLES BOIS</span>
            </div>
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-orange-50">
              <Image
                src="/BD.jpg"
                alt="Bûches en feu dans un foyer de chauffage"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </motion.div>
          <div className="absolute -bottom-3 left-2 rounded-2xl bg-white p-3 shadow-xl sm:-bottom-5 sm:-left-5 sm:p-4">
            <p className="text-xs font-semibold text-gray-500">
              Formats disponibles
            </p>
            <p className="mt-1 text-base font-black sm:text-xl">Sac · Filet · Palette</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
