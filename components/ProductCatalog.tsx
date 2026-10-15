'use client';
import { localizeNode, translate } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import ProductCard from '@/components/ProductCard';

const sectionOrder = ['Granulés de marques', 'Formats compacts', 'Bois de chauffage', 'Bois de hêtre', 'Briquettes', 'Bois d’allumage'];
const sectionDescriptions: Record<string, string> = {
  'Bois de hêtre': 'Bûches de hêtre en PackFix de 1,5 SRM, selon la qualité, le séchage et la longueur.',
  'Granulés de marques': 'Références EPH, TotalEnergies, HEIZFUXX, HELIOS, PROXIMA STAR et FireStixx.',
  'Formats compacts': 'Sacs individuels et petits conditionnements pour un approvisionnement flexible.',
  'Bois de chauffage': 'Bûches et bois densifié, proposés en différents formats.',
  'Briquettes': 'Briquettes compressées en paquets ou en palettes.',
  'Bois d’allumage': 'Bûchettes et allume-feux pour préparer le foyer.',
};

export default function ProductCatalog({ initialCategory = 'Tous les produits' }: { initialCategory?: string }) {
  const brenLocale = useLocale() as Locale;

  const { products } = useCart();
  const searchParams = useSearchParams();
  const requestedSearch = searchParams.get('search') ?? '';
  const categoryAliases: Record<string, string> = { buches: 'Bois de chauffage', granules: 'Granulés', 'bois-compresse': 'Briquettes', 'allume-feu': 'Bois d’allumage' };
  const requestedCategory = searchParams.get('categorie') ?? categoryAliases[searchParams.get('category') ?? ''];
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(requestedSearch);
  const categories = ['Tous les produits', ...new Set(products.map((product) => product.type))];
  useEffect(() => {
    setQuery(requestedSearch);
    setCategory(requestedCategory && products.some((product) => product.type === requestedCategory) ? requestedCategory : initialCategory);
  }, [products, requestedSearch, requestedCategory, initialCategory]);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Tous les produits' || product.type === category || (category === 'Granulés' && product.type.startsWith('Granulés'));
    const terms = [product.name, product.type, product.quantity, product.description]
      .filter((val): val is string => typeof val === 'string' && val.length > 0)
      .map(value => `${value} ${translate(value, brenLocale)}`)
      .join(' ')
      .toLocaleLowerCase(brenLocale);
    return matchesCategory && terms.includes((query || '').trim().toLocaleLowerCase(brenLocale));
  }), [products, category, query, brenLocale]);
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

  return localizeNode((
    <section className="container py-8 sm:py-10">
      <div className="flex flex-col gap-5 rounded-3xl border border-[#E6DCce] bg-white p-4 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher un produit" className="h-12 w-full rounded-full border border-[#E6DCce] bg-[#FAF6F0] pl-11 pr-4 outline-none transition text-[#1C1917] focus:border-[#A33D1E] focus:bg-white focus:ring-4 focus:ring-[#A33D1E]/15 placeholder:text-stone-400" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end">
          <span className="mr-1 hidden items-center gap-2 text-sm font-semibold text-[#6B5E55] lg:inline-flex"><SlidersHorizontal size={16} /> Catégories</span>
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${category === item ? 'bg-[#A33D1E] text-white shadow-sm' : 'bg-[#F4EDE4] text-[#1C1917] hover:bg-[#A33D1E] hover:text-white'}`}>{item}</button>)}
        </div>
      </div>

      <div className="mb-4 mt-5 flex items-center justify-between">
        <p className="text-sm font-medium text-[#6B5E55]">{visibleProducts.length} {visibleProducts.length === 1 ? 'Produkt' : 'Produkte'}</p>
        <p className="hidden text-sm text-[#6B5E55] sm:block">Sélectionnez une photo pour l’agrandir</p>
      </div>
      <p className="mb-4 rounded-2xl border border-[#E6DCce] bg-[#F4EDE4] px-4 py-3 text-sm leading-6 text-[#A33D1E] font-medium">Tous les prix affichés sont TTC. La TVA est déjà incluse et le total de commande correspond à la somme des prix TTC des produits.</p>
      {visibleProducts.length ? groupedProducts.map(([section, sectionProducts]) => <section key={section} className="mt-8 first:mt-0">
        <div className="mb-5 max-w-3xl border-b border-[#E6DCce] pb-3"><h2 className="text-2xl font-black text-[#1C1917] sm:text-3xl">{section}</h2><p className="mt-1 text-sm leading-6 text-[#6B5E55]">{sectionDescriptions[section]}</p></div>
        <div className={`grid items-stretch gap-3.5 sm:grid-cols-2 ${section === 'Bois d’allumage' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>{sectionProducts.map((product) => <div id={`produit-${product.id}`} key={product.id} className="h-full"><ProductCard p={product} /></div>)}</div>
      </section>) : <div className="rounded-3xl border border-dashed border-[#E6DCce] bg-[#FAF6F0] py-20 text-center"><h2 className="text-xl font-black text-[#A33D1E]">Aucun produit trouvé</h2><p className="mt-2 text-[#6B5E55]">Essayez un autre terme ou choisissez une autre catégorie.</p></div>}
    </section>
  ), brenLocale);
}
