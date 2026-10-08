'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import PaymentProofUpload from '@/components/PaymentProofUpload';

type PendingOrder = { reference: string; proofToken?: string; total: number; items: { name: string; quantity: number }[]; customer: { firstName: string; lastName: string; email: string } };
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export default function CheckoutSuccessContent() {
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const { clearCart } = useCart();
  useEffect(() => {
    const raw = sessionStorage.getItem('thermopro-pending-order');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as PendingOrder;
      if (pending.reference !== new URLSearchParams(window.location.search).get('reference')) return;
      setOrder(pending);
      if (sessionStorage.getItem(`thermopro-cleared-${pending.reference}`) !== 'true') {
        clearCart();
        sessionStorage.setItem(`thermopro-cleared-${pending.reference}`, 'true');
      }
    } catch { sessionStorage.removeItem('thermopro-pending-order'); }
  }, [clearCart]);
  return <main className="container grid min-h-[65vh] place-items-center py-16"><section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-soft sm:p-12"><CheckCircle2 className="mx-auto text-emerald-600" size={48}/><h1 className="mt-5 text-3xl font-black">Commande enregistrée</h1>{order ? <><p className="mt-3 leading-7 text-gray-600">Merci {order.customer.firstName}. Votre référence est <b>{order.reference}</b>.</p><p className="mt-2 text-sm text-gray-600">Montant de la commande, livraison incluse : <b>{euro.format(order.total / 100)}</b></p><ul className="mt-4 text-left text-sm text-gray-600">{order.items.map((item) => <li key={item.name}>• {item.name} × {item.quantity}</li>)}</ul><div className="mt-6 rounded-xl bg-amber-50 p-4 text-left text-sm leading-6 text-amber-950">Merci pour votre commande ! Avant de valider votre virement bancaire, veuillez indiquer la référence de votre commande <strong>{order.reference}</strong> dans le libellé du virement. Cette information permettra à Bren-nholz d’identifier votre règlement et de confirmer la préparation et la livraison de votre commande après réception des fonds.</div></> : <p className="mt-3 leading-7 text-gray-600">La référence de commande n’est plus disponible dans cette session.</p>}<div className="mt-4 rounded-xl bg-stone-100 p-4 text-left text-sm leading-6 text-gray-700">La livraison est incluse dans le prix des produits. Aucun frais supplémentaire ni paiement au transporteur ne vous sera demandé.</div>{order?.proofToken && <PaymentProofUpload reference={order.reference} token={order.proofToken} />}<Link href="/produits" className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700">Retour aux produits</Link></section></main>;
}
