import { BadgeCheck, Boxes, CheckCircle2, Truck } from 'lucide-react';

const services = [
  { icon: Boxes, title: 'Une gamme claire', text: 'Granulés, bûches, briquettes et bois d’allumage réunis dans un même catalogue.' },
  { icon: BadgeCheck, title: 'Conseil sur le format', text: 'Nous vous aidons à comparer les conditionnements selon votre appareil et votre espace de stockage.' },
  { icon: Truck, title: 'Livraison à organiser', text: 'Parlons du volume, de votre adresse et des modalités possibles avant votre commande.' },
];

export default function Services() {
  return (
    <section className="bg-gray-950 py-24 text-white">
      <div className="container">
        <div className="max-w-2xl"><p className="font-bold uppercase tracking-[.2em] text-orange-400">Notre accompagnement</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Du bon combustible au bon format.</h2></div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">{services.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-7"><Icon className="text-orange-400" size={30} /><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-gray-400">{text}</p><div className="mt-6 flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 size={16} className="text-orange-400" />Échange personnalisé</div></div>)}</div>
      </div>
    </section>
  );
}
