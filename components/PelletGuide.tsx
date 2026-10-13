'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useState } from 'react';
import Link from '@/i18n/navigation';
import {
  Flame,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Package,
  Truck,
  Droplets,
  Sparkles,
  Zap,
  ArrowRight,
  Scale,
  Thermometer,
  Calculator,
  Info,
  Layers,
  ShoppingCart
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

interface GuideDetail {
  id: string;
  category: 'qualite' | 'conditionnement' | 'livraison' | 'energie';
  title: string;
  summary: string;
  badge: string;
  icon: LucideIcon;
  content: {
    subtitle: string;
    points: string[];
    technicalData?: { label: string; value: string }[];
    tip?: string;
  };
}

const guideDetails: GuideDetail[] = [
  { id: 'certifications', category: 'qualite', title: 'Comprendre ENplus A1 et DINplus', summary: 'Vérifiez les certifications indiquées sur la référence et les exigences de votre appareil.', badge: 'Certifications', icon: Award,
    content: { subtitle: 'Comment choisir une référence certifiée ?', points: [
      'ENplus et DINplus sont des systèmes de certification des granulés. Consultez les mentions figurant sur le sac et les documents du fabricant.',
      'La classe ENplus A1 concerne les caractéristiques des granulés ; elle ne garantit pas à elle seule le rendement de votre appareil.',
      'Vérifiez notamment le diamètre et la qualité exigés par la notice de votre poêle ou chaudière.',
      'La composition, les additifs éventuels et les valeurs techniques doivent être vérifiés pour la référence choisie.'
    ], tip: 'Ne supposez pas que toutes les références ont une double certification.' } },
  { id: 'composition-resineux', category: 'qualite', title: 'Composition et caractéristiques des granulés', summary: 'Comparez les informations du fabricant plutôt que la couleur du granulé.', badge: 'Composition', icon: Sparkles,
    content: { subtitle: 'Quelles informations consulter ?', points: [
      'La composition varie selon la référence. La mention « résineux » ne doit être retenue que lorsqu’elle est indiquée pour le produit.',
      'Consultez le pouvoir calorifique, l’humidité et le taux de cendres lorsqu’ils sont documentés par le fabricant.',
      'La couleur seule ne permet pas de vérifier une certification ou de conclure à la qualité d’un granulé.',
      'Les dépôts dépendent aussi des réglages, de l’entretien et des conditions de fonctionnement de l’appareil.'
    ], tip: 'Suivez la notice et demandez conseil à un professionnel en cas de dépôts inhabituels.' } },
  { id: 'conditionnement-sac', category: 'conditionnement', title: 'Sacs et palettes : comparer les formats', summary: 'Vérifiez le nombre de sacs et le poids total avant de commander.', badge: 'Conditionnement', icon: Package,
    content: { subtitle: 'Choisir selon vos besoins de stockage', points: [
      'Le catalogue propose des sacs individuels et différents conditionnements sur palette.',
      '65 sacs de 15 kg représentent 975 kg ; 66 sacs de 15 kg représentent 990 kg.',
      'Les emballages et dimensions varient selon les références. Un film de transport ne garantit pas un stockage prolongé à l’extérieur.',
      'Prévoyez un emplacement sec, accessible et adapté au poids du conditionnement.'
    ], tip: 'Si une dimension ou le volume livré manque, demandez cette précision avant l’achat.' } },
  { id: 'equivalences-fioul', category: 'energie', title: 'Estimer les besoins et comparer le coût', summary: 'La consommation dépend du logement, de l’appareil et de son utilisation.', badge: 'Estimation', icon: Zap,
    content: { subtitle: 'Une estimation reste indicative', points: [
      'L’isolation, la surface chauffée, la météo et la température souhaitée influencent la consommation.',
      'L’énergie du combustible ne correspond pas directement à la chaleur utile restituée par l’appareil.',
      'Pour comparer les coûts, utilisez les prix actuels, les consommations réelles et les rendements documentés.',
      'Le bilan environnemental dépend notamment de la fabrication, du transport et de la combustion ; aucune neutralité carbone automatique n’est annoncée.'
    ], tip: 'Votre historique de consommation constitue un point de départ plus précis qu’une estimation générale.' } },
  { id: 'conditions-livraison', category: 'livraison', title: 'Livraison des palettes et accès', summary: 'Vérifiez l’accès du camion et la zone de déchargement avant la commande.', badge: 'Livraison', icon: Truck,
    content: { subtitle: 'Préparer la réception de votre palette', points: [
      'Aucun supplément de livraison n’est facturé en Allemagne. Aucun paiement supplémentaire n’est demandé par le transporteur.',
      'Le déchargement des palettes est prévu avec un hayon et un transpalette, en bordure de propriété.',
      'Le sol doit être ferme et plan. Le gravier, l’herbe et les fortes pentes ne permettent pas le déplacement au transpalette.',
      'Signalez les restrictions d’accès et vérifiez les modalités de réception avant de commander.'
    ], tip: 'Consultez la FAQ et contactez-nous pour toute difficulté d’accès.' } },
  { id: 'stockage-conservation', category: 'livraison', title: 'Stocker ses granulés au sec', summary: 'Suivez les recommandations de stockage du fabricant.', badge: 'Stockage', icon: Droplets,
    content: { subtitle: 'Préserver les granulés de l’humidité', points: [
      'Conservez les sacs dans un endroit sec et protégé de la pluie.',
      'Évitez le contact avec un sol humide et vérifiez l’état des emballages.',
      'Un emballage de transport n’est pas une garantie d’étanchéité pour un stockage prolongé dehors.',
      'Respectez les recommandations du fabricant ; aucune conservation illimitée ni maintien garanti du rendement n’est annoncé.'
    ], tip: 'Consultez les recommandations de votre appareil avant d’utiliser des granulés dégradés.' } }
];
const faqs = [
  { q: 'Que signifient ENplus A1 et DINplus ?', a: 'Ce sont des certifications des granulés. Vérifiez les mentions de la référence et les exigences de votre appareil. Elles ne garantissent pas universellement le rendement, l’absence de dépôts ou le maintien de la garantie constructeur.' },
  { q: 'Combien de sacs prévoir pour l’hiver ?', a: 'La quantité dépend du logement, de l’isolation, de la météo et de l’utilisation de l’appareil. Appuyez-vous sur votre consommation passée. Le simulateur donne une estimation indicative.' },
  { q: 'Faut-il choisir des granulés de résineux ?', a: 'Consultez la composition et les caractéristiques documentées du produit, puis les exigences du fabricant de votre appareil. Le type de bois et la couleur ne suffisent pas à déterminer sa compatibilité.' },
  { q: 'Peut-on stocker les sacs dehors ?', a: 'Prévoyez un stockage sec et protégé de l’humidité. Le film de transport ne suffit pas pour un stockage prolongé sous la pluie.' },
  { q: 'Comment préparer la livraison ?', a: 'Prévoyez un accès carrossable pour le camion et une zone ferme et plane pour la palette. Signalez les restrictions avant la commande.' },
  { q: 'Que faire si le poêle forme des dépôts ?', a: 'Les dépôts peuvent avoir plusieurs causes : combustible, réglages ou entretien. Consultez la notice et faites contrôler l’appareil si nécessaire.' }
];

export default function PelletGuide() {
  const brenLocale = useLocale() as Locale;

  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<'all' | 'qualite' | 'conditionnement' | 'livraison' | 'energie'>('all');
  const [openDetailId, setOpenDetailId] = useState<string | null>('certifications');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Simulator / Test State
  const [appliance, setAppliance] = useState<'poele-principal' | 'poele-appoint' | 'chaudiere'>('poele-principal');
  const [surface, setSurface] = useState<'small' | 'medium' | 'large'>('medium');
  const [storage, setStorage] = useState<'palette' | 'half' | 'sacs'>('palette');
  const [addedNotice, setAddedNotice] = useState(false);

  // Recommendation Calculation
  let recommendedQuantityText = '';
  let recommendedPalettes = 1;
  let estimatedMonths = '';
  let energyEquiv = '';

  if (appliance === 'poele-appoint') {
    if (surface === 'small') {
      recommendedPalettes = 1;
      recommendedQuantityText = '1 Demi-palette (35 sacs de 15 kg)';
      estimatedMonths = '6 à 8 mois d’appoint';
      energyEquiv = '≈ 2 520 kWh d’énergie';
    } else {
      recommendedPalettes = 1;
      recommendedQuantityText = '1 Palette complète (65 sacs de 15 kg)';
      estimatedMonths = '1 saison complète d’appoint';
      energyEquiv = '≈ 4 680 kWh (~480 Litres de fioul)';
    }
  } else if (appliance === 'poele-principal') {
    if (surface === 'small') {
      recommendedPalettes = 1;
      recommendedQuantityText = '1 Palette complète (65 sacs de 15 kg)';
      estimatedMonths = '4 à 5 mois d’hiver';
      energyEquiv = '≈ 4 680 kWh (~480 Litres de fioul)';
    } else if (surface === 'medium') {
      recommendedPalettes = 2;
      recommendedQuantityText = '2 Palettes complètes (130 sacs de 15 kg)';
      estimatedMonths='Toute la saison hivernale (6 mois)';
      energyEquiv = '≈ 9 360 kWh (~960 Litres de fioul)';
    } else {
      recommendedPalettes = 3;
      recommendedQuantityText = '3 Palettes complètes (195 sacs de 15 kg)';
      estimatedMonths = '1 saison entière grand confort';
      energyEquiv = '≈ 14 040 kWh (~1 440 Litres de fioul)';
    }
  } else {
    // Chaudière
    if (surface === 'small' || surface === 'medium') {
      recommendedPalettes = 3;
      recommendedQuantityText = '3 Palettes complètes (195 sacs de 15 kg)';
      estimatedMonths = 'Saison de chauffage complète';
      energyEquiv = '≈ 14 040 kWh (~1 440 Litres de fioul)';
    } else {
      recommendedPalettes = 4;
      recommendedQuantityText = '4 Palettes complètes (260 sacs de 15 kg)';
      estimatedMonths = 'Saison complète avec eau chaude sanitaire';
      energyEquiv = '≈ 18 720 kWh (~1 920 Litres de fioul)';
    }
  }

  const handleAddRecommendedToCart = () => {
    addItem(2, recommendedPalettes);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3500);
  };

  const filteredDetails = guideDetails.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  return localizeNode((
    <div className="bg-gray-50 text-gray-900 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 text-white py-16 sm:py-20">
        <div className="container max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30 mb-6">
            <Flame size={15} className="text-orange-400 fill-orange-400" />
            Guide Pratique Bren-nholz
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Guide de sélection des granulés de bois
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-300 leading-relaxed max-w-3xl">
            Comparez les conditionnements et les caractéristiques des granulés. Vérifiez les certifications <strong className="text-orange-400">ENplus A1</strong> ou <strong className="text-orange-400">DINplus</strong> indiquées pour chaque référence et les exigences de votre appareil.
          </p>

          <p className="mt-4 text-sm sm:text-base text-gray-400 italic max-w-3xl border-l-2 border-orange-500 pl-4 py-1">
            Choisissez une référence adaptée à votre appareil et un conditionnement correspondant à vos besoins de consommation et de stockage.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 font-semibold">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
              <Award size={16} className="text-orange-400" /> ENplus A1 & DINplus
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
              <Sparkles size={16} className="text-orange-400" /> Composition selon référence
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
              <Truck size={16} className="text-orange-400" /> Livraison et conditionnements
            </div>
          </div>
        </div>
      </section>

      {/* Simulator Test Container */}
      <section className="container max-w-5xl -mt-8 relative z-10">
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-xl border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Simulateur Express
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
                Estimez vos besoins en granulés
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Obtenez une estimation indicative. La consommation réelle dépend du logement, de l’appareil et de son utilisation.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <Calculator size={18} className="text-orange-500" />
              Calcul instantané
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {/* Question 1 */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-xs text-white font-black">1</span>
                Type d’équipement
              </label>
              <div className="space-y-2">
                {[
                  { id: 'poele-principal', label: 'Poêle (chauffage principal)' },
                  { id: 'poele-appoint', label: 'Poêle (chauffage d’appoint)' },
                  { id: 'chaudiere', label: 'Chaudière à granulés' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAppliance(item.id as typeof appliance)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                      appliance === item.id
                        ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {appliance === item.id && <CheckCircle2 size={16} className="text-orange-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2 */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-xs text-white font-black">2</span>
                Surface du logement
              </label>
              <div className="space-y-2">
                {[
                  { id: 'small', label: 'Moins de 60 m²' },
                  { id: 'medium', label: '60 m² à 120 m²' },
                  { id: 'large', label: 'Plus de 120 m²' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSurface(item.id as typeof surface)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                      surface === item.id
                        ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {surface === item.id && <CheckCircle2 size={16} className="text-orange-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3 */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-xs text-white font-black">3</span>
                Espace de stockage
              </label>
              <div className="space-y-2">
                {[
                  { id: 'palette', label: 'Garage / Cave (Palette complète)' },
                  { id: 'half', label: 'Espace réduit (Demi-palette)' },
                  { id: 'sacs', label: 'Achat au sac individuel' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStorage(item.id as typeof storage)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                      storage === item.id
                        ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {storage === item.id && <CheckCircle2 size={16} className="text-orange-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Result Banner */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-6 sm:p-8 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur">
                  <Sparkles size={14} /> Recommandation Sur Mesure
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {recommendedQuantityText}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-orange-100 font-medium pt-1">
                  <span className="flex items-center gap-1.5">
                    <Thermometer size={16} /> Autonomie : {estimatedMonths}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap size={16} /> Énergie : {energyEquiv}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Truck size={16} /> Livraison à domicile en Allemagne
                  </span>
                </div>
              </div>

              <div className="shrink-0 space-y-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleAddRecommendedToCart}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black transition hover:bg-orange-50 shadow-md"
                  style={{ color: '#ea580c' }}
                >
                  <ShoppingCart size={18} style={{ color: '#ea580c' }} />
                  <span style={{ color: '#ea580c' }}>Commander la quantité recommandée</span>
                </button>
                {addedNotice && (
                  <p className="text-center text-xs font-bold text-white bg-green-600/80 px-3 py-1.5 rounded-lg animate-pulse">
                    Produit ajouté à votre panier avec succès !
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Guide Content: Categories & Explanatory Accordions */}
      <section className="container max-w-5xl mt-16 sm:mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Détails & Explications Techniques
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            Tout comprendre pour bien choisir vos granulés
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-3">
            Cliquez sur chaque sujet ci-dessous pour ouvrir les détails, normes et spécifications.
          </p>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'all', label: 'Tous les critères', icon: Layers },
            { id: 'qualite', label: 'Qualité & Normes', icon: Award },
            { id: 'conditionnement', label: 'Formats & Conditionnement', icon: Package },
            { id: 'energie', label: 'Équivalences Énergétiques', icon: Zap },
            { id: 'livraison', label: 'Livraison & Stockage', icon: Truck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-gray-950 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon size={16} className={activeTab === tab.id ? 'text-orange-400' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Accordion / Expandable Details Cards */}
        <div className="space-y-4">
          {filteredDetails.map((item) => {
            const isOpen = openDetailId === item.id;
            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-white border transition-all duration-200 ${
                  isOpen
                    ? 'border-orange-500 shadow-md ring-1 ring-orange-500/20'
                    : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {/* Accordion Header / Trigger */}
                <button
                  type="button"
                  onClick={() => setOpenDetailId(isOpen ? null : item.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition ${
                        isOpen
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                          : 'bg-orange-50 text-orange-600'
                      }`}
                    >
                      <IconComponent size={24} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gray-100 text-gray-700">
                          {item.badge}
                        </span>
                        <span className="text-xs text-orange-600 font-bold">
                          Cliquez pour lire l’explication
                        </span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-1 sm:line-clamp-none">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                      isOpen ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Expanded Content Body */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-5 sm:p-8 bg-gradient-to-b from-white to-orange-50/20 rounded-b-2xl animate-fadeIn">
                    <h4 className="font-serif text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Info size={18} className="text-orange-500" />
                      {item.content.subtitle}
                    </h4>

                    {/* Explanatory points */}
                    <ul className="space-y-3 mb-6">
                      {item.content.points.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                          <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Technical Specifications Table */}
                    {item.content.technicalData && item.content.technicalData.length > 0 && (
                      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                        <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                          <Scale size={15} className="text-orange-500" /> Spécifications & Données d’Analyse
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {item.content.technicalData.map((data, dIdx) => (
                            <div
                              key={dIdx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-xs sm:text-sm font-semibold"
                            >
                              <span className="text-gray-600">{data.label}</span>
                              <span className="text-orange-600 font-bold">{data.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expert Tip Box */}
                    {item.content.tip && (
                      <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
                        <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Conseil de l’expert Bren-nholz : </strong>
                          {item.content.tip}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="container max-w-5xl mt-16 sm:mt-20">
        <div className="rounded-3xl bg-gray-950 p-6 sm:p-10 text-white shadow-2xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
              Comparatif des Combustibles
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold mt-2">
              Quels critères comparer entre les combustibles ?
            </h2>
            <p className="text-sm text-gray-300 mt-2">
              Des points à vérifier pour comparer les combustibles, sans garantie d’économie ou de rendement.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="py-3 px-4 font-bold">Critère</th>
                  <th className="py-3 px-4 font-bold text-orange-400">Granulés de bois</th>
                  <th className="py-3 px-4 font-bold">Fioul Domestique</th>
                  <th className="py-3 px-4 font-bold">Gaz Naturel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-400">Source d&apos;énergie</td>
                  <td className="py-3.5 px-4 font-bold text-white">Bois</td>
                  <td className="py-3.5 px-4">Fossile non renouvelable</td>
                  <td className="py-3.5 px-4">Fossile non renouvelable</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-400">Bilan environnemental</td>
                  <td className="py-3.5 px-4 font-bold text-orange-400">Selon la production et l’utilisation</td>
                  <td className="py-3.5 px-4">Selon la production et l’utilisation</td>
                  <td className="py-3.5 px-4">Selon la production et l’utilisation</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-400">Pouvoir calorifique</td>
                  <td className="py-3.5 px-4 font-bold text-white">Consulter la fiche du fabricant</td>
                  <td className="py-3.5 px-4">Consulter la fiche du fournisseur</td>
                  <td className="py-3.5 px-4">Consulter la fiche du fournisseur</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-400">Automatisation poêle</td>
                  <td className="py-3.5 px-4 font-bold text-white">Selon l’appareil</td>
                  <td className="py-3.5 px-4">Oui</td>
                  <td className="py-3.5 px-4">Oui</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-400">Stabilité des prix</td>
                  <td className="py-3.5 px-4 font-bold text-orange-400">Vérifier les prix actuels</td>
                  <td className="py-3.5 px-4">Vérifier les prix actuels</td>
                  <td className="py-3.5 px-4">Vérifier les prix actuels</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="container max-w-5xl mt-16 sm:mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Foire Aux Questions
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            Questions fréquentes sur les granulés
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Des réponses précises à toutes vos interrogations avant de commander.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, fIdx) => {
            const isFaqOpen = openFaqIndex === fIdx;

            return (
              <div
                key={fIdx}
                className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:border-gray-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isFaqOpen ? null : fIdx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-bold text-gray-900 cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={20} className="text-orange-500 shrink-0" />
                    {faq.q}
                  </span>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600">
                    {isFaqOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isFaqOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4 bg-gray-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA to Product Catalog */}
      <section className="container max-w-5xl mt-16 sm:mt-20 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 sm:p-12 text-white shadow-xl">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Prêt à passer votre commande de granulés ?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-orange-100 max-w-2xl mx-auto">
            Comparez les sacs et palettes de granulés de bois du catalogue, avec livraison à domicile en Allemagne. Vérifiez les certifications indiquées sur chaque référence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-black transition hover:bg-orange-50 shadow-md"
              style={{ color: '#ea580c' }}
            >
              <span style={{ color: '#ea580c' }}>Voir tous les granulés de bois</span>
              <ArrowRight size={18} style={{ color: '#ea580c' }} />
            </Link>

          </div>
        </div>
      </section>
    </div>
  ), brenLocale);
}
