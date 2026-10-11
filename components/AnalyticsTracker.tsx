'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { supabase } from '@/lib/supabase';
import { useVerifiedAccess } from './AccessContext';
import { analyticsConsentKey, analyticsSessionKey, analyticsConsentVersion, analyticsPath, analyticsKinds, type AnalyticsEvent, type AnalyticsKind } from '@/lib/analytics';
import { analyticsCopy, analyticsPrivacySignalCopy } from '@/lib/analytics-copy';

type Consent = { mode: 'anonymous' | 'linked' | 'declined'; expires: number; version: string };
function readConsent(): Consent | null {
  try { const data = JSON.parse(localStorage.getItem(analyticsConsentKey) ?? 'null'); return data && data.version === analyticsConsentVersion && data.expires > Date.now() && ['anonymous','linked','declined'].includes(data.mode) ? data : null; } catch { return null; }
}
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const copy = analyticsCopy[locale];
  const access = useVerifiedAccess();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [linked, setLinked] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const account = access.user?.id;
  useEffect(() => {
    const saved = readConsent(); setConsent(saved); setLinked(saved?.mode === 'linked'); setReady(true); setOpen(!saved);
    setBlocked(navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true);
    const settings = () => { setOpen(true); setLinked(readConsent()?.mode === 'linked'); };
    const sync = (event: StorageEvent) => {
      if (event.key !== analyticsConsentKey && event.key !== null) return;
      const next = readConsent(); setConsent(next);
      try { sessionStorage.removeItem(analyticsSessionKey); } catch { /* Collection stops when consent is unavailable. */ }
      if (!next) setOpen(true);
    };
    window.addEventListener('bren-analytics-settings', settings); window.addEventListener('storage', sync);
    return () => { window.removeEventListener('bren-analytics-settings', settings); window.removeEventListener('storage', sync); };
  }, []);
  function choose(mode: Consent['mode']) {
    const next = { mode, version: analyticsConsentVersion, expires: Date.now() + 180 * 86400000 };
    try { localStorage.setItem(analyticsConsentKey, JSON.stringify(next)); if (mode === 'declined' || mode !== consent?.mode) sessionStorage.removeItem(analyticsSessionKey); } catch { /* No persistence means no collection. */ }
    setConsent(next); setOpen(false);
  }
  useEffect(() => {
    const path = analyticsPath(pathname);
    if (!ready || blocked || !access.verified || access.role || !path || !consent || consent.mode === 'declined' || readConsent()?.mode !== consent.mode) return;
    const owner = consent.mode === 'linked' ? account ?? 'anonymous' : 'anonymous';
    let source = 'direct';
    try { const referrer = new URL(document.referrer); if (referrer.hostname !== location.hostname) source = referrer.hostname.slice(0,120); } catch { /* Direct visit. */ }
    let session: { id: string; last: number; owner: string; source: string };
    try {
      const saved = JSON.parse(sessionStorage.getItem(analyticsSessionKey) ?? 'null');
      session = saved && saved.owner === owner && Date.now()-saved.last < 1800000 ? saved : { id: crypto.randomUUID(), last: Date.now(), owner, source };
      sessionStorage.setItem(analyticsSessionKey, JSON.stringify(session));
    } catch { return; }
    let pageId = crypto.randomUUID();
    let queue: AnalyticsEvent[] = [];
    let sending = false, stopped = false, backoff = 0, cachedToken: string | undefined;
    const controller = new AbortController();
    const device = matchMedia('(max-width: 767px)').matches ? 'mobile' : matchMedia('(max-width: 1023px)').matches ? 'tablet' : 'desktop';
    const seen = new Set<string>();
    const add = (kind: AnalyticsKind, section = '', seconds = 0) => {
      if (stopped || document.visibilityState !== 'visible' || readConsent()?.mode !== consent.mode) return;
      if (Date.now()-session.last >= 1800000) { session = { id: crypto.randomUUID(), last: Date.now(), owner, source: 'direct' }; pageId = crypto.randomUUID(); seen.clear(); queue = []; queue.push({ id: crypto.randomUUID(), session_id: session.id, page_id: pageId, kind: 'page_view', path, section: '', seconds: 0, locale, device, source: session.source }); }
      session.last = Date.now(); try { sessionStorage.setItem(analyticsSessionKey, JSON.stringify(session)); } catch { return; }
      if (queue.length < 100) queue.push({ id: crypto.randomUUID(), session_id: session.id, page_id: pageId, kind, path, section, seconds, locale, device, source: session.source });
    };
    const flush = async () => {
      if (sending || stopped || !queue.length || Date.now()<backoff || readConsent()?.mode !== consent.mode) return;
      sending = true;
      const batch = queue.splice(0,20);
      try {
        let token: string | undefined;
        if (consent.mode === 'linked' && account) {
          const result = await supabase?.auth.getSession();
          if (result?.data.session?.user.id !== account) return;
          token = result.data.session.access_token;
          cachedToken = token;
        }
        if (stopped || readConsent()?.mode !== consent.mode) return;
        const response = await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ consent: analyticsConsentVersion, events: batch }), signal: controller.signal, keepalive: true });
        if (!response.ok) { backoff = Date.now() + (response.status === 503 ? 300000 : 60000); if (response.status !== 400 && response.status !== 401 && !stopped) queue = [...batch,...queue].slice(0,100); }
      } catch { if (!stopped) { queue = [...batch,...queue].slice(0,100); backoff = Date.now()+60000; } }
      finally { sending = false; }
    };
    add('page_view'); void flush();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const section = (entry.target as HTMLElement).dataset.analyticsSection;
        if (entry.isIntersecting && section && !seen.has(section)) { seen.add(section); add('section_view', section); }
      }
      void flush();
    }, { threshold: 0.15 });
    const observeSections = () => document.querySelectorAll('main section').forEach((element,index) => { const section = element as HTMLElement; if (!section.dataset.analyticsSection) section.dataset.analyticsSection=`section-${index+1}`; observer.observe(section); });
    observeSections();
    const mutation = new MutationObserver(observeSections);
    mutation.observe(document.body, { childList: true, subtree: true });
    const action = (event: Event) => { const detail = (event as CustomEvent<{ kind: AnalyticsKind; section: string }>).detail; if (detail && analyticsKinds.includes(detail.kind) && !['engagement','page_view','section_view'].includes(detail.kind) && /^[a-z0-9-]{0,80}$/.test(detail.section)) { add(detail.kind, detail.section); void flush(); } };
    let activeSince = Date.now();
    const engagement = () => { const now = Date.now(); const seconds = Math.min(30, Math.floor((now-activeSince)/1000)); if (seconds>0) add('engagement','',seconds); activeSince=now; void flush(); };
    const visibility = () => { activeSince=Date.now(); if (document.visibilityState === 'visible') void flush(); };
    const batchTimer = setInterval(() => void flush(),5000), activeTimer = setInterval(engagement,30000);
    document.addEventListener('visibilitychange',visibility); window.addEventListener('bren-analytics-action',action);
    return () => {
      stopped=true;
      const permitted = readConsent()?.mode === consent.mode;
      if (!permitted) controller.abort();
      if (permitted && Date.now()>=backoff && queue.length && (owner==='anonymous' || cachedToken)) void fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json',...(cachedToken ? {Authorization:`Bearer ${cachedToken}`} : {})}, body:JSON.stringify({consent:analyticsConsentVersion,events:queue.slice(0,20)}),keepalive:true }).catch(()=>{});
      queue=[]; observer.disconnect(); mutation.disconnect(); clearInterval(batchTimer); clearInterval(activeTimer); document.removeEventListener('visibilitychange',visibility); window.removeEventListener('bren-analytics-action',action);
    };
  }, [pathname, locale, ready, consent, blocked, access.verified, access.role, account]);
  if (!ready || !open || access.role || !analyticsPath(pathname)) return null;
  return <section data-original-content role="dialog" aria-labelledby="analytics-consent-title" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
    <h2 id="analytics-consent-title" className="font-black text-gray-950">{copy.consentTitle}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{copy.consentNote}</p>
    {blocked && <p role="status" className="mt-2 text-sm text-gray-600">{analyticsPrivacySignalCopy[locale]}</p>}
    <label className="mt-3 flex items-start gap-3 text-sm text-gray-700"><input type="checkbox" checked={linked} disabled={blocked} onChange={event=>setLinked(event.target.checked)} className="mt-1 h-4 w-4 accent-orange-600"/>{copy.linkAccount}</label>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={()=>choose('declined')} className="rounded-lg border border-stone-300 px-4 py-3 text-sm font-bold text-gray-950 hover:bg-stone-100">{copy.refuse}</button><button type="button" disabled={blocked} onClick={()=>choose(linked?'linked':'anonymous')} className="rounded-lg border border-stone-300 px-4 py-3 text-sm font-bold text-gray-950 hover:bg-stone-100 disabled:opacity-50">{copy.accept}</button><Link href="/datenschutz" className="text-sm text-orange-700 underline">{copy.privacy}</Link></div>
  </section>;
}
