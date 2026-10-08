'use client';
import { useState, type FormEvent } from 'react';
export default function PaymentProofUpload({ reference, token }: { reference: string; token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); const file = form.get('file');
    setSent(false); setError('');
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) { setError('Choisissez un justificatif de 3 Mo maximum.'); return; }
    form.set('reference', reference); form.set('token', token); setBusy(true);
    try {
      const response = await fetch('/api/payment-proof', { method: 'POST', body: form }); const result = await response.json();
      if (!response.ok) setError(result.error ?? 'L’envoi a échoué.'); else setSent(true);
    } catch { setError('L’envoi a échoué. Vérifiez votre connexion.'); } finally { setBusy(false); }
  }
  return <section className="mt-6 rounded-xl border border-stone-200 p-5 text-left">
    <h2 className="text-lg font-bold">Preuve de virement</h2>
    <p className="mt-2 text-sm leading-6 text-gray-600">Après confirmation du montant final et réalisation du virement, joignez votre justificatif bancaire en PDF ou une capture d’écran. L’administrateur vérifiera la réception des fonds avant de confirmer le paiement.</p>
    <form onSubmit={submit} className="mt-4 space-y-3"><label className="block text-sm font-semibold">Justificatif de paiement (PDF, JPG, PNG ou WebP, 3 Mo maximum)<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required disabled={busy} onChange={() => { setSent(false); setError(''); }} className="mt-2 block w-full min-w-0 text-sm" /></label><button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Envoi…' : 'Envoyer la preuve'}</button></form>
    {sent && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">Votre preuve de virement a été sauvegardée avec succès.</p>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
