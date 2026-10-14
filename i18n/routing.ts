export const locales = ['de'] as const;
export type Locale = typeof locales[number];
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale);
}
export function stripLocale(path: string) {
  return path.replace(/^\/(de)(?=\/|\?|#|$)/, '') || '/';
}
export function localizedPath(path: string, _locale: Locale) {
  if (!path.startsWith('/') || path.startsWith('//') || /^\/api(?:\/|$)/.test(path)) return path;
  return stripLocale(path);
}
export function detectLocale(preference: string | undefined, acceptLanguage: string | null): Locale {
  return 'de';
}
