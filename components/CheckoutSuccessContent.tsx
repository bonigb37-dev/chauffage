'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import PaymentMethods from '@/components/PaymentMethods';
import { deliverySummary } from '@/lib/store-config';
import PaymentProofUpload from '@/components/PaymentProofUpload';
import { supabase } from '@/lib/supabase';

type PendingOrder = {
  reference: string;
  proofToken?: string;
  total: number;
  items: { name: string; quantity: number }[];
  customer: { firstName: string; lastName: string; email: string };
};

export default function CheckoutSuccessContent() {
  const brenLocale = useLocale() as Locale;
  const euro = new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' });

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    // Check auth state
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setIsLoggedIn(!!data.session?.user);
      }).catch(() => setIsLoggedIn(false));
    } else {
      setIsLoggedIn(false);
    }

    // Load order from session
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

  return localizeNode((
    <main className="container grid min-h-[65vh] place-items-center py-16">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-soft sm:p-12">
        <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
        <h1 className="mt-5 text-3xl font-black">Commande enregistrée</h1>

        {order ? (
          <>
            <p className="mt-3 leading-7 text-gray-600">
              Merci {order.customer.firstName}. Votre référence est <b>{order.reference}</b>.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Montant de la commande, livraison incluse : <b>{euro.format(order.total / 100)}</b>
            </p>
            <ul className="mt-4 text-left text-sm text-gray-600">
              {order.items.map((item) => (
                <li key={item.name}>• {item.name} × {item.quantity}</li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-amber-50 p-4 text-left text-sm leading-6 text-amber-950">
              Référence à indiquer dans le libellé : <strong>{order.reference}</strong>. Paiement en attente.
            </div>
            <PaymentMethods compact recorded />
          </>
        ) : (
          <p className="mt-3 leading-7 text-gray-600">
            La référence de commande n&apos;est plus disponible dans cette session.
          </p>
        )}

        <div className="mt-4 rounded-xl bg-stone-100 p-4 text-left text-sm leading-6 text-gray-700">
          {deliverySummary}
        </div>

        {order?.proofToken && (
          <PaymentProofUpload reference={order.reference} token={order.proofToken} />
        )}

        {/* CTA créer un compte pour les guests */}
        {isLoggedIn === false && order && (
          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus size={18} className="text-orange-600 shrink-0" />
              <p className="font-bold text-orange-900 text-sm">Suivez vos commandes facilement</p>
            </div>
            <p className="text-xs text-orange-800 leading-5 mb-3">
              Créez un compte avec l&apos;adresse <b>{order.customer.email}</b> pour retrouver toutes vos commandes et en assurer le suivi.
            </p>
            <Link
              href="/compte"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 transition"
            >
              <UserPlus size={15} />
              Créer mon compte
            </Link>
          </div>
        )}

        <Link
          href="/produits"
          className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700"
        >
          Retour aux produits
        </Link>
      </section>
    </main>
  ), brenLocale);
}
