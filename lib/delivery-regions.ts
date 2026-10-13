export type DeliveryRegion = { name: string; slug: string; cities: string[] };
export const deliveryRegions: DeliveryRegion[] = [
  {
    "name": "Baden-Württemberg",
    "slug": "baden-wurttemberg",
    "cities": [
      "Stuttgart",
      "Mannheim",
      "Karlsruhe",
      "Freiburg im Breisgau",
      "Heidelberg",
      "Ulm"
    ]
  },
  {
    "name": "Bayern",
    "slug": "bayern",
    "cities": [
      "München",
      "Nürnberg",
      "Augsburg",
      "Regensburg",
      "Würzburg",
      "Ingolstadt"
    ]
  },
  {
    "name": "Berlin",
    "slug": "berlin",
    "cities": [
      "Berlin"
    ]
  },
  {
    "name": "Brandenburg",
    "slug": "brandenburg",
    "cities": [
      "Potsdam",
      "Cottbus",
      "Brandenburg an der Havel",
      "Frankfurt (Oder)"
    ]
  },
  {
    "name": "Bremen",
    "slug": "bremen",
    "cities": [
      "Bremen",
      "Bremerhaven"
    ]
  },
  {
    "name": "Hamburg",
    "slug": "hamburg",
    "cities": [
      "Hamburg"
    ]
  },
  {
    "name": "Hessen",
    "slug": "hessen",
    "cities": [
      "Frankfurt am Main",
      "Wiesbaden",
      "Kassel",
      "Darmstadt",
      "Offenbach am Main"
    ]
  },
  {
    "name": "Mecklenburg-Vorpommern",
    "slug": "mecklenburg-vorpommern",
    "cities": [
      "Rostock",
      "Schwerin",
      "Neubrandenburg",
      "Stralsund",
      "Greifswald"
    ]
  },
  {
    "name": "Niedersachsen",
    "slug": "niedersachsen",
    "cities": [
      "Hannover",
      "Braunschweig",
      "Oldenburg",
      "Osnabrück",
      "Wolfsburg",
      "Göttingen"
    ]
  },
  {
    "name": "Nordrhein-Westfalen",
    "slug": "nordrhein-westfalen",
    "cities": [
      "Köln",
      "Düsseldorf",
      "Dortmund",
      "Essen",
      "Münster",
      "Bielefeld",
      "Aachen",
      "Gronau"
    ]
  },
  {
    "name": "Rheinland-Pfalz",
    "slug": "rheinland-pfalz",
    "cities": [
      "Mainz",
      "Ludwigshafen am Rhein",
      "Koblenz",
      "Trier",
      "Kaiserslautern"
    ]
  },
  {
    "name": "Saarland",
    "slug": "saarland",
    "cities": [
      "Saarbrücken",
      "Neunkirchen",
      "Homburg",
      "Saarlouis",
      "Merzig"
    ]
  },
  {
    "name": "Sachsen",
    "slug": "sachsen",
    "cities": [
      "Leipzig",
      "Dresden",
      "Chemnitz",
      "Zwickau",
      "Görlitz"
    ]
  },
  {
    "name": "Sachsen-Anhalt",
    "slug": "sachsen-anhalt",
    "cities": [
      "Magdeburg",
      "Halle (Saale)",
      "Dessau-Roßlau",
      "Wittenberg"
    ]
  },
  {
    "name": "Schleswig-Holstein",
    "slug": "schleswig-holstein",
    "cities": [
      "Kiel",
      "Lübeck",
      "Flensburg",
      "Neumünster",
      "Norderstedt"
    ]
  },
  {
    "name": "Thüringen",
    "slug": "thuringen",
    "cities": [
      "Erfurt",
      "Jena",
      "Gera",
      "Weimar",
      "Eisenach"
    ]
  }
];

export function deliveryMapUrl(query: string, region: string) {
  const url = new URL('https://www.google.com/maps/search/');
  url.search = new URLSearchParams({ api: '1', query: query.trim() + ', ' + region + ', Deutschland' }).toString();
  return url.href;
}
