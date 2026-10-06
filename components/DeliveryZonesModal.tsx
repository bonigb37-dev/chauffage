'use client';

import { useState } from 'react';
import { CheckCircle2, MapPin, Search, Truck, X } from 'lucide-react';

export const germanRegions = [
  {
    state: 'Baden-Württemberg',
    capital: 'Stuttgart',
    cities: ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg im Breisgau', 'Heidelberg', 'Ulm', 'Heilbronn', 'Pforzheim', 'Reutlingen', 'Ludwigsburg', 'Esslingen', 'Tübingen', 'Konstanz', 'Aalen', 'Sindelfingen'],
  },
  {
    state: 'Bayern (Bavière)',
    capital: 'Munich',
    cities: ['München (Munich)', 'Nürnberg (Nuremberg)', 'Augsburg', 'Regensburg', 'Würzburg', 'Ingolstadt', 'Fürth', 'Erlangen', 'Bamberg', 'Bayreuth', 'Landshut', 'Aschaffenburg', 'Kempten', 'Passau'],
  },
  {
    state: 'Berlin',
    capital: 'Berlin',
    cities: ['Berlin (Tous arrondissements)', 'Mitte', 'Pankow', 'Charlottenburg-Wilmersdorf', 'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'],
  },
  {
    state: 'Brandenburg (Brandenbourg)',
    capital: 'Potsdam',
    cities: ['Potsdam', 'Cottbus', 'Brandenburg an der Havel', 'Frankfurt (Oder)', 'Oranienburg', 'Falkensee', 'Eberswalde', 'Bernau bei Berlin', 'Königs Wusterhausen', 'Schwedt/Oder'],
  },
  {
    state: 'Bremen (Brême)',
    capital: 'Brême',
    cities: ['Bremen (Brême)', 'Bremerhaven'],
  },
  {
    state: 'Hamburg (Hambourg)',
    capital: 'Hambourg',
    cities: ['Hamburg (Tous districts)', 'Altona', 'Bergedorf', 'Eimsbüttel', 'Hamburg-Nord', 'Hamburg-Mitte', 'Harburg', 'Wandsbek'],
  },
  {
    state: 'Hessen (Hesse)',
    capital: 'Wiesbaden',
    cities: ['Frankfurt am Main', 'Wiesbaden', 'Kassel', 'Darmstadt', 'Offenbach am Main', 'Hanau', 'Gießen', 'Marburg', 'Fulda', 'Rüsselsheim am Main', 'Bad Homburg'],
  },
  {
    state: 'Mecklenburg-Vorpommern',
    capital: 'Schwerin',
    cities: ['Rostock', 'Schwerin', 'Neubrandenburg', 'Stralsund', 'Greifswald', 'Wismar', 'Güstrow'],
  },
  {
    state: 'Niedersachsen (Basse-Saxe)',
    capital: 'Hanovre',
    cities: ['Hannover (Hanovre)', 'Braunschweig', 'Oldenburg', 'Osnabrück', 'Wolfsburg', 'Göttingen', 'Salzgitter', 'Hildesheim', 'Delmenhorst', 'Wilhelmshaven', 'Lüneburg', 'Celle'],
  },
  {
    state: 'Nordrhein-Westfalen (Rhénanie-du-Nord-Westphalie)',
    capital: 'Düsseldorf',
    cities: ['Köln (Cologne)', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Gelsenkirchen', 'Mönchengladbach', 'Aachen (Aix-la-Chapelle)', 'Krefeld', 'Oberhausen', 'Hagen', 'Hamm', 'Mülheim an der Ruhr', 'Leverkusen', 'Solingen', 'Herne', 'Neuss', 'Paderborn', 'Recklinghausen'],
  },
  {
    state: 'Rheinland-Pfalz (Rhénanie-Palatinat)',
    capital: 'Mayence',
    cities: ['Mainz (Mayence)', 'Ludwigshafen am Rhein', 'Koblenz (Coblence)', 'Trier (Trèves)', 'Kaiserslautern', 'Worms', 'Neuwied', 'Neustadt an der Weinstraße', 'Speyer', 'Frankenthal', 'Bad Kreuznach'],
  },
  {
    state: 'Saarland (Sarre)',
    capital: 'Sarrebruck',
    cities: ['Saarbrücken (Sarrebruck)', 'Merzig', 'Saarlouis', 'Neunkirchen', 'Homburg', 'Völklingen', 'Sankt Ingbert', 'Dillingen/Saar', 'Lebach'],
  },
  {
    state: 'Sachsen (Saxe)',
    capital: 'Dresde',
    cities: ['Leipzig', 'Dresden (Dresde)', 'Chemnitz', 'Zwickau', 'Plauen', 'Görlitz', 'Freiberg', 'Bautzen', 'Pirna'],
  },
  {
    state: 'Sachsen-Anhalt (Saxe-Anhalt)',
    capital: 'Magdebourg',
    cities: ['Magdeburg (Magdebourg)', 'Halle (Saale)', 'Dessau-Roßlau', 'Stendal', 'Bitterfeld-Wolfen', 'Halberstadt', 'Wernigerode'],
  },
  {
    state: 'Schleswig-Holstein',
    capital: 'Kiel',
    cities: ['Kiel', 'Lübeck', 'Flensburg', 'Neumünster', 'Norderstedt', 'Elmshorn', 'Pinneberg'],
  },
  {
    state: 'Thüringen (Thuringe)',
    capital: 'Erfurt',
    cities: ['Erfurt', 'Jena (Iéna)', 'Gera', 'Weimar', 'Gotha', 'Eisenach', 'Nordhausen', 'Suhl'],
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DeliveryZonesModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredRegions = germanRegions
    .map((region) => {
      const stateMatch = region.state.toLowerCase().includes(normalizedQuery);
      const capitalMatch = region.capital.toLowerCase().includes(normalizedQuery);
      const filteredCities = region.cities.filter((city) =>
        city.toLowerCase().includes(normalizedQuery)
      );

      if (stateMatch || capitalMatch || filteredCities.length > 0) {
        return {
          ...region,
          cities: stateMatch || capitalMatch ? region.cities : filteredCities,
        };
      }
      return null;
    })
    .filter(Boolean);

  const totalCitiesCount = germanRegions.reduce((sum, r) => sum + r.cities.length, 0);

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-gray-950/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delivery-title"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <Truck size={14} /> Livraison à domicile · Réductions sur quantité
              </span>
              <h2 id="modal-delivery-title" className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
                Zones de livraison à domicile en Allemagne
              </h2>
              <p className="mt-2 text-sm sm:text-base text-orange-100 max-w-2xl leading-relaxed">
                Nous livrons sur l’ensemble du territoire allemand (les 16 Länder, {totalCitiesCount}+ villes et communes). Les frais de transport sont ajustés selon votre adresse et nous offrons des réductions pour les commandes volumineuses.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-700" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une ville, une région ou un Land en Allemagne…"
              className="h-12 w-full rounded-2xl bg-white text-gray-900 pl-11 pr-4 text-sm font-semibold outline-none shadow-md placeholder-gray-400 focus:ring-4 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-orange-50 p-4 border border-orange-100 text-xs sm:text-sm text-orange-950 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-orange-600 shrink-0" />
              Livraison assurée par camion à hayon avec transpalette à domicile.
            </span>
            <span className="font-bold text-orange-700 bg-white px-3 py-1 rounded-full border border-orange-200">
              100 % Allemagne couverte
            </span>
          </div>

          {filteredRegions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredRegions.map((region) => (
                <div
                  key={region!.state}
                  className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5 hover:border-orange-300 transition"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                    <h3 className="font-black text-gray-950 text-base flex items-center gap-2">
                      <MapPin size={16} className="text-orange-600 shrink-0" />
                      {region!.state}
                    </h3>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-stone-200">
                      Capitale : {region!.capital}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {region!.cities.map((city) => (
                      <span
                        key={city}
                        className="inline-block rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-stone-200 shadow-2xs hover:border-orange-400 hover:text-orange-700 transition"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg font-bold text-gray-800">Aucune ville trouvée pour « {query} »</p>
              <p className="mt-1 text-sm">
                Toutes les communes d’Allemagne sont éligibles à la livraison à domicile. Contactez-nous pour connaître le tarif exact ou vos avantages sur quantité.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 text-xs sm:text-sm font-semibold text-gray-600">
          <span>16 Länder · Livraison directe à domicile</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-950 px-6 py-2.5 text-white font-bold hover:bg-orange-600 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
