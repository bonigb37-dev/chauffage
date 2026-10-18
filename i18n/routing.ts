export const locales = ['de'] as const;
// Legacy types remain compatible with saved data; German is the only served locale.
export type Locale = 'de' | 'fr' | 'en';
export function isLocale(value: unknown): value is Locale {
  return value === 'de';
}
export function stripLocale(path: string) {
  return path.replace(/^\/(de|fr|en)(?=\/|\?|#|$)/, '') || '/';
}
// Public German URLs map to the existing internal Next.js routes.
const pagePaths: [string, string][] = [
  ['/produits/categorie/bois-de-chauffage', '/produkte/kategorie/brennholz'],
  ['/produits/categorie/granules-de-bois', '/produkte/kategorie/holzpellets'],
  ['/produits/categorie/briquettes-de-bois', '/produkte/kategorie/holzbriketts'],
  ['/produits/categorie/bois-allumage', '/produkte/kategorie/anzuendholz'],
  ['/commande/succes', '/kasse/bestaetigung'],
  ['/commande', '/kasse'], ['/produits', '/produkte'],
  ['/panier', '/warenkorb'], ['/compte', '/konto'],
  ['/frais-livraison', '/versandkosten'], ['/livraison', '/lieferung'],
  ['/a-propos', '/ueber-uns'], ['/contact', '/kontakt'],
  ['/avis-juridique', '/impressum'], ['/retractation', '/widerruf'],
  ['/devis', '/angebot'], ['/guide-pellets', '/pellet-ratgeber'],
  ['/guide-granules', '/pellet-ratgeber'], ['/services', '/leistungen'],
  ['/aide', '/hilfe'],
];
function replacePagePath(path: string, reverse = false) {
  for (const [internal, german] of pagePaths) {
    const source = reverse ? german : internal;
    if (path === source || ['/', '?', '#'].some(boundary => path.startsWith(source + boundary))) {
      return (reverse ? internal : german) + path.slice(source.length);
    }
  }
  return path;
}
export function internalPath(path: string) { return replacePagePath(stripLocale(path), true); }
export function localizedPath(path: string, locale: Locale) {
  if (!path.startsWith('/') || path.startsWith('//') || /^\/api(?:\/|$)/.test(path)) return path;
  void locale;
  const clean = replacePagePath(internalPath(path));
  return `/de${clean === '/' ? '' : clean}`;
}
export function detectLocale(preference: string | undefined, acceptLanguage: string | null): Locale {
  void preference;
  void acceptLanguage;
  return 'de';
}
