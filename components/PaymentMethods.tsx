'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useCart } from '@/components/CartProvider';
import { paymentInstructions, beforeOrderPaymentInstructions, storeConfig } from '@/lib/store-config';
import { Landmark } from 'lucide-react';

export default function PaymentMethods({ compact = false, recorded = false }: { compact?: boolean; recorded?: boolean }) {
  const brenLocale = useLocale() as Locale;

  const { bankDetails } = useCart();
  const hasBankDetails = Boolean(bankDetails.trim());
  return localizeNode((
    <div className={compact ? '' : 'mt-5 border-t border-stone-200 pt-5'}>
      <p className="text-xs font-bold uppercase tracking-[.12em] text-gray-500">
        Moyen de paiement
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Moyen de paiement">
        <li className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
          <Landmark size={16} aria-hidden="true" className="shrink-0 text-orange-600" />
          Virement bancaire
        </li>
      </ul>
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
        <p>{recorded ? paymentInstructions : beforeOrderPaymentInstructions}</p>
        <p>Vous pouvez transmettre un justificatif depuis la page de confirmation. Son envoi ne confirme pas le paiement.</p>
      </div>
      {recorded && hasBankDetails && <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4"><h3 className="text-sm font-bold text-gray-950">Coordonnées bancaires</h3><p className="mt-2 text-sm leading-6 text-gray-600">{storeConfig.bankHolderRelationship} Effectuez le virement au nom exact du titulaire indiqué ci-dessous.</p><p className="mt-2 whitespace-pre-wrap break-words text-base font-bold leading-7 text-gray-950">{bankDetails}</p></div>}
    </div>
  ), brenLocale);
}
