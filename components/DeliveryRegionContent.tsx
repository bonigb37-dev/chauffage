'use client';
import { useState, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import { ArrowLeft, ArrowRight, MapPin, Search, Truck } from 'lucide-react';
import { deliveryMapUrl, type DeliveryRegion } from '@/lib/delivery-regions';
import DeliveryInformation from '@/components/DeliveryInformation';
const copy = {
 fr: { back: 'Retour aux zones de livraison', title: 'Livraison en', intro: 'Retrouvez votre ville ou affichez votre adresse de livraison sur la carte.', cities: 'Quelques villes desservies', note: 'Toutes les communes de cette région sont desservies. Cette liste donne des exemples ; votre ville peut être livrée même si elle n’apparaît pas ici.', search: 'Votre ville ou adresse de livraison', placeholder: 'Ville, code postal ou rue et numéro', map: 'Afficher sur Google Maps', mapNote: 'La carte s’ouvre dans un nouvel onglet. Votre adresse n’est pas enregistrée par ce formulaire.', buy: 'Choisir mes produits', conditions: 'Conditions de livraison' },
 de: { back: 'Zurück zu den Liefergebieten', title: 'Lieferung in', intro: 'Finden Sie Ihre Stadt oder zeigen Sie Ihre Lieferadresse auf der Karte an.', cities: 'Beispiele für belieferte Städte', note: 'Wir liefern in alle Gemeinden dieser Region. Die Liste zeigt Beispiele; auch nicht aufgeführte Orte werden beliefert.', search: 'Ihre Stadt oder Lieferadresse', placeholder: 'Stadt, Postleitzahl oder Straße und Hausnummer', map: 'Auf Google Maps anzeigen', mapNote: 'Die Karte öffnet sich in einem neuen Tab. Dieses Formular speichert Ihre Adresse nicht.', buy: 'Produkte auswählen', conditions: 'Lieferbedingungen' },
 en: { back: 'Back to delivery areas', title: 'Delivery in', intro: 'Find your city or view your delivery address on the map.', cities: 'Examples of cities served', note: 'We deliver to all municipalities in this region. These cities are examples; your town is covered even if it is not listed.', search: 'Your city or delivery address', placeholder: 'City, postcode or street and house number', map: 'View on Google Maps', mapNote: 'The map opens in a new tab. This form does not store your address.', buy: 'Choose my products', conditions: 'Delivery conditions' },
};
export default function DeliveryRegionContent({ region }: { region: DeliveryRegion }) {
 const locale = useLocale() as keyof typeof copy, c = copy[locale] ?? copy.fr;
 const [query, setQuery] = useState('');
 function showAddress(event: FormEvent<HTMLFormElement>) {
   event.preventDefault(); if (query.trim().length < 2) return;
   window.open(deliveryMapUrl(query, region.name), '_blank', 'noopener,noreferrer');
 }
 return <main data-original-content className="bg-[#fffaf5] py-12 sm:py-20"><div className="container max-w-5xl">
   <Link href="/#livraison" className="inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:underline"><ArrowLeft size={17} />{c.back}</Link>
   <p className="mt-8 flex items-center gap-2 font-bold uppercase tracking-widest text-orange-600"><Truck size={20} />Bren-nholz — Leylines Park</p>
   <h1 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-5xl">{c.title} {region.name}</h1>
   <p className="mt-5 text-lg leading-8 text-gray-600">{c.intro}</p>
   <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
     <h2 className="text-xl font-black">{c.search}</h2>
     <form onSubmit={showAddress} className="mt-5 flex flex-col gap-3 sm:flex-row">
       <label className="relative flex-1"><span className="sr-only">{c.search}</span><Search size={18} className="pointer-events-none absolute left-4 top-4 text-gray-400" /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={c.placeholder} required minLength={2} maxLength={180} className="w-full rounded-xl border border-stone-300 bg-stone-50 py-3.5 pl-11 pr-4 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></label>
       <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white hover:bg-orange-700"><MapPin size={18} />{c.map}</button>
     </form>
     <p className="mt-3 text-sm leading-6 text-gray-500">{c.mapNote}</p>
   </section>
   <section className="mt-10"><h2 className="text-2xl font-black">{c.cities}</h2><p className="mt-3 max-w-3xl leading-7 text-gray-600">{c.note}</p>
     <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{region.cities.map(city => <li key={city}><a href={deliveryMapUrl(city, region.name)} target="_blank" rel="noopener noreferrer" className="flex h-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-5 font-bold transition hover:border-orange-400 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><span>{city}</span><MapPin size={18} className="shrink-0 text-orange-600" /></a></li>)}</ul>
   </section>
   <section className="mt-10 rounded-2xl bg-orange-50 p-5 sm:p-7"><h2 className="text-xl font-black">{c.conditions}</h2><DeliveryInformation /></section>
   <Link href="/produits#catalogue" className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-4 font-bold text-white hover:bg-orange-700">{c.buy}<ArrowRight size={18} /></Link>
 </div></main>;
}
