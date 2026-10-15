'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useRef, useState, type FormEvent } from 'react';
import { FileCheck2, Upload } from 'lucide-react';

export default function PaymentProofUpload({ reference, token, onSuccess }: { reference: string; token: string; onSuccess?: () => void }) {
  const brenLocale = useLocale() as Locale;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    setSent(false);
    setError('');
    if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024) {
      setError('Wählen Sie ein Dokument mit einer maximalen Dateigröße von 20 MB.');
      return;
    }
    form.set('reference', reference);
    form.set('token', token);
    setBusy(true);
    try {
      const response = await fetch('/api/payment-proof', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Der Upload ist fehlgeschlagen.');
      } else {
        setSent(true);
        onSuccess?.();
      }
    } catch {
      setError('Der Upload ist fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.');
    } finally {
      setBusy(false);
    }
  }

  return localizeNode(
    <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm">
      <div className="overflow-hidden rounded-xl bg-[#0f291e] px-4 py-3 text-center shadow-sm">
        <h2 className="text-base font-bold text-white sm:text-lg">2. Zahlungsbeleg hochladen</h2>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3.5">
        <p className="text-center text-xs font-medium text-stone-600">
          Wählen Sie ein Dokument mit einer maximalen Dateigröße von 20 MB.
        </p>
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 text-center">
          <Upload className="mx-auto text-[#a33d1e]" size={24} aria-hidden="true" />
          <p className="mt-2 text-xs font-bold text-stone-900">Zahlungsnachweis hinzufügen</p>
          <p className="mt-0.5 text-[11px] text-stone-500">PDF, JPG, PNG oder WebP · Maximal 20 MB</p>
          <input
            ref={fileInput}
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            disabled={busy}
            aria-label="Zahlungsbeleg auswählen"
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? '');
              setSent(false);
              setError('');
            }}
            className="sr-only"
            tabIndex={-1}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 shadow-sm transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a33d1e] disabled:opacity-50"
          >
            <Upload size={14} aria-hidden="true" />
            {fileName ? 'Datei ändern' : 'Datei auswählen'}
          </button>
          {fileName ? (
            <p role="status" className="mt-2.5 flex items-start justify-center gap-1.5 text-xs font-semibold text-stone-800">
              <FileCheck2 size={15} className="shrink-0 text-emerald-700" aria-hidden="true" />
              <span className="min-w-0 break-all">{fileName}</span>
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-stone-500">
              Wählen Sie eine Datei von Ihrem Smartphone oder Computer aus.
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy || !fileName || sent}
          className="mx-auto block w-full max-w-sm rounded-lg bg-[#a33d1e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#832f15] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Wird gesendet…' : sent ? 'Beleg gesendet' : 'Zahlungsbeleg absenden'}
        </button>
      </form>
      {sent && (
        <div className="mt-3.5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-center">
          <p role="status" className="text-xs font-bold text-emerald-800">
            ✓ Zahlungsbeleg erfolgreich eingegangen
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700">
            Eine Empfangsbestätigung mit Ihrer Bestellübersicht und dem gezahlten Betrag wurde per E-Mail versendet.
          </p>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-center text-xs text-red-700">{error}</p>}
    </section>,
    brenLocale
  );
}
