'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

type Verification = { paid: boolean; pending?: boolean; amount: number | null; currency: string | null; error?: string };
const currencyNames: Record<string, string> = { eur: 'EUR', xof: 'XOF', usd: 'USD' };

export default function CheckoutSuccessContent() {
  const [result, setResult] = useState<Verification | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    const paymentId = new URLSearchParams(window.location.search).get('payment_id');
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    if (!paymentId) {
      setResult({ paid: false, amount: null, currency: null, error: 'Aucune référence de paiement n’a été fournie.' });
      return () => { active = false; };
    }
    let attempts = 0;
    const verify = async () => {
      try {
        const response = await fetch(`/api/checkout-session?id=${encodeURIComponent(paymentId)}`, { cache: 'no-store' });
        const data = await response.json() as Verification;
        if (!response.ok) throw new Error(data.error || 'La vérification du paiement a échoué.');
        if (!active) return;
        setResult(data);
        if (data.paid) clearCart();
        if (data.pending && attempts < 11) {
          attempts += 1;
          timer = setTimeout(verify, 5000);
        }
      } catch (error: unknown) {
        if (active) setResult({ paid: false, amount: null, currency: null, error: error instanceof Error ? error.message : 'La vérification du paiement a échoué.' });
      }
    };
    void verify();
    return () => { active = false; clearTimeout(timer); };
  }, [clearCart]);

  return <main className="container grid min-h-[65vh] place-items-center py-16"><section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-soft sm:p-12">{result === null ? <><LoaderCircle className="mx-auto animate-spin text-orange-600" size={42}/><h1 className="mt-5 text-2xl font-black">Vérification du paiement</h1><p className="mt-2 text-gray-500">Nous vérifions le statut de la transaction auprès de Mollie.</p></> : result.paid ? <><CheckCircle2 className="mx-auto text-emerald-600" size={48}/><h1 className="mt-5 text-3xl font-black">Paiement confirmé</h1><p className="mt-3 leading-7 text-gray-600">Votre paiement de {result.amount !== null && result.currency ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyNames[result.currency] ?? result.currency.toUpperCase() }).format(result.amount / 100) : 'votre commande'} a été confirmé par Mollie.</p><p className="mt-2 text-sm text-gray-500">Les informations de livraison et de suivi restent à confirmer avec l’entreprise.</p><Link href="/produits" className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700">Retour aux produits</Link></> : result.pending ? <><LoaderCircle className="mx-auto text-orange-600" size={48}/><h1 className="mt-5 text-3xl font-black">Paiement en cours de vérification</h1><p className="mt-3 leading-7 text-gray-600">Mollie a reçu votre demande, mais le paiement n’est pas encore confirmé. Le statut sera vérifié à nouveau automatiquement.</p><p className="mt-2 text-sm text-gray-500">Ne repassez pas commande pendant cette vérification.</p><Link href="/produits" className="mt-7 inline-flex rounded-full bg-gray-950 px-6 py-3 font-bold text-white hover:bg-orange-600">Retour aux produits</Link></> : <><CircleAlert className="mx-auto text-amber-600" size={48}/><h1 className="mt-5 text-3xl font-black">Paiement non confirmé</h1><p className="mt-3 leading-7 text-gray-600">{result.error ?? 'Mollie n’a pas confirmé cette transaction. Votre panier est conservé.'}</p><Link href="/panier" className="mt-7 inline-flex rounded-full bg-gray-950 px-6 py-3 font-bold text-white hover:bg-orange-600">Revenir au panier</Link></>}</section></main>;
}
