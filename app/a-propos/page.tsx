import Link from 'next/link';
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
    description: 'Nous visitons régulièrement nos fabricants afin de contrôler la qualité de nos combustibles et d’identifier des alternatives fiables et accessibles.',
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
  { icon: Award, label: 'Combustibles Certifiés', text: 'ENplus A1 & DINplus' },
  { icon: Truck, label: 'Livraison à Domicile', text: 'Partout en Allemagne' },
  { icon: Users, label: 'Conseils Personnalisés', text: 'Accompagnement expert' },
];

export default function AboutPage() {
  return (
    <main className="bg-gray-50 text-gray-900 pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 text-white py-16 sm:py-24">
        <div className="container max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30 mb-6">
            <Flame size={15} className="text-orange-400 fill-orange-400" />
            Notre Histoire & Nos Valeurs
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            La qualité et le service, au cœur de notre engagement
          </h1>

          <p className="mt-6 text-base sm:text-xl text-gray-300 leading-relaxed max-w-3xl">
            Nous sélectionnons le meilleur du chauffage au bois pour votre confort au quotidien : granulés certifiés, bûches séchées et briquettes haute performance.
          </p>
        </div>
      </section>

      {/* Main Presentation Section with Enlarged Professional Photo Showcase */}
      <section className="container max-w-6xl -mt-10 relative z-10">
        <div className="rounded-3xl bg-white p-6 sm:p-10 lg:p-12 shadow-xl border border-gray-100">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">

            {/* Enlarged Professional Photo Container (7 cols on large screens) */}
            <div className="lg:col-span-7 relative group">
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-orange-400/20 to-amber-300/30 blur-2xl transition duration-500 group-hover:scale-105" />

              <div className="relative h-[380px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl border border-gray-200/80 bg-gray-950">
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
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-950/80 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-bold text-white border border-white/20 shadow-lg">
                    <Sparkles size={16} className="text-orange-400" />
                    Chaleur, sérénité & confort
                  </span>
                </div>

                {/* Bottom Overlay Card */}
                <div className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md border border-white/60">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black shadow-md shadow-orange-500/30">
                      <CheckCircle2 size={26} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-gray-900">
                        Satisfaction Client Garantie
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Commande simple en ligne, suivi personnalisé et livraison soignée à domicile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Presentation Description Text (5 cols on large screens) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                  Présentation
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  Bienvenue chez Bren-nholz
                </h2>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed">
                <p className="border-l-4 border-orange-500 pl-4 py-1 font-semibold text-gray-900 bg-orange-50/50 rounded-r-xl">
                  « La qualité de nos combustibles et l’attention portée à notre clientèle, de la découverte de nos produits jusqu’à leur livraison, sont au centre de nos priorités. »
                </p>

                <p>
                  Nous nous rendons régulièrement chez nos fabricants afin de contrôler personnellement la qualité de nos produits et de rechercher des alternatives performantes à des prix accessibles.
                </p>

                <p>
                  La satisfaction de nos clients est essentielle et nous nous engageons à la préserver au quotidien. Pour toute question, conseil technique ou demande particulière, nous vous invitons à nous contacter directement.
                </p>
              </div>

              {/* Highlights List */}
              <div className="pt-2 border-t border-gray-100 grid gap-3">
                {highlights.map((h, idx) => {
                  const IconComp = h.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-gray-800">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600">
                        <IconComp size={18} />
                      </div>
                      <div>
                        <span className="text-gray-900 font-bold">{h.label}</span>
                        <span className="text-gray-500 block text-xs">{h.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 shadow-md shadow-orange-500/20"
                >
                  <MessageSquare size={18} />
                  Nous contacter
                </Link>
                <Link
                  href="/produits"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-6 py-3.5 text-sm font-bold text-gray-800 transition hover:bg-white hover:border-orange-300"
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
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Nos piliers de confiance
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            Nos 3 engagements majeurs
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Un accompagnement rigoureux pour garantir le meilleur confort de votre foyer.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {commitments.map((item) => {
            const IconComponent = item.icon;
            return (
              <article
                key={item.number}
                className="rounded-3xl bg-white p-8 border border-gray-200/80 shadow-sm transition hover:shadow-md hover:border-orange-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-black text-orange-500/40 font-serif">
                    {item.number}
                  </span>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <IconComponent size={24} />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom Callout Banner */}
      <section className="container max-w-6xl mt-16 sm:mt-20">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">
              Une question sur nos produits ou la livraison ?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-orange-100 max-w-xl">
              Notre équipe se tient à votre disposition pour préciser toutes les modalités de votre approvisionnement en Allemagne.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-black transition hover:bg-orange-50 shadow-md"
            style={{ color: '#ea580c' }}
          >
            <span style={{ color: '#ea580c' }}>Prendre contact</span>
            <ArrowRight size={18} style={{ color: '#ea580c' }} />
          </Link>
        </div>
      </section>
    </main>
  );
}
