'use client';
import { useRef, useState, type FormEvent } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
export default function PaymentProofUpload({ reference, token }: { reference: string; token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
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
    <p className="mt-2 text-sm leading-6 text-gray-600">Virement effectué ? Ajoutez votre reçu bancaire ou une capture d’écran, puis envoyez votre preuve de paiement.</p>
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-5 text-center">
        <Upload className="mx-auto text-orange-600" size={32} aria-hidden="true" />
        <p className="mt-3 font-bold text-gray-950">1. Ajoutez votre justificatif</p>
        <p className="mt-1 text-sm text-gray-600">PDF, JPG, PNG ou WebP · 3 Mo maximum</p>
        <input ref={fileInput} name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" disabled={busy} aria-label="Sélectionner une preuve de paiement" onChange={(event) => { setFileName(event.target.files?.[0]?.name ?? ''); setSent(false); setError(''); }} className="sr-only" tabIndex={-1} />
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50"><Upload size={18} aria-hidden="true" />{fileName ? 'Changer le fichier' : 'Ajouter ma preuve de paiement'}</button>
        {fileName ? <p role="status" className="mt-3 flex items-start justify-center gap-2 text-sm font-semibold text-gray-800"><FileCheck2 size={18} className="shrink-0" aria-hidden="true" /><span className="min-w-0 break-all">{fileName}</span></p> : <p className="mt-3 text-sm text-gray-600">Sélectionnez un fichier sur votre téléphone ou ordinateur.</p>}
      </div>
      <button type="submit" disabled={busy || !fileName || sent} className="w-full rounded-lg bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Envoi…' : sent ? 'Preuve envoyée' : '2. Envoyer ma preuve de paiement'}</button>
    </form>
    {sent && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">Votre preuve de virement a été sauvegardée avec succès.</p>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
