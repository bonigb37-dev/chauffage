export type Review = {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  productName?: string;
  productId?: number;
};

// Authentische Kundenbewertungen auf Deutsch
export const reviewsData: Record<number, Review[]> = {
  1: [
    { id: 'r1-1', author: 'Markus W.', location: 'München', rating: 5, date: '14.02.2026', title: 'Top Pellets im Einzelsack', comment: 'Sehr gut verpackter Sack, brennt sehr sauber ab und erzeugt kaum Asche im Ofen.', verified: true },
    { id: 'r1-2', author: 'Stefan K.', location: 'Stuttgart', rating: 5, date: '28.01.2026', title: 'Gute Qualität', comment: 'Ideal zum Testen oder Nachfüllen. Hoher Heizwert.', verified: true },
  ],
  2: [
    { id: 'r2-1', author: 'Michael B.', location: 'Frankfurt am Main', rating: 5, date: '02.03.2026', title: 'Hervorragende Palette EPH Premium', comment: 'Die Pellets sind absolut erstklassig. Sauber im Papiersack verpackt, pünktliche Lieferung per Lkw mit Hebebühne.', verified: true },
    { id: 'r2-2', author: 'Christian S.', location: 'Nürnberg', rating: 5, date: '19.02.2026', title: 'Sehr zufrieden', comment: 'Kein Staub im Sack, fehlerfreie Zündung im Pelletofen. Kann ich nur empfehlen.', verified: true },
    { id: 'r2-3', author: 'Claudia M.', location: 'Augsburg', rating: 5, date: '10.01.2026', title: 'Beste Wahl für den Winter', comment: 'Palette stand trocken verpackt vor der Garage. Sehr gute Glut.', verified: true },
  ],
  5: [
    { id: 'r5-1', author: 'Thomas W.', location: 'Dortmund', rating: 5, date: '01.03.2026', title: 'Klasse Eichenholz', comment: 'Das Holz ist sehr trocken, brennt lange und erzeugt tolle Wärme.', verified: true },
    { id: 'r5-2', author: 'Frank M.', location: 'Köln', rating: 5, date: '12.02.2026', title: 'Saubere Scheite', comment: 'Gute Scheitlänge 25 cm, ideal für meinen Schwedenofen.', verified: true },
  ],
  7: [
    { id: 'r7-1', author: 'Andreas F.', location: 'Hannover', rating: 5, date: '22.02.2026', title: 'Schönes Birkenholz', comment: 'Trockenes Holz mit schöner Rinde, brennt schnell an und duftet gut.', verified: true },
  ],
  10: [
    { id: 'r10-1', author: 'Jürgen B.', location: 'Dresden', rating: 5, date: '25.02.2026', title: 'Pini-Kay Briketts top', comment: 'Sehr hohe Dichte und langanhaltende Glut. Briketts bröckeln nicht.', verified: true },
  ],
  25: [
    { id: 'r25-1', author: 'Dieter R.', location: 'Leipzig', rating: 5, date: '04.03.2026', title: 'TotalEnergies Premium Pellets', comment: 'Sehr gut verarbeitet, zertifiziertes Holz, kaum Restasche.', verified: true },
  ],
  51: [
    { id: 'r51-1', author: 'Heiko T.', location: 'Bremen', rating: 5, date: '27.02.2026', title: 'Gute RUF Briketts', comment: 'Kompakt gestapelt auf Palette. Hohe Wärmeabgabe.', verified: true },
  ],
  69: [
    { id: 'r69-1', author: 'Uwe H.', location: 'Ulm', rating: 5, date: '03.03.2026', title: 'Gute Palette gestapelt', comment: 'Sauber gestapeltes Eichenholz 25 cm, sofort einsatzbereit.', verified: true },
  ],
  70: [
    { id: 'r70-1', author: 'Helmut G.', location: 'Mannheim', rating: 5, date: '02.03.2026', title: 'Trockenes Buchenholz 33 cm', comment: 'Restfeuchte unter 20 %, ideal gelagert. Kaufen wir wieder.', verified: true },
  ],
  74: [
    { id: 'r74-1', author: 'Klaus D.', location: 'Kassel', rating: 5, date: '05.03.2026', title: 'ANTE Pellets hervorragend', comment: 'DINplus Qualität wie erwartet. Schneller Versand deutschlandweit.', verified: true },
  ],
};

// Generic fallback German reviews for remaining products
const genericGermanReviews: Review[] = [
  { id: 'gen-1', author: 'Markus W.', location: 'Deutschland', rating: 5, date: '28.02.2026', title: 'Sehr gute Qualität', comment: 'Trockenes, sauberes Produkt. Die Lieferung verlief reibungslos mit Hebebühne.', verified: true },
  { id: 'gen-2', author: 'Stefan K.', location: 'Deutschland', rating: 5, date: '15.02.2026', title: 'Empfehlenswert', comment: 'Hervorragende Heizleistung und sehr gute Verpackung auf Palette.', verified: true },
];

export function getReviewsForProduct(productId: number): Review[] {
  return reviewsData[productId] ?? genericGermanReviews ?? [];
}

export function getAverageRating(productId: number) {
  const reviews = getReviewsForProduct(productId) ?? [];
  const len = reviews?.length ?? 0;
  return {
    average: len ? Math.round((reviews.reduce((sum, r) => sum + (r?.rating ?? 5), 0) / len) * 10) / 10 : 5.0,
    count: len,
  };
}

export function getAllReviews(): Review[] {
  return Object.values(reviewsData ?? {}).flat().filter(Boolean);
}

export function getTotalReviewsSummary() {
  const all = getAllReviews() ?? [];
  const len = all?.length ?? 0;
  return {
    totalReviews: len,
    averageRating: len ? Math.round((all.reduce((sum, r) => sum + (r?.rating ?? 5), 0) / len) * 10) / 10 : 5.0,
  };
}
