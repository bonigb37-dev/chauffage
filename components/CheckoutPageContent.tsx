'use client';
import { vatLabel, vatSummary } from '@/lib/vat';
import { emitAnalytics } from '@/lib/analytics';
import { localizeNode, translate } from '@/i18n/copy';
import { localizedPath, type Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import IncludedVatSummary from '@/components/IncludedVatSummary';
import Link from '@/i18n/navigation';
import { ArrowLeft, Landmark, ShieldCheck } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import DeliveryInformation from '@/components/DeliveryInformation';
import PaymentMethods from '@/components/PaymentMethods';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useActionLoading } from '@/components/ActionLoadingProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/i18n/navigation';
import { savePendingOrder } from '@/lib/pending-order';

const inputClass = 'mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function CheckoutPageContent() {
  const brenLocale = useLocale() as Locale;
  const router = useRouter();
  const euro = new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' });

  const { items, ready, products } = useCart();
  const { stopLoading } = useActionLoading();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [differentShipping, setDifferentShipping] = useState(false);
  const lines = items.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const total = lines.reduce((sum, line) => sum + (line.product.priceAmount ?? 0) * line.quantity, 0);
  const taxSummary = vatSummary(lines.map(({product,quantity})=>({product,grossCents:(product.priceAmount??0)*quantity})));
  const hasUnpricedProduct = lines.some((line) => line.product.priceAmount === undefined);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length || starting) return;
    if (hasUnpricedProduct) { stopLoading(); setError('Ein Artikel kann nicht mehr bestellt werden. Bitte aktualisieren Sie Ihren Warenkorb.'); return; }
    const formData = new FormData(event.currentTarget);
    const details = Object.fromEntries(formData.entries()) as Record<string, string>;
    if (!formData.has('terms')) { stopLoading(); setError('Bitte akzeptieren Sie die AGB, bevor Sie fortfahren.'); return; }
    if (differentShipping && ['shippingFirstName', 'shippingLastName', 'shippingStreet', 'shippingPostalCode', 'shippingCity'].some((key) => !details[key]?.trim())) {
      stopLoading();
      setError('Bitte füllen Sie alle Pflichtfelder der Lieferadresse aus.');
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
        setError('Ihre Sitzung konnte nicht überprüft werden. Bitte melden Sie sich erneut an.');
        setStarting(false);
        return;
      }
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items: lines.map(({ product, quantity }) => ({ productId: product.id, quantity, unitPriceCents: product.priceAmount })), customer, shipping, acceptedTerms: true }),
      });
      const result = await response.json() as { reference?: string; totalCents?: number; proofToken?: string; vat?: ReturnType<typeof vatSummary>; emailSent?: boolean; error?: string };
      if (!response.ok || !result.reference || typeof result.totalCents !== 'number') {
        stopLoading();
        setError(result.error ?? 'Die Bestellung konnte nicht aufgenommen werden. Bitte versuchen Sie es später erneut.');
        setStarting(false);
        return;
      }
      const reference = result.reference;
      emitAnalytics('order_sent');
      const confirmedTotal = result.totalCents;
      savePendingOrder({
        reference,
        proofToken: result.proofToken,
        total: confirmedTotal,
        orderDate: new Date().toLocaleDateString('de-DE'),
        emailSent: result.emailSent,
        delivery: { feeCents: 0 },
        vat: result.vat,
        items: lines.map(({ product, quantity }) => ({ name: translate(product.name, 'de'), quantity, unitPriceCents: product.priceAmount })),
        customer: {
          firstName: details.firstName,
          lastName: details.lastName,
          email: details.email,
          street: details.street,
          postalCode: details.postalCode,
          city: details.city,
        },
        shipping: shipping ? {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          street: shipping.street,
          postalCode: shipping.postalCode,
          city: shipping.city,
        } : null,
      });
      router.push(localizedPath(`/commande/succes?reference=${encodeURIComponent(reference)}`, brenLocale));
    } catch {
      stopLoading();
      setError('Die Bestellung konnte nicht aufgenommen werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
      setStarting(false);
    }
  }

  if (!ready) return localizeNode(<main className="container min-h-[60vh] py-16"><div className="h-64 animate-pulse rounded-3xl bg-gray-100"/></main>, brenLocale);
  if (lines.length === 0) return localizeNode(<main className="container min-h-[60vh] py-20 text-center"><h1 className="text-3xl font-black">Ihr Warenkorb ist leer</h1><p className="mt-3 text-gray-500">Fügen Sie Produkte hinzu, bevor Sie zur Kasse gehen.</p><Link href="/produits" className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Produkte ansehen</Link></main>, brenLocale);

  return localizeNode((
    <main className="min-h-[60vh] bg-[#fffbea]">
      <section className="border-b border-stone-200 bg-white py-8 sm:py-10"><div className="container"><Link href="/panier" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600"><ArrowLeft size={16}/> Zurück zum Warenkorb</Link><p className="mt-6 text-sm font-bold uppercase tracking-[.18em] text-orange-600">Zahlung per Banküberweisung</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Zur Kasse</h1></div></section>
      <form onSubmit={placeOrder} className="container grid gap-8 py-9 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-12">
        <div className="space-y-8">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
            <h2 className="border-b border-stone-200 pb-4 font-serif text-2xl font-bold">Rechnungsdetails</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Vorname *<input required name="firstName" autoComplete="given-name" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Nachname *<input required name="lastName" autoComplete="family-name" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Land / Region *<select name="country" defaultValue="DE" className={inputClass}><option value="DE">Deutschland</option></select></label>
              <AddressAutocomplete name="street" postalCodeName="postalCode" cityName="city" inputClass={inputClass} />
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Adresszusatz (optional)<input name="addressLine2" autoComplete="address-line2" className={inputClass} placeholder="Wohnung, Etage usw."/></label>
              <label className="text-sm font-semibold text-gray-700">Postleitzahl *<input required name="postalCode" autoComplete="postal-code" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Ort *<input required name="city" autoComplete="address-level2" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Telefon (optional)<input name="phone" type="tel" autoComplete="tel" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">E-Mail-Adresse *<input required name="email" type="email" autoComplete="email" className={inputClass}/></label>
            </div>
            <label className="mt-7 flex cursor-pointer items-center gap-3 border-t border-stone-200 pt-6 font-serif text-xl font-bold"><input type="checkbox" name="differentShipping" checked={differentShipping} onChange={(event) => setDifferentShipping(event.target.checked)} className="h-4 w-4 accent-orange-600"/> An eine andere Adresse liefern?</label>
            {differentShipping && <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Vorname *<input required name="shippingFirstName" autoComplete="shipping given-name" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Nachname *<input required name="shippingLastName" autoComplete="shipping family-name" className={inputClass}/></label>
              <AddressAutocomplete name="shippingStreet" postalCodeName="shippingPostalCode" cityName="shippingCity" inputClass={inputClass} />
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Adresszusatz<input name="shippingAddressLine2" autoComplete="shipping address-line2" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Postleitzahl *<input required name="shippingPostalCode" autoComplete="shipping postal-code" className={inputClass}/></label>
              <label className="text-sm font-semibold text-gray-700">Ort *<input required name="shippingCity" autoComplete="shipping address-level2" className={inputClass}/></label>
            </div>}
            <p className="mt-5 text-sm text-gray-500">Lieferung ausschließlich innerhalb Deutschlands.</p>
            <DeliveryInformation />
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
            <div className="flex items-center gap-3"><Landmark className="shrink-0 text-orange-600" size={20}/><h2 className="text-xl font-black">Zahlung per Banküberweisung</h2></div>
            <PaymentMethods compact />
          </section>
        </div>
        <aside className="h-fit rounded-2xl border-2 border-stone-200 bg-white p-5 sm:p-7 lg:sticky lg:top-6"><div className="flex items-center gap-2"><ShieldCheck className="text-orange-600" size={19}/><h2 className="font-serif text-2xl font-bold">Ihre Bestellung</h2></div><div className="mt-6 flex justify-between border-b border-stone-200 pb-3 font-semibold text-gray-600"><span>Produkt</span><span>Zwischensumme</span></div><div className="divide-y divide-stone-200">{lines.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 py-4"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100"><Image src={product.image} alt="" fill sizes="64px" className="object-cover"/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{product.name}</p><p className="mt-1 text-xs text-gray-500">× {quantity}</p><p data-original-content className="text-xs text-gray-500">{vatLabel(product,brenLocale)}</p></div><b className="shrink-0 text-sm">{product.priceAmount === undefined ? 'Nicht verfügbar' : euro.format(product.priceAmount * quantity / 100)}</b></div>)}</div><div className="space-y-4 border-y border-stone-200 py-4 text-sm"><div className="flex justify-between text-gray-600"><span>Warenwert</span><span>{hasUnpricedProduct ? 'Nicht verfügbar' : euro.format(total / 100)}</span></div><div className="flex justify-between gap-5 text-gray-600"><span>Lieferung</span><span className="max-w-[190px] text-right">{euro.format(0)}</span></div><div className="flex justify-between gap-4 pt-1 text-base font-black"><span>Gesamtsumme (inkl. MwSt.)</span><span className="text-right text-sm text-orange-700">{hasUnpricedProduct ? 'Nicht verfügbar' : euro.format(total / 100)}</span></div></div>
          <IncludedVatSummary summary={taxSummary} locale={brenLocale}/>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-gray-600"><input required name="terms" type="checkbox" className="mt-1 h-4 w-4 accent-orange-600"/><span>Ich bestätige die Richtigkeit meiner Angaben und akzeptiere die <a href="/agb" className="font-semibold text-orange-600 underline">AGB</a> und habe die <a href="/retractation" className="font-semibold text-orange-600 underline">Widerrufsbelehrung</a> sowie die <a href="/datenschutz" className="font-semibold text-orange-600 underline">Datenschutzerklärung</a> zur Kenntnis genommen. *</span></label>
          <button type="submit" disabled={starting || hasUnpricedProduct} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300">{starting ? 'Wird verarbeitet…' : 'Zahlungspflichtig bestellen'}</button>
        </aside>
      </form>
    </main>
  ), brenLocale);
}
