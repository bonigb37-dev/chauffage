import Image from 'next/image';
import Link from '@/i18n/navigation';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { ArrowRight, Mail, Phone, Truck } from 'lucide-react';
import { storeConfig, deliverySummary, deliveryAccess } from '@/lib/store-config';

const regions = ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'];

export default function Services() {
  const locale = useLocale() as Locale;
  return localizeNode((
    <section id="livraison" data-analytics-section="delivery" className="relative isolate scroll-mt-24 overflow-hidden bg-stone-950 py-16 text-white sm:py-24">
      <Image src="/delivery-wood-background.png" alt="" aria-hidden="true" fill sizes="100vw" className="object-cover opacity-25" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/65 to-stone-950/35" />
      <div className="container relative">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-widest"><Truck size={18} />Zone de livraison</p>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Votre bois de chauffage,<br /><span className="text-orange-400">livré en Allemagne.</span></h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-200">{deliverySummary}</p>
            <Link href="/produits#catalogue" className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-4 font-bold text-white transition hover:bg-orange-600">Choisir mes produits <ArrowRight size={18} /></Link>
          </div>
          <div className="relative aspect-[1.7/1] min-w-0">
            <Image src="/delivery-truck-bren-nholz-20261013.png" alt="Camion personnalisé Bren-nholz — Leylines Park" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain drop-shadow-2xl" />
          </div>
        </div>
        <div className="mt-12 grid gap-8 border-t border-white/15 pt-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div><p className="text-sm font-bold uppercase tracking-widest text-orange-400">Régions</p><h3 className="mt-3 text-2xl font-black">Livraison dans les 16 Länder</h3><p className="mt-4 leading-7 text-stone-300">{deliveryAccess}</p></div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{regions.map(region => <li key={region} className="flex items-center rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-sm font-bold text-stone-900">{region}</li>)}</ul>
        </div>
        <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-white/15 bg-white/5 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span className="font-bold">{storeConfig.name}</span>
          <a data-original-content href={`tel:${storeConfig.phoneHref}`} className="inline-flex items-center gap-2 hover:text-orange-300"><Phone size={18} />{storeConfig.phone}</a>
          <a data-original-content href={`mailto:${storeConfig.email}`} className="inline-flex min-w-0 items-center gap-2 break-all hover:text-orange-300"><Mail size={18} />{storeConfig.email}</a>
          <Link href="/services" className="inline-flex items-center gap-2 font-bold text-orange-300 hover:text-orange-200">Informations de livraison <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  ), locale);
}
