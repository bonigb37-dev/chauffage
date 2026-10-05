import Link from 'next/link';
import { ArrowRight, Boxes } from 'lucide-react';

export default function ContactCTA() {
  return (
    <section className="container py-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-orange-600 px-7 py-14 text-white sm:px-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div><p className="font-bold uppercase tracking-[.2em] text-orange-100">Un projet ?</p><h2 className="mt-3 max-w-2xl text-4xl font-black sm:text-5xl">Préparons votre approvisionnement en bois de chauffage.</h2><p className="mt-4 max-w-xl text-orange-50">Demandez un devis pour vos produits, volumes et modalités de livraison.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-orange-700">Demander un devis <ArrowRight size={18}/></Link><Link href="/produits#catalogue" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-4 font-bold"><Boxes size={18}/> Voir les produits</Link></div>
        </div>
      </div>
    </section>
  );
}
