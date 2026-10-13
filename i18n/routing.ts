export const locales = ['de'] as const;
// Legacy types remain compatible with saved data; German is the only served locale.
export type Locale = 'de' | 'fr' | 'en';
export function isLocale(value: unknown): value is Locale {
  return value === 'de';
}
export function stripLocale(path: string) {
  return path.replace(/^\/(de|fr|en)(?=\/|\?|#|$)/, '') || '/';
}
export function localizedPath(path: string, locale: Locale) {
  if (!path.startsWith('/') || path.startsWith('//') || /^\/api(?:\/|$)/.test(path)) return path;
  void locale;
  const clean = stripLocale(path);
  return `/de${clean === '/' ? '' : clean}`;
}
export function detectLocale(preference: string | undefined, acceptLanguage: string | null): Locale {
  void preference;
  void acceptLanguage;
  return 'de';
}
