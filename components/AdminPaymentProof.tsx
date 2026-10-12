'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
export default function AdminPaymentProof({ reference }: { reference: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  async function load() {
    if (!supabase || busy) return;
    setBusy(true); setError(''); setUrl('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setError('Reconnectez-vous pour consulter la preuve.'); return; }
      const response = await fetch(`/api/payment-proof?reference=${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? 'Preuve indisponible.'); else setUrl(result.url);
    } catch { setError('Impossible de charger la preuve.'); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void load()}
        className="rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-sm font-semibold text-zinc-800 shadow-2xs transition disabled:opacity-50"
      >
        {busy ? 'Chargement…' : 'Consulter la preuve de virement'}
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800 underline"
        >
          Ouvrir le justificatif (lien valable 1 min)
        </a>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
