'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import Link from '@/i18n/navigation';
import { MapPin, Truck, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const deliveryRegions = [
  { name: 'Bade-Wurtemberg (Baden-Württemberg)', cities: 'Stuttgart, Mannheim, Karlsruhe, Freiburg im Breisgau, Heidelberg, Ulm' },
  { name: 'Bavière (Bayern)', cities: 'München, Nürnberg, Augsburg, Regensburg, Würzburg, Ingolstadt' },
  { name: 'Berlin', cities: 'Berlin et tous ses quartiers' },
  { name: 'Brandebourg (Brandenburg)', cities: 'Potsdam, Cottbus, Brandenburg an der Havel, Frankfurt (Oder)' },
  { name: 'Brême (Bremen)', cities: 'Bremen, Bremerhaven' },
  { name: 'Hambourg (Hamburg)', cities: 'Hamburg et tous ses quartiers' },
  { name: 'Hesse (Hessen)', cities: 'Frankfurt am Main, Wiesbaden, Kassel, Darmstadt, Offenbach am Main' },
  { name: 'Mecklembourg-Poméranie-Occidentale (Mecklenburg-Vorpommern)', cities: 'Rostock, Schwerin, Neubrandenburg, Stralsund, Greifswald' },
  { name: 'Basse-Saxe (Niedersachsen)', cities: 'Hannover, Braunschweig, Oldenburg, Osnabrück, Wolfsburg, Göttingen' },
  { name: 'Rhénanie-du-Nord-Westphalie (Nordrhein-Westfalen)', cities: 'Köln, Düsseldorf, Dortmund, Essen, Münster, Bielefeld, Aachen, Gronau' },
  { name: 'Rhénanie-Palatinat (Rheinland-Pfalz)', cities: 'Mainz, Ludwigshafen am Rhein, Koblenz, Trier, Kaiserslautern' },
  { name: 'Sarre (Saarland)', cities: 'Saarbrücken, Neunkirchen, Homburg, Saarlouis, Merzig' },
  { name: 'Saxe (Sachsen)', cities: 'Leipzig, Dresden, Chemnitz, Zwickau, Görlitz' },
  { name: 'Saxe-Anhalt (Sachsen-Anhalt)', cities: 'Magdeburg, Halle (Saale), Dessau-Roßlau, Wittenberg' },
  { name: 'Schleswig-Holstein', cities: 'Kiel, Lübeck, Flensburg, Neumünster, Norderstedt' },
  { name: 'Thuringe (Thüringen)', cities: 'Erfurt, Jena, Gera, Weimar, Eisenach' },
];

export default function DeliveryZonesModal({ isOpen, onClose }: Props) {
  const brenLocale = useLocale() as Locale;

  if (!isOpen) return null;

  return localizeNode(<div className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-gray-950/80 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-labelledby="modal-delivery-title" onClick={onClose}>
    <section className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white text-gray-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider"><Truck size={14} /> Livraison en Allemagne</span>
            <h2 id="modal-delivery-title" className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Livraison en Allemagne · Frais calculés selon la distance</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-100 sm:text-base">Les frais de livraison s’ajoutent au prix de nos produits. Aucun frais supplémentaire n’est à régler au transporteur. Communiquez votre code postal allemand pour vérifier les conditions d’accès à votre adresse.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer la fenêtre" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 transition hover:bg-white/30"><X size={20} /></button>
        </div>
      </div>
      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-bold">Nos zones de livraison à domicile</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">Nous livrons dans les 16 Länder d’Allemagne, dans toutes les villes et communes. Les villes ci-dessous sont des exemples : votre commune est également couverte même si elle ne figure pas dans cette liste. Les conditions d’accès à votre adresse restent à vérifier avant la commande.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Les 16 Länder desservis">
            {deliveryRegions.map((region) => (
              <li key={region.name} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <h4 className="text-sm font-bold text-gray-900">{region.name}</h4>
                <p className="mt-1 text-sm leading-6 text-gray-600">{region.cities}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
          <MapPin size={19} className="mt-0.5 shrink-0 text-orange-700" />
          <p>La livraison est prévue sous 2 à 4 jours ouvrables après réception effective du paiement. Signalez les restrictions d’accès avant de commander ; aucun supplément de transport ne sera imposé après validation.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/services" onClick={onClose} className="inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700">Vérifier les modalités de livraison</Link>
          <button type="button" onClick={onClose} className="rounded-full border border-stone-300 px-6 py-3 font-bold text-gray-800 hover:border-orange-500">Fermer</button>
        </div>
      </div>
    </section>
  </div>, brenLocale);
}
