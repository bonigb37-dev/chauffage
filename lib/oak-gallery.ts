const descriptions = [
  { fr: 'Palette de chêne : aperçu des bûches empilées dans leur caisse en bois.', de: 'Eichenholz auf Palette: ein Blick auf die in der Holzkiste gestapelten Scheite.', en: 'Oak pallet: a view of the logs stacked in their wooden crate.' },
  { fr: 'Détail des bûches : écorce, fibres et surface de coupe du chêne.', de: 'Die Scheite im Detail: Rinde, Holzfasern und Schnittfläche der Eiche.', en: 'Log detail: oak bark, grain and split surfaces.' },
  { fr: 'Ambiance au coin du feu : des bûches de chêne près de la cheminée.', de: 'Am Kamin: Eichenholzscheite neben dem Feuer.', en: 'By the fireside: oak logs beside the fireplace.' },
  { fr: 'Exemple de rangement : des bûches surélevées sous un abri ouvert.', de: 'Lagerbeispiel: erhöht gestapelte Scheite unter einem offenen Unterstand.', en: 'Storage example: logs raised off the ground beneath an open shelter.' },
  { fr: 'Présentation du conditionnement : une caisse de bois sur palette avec un transpalette.', de: 'Die Verpackung im Überblick: eine Holzkiste auf Palette mit Hubwagen.', en: 'Packaging view: a wooden pallet crate with a pallet truck.' },
  { fr: 'Vue de dessus : les faces fendues et les faces avec écorce des bûches.', de: 'Von oben: gespaltene Holzflächen und Rindenseiten der Scheite.', en: 'Top view: split faces and bark-covered sides of the logs.' },
];

export const oakGallery = descriptions.map((_, index) => `/products/oak/view-${index + 1}.webp`);
export const oakGalleryDescriptions = Object.fromEntries(oakGallery.map((image, index) => [image, descriptions[index]]));
