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
  { id: 1, name: 'Granulés de bois – sac', type: 'Granulés', quantity: 'Sac de 15 kg', price: '7,68 €', description: 'Un format pratique pour le stockage et le rechargement régulier.', image: '/pellets-sac.webp' },
  { id: 2, name: 'Granulés EPH Premium DINplus/ENplus A1 – palette', type: 'Granulés', quantity: '65 sacs en papier · 975 kg', price: '499,00 €', priceAmount: 49900, stock: 89, description: 'Une palette de 65 sacs papier, soit 975 kg de granulés EPH Premium certifiés DINplus et ENplus A1.', image: '/eph-premium-palette.webp', gallery: ['/eph-premium-palette.webp', '/eph-premium-sac.webp', '/eph-premium-detail.webp'], articleNumber: '10005-975', badge: 'Produit phare' },
  { id: 3, name: 'Granulés de bois ENplus A1 – sac', type: 'Granulés', quantity: 'Sac de 15 kg', price: '5,52 €', description: 'Des granulés conditionnés en sac de 15 kg pour un stockage et un usage pratiques.', image: '/pellets-sacs-clairs.webp' },
  { id: 4, name: 'Granulés de bois économiques – sac', type: 'Granulés', quantity: 'Sac de 15 kg', price: '4,48 €', description: 'Un sac de granulés de bois pour les appareils compatibles avec cette qualité.', image: '/pellets.webp' },
  { id: 5, name: 'Bûches de chêne sèches', type: 'Bois de chauffage', quantity: 'Palette · 1 stère · 25 cm', price: '207,00 €', description: 'Bûches de chêne fendues, séchées et prêtes à l’emploi dans un foyer adapté.', image: '/buches-chene.webp' },
  { id: 7, name: 'Bûches de bouleau sèches', type: 'Bois de chauffage', quantity: 'Palette · 1 stère · 25 cm', price: '220,00 €', description: 'Bûches de bouleau fendues et séchées, présentées sur palette.', image: '/buches-bouleau.webp' },
  { id: 10, name: 'Briquettes Pini-Kay (origine Pays-Bas) – palette', type: 'Briquettes', quantity: '96 sacs de 10 kg · 960 kg', price: '549,00 €', description: 'Briquettes Pini-Kay à combustion régulière, conditionnées en palette complète. À utiliser dans un appareil compatible.', image: '/briquettes-hexagonales.webp', volumePriceAmount: 51900, volumePriceQuantity: 5, badge: 'Nouveau', marketReferenceUrl: 'https://www.brennholzgigant.de/giant-flames-pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 11, name: 'Briquettes RUF – paquet', type: 'Briquettes', quantity: 'Paquet de 10 kg', price: '3,41 €', description: 'Un paquet de briquettes facile à manipuler et à entreposer.', image: '/briquettes-packs.webp' },
  { id: 13, name: 'Bûchettes d’allumage sèches', type: 'Bois d’allumage', quantity: 'Carton de 10 kg', price: '14,60 €', description: 'Des bûchettes sèches pour préparer l’allumage du foyer.', image: '/bois-allumage-buchettes.webp' },
  { id: 14, name: 'Bois d’allumage en sac', type: 'Bois d’allumage', quantity: 'Sac de 5 kg', price: '7,30 €', description: 'Des bûchettes rangées dans un sac pratique à conserver au sec.', image: '/bois-allumage.webp' },
  { id: 15, name: 'Bûchettes en filet', type: 'Bois d’allumage', quantity: 'Filet de 10 kg', price: '14,60 €', description: 'Un filet compact de bois d’allumage à garder près du foyer.', image: '/bois-allumage-filet.webp' },
  { id: 16, name: 'Allume-feux en laine de bois', type: 'Bois d’allumage', quantity: 'Sachet de 32 pièces', price: '4,90 €', description: 'Des allume-feux en laine de bois pour démarrer le feu.', image: '/allume-feux-laine-bois.webp' },
  { id: 17, name: 'Cubes allume-feux', type: 'Bois d’allumage', quantity: 'Boîte de 64 pièces', price: '4,90 €', description: 'Des cubes d’allumage à conserver au sec près du foyer.', image: '/allume-feux-cubes.webp' },
  { id: 18, name: 'Granulés de bois économiques', type: 'Granulés', quantity: 'Palette · 66 sacs · 990 kg', price: '296,00 €', description: 'Une palette de granulés de bois pour les appareils compatibles avec ces caractéristiques.', image: '/pellets-vrac.webp' },
  { id: 19, name: 'Bûches de bois compressé', type: 'Bois de chauffage', quantity: 'Paquet de 10 kg', price: '4,20 €', description: 'Des bûches densifiées proposées en paquet pratique.', image: '/buches-compressees.webp' },
  { id: 20, name: 'Bûches densifiées rondes', type: 'Bois de chauffage', quantity: 'Paquet de 10 kg', price: '3,75 €', description: 'Un format rond de bois compressé à utiliser dans un foyer compatible.', image: '/buches-compressees-rondes.webp' },
  { id: 21, name: 'Granulés ENplus A1 – palette', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés de résineux ENplus A1 conditionnés sur palette, pour les appareils compatibles.', image: '/pellets-palette.webp' },
  { id: 25, name: 'Granulés TotalEnergies Premium ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de résineux TotalEnergies en sacs de 15 kg. Palette adaptée aux poêles et chaudières compatibles ENplus A1.', image: '/pellets-totalenergies.webp', marketReferenceUrl: 'https://proxi.totalenergies.fr/professionnels/pellets-buches' },
  { id: 26, name: 'Granulés HEIZFUXX Blue ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de résineux certifiés ENplus A1, conditionnés en 65 sacs sur palette.', image: '/pellets-heizfuxx-blue.webp', marketReferenceUrl: 'https://brennholzbredemeier.com/product/heizfuxx-holzpellets-blue-975-kg-65-x-15-kg/' },
  { id: 27, name: 'Granulés DINplus – palette petit format', type: 'Granulés', quantity: '20 sacs de 15 kg · 300 kg', price: '', description: 'Format compact de granulés de bois certifiés DINplus et ENplus A1. Une option pratique pour compléter le stock.', image: '/pellets-dinplus-300.webp', badge: 'Petit format', marketReferenceUrl: 'https://distriglobe.de/product/holzpellets-din-plus-palette-300-kg/' },
  { id: 28, name: 'Granulés HELIOS DINplus / ENplus A1', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés HELIOS en palette, 100 % résineux, pour poêles et chaudières compatibles.', image: '/pellets-helios.webp', marketReferenceUrl: 'https://dessommemotoculture.com/produit/granules-de-bois-helios-65-sacs-de-15-kg/' },
  { id: 30, name: 'Granulés PROXIMA STAR Premium', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés de résineux PROXIMA STAR conditionnés en palette, pour poêles, inserts et chaudières compatibles.', image: '/pellets-proxima-star.webp', marketReferenceUrl: 'https://www.lesboisdubreuil.com/produits/palette-de-pellets-proxima-star-100-pourcent-bois-resineux-990-kg-66-s' },
  { id: 36, name: 'Bois de hêtre écorcé – palette filetée', type: 'Bois de chauffage', quantity: '33 cm · env. 1,6 m³ · 500 kg', price: '', description: 'Bûches de hêtre de première qualité, écorcées et fendues, livrées sur palette en filet. Bois prêt à brûler.', image: '/bois-chauffage.webp', marketReferenceUrl: 'https://shop.rhein-main-kaminholz.de/Kleinmengen/Kaminholz-Buche-in-1-6-SRM-Box-33-cm-Scheite.html' },
  { id: 40, name: 'Briquettes rondes de hêtre – palette', type: 'Briquettes', quantity: '96 paquets de 10 kg · 960 kg', price: '', description: 'Briquettes rondes en hêtre, conditionnées en paquets de 10 kg. Stocker au sec et vérifier la compatibilité de l’appareil.', image: '/briquettes-beech-premium.jpg', volumePriceAmount: 56900, volumePriceQuantity: 5, marketReferenceUrl: 'https://www.brennholzgigant.de/runde-buche-brikettspallet-96-packungen-x-10-kg-960-kg' },
  { id: 43, name: 'Briquettes Biomac Extra – braise longue durée', type: 'Briquettes', quantity: '100 paquets de 10 kg · 1 000 kg', price: '', description: 'Briquettes de nuit Biomac fabriquées à partir d’écorce lavée et séchée. Elles sont conçues pour maintenir les braises plusieurs heures ; vérifier les consignes de l’appareil.', image: '/briquettes-biomac-palette.jpg', marketReferenceUrl: 'https://www.oekobrix.de/shop/holzbriketts/glut-palette-bs-extra-hart-mit-1000kg/', imageSourceUrl: 'https://holzbrx.de/media/image/17/4e/ef/BIOMAC_Rindenbriketts_Palette.jpg' },
  { id: 49, name: 'Granulés FireStixx Premium DINplus / ENplus A1', type: 'Granulés', quantity: '66 sacs de 15 kg · 990 kg', price: '', description: 'Granulés FireStixx Premium certifiés DINplus et ENplus A1, en sacs de 15 kg sur palette.', image: '/pellets-firestixx-palette.jpg', marketReferenceUrl: 'https://www.herrnegger.com/shop/produkt/holzpellets-premium-firestixx-66-x-15-kg/', imageSourceUrl: 'https://shop.firestixx.org/media/image/a2/6b/fc/FireStixx-Holzpellets-Sackware-15-kg-Palette_600x600.jpg' },
  { id: 48, name: 'Bois de chêne sec – bûches de 33 cm', type: 'Bois de chauffage', quantity: 'Palette filetée · env. 1,6 m³', price: '', description: 'Bûches de chêne fendues en longueur de 33 cm, présentées sur palette filetée pour le stockage et la manutention.', image: '/buches-filet.webp' },
  { id: 51, name: 'Briquettes RUF – palette', type: 'Briquettes', quantity: '96 paquets de 10 kg · 960 kg', price: '', description: 'Briquettes rectangulaires compressées en palette. Faible taux d’humidité et pouvoir calorifique élevé.', image: '/briquettes-ruf.webp', compareAtPriceAmount: 52900, volumePriceAmount: 48900, volumePriceQuantity: 5, badge: '−2 %', marketReferenceUrl: 'https://www.brennholzgigant.de/96-sacke-ruf-briketten' },
  { id: 52, name: 'Briquettes Pini-Kay importées – palette', type: 'Briquettes', quantity: '96 sacs de 10 kg · 960 kg', price: '', description: 'Briquettes Pini-Kay avec canaux d’aération, proposées en palette complète.', image: '/briquettes-hexagonales.webp', volumePriceAmount: 55900, volumePriceQuantity: 5, marketReferenceUrl: 'https://www.brennholzgigant.de/pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 53, name: 'Briquettes RUF – demi-palette', type: 'Briquettes', quantity: '48 paquets de 10 kg · 480 kg', price: '', description: 'Un conditionnement intermédiaire de briquettes RUF, plus facile à stocker qu’une palette complète.', image: '/briquettes-packs.webp', marketReferenceUrl: 'https://www.brennholzgigant.de/96-sacke-ruf-briketten' },
  { id: 54, name: 'Briquettes Pini-Kay – demi-palette', type: 'Briquettes', quantity: '48 sacs de 10 kg · 480 kg', price: '', description: 'Le format demi-palette des briquettes Pini-Kay d’origine néerlandaise, à conserver dans un endroit sec.', image: '/briquettes-hexagonales.webp', marketReferenceUrl: 'https://www.brennholzgigant.de/giant-flames-pini-kay-holzbriketts-96-sacke-von-10-kg' },
  { id: 55, name: 'Briquettes rondes de hêtre – demi-palette', type: 'Briquettes', quantity: '48 paquets de 10 kg · 480 kg', price: '', description: 'Briquettes rondes de hêtre en format demi-palette, pour un stockage plus compact.', image: '/briquettes-beech-premium.jpg', marketReferenceUrl: 'https://www.brennholzgigant.de/runde-buche-brikettspallet-96-packungen-x-10-kg-960-kg' },
  { id: 56, name: 'Granulés Giant Flames – palette', type: 'Granulés', quantity: '65 sacs de 15 kg · 975 kg', price: '', description: 'Granulés de bois ENplus A1 conditionnés en sacs de 15 kg. Livraison nationale gratuite en Allemagne.', image: '/pellets-palette.webp', marketReferenceUrl: 'https://www.brennholzgigant.de/holzpellets' },
  { id: 57, name: 'Granulés Giant Flames – demi-palette', type: 'Granulés', quantity: '35 sacs de 15 kg · 525 kg', price: '', description: 'Format demi-palette de granulés de bois, adapté aux besoins de stockage plus limités.', image: '/pellets-sacs-clairs.webp', marketReferenceUrl: 'https://www.brennholzgigant.de/holzpellets' },
  { id: 58, name: 'Bois de chêne séché au four – filets', type: 'Bois de chauffage', quantity: '88 filets · bûches de 25 cm · env. 2 m³ empilé', price: '', description: 'Bûches de chêne fendues et séchées en chambre, prêtes à l’emploi. Le conditionnement en filets facilite le rangement.', image: '/buches-filet.webp', compareAtPriceAmount: 51900, badge: '−13 %', marketReferenceUrl: 'https://www.brennholzgigant.de/88-netze-kammergetrocknetes-gespalten-eiche-brennholz-25cm' },
  { id: 59, name: 'Bois de hêtre séché au four – palette', type: 'Bois de chauffage', quantity: 'Bûches de 33 cm · env. 2,6 m³ empilé', price: '', description: 'Bûches de hêtre fendues et séchées en chambre, livrées en palette pour un usage immédiat.', image: '/bois-chauffage.webp', marketReferenceUrl: 'https://www.brennholzgigant.de/palette-kammergetrocknetes-gespalten-buchen-brennholz-33cm' },
  { id: 60, name: 'Briquettes Giant Flames – palette', type: 'Briquettes', quantity: '190 paquets de 4,8 kg · 912 kg', price: '', description: 'Briquettes de bois Giant Flames en petits paquets individuels.', image: '/briquettes-packs.webp', compareAtPriceAmount: 49900, badge: '−6 %', marketReferenceUrl: 'https://www.brennholzgigant.de/holzbriketts' },

  /* Produits officiels de bois-chauffages.com */
  { id: 61, name: 'Bois de chauffage mi-sec en vrac – 25 cm', type: 'Bois de chauffage', quantity: 'Vrac · 25 cm', price: '', description: 'Bois de chauffage mi-sec en vrac, longueur 25 cm, essences calorifiques variées (chêne, charme, hêtre).', image: '/bois-chauffages-img-1.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 62, name: 'Bois de chauffage mi-sec en vrac – 33 ou 50 cm', type: 'Bois de chauffage', quantity: 'Vrac · 33 / 50 cm', price: '', description: 'Bois de chauffage mi-sec en vrac, longueurs au choix de 33 ou 50 cm, d’essences calorifiques sélectionnées.', image: '/bois-chauffages-img-2.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 63, name: 'Bois de chauffage sec en Big Bag – 25 cm', type: 'Bois de chauffage', quantity: 'Big Bag · 25 cm', price: '', description: 'Bois de chauffage prêt à brûler conditionné en Big Bag pour un stockage propre et pratique.', image: '/bois-chauffages-img-3.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 64, name: 'Bois de chauffage sec en Big Bag – 33 cm', type: 'Bois de chauffage', quantity: 'Big Bag · 33 cm', price: '', description: 'Bûches de 33 cm séchées à cœur présentées dans un Big Bag robuste et facile à déplacer.', image: '/bois-chauffages-img-4.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 65, name: 'Bois de chauffage sec en Big Bag – 50 cm', type: 'Bois de chauffage', quantity: 'Big Bag · 50 cm', price: '', description: 'Format 50 cm sec en Big Bag, idéal pour les grands foyers, chaudières et inserts.', image: '/bois-chauffages-img-5.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 66, name: 'Bois de chauffage sec en vrac – 25 cm', type: 'Bois de chauffage', quantity: 'Vrac · 25 cm', price: '', description: 'Bûches de 25 cm séchées, prêtes pour allumage rapide et feu vif dans poêle ou foyer fermé.', image: '/bois-chauffages-img-6.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 67, name: 'Bois de chauffage sec en vrac – 33 cm', type: 'Bois de chauffage', quantity: 'Vrac · 33 cm', price: '', description: 'Bois dur séché en vrac, découpe 33 cm pour une excellente tenue du feu.', image: '/bois-chauffages-img-7.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 68, name: 'Bois de chauffage sec en vrac – 50 cm', type: 'Bois de chauffage', quantity: 'Vrac · 50 cm', price: '', description: 'Bûches de 50 cm séchées pour inserts et chaudières, fort pouvoir calorifique.', image: '/bois-chauffages-img-8.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 69, name: 'Bois de chauffage sec sur palette – 25 cm', type: 'Bois de chauffage', quantity: 'Palette rangée · 25 cm', price: '', description: 'Palette de bois de chauffage sec calibré à 25 cm, empilé avec soin.', image: '/bois-chauffages-img-9.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 70, name: 'Bois de chauffage sec sur palette – 33 cm', type: 'Bois de chauffage', quantity: 'Palette rangée · 33 cm', price: '', description: 'Palette de bois sec rangé en bûches de 33 cm d’essences feuillus dures.', image: '/bois-chauffages-img-10.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 71, name: 'Bois de chauffage sec sur palette – 50 cm', type: 'Bois de chauffage', quantity: 'Palette rangée · 50 cm', price: '', description: 'Palette complète de 50 cm sec, livraison propre et manipulation simplifiée.', image: '/bois-chauffages-img-11.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 72, name: 'Filet de bûches de bois 33 cm (6 à 8 pièces)', type: 'Bois de chauffage', quantity: 'Filet individuel · 33 cm', price: '', description: 'Petit filet individuel de bûches de 33 cm pour un appoint rapide au coin du feu.', image: '/bois-chauffages-img-12.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 73, name: 'Granulés de bois ANTE DIN+ et EN+ – sac de 15 kg', type: 'Granulés', quantity: 'Sac de 15 kg', price: '', description: 'Granulés de bois ANTE certifiés DIN+ et EN+ A1 pour poêles et chaudières.', image: '/bois-chauffages-img-13.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/granules-de-bois/' },
  { id: 74, name: 'Granulés de bois ANTE DIN+ et EN+ – palette complète', type: 'Granulés', quantity: 'Palette de 66 sacs · 990 kg', price: '', description: 'Palette complète de granulés ANTE résineux haute qualité.', image: '/bois-chauffages-img-14.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/granules-de-bois/' },
  { id: 75, name: 'Granulés de bois VERPELLET PELLETS – palette', type: 'Granulés', quantity: 'Palette · 66 sacs', price: '', description: 'Granulés de bois VERPELLET PELLETS 100 % résineux certifiés en palette.', image: '/bois-chauffages-img-17.png', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/granules-de-bois/' },
  { id: 76, name: 'Granulés de bois VERPELLET PELLETS – sac de 15 kg', type: 'Granulés', quantity: 'Sac de 15 kg', price: '', description: 'Sac individuel de 15 kg de granulés VERPELLET PELLETS.', image: '/bois-chauffages-img-18.png', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/granules-de-bois/' },
  { id: 77, name: 'Allume-feu écologique en laine de bois', type: 'Bois d’allumage', quantity: 'Boîte de laine de bois', price: '', description: 'Allume-feux écologiques à base de laine de bois et de cire naturelle.', image: '/bois-chauffages-img-19.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/allumage/' },
  { id: 78, name: 'Allume-feu sans pétrole', type: 'Bois d’allumage', quantity: 'Boîte d’allume-feux', price: '', description: 'Allume-feux naturels sans dérivé de pétrole, sans odeur.', image: '/bois-chauffages-img-20.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/allumage/' },
  { id: 79, name: 'Filet de bois allume-feu', type: 'Bois d’allumage', quantity: 'Filet de bois tendre', price: '', description: 'Filet de bûchettes de bois sec très fines pour allumage facile.', image: '/bois-chauffages-img-21.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/allumage/' },
  { id: 80, name: 'Bois de chauffage Chêne & Hêtre sec en box (2 stères)', type: 'Bois de chauffage', quantity: 'Box · 2 stères · 25 cm', price: '', description: 'Bois dur chêne et hêtre écorcé et rangé en box palette prêt à brûler.', image: '/bois-chauffages-img-9.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 81, name: 'Bûches de Hêtre séchées sur palette (1,5 stère – 33 cm)', type: 'Bois de chauffage', quantity: 'Palette · 1,5 stère · 33 cm', price: '', description: 'Palette de hêtre pur séchée à moins de 20 % d’humidité.', image: '/bois-chauffages-img-10.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
  { id: 82, name: 'Bûches de Chêne Pur séchées sur palette (2 stères – 50 cm)', type: 'Bois de chauffage', quantity: 'Palette · 2 stères · 50 cm', price: '', description: 'Palette de grandes bûches de chêne 50 cm séchées en chambre.', image: '/bois-chauffages-img-11.jpg', marketReferenceUrl: 'https://www.bois-chauffages.com/type-de-chauffage/bois/' },
];

const indicativePrices: Record<number, number> = {
  1: 768, 2: 49900, 3: 552, 4: 448, 5: 20700, 7: 22000,
  10: 54900, 11: 341, 13: 1460, 14: 730, 15: 1460,
  16: 490, 17: 490, 18: 29600, 19: 420, 20: 375, 21: 35900,
  25: 44900, 26: 38600, 27: 10500, 28: 21900,
  30: 25200, 36: 25900, 40: 59900, 43: 59900,
  48: 26900, 49: 48900,
  51: 51900, 52: 58900, 53: 29900, 54: 30900,
  55: 33900, 56: 56900, 57: 30900, 58: 44900, 59: 48900, 60: 46900,

  /* Prix exacts du site bois-chauffages.com (en centimes d'euro) */
  61: 9600,
  62: 8900,
  63: 20600,
  64: 16320,
  65: 12480,
  66: 9900,
  67: 9200,
  68: 9200,
  69: 36000,
  70: 27300,
  71: 24150,
  72: 500,
  73: 599,
  74: 38935,
  75: 52900,
  76: 688,
  77: 650,
  78: 295,
  79: 450,
  80: 34900,
  81: 25900,
  82: 31900,
};

const euroLabel = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const products: Product[] = catalogItems.map((product) => {
  const priceAmount = indicativePrices[product.id] ?? 990;
  let section = product.type;
  if ([2, 25, 26, 28, 30, 49, 56, 57, 73, 74, 75, 76].includes(product.id)) section = 'Granulés de marques';
  else if ([1, 3, 4, 27].includes(product.id)) section = 'Formats compacts';
  else if (product.type === 'Granulés') section = 'Autres granulés';
  else if (product.type === 'Bois de chauffage') section = 'Bois de chauffage';
  else if ([10, 11, 40, 43, 51, 52, 53, 54, 55, 60].includes(product.id)) section = 'Briquettes';
  else section = 'Bois d’allumage';
  return { ...product, section, priceAmount, price: euroLabel.format(priceAmount / 100) };
});
