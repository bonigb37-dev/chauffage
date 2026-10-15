'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { paymentInstructions, beforeOrderPaymentInstructions } from '@/lib/store-config';
import { Landmark } from 'lucide-react';

const BANK_DETAILS = {
  recipient: 'Simone Römer',
  iban: 'DE38760260000039479100',
  bic: 'NORSDE71XXX',
  bank: 'Sparkasse',
};

export default function PaymentMethods({ compact = false, recorded = false }: { compact?: boolean; recorded?: boolean }) {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <div className={compact ? '' : 'mt-5 border-t border-stone-200 pt-5'}>
      <p className="text-xs font-bold uppercase tracking-[.12em] text-gray-500">
        Zahlungsart
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Zahlungsart">
        <li className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
          <Landmark size={16} aria-hidden="true" className="shrink-0 text-orange-600" />
          Banküberweisung (Vorkasse)
        </li>
      </ul>
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
        <p>{recorded ? paymentInstructions : beforeOrderPaymentInstructions}</p>
        <p>Sie können Ihren Zahlungsbeleg auf der Bestätigungsseite hochladen. Das Hochladen beschleunigt die Bearbeitung.</p>
      </div>
      <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5 text-left">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-[#a33d1e]" />
          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wide">Bankverbindung</h3>
        </div>
        <p className="mt-2 text-xs leading-5 text-gray-600">
          Die Überweisung erfolgt sicher und direkt auf unser deutsches Bankkonto:
        </p>
        <div className="mt-3.5 divide-y divide-stone-200/70 rounded-lg border border-stone-200 bg-white px-4 py-1 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2">
            <span className="font-semibold text-stone-600 text-xs sm:text-sm">Begünstigte / Kontoinhaberin:</span>
            <span className="font-bold text-stone-900 select-all sm:text-right text-xs sm:text-sm">{BANK_DETAILS.recipient}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2">
            <span className="font-semibold text-stone-600 text-xs sm:text-sm">IBAN:</span>
            <span className="font-mono font-bold text-stone-900 select-all sm:text-right text-xs sm:text-sm">{BANK_DETAILS.iban}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2">
            <span className="font-semibold text-stone-600 text-xs sm:text-sm">BIC:</span>
            <span className="font-mono font-bold text-stone-900 select-all sm:text-right text-xs sm:text-sm">{BANK_DETAILS.bic}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2">
            <span className="font-semibold text-stone-600 text-xs sm:text-sm">Bank:</span>
            <span className="font-bold text-stone-900 select-all sm:text-right text-xs sm:text-sm">{BANK_DETAILS.bank}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2">
            <span className="font-semibold text-stone-600 text-xs sm:text-sm">Verwendungszweck:</span>
            <span className="text-stone-700 italic sm:text-right text-xs sm:text-sm">Ihre persönliche Bestellnummer (wird bei Bestellung generiert)</span>
          </div>
        </div>
      </div>
    </div>
  ), brenLocale);
}
