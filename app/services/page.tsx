import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Conseils et livraison de combustibles bois | Bren-nholz", "Comparez les conditionnements de bois, granulés et briquettes. Contactez notre équipe pour préciser votre besoin et les conditions de réception.", "/services"))); }

import Link from '@/i18n/navigation';
import { ArrowRight, ClipboardCheck, MessageCircle, Truck } from 'lucide-react';
import Services from '@/components/Services';
import FireBrazier from '@/components/FireBrazier';

const steps = [
  { icon: MessageCircle, number: '01', title: 'Échangeons sur votre besoin', text: 'Indiquez le type de combustible recherché, le volume et votre commune.' },
  { icon: ClipboardCheck, number: '02', title: 'Recevez une proposition', text: 'Nous précisons les formats, la disponibilité et le prix selon les références proposées.' },
  { icon: Truck, number: '03', title: 'Organisons la réception', text: 'Nous convenons ensemble des modalités de retrait ou de livraison.' },
];

export default function ServicesPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <main>
      <section className="relative overflow-hidden bg-[#FAF6F0] py-20 sm:py-24">
        <FireBrazier variant="light" intensity="high" className="z-0" />
        <div className="container relative z-10">
          <p className="font-bold uppercase tracking-[.2em] text-[#A33D1E]">Conseils & approvisionnement</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-[#1C1917] sm:text-6xl">Conseils pour choisir et recevoir vos combustibles bois</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6B5E55]">Comparez les combustibles et leurs conditionnements, puis échangez avec notre équipe pour préparer votre commande.</p>
        </div>
      </section>
      <Services />
      <section className="container py-20 sm:py-24"><div className="max-w-2xl"><p className="font-bold uppercase tracking-[.2em] text-orange-600">Comment ça marche</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Trois étapes pour votre commande.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(({ icon: Icon, number, title, text }) => <article key={number} className="rounded-3xl border border-gray-200 p-7"><div className="flex items-center justify-between"><span className="text-sm font-black tracking-widest text-orange-600">{number}</span><Icon className="text-orange-600" size={22} /></div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-gray-600">{text}</p></article>)}</div><Link href="/contact" className="mt-9 inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-4 font-bold text-white hover:bg-orange-700">Parler de mon besoin <ArrowRight size={18} /></Link></section>
    </main>
  ), brenLocale);
}
