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
};

const catalogItems: Product[] = [
  { id: 1, name: 'Granulés de bois – sac', type: 'Granulés', quantity: 'Sac de 15 kg', price: 'Sur devis', description: 'Un format pratique pour le stockage et le rechargement régulier.', image: '/pellets-sac.webp' },
  { id: 2, name: 'Granulés EPH Premium DINplus/ENplus A1 – palette', type: 'Granulés', quantity: '65 sacs en papier · 975 kg', price: '499,00 €', priceAmount: 49900, stock: 89, description: 'Une palette de 65 sacs papier, soit 975 kg de granulés EPH Premium certifiés DINplus et ENplus A1.', image: '/eph-premium-palette.webp', gallery: ['/eph-premium-palette.webp', '/eph-premium-sac.webp', '/eph-premium-detail.webp'], articleNumber: '10005-975', badge: 'Produit phare' },
  { id: 3, name: 'Granulés de bois ENplus A1 – sac', type: 'Granulés', quantity: 'Sac de 15 kg', price: 'Sur devis', description: 'Des granulés conditionnés en sac de 15 kg pour un stockage et un usage pratiques.', image: '/pellets-sacs-clairs.webp' },
  { id: 4, name: 'Granulés de bois économiques – sac', type: 'Granulés', quantity: 'Sac de 15 kg', price: 'Sur devis', description: 'Un sac de granulés de bois pour les appareils compatibles avec cette qualité.', image: '/pellets.webp' },
  { id: 5, name: 'Bûches de chêne sèches', type: 'Bois de chauffage', quantity: 'Palette · 1 stère · 25 cm', price: 'Sur devis', description: 'Bûches de chêne fendues, séchées et prêtes à l’emploi dans un foyer adapté.', image: '/buches-chene.webp' },
  { id: 7, name: 'Bûches de bouleau sèches', type: 'Bois de chauffage', quantity: 'Palette · 1 stère · 25 cm', price: 'Sur devis', description: 'Bûches de bouleau fendues et séchées, présentées sur palette.', image: '/buches-bouleau.webp' },
  { id: 10, name: 'Briquettes Pini-Kay (origine Pays-Bas) – palette', type: 'Briquettes', quantity: '96 sacs de 10 kg · 960 kg', price: 'Sur devis', description: 'Briquettes Pini-Kay à combustion régulière, conditionnées en palette complète. À utiliser dans un appareil compatible.', image: '/briquettes-hexagonales.webp', availability: 'En stock chez le fournisseur', volumePriceAmount: 51900, volumePriceQuantity: 5, badge: 'Nouveau', marketReferenceUrl: 'https://www.brennholzgigant.de/giant-flames-pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 11, name: 'Briquettes RUF – paquet', type: 'Briquettes', quantity: 'Paquet de 10 kg', price: 'Sur devis', description: 'Un paquet de briquettes facile à manipuler et à entreposer.', image: '/briquettes-packs.webp' },
  { id: 13, name: 'Bûchettes d’allumage sèches', type: 'Bois d’allumage', quantity: 'Carton de 10 kg', price: 'Sur devis', description: 'Des bûchettes sèches pour préparer l’allumage du foyer.', image: '/bois-allumage-buchettes.webp' },
  { id: 14, name: 'Bois d’allumage en sac', type: 'Bois d’allumage', quantity: 'Sac de 5 kg', price: 'Sur devis', description: 'Des bûchettes rangées dans un sac pratique à conserver au sec.', image: '/bois-allumage.webp' },
  { id: 15, name: 'Bûchettes en filet', type: 'Bois d’allumage', quantity: 'Filet de 10 kg', price: 'Sur devis', description: 'Un filet compact de bois d’allumage à garder près du foyer.', image: '/bois-allumage-filet.webp' },
  { id: 16, name: 'Allume-feux en laine de bois', type: 'Bois d’allumage', quantity: 'Sachet de 32 pièces', price: 'Sur devis', description: 'Des allume-feux en laine de bois pour démarrer le feu.', image: '/allume-feux-laine-bois.webp' },
  { id: 17, name: 'Cubes allume-feux', type: 'Bois d’allumage', quantity: 'Boîte de 64 pièces', price: 'Sur devis', description: 'Des cubes d’allumage à conserver au sec près du foyer.', image: '/allume-feux-cubes.webp' },
  { id: 18, name: 'Granulés de bois économiques', type: 'Granulés', quantity: 'Palette · 66 sacs · 990 kg', price: 'Sur devis', description: 'Une palette de granulés de bois pour les appareils compatibles avec ces caractéristiques.', image: '/pellets-vrac.webp' },
  { id: 19, name: 'Bûches de bois compressé', type: 'Bois de chauffage', quantity: 'Paquet de 10 kg', price: 'Sur devis', description: 'Des bûches densifiées proposées en paquet pratique.', image: '/buches-compressees.webp' },
  { id: 20, name: 'Bûches densifiées rondes', type: 'Bois de chauffage', quantity: 'Paquet de 10 kg', price: 'Sur devis', description: 'Un format rond de bois compressé à utiliser dans un foyer compatible.', image: '/buches-compressees-rondes.webp' },
  { id: 21, name: 'Granulés ENplus A1 – palette', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés de résineux ENplus A1 conditionnés sur palette, pour les appareils compatibles.', image: '/pellets-palette.webp' },
  { id: 25, name: 'Granulés TotalEnergies Premium ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de résineux TotalEnergies en sacs de 15 kg. Palette adaptée aux poêles et chaudières compatibles ENplus A1.', image: '/pellets-totalenergies.webp', marketReferenceUrl: 'https://proxi.totalenergies.fr/professionnels/pellets-buches' },
  { id: 26, name: 'Granulés HEIZFUXX Blue ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de résineux certifiés ENplus A1, conditionnés en 65 sacs sur palette.', image: '/pellets-heizfuxx-blue.webp', marketReferenceUrl: 'https://brennholzbredemeier.com/product/heizfuxx-holzpellets-blue-975-kg-65-x-15-kg/' },
  { id: 27, name: 'Granulés DINplus – palette petit format', type: 'Granulés', quantity: '20 sacs de 15 kg · 300 kg', price: '', description: 'Format compact de granulés de bois certifiés DINplus et ENplus A1. Une option pratique pour compléter le stock.', image: '/pellets-dinplus-300.webp', badge: 'Petit format', marketReferenceUrl: 'https://distriglobe.de/product/holzpellets-din-plus-palette-300-kg/' },
  { id: 28, name: 'Granulés HELIOS DINplus / ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés HELIOS en palette, 100 % résineux, pour poêles et chaudières compatibles.', image: '/pellets-helios.webp', marketReferenceUrl: 'https://dessommemotoculture.com/produit/granules-de-bois-helios-65-sacs-de-15-kg/' },
  { id: 29, name: 'Granulés de tournesol 8 mm – palette', type: 'Granulés alternatifs', quantity: '54 sacs de 15 kg · 810 kg', price: '', description: 'Granulés issus de coques de tournesol, conditionnés en 54 sacs de 15 kg. Non certifiés DINplus/ENplus A1 : vérifier la compatibilité des granulés de 8 mm avec l’appareil.', image: '/pellets-tournesol-810-reel.png', badge: 'Combustible alternatif', marketReferenceUrl: 'https://bioholzpellets.de/de/produkt/pellets-sonnenblume-8-mm-palette-810-kg/', imageSourceUrl: 'https://kaminholz-guenstiger.de/media/image/product/76/lg/pellets-sonnenblume-8-mm-palette-810-kg.png' },
  { id: 30, name: 'Granulés PROXIMA STAR Premium', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés de résineux PROXIMA STAR conditionnés en palette, pour poêles, inserts et chaudières compatibles.', image: '/pellets-proxima-star.webp', marketReferenceUrl: 'https://www.lesboisdubreuil.com/produits/palette-de-pellets-proxima-star-100-pourcent-bois-resineux-990-kg-66-s' },
  { id: 36, name: 'Bois de hêtre écorcé – palette filetée', type: 'Bois de chauffage', quantity: '33 cm · env. 1,6 m³ · 500 kg', price: '', description: 'Bûches de hêtre de première qualité, écorcées et fendues, livrées sur palette en filet. Bois prêt à brûler selon le taux d’humidité indiqué par le fournisseur.', image: '/bois-chauffage.webp', marketReferenceUrl: 'https://shop.rhein-main-kaminholz.de/Kleinmengen/Kaminholz-Buche-in-1-6-SRM-Box-33-cm-Scheite.html' },
  { id: 40, name: 'Briquettes rondes de hêtre – palette', type: 'Briquettes', quantity: '96 paquets de 10 kg · 960 kg', price: '', description: 'Briquettes rondes en hêtre, conditionnées en paquets de 10 kg. Stocker au sec et vérifier la compatibilité de l’appareil.', image: '/briquettes-beech-premium.jpg', availability: 'En stock chez le fournisseur', volumePriceAmount: 56900, volumePriceQuantity: 5, marketReferenceUrl: 'https://www.brennholzgigant.de/runde-buche-brikettspallet-96-packungen-x-10-kg-960-kg' },
  { id: 43, name: 'Briquettes Biomac Extra – braise longue durée', type: 'Briquettes', quantity: '100 paquets de 10 kg · 1 000 kg', price: '', description: 'Briquettes de nuit Biomac fabriquées à partir d’écorce lavée et séchée. Elles sont conçues pour maintenir les braises plusieurs heures ; vérifier les consignes de l’appareil.', image: '/briquettes-biomac-palette.jpg', marketReferenceUrl: 'https://www.oekobrix.de/shop/holzbriketts/glut-palette-bs-extra-hart-mit-1000kg/', imageSourceUrl: 'https://holzbrx.de/media/image/17/4e/ef/BIOMAC_Rindenbriketts_Palette.jpg' },
  { id: 49, name: 'Granulés FireStixx Premium DINplus / ENplus A1', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés FireStixx Premium certifiés DINplus et ENplus A1, en sacs de 15 kg sur palette.', image: '/pellets-firestixx-palette.jpg', marketReferenceUrl: 'https://www.herrnegger.com/shop/produkt/holzpellets-premium-firestixx-66-x-15-kg/', imageSourceUrl: 'https://shop.firestixx.org/media/image/a2/6b/fc/FireStixx-Holzpellets-Sackware-15-kg-Palette_600x600.jpg' },
  { id: 48, name: 'Bois de chêne sec – bûches de 33 cm', type: 'Bois de chauffage', quantity: 'Palette filetée · env. 1,6 m³', price: '', description: 'Bûches de chêne fendues en longueur de 33 cm, présentées sur palette filetée pour le stockage et la manutention.', image: '/buches-filet.webp' },
  { id: 51, name: 'Briquettes RUF – palette', type: 'Briquettes', quantity: '96 paquets de 10 kg · 960 kg', price: '', description: 'Briquettes rectangulaires compressées en palette. Le fournisseur indique un faible taux d’humidité et un pouvoir calorifique élevé.', image: '/briquettes-ruf.webp', availability: 'En stock chez le fournisseur', compareAtPriceAmount: 52900, volumePriceAmount: 48900, volumePriceQuantity: 5, badge: '−2 %', marketReferenceUrl: 'https://www.brennholzgigant.de/96-sacke-ruf-briketten' },
  { id: 52, name: 'Briquettes Pini-Kay importées – palette', type: 'Briquettes', quantity: '96 sacs de 10 kg · 960 kg', price: '', description: 'Briquettes Pini-Kay avec canaux d’aération, proposées en palette complète. Le délai annoncé par le fournisseur est d’environ deux semaines.', image: '/briquettes-hexagonales.webp', availability: 'Délai indicatif : 2 semaines', volumePriceAmount: 55900, volumePriceQuantity: 5, marketReferenceUrl: 'https://www.brennholzgigant.de/pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 53, name: 'Briquettes RUF – demi-palette', type: 'Briquettes', quantity: '48 paquets de 10 kg · 480 kg', price: '', description: 'Un conditionnement intermédiaire de briquettes RUF, plus facile à stocker qu’une palette complète.', image: '/briquettes-packs.webp', availability: 'En stock chez le fournisseur', marketReferenceUrl: 'https://www.brennholzgigant.de/96-sacke-ruf-briketten' },
  { id: 54, name: 'Briquettes Pini-Kay – demi-palette', type: 'Briquettes', quantity: '48 sacs de 10 kg · 480 kg', price: '', description: 'Le format demi-palette des briquettes Pini-Kay d’origine néerlandaise, à conserver dans un endroit sec.', image: '/briquettes-hexagonales.webp', availability: 'En stock chez le fournisseur', marketReferenceUrl: 'https://www.brennholzgigant.de/giant-flames-pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 55, name: 'Briquettes rondes de hêtre – demi-palette', type: 'Briquettes', quantity: '48 paquets de 10 kg · 480 kg', price: '', description: 'Briquettes rondes de hêtre en format demi-palette, pour un stockage plus compact.', image: '/briquettes-beech-premium.jpg', availability: 'En stock chez le fournisseur', marketReferenceUrl: 'https://www.brennholzgigant.de/runde-buche-brikettspallet-96-packungen-x-10-kg-960-kg' },
  { id: 56, name: 'Granulés Giant Flames – palette', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de bois ENplus A1 conditionnés en sacs de 15 kg. Le fournisseur annonce une livraison nationale gratuite en Allemagne.', image: '/pellets-palette.webp', availability: 'En stock chez le fournisseur', marketReferenceUrl: 'https://www.brennholzgigant.de/holzpellets' },
  { id: 57, name: 'Granulés Giant Flames – demi-palette', type: 'Granulés', quantity: '35 sacs de 15 kg · 525 kg', price: '', description: 'Format demi-palette de granulés de bois, adapté aux besoins de stockage plus limités.', image: '/pellets-sacs-clairs.webp', availability: 'En stock chez le fournisseur', marketReferenceUrl: 'https://www.brennholzgigant.de/holzpellets' },
  { id: 58, name: 'Bois de chêne séché au four – filets', type: 'Bois de chauffage', quantity: '88 filets · bûches de 25 cm · env. 2 m³ empilé', price: '', description: 'Bûches de chêne fendues et séchées en chambre, prêtes à l’emploi. Le conditionnement en filets facilite le rangement.', image: '/buches-filet.webp', availability: 'En stock chez le fournisseur', compareAtPriceAmount: 51900, badge: '−13 %', marketReferenceUrl: 'https://www.brennholzgigant.de/88-netze-kammergetrocknetes-gespalten-eiche-brennholz-25cm' },
  { id: 59, name: 'Bois de hêtre séché au four – palette', type: 'Bois de chauffage', quantity: 'Bûches de 33 cm · env. 2,6 m³ empilé', price: '', description: 'Bûches de hêtre fendues et séchées en chambre, livrées en palette pour un usage immédiat selon les indications du fournisseur.', image: '/bois-chauffage.webp', availability: 'En stock chez le fournisseur', marketReferenceUrl: 'https://www.brennholzgigant.de/palette-kammergetrocknetes-gespalten-buchen-brennholz-33cm' },
  { id: 60, name: 'Briquettes Giant Flames – palette', type: 'Briquettes', quantity: '190 paquets de 4,8 kg · 912 kg', price: '', description: 'Briquettes de bois Giant Flames en petits paquets individuels. Le fournisseur indique un délai d’environ deux semaines.', image: '/briquettes-packs.webp', availability: 'Délai indicatif : 2 semaines', compareAtPriceAmount: 49900, badge: '−6 %', marketReferenceUrl: 'https://www.brennholzgigant.de/holzbriketts' },
];

const indicativePrices: Record<number, number> = {
  1: 768, 2: 49900, 3: 552, 4: 448, 5: 20700, 7: 22000,
  10: 34000, 11: 341, 13: 1460, 14: 730, 15: 1460,
  16: 490, 17: 490, 18: 29600, 19: 420, 20: 375, 21: 35900,
  25: 44900, 26: 38600, 27: 10500, 28: 21900,
  29: 27500, 30: 25200, 36: 25900, 40: 59900, 43: 59900,
  48: 26900, 49: 48900,
  51: 51900, 52: 58900, 53: 29900, 54: 30900,
  55: 33900, 56: 56900, 57: 30900, 58: 44900, 59: 48900, 60: 46900,
};

const euroLabel = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const products: Product[] = catalogItems.map((product) => {
  const priceAmount = indicativePrices[product.id];
  let section = product.type;
  if ([2, 25, 26, 28, 30, 49].includes(product.id)) section = 'Granulés de marques';
  else if ([56, 57].includes(product.id)) section = 'Granulés de marques';
  else if ([1, 3, 4, 27].includes(product.id)) section = 'Formats compacts';
  else if ([29].includes(product.id)) section = 'Autres granulés';
  else if (product.type === 'Granulés') section = 'Autres granulés';
  else if ([5, 7, 19, 20, 36, 48].includes(product.id)) section = 'Bois de chauffage';
  else if ([10, 11, 40, 43].includes(product.id)) section = 'Briquettes';
  else if ([51, 52, 53, 54, 55, 60].includes(product.id)) section = 'Briquettes';
  else if ([58, 59].includes(product.id)) section = 'Bois de chauffage';
  else section = 'Bois d’allumage';
  return { ...product, section, priceAmount, price: euroLabel.format(priceAmount / 100) };
});
