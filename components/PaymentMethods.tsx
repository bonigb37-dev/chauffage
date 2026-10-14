'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useCart } from '@/components/CartProvider';
import { paymentInstructions, beforeOrderPaymentInstructions, bankTransferInstructions } from '@/lib/store-config';
import { Landmark } from 'lucide-react';

function parseBankDetails(raw: string): string[] {
  if (!raw) return [];
  let text = raw.replace(/\\n/g, '\n');
  const labelRegex = /(?<!^)(?=\b(IBAN|BIC|SWIFT|Banque|Bank|Bénéficiaire|Begünstigter|Begünstigte|Empfänger|Titulaire|Compte|Konto|Référence|Verwendungszweck)\s*[:：])/gi;
  text = text.replace(labelRegex, '\n');
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const labelTranslations: Record<string, string> = {
  'bénéficiaire': 'Begünstigte',
  'beneficiaire': 'Begünstigte',
  'begünstigte': 'Begünstigte',
  'begünstigter': 'Begünstigte',
  'empfänger': 'Begünstigte',
  'titulaire': 'Begünstigte',
  'banque': 'Bank',
  'bank': 'Bank',
  'iban': 'IBAN',
  'bic': 'BIC',
  'swift': 'SWIFT',
  'compte': 'Konto',
  'konto': 'Konto',
  'référence': 'Verwendungszweck',
  'reference': 'Verwendungszweck',
  'motif': 'Verwendungszweck',
  'verwendungszweck': 'Verwendungszweck',
};

export default function PaymentMethods({ compact = false, recorded = false }: { compact?: boolean; recorded?: boolean }) {
  const brenLocale = useLocale() as Locale;

  const { bankDetails } = useCart();
  const hasBankDetails = Boolean(bankDetails.trim());
  const bankLines = parseBankDetails(bankDetails);

  return localizeNode((
    <div className={compact ? '' : 'mt-5 border-t border-stone-200 pt-5'}>
      <p className="text-xs font-bold uppercase tracking-[.12em] text-gray-500">
        Zahlungsart
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Zahlungsart">
        <li className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
          <Landmark size={16} aria-hidden="true" className="shrink-0 text-orange-600" />
          Banküberweisung
        </li>
      </ul>
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
        <p>{recorded ? paymentInstructions : beforeOrderPaymentInstructions}</p>
        <p>Sie können Ihren Zahlungsbeleg auf der Bestätigungsseite hochladen. Das Hochladen beschleunigt die Bearbeitung.</p>
      </div>
      {recorded && hasBankDetails && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5 text-left">
          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wide">Bankverbindung</h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">{bankTransferInstructions}</p>
          <div className="mt-3.5 divide-y divide-stone-200/70 rounded-lg border border-stone-200 bg-white px-4 py-1 text-sm">
            {bankLines.map((line, idx) => {
              const colonIndex = line.indexOf(':');
              if (colonIndex !== -1) {
                const rawLabel = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                const label = labelTranslations[rawLabel.toLowerCase()] || rawLabel;
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2">
                    <span className="font-semibold text-stone-600 text-xs sm:text-sm">{label} :</span>
                    <span className="font-bold text-stone-900 select-all font-mono sm:text-right text-xs sm:text-sm">{value}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="py-2 font-bold text-stone-900 text-xs sm:text-sm">
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  ), brenLocale);
}
