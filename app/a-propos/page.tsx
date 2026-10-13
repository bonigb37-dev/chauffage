import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("À propos de Bren-nholz — Leylines Park : combustibles bois en Allemagne", "Découvrez Bren-nholz — Leylines Park, son catalogue de combustibles bois et ses informations de contact en Allemagne.", "/a-propos"))); }

import Link from '@/i18n/navigation';
import Image from 'next/image';
import {
  Award,
  CheckCircle2,
  Flame,
  HeartHandshake,
  ShieldCheck,
  Truck,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Users
} from 'lucide-react';

const commitments = [
  {
    number: '01',
    icon: ShieldCheck,
    title: 'Une qualité suivie de près',
    description: 'Comparez les caractéristiques et les conditionnements indiqués sur les fiches pour choisir votre combustible.',
  },
  {
    number: '02',
    icon: HeartHandshake,
    title: 'Un service attentionné',
    description: 'De la découverte de nos produits jusqu’à leur livraison, nous veillons à vous accompagner avec sérieux, réactivité et disponibilité.',
  },
  {
    number: '03',
    icon: Award,
    title: 'Votre satisfaction avant tout',
    description: 'Votre satisfaction est au cœur de nos engagements. Pour toute question ou demande particulière, notre équipe reste à votre écoute directe.',
  },
];

const highlights = [
  { icon: Award, label: 'Caractéristiques des produits', text: 'Certifications selon référence' },
  { icon: Truck, label: 'Livraison à Domicile', text: 'Partout en Allemagne' },
  { icon: Users, label: 'Conseils Personnalisés', text: 'Informations avant commande' },
];

export default function AboutPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <main className="bg-[#F4F0E5] text-[#1c1917] pb-20">
      {/* Hero Header in Terracotta (#A54829) */}
      <section className="bg-[#A54829] text-white py-16 sm:py-24 shadow-md">
        <div className="container max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white border border-white/30 mb-6 backdrop-blur-sm">
            <Flame size={15} className="text-white fill-white" />
            Notre Histoire & Nos Valeurs
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Bren-nholz — Leylines Park : votre boutique de combustibles bois
          </h1>

          <p className="mt-6 text-base sm:text-xl text-[#F4F0E5] leading-relaxed max-w-3xl">
            Découvrez notre catalogue de granulés de bois, bûches, briquettes et produits d’allumage. Consultez les caractéristiques de chaque référence et les conditions de livraison en Allemagne.
          </p>
        </div>
      </section>

      {/* Main Presentation Section */}
      <section className="container max-w-6xl -mt-10 relative z-10">
        <div className="rounded-3xl bg-white p-6 sm:p-10 lg:p-12 shadow-xl border border-[#E7E0D3]">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">

            {/* Photo Container */}
            <div className="lg:col-span-7 relative group">
              <div className="absolute -inset-4 rounded-[3rem] bg-[#A54829]/15 blur-2xl transition duration-500 group-hover:scale-105" />

              <div className="relative h-[380px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl border border-stone-200 bg-[#123524]">
                <Image
                  src="/3B.webp"
                  alt="Un professionnel scie une grume de bois en forêt"
                  fill
                  priority
                  quality={100}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-center transition duration-700 ease-out group-hover:scale-105 contrast-[1.04] saturate-[1.06] brightness-[1.01]"
                />

                {/* Top Floating Glassmorphism Badge */}
                <div className="absolute top-5 left-5 z-10">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#123524]/85 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-bold text-white border border-white/20 shadow-lg">
                    <Sparkles size={16} className="text-[#F4F0E5]" />
                    Chaleur, sérénité & confort
                  </span>
                </div>

                {/* Bottom Overlay Card */}
                <div className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md border border-white/60">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#A54829] text-white font-black shadow-md">
                      <CheckCircle2 size={26} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-[#123524]">
                        À votre écoute
                      </h3>
                      <p className="text-xs text-[#57534e] mt-0.5 leading-relaxed">
                        Commande simple en ligne, suivi personnalisé et livraison soignée à domicile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Presentation Description Text */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-[#F4F0E5] text-[#A54829] border border-[#E7E0D3] rounded-full text-xs font-black uppercase tracking-wider mb-3">
                  Présentation
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123524] leading-tight">
                  Bienvenue chez Bren-nholz — Leylines Park
                </h2>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#1c1917] leading-relaxed">
                <p className="border-l-4 border-[#A54829] pl-4 py-1 font-semibold text-[#1c1917] bg-[#F4F0E5] rounded-r-xl">
                  « La qualité de nos combustibles et l’attention portée à notre clientèle, de la découverte de nos produits jusqu’à leur livraison, sont au centre de nos priorités. »
                </p>

                <p>
                  Notre catalogue réunit du bois de chauffage, des granulés, des briquettes et des produits d’allumage. Consultez les informations de chaque référence et contactez-nous si vous avez besoin de précisions.
                </p>

                <p>
                  La satisfaction de nos clients est essentielle et nous nous engageons à la préserver au quotidien. Pour toute question, conseil technique ou demande particulière, nous vous invitons à nous contacter directement.
                </p>
              </div>

              {/* Highlights List */}
              <div className="pt-2 border-t border-[#E7E0D3] grid gap-3">
                {highlights.map((h, idx) => {
                  const IconComp = h.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#1c1917]">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#F4F0E5] text-[#A54829]">
                        <IconComp size={18} />
                      </div>
                      <div>
                        <span className="text-[#123524] font-bold">{h.label}</span>
                        <span className="text-[#57534e] block text-xs">{h.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[#123524] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1b4d35] shadow-md"
                >
                  <MessageSquare size={18} />
                  Nous contacter
                </Link>
                <Link
                  href="/produits"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E7E0D3] bg-[#F4F0E5] px-6 py-3.5 text-sm font-bold text-[#1c1917] transition hover:bg-white hover:border-[#A54829]"
                >
                  Voir nos produits
                  <ArrowRight size={18} />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Commitments 3 Columns Grid */}
      <section className="container max-w-6xl mt-16 sm:mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A54829]">
            Nos piliers de confiance
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#123524] mt-2">
            Nos 3 engagements majeurs
          </h2>
          <p className="text-sm text-[#57534e] mt-2">
            Des informations sur les produits, les conditionnements et les modalités de réception.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {commitments.map((item) => {
            const IconComponent = item.icon;
            return (
              <article
                key={item.number}
                className="rounded-3xl bg-white p-8 border border-[#E7E0D3] shadow-sm transition hover:shadow-md hover:border-[#A54829]"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-black text-[#A54829]/40 font-serif">
                    {item.number}
                  </span>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F4F0E5] text-[#A54829]">
                    <IconComponent size={24} />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-[#123524]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#57534e]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom Callout Banner in Terracotta (#A54829) */}
      <section className="container max-w-6xl mt-16 sm:mt-20">
        <div className="rounded-3xl bg-[#A54829] p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Une question sur nos produits ou la livraison ?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#F4F0E5] max-w-xl">
              Notre équipe se tient à votre disposition pour préciser toutes les modalités de votre approvisionnement en Allemagne.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#123524] px-8 py-4 font-extrabold text-white transition hover:bg-[#1b4d35] shadow-md"
          >
            <span>Prendre contact</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  ), brenLocale);
}
