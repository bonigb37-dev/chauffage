import type { Product } from '@/lib/products';

const gallery = [
  '/products/hardwood-mix/view-0.jpg',
  '/products/hardwood-mix/view-1.jpg',
  ...Array.from({ length: 5 }, (_, index) => `/products/hardwood-mix/view-${index + 2}.webp`),
];
const captions = [
  { fr: 'Vue générale de plusieurs palettes de bois feuillu.', de: 'Mehrere Paletten Laubholz im Überblick.', en: 'An overview of several hardwood pallets.' },
  { fr: 'Présentation du bois empilé et de son conditionnement.', de: 'Gestapeltes Holz und seine Verpackung im Überblick.', en: 'A view of the stacked wood and its packaging.' },
  { fr: 'Des caisses de bûches empilées dans une allée de stockage couverte.', de: 'Gestapelte Holzkisten in einer überdachten Lagergasse.', en: 'Crates of logs stacked along a covered storage aisle.' },
  { fr: 'Des palettes entreposées sous un hangar avec un chariot élévateur.', de: 'Holzpaletten in einer Lagerhalle mit Gabelstapler.', en: 'Wood pallets stored in a warehouse with a forklift.' },
  { fr: 'Vue d’ensemble des rangées de palettes sur une aire extérieure.', de: 'Palettenreihen auf einem Außenlagerplatz im Überblick.', en: 'An overview of pallet rows in an outdoor storage yard.' },
  { fr: 'Présentation des palettes et de leur manutention.', de: 'Paletten und ihre Handhabung im Überblick.', en: 'A view of the pallets and their handling.' },
  { fr: 'Vue de dessus des différentes faces des bûches.', de: 'Die unterschiedlichen Seiten der Holzscheite von oben.', en: 'A top view of the different faces of the logs.' },
];
const galleryDescriptions = {
  ...Object.fromEntries(gallery.map((image, index) => [image, captions[index]])),
  '/products/hardwood-mix/truck.jpg': {
    fr: 'Camion chargé de caisses de bois sur palettes : vue latérale du chargement.',
    de: 'Mit Palettenboxen beladener Lkw: Seitenansicht der Ladung.',
    en: 'A truck loaded with wooden pallet crates: a side view of the load.',
  },
};

// Each volume is a separate catalogue item: checkout validates its price server-side.
const formats = [
  { id: 9301, rm: 1, cents: 9030, image: '/sperber/hardwood-pallet-25cm.webp' },
  { id: 9302, rm: 2, cents: 17430, image: '/sperber/two-rm-hardwood-pallet.jpg' },
  { id: 9303, rm: 8, cents: 69930, image: gallery[0] },
  { id: 9304, rm: 12, cents: 101430, image: gallery[0] },
  { id: 9305, rm: 20, cents: 160930, image: '/products/hardwood-mix/truck.jpg' },
  { id: 9306, rm: 45, cents: 449000, image: '/products/hardwood-mix/truck.jpg' },
  { id: 9307, rm: 100, cents: 999000, image: '/products/hardwood-mix/truck.jpg' },
];

export const hardwoodMixProducts: Product[] = formats.map(({ id, rm, cents, image }) => ({
  id,
  name: rm === 45 ? 'Laubholz Pro 45 RM' : rm < 8 ? `Laubholz-Mix ${rm} RM` : `Laubholz-Großmenge ${rm} RM`,
  type: 'Bois de chauffage',
  section: 'Bois de chauffage',
  quantity: `${rm} RM`,
  price: '',
  priceAmount: cents,
  description: `${rm} Raummeter gemischtes Laubholz auf Palette. Wählen Sie das passende Volumen für Ihren Holzvorrat und planen Sie einen gut belüfteten Lagerplatz ein.`,
  image,
  gallery: [...new Set([image, ...(rm === 45 ? gallery.slice(1) : gallery)])],
  galleryDescriptions,
  articleNumber: `BN-MIX-${String(rm).padStart(3, '0')}RM`,
  volumeGroup: 'hardwood-mix',
  volumeRm: rm,
  stock: 100,
}));
