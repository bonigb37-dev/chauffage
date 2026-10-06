'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Boxes, Truck } from 'lucide-react';

export default function Hero() {
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
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[#fffaf5]/85 lg:bg-gradient-to-r lg:from-[#fffaf5]/95 lg:via-[#fffaf5]/85 lg:to-[#fffaf5]/60" />
      <div className="container relative z-10 grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:min-h-[680px] lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-600">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Granulés • Bûches • Briquettes
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight min-[390px]:text-5xl sm:text-6xl">
            Votre chauffage au bois,{' '}
            <span className="gradient-text">bien approvisionné.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600">
            Granulés, briquettes et bois de chauffage pour accompagner votre
            confort au quotidien.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/#categories-produits"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-4 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
            >
              Choisir une catégorie <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-gray-200 bg-white px-6 py-4 font-bold hover:border-orange-300"
            >
              Demander un conseil
            </Link>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-2 text-xs min-[390px]:gap-4 min-[390px]:text-sm">
            <div>
              <BadgeCheck className="mb-2 text-orange-500" />
              <b>Sélection</b>
              <p className="mt-1 text-gray-500">Produits adaptés</p>
            </div>
            <div>
              <Boxes className="mb-2 text-orange-500" />
              <b>Formats</b>
              <p className="mt-1 text-gray-500">Sac, filet, palette</p>
            </div>
            <div>
              <Truck className="mb-2 text-orange-500" />
              <b>Livraison</b>
              <p className="mt-1 text-gray-500">Selon votre zone</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-5 rounded-[3rem] bg-orange-200/50 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 text-white">
              <span className="font-bold">THERMOPRO</span>
              <span className="text-xs text-orange-300">COMBUSTIBLES BOIS</span>
            </div>
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-orange-50">
              <Image
                src="/pellets.webp"
                alt="Sacs et palette de granulés de bois pour le chauffage"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
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
