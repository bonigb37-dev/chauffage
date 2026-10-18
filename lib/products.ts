import { brennholzwerkProducts } from '@/lib/brennholzwerk-products';
import { sperberProducts } from '@/lib/sperber-products';
import { bauhausProducts } from '@/lib/bauhaus-products';
import { bottcherProducts } from '@/lib/bottcher-products';
import { hardwoodMixProducts } from '@/lib/hardwood-mix-products';
import de from '@/translations/de.json';
export type Product = {
  id: number;
  name: string;
  type: string;
  quantity: string;
  price: string;
  description: string;
  image: string;
  section?: string;
  gallery?: string[];
  galleryDescriptions?: Record<string, { fr: string; de: string; en: string }>;
  articleNumber?: string;
  priceAmount?: number;
  stock?: number;
  badge?: string;
  marketReferenceUrl?: string;
  imageSourceUrl?: string;
  availability?: string;
  compareAtPriceAmount?: number;
  volumePriceAmount?: number;
  volumePriceQuantity?: number;
  volumeGroup?: string;
  volumeRm?: number;
};

export function productPathSegment(product?: Partial<Pick<Product, 'id' | 'name'>>) {
  const sourceName = typeof product?.name === 'string' ? product.name : '';
  const nameStr = (de as Record<string, string>)[sourceName.replace(/\s+/g, ' ').trim()] ?? sourceName;
  const nameSlug = nameStr
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${product?.id ?? 0}-${nameSlug || 'produkt'}`;
}

const catalogItems: Product[] = [
  ...hardwoodMixProducts,
  ...brennholzwerkProducts,
  ...sperberProducts,
  ...bauhausProducts,
  ...bottcherProducts,
  // 1. Granulés de marques sur palette complète (9 références)
  { id: 2, name: 'Granulés EPH Premium DINplus/ENplus A1 – palette', type: 'Granulés', quantity: '65 sacs en papier · 975 kg', price: '499,00 €', priceAmount: 49900, description: 'Une palette de 65 sacs papier, soit 975 kg de granulés EPH Premium certifiés DINplus et ENplus A1.', image: '/eph-premium-palette.webp', gallery: ['/eph-premium-palette.webp', '/eph-premium-sac.webp', '/eph-premium-detail.webp'], articleNumber: '10005-975', badge: 'Produit phare' },
  { id: 25, name: 'Granulés TotalEnergies Premium ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de résineux TotalEnergies en sacs de 15 kg. Palette adaptée aux poêles et chaudières compatibles ENplus A1.', image: '/pellets-totalenergies.webp', marketReferenceUrl: 'https://proxi.totalenergies.fr/professionnels/pellets-buches' },
  { id: 26, name: 'Granulés HEIZFUXX Blue ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de résineux certifiés ENplus A1, conditionnés en 65 sacs sur palette.', image: '/pellets-heizfuxx-blue.webp', marketReferenceUrl: 'https://brennholzbredemeier.com/product/heizfuxx-holzpellets-blue-975-kg-65-x-15-kg/' },
  { id: 49, name: 'Granulés FireStixx Premium DINplus / ENplus A1', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés FireStixx Premium certifiés DINplus et ENplus A1, en sacs de 15 kg sur palette.', image: '/pellets-firestixx-palette.jpg', marketReferenceUrl: 'https://www.herrnegger.com/shop/produkt/holzpellets-premium-firestixx-66-x-15-kg/', imageSourceUrl: 'https://shop.firestixx.org/media/image/a2/6b/fc/FireStixx-Holzpellets-Sackware-15-kg-Palette_600x600.jpg' },
  { id: 28, name: 'Granulés HELIOS DINplus / ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés HELIOS en palette, 100 % résineux, pour poêles et chaudières compatibles.', image: '/pellets-helios.webp', marketReferenceUrl: 'https://dessommemotoculture.com/produit/granules-de-bois-helios-65-sacs-de-15-kg/' },
  { id: 30, name: 'Granulés PROXIMA STAR Premium', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés de résineux PROXIMA STAR conditionnés en palette, pour poêles, inserts et chaudières compatibles.', image: '/pellets-proxima-star.webp', marketReferenceUrl: 'https://www.lesboisdubreuil.com/produits/palette-de-pellets-proxima-star-100-pourcent-bois-resineux-990-kg-66-s' },
  { id: 74, name: 'Granulés de bois ANTE DIN+ et EN+ – palette complète', type: 'Granulés', quantity: 'Palette de 66 sacs · 990 kg', price: '', description: 'Palette complète de granulés ANTE résineux haute qualité.', image: '/bois-chauffages-img-14.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/granules-de-bois/' },
  { id: 75, name: 'Granulés de bois VERPELLET PELLETS – palette', type: 'Granulés', quantity: 'Palette · 66 sacs', price: '', description: 'Granulés de bois VERPELLET PELLETS 100 % résineux certifiés en palette.', image: '/bois-chauffages-img-17.png', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/granules-de-bois/' },
  { id: 21, name: 'Granulés ENplus A1 – palette', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés de résineux ENplus A1 conditionnés sur palette, pour les appareils compatibles.', image: '/pellets-palette.webp' },

  // 2. Bois de chauffage (Palettes ordonnées - 9 références parfaites sans vides)
  { id: 5, name: 'Bûches de chêne sèches', type: 'Bois de chauffage', quantity: 'Palette · 1 stère · 25 cm', price: '207,00 €', description: 'Bûches de chêne fendues, séchées et prêtes à l’emploi dans un foyer adapté.', image: '/buches-chene.webp' },
  { id: 7, name: 'Bûches de bouleau sèches', type: 'Bois de chauffage', quantity: 'Palette · 1 stère · 25 cm', price: '220,00 €', description: 'Bûches de bouleau fendues et séchées, présentées sur palette.', image: '/buches-bouleau.webp' },
  { id: 69, name: 'Bois de chauffage sec sur palette – 25 cm', type: 'Bois de chauffage', quantity: 'Palette rangée · 25 cm', price: '', description: 'Palette de bois de chauffage sec calibré à 25 cm, empilé avec soin.', image: '/bois-chauffages-img-9.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 48, name: 'Bois de chêne sec – bûches de 33 cm', type: 'Bois de chauffage', quantity: 'Palette filetée · env. 1,6 m³', price: '', description: 'Bûches de chêne fendues en longueur de 33 cm, présentées sur palette filetée pour le stockage et la manutention.', image: '/buches-filet.webp' },
  { id: 36, name: 'Bois de hêtre écorcé – palette filetée', type: 'Bois de chauffage', quantity: '33 cm · env. 1,6 m³ · 500 kg', price: '', description: 'Bûches de hêtre de première qualité, écorcées et fendues, livrées sur palette en filet. Bois prêt à brûler.', image: '/bois-chauffage.webp', marketReferenceUrl: 'https://shop.rhein-main-kaminholz.de/Kleinmengen/Kaminholz-Buche-in-1-6-SRM-Box-33-cm-Scheite.html' },
  { id: 70, name: 'Bois de chauffage sec sur palette – 33 cm', type: 'Bois de chauffage', quantity: 'Palette rangée · 33 cm', price: '', description: 'Palette de bois sec rangé en bûches de 33 cm d’essences feuillus dures.', image: '/bois-chauffages-img-10.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 58, name: 'Bois de chêne séché au four – filets', type: 'Bois de chauffage', quantity: '88 filets · bûches de 25 cm · env. 2 m³ empilé', price: '', description: 'Bûches de chêne fendues et séchées en chambre, prêtes à l’emploi. Le conditionnement en filets facilite le rangement.', image: '/bc-filet-13833.jpg', compareAtPriceAmount: 51900, badge: '−13 %', marketReferenceUrl: 'https://www.brennholzgigant.de/88-netze-kammergetrocknetes-gespalten-eiche-brennholz-25cm' },
  { id: 19, name: 'Bûches de bois compressé', type: 'Bois de chauffage', quantity: 'Paquet de 10 kg', price: '4,20 €', description: 'Des bûches densifiées proposées en paquet pratique.', image: '/buches-compressees.webp' },
  { id: 20, name: 'Bûches densifiées rondes', type: 'Bois de chauffage', quantity: 'Paquet de 10 kg', price: '3,75 €', description: 'Un format rond de bois compressé à utiliser dans un foyer compatible.', image: '/buches-compressees-rondes.webp' },

  // 3. Briquettes (6 références)
  { id: 10, name: 'Briquettes Pini-Kay (origine Allemagne) – palette', type: 'Briquettes', quantity: '96 sacs de 10 kg · 960 kg', price: '549,00 €', description: 'Briquettes Pini-Kay à combustion régulière, conditionnées en palette complète. À utiliser dans un appareil compatible.', image: '/briquettes-hexagonales.webp', volumePriceAmount: 51900, volumePriceQuantity: 5, badge: 'Nouveau', marketReferenceUrl: 'https://www.brennholzgigant.de/giant-flames-pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 40, name: 'Briquettes rondes de hêtre – palette', type: 'Briquettes', quantity: '96 paquets de 10 kg · 960 kg', price: '', description: 'Briquettes rondes en hêtre, conditionnées en paquets de 10 kg. Stocker au sec et vérifier la compatibilité de l’appareil.', image: '/briquettes-beech-premium.jpg', volumePriceAmount: 56900, volumePriceQuantity: 5, marketReferenceUrl: 'https://www.brennholzgigant.de/runde-buche-brikettspallet-96-packungen-x-10-kg-960-kg' },
  { id: 51, name: 'Briquettes RUF – palette', type: 'Briquettes', quantity: '96 paquets de 10 kg · 960 kg', price: '', description: 'Briquettes de bois RUF rectangulaires, conditionnées en 96 paquets de 10 kg, soit 960 kg au total. À conserver au sec.', image: '/briquettes-ruf.webp', compareAtPriceAmount: 52900, volumePriceAmount: 48900, volumePriceQuantity: 5, badge: '−2 %', marketReferenceUrl: 'https://www.brennholzgigant.de/96-sacke-ruf-briketten' },
  { id: 43, name: 'Briquettes Biomac Extra – braise longue durée', type: 'Briquettes', quantity: '100 paquets de 10 kg · 1 000 kg', price: '', description: 'Briquettes de nuit Biomac fabriquées à partir d’écorce lavée et séchée. Elles sont conçues pour maintenir les braises plusieurs heures ; vérifier les consignes de l’appareil.', image: '/briquettes-biomac-palette.jpg', marketReferenceUrl: 'https://www.oekobrix.de/shop/holzbriketts/glut-palette-bs-extra-hart-mit-1000kg/', imageSourceUrl: 'https://holzbrx.de/media/image/17/4e/ef/BIOMAC_Rindenbriketts_Palette.jpg' },
  { id: 60, name: 'Briquettes Giant Flames – palette', type: 'Briquettes', quantity: '190 paquets de 4,8 kg · 912 kg', price: '', description: 'Briquettes de bois Giant Flames en petits paquets individuels.', image: '', compareAtPriceAmount: 49900, badge: '−6 %', marketReferenceUrl: 'https://www.brennholzgigant.de/holzbriketts' },
  { id: 11, name: 'Briquettes RUF – paquet', type: 'Briquettes', quantity: 'Paquet de 10 kg', price: '3,41 €', description: 'Briquettes de bois RUF conditionnées en paquet de 10 kg, à conserver au sec.', image: '/briquettes-packs.webp' },

  // 4. Bois d’allumage (8 références)
  { id: 13, name: 'Bûchettes d’allumage sèches', type: 'Bois d’allumage', quantity: 'Carton de 10 kg', price: '14,60 €', description: 'Des bûchettes sèches pour préparer l’allumage du foyer.', image: '/bois-allumage-buchettes.webp' },
  { id: 14, name: 'Bois d’allumage en sac', type: 'Bois d’allumage', quantity: 'Sac de 5 kg', price: '7,30 €', description: 'Des bûchettes rangées dans un sac pratique à conserver au sec.', image: '/bois-allumage.webp' },
  { id: 15, name: 'Bûchettes en filet', type: 'Bois d’allumage', quantity: 'Filet de 10 kg', price: '14,60 €', description: 'Un filet compact de bois d’allumage à garder près du foyer.', image: '/bois-allumage-filet.webp' },
  { id: 79, name: 'Filet de bois allume-feu', type: 'Bois d’allumage', quantity: 'Filet de bois tendre', price: '', description: 'Filet de bûchettes de bois sec très fines pour allumage facile.', image: '/bois-chauffages-img-21.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/allumage/' },
  { id: 16, name: 'Allume-feux en laine de bois', type: 'Bois d’allumage', quantity: 'Sachet de 32 pièces', price: '4,90 €', description: 'Des allume-feux en laine de bois pour démarrer le feu.', image: '/allume-feux-laine-bois.webp' },
  { id: 17, name: 'Cubes allume-feux', type: 'Bois d’allumage', quantity: 'Boîte de 64 pièces', price: '4,90 €', description: 'Des cubes d’allumage à conserver au sec près du foyer.', image: '/allume-feux-cubes.webp' },
  { id: 77, name: 'Allume-feu écologique en laine de bois', type: 'Bois d’allumage', quantity: 'Boîte de laine de bois', price: '', description: 'Allume-feux écologiques à base de laine de bois et de cire naturelle.', image: '/bois-chauffages-img-19.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/allumage/' },
  { id: 78, name: 'Allume-feu sans pétrole', type: 'Bois d’allumage', quantity: 'Boîte d’allume-feux', price: '', description: 'Allume-feux naturels sans dérivé de pétrole, sans odeur.', image: '/bois-chauffages-img-20.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/allumage/' },
];

const catalogPrices: Record<number, number> = {
  2: 49900, 5: 20700, 7: 22000,
  10: 54900, 11: 341, 13: 1460, 14: 730, 15: 1460,
  16: 490, 17: 490, 19: 420, 20: 375, 21: 35900,
  25: 44900, 26: 38600, 28: 21900,
  30: 25200, 36: 25900, 40: 59900, 43: 59900,
  48: 26900, 49: 48900,
  51: 51900, 58: 44900, 60: 46900,
  69: 36000, 70: 27300,
  74: 38935, 75: 52900,
  77: 650, 78: 295, 79: 450,
  9101: 9730, 9102: 18830, 9103: 31430, 9104: 48930,
  9105: 10430, 9106: 20230, 9107: 6230, 9108: 29330,
  9109: 31900,
  9201: 49717, 9202: 28967, 9203: 24817, 9204: 16517,
  9205: 24817, 9206: 16517, 9207: 16517, 9208: 20667,
  9209: 23157, 9210: 28967, 9211: 19007, 9212: 19837,
  9213: 24817, 9214: 16517, 9215: 21497, 9216: 33117,
  9217: 39757, 9218: 28967, 9219: 33117, 9220: 28967,
};

const euroLabel = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const products: Product[] = catalogItems.map((product) => {
  const priceAmount = catalogPrices[product.id] ?? product.priceAmount;
  let section = product.type;
  if ([2, 21, 25, 26, 28, 30, 49, 74, 75].includes(product.id)) section = 'Granulés de marques';
  else if (product.type === 'Granulés') section = 'Granulés de marques';
  else if (product.type === 'Bois de chauffage') section = 'Bois de chauffage';
  else if ([10, 11, 40, 43, 51, 60].includes(product.id)) section = 'Briquettes';
  else section = 'Bois d’allumage';
  return { ...product, section: product.section ?? section, priceAmount, price: priceAmount === undefined ? 'Indisponible à la vente' : euroLabel.format(priceAmount / 100) };
});
