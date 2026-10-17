'use client';

import { useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import {
  CheckCircle2,
  CircleHelp,
  Copy,
  Check,
  Truck,
  Clock,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  FileCheck2,
  Loader2,
  Download,
  ChevronLeft,
} from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { parseBankDetails } from '@/lib/bank-details';
import IncludedVatSummary from '@/components/IncludedVatSummary';
import { storeConfig, paymentRecipientExplanation } from '@/lib/store-config';
import PaymentProofUpload from '@/components/PaymentProofUpload';
import { readPendingOrder, markCartCleared, type PendingOrder } from '@/lib/pending-order';
import { useActionLoading } from '@/components/ActionLoadingProvider';


const STEPS = ['Bestellung', 'Zahlung', 'Bestätigung'];

export default function CheckoutSuccessContent() {
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const { clearCart, bankDetails } = useCart();
  const BANK_DETAILS = parseBankDetails(bankDetails);
  const { stopLoading } = useActionLoading();

  useEffect(() => {
    stopLoading();
    const pending = readPendingOrder(new URLSearchParams(window.location.search).get('reference'));
    if (!pending) return;
    setOrder(pending);
    if (markCartCleared(pending.reference)) clearCart();
  }, [clearCart, stopLoading]);

  const goToStep = (next: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 180);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;
    setDownloadingReceipt(true);
    setReceiptError(null);
    try {
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'receipt',
          reference: order.reference,
          customer: order.customer,
          shipping: order.shipping,
          totalCents: order.total,
          orderDate: order.orderDate,
          lines: order.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            unit_price_cents: it.unitPriceCents || Math.round(order.total / order.items.reduce((s, x) => s + x.quantity, 0)),
          })),
        }),
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Zahlungsbestaetigung-${order.reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setReceiptError('PDF nicht verfügbar. Prüfen Sie Ihr E-Mail-Postfach.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  /* ── Page introuvable ── */
  if (!order) {
    return (
      <main className="container min-h-[60vh] py-16">
        <section className="mx-auto max-w-sm rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <CircleHelp className="mx-auto text-stone-400" size={48} />
          <h1 className="mt-4 text-xl font-black text-stone-900">Bestellreferenz nicht gefunden</h1>
          <p className="mt-2 text-sm text-stone-500 leading-6">
            Die Bestelldaten sind nicht mehr verfügbar. Prüfen Sie bitte Ihr E-Mail-Postfach.
          </p>
          <Link
            href="/produits"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#a33d1e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#852f15]"
          >
            Zum Produktsortiment
          </Link>
        </section>
      </main>
    );
  }

  const address = order.shipping || order.customer;
  const orderDateFormatted =
    order.orderDate ||
    new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-16 pt-6 sm:pt-10">
      <div className="mx-auto w-full max-w-md px-4">

        {/* ── Barre de progression ── */}
        <div className="mb-8 flex items-center">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                      done
                        ? 'bg-emerald-500 text-white'
                        : active
                        ? 'bg-[#a33d1e] text-white shadow-md ring-4 ring-[#a33d1e]/20'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {done ? <Check size={15} strokeWidth={3} /> : n}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      active ? 'text-[#a33d1e]' : done ? 'text-emerald-600' : 'text-stone-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mb-5 mx-1.5 h-0.5 flex-1 rounded-full transition-all duration-500 ${
                      step > n ? 'bg-emerald-500' : 'bg-stone-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Contenu avec animation ── */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >

          {/* ════════ ÉTAPE 1 — Récapitulatif ════════ */}
          {step === 1 && (
            <div className="space-y-4">

              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <CheckCircle2 size={24} className="text-emerald-700" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-stone-900">Bestellung bestätigt</h1>
                    <p className="text-xs text-stone-400">
                      Ref. <span className="font-mono font-bold text-stone-600">{order.reference}</span>
                      {' · '}{orderDateFormatted}
                    </p>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                  Bestellbestätigung versandt an{' '}
                  <strong className="text-stone-800">{order.customer.email}</strong>
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Bestellte Artikel
                </h2>
                <div className="divide-y divide-stone-100">
                  {order.items.map((item, idx) => {
                    const unitPrice = item.unitPriceCents || 0;
                    const lineTotal = unitPrice > 0 ? unitPrice * item.quantity : null;
                    return (
                      <div key={idx} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                          <p className="text-xs text-stone-400">
                            {item.quantity}× {unitPrice > 0 ? euro.format(unitPrice / 100) : ''}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-stone-800">
                          {lineTotal ? euro.format(lineTotal / 100) : euro.format(order.total / 100)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                  <span className="text-xs text-stone-500">Versand Deutschland:</span>
                  <span className="text-xs font-bold text-emerald-700">Kostenlos</span>
                </div>
                {order.vat && (
                  <div className="mt-1 text-xs text-stone-400">
                    <IncludedVatSummary summary={order.vat} locale="de" />
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
                  <span className="text-sm font-bold text-stone-700">Gesamt (brutto)</span>
                  <span className="text-xl font-black text-[#a33d1e]">
                    {euro.format(order.total / 100)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-[#a33d1e]" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Lieferadresse
                  </h3>
                </div>
                <div className="text-sm text-stone-700 leading-6">
                  <p className="font-bold text-stone-900">{address.firstName} {address.lastName}</p>
                  {address.street && <p>{address.street}</p>}
                  {address.postalCode && address.city && (
                    <p>{address.postalCode} {address.city}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-0.5">Deutschland · Frei Bordsteinkante</p>
                </div>
              </div>

              <button
                onClick={() => goToStep(2)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a33d1e] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#852f15] active:scale-[0.98]"
              >
                Weiter zur Zahlung <ArrowRight size={17} />
              </button>
            </div>
          )}

          {/* ════════ ÉTAPE 2 — Virement ════════ */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                onClick={() => goToStep(1)}
                className="flex items-center gap-1 text-xs text-stone-400 transition hover:text-stone-700"
              >
                <ChevronLeft size={14} /> Zurück
              </button>

              <div className="rounded-2xl border-2 border-[#a33d1e]/20 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <Clock size={15} className="text-amber-700" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-stone-900">Überweisungsdaten</h2>
                    <p className="text-xs text-stone-400">
                      Betrag: <strong className="text-stone-700">{euro.format(order.total / 100)}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {!BANK_DETAILS && <p role="status" className="text-sm text-amber-800">Die Bankverbindung ist derzeit nicht verfügbar. Bitte kontaktieren Sie uns vor der Überweisung.</p>}
                  {[
                    { label: 'Begünstigte', value: BANK_DETAILS?.recipient || 'Nicht verfügbar', key: 'recipient', mono: false },
                    { label: 'IBAN', value: BANK_DETAILS?.iban || 'Nicht verfügbar', key: 'iban', mono: true },
                    { label: 'BIC', value: BANK_DETAILS?.bic || 'Nicht angegeben', key: 'bic', mono: true },
                    { label: 'Bank', value: BANK_DETAILS?.bank || 'Nicht angegeben', key: 'bank', mono: false },
                  ].map(({ label, value, key, mono }) => (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
                      <div className="min-w-0 mr-2">
                        <span className="block text-[10px] font-medium text-stone-400">{label}</span>
                        <span className={`text-xs font-bold text-stone-900 ${mono ? 'font-mono break-all' : ''}`}>
                          {value}
                        </span>
                      </div>
                      <button
                        disabled={!BANK_DETAILS}
                        onClick={() => copyToClipboard(value, key)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 transition hover:bg-stone-100"
                      >
                        {copiedKey === key ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  ))}

                  {BANK_DETAILS && <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600">{paymentRecipientExplanation}</p>}

                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          ⚠ Verwendungszweck
                        </span>
                        <span className="font-mono text-sm font-black text-[#a33d1e] break-all">
                          {order.reference}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(order.reference, 'ref')}
                        className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#a33d1e] px-3 text-xs font-bold text-white transition hover:bg-[#852f15]"
                      >
                        {copiedKey === 'ref' ? <><Check size={12} /> Kopiert</> : <><Copy size={12} /> Kopieren</>}
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] text-amber-700">
                      Nur die Bestellnummer angeben — keine weiteren Angaben.
                    </p>
                  </div>
                </div>
              </div>

              {order.proofToken && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <FileCheck2 size={16} className="text-emerald-700" />
                    <h3 className="text-sm font-bold text-stone-900">Beleg hochladen</h3>
                  </div>
                  <p className="mb-4 text-xs text-stone-400 leading-5">
                    Nach der Überweisung laden Sie Ihren Nachweis hoch → Lieferung wird freigegeben.
                  </p>
                  <PaymentProofUpload
                    reference={order.reference}
                    token={order.proofToken}
                    onSuccess={() => goToStep(3)}
                  />
                </div>
              )}

              {!order.proofToken && (
                <button
                  onClick={() => goToStep(3)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-black"
                >
                  Weiter <ArrowRight size={17} />
                </button>
              )}
            </div>
          )}

          {/* ════════ ÉTAPE 3 — Confirmation ════════ */}
          {step === 3 && (
            <div className="space-y-4">

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 size={30} className="text-emerald-600" strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-black text-stone-900">Beleg eingegangen!</h2>
                <p className="mt-1.5 text-xs text-stone-500 leading-5">
                  Ihr Zahlungsnachweis wurde übermittelt. Wir bereiten Ihre Lieferung vor und melden uns per E-Mail.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Download size={16} className="text-stone-600" />
                  <h3 className="text-sm font-bold text-stone-900">Zahlungsbestätigung</h3>
                </div>
                <p className="mb-4 text-xs text-stone-400">
                  Laden Sie Ihr offizielles Zahlungsdokument als PDF herunter.
                </p>
                {receiptError && (
                  <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{receiptError}</p>
                )}
                <button
                  onClick={handleDownloadReceipt}
                  disabled={downloadingReceipt}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f291e] py-3 text-sm font-bold text-white transition hover:bg-[#163c2c] disabled:opacity-70"
                >
                  {downloadingReceipt ? (
                    <><Loader2 size={16} className="animate-spin" /> Wird erstellt...</>
                  ) : (
                    <><Download size={16} /> Zahlungsbestätigung (PDF)</>
                  )}
                </button>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Truck size={15} className="text-emerald-700" />
                  <h3 className="text-sm font-bold text-stone-900">Ihre Lieferung</h3>
                </div>
                <ol className="space-y-2.5 text-xs text-stone-600">
                  {[
                    'Zahlungseingang wird geprüft & bestätigt',
                    'Spedition kontaktiert Sie zur Terminvereinbarung',
                    'Lieferung frei Bordsteinkante — 2 bis 4 Werktage',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-500">
                        {i + 1}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-2 text-xs font-bold text-stone-700">Fragen? Wir helfen gerne:</p>
                <div className="space-y-1.5 text-xs text-stone-600">
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-[#a33d1e]" />
                    <a href={`mailto:${storeConfig.email}`} className="hover:underline">{storeConfig.email}</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-[#a33d1e]" />
                    <a href={`tel:${storeConfig.phoneHref}`} className="hover:underline">{storeConfig.phone}</a>
                  </p>
                </div>
              </div>

              <Link
                href="/produits"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-black"
              >
                Zurück zu den Produkten <ArrowRight size={16} />
              </Link>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
