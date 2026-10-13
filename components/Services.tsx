import Image from 'next/image';
import { deliveryRegions } from '@/lib/delivery-regions';
import Link from '@/i18n/navigation';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { ArrowRight, Mail, Phone, Truck } from 'lucide-react';
import { storeConfig, deliverySummary } from '@/lib/store-config';

export default function Services() {
  const locale = useLocale() as Locale;
  return localizeNode((
    <section id="livraison" data-analytics-section="delivery" className="relative isolate scroll-mt-24 overflow-hidden bg-[#A54829] py-16 text-white sm:py-24 shadow-xl">
      <Image src="/B5.jpg" alt="" aria-hidden="true" fill sizes="100vw" className="object-cover opacity-15" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#A54829]/95 via-[#A54829]/80 to-[#A54829]/40" />
      <div className="container relative">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-[#F4F0E5]"><Truck size={18} />Zone de livraison</p>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl text-white">Votre bois de chauffage,<br /><span className="text-[#F4F0E5]">livré en Allemagne.</span></h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#F4F0E5]/90">{deliverySummary}</p>
            <Link href="/produits#catalogue" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#123524] px-6 py-4 font-bold text-white transition hover:bg-[#1b4d35] shadow-lg">Choisir mes produits <ArrowRight size={18} /></Link>
          </div>
          <div className="relative aspect-[1.7/1] min-w-0">
            <Image src="/delivery-truck-bren-nholz-20261013.png" alt="Camion personnalisé Bren-nholz — Leylines Park" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain drop-shadow-2xl" />
          </div>
        </div>
        <div className="mt-12 grid gap-8 border-t border-white/20 pt-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div><p className="text-sm font-bold uppercase tracking-widest text-[#F4F0E5]">Régions</p><h3 className="mt-3 text-2xl font-black text-white">Livraison dans les 16 Länder</h3></div>
          <ul className="delivery-regions">{deliveryRegions.map(region => <li key={region.slug}><Link href={`/livraison/${region.slug}`} className="delivery-region-link"><span className="min-w-0 break-words [hyphens:auto]" lang="de">{region.name}</span><ArrowRight size={16} className="delivery-region-arrow" /></Link></li>)}</ul>
        </div>
        <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-white/20 bg-white/10 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-white">
          <span className="font-bold">{storeConfig.name}</span>
          <a data-original-content href={`tel:${storeConfig.phoneHref}`} className="inline-flex items-center gap-2 hover:text-[#F4F0E5]"><Phone size={18} />{storeConfig.phone}</a>
          <a data-original-content href={`mailto:${storeConfig.email}`} className="inline-flex min-w-0 items-center gap-2 break-all hover:text-[#F4F0E5]"><Mail size={18} />{storeConfig.email}</a>
          <Link href="/services" className="inline-flex items-center gap-2 font-bold text-[#F4F0E5] hover:text-white">Informations de livraison <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  ), locale);
}
