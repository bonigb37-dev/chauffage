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

const germanFirstNames = [
  'Hans', 'Klaus', 'Stefan', 'Markus', 'Thomas', 'Michael', 'Wolfgang', 'Jürgen',
  'Andreas', 'Dieter', 'Frank', 'Uwe', 'Gerd', 'Manfred', 'Norbert', 'Rainer',
  'Sabine', 'Ursula', 'Petra', 'Monika', 'Brigitte', 'Helga', 'Karin', 'Renate',
  'Anja', 'Angelika', 'Christa', 'Elke', 'Gudrun', 'Gisela', 'Erika', 'Bärbel',
  'Horst', 'Bernd', 'Werner', 'Friedrich', 'Lothar', 'Siegfried', 'Margot', 'Otto',
  'Wilhelm', 'Heinrich', 'Edith', 'Rosemarie', 'Volker', 'Hannelore', 'Christel'
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

const datesSept2025ToSept2026 = [
  '12. September 2025', '24. September 2025', '8. Oktober 2025', '21. Oktober 2025',
  '5. November 2025', '19. November 2025', '3. Dezember 2025', '18. Dezember 2025',
  '7. Januar 2026', '22. Januar 2026', '4. Februar 2026', '17. Februar 2026',
  '6. März 2026', '23. März 2026', '9. April 2026', '25. April 2026',
  '11. Mai 2026', '28. Mai 2026', '12. Juni 2026', '26. Juni 2026',
  '10. Juli 2026', '24. Juli 2026', '12. August 2026', '3. September 2026'
];

const reviewTemplates: Record<string, { title: string; comment: string }[]> = {
  granules: [
    {
      title: 'Unkomplizierte Bestellung und schnelle Lieferung',
      comment: 'Die Bestellung der Holzpellets folgte eine sehr schnelle Lieferung. Ich würde jederzeit wieder bestellen.',
    },
    {
      title: 'Sehr gute Qualität und schneller Kundensupport',
      comment: 'Schnelle Lieferung, sehr guter und schneller Kunden Support. Sehr zufrieden mit der Pellet-Qualität.',
    },
    {
      title: 'Bestellt, super easy bezahlt',
      comment: 'Binnen von 48h wurde es versendet. Anlieferung durch Spedition super einfach, gerne wieder!',
    },
    {
      title: 'Alles bestens und sehr saubere Pellets',
      comment: 'Schnelle Lieferung nach Bestellung. Fahrer war extrem hilfsbereit und hat die Paletten genau da abgestellt wie gewünscht.',
    },
    {
      title: 'Hervorragende Qualität der Pellets',
      comment: 'Sehr saubere Ware, brennt langanhaltend und hinterlässt kaum Asche im Ofen. Perfekt verpackt auf stabilen Paletten.',
    },
    {
      title: 'Schnelle und ordnungsgemäße Lieferung',
      comment: 'Schnelle Lieferung und gute Verpackung der Pelletsäcke. Ware kam absolut unbeschädigt an.',
    },
    {
      title: 'Top, jederzeit wieder',
      comment: 'Lieferung erfolgte schneller als angegeben. Palette war gut verpackt, sehr gute Qualität.',
    },
    {
      title: 'Guter Kundenservice und einwandfreie Ware',
      comment: 'Sehr nette Beratung und einwandfreie Pellets. Brennen sehr sauber mit hohem Heizwert.',
    },
    {
      title: 'Erstklassige Holzpellets',
      comment: 'Die Pellets entsprechen höchsten Qualitätsstandards (DINplus / ENplus A1). Sehr zu empfehlen.',
    },
    {
      title: 'Zuverlässige Lieferung',
      comment: 'Schnelle Lieferung in dem Lieferzeitraum wie angegeben. Die Pelletsäcke waren trocken und gut auf der Palette geschichtet.',
    },
    {
      title: 'Auslieferung sorgfältig und pünktlich',
      comment: 'Die Auslieferung erfolgte sorgfältig und am Kundenbedarf orientiert, zudem von einem sehr freundlichen Auslieferer.',
    },
    {
      title: 'Absolut empfehlenswert',
      comment: 'Alles sehr erfreulich und empfehlenswert. Schnelle Lieferung, sehr gute Qualität und freundlicher Kontakt.',
    },
  ],

  bois: [
    {
      title: 'Das Brennholz hat super Qualität',
      comment: 'Das Brennholz hat super Qualität. Große, trockene Scheite und richtig schwer. Brennen lange mit wenig Asche. Dazu eine schnelle und freundliche Lieferung bis auf den Hof.',
    },
    {
      title: 'Sehr gute Holzqualität, klare Empfehlung',
      comment: 'Zuverlässige Lieferung; sehr gute, sehr saubere Holzqualität, erfreulich wenig Rund- und Astholz; die bestellte Länge der Scheite wurde durchgängig eingehalten.',
    },
    {
      title: 'Alles sehr erfreulich und empfehlenswert',
      comment: 'Schnelle Lieferung, sehr gutes Holz und ausgesprochen freundlicher Kontakt mit dem Kundenservice. Die Spedition war sehr zuverlässig.',
    },
    {
      title: 'Zuverlässige Lieferung und gutes Brennholz',
      comment: 'Schnelle Lieferung im angegebenen Zeitraum. Das Brennholz war in der Box gut geschichtet und bereits so vorgetrocknet, dass man es sofort verbrennen konnte.',
    },
    {
      title: 'Hat alles toll geklappt',
      comment: 'Holz ist dort abgeladen worden wo gewünscht, ohne Probleme und das Holz scheint top zu sein. Vorfreude aufs Heizen ist riesig!',
    },
    {
      title: '10 RM Buchenholz in sehr guter Qualität',
      comment: 'Buchenholz in sehr guter Qualität. Der Fahrer war sehr entgegenkommend und hilfsbereit beim Abladen.',
    },
    {
      title: 'Top, jederzeit wieder',
      comment: 'Lieferung erfolgte schneller als angegeben. Palette war gut verpackt, sehr gute Holzstücke. Spedition hat die Palette direkt in unser Carport gefahren.',
    },
    {
      title: 'Perfekt getrocknetes Holz',
      comment: 'Die Qualität des Holzes ist hervorragend. Trocken, guter Zuschnitt. Information über Anlieferung per Mail. Kompetente Anlieferung.',
    },
    {
      title: 'Sehr gut verpackt und geschichtet',
      comment: 'Das Holz ist von absolut bester Qualität und die Paletten sind sehr stabil und zusätzlich mit Netz umwickelt. TOP!',
    },
    {
      title: 'Saubere Lieferung und schönes Flammenbild',
      comment: 'Es ist sehr sauber und gut gelivered worden. Habe es gleich benutzt, das Feuer hat ein schönes Flammenbild und hält die Glut gut.',
    },
    {
      title: 'Ausgesprochen zufrieden',
      comment: 'Das Brennholz brennt sehr gut an, wenig Rauchbildung und langanhaltende Wärme. Werde definitiv wieder hier bestellen.',
    },
    {
      title: 'Exzellente Abwicklung',
      comment: 'Pünktliche Anlieferung, sehr freundlicher Fahrer und hervorragendes Kaminholz. Besser geht es nicht.',
    },
  ],

  briquettes: [
    {
      title: 'Unkomplizierte Bestellung einer Palette Holzbriketts',
      comment: 'Unkomplizierte Bestellung und schnelle Lieferung. Der Bestellung einer Palette Holzbriketts folgte eine sehr schnelle Lieferung. Ich würde jederzeit wieder bestellen.',
    },
    {
      title: 'Starke Hitzeentwicklung und lange Brenndauer',
      comment: 'Die Holzbriketts brennen sehr gleichmäßig und halten die Glut extrem lange. Kaum Ascherückstände im Kaminofen.',
    },
    {
      title: 'Sehr saubere Verpackung und Handhabung',
      comment: 'Kein Schmutz und keine Rinde im Wohnzimmer. Die Paket-Verpackung schützt die Briketts perfekt vor Feuchtigkeit.',
    },
    {
      title: 'Hervorragende Pressung (Pini-Kay / RUF)',
      comment: 'Hohe Dichte, zerfallen nicht beim Transport. Das Loch in der Mitte sorgt für einen optimalen Zug und schöne Flammen.',
    },
    {
      title: 'Lieferung direkt an den Wunschort',
      comment: 'Spedition hat die Brikett-Palette mit der Ameise genau dorthin gefahren, wo ich sie haben wollte. Top Service!',
    },
    {
      title: 'Tolle Alternative zu Scheitholz',
      comment: 'Kompakte Lagerung, nimmt wenig Platz ein und heizt den Raum im Handumdrehen auf. Sehr hohe Qualität.',
    },
    {
      title: 'Erstklassige Holzbriketts',
      comment: 'Die Briketts brennen ruhig und ohne Funkenflug. Hervorragender Heizwert für kalte Wintertage.',
    },
    {
      title: 'Sehr gute Erfahrung gemacht',
      comment: 'Schnelle Lieferung, freundlicher Kundenservice und einwandfreie Ware auf Palette. 5 Sterne!',
    },
    {
      title: 'Dichte und trockene Briketts',
      comment: 'Das Holz ist absolut trocken und brennt perfekt ab. Wenig Asche zu entsorgen.',
    },
    {
      title: 'Lieferung schneller als gedacht',
      comment: 'Innerhalb von 3 Tagen geliefert. Die Palette war sicher verschachtelt und foliert.',
    },
    {
      title: 'Super Preis-Leistungs-Verhältnis',
      comment: 'Gute Briketts zu einem fairen Preis inklusive Versand. Bin rundum zufrieden.',
    },
    {
      title: 'Gerne wieder!',
      comment: 'Alles hat reibungslos geklappt. Nette Kommunikation und top Ware.',
    },
  ],

  allumage: [
    {
      title: 'Schnelles und sauberes Anzünden',
      comment: 'Das Anzündholz ist extrem trocken und brennt sofort ab. Macht das Anfeuern des Kamins zum Kinderspiel.',
    },
    {
      title: 'Geruchlos und sehr effektiv',
      comment: 'Keine chemischen Gerüche im Haus. Ein bis zwei Stück genügen, um selbst größere Scheite zu entzünden.',
    },
    {
      title: 'Sehr praktische Verpackung',
      comment: 'Kompakt im Sack/Karton verpackt, lässt sich sauber neben dem Ofen lagern.',
    },
    {
      title: 'Hohe Qualität der Holzwolle-Anzünder',
      comment: 'Brennen lange genug, um das Anzündholz sicher zu entflammen. Sehr zu empfehlen.',
    },
    {
      title: 'Schnelle Lieferung und gute Qualität',
      comment: 'Schnell geliefert, trockenes Holz und prima Kundenservice. Nichts zu bemängeln.',
    },
    {
      title: 'Sehr zufrieden',
      comment: 'Top Ware für ein schnelles Feuer ohne Qualm. Kaufe ich bei der nächsten Bestellung wieder mit.',
    },
    {
      title: 'Zuverlässiges Anzünden jeden Morgen',
      comment: 'Funktioniert einwandfrei. Ein unverzichtbares Zubehör für den Kaminofen.',
    },
    {
      title: 'Spitzenklasse',
      comment: 'Absolut trockenes Anfeuerholz, sauber geschnitten und gebrauchsfertig.',
    },
  ],
};

const productNameMap: Record<number, string> = {
  1: 'Granulés de bois – sac',
  2: 'Granulés EPH Premium DINplus/ENplus A1',
  3: 'Granulés de bois ENplus A1 – sac',
  4: 'Granulés de bois économiques – sac',
  5: 'Bûches de chêne sèches',
  7: 'Bûches de bouleau sèches',
  10: 'Briquettes Pini-Kay (origine Pays-Bas)',
  11: 'Briquettes RUF – paquet',
  13: 'Bûchettes d’allumage sèches',
  14: 'Bois d’allumage en sac',
  15: 'Bûchettes en filet',
  16: 'Allume-feux en laine de bois',
  17: 'Cubes allume-feux',
  18: 'Granulés de bois économiques – palette',
  19: 'Bûches de bois compressé',
  20: 'Bûches densifiées rondes',
  21: 'Granulés ENplus A1 – palette',
  25: 'Granulés TotalEnergies Premium ENplus A1',
  26: 'Granulés HEIZFUXX Blue ENplus A1',
  27: 'Granulés DINplus – palette petit format',
  28: 'Granulés HELIOS DINplus / ENplus A1',
  30: 'Granulés PROXIMA STAR Premium',
  36: 'Bois de hêtre écorcé – palette filetée',
  40: 'Briquettes rondes de hêtre – palette',
  43: 'Briquettes Biomac Extra',
  48: 'Bois de chêne sec – bûches 33 cm',
  49: 'Granulés FireStixx Premium DINplus/ENplus A1',
  51: 'Briquettes RUF – palette',
  52: 'Briquettes Pini-Kay importées – palette',
  53: 'Briquettes RUF – demi-palette',
  54: 'Briquettes Pini-Kay – demi-palette',
  55: 'Briquettes rondes de hêtre – demi-palette',
  56: 'Granulés Giant Flames – palette',
  57: 'Granulés Giant Flames – demi-palette',
  58: 'Bois de chêne séché au four – filets',
  59: 'Bois de hêtre séché au four – palette',
  60: 'Briquettes Giant Flames – palette',
  61: 'Bois de chauffage mi-sec vrac 25cm',
  62: 'Bois de chauffage mi-sec vrac 33/50cm',
  63: 'Bois de chauffage sec Big Bag 25cm',
  64: 'Bois de chauffage sec Big Bag 33cm',
  65: 'Bois de chauffage sec Big Bag 50cm',
  66: 'Bois de chauffage sec vrac 25cm',
  67: 'Bois de chauffage sec vrac 33cm',
  68: 'Bois de chauffage sec vrac 50cm',
  69: 'Bois de chauffage sec palette 25cm',
  70: 'Bois de chauffage sec palette 33cm',
  71: 'Bois de chauffage sec palette 50cm',
  72: 'Filet de bûches de bois 33cm',
  73: 'Granulés ANTE DIN+ / EN+',
  74: 'Granulés ANTE DIN+ / EN+ – palette',
  75: 'Granulés VERPELLET PELLETS – palette',
  76: 'Granulés VERPELLET PELLETS – sac',
  77: 'Allume-feu écologique laine de bois',
  78: 'Allume-feu sans pétrole',
  79: 'Filet de bois allume-feu',
  80: 'Bois Chêne & Hêtre sec box 2 stères',
  81: 'Bûches Hêtre séchées palette 1,5 stère',
  82: 'Bûches Chêne Pur séchées palette 2 stères'
};

const productReviewCounts = [
  36, 25, 10, 28, 19, 52, 10, 27, 38, 14,
  31, 22, 15, 45, 18, 33, 12, 29, 41, 16,
  35, 20, 11, 26, 48, 17, 30, 13, 24, 39,
  15, 42, 21, 34, 18, 50, 11, 23, 37, 14,
  28, 19, 46, 12, 32, 25, 10, 27, 40, 16,
  33, 21, 13, 30, 17, 44, 15, 29, 36, 18
];

function generateReviewsForProduct(productId: number): Review[] {
  let categoryKey = 'granules';
  if ([5, 7, 36, 48, 58, 59, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 80, 81, 82].includes(productId)) {
    categoryKey = 'bois';
  } else if ([10, 11, 19, 20, 40, 43, 51, 52, 53, 54, 55, 60].includes(productId)) {
    categoryKey = 'briquettes';
  } else if ([13, 14, 15, 16, 17, 77, 78, 79].includes(productId)) {
    categoryKey = 'allumage';
  }

  const templates = reviewTemplates[categoryKey] ?? reviewTemplates.granules;
  const reviewsCount = productReviewCounts[(productId - 1) % productReviewCounts.length];
  const reviews: Review[] = [];
  const name = productNameMap[productId] ?? `Produit #${productId}`;
  const ratingMode = productId % 6;

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

    let rating = 5;
    if (ratingMode === 0) {
      rating = (i % 2 === 0) ? 4 : 5;
    } else if (ratingMode === 1) {
      rating = (i % 5 < 2) ? 4 : 5;
    } else if (ratingMode === 2) {
      rating = (i % 4 === 0) ? 4 : 5;
    } else if (ratingMode === 3) {
      rating = (i % 5 === 0) ? 4 : 5;
    } else if (ratingMode === 4) {
      rating = (i % 9 === 0) ? 4 : 5;
    } else {
      rating = 5;
    }

    reviews.push({
      id: `rev-${productId}-${i + 1}`,
      author,
      location,
      rating,
      date,
      title: template.title,
      comment: template.comment,
      verified: true,
      productName: name,
      productId,
    });
  }

  return reviews;
}

export const reviewsData: Record<number, Review[]> = {};

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
  if (!reviewsData[productId] || reviewsData[productId].length === 0) {
    reviewsData[productId] = generateReviewsForProduct(productId);
  }
  return reviewsData[productId];
}

export function getAverageRating(productId: number): { average: number; count: number } {
  const reviews = getReviewsForProduct(productId);
  if (!reviews.length) return { average: 4.8, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / reviews.length) * 10) / 10;
  return { average, count: reviews.length };
}

export function getAllReviews(): Review[] {
  const all: Review[] = [];
  for (const id of allProductIds) {
    const revs = getReviewsForProduct(id);
    all.push(...revs);
  }
  return all;
}

export function getTotalReviewsSummary(): { totalReviews: number; averageRating: number } {
  const all = getAllReviews();
  const totalSum = all.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = all.length > 0 ? Math.round((totalSum / all.length) * 10) / 10 : 4.8;
  return { totalReviews: all.length, averageRating };
}
