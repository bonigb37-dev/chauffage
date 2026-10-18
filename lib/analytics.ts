export const analyticsConsentKey = 'bren-analytics-consent-v1';
export const analyticsSessionKey = 'bren-analytics-session-v1';
export const analyticsConsentVersion = '2026-10-v1';
export const analyticsKinds = ['page_view', 'section_view', 'engagement', 'cart_add', 'contact_sent', 'quote_sent', 'order_sent'] as const;
export type AnalyticsKind = typeof analyticsKinds[number];
export type AnalyticsEvent = { id: string; session_id: string; page_id: string; kind: AnalyticsKind; path: string; section: string; seconds: number; locale: 'de' | 'fr' | 'en'; device: 'mobile' | 'tablet' | 'desktop'; source: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function analyticsPath(input: string) {
  const path = input.split(/[?#]/)[0].replace(/^\/(de|fr|en)(?=\/|$)/, '') || '/';
  if (!/^\/[a-z0-9/-]*$/i.test(path) || path.length > 220 || /^\/(admin|super-admin|api|compte|konto|aide|hilfe)(\/|$)/.test(path)) return null;
  // Confirmation pages can contain order references; record only the generic route.
  return path;
}
export function validateAnalyticsEvents(input: unknown): AnalyticsEvent[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) return null;
  const events: AnalyticsEvent[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') return null;
    const e = item as Record<string, unknown>;
    if (![e.id, e.session_id, e.page_id].every(value => typeof value === 'string' && uuid.test(value)) || typeof e.path !== 'string' || analyticsPath(e.path) !== e.path || typeof e.kind !== 'string' || !analyticsKinds.includes(e.kind as AnalyticsKind) || !['de','fr','en'].includes(String(e.locale)) || !['mobile','tablet','desktop'].includes(String(e.device)) || typeof e.section !== 'string' || !/^[a-z0-9-]{0,80}$/.test(e.section) || !Number.isInteger(e.seconds) || Number(e.seconds) < 0 || Number(e.seconds) > 30 || typeof e.source !== 'string' || !/^[a-z0-9.-]{1,120}$/i.test(e.source)) return null;
    if ((e.kind === 'engagement') !== (Number(e.seconds) > 0) || (e.kind === 'section_view' && !e.section)) return null;
    // Pick fields explicitly: never store forged user IDs, query strings or arbitrary payloads.
    events.push({ id: String(e.id), session_id: String(e.session_id), page_id: String(e.page_id), kind: e.kind as AnalyticsKind, path: e.path, section: e.section, seconds: Number(e.seconds), locale: e.locale as AnalyticsEvent['locale'], device: e.device as AnalyticsEvent['device'], source: e.source });
  }
  if (events.some(e => e.session_id !== events[0].session_id)) return null;
  return events;
}
export function emitAnalytics(kind: AnalyticsKind, section = '') {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bren-analytics-action', { detail: { kind, section } }));
}
