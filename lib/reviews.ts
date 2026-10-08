export type Review = {
  id: string;
  author: string;
  location: string;
  rating: number; // 1 à 5
  date: string;
  title: string;
  comment: string;
  verified: boolean;
};

// Noms allemands réalistes
const germanFirstNames = [
  'Hans', 'Klaus', 'Stefan', 'Markus', 'Thomas', 'Michael', 'Wolfgang', 'Jürgen',
  'Andreas', 'Dieter', 'Frank', 'Uwe', 'Gerd', 'Manfred', 'Norbert', 'Rainer',
  'Sabine', 'Ursula', 'Petra', 'Monika', 'Brigitte', 'Helga', 'Karin', 'Renate',
  'Anja', 'Angelika', 'Christa', 'Elke', 'Gudrun', 'Gisela', 'Erika', 'Bärbel',
  'Horst', 'Bernd', 'Werner', 'Friedrich', 'Lothar', 'Siegfried', 'Margot', 'Otto',
  'Wilhelm', 'Heinrich', 'Edith', 'Rosemarie', 'Volker', 'Bärbel', 'Hannelore', 'Christel'
];

const germanLastNames = [
  'Müller', 'Weber', 'Schneider', 'Fischer', 'Meyer', 'Schulz', 'Becker', 'Hoffmann',
  'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann',
  'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt',
  'Werner', 'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler',
  'Herrmann', 'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters'
];

const germanLocations = [
  'Stuttgart', 'Freiburg', 'Kehl', 'Offenburg', 'Karlsruhe', 'Baden-Baden',
  'Saarbrücken', 'Heidelberg', 'Mannheim', 'Rastatt', 'Lahr', 'Achern',
  'Pforzheim', 'Heilbronn', 'Ulm', 'Konstanz', 'Tübingen', 'Lörrach',
  'Weil am Rhein', 'Speyer', 'Landau', 'Pirmasens', 'Homburg', 'Zweibrücken'
];

// Dates strictement comprises entre Septembre 2025 et Septembre 2026
const datesSept2025ToSept2026 = [
  '12 septembre 2025', '24 septembre 2025', '8 octobre 2025', '21 octobre 2025',
  '5 novembre 2025', '19 novembre 2025', '3 décembre 2025', '18 décembre 2025',
  '7 janvier 2026', '22 janvier 2026', '4 février 2026', '17 février 2026',
  '6 mars 2026', '23 mars 2026', '9 avril 2026', '25 avril 2026',
  '11 mai 2026', '28 mai 2026', '12 juin 2026', '26 juin 2026',
  '10 juillet 2026', '24 juillet 2026', '12 août 2026', '3 septembre 2026'
];

// Banque de modèles d'avis par catégorie de produit
const reviewTemplates: Record<string, { title: string; comment: string }[]> = {
  granules: [
    {
      title: 'Combustion très propre et constante',
      comment: 'Pellets de grande qualité, très peu de poussière au fond du réservoir et aucune formation de clinker dans le brûleur.',
    },
    {
      title: 'Rendement calorifique élevé',
      comment: 'Excellente chauffe dans notre poêle. La température monte rapidement et les vitres restent claires.',
    },
    {
      title: 'Sacs solides et bien emballés',
      comment: 'Emballage très résistant qui protège parfaitement de l’humidité. Manipulations simples et propres.',
    },
    {
      title: 'Qualité résineuse certifiée',
      comment: 'Couleur claire signe d’un bois pur sans écorce. Ma chaudière fonctionne parfaitement sans aucun bourrage.',
    },
    {
      title: 'Livraison ponctuelle et soignée',
      comment: 'Chauffeur très serviable qui a déposé la palette exactement sous notre car-port.',
    },
    {
      title: 'Très faible taux de cendres',
      comment: 'Le tiroir à cendres ne se remplit que très lentement. Nettoyage du poêle réduit à une fois par semaine.',
    },
    {
      title: 'Incomparable avec les marques bas de gamme',
      comment: 'Rendement thermique supérieur et zéro odeur suspecte lors de la combustion. Je recommande vivement.',
    },
    {
      title: 'Commande renouvelée pour la saison',
      comment: 'Fidèle à cette marque depuis l’an dernier. La qualité est toujours d’une régularité absolue.',
    },
    {
      title: 'Conditionnement très pratique',
      comment: 'Format idéal pour le stockage. Les granulés brûlent avec une belle flamme vive.',
    },
    {
      title: 'Très satisfait du rapport qualité/prix',
      comment: 'Pour des granulés certifiés DINplus / ENplus A1, le prix est tout à fait juste au vu des performances.',
    },
    {
      title: 'Alimentation fluide dans la vis sans fin',
      comment: 'Taille des pellets très homogène. Aucun blocage sur notre poêle à granulés étanche.',
    },
    {
      title: 'Chaleur agréable et soutenue',
      comment: 'Maintenant notre maison de 150m² au chaud sans surconsommation. Excellent produit.',
    },
  ],

  bois: [
    {
      title: 'Bois parfaitement sec (<18% d’humidité)',
      comment: 'Testé à réception avec mon humidimètre : bois sec à cœur, prêt à brûler immédiatement sans fumée.',
    },
    {
      title: 'Bûches bien fendues et calibrées',
      comment: 'Découpe régulière et propre. Rentre parfaitement dans notre insert moderne.',
    },
    {
      title: 'Excellente tenue de la braise',
      comment: 'Essences nobles de feuillus durs (chêne/hêtre) qui procurent un lit de braise durable pour toute la nuit.',
    },
    {
      title: 'Livraison irréprochable devant le garage',
      comment: 'La palette est arrivée intacte et bien filmée. Bois sain sans aucun champignon ni moisissure.',
    },
    {
      title: 'Combustion vive et très chaleureuse',
      comment: 'Belle flamme claire avec un crépitement agréable. Dégagement de chaleur impressionnant.',
    },
    {
      title: 'Bois écorcé très propre',
      comment: 'Le fait que le bois soit propre évite d’apporter de la poussière et des insectes à l’intérieur du salon.',
    },
    {
      title: 'Conditionnement solide et bien empilé',
      comment: 'Rangement sur palette au cordeau, gain de place appréciable dans mon abri.',
    },
    {
      title: 'Séchage en chambre remarquable',
      comment: 'S’allume au premier coup et brûle intégralement sans laisser de morceaux charbonneux.',
    },
    {
      title: 'Très bonne sélection d’essences',
      comment: 'Un mélange idéal pour avoir à la fois une belle flamme rapide et une braise constante.',
    },
    {
      title: 'Incomparable avec du bois mi-sec',
      comment: 'Pas de suie dans le conduit de cheminée. Le ramoneur a confirmé la propreté de la combustion.',
    },
    {
      title: 'Superbe pouvoir calorifique',
      comment: 'Deux bûches suffisent pour maintenir une température agréable toute la soirée.',
    },
    {
      title: 'Rapport qualité/prix excellent',
      comment: 'La quantité livrée correspond exactement à la commande. Service très professionnel.',
    },
  ],

  briquettes: [
    {
      title: 'Densité impressionnante et forte chauffe',
      comment: 'Les briquettes densifiées dégagent une chaleur constante et très puissante en quelques minutes.',
    },
    {
      title: 'Braises longue durée pour la nuit',
      comment: 'Permet de maintenir le foyer au chaud jusqu’au matin sans avoir à rallumer le feu.',
    },
    {
      title: 'Stockage ultra propre et sans poussière',
      comment: 'Fini les écorces et la sciure par terre. Les paquets individuels sont très faciles à manipuler.',
    },
    {
      title: 'Canal central Pini-Kay idéal pour le tirage',
      comment: 'Le trou au centre crée un appel d’air parfait pour une combustion totale et sans fumée.',
    },
    {
      title: 'Gain de place considérable',
      comment: 'Prend 3 fois moins de place qu’une stère de bois traditionnelle pour le même pouvoir calorifique.',
    },
    {
      title: 'Pavés RUF faciles à doser',
      comment: 'Se cassent à la main si besoin pour ajuster la puissance du poêle.',
    },
    {
      title: 'Emballage hermétique très protecteur',
      comment: 'Les paquets sous film rétractable résistent parfaitement aux variations d’humidité du garage.',
    },
    {
      title: 'Combustion régulière et sans éclats',
      comment: 'Brûle de façon très uniforme en conservant sa forme jusqu’à la réduction finale en cendres fines.',
    },
    {
      title: 'Remplacement moderne du bois bûche',
      comment: 'Idéal pour ceux qui recherchent un chauffage au bois efficace sans la corvée de refendre.',
    },
    {
      title: 'Cendres minimes',
      comment: 'Ne laisse qu’une poignée de cendres volantes très faciles à aspirer.',
    },
    {
      title: 'Superbe produit pour l’hiver',
      comment: 'Acheté en palette complète, livraison très fluide par transporteur spécialisé.',
    },
    {
      title: 'Conforme en tous points',
      comment: 'Excellente qualité de fabrication. Je repasserai commande sans hésitation.',
    },
  ],

  allumage: [
    {
      title: 'Allumage rapide et sans effort',
      comment: 'Indispensable pour démarrer le feu par le haut. S’enflamme immédiatement dès la première étincelle.',
    },
    {
      title: 'Produit 100% naturel et inodore',
      comment: 'Aucune puanteur de pétrole ni de produit chimique dans la pièce de vie. Très agréable.',
    },
    {
      title: 'Combustion longue avec forte flamme',
      comment: 'Brûle pendant près de 10 minutes avec de belles flammes pour enflammer les plus grosses bûches.',
    },
    {
      title: 'Boîte / sachet très économique',
      comment: 'Une seule pièce suffit par allumage. Le conditionnement dure toute la saison hivernale.',
    },
    {
      title: 'Bois d’allumage très sec',
      comment: 'Bûchettes très fines et bien résineuses. Fini la galère pour lancer le poêle le matin.',
    },
    {
      title: 'Emballage pratique près du foyer',
      comment: 'Format propre et esthétique à garder à portée de main à côté du panier à bûches.',
    },
    {
      title: 'Efficacité garantie à 100%',
      comment: 'Je n’utilise plus que cela depuis 2 ans. Aucun raté à l’allumage.',
    },
    {
      title: 'Superbe qualité de fabrication',
      comment: 'Laine de bois imprégnée de cire végétale naturelle de première qualité.',
    },
    {
      title: 'Complément parfait pour votre commande de bois',
      comment: 'À ajouter systématiquement lors de sa commande de granulés ou bûches.',
    },
    {
      title: 'Très bon produit écologique',
      comment: 'Alternative saine aux allume-feux blancs chimiques du commerce.',
    },
    {
      title: 'Pratique et propre',
      comment: 'Ne s’effrite pas et ne salit pas les mains.',
    },
    {
      title: 'Au top !',
      comment: 'Rien à redire, livraison ultra rapide et produit très performant.',
    },
  ],
};

// Fonction de génération d'avis déterministes pour garantir >= 8 avis par produit
function generateReviewsForProduct(productId: number): Review[] {
  // Déterminer la catégorie de produit
  let categoryKey = 'granules';
  if ([5, 7, 36, 48, 58, 59, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 80, 81, 82].includes(productId)) {
    categoryKey = 'bois';
  } else if ([10, 11, 19, 20, 40, 43, 51, 52, 53, 54, 55, 60].includes(productId)) {
    categoryKey = 'briquettes';
  } else if ([13, 14, 15, 16, 17, 77, 78, 79].includes(productId)) {
    categoryKey = 'allumage';
  }

  const templates = reviewTemplates[categoryKey] ?? reviewTemplates.granules;

  // Nombre d'avis par produit : entre 8 et 12
  const reviewsCount = 8 + ((productId * 7) % 5);

  const reviews: Review[] = [];

  for (let i = 0; i < reviewsCount; i++) {
    const fnIndex = (productId * 13 + i * 7) % germanFirstNames.length;
    const lnIndex = (productId * 17 + i * 11) % germanLastNames.length;
    const locIndex = (productId * 19 + i * 5) % germanLocations.length;
    const dateIndex = (productId * 3 + i * 2) % datesSept2025ToSept2026.length;
    const templateIndex = (productId * 5 + i) % templates.length;

    const author = `${germanFirstNames[fnIndex]} ${germanLastNames[lnIndex]}`;
    const location = germanLocations[locIndex];
    const date = datesSept2025ToSept2026[dateIndex];
    const template = templates[templateIndex];

    // Note : principalement 5 étoiles, parfois 4 étoiles
    const rating = (i % 4 === 3) ? 4 : 5;

    reviews.push({
      id: `rev-${productId}-${i + 1}`,
      author,
      location,
      rating,
      date,
      title: template.title,
      comment: template.comment,
      verified: true,
    });
  }

  return reviews;
}

// Map stockant tous les avis pour chaque ID de produit
export const reviewsData: Record<number, Review[]> = {};

// Initialiser les avis pour tous les identifiants de produits connus (1 à 82)
const allProductIds = [
  1, 2, 3, 4, 5, 7, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 25, 26, 27, 28, 30, 36, 40, 43, 48, 49, 51, 52, 53, 54, 55,
  56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
  72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82
];

for (const id of allProductIds) {
  reviewsData[id] = generateReviewsForProduct(id);
}

export function getReviewsForProduct(productId: number): Review[] {
  if (!reviewsData[productId] || reviewsData[productId].length < 8) {
    reviewsData[productId] = generateReviewsForProduct(productId);
  }
  return reviewsData[productId];
}

export function getAverageRating(productId: number): { average: number; count: number } {
  const reviews = getReviewsForProduct(productId);
  if (!reviews.length) return { average: 5.0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / reviews.length) * 10) / 10;
  return { average, count: reviews.length };
}
