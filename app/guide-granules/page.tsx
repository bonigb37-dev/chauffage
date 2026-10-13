'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flame,
  HelpCircle,
  Info,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import FaqSection from '@/components/FaqSection';
import { useCart } from '@/components/CartProvider';

export default function GuideGranulesPage() {
  const { addItem } = useCart();

  // Test state
  const [appliance, setAppliance] = useState<'poele' | 'chaudiere' | 'insert'>('poele');
  const [consumption, setConsumption] = useState<'petite' | 'moyenne' | 'forte'>('moyenne');
  const [storageSpace, setStorageSpace] = useState<'limite' | 'moyen' | 'grand'>('moyen');

  // Modal detail states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Recommendation logic
  const isPaletteCompleteRecommended =
    consumption === 'forte' || (consumption === 'moyenne' && storageSpace !== 'limite');

  return (
    <main className="bg-[#F4F0E5] min-h-screen text-[#1c1917]">
      {/* Header Banner in Terracotta (#A54829) */}
      <section className="bg-[#A54829] py-14 text-white sm:py-20 border-b border-[#8c3b20] shadow-md">
        <div className="container">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm border border-white/30">
            <Sparkles size={14} /> Guide de choix interactif
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl text-white">
            Guide de sélection des granulés de bois
          </h1>
          <p className="mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-[#F4F0E5]">
            Avec les granulés de bois, vous vous chauffez automatiquement, efficacement et à moindre coût, tout en bénéficiant d’un pouvoir calorifique élevé. Nos granulés sont certifiés <strong className="text-white">ENplus A1</strong> et <strong className="text-white">DINplus</strong>. Découvrez quelle quantité correspond le mieux à vos besoins de consommation et à votre espace de stockage.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="container py-12 sm:py-16 space-y-16">
        {/* ====================================================== */}
        {/* INTERACTIVE TEST SECTION */}
        {/* ====================================================== */}
        <section className="rounded-3xl border border-[#E7E0D3] bg-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#A54829] bg-[#F4F0E5] px-3 py-1 rounded-full border border-[#E7E0D3]">
              <Flame size={14} /> Test de recommandation
            </span>
            <h2 className="mt-3 text-2xl font-black text-[#123524] sm:text-3xl">
              Faites le test et trouvez la quantité parfaite de granulés
            </h2>
            <p className="mt-2 text-sm text-[#57534e] leading-relaxed">
              Répondez à 3 questions rapides pour obtenir immédiatement la recommandation adaptée à votre installation en Allemagne.
            </p>
          </div>

          {/* Test Questions Grid */}
          <div className="mt-8 grid gap-8 md:grid-cols-3 relative z-10">
            {/* Q1: Type d'installation */}
            <div className="rounded-2xl border border-[#E7E0D3] bg-[#FAF8F3] p-5 space-y-3">
              <span className="text-xs font-bold uppercase text-[#57534e] tracking-wider">1. Type d'appareil</span>
              <h3 className="font-extrabold text-sm text-[#123524]">Quel appareil utilisez-vous ?</h3>
              <div className="space-y-2 pt-1">
                {[
                  ['poele', 'Poêle à granulés individuel'],
                  ['chaudiere', 'Chaudière à granulés centrale'],
                  ['insert', 'Insert à pellets / Foyer hybryde'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAppliance(val as any)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                      appliance === val
                        ? 'border-[#A54829] bg-[#A54829] text-white shadow-sm'
                        : 'border-[#E7E0D3] bg-white text-[#1c1917] hover:border-[#A54829]'
                    }`}
                  >
                    <span>{label}</span>
                    {appliance === val && <CheckCircle2 size={15} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Consommation */}
            <div className="rounded-2xl border border-[#E7E0D3] bg-[#FAF8F3] p-5 space-y-3">
              <span className="text-xs font-bold uppercase text-[#57534e] tracking-wider">2. Consommation estimée</span>
              <h3 className="font-extrabold text-sm text-[#123524]">Votre besoin annuel ?</h3>
              <div className="space-y-2 pt-1">
                {[
                  ['petite', 'Faible (< 1 000 kg / Saison)'],
                  ['moyenne', 'Moyenne (1 500 à 2 500 kg)'],
                  ['forte', 'Élevée (> 3 000 kg / Saison)'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setConsumption(val as any)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                      consumption === val
                        ? 'border-[#A54829] bg-[#A54829] text-white shadow-sm'
                        : 'border-[#E7E0D3] bg-white text-[#1c1917] hover:border-[#A54829]'
                    }`}
                  >
                    <span>{label}</span>
                    {consumption === val && <CheckCircle2 size={15} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Espace de stockage */}
            <div className="rounded-2xl border border-[#E7E0D3] bg-[#FAF8F3] p-5 space-y-3">
              <span className="text-xs font-bold uppercase text-[#57534e] tracking-wider">3. Stockage disponible</span>
              <h3 className="font-extrabold text-sm text-[#123524]">Votre espace de stockage ?</h3>
              <div className="space-y-2 pt-1">
                {[
                  ['limite', 'Espace restreint (Quelques sacs)'],
                  ['moyen', 'Espace moyen (1 palette)'],
                  ['grand', 'Grand espace (> 2 palettes)'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStorageSpace(val as any)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                      storageSpace === val
                        ? 'border-[#A54829] bg-[#A54829] text-white shadow-sm'
                        : 'border-[#E7E0D3] bg-white text-[#1c1917] hover:border-[#A54829]'
                    }`}
                  >
                    <span>{label}</span>
                    {storageSpace === val && <CheckCircle2 size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Box */}
          <div className="mt-8 rounded-2xl bg-[#123524] p-6 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative z-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F4F0E5]/80">Résultat de votre simulation</span>
              <h3 className="mt-1 text-xl sm:text-2xl font-black text-white">
                {isPaletteCompleteRecommended
                  ? 'Recommandation : Palette complète (975 kg - 65 sacs)'
                  : 'Recommandation : Demi-palette (525 kg - 35 sacs)'}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#F4F0E5]/90 max-w-2xl leading-relaxed">
                {isPaletteCompleteRecommended
                  ? 'La palette complète de 975 kg offre le meilleur rapport prix au kilo et garantit votre approvisionnement pour toute la saison de chauffe en Allemagne.'
                  : 'La demi-palette de 525 kg est le format idéal pour tester la qualité de nos granulés certifiés DINplus ou pour les espaces de stockage limités.'}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => addItem(2)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A54829] px-5 py-3.5 text-sm font-black text-white hover:bg-[#8c3b20] transition shadow-lg whitespace-nowrap"
              >
                Commander ce format <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* ÉTAPE 1: DESCRIPTIONS DES DEUX FORMATS */}
        {/* ====================================================== */}
        <section className="space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A54829]">Étape 1</span>
            <h2 className="mt-1 text-2xl font-black text-[#123524] sm:text-4xl">
              Quelle quantité vous convient le mieux ?
            </h2>
            <p className="mt-2 text-sm text-[#57534e] max-w-3xl leading-relaxed">
              Un foyer moyen consomme environ 1 500 à 2 000 kg de granulés par an. Plus la quantité commandée est importante, plus le prix au kilo est avantageux.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Demi-palette */}
            <article className="rounded-3xl border border-[#E7E0D3] bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#F4F0E5] px-3 py-1 text-xs font-bold text-[#123524]">
                    Saisonstart / Petit stock
                  </span>
                  <span className="text-sm font-black text-[#A54829]">35 sacs · 525 kg</span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-[#123524]">Demi-palette de granulés</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  Idéale pour les petits logements, pour tester la qualité de nos granulés de résineux ou pour un réapprovisionnement en cours de saison.
                </p>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#1c1917]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#123524] shrink-0 mt-0.5" />
                    <span>Format compact très facile à caser dans un garage ou abri.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#123524] shrink-0 mt-0.5" />
                    <span>35 sacs en papier de 15 kg faciles à manipuler.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#123524] shrink-0 mt-0.5" />
                    <span>Granulés 100 % résineux certifiés ENplus A1 & DINplus.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E7E0D3] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('demi-palette')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A54829] hover:underline"
                >
                  <Info size={15} /> Voir les détails & dimensions
                </button>
                <Link
                  href="/produits?categorie=Granul%C3%A9s#catalogue"
                  className="rounded-xl bg-[#123524] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1b4d35] transition"
                >
                  Voir l'offre
                </Link>
              </div>
            </article>

            {/* Palette complète */}
            <article className="rounded-3xl border-2 border-[#A54829] bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#A54829] text-white font-black text-[10px] uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow">
                Meilleur prix au kg
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#F4F0E5] px-3 py-1 text-xs font-bold text-[#123524] border border-[#E7E0D3]">
                    Grand Vorrat / Saison
                  </span>
                  <span className="text-sm font-black text-[#A54829]">65 sacs · 975 kg</span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-[#123524]">Palette complète de granulés</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#57534e] leading-relaxed">
                  L’option la plus économique pour toute la saison de chauffage. Bénéficiez du tarif au kilo le plus bas de notre catalogue.
                </p>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#1c1917]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#123524] shrink-0 mt-0.5" />
                    <span><b>Prix le plus bas au kilo</b> grâce au tarif de gros sur palette complète.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#123524] shrink-0 mt-0.5" />
                    <span>65 sacs papier robustes protégés par un film étanche.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#123524] shrink-0 mt-0.5" />
                    <span>Pouvoir calorifique élevé (≥ 4,6 kWh/kg) et très faible taux de cendres (≤ 0,7 %).</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E7E0D3] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('palette-complete')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A54829] hover:underline"
                >
                  <Info size={15} /> Fiche technique & livraison
                </button>
                <button
                  type="button"
                  onClick={() => addItem(2)}
                  className="rounded-xl bg-[#123524] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#1b4d35] transition shadow-md"
                >
                  Ajouter au panier
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* ====================================================== */}
        {/* ÉTAPE 2: COMPARATIF DES CONDITIONNEMENTS */}
        {/* ====================================================== */}
        <section className="rounded-3xl border border-[#E7E0D3] bg-white p-6 sm:p-9 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A54829]">Étape 2</span>
          <h2 className="mt-1 text-2xl font-black text-[#123524] sm:text-3xl">
            Comparatif des conditionnements
          </h2>
          <p className="mt-2 text-sm text-[#57534e] max-w-2xl">
            Les deux conditionnements contiennent des granulés certifiés ENplus A1 de qualité supérieure. Seule la quantité et le prix au kilo diffèrent.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E7E0D3] bg-[#F4F0E5] text-[#123524]">
                  <th className="p-4 font-extrabold">Caractéristique</th>
                  <th className="p-4 font-extrabold text-[#A54829]">Demi-palette (525 kg)</th>
                  <th className="p-4 font-extrabold text-[#A54829]">Palette complète (975 kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D3]">
                <tr>
                  <td className="p-4 font-bold text-[#1c1917]">Nombre de sacs</td>
                  <td className="p-4 text-[#57534e]">35 sacs de 15 kg</td>
                  <td className="p-4 font-bold text-[#1c1917]">65 sacs de 15 kg</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-[#1c1917]">Poids net total</td>
                  <td className="p-4 text-[#57534e]">525 kg</td>
                  <td className="p-4 font-bold text-[#1c1917]">975 kg</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-[#1c1917]">Dimensions au sol</td>
                  <td className="p-4 text-[#57534e]">120 × 80 cm (Hauteur ~1,0 m)</td>
                  <td className="p-4 text-[#57534e]">120 × 80 cm (Hauteur ~1,6 m)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-[#1c1917]">Usage recommandé</td>
                  <td className="p-4 text-[#57534e]">Stockage restreint, essai, appoint</td>
                  <td className="p-4 font-bold text-[#123524]">Chauffage principal toute la saison</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-[#1c1917]">Prix au kilo</td>
                  <td className="p-4 text-[#57534e]">Standard</td>
                  <td className="p-4 font-bold text-[#123524]">Économique (-15 % par rapport au sac)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ====================================================== */}
        {/* CRITÈRES DE QUALITÉ ENPLUS A1 & DINPLUS */}
        {/* ====================================================== */}
        <section className="rounded-3xl border border-[#E7E0D3] bg-white p-6 sm:p-9 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E0D3] pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#A54829]">Normes & Sécurité</span>
              <h2 className="mt-1 text-2xl font-black text-[#123524] sm:text-3xl">
                Spécifications techniques de nos granulés
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-[#F4F0E5] px-3.5 py-1.5 text-xs font-black text-[#123524] border border-[#E7E0D3]">
                ENplus A1
              </span>
              <span className="rounded-xl bg-[#F4F0E5] px-3.5 py-1.5 text-xs font-black text-[#A54829] border border-[#E7E0D3]">
                DINplus
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                id: 'calorifique',
                title: 'Pouvoir calorifique élevé (≥ 4,6 kWh/kg)',
                desc: 'Un rendement thermique maximal pour chauffer rapidement votre maison en consommant moins de matière.',
              },
              {
                id: 'humidite',
                title: 'Taux d’humidité très bas (≤ 8 %)',
                desc: 'Un séchage rigoureux garantit un allumage facile et évite l’encrassement du brasier.',
              },
              {
                id: 'cendres',
                title: 'Taux de cendres réduit (≤ 0,7 %)',
                desc: 'Moins de résidus dans le cendrier de votre poêle, nécessitant un nettoyage beaucoup moins fréquent.',
              },
              {
                id: 'fines',
                title: 'Taux de poussière minimal (≤ 0,5 %)',
                desc: 'Les sacs en papier renforcé protègent les granulés de l’effritement et préservent la vis sans fin.',
              },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#E7E0D3] bg-[#FAF8F3] p-5 space-y-2"
              >
                <h3 className="font-extrabold text-sm text-[#123524] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#A54829] shrink-0" /> {item.title}
                </h3>
                <p className="text-xs text-[#57534e] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================== */}
        {/* ASSISTANCE EXPERT & CONTACT */}
        {/* ====================================================== */}
        <section className="rounded-3xl bg-[#A54829] p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#F4F0E5]">Conseil personnalisé</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">Encore un doute sur la quantité à commander ?</h2>
            <p className="mt-3 text-sm text-[#F4F0E5]/90 max-w-xl leading-relaxed">
              Nos experts en granulés de bois vous conseillent gratuitement pour adapter votre commande selon votre installation en Allemagne.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123524] px-6 py-4 font-black text-white hover:bg-[#1b4d35] transition shadow-lg text-sm"
            >
              Demander un devis <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* FAQ Guide Section */}
        <FaqSection compact />
      </div>

      {/* MODAL / DETAILS DRAWER */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-gray-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-2xl sm:p-8 border border-[#E7E0D3]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E7E0D3] pb-4">
              <h3 className="text-xl font-black text-[#123524] flex items-center gap-2">
                <PackageCheck className="text-[#A54829]" size={22} />
                {activeModal === 'demi-palette'
                  ? 'Détails : Demi-palette (525 kg)'
                  : 'Détails : Palette complète (975 kg)'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F0E5] hover:bg-[#e7e0d3]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm text-[#57534e] overflow-y-auto pr-1">
              {activeModal === 'demi-palette' ? (
                <>
                  <p>
                    <b>Composition :</b> 35 sacs de 15 kg en papier résistant, soit 525 kg net de granulés de résineux ENplus A1 / DINplus.
                  </p>
                  <p>
                    <b>Dimensions :</b> Palette européenne 120 × 80 cm, hauteur environ 1,00 m.
                  </p>
                  <p>
                    <b>Livraison :</b> Livrée à domicile en Allemagne par camion avec hayon élévateur et transpalette manuel.
                  </p>
                  <p>
                    <b>Conseil de conservation :</b> Conserver à l’abri de l’humidité directe. Les sacs en papier permettent une excellente aération des granulés.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <b>Composition :</b> 65 sacs papier de 15 kg, soit 975 kg net de granulés haut rendement certifiés DINplus & ENplus A1.
                  </p>
                  <p>
                    <b>Dimensions :</b> Palette européenne 120 × 80 cm, hauteur environ 1,60 m. Protections d'angles et housse plastique étanche.
                  </p>
                  <p>
                    <b>Économie :</b> Tarif le plus avantageux au kilo de notre catalogue pour chauffer tout l'hiver en Allemagne.
                  </p>
                  <p>
                    <b>Livraison :</b> Transporteur spécialisé avec prise de rendez-vous préalable.
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full rounded-xl bg-[#123524] py-3 text-sm font-bold text-white hover:bg-[#1b4d35] transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
