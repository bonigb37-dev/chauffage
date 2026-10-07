'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import ProductCard from '@/components/ProductCard';

const sectionOrder = ['Granulés de marques', 'Formats compacts', 'Autres granulés', 'Bois de chauffage', 'Briquettes', 'Bois d’allumage'];
const sectionDescriptions: Record<string, string> = {
  'Granulés de marques': 'Références EPH, TotalEnergies, HEIZFUXX, HELIOS, PROXIMA STAR et FireStixx.',
  'Formats compacts': 'Sacs individuels et petits conditionnements pour un approvisionnement flexible.',
  'Autres granulés': 'Granulés en palette et formats spécifiques. Vérifiez toujours la compatibilité avec votre appareil.',
  'Bois de chauffage': 'Bûches et bois densifié, proposés en différents formats.',
  'Briquettes': 'Briquettes compressées en paquets ou en palettes.',
  'Bois d’allumage': 'Bûchettes et allume-feux pour préparer le foyer.',
};

export default function ProductCatalog() {
  const { products } = useCart();
  const [category, setCategory] = useState('Tous les produits');
  const [query, setQuery] = useState('');
  const categories = ['Tous les produits', ...new Set(products.map((product) => product.type))];
  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get('categorie');
    if (requestedCategory && products.some((product) => product.type === requestedCategory)) {
      setCategory(requestedCategory);
    }
  }, [products]);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Tous les produits' || product.type === category || (category === 'Granulés' && product.type.startsWith('Granulés'));
    const terms = `${product.name} ${product.type} ${product.quantity} ${product.description}`.toLocaleLowerCase('fr');
    return matchesCategory && terms.includes(query.trim().toLocaleLowerCase('fr'));
  }), [products, category, query]);
  const groupedProducts = useMemo(() => {
    const grouped = new Map<string, typeof visibleProducts>();
    for (const product of visibleProducts) {
      const section = product.section ?? product.type;
      grouped.set(section, [...(grouped.get(section) ?? []), product]);
    }
    const ordered = sectionOrder.flatMap((section) => grouped.has(section) ? [[section, grouped.get(section)!] as const] : []);
    const customSections = [...grouped.entries()].filter(([section]) => !sectionOrder.includes(section));
    return [...ordered, ...customSections];
  }, [visibleProducts]);

  return (
    <section className="container py-8 sm:py-10">
      <div className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher un produit" className="h-12 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-4 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end">
          <span className="mr-1 hidden items-center gap-2 text-sm font-semibold text-gray-500 lg:inline-flex"><SlidersHorizontal size={16} /> Catégories</span>
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${category === item ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-700'}`}>{item}</button>)}
        </div>
      </div>

      {/* Guide Callout Banner inside Product Catalog */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white backdrop-blur">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black leading-snug">
              Besoin d’aide pour choisir votre quantité de granulés de bois ?
            </h3>
            <p className="text-xs sm:text-sm text-orange-100">
              Calculez vos besoins et consultez le guide de sélection interactif complet.
            </p>
          </div>
        </div>
        <Link
          href="/guide-pellets"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs sm:text-sm font-black transition hover:bg-orange-50 shadow-sm"
          style={{ color: '#ea580c' }}
        >
          <span style={{ color: '#ea580c' }}>Consulter le guide</span>
          <ArrowRight size={16} style={{ color: '#ea580c' }} />
        </Link>
      </div>

      <div className="mb-4 mt-5 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{visibleProducts.length} produit{visibleProducts.length > 1 ? 's' : ''}</p>
        <p className="hidden text-sm text-gray-500 sm:block">Sélectionnez une photo pour l’agrandir</p>
      </div>
      <p className="mb-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-950">Prix et disponibilités susceptibles d’évoluer. Les tarifs par volume et délais restent à confirmer avant toute commande.</p>
      {visibleProducts.length ? groupedProducts.map(([section, sectionProducts]) => <section key={section} className="mt-8 first:mt-0">
        <div className="mb-5 max-w-3xl border-b border-stone-200 pb-3"><h2 className="text-2xl font-black text-gray-950 sm:text-3xl">{section}</h2><p className="mt-1 text-sm leading-6 text-gray-500">{sectionDescriptions[section]}</p></div>
        <div className="grid items-stretch gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">{sectionProducts.map((product) => <div id={`produit-${product.id}`} key={product.id} className="h-full"><ProductCard p={product} /></div>)}</div>
      </section>) : <div className="rounded-3xl border border-dashed border-gray-300 py-20 text-center"><h2 className="text-xl font-black">Aucun produit trouvé</h2><p className="mt-2 text-gray-500">Essayez un autre terme ou choisissez une autre catégorie.</p></div>}
    </section>
  );
}
