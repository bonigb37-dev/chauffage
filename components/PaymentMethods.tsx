'use client';

import { useCart } from '@/components/CartProvider';

export default function PaymentMethods({ compact = false }: { compact?: boolean }) {
  const { bankDetails } = useCart();
  const hasBankDetails = Boolean(bankDetails.trim());
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
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
        <p>Après avoir ajouté vos articles au panier, renseignez vos informations et validez votre commande. Vous recevrez alors une référence de commande.</p>
        <p>La livraison en Allemagne est incluse dans le prix des produits. Aucun frais supplémentaire ne sera demandé par le transporteur. L’entreprise vous confirmera le montant total à régler. Une fois ce montant confirmé, veuillez effectuer votre virement {hasBankDetails ? 'en utilisant les coordonnées bancaires ci-dessous' : 'aux coordonnées bancaires que l’entreprise vous communiquera'}. Le montant de votre commande comprend la livraison.</p>
        <p>Indiquez votre référence de commande dans le libellé du virement, puis transmettez votre justificatif depuis la page de confirmation. Votre commande sera préparée après vérification de la réception des fonds.</p>
      </div>
      {hasBankDetails && <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4"><h3 className="text-sm font-bold text-gray-950">Coordonnées bancaires</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{bankDetails}</p></div>}
    </div>
  );
}
