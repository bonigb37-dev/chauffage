import type { Product } from '@/lib/products';

export type DemoReview = { id: string; label: string; rating: number; text: string };

const reviewCopy: Record<'pellets' | 'briquettes' | 'logs' | 'kindling', { starts: string[]; ends: string[] }> = {
  pellets: {
    starts: [
      'Le format est pratique à ranger près de mon appareil.',
      'Les sacs sont faciles à manipuler au quotidien.',
      'J’apprécie de pouvoir prévoir mon stock à l’avance.',
      'Le conditionnement correspond à ce que je cherchais.',
      'Le produit convient à mon appareil, après vérification des recommandations du fabricant.',
      'Le rangement est simple et le format est bien pensé.',
      'J’ai trouvé les informations de conditionnement utiles pour comparer.',
      'Le format permet de mieux organiser mon espace de stockage.',
      'Pour mon usage habituel, le produit est facile à prendre en main.',
      'La présentation du produit m’a aidé à choisir le bon conditionnement.',
    ],
    ends: [
      'Je vérifierais simplement la disponibilité avant une prochaine commande.',
      'Pensez à garder les sacs à l’abri de l’humidité.',
      'La quantité annoncée est facile à comprendre.',
      'Je comparerais les frais de livraison avant de valider.',
      'Un choix pratique lorsque le stockage est préparé à l’avance.',
      'J’aurais aimé connaître le créneau de livraison plus tôt.',
      'Le conditionnement est cohérent avec la description.',
      'À confirmer selon les caractéristiques de chaque appareil.',
      'Cela répond à mon besoin de chauffage pour la saison.',
      'Une option simple à considérer parmi les combustibles disponibles.',
    ],
  },
  briquettes: {
    starts: [
      'Le conditionnement en paquets est simple à déplacer.',
      'Le format se range facilement dans un espace sec.',
      'J’apprécie le format compact pour organiser mon stock.',
      'Les dimensions sont faciles à comparer avec celles de mon foyer.',
      'Le produit est pratique à stocker près de mon poêle.',
      'Le conditionnement permet de répartir le stock dans plusieurs endroits.',
      'J’ai vérifié la compatibilité avec mon appareil avant de choisir.',
      'Le format correspond à l’usage que je prévoyais.',
      'La quantité indiquée m’a aidé à estimer mes besoins.',
      'Le rangement des paquets est plutôt simple.',
    ],
    ends: [
      'Je garderais les paquets bien au sec.',
      'Le format est à vérifier selon la taille du foyer.',
      'La description aide à distinguer les formats proposés.',
      'Je comparerais les délais et les frais avant commande.',
      'Une option pratique pour compléter un stock de bois.',
      'Le poids des paquets est à prendre en compte pour la manutention.',
      'La quantité annoncée est utile pour planifier le rangement.',
      'Le produit semble adapté à mon besoin après vérification.',
      'Je prendrais le temps de vérifier les consignes de l’appareil.',
      'Un conditionnement simple à organiser pour la saison.',
    ],
  },
  logs: {
    starts: [
      'La longueur des bûches est le premier point que j’ai vérifié.',
      'Le format livré facilite l’organisation de mon abri à bois.',
      'J’ai choisi ce conditionnement pour anticiper la saison froide.',
      'Le volume annoncé m’a aidé à prévoir l’espace de stockage.',
      'Le format est facile à comparer avec la taille de mon foyer.',
      'Je vérifie toujours le taux d’humidité annoncé avant de choisir.',
      'Le conditionnement en palette est pratique pour planifier le rangement.',
      'La description m’a permis de comparer les longueurs proposées.',
      'Le produit correspond au type de bois que je recherchais.',
      'J’ai prévu un espace sec avant de commander ce format.',
    ],
    ends: [
      'La compatibilité avec le foyer reste essentielle.',
      'Le rangement est plus simple quand l’espace est préparé.',
      'Je confirmerais les modalités de livraison avant validation.',
      'La quantité indiquée aide à estimer le volume à stocker.',
      'Un format à choisir en fonction de son installation.',
      'Je laisserais le bois dans un endroit adapté selon les consignes reçues.',
      'Les détails de longueur et de volume sont utiles pour comparer.',
      'À vérifier selon les dimensions de son appareil de chauffage.',
      'La description est claire sur le conditionnement proposé.',
      'Une option à considérer si l’on a la place pour le stockage.',
    ],
  },
  kindling: {
    starts: [
      'Le petit conditionnement est facile à garder à portée de main.',
      'Le format compact se range sans difficulté près du foyer.',
      'J’apprécie d’avoir un produit dédié à l’allumage.',
      'Le conditionnement est pratique pour organiser mon coin chauffage.',
      'La quantité indiquée est facile à comparer avec mes besoins.',
      'Le format se prête bien à un rangement à l’abri.',
      'La description m’a aidé à choisir entre les différents formats.',
      'C’est un complément pratique à mon stock de bois.',
      'Le sac ou le carton est simple à déplacer.',
      'J’ai choisi ce format pour faciliter la préparation du feu.',
    ],
    ends: [
      'Je le conserverais dans un endroit sec.',
      'Le format est pratique pour un usage ponctuel.',
      'Il faut toujours respecter les consignes de l’appareil.',
      'La quantité semble adaptée à un rangement compact.',
      'Je vérifierais les modalités de livraison avant commande.',
      'La présentation est utile pour comparer les conditionnements.',
      'Un petit complément facile à stocker.',
      'Le produit est à conserver hors de l’humidité.',
      'La description correspond au type d’allumage recherché.',
      'Une option simple à ajouter à ses fournitures de chauffage.',
    ],
  },
};

const ratings = [5, 5, 4, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 4, 5, 3, 5, 4, 5, 5];
const reviewCounts = [14, 28, 35, 10, 20, 32, 19];

const germanNames = [
  'Thomas Müller',
  'Stefan Weber',
  'Markus Schneider',
  'Michael Schmidt',
  'Lukas Fischer',
  'Andreas Becker',
  'Hans Richter',
  'Klaus Wagner',
  'Stefan Hoffmann',
  'Jan Meyer',
  'Christian Schulz',
  'Martin Koch',
  'Alexander Bauer',
  'Tobias Klein',
  'Daniel Wolf',
  'Sebastian Neumann',
  'Matthias Schwarz',
  'Florian Zimmermann',
  'Frank Braun',
  'Bernd Krüger',
  'Jürgen Hartmann',
  'Peter Lange',
  'Wolfgang Werner',
  'Uwe Krause',
  'Sven Lehmann',
];

function getReviewGroup(product: Product): keyof typeof reviewCopy {
  if (product.type === 'Briquettes') return 'briquettes';
  if (product.type === 'Bois de chauffage') return 'logs';
  if (product.type === 'Bois d’allumage') return 'kindling';
  return 'pellets';
}

export function getDemoReviews(product: Product): DemoReview[] {
  const copy = reviewCopy[getReviewGroup(product)];
  const count = reviewCounts[(product.id - 1) % reviewCounts.length];
  return Array.from({ length: count }, (_, index) => {
    const start = copy.starts[index % copy.starts.length];
    const endIndex = (index + product.id) % copy.ends.length;
    const nameIndex = (index + product.id) % germanNames.length;
    return {
      id: `${product.id}-demo-${index + 1}`,
      label: germanNames[nameIndex],
      rating: ratings[(index + product.id) % ratings.length],
      text: `${start} ${copy.ends[endIndex]}`,
    };
  });
}
