import { ArrowDown, ArrowRight, BadgeCheck, Boxes, Search } from 'lucide-react';
import ProductCatalog from '@/components/ProductCatalog';
import { Suspense } from 'react';
import ProductHeroShowcase from '@/components/ProductHeroShowcase';
import { products } from '@/lib/products';
const productFamilyCount = new Set(products.map((product) => product.type)).size;

const benefits = [
  { icon: BadgeCheck, title: 'Des combustibles adaptés', text: 'Granulés, bois et briquettes pour différents appareils.' },
  { icon: Boxes, title: 'Plusieurs conditionnements', text: 'Du sac individuel à la palette, selon vos besoins.' },
  { icon: Search, title: 'Un conseil avant commande', text: 'Notre équipe vous oriente vers le format approprié.' },
];

export default function ProductsPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#f8f5ee]">
        <div className="container grid min-h-[380px] items-center gap-8 py-10 lg:grid-cols-[1fr_0.9fr] lg:py-12">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-6xl">La chaleur du bois, <span className="text-orange-600">bien choisie.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-600">Comparez les marques de granulés, les palettes et les différents conditionnements. Retrouvez aussi notre sélection de bois de chauffage, de briquettes et de produits d’allumage.</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="#catalogue" className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-900/10 transition hover:bg-orange-700">Achetez maintenant <ArrowDown size={18} /></a><a href="#catalogue" className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-4 font-bold text-gray-800 transition hover:border-orange-400">Découvrir le catalogue <ArrowRight size={18} /></a></div>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-4 border-t border-stone-300 pt-4"><div><b className="block text-2xl font-black">{products.length}</b><span className="text-sm text-gray-500">références</span></div><div><b className="block text-2xl font-black">{productFamilyCount}</b><span className="text-sm text-gray-500">familles de produits</span></div><div><b className="block text-2xl font-black">6</b><span className="text-sm text-gray-500">marques de granulés</span></div></div>
          </div>
          <ProductHeroShowcase />
        </div>
      </section>
      <section className="border-b border-stone-100 bg-white">
        <div className="container grid gap-6 py-8 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><Icon size={21} /></span><div><h2 className="font-bold text-gray-900">{title}</h2><p className="mt-1 text-sm leading-6 text-gray-500">{text}</p></div></div>)}</div>
      </section>
      <div id="catalogue" className="scroll-mt-24"><Suspense fallback={<p className="container py-8" role="status">Chargement des produits…</p>}><ProductCatalog /></Suspense></div>
    </main>
  );
}
