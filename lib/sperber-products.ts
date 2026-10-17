import type { Product } from '@/lib/products';
import { oakGallery, oakGalleryDescriptions } from '@/lib/oak-gallery';

export const sperberProducts: Product[] = [
  {
    id: 9101,
    name: 'Buche 1 RM',
    type: 'Bois de chauffage',
    section: 'Bois de hêtre',
    quantity: 'Palette · 1 RM',
    price: '',
    description: 'Das bewährte Gebinde für gleichmäßige, lang anhaltende Wärme. Kammergetrocknetes Buchenholz, ofenfertig auf Palette geschichtet.',
    image: '/sperber/buche-palette-front.jpg',
    gallery: [
      '/sperber/buche-palette-front.jpg',
      '/sperber/tall-firewood-pallet.jpg'
    ],
    articleNumber: 'BS-HET-01RM',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/buche-1-rm',
    priceAmount: 9730,
    stock: 100,
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9102,
    name: 'Buche 2 RM',
    type: 'Bois de chauffage',
    section: 'Bois de hêtre',
    quantity: 'Palette · 2 RM',
    price: '',
    description: 'Zwei Raummeter mit Mengenpreis für einen größeren Vorrat. Erstklassiges Buchenbrennholz, ofenfertig und sauber auf stabiler Palette geschichtet.',
    image: '/sperber/tall-firewood-pallet.jpg',
    gallery: [
      '/sperber/tall-firewood-pallet.jpg',
      '/sperber/buche-palette-front.jpg'
    ],
    articleNumber: 'BS-HET-02RM',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/buche-2-rm',
    priceAmount: 18830,
    stock: 100,
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9103,
    name: 'Winterpaket Komfort',
    type: 'Bois de chauffage',
    section: 'Bois de chauffage',
    quantity: 'Paket · 2 Paletten',
    price: '',
    description: 'Ausgewogener Vorrat für regelmäßiges Heizen. Erstklassiges Hartholz für die kalte Jahreszeit, fertig getrocknet und sauber auf Paletten geliefert.',
    image: '/sperber/two-rm-hardwood-pallet.jpg',
    gallery: [
      '/sperber/two-rm-hardwood-pallet.jpg',
      '/sperber/tall-firewood-pallet.jpg'
    ],
    articleNumber: 'BS-PACK-CON',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/winterpaket-komfort',
    priceAmount: 31430,
    stock: 100,
    badge: 'Sparpaket',
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9104,
    name: 'Winterpaket Max',
    type: 'Bois de chauffage',
    section: 'Bois de chauffage',
    quantity: 'Paket · 3 Paletten',
    price: '',
    description: 'Mehrpaletten-Paket für hohen Wärmebedarf. Optimal für die gesamte Wintersaison mit besonders attraktivem Mengenvorteil.',
    image: '/sperber/three-firewood-pallets.jpg',
    gallery: [
      '/sperber/three-firewood-pallets.jpg',
      '/sperber/two-rm-hardwood-pallet.jpg'
    ],
    articleNumber: 'BS-PACK-MAX',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/winterpaket-max',
    priceAmount: 48930,
    stock: 100,
    badge: 'Bestseller',
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9105,
    name: 'Eiche 1 RM',
    type: 'Bois de chauffage',
    section: 'Bois de chauffage',
    quantity: 'Palette · 1 RM',
    price: '',
    description: 'Langsame Verbrennung für ausgedehnte Kaminabende. Hoher Brennwert und langanhaltende Glutentwicklung.',
    image: '/sperber/hardwood-pallet-25cm.webp',
    gallery: [
      '/sperber/hardwood-pallet-25cm.webp',
      '/sperber/two-hardwood-pallets.jpg'
    ],
    articleNumber: 'BS-CHE-01RM',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/eiche-1-rm',
    priceAmount: 10430,
    stock: 100,
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9106,
    name: 'Eiche 2 RM',
    type: 'Bois de chauffage',
    section: 'Bois de chauffage',
    quantity: 'Palette · 2 RM',
    price: '',
    description: 'Dichter Vorrat mit direktem Preisvorteil. Trockenes Eichenbrennholz für effiziente, ruhige und langanhaltende Wärme.',
    image: '/sperber/two-hardwood-pallets.jpg',
    gallery: [
      '/sperber/two-hardwood-pallets.jpg',
      ...oakGallery,
    ],
    galleryDescriptions: oakGalleryDescriptions,
    articleNumber: 'BS-CHE-02RM',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/eiche-2-rm',
    priceAmount: 20230,
    stock: 100,
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9107,
    name: 'Eiche 0,5 RM',
    type: 'Bois de chauffage',
    section: 'Bois de chauffage',
    quantity: 'Palette · 0,5 RM',
    price: '',
    description: 'Kleines, dichtes Gebinde für lang anhaltende Glut. Ideal für gelegentliches Heizen und kleinere Lagermöglichkeiten.',
    image: '/sperber/hardwood-pallet-studio.jpg',
    gallery: [
      '/sperber/hardwood-pallet-studio.jpg',
      '/sperber/hardwood-pallet-25cm.webp'
    ],
    articleNumber: 'BS-CHE-05RM',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/eiche-0-5-rm',
    priceAmount: 6230,
    stock: 100,
    availability: 'https://schema.org/InStock'
  },
  {
    id: 9108,
    name: 'Eiche 3 RM',
    type: 'Bois de chauffage',
    section: 'Bois de chauffage',
    quantity: 'Palette · 3 RM',
    price: '',
    description: 'Drei Raummeter für hohen und planbaren Bedarf. Maximaler Vorrat an hochwertigem Eichenkaminholz mit spürbarem Mengenrabatt.',
    image: '/sperber/three-firewood-pallets.jpg',
    gallery: [
      '/sperber/three-firewood-pallets.jpg',
      '/sperber/two-hardwood-pallets.jpg'
    ],
    articleNumber: 'BS-CHE-03RM',
    marketReferenceUrl: 'https://brennholzsperber.de/produkt/eiche-3-rm',
    priceAmount: 29330,
    stock: 100,
    availability: 'https://schema.org/InStock'
  }
];
