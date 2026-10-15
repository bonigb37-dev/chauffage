'use client';

import { useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import {
  CheckCircle2,
  CircleHelp,
  Download,
  Copy,
  Check,
  Truck,
  ShieldCheck,
  Clock,
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  FileCheck2,
  Loader2,
  Printer
} from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import IncludedVatSummary from '@/components/IncludedVatSummary';
import { storeConfig } from '@/lib/store-config';
import PaymentProofUpload from '@/components/PaymentProofUpload';
import { readPendingOrder, markCartCleared, type PendingOrder } from '@/lib/pending-order';
import { useActionLoading } from '@/components/ActionLoadingProvider';

const BANK_DETAILS = {
  recipient: 'Simone Römer',
  iban: 'DE38760260000039479100',
  bic: 'NORSDE71XXX',
  bank: 'Sparkasse',
};

export default function CheckoutSuccessContent() {
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'sent' | 'resending' | 'success' | 'error' | null>(null);
  const { clearCart } = useCart();
  const { stopLoading } = useActionLoading();

  useEffect(() => {
    stopLoading();
    const pending = readPendingOrder(new URLSearchParams(window.location.search).get('reference'));
    if (!pending) return;
    setOrder(pending);
    if (markCartCleared(pending.reference)) clearCart();

    if (pending.emailSent) {
      setEmailStatus('sent');
    } else {
      // Ensure email receipt with PDF invoice is dispatched even if serverless checkout timed out
      fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: pending.reference,
          customer: pending.customer,
          shipping: pending.shipping,
          totalCents: pending.total,
          orderDate: pending.orderDate,
          sendEmail: true,
          lines: pending.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            unit_price_cents: it.unitPriceCents || Math.round(pending.total / pending.items.reduce((s, x) => s + x.quantity, 0)),
          })),
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res?.emailSent || res?.success) {
            setEmailStatus('sent');
          }
        })
        .catch(() => {});
    }
  }, [clearCart, stopLoading]);

  const handleResendEmail = async () => {
    if (!order || sendingEmail) return;
    setSendingEmail(true);
    setEmailStatus('resending');
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: order.reference,
          customer: order.customer,
          shipping: order.shipping,
          totalCents: order.total,
          orderDate: order.orderDate,
          sendEmail: true,
          lines: order.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            unit_price_cents: it.unitPriceCents || Math.round(order.total / order.items.reduce((s, x) => s + x.quantity, 0)),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailStatus('success');
      } else {
        setEmailStatus('error');
      }
    } catch {
      setEmailStatus('error');
    } finally {
      setSendingEmail(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleDownloadPdf = async () => {
    if (!order) return;
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      // First try POST with order data to guarantee immediate rendering without DB roundtrip
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      if (!response.ok) {
        // Fallback to GET
        const fallbackRes = await fetch(`/api/invoice?reference=${encodeURIComponent(order.reference)}`);
        if (!fallbackRes.ok) throw new Error('PDF konnte nicht erstellt werden.');
        const blob = await fallbackRes.blob();
        triggerBlobDownload(blob, `Rechnung-${order.reference}.pdf`);
        return;
      }

      const blob = await response.blob();
      triggerBlobDownload(blob, `Rechnung-${order.reference}.pdf`);
    } catch {
      setDownloadError('PDF-Download momentan nicht verfügbar. Sie erhalten Ihre Rechnung auch per E-Mail.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!order) {
    return (
      <main className="container min-h-[60vh] py-16">
        <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-soft sm:p-12">
          <CircleHelp className="mx-auto text-stone-500" size={52} />
          <h1 className="mt-5 text-2xl font-black text-stone-900 sm:text-3xl">
            Bestellreferenz nicht gefunden
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Die Bestelldaten für diese Sitzung sind nicht mehr verfügbar oder der Link ist unvollständig. Wenn Sie bereits bestellt haben, prüfen Sie bitte Ihr E-Mail-Postfach.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/produits"
              className="inline-flex items-center justify-center rounded-full bg-[#a33d1e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#852f15]"
            >
              Zum Produktsortiment
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Kundenservice kontaktieren
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const customerName = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  const address = order.shipping || order.customer;
  const orderDateFormatted = order.orderDate || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <main className="min-h-screen bg-[#faf8f5] py-10 sm:py-16">
      <div className="container max-w-5xl">
        {/* Top Success Banner */}
        <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={34} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Bestellung erfolgreich aufgenommen
                </div>
                <h1 className="mt-2 text-2xl font-black text-stone-900 sm:text-3xl">
                  Bestelleingang & Rechnung
                </h1>
                <p className="mt-1 text-sm text-stone-600">
                  Vielen Dank für Ihren Auftrag, <strong className="text-stone-900">{customerName}</strong>! Ihre Bestellung wurde verbindlich entgegengenommen.
                </p>
              </div>
            </div>

            {/* Action buttons (Download PDF / Print) */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f291e] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#163c2c] disabled:opacity-75"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Rechnung wird erstellt...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Rechnung herunterladen (PDF)
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 print:hidden"
              >
                <Printer size={18} />
                Drucken
              </button>
            </div>
          </div>

          {downloadError && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              {downloadError}
            </div>
          )}

          {/* Email Confirmation & Resend Banner */}
          <div className="mt-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    Bestelleingangsbestätigung & Rechnung per E-Mail
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-600 sm:text-sm">
                    Eine Eingangsbestätigung samt offizieller Rechnung im PDF-Format wurde an <strong className="text-stone-900">{order.customer.email}</strong> versandt.
                  </p>
                  {emailStatus === 'success' && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Check size={14} /> E-Mail mit Rechnung erfolgreich erneut versandt!
                    </p>
                  )}
                  {emailStatus === 'error' && (
                    <p className="mt-2 text-xs font-semibold text-amber-900">
                      Der erneute Versand konnte nicht abgeschlossen werden. Prüfen Sie bitte Ihren Spam-Ordner oder laden Sie Ihre Rechnung oben als PDF herunter.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleResendEmail}
                disabled={sendingEmail}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-800 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-emerald-700" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Mail size={14} className="text-emerald-700" />
                    E-Mail erneut senden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Left Column Invoice Details, Right Column Bank Wire Details */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* Left Column: Order Invoice & Articles */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
                Bestellübersicht & Referenzdaten
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div className="rounded-xl bg-stone-50 p-3">
                  <span className="block text-xs text-stone-500">Bestellnummer</span>
                  <span className="font-mono font-bold text-stone-900">{order.reference}</span>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <span className="block text-xs text-stone-500">Bestelldatum</span>
                  <span className="font-semibold text-stone-900">{orderDateFormatted}</span>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <span className="block text-xs text-stone-500">Lieferzeit</span>
                  <span className="font-semibold text-stone-900">2-4 Werktage</span>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <span className="block text-xs text-stone-500">Zahlungsart</span>
                  <span className="font-semibold text-stone-900">Überweisung</span>
                </div>
              </div>
            </section>

            {/* Invoice Items Table */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <h2 className="text-base font-bold text-stone-900">
                  Bestellte Artikel ({order.items.reduce((acc, it) => acc + it.quantity, 0)} Einheiten)
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                  <ShieldCheck size={14} /> Qualitätsgeprüft
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-bold uppercase text-stone-500">
                      <th className="pb-3 pr-2">Artikel</th>
                      <th className="pb-3 px-2 text-center">Menge</th>
                      <th className="pb-3 px-2 text-right">Einzelpreis</th>
                      <th className="pb-3 pl-2 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.items.map((item, idx) => {
                      const unitPrice = item.unitPriceCents || 0;
                      const lineTotal = unitPrice > 0 ? unitPrice * item.quantity : null;
                      return (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="py-3 pr-2">
                            <span className="font-semibold text-stone-900">{item.name}</span>
                          </td>
                          <td className="py-3 px-2 text-center font-medium text-stone-700">
                            {item.quantity}×
                          </td>
                          <td className="py-3 px-2 text-right text-stone-600">
                            {unitPrice > 0 ? euro.format(unitPrice / 100) : '—'}
                          </td>
                          <td className="py-3 pl-2 text-right font-bold text-stone-900">
                            {lineTotal ? euro.format(lineTotal / 100) : euro.format(order.total / 100)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Price Calculation Summary */}
              <div className="mt-6 border-t border-stone-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Versand & Speditionslieferung (Deutschland):</span>
                  <span className="font-bold text-emerald-800">0,00 € (Kostenlos)</span>
                </div>
                {order.vat && (
                  <div className="text-xs text-stone-500">
                    <IncludedVatSummary summary={order.vat} locale="de" />
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-base">
                  <span className="font-bold text-stone-900">Zu zahlender Gesamtbetrag (brutto):</span>
                  <span className="text-2xl font-black text-[#a33d1e]">
                    {euro.format(order.total / 100)}
                  </span>
                </div>
              </div>
            </section>

            {/* Delivery & Billing Address Card */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-stone-900">
                <MapPin size={18} className="text-[#a33d1e]" />
                <h3 className="font-bold">Lieferadresse & Empfänger</h3>
              </div>
              <div className="mt-3 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
                <p className="font-bold text-stone-900">{address.firstName} {address.lastName}</p>
                {address.street && <p>{address.street}</p>}
                {address.postalCode && address.city && (
                  <p>{address.postalCode} {address.city}</p>
                )}
                <p className="font-medium text-stone-600">Deutschland</p>
                <p className="mt-2 text-xs text-stone-500">
                  Lieferung erfolgt frei Bordsteinkante mit Hebebühne und Hubwagen. Die Spedition kontaktiert Sie vorab telefonisch zur Terminabsprache.
                </p>
              </div>
            </section>

            {/* Proof Upload (Accelerates Order Processing) */}
            {order.proofToken && (
              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={20} className="text-emerald-800" />
                  <h3 className="font-bold text-stone-900">
                    Überweisungsbeleg hochladen (Optional)
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  Laden Sie nach Durchführung Ihrer Überweisung einen Zahlungsnachweis (PDF, Foto oder Screenshot) hoch, um die Vorbereitung Ihrer Lieferung direkt freizugeben.
                </p>
                <div className="mt-4">
                  <PaymentProofUpload reference={order.reference} token={order.proofToken} />
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Bank Details & Next Steps */}
          <div className="space-y-6">
            {/* Bank Transfer Wire Box */}
            <div className="rounded-3xl border-2 border-[#a33d1e]/30 bg-white p-6 shadow-md sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Clock size={14} /> Zahlung ausstehend
              </div>
              <h2 className="mt-3 text-xl font-black text-stone-900">
                Zahlungsanweisung
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Bitte überweisen Sie den fälligen Rechnungsbetrag von{' '}
                <strong className="text-stone-900">{euro.format(order.total / 100)}</strong> auf folgendes Bankkonto:
              </p>

              <div className="mt-5 space-y-3">
                {/* Empfänger */}
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-xs sm:text-sm">
                  <div>
                    <span className="block text-[11px] font-medium text-stone-500">Begünstigte / Kontoinhaberin</span>
                    <span className="font-bold text-stone-900">{BANK_DETAILS.recipient}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(BANK_DETAILS.recipient, 'recipient')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100"
                    title="Kopieren"
                  >
                    {copiedKey === 'recipient' ? <Check size={14} className="text-emerald-800" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* IBAN */}
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-xs sm:text-sm">
                  <div>
                    <span className="block text-[11px] font-medium text-stone-500">IBAN</span>
                    <span className="font-mono font-bold tracking-wider text-stone-900">{BANK_DETAILS.iban}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(BANK_DETAILS.iban, 'iban')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100"
                    title="IBAN kopieren"
                  >
                    {copiedKey === 'iban' ? <Check size={14} className="text-emerald-800" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* BIC & Bank */}
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-xs sm:text-sm">
                  <div>
                    <span className="block text-[11px] font-medium text-stone-500">BIC / Bank</span>
                    <span className="font-mono font-bold text-stone-900">{BANK_DETAILS.bic} · {BANK_DETAILS.bank}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(BANK_DETAILS.bic, 'bic')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100"
                    title="BIC kopieren"
                  >
                    {copiedKey === 'bic' ? <Check size={14} className="text-emerald-800" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Verwendungszweck (CRITICAL) */}
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-950">
                        Verwendungszweck (zwingend erforderlich)
                      </span>
                      <span className="font-mono text-base font-black text-[#a33d1e]">
                        {order.reference}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.reference, 'ref')}
                      className="flex h-9 items-center gap-1.5 rounded-lg bg-[#a33d1e] px-3 font-semibold text-white transition hover:bg-[#852f15]"
                    >
                      {copiedKey === 'ref' ? (
                        <>
                          <Check size={14} /> Kopiert
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Kopieren
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-amber-900">
                    Bitte geben Sie im Feld „Verwendungszweck“ ausschließlich Ihre Bestellnummer an, um eine sofortige automatisierte Zuordnung zu gewährleisten.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Timeline Card */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-bold text-stone-900">
                <Truck size={18} className="text-emerald-800" />
                Ablauf der Lieferung
              </h3>
              <ol className="mt-4 space-y-3 text-xs leading-5 text-stone-600">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700">1</span>
                  <span><strong>Überweisung ausführen:</strong> Tätigen Sie die Überweisung mit dem angegebenen Verwendungszweck.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700">2</span>
                  <span><strong>Bereitstellung der Ware:</strong> Nach Zahlungseingang wird Ihre Bestellung sofort im Zentrallager kommissioniert.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700">3</span>
                  <span><strong>Speditions-Avisierung:</strong> Die Spedition ruft Sie an, um den genauen Anliefertag mit Ihnen zu vereinbaren.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700">4</span>
                  <span><strong>Zustellung frei Bordsteinkante:</strong> Die Anlieferung erfolgt innerhalb von 2-4 Werktagen ohne Zusatzkosten.</span>
                </li>
              </ol>
            </div>

            {/* Contact & Support Help Card */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-xs text-stone-600">
              <h4 className="font-bold text-stone-900">Haben Sie Fragen zu Ihrer Bestellung?</h4>
              <p className="mt-1">Unser deutscher Kundenservice unterstützt Sie gerne:</p>
              <div className="mt-3 space-y-1.5 text-stone-700">
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[#a33d1e]" />
                  <a href={`mailto:${storeConfig.email}`} className="font-medium hover:underline">{storeConfig.email}</a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-[#a33d1e]" />
                  <a href={`tel:${storeConfig.phoneHref}`} className="font-medium hover:underline">{storeConfig.phone}</a>
                </p>
                <p className="flex items-center gap-2">
                  <Building2 size={14} className="text-stone-500" />
                  <span>{storeConfig.warehouseAddress}</span>
                </p>
              </div>
            </div>

            {/* Navigation back to shop */}
            <div className="pt-2">
              <Link
                href="/produits"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-bold text-white transition hover:bg-black"
              >
                Zurück zu den Produkten <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
