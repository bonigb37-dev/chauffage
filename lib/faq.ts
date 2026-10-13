import { storeConfig } from '@/lib/store-config';
export const faqItems = [
  {
    question: 'Quels sont les moyens et conditions de paiement ?',
    answer: 'Le règlement de vos commandes s’effectue exclusivement par virement bancaire sécurisé. Le paiement intégral doit être impérativement confirmé avant la préparation de la commande et le déclenchement de la livraison. Aucune livraison ni remise de marchandise ne peut être effectuée sans réception préalable de votre règlement.',
  },
  {
    question: 'Quand la livraison est-elle déclenchée après mon paiement ?',
    answer: 'Dès la réception de votre virement bancaire, votre commande est préparée et transmise à notre transporteur partenaire pour une livraison sous 2 à 4 jours ouvrables après réception effective du paiement. Vous recevez une confirmation par e-mail dès la prise en charge de votre palette.',
  },
  {
    question: 'Combien coûtent les frais de livraison ?',
    answer: 'Les frais de livraison dépendent de la distance routière depuis Mittenaar, des produits et des quantités. Calculez-les avec votre adresse avant de confirmer la commande. Aucun paiement n’est à remettre au transporteur.',
  },
  {
    question: 'Quels sont les délais de livraison et jours de passage ?',
    answer: 'Le délai de livraison standard est de 2 à 4 jours ouvrés après réception effective du paiement. Les livraisons s’effectuent du lundi au vendredi sur les heures ouvrables (hors week-ends et jours fériés).',
  },
  {
    question: 'Comment s’organise la prise de rendez-vous pour la livraison ?',
    answer: 'Dès l’arrivée de votre palette au dépôt régional de destination, l’entreprise de transport vous contacte directement par téléphone pour convenir d’une date de passage. Un lien de suivi d’expédition (Track & Trace) vous est également transmis par e-mail afin de suivre l’acheminement en temps réel.',
  },
  {
    question: 'Ma présence est-elle obligatoire lors de la livraison ?',
    answer: 'Oui, la présence d’une personne majeure sur place est obligatoire pour réceptionner, contrôler l’état de la marchandise et signer le bon de livraison auprès du chauffeur.',
  },
  {
    question: 'Comment s’effectue le déchargement de la palette ?',
    answer: 'La livraison est réalisée par camion équipé d’un hayon élévateur hydraulique. La palette est descendue au sol puis déplacée au transpalette (Hubwagen) au plus près de votre propriété, en bordure de voie publique.',
  },
  {
    question: 'Quelles sont les conditions d’accès et la nature du sol exigées ?',
    answer: 'Le sol de déchargement doit être impérativement ferme, plan et carrossable (asphalte, pavés ou béton). En raison de la charge totale (environ 1 200 kg avec le transpalette), tout déplacement sur du gravier, de l’herbe, de la terre, des cailloux ou de fortes pentes est impossible. L’accès nécessite un passage d’au moins 1,20 m de largeur et 2,10 m de hauteur.',
  },
  {
    question: 'Quels combustibles sont disponibles au catalogue ?',
    answer: 'Le catalogue réunit des granulés de bois, des briquettes RUF et Pini-Kay, des bûches et des produits d’allumage. Consultez chaque fiche pour connaître le conditionnement et les caractéristiques indiquées pour la référence. Les certifications et le mode de séchage ne concernent que les produits qui les mentionnent.',
  },
  {
    question: 'Est-il possible de retirer sa commande directement à l’entrepôt ?',
    answer: `Le retrait sur place s’organise sur confirmation préalable auprès de notre entrepôt : ${storeConfig.warehouseAddress}. Contactez-nous pour convenir du rendez-vous et préparer le chargement.`,
  },
  {
    question: 'Comment stocker et conserver vos combustibles bois ?',
    answer: 'Pour conserver vos combustibles dans de bonnes conditions, stockez les bûches dans un abri ventilé et protégé de la pluie. Conservez les granulés et briquettes au sec et à l’abri de l’humidité, en suivant les recommandations du fabricant.',
  },
];
