export const locales = ['de', 'fr', 'en'] as const;
export type Locale = typeof locales[number];
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale);
}
export function stripLocale(path: string) {
  return path.replace(/^\/(de|fr|en)(?=\/|\?|#|$)/, '') || '/';
}
export function localizedPath(path: string, locale: Locale) {
  if (!path.startsWith('/') || path.startsWith('//') || /^\/api(?:\/|$)/.test(path)) return path;
  const clean = stripLocale(path);
  return `/${locale}${clean === '/' ? '' : clean}`;
}
export function detectLocale(preference: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(preference)) return preference;
  const preferred = (acceptLanguage ?? '').split(',').map((entry, index) => {
    const [tag, ...params] = entry.trim().split(';');
    const q = params.find((param) => param.trim().startsWith('q='));
    return { tag: tag.toLowerCase().split('-')[0], weight: q ? Number(q.trim().slice(2)) : 1, index };
  }).filter((entry) => entry.weight > 0 && entry.weight <= 1).sort((a, b) => b.weight - a.weight || a.index - b.index)[0]?.tag;
  return isLocale(preferred) ? preferred : 'de';
}
