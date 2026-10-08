'use client';

import { useCart } from '@/components/CartProvider';

export default function PaymentMethods({ compact = false, showBankDetails = true }: { compact?: boolean; showBankDetails?: boolean }) {
  const { bankDetails } = useCart();
  return (
    <div className={compact ? '' : 'mt-5 border-t border-stone-200 pt-5'}>
      <p className="text-xs font-bold uppercase tracking-[.12em] text-gray-500">
        Moyen de paiement
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Moyen de paiement">
        <li className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
          Virement bancaire
        </li>
      </ul>
      <p className="mt-2 text-xs leading-5 text-gray-500">
        Une fois vos articles ajoutés au panier et votre commande validée, vous devrez effectuer le virement du montant final confirmé par l’entreprise en utilisant les coordonnées bancaires {showBankDetails ? 'ci-dessous' : 'indiquées sur cette page'}. Merci de préciser votre référence de commande dans le libellé du virement.
      </p>
      {showBankDetails && bankDetails && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-sm leading-6 text-gray-700">{bankDetails}</p>}
    </div>
  );
}
