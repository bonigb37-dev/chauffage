'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import { CheckCircle2, CircleHelp } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import PaymentMethods from '@/components/PaymentMethods';
import IncludedVatSummary from '@/components/IncludedVatSummary';
import { deliverySummary } from '@/lib/store-config';
import PaymentProofUpload from '@/components/PaymentProofUpload';

import { readPendingOrder, markCartCleared, type PendingOrder } from '@/lib/pending-order';
import { useActionLoading } from '@/components/ActionLoadingProvider';

export default function CheckoutSuccessContent() {
  const brenLocale = useLocale() as Locale;
  const euro = new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' });

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const { clearCart } = useCart();
  const { stopLoading } = useActionLoading();
  useEffect(() => {
    stopLoading();
    const pending = readPendingOrder(new URLSearchParams(window.location.search).get('reference'));
    if (!pending) return;
    setOrder(pending);
    if (markCartCleared(pending.reference)) clearCart();
  }, [clearCart, stopLoading]);
  return localizeNode(<main className="container grid min-h-[65vh] place-items-center py-16"><section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-soft sm:p-12">{order ? <CheckCircle2 className="mx-auto text-emerald-700" size={48}/> : <CircleHelp className="mx-auto text-stone-600" size={48}/>}<h1 className="mt-5 text-3xl font-black">{order ? 'Commande enregistrée' : 'Bestellreferenz nicht verfügbar'}</h1>{order ? <><p className="mt-3 leading-7 text-gray-600">Merci {order.customer.firstName}. Votre référence est <b>{order.reference}</b>.</p><p className="mt-2 text-sm text-gray-600">Montant de la commande TTC : <b>{euro.format(order.total / 100)}</b></p>{order.delivery && <p className="mt-2 text-sm text-gray-600">Livraison : {euro.format(order.delivery.feeCents / 100)}</p>}{order.vat && <IncludedVatSummary summary={order.vat} locale={brenLocale}/>}<ul className="mt-4 text-left text-sm text-gray-600">{order.items.map((item) => <li key={item.name}>• {item.name} × {item.quantity}</li>)}</ul><div className="mt-6 rounded-xl bg-amber-50 p-4 text-left text-sm leading-6 text-amber-950">Référence à indiquer dans le libellé : <strong>{order.reference}</strong>. Paiement en attente.</div><PaymentMethods compact recorded /></> : <p className="mt-3 leading-7 text-gray-600">La référence de commande n’est plus disponible dans cette session.</p>}<div className="mt-4 rounded-xl bg-stone-100 p-4 text-left text-sm leading-6 text-gray-700">{deliverySummary}</div>{order?.proofToken && <PaymentProofUpload reference={order.reference} token={order.proofToken} />}<Link href="/produits" className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700">Retour aux produits</Link></section></main>, brenLocale);
}
