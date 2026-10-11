
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { productCategories } from '@/lib/product-categories';

const categories = [
  {
    title: 'Briquettes',
    type: 'Briquettes',
    description: 'Combustible compressé, pratique à stocker et adapté aux appareils compatibles.',
    image: '/briquettes-beech-premium.jpg',
    imageAlt: 'Briquettes de bois compressé',
  },
  {
    title: 'Bois de chauffage',
    type: 'Bois de chauffage',
    description: 'Bûches et bois densifié pour alimenter votre poêle, insert ou cheminée compatible.',
    image: '/bois-chauffage.webp',
    imageAlt: 'Bûches de bois de chauffage sur palette',
  },
  {
    title: 'Granulés de bois',
    type: 'Granulés',
    description: 'Granulés en sacs ou en palettes, destinés aux poêles et chaudières compatibles.',
    image: '/pellets-firestixx-palette.jpg',
    imageAlt: 'Palette de granulés FireStixx en sacs',
  },
  {
    title: 'Bois d’allumage et allume-feux',
    type: 'Bois d’allumage',
    description: 'Bûchettes et allume-feux pour préparer et démarrer votre feu simplement.',
    image: '/bois-allumage-buchettes.webp',
    imageAlt: 'Bûchettes de bois pour allumer un feu',
  },
];

export default function ProductCategories() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <section data-analytics-section="categories" id="categories-produits" className="scroll-mt-24 bg-[#fff9e7] py-16 sm:py-20">
      <div className="container">
        <div className="mb-9 max-w-2xl">
          <p className="font-bold uppercase tracking-[.18em] text-orange-600">Nos combustibles</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Trouvez le combustible adapté</h2>
          <p className="mt-3 leading-7 text-gray-600">Choisissez une catégorie, puis comparez les produits et leurs conditionnements.</p>
        </div>
        <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <article key={category.title} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <Link href={`/produits/categorie/${productCategories.find((item) => item.type === category.type)!.slug}#catalogue`} className="group relative flex min-h-[310px] items-center justify-center overflow-hidden bg-gray-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-orange-400 sm:min-h-[350px]">
                <Image src={category.image} alt={category.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-110" />
                <span aria-hidden="true" className="absolute inset-0 bg-gray-950/45 transition-colors duration-300 group-hover:bg-gray-950/60 group-focus-visible:bg-gray-950/60" />
                <span className="relative z-10 px-4 text-center text-3xl font-black uppercase tracking-wide text-white drop-shadow-lg sm:text-4xl">{category.title}</span>
                <span className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg bg-orange-500 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-orange-600 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
                  Voir les produits <ArrowRight size={18} />
                </span>
              </Link>
              <div className="p-5 sm:p-6">
                <h3 className="font-black text-gray-950">{category.title}</h3>
                <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-gray-600">{category.description}</p>
                <Link href={`/produits/categorie/${productCategories.find((item) => item.type === category.type)!.slug}#catalogue`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">
                  Explorer cette catégorie <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ), brenLocale);
}
