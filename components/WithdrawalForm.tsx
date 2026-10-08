'use client';
import { useState, type FormEvent } from 'react';
import { storeConfig } from '@/lib/store-config';

type Declaration = { name: string; email: string; contract: string; id: string };
export default function WithdrawalForm() {
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [receipt, setReceipt] = useState<{ text: string; emailSent: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = 'mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-gray-950';
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setDeclaration({ name: String(form.get('name')).trim(), email: String(form.get('email')).trim(), contract: String(form.get('contract')).trim(), id: crypto.randomUUID() });
    setError('');
  }
  async function confirm() {
    if (!declaration || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/withdrawal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(declaration) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Votre déclaration n’a pas pu être envoyée.');
      setReceipt({ text: result.receipt, emailSent: result.emailSent });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Veuillez réessayer.'); }
    finally { setBusy(false); }
  }
  function download() {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([receipt.text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'confirmation-retractation.txt'; link.click(); URL.revokeObjectURL(url);
  }
  return <section id="retractation" className="scroll-mt-32 rounded-xl border-2 border-orange-200 p-5"><h2 className="text-xl font-bold">Me rétracter du contrat</h2><p className="mt-2 text-sm">Aucune connexion nécessaire. Cette démarche ne déclenche aucun remboursement automatique.</p>
    {receipt ? <div role="status" className="mt-4"><p>Votre déclaration a été reçue par Bren-nholz.</p><p>{receipt.emailSent ? 'Un accusé de réception a été envoyé à votre adresse e-mail.' : 'L’accusé de réception par e-mail n’a pas pu être envoyé. Téléchargez votre confirmation et contactez-nous si nécessaire.'}</p><button type="button" onClick={download} className="mt-3 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white">Télécharger la confirmation</button><pre className="mt-4 whitespace-pre-wrap break-words text-sm">{receipt.text}</pre></div>
      : declaration ? <div className="mt-4 space-y-3"><p>Je déclare me rétracter du contrat ou des articles identifiés ci-dessous.</p><dl><dt className="font-bold">Nom</dt><dd>{declaration.name}</dd><dt className="font-bold">Contrat ou articles concernés</dt><dd className="whitespace-pre-wrap">{declaration.contract}</dd><dt className="font-bold">Adresse de l’accusé de réception</dt><dd>{declaration.email}</dd></dl><div className="flex flex-wrap gap-3"><button type="button" onClick={() => void confirm()} disabled={busy} className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Envoi…' : 'Confirmer la rétractation'}</button><button type="button" disabled={busy} onClick={() => setDeclaration(null)} className="rounded-lg border px-5 py-3 font-bold">Modifier</button></div></div>
      : <form onSubmit={review} className="mt-4 space-y-4"><label className="block font-semibold">Nom complet *<input required name="name" autoComplete="name" maxLength={120} className={input} /></label><label className="block font-semibold">E-mail pour l’accusé de réception *<input required name="email" type="email" autoComplete="email" maxLength={254} className={input} /></label><label className="block font-semibold">Référence de commande ou informations identifiant le contrat et les articles concernés *<textarea required name="contract" maxLength={2000} rows={3} className={input} /></label><button type="submit" className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white">Continuer vers la confirmation</button></form>}
    {error && <p role="alert" className="mt-3 text-red-700">{error} Vous pouvez aussi notifier votre rétractation à <a href={`mailto:${storeConfig.email}`} className="underline">{storeConfig.email}</a>.</p>}
  </section>;
}
