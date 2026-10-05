import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    title: 'Briquettes de bois',
    description: 'Des briquettes compressées de hêtre, de bois dur ou d’écorce, selon votre appareil.',
    image: '/briquettes-beech-premium.jpg',
    imageAlt: 'Palette de briquettes de bois de hêtre emballées',
    href: '/produits#acheter-produit-10',
  },
  {
    title: 'Bois de chauffage',
    description: 'Des bûches sélectionnées par essence et par longueur, en filet ou sur palette.',
    image: '/bois-chauffage.webp',
    imageAlt: 'Bûches de bois de chauffage sur palette',
    href: '/produits#acheter-produit-5',
  },
  {
    title: 'Granulés',
    description: 'Des granulés en sacs ou sur palette, pour les poêles et chaudières compatibles.',
    image: '/pellets-firestixx-palette.jpg',
    imageAlt: 'Palette de granulés FireStixx en sacs',
    href: '/produits#acheter-produit-2',
  },
];

export default function ProductCategories() {
  return (
    <section id="categories-produits" className="scroll-mt-24 bg-[#fff9e7] py-16 sm:py-20">
      <div className="container">
        <div className="mb-9 max-w-2xl">
          <p className="font-bold uppercase tracking-[.18em] text-orange-600">Nos combustibles</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Choisissez votre catégorie</h2>
        </div>
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.title} className="relative flex min-h-[500px] flex-col overflow-hidden rounded-3xl border border-stone-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg sm:p-8">
              <h3 className="relative z-10 text-3xl font-black tracking-tight text-gray-950">{category.title}</h3>
              <p className="relative z-10 mt-3 max-w-sm text-lg leading-8 text-gray-600">{category.description}</p>
              <div className="absolute inset-x-5 bottom-[5.5rem] top-[42%]">
                <Image src={category.image} alt={category.imageAlt} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-contain object-bottom" />
              </div>
              <Link href={category.href} className="relative z-10 mt-auto inline-flex min-h-[58px] items-center justify-center gap-3 rounded-xl bg-orange-500 px-5 py-4 text-center font-black uppercase text-white transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-orange-300">
                Achetez maintenant <ArrowRight size={20} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
