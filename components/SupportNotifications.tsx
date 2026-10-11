'use client';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';
import { useVerifiedAccess } from './AccessContext';
import type { Locale } from '@/i18n/routing';

const words = {
  de: { support: 'Ungelesene Nachrichten', contacts: 'Neue Kontaktanfragen', disabled: 'E-Mail-Benachrichtigungen: SMTP noch nicht eingerichtet.', pending: 'E-Mails in der Warteschlange', retry: 'E-Mails erneut senden', sending: 'Versand läuft …', error: 'Benachrichtigungen konnten nicht geladen oder gesendet werden.', updated: 'Versand geprüft. Der Status wird aktualisiert.' },
  fr: { support: 'Messages non lus', contacts: 'Nouvelles demandes de contact', disabled: 'Notifications e-mail : SMTP pas encore configuré.', pending: 'E-mails en attente', retry: 'Relancer les e-mails', sending: 'Envoi en cours…', error: 'Impossible de charger ou d’envoyer les notifications.', updated: 'Envoi vérifié. Le statut est actualisé.' },
  en: { support: 'Unread messages', contacts: 'New contact requests', disabled: 'Email notifications: SMTP is not configured yet.', pending: 'Queued emails', retry: 'Retry emails', sending: 'Sending…', error: 'Unable to load or send notifications.', updated: 'Delivery checked. Status refreshed.' },
};
type Counts = { support: number; contacts: number; mail?: { pending: number; failed: number; configured: boolean } };
function useCounts() {
  const { user, verified } = useVerifiedAccess();
  const accountId = user?.id;
  const [state, setState] = useState<{ user: string; data: Counts } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!accountId || !verified || !supabase) return;
    let active = true;
    let busy = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    const account = accountId;
    const load = async () => {
      if (!active || busy || !navigator.onLine) return;
      busy = true;
      try {
        const { data } = await supabase!.auth.getSession();
        if (!data.session || data.session.user.id !== account) return;
        const r = await fetch('/api/support?notifications=1', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (!r.ok) {
          const wait = r.status === 429 ? Number(r.headers.get('Retry-After')) : 0;
          if (active && retries < 1 && (r.status === 429 || r.status >= 500)) {
            retries++; retryTimer = setTimeout(() => { retryTimer = undefined; void load(); }, Math.min(3600, Math.max(3, wait || 3)) * 1000); return;
          }
          throw new Error();
        }
        const counts = await r.json();
        if (typeof counts.support !== 'number' || typeof counts.contacts !== 'number') throw new Error();
        if (active) { retries = 0; setState({ user: account, data: counts }); setError(false); }
      } catch {
        if (active && retries < 1) {
          retries++; retryTimer = setTimeout(() => { retryTimer = undefined; void load(); }, 3000);
        } else if (active) setError(true);
      } finally { busy = false; }
    };
    void load();
    const refresh = () => { if (document.visibilityState === 'visible' && !retryTimer) void load(); };
    const timer = setInterval(refresh, 30000);
    window.addEventListener('bren-support-updated', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    return () => { active = false; clearInterval(timer); clearTimeout(retryTimer); window.removeEventListener('online', refresh); window.removeEventListener('bren-support-updated', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [accountId, verified]);
  return { counts: state && verified && user?.id === state.user ? state.data : null, error };
}
export function SupportUnreadBadge() {
  const { counts } = useCounts();
  if (!counts?.support) return null;
  return <span aria-label={String(counts.support)} className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">{counts.support > 99 ? '99+' : counts.support}</span>;
}
export default function SupportNotifications() {
  const locale = useLocale() as Locale;
  const copy = words[locale];
  const { counts, error } = useCounts();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const retry = useCallback(async () => {
    setSending(true); setNotice('');
    try {
      if (!supabase) throw new Error();
      const { data } = await supabase.auth.getSession(); if (!data.session) throw new Error();
      const r = await fetch('/api/support', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retry_mail' }), signal: AbortSignal.timeout(45000) });
      const result = await r.json();
      if (!r.ok || !result.configured || result.failed > 0) throw new Error();
      setNotice(copy.updated); window.dispatchEvent(new Event('bren-support-updated'));
    } catch { setNotice(copy.error); } finally { setSending(false); }
  }, [copy]);
  return <section data-original-content className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
    <div className="flex flex-wrap gap-4"><Link href="/admin#support-messages" onClick={() => window.dispatchEvent(new Event('bren-admin-messages'))} className="font-bold text-orange-800 underline">{copy.support}: {counts?.support ?? '…'}</Link><Link href="/admin#contact-requests" onClick={() => window.dispatchEvent(new Event('bren-admin-workspace'))} className="font-bold text-orange-800 underline">{copy.contacts}: {counts?.contacts ?? '…'}</Link></div>
    {counts?.mail && <div className="mt-3 text-sm text-gray-700">{!counts.mail.configured ? <p>{copy.disabled}</p> : <><span>{copy.pending}: {counts.mail.pending}</span>{counts.mail.pending > 0 && <button type="button" disabled={sending} onClick={() => void retry()} className="ml-3 cursor-pointer rounded-lg border border-orange-300 bg-white px-3 py-2 font-bold disabled:opacity-50">{sending ? copy.sending : copy.retry}</button>}</>}</div>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{locale === 'fr' ? 'Impossible d’actualiser les compteurs. Nouvelle tentative automatique.' : locale === 'en' ? 'Unable to refresh counts. Retrying automatically.' : 'Die Zähler konnten nicht aktualisiert werden. Ein neuer Versuch erfolgt automatisch.'}</p>}{notice && <p role="status" className="mt-2 text-sm">{notice}</p>}
  </section>;
}
