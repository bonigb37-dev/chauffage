'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Landmark, ShieldCheck } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import PaymentMethods from '@/components/PaymentMethods';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useActionLoading } from '@/components/ActionLoadingProvider';
import { supabase } from '@/lib/supabase';

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const inputClass = 'mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function CheckoutPageContent() {
  const { items, ready, products, bankDetails } = useCart();
  const { stopLoading } = useActionLoading();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [differentShipping, setDifferentShipping] = useState(false);
  const lines = items.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const total = lines.reduce((sum, line) => sum + (line.product.priceAmount ?? 0) * line.quantity, 0);
  const hasUnpricedProduct = lines.some((line) => line.product.priceAmount === undefined);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length || starting) return;
    if (hasUnpricedProduct) { stopLoading(); setError('Le prix d’un produit doit être confirmé avant la commande. Contactez-nous pour obtenir un devis.'); return; }
    const formData = new FormData(event.currentTarget);
    const details = Object.fromEntries(formData.entries()) as Record<string, string>;
    if (!formData.has('terms')) { stopLoading(); setError('Veuillez accepter les conditions de vente avant de continuer.'); return; }
    if (differentShipping && ['shippingFirstName', 'shippingLastName', 'shippingStreet', 'shippingPostalCode', 'shippingCity'].some((key) => !details[key]?.trim())) {
      stopLoading();
      setError('Complétez les champs obligatoires de l’adresse de livraison.');
      return;
    }
    setStarting(true);
    setError('');
    const customer = {
      firstName: details.firstName, lastName: details.lastName, street: details.street, addressLine2: details.addressLine2,
      postalCode: details.postalCode, city: details.city, phone: details.phone, email: details.email,
    };
    const shipping = differentShipping ? {
      firstName: details.shippingFirstName, lastName: details.shippingLastName, street: details.shippingStreet,
      addressLine2: details.shippingAddressLine2, postalCode: details.shippingPostalCode, city: details.shippingCity,
    } : null;
    try {
      const sessionResult = supabase ? await supabase.auth.getSession() : null;
      const token = sessionResult?.data.session?.access_token;
      if (sessionResult?.error) {
        stopLoading();
        setError('Votre session ne peut pas être vérifiée. Reconnectez-vous puis réessayez.');
        setStarting(false);
        return;
      }
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items: lines.map(({ product, quantity }) => ({ productId: product.id, quantity })), customer, shipping, acceptedTerms: true }),
      });
      const result = await response.json() as { reference?: string; totalCents?: number; proofToken?: string; error?: string };
      if (!response.ok || !result.reference || typeof result.totalCents !== 'number') {
        stopLoading();
        setError(result.error ?? 'La demande n’a pas pu être enregistrée. Réessayez plus tard.');
        setStarting(false);
        return;
      }
      const reference = result.reference;
      const confirmedTotal = result.totalCents;
      sessionStorage.setItem('thermopro-pending-order', JSON.stringify({
        reference, proofToken: result.proofToken, total: confirmedTotal, items: lines.map(({ product, quantity }) => ({ name: product.name, quantity })),
        customer: { firstName: details.firstName, lastName: details.lastName, email: details.email },
      }));
      window.location.assign(`/commande/succes?reference=${encodeURIComponent(reference)}`);
    } catch {
      stopLoading();
      setError('La demande n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.');
      setStarting(false);
    }
  }

  if (!ready) return <main className="container min-h-[60vh] py-16"><div className="h-64 animate-pulse rounded-3xl bg-gray-100"/></main>;
  if (lines.length === 0) return <main className="container min-h-[60vh] py-20 text-center"><h1 className="text-3xl font-black">Votre panier est vide</h1><p className="mt-3 text-gray-500">Ajoutez des produits avant de passer commande.</p><Link href="/produits" className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Voir les produits</Link></main>;

  return (
    <main className="min-h-[60vh] bg-[#fffbea]">
      <section className="border-b border-stone-200 bg-white py-8 sm:py-10"><div className="container"><Link href="/panier" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600"><ArrowLeft size={16}/> Retour au panier</Link><p className="mt-6 text-sm font-bold uppercase tracking-[.18em] text-orange-600">Paiement par virement</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Commande</h1></div></section>
      <form onSubmit={placeOrder} className="container grid gap-8 py-9 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-12">
        <div className="space-y-8">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
            <h2 className="border-b border-stone-200 pb-4 font-serif text-2xl font-bold">Données de facturation</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Prénom *<input required name="firstName" autoComplete="given-name" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Nom de famille *<input required name="lastName" autoComplete="family-name" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Pays / Région *<select name="country" defaultValue="DE" className={inputClass}><option value="DE">Allemagne</option></select></label>
              <AddressAutocomplete name="street" postalCodeName="postalCode" cityName="city" inputClass={inputClass} />
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Complément d’adresse (facultatif)<input name="addressLine2" autoComplete="address-line2" className={inputClass} placeholder="Appartement, étage, etc."/></label>
              <label className="text-sm font-semibold text-gray-700">Code postal *<input required name="postalCode" autoComplete="postal-code" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Ville *<input required name="city" autoComplete="address-level2" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Adresse e-mail *<input required name="email" type="email" autoComplete="email" className={inputClass}/></label>
            </div>
            <label className="mt-7 flex cursor-pointer items-center gap-3 border-t border-stone-200 pt-6 font-serif text-xl font-bold"><input type="checkbox" name="differentShipping" checked={differentShipping} onChange={(event) => setDifferentShipping(event.target.checked)} className="h-4 w-4 accent-orange-600"/> Livrer à une autre adresse ?</label>
            {differentShipping && <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Prénom *<input required name="shippingFirstName" autoComplete="shipping given-name" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Nom de famille *<input required name="shippingLastName" autoComplete="shipping family-name" className={inputClass}/></label>
              <AddressAutocomplete name="shippingStreet" postalCodeName="shippingPostalCode" cityName="shippingCity" inputClass={inputClass} />
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Complément d’adresse<input name="shippingAddressLine2" autoComplete="shipping address-line2" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Code postal *<input required name="shippingPostalCode" autoComplete="shipping postal-code" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Ville *<input required name="shippingCity" autoComplete="shipping address-level2" className={inputClass}/></label>
            </div>}
            <p className="mt-5 text-sm text-gray-500">Livraison uniquement en Allemagne.</p>
            <p className="mt-6 text-sm text-gray-600">Les modalités de livraison seront confirmées après réception de votre commande.</p>
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
            <div className="flex items-center gap-3"><Landmark className="shrink-0 text-orange-600" size={20}/><h2 className="text-xl font-black">Paiement par virement</h2></div>
            <PaymentMethods compact />
          </section>
        </div>
        <aside className="h-fit rounded-2xl border-2 border-stone-200 bg-white p-5 sm:p-7 lg:sticky lg:top-6"><div className="flex items-center gap-2"><ShieldCheck className="text-orange-600" size={19}/><h2 className="font-serif text-2xl font-bold">Votre commande</h2></div><div className="mt-6 flex justify-between border-b border-stone-200 pb-3 font-semibold text-gray-600"><span>Produit</span><span>Sous-total</span></div><div className="divide-y divide-stone-200">{lines.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 py-4"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100"><Image src={product.image} alt="" fill sizes="64px" className="object-cover"/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{product.name}</p><p className="mt-1 text-xs text-gray-500">× {quantity}</p></div><b className="shrink-0 text-sm">{product.priceAmount === undefined ? 'À confirmer' : euro.format(product.priceAmount * quantity / 100)}</b></div>)}</div><div className="space-y-4 border-y border-stone-200 py-4 text-sm"><div className="flex justify-between text-gray-600"><span>Montant des produits</span><span>{hasUnpricedProduct ? 'Prix à confirmer' : euro.format(total / 100)}</span></div><div className="flex justify-between gap-5 text-gray-600"><span>Livraison</span><span className="max-w-[190px] text-right">Incluse dans le prix des produits</span></div><div className="flex justify-between gap-4 pt-1 text-base font-black"><span>Total, livraison incluse</span><span className="text-right text-sm text-orange-700">{hasUnpricedProduct ? 'Prix à confirmer' : euro.format(total / 100)}</span></div></div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-gray-600"><input required name="terms" type="checkbox" className="mt-1 h-4 w-4 accent-orange-600"/><span>Je confirme l’exactitude de mes informations et j’accepte les <a href="/agb" className="font-semibold text-orange-600 underline">conditions de vente</a> ainsi que la <a href="/datenschutz" className="font-semibold text-orange-600 underline">politique de confidentialité</a>. *</span></label>
          <button type="submit" disabled={starting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300">{starting ? 'Validation…' : 'Envoyer ma demande de commande'}</button>
        </aside>
      </form>
    </main>
  );
}
