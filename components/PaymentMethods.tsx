'use client';

import { useCart } from '@/components/CartProvider';
import { Landmark } from 'lucide-react';

export default function PaymentMethods({ compact = false }: { compact?: boolean }) {
  const { bankDetails } = useCart();
  const hasBankDetails = Boolean(bankDetails.trim());
  return (
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
        <p>Effectuez le paiement directement depuis votre compte bancaire. Veuillez indiquer votre <strong>référence de commande dans le libellé du virement</strong>. Votre commande ne sera pas expédiée tant que les fonds n’auront pas été reçus.</p>
        <p>Envoyez ensuite une photo ou une capture d’écran de votre preuve de paiement depuis la page de confirmation. Votre commande sera préparée après réception des fonds.</p>
      </div>
      {hasBankDetails && <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4"><h3 className="text-sm font-bold text-gray-950">Coordonnées bancaires</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{bankDetails}</p></div>}
    </div>
  );
}
