'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
export default function AdminPaymentProof({ reference }: { reference: string }) {
  const brenLocale = useLocale() as Locale;

  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  async function load() {
    if (!supabase || busy) return;
    setBusy(true); setError(''); setUrl('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setError('Melden Sie sich erneut an, um den Zahlungsbeleg einzusehen.'); return; }
      const response = await fetch(`/api/payment-proof?reference=${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? 'Zahlungsbeleg nicht verfügbar.'); else setUrl(result.url);
    } catch { setError('Der Zahlungsbeleg konnte nicht geladen werden.'); } finally { setBusy(false); }
  }
  return localizeNode(<div className="mt-3"><button type="button" disabled={busy} onClick={() => void load()} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold disabled:opacity-50">{busy ? 'Wird geladen …' : 'Zahlungsbeleg einsehen'}</button>{url && <a href={url} target="_blank" rel="noopener noreferrer" className="ml-3 text-sm font-semibold text-orange-700 underline">Zahlungsnachweis öffnen (Link 1 Minute gültig)</a>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>, brenLocale);
}
