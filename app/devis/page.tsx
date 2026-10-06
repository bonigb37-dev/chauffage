'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, CheckCircle2, FileText, PhoneCall, ShieldCheck, Truck } from 'lucide-react';
import FaqSection from '@/components/FaqSection';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const inputClass = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function DemandeDevis() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!supabase) {
      setError('Impossible de joindre le serveur. Veuillez réessayer plus tard.');
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSending(true);

    try {
      const clientType = String(form.get('clientType') ?? 'Particulier');
      const companyName = String(form.get('companyName') ?? '').trim();
      const name = String(form.get('name') ?? '').trim();
      const email = String(form.get('email') ?? '').trim();
      const phone = String(form.get('phone') ?? '').trim();
      const address = String(form.get('address') ?? '').trim();
      const postalCode = String(form.get('postalCode') ?? '').trim();
      const city = String(form.get('city') ?? '').trim();
      const productType = String(form.get('productType') ?? '');
      const formatChoice = String(form.get('formatChoice') ?? '');
      const volumeQuantity = String(form.get('volumeQuantity') ?? '');
      const deliveryAccess = String(form.get('deliveryAccess') ?? '');
      const details = String(form.get('details') ?? '').trim();

      const messageContent = `[DEMANDE DE DEVIS ${clientType.toUpperCase()}]
${companyName ? `Entreprise/Raison sociale: ${companyName}\n` : ''}Type de produit: ${productType}
Format/Dimension: ${formatChoice}
Quantité estimée: ${volumeQuantity}
Adresse de livraison: ${address}, ${postalCode} ${city}
Accès livraison: ${deliveryAccess}
Précisions: ${details}`;

      const { error: insertError } = await supabase.from('contact_requests').insert({
        name: companyName ? `${name} (${companyName})` : name,
        email,
        phone: phone || null,
        postal_code: postalCode || null,
        subject: `Devis - ${productType} (${volumeQuantity})`,
        message: messageContent,
      });

      if (insertError) {
        setError('Une erreur est survenue lors de l’enregistrement de votre demande de devis.');
        return;
      }

      setNotice('Votre demande de devis a été transmise à notre service commercial. Vous recevrez une réponse chiffrée sous 24 heures ouvrées.');
      formElement.reset();
    } catch {
      setError('Une erreur est survenue lors de l’envoi. Veuillez vérifier votre connexion.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="bg-[#faf8f5] min-h-screen">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#2d221c] to-[#1d1612] py-14 text-white sm:py-20">
        <div className="container">
          <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 backdrop-blur-sm border border-orange-500/30">
            <Calculator size={14} /> Service Commercial & Tarification
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Demande de devis gratuit & sur-mesure
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-stone-300">
            Obtenez un chiffrage exact sous 24h ouvrées pour vos besoins en bois de chauffage, granulés, briquettes et livraisons par volume.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container grid gap-10 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12 sm:py-16">
        {/* Quote Form */}
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="border-b border-stone-100 pb-6">
            <h2 className="text-2xl font-black text-gray-950 flex items-center gap-3">
              <FileText className="text-orange-600" size={26} /> Formulaire de chiffrage
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Complétez les informations ci-dessous afin que nous puissions calculer vos tarifs dégressifs et frais de transport exacts.
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-6">
            {/* Type de client */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Vous êtes</span>
              <div className="grid grid-cols-2 gap-3 sm:w-80">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-bold text-gray-800 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 has-[:checked]:text-orange-700">
                  <input type="radio" name="clientType" value="Particulier" defaultChecked className="sr-only" />
                  Particulier
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-bold text-gray-800 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 has-[:checked]:text-orange-700">
                  <input type="radio" name="clientType" value="Professionnel" className="sr-only" />
                  Professionnel
                </label>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-gray-700">Nom & Prénom *<input required name="name" autoComplete="name" className={inputClass} placeholder="Jean Dupont" /></label>
              <label className="text-xs font-bold text-gray-700">Entreprise / Raison sociale (optionnel)<input name="companyName" className={inputClass} placeholder="Nom de votre société" /></label>
              <label className="text-xs font-bold text-gray-700">E-mail de contact *<input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="contact@domaine.fr" /></label>
              <label className="text-xs font-bold text-gray-700">Téléphone *<input required name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="06 00 00 00 00" /></label>
            </div>

            <hr className="border-stone-100" />

            {/* Choix des combustibles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-gray-700">Type de combustible *
                <select required name="productType" defaultValue="" className={inputClass}>
                  <option value="" disabled>Sélectionnez un produit</option>
                  <option value="Bois de chauffage (Bûches)">Bois de chauffage (Bûches de bois)</option>
                  <option value="Granulés de bois (Pellets)">Granulés de bois (Pellets DIN+ / EN+ A1)</option>
                  <option value="Briquettes densifiées (RUF / Pini-Kay)">Briquettes densifiées (RUF / Pini-Kay)</option>
                  <option value="Bois d’allumage & accessoires">Bois d’allumage & allume-feux</option>
                  <option value="Commande mixte / Plusieurs produits">Commande mixte / Plusieurs produits</option>
                </select>
              </label>

              <label className="text-xs font-bold text-gray-700">Format ou dimension souhaité
                <select name="formatChoice" defaultValue="" className={inputClass}>
                  <option value="" disabled>Choix du format</option>
                  <option value="Bûches 25 cm">Bûches 25 cm</option>
                  <option value="Bûches 33 cm">Bûches 33 cm</option>
                  <option value="Bûches 50 cm">Bûches 50 cm</option>
                  <option value="Sacs de 15 kg">Sacs de 15 kg</option>
                  <option value="Palette complète rangée">Palette complète rangée</option>
                  <option value="Big Bag">Big Bag</option>
                  <option value="Vrac">Vrac</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-gray-700">Quantité ou volume estimé *
              <select required name="volumeQuantity" defaultValue="" className={inputClass}>
                <option value="" disabled>Sélectionnez un volume</option>
                <option value="1 palette / 1 à 2 stères">1 palette / 1 à 2 stères</option>
                <option value="2 à 4 palettes / 3 à 6 stères">2 à 4 palettes / 3 à 6 stères</option>
                <option value="5 à 10 palettes / 8 à 15 stères">5 à 10 palettes (Remise volume)</option>
                <option value="Camion complet / Plus de 10 palettes">Camion complet / Plus de 10 palettes (Gros volume)</option>
                <option value="Moins de 1 palette (Sacs / Filets)">Moins de 1 palette (Sacs / Filets)</option>
              </select>
            </label>

            <hr className="border-stone-100" />

            {/* Adresse et livraison */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="sm:col-span-2 text-xs font-bold text-gray-700">Adresse de livraison *<input required name="address" autoComplete="street-address" className={inputClass} placeholder="Rue et numéro" /></label>
              <label className="text-xs font-bold text-gray-700">Code postal *<input required name="postalCode" autoComplete="postal-code" className={inputClass} placeholder="Code postal" /></label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-gray-700">Ville *<input required name="city" autoComplete="address-level2" className={inputClass} placeholder="Ville" /></label>
              <label className="text-xs font-bold text-gray-700">Accessibilité du lieu
                <select name="deliveryAccess" defaultValue="Accès facile (Camion avec hayon)" className={inputClass}>
                  <option value="Accès facile (Camion avec hayon)">Accès facile (Camion avec hayon)</option>
                  <option value="Rue étroite / Passage restreint">Rue étroite / Passage restreint</option>
                  <option value="Terrain en pente / Gravier">Terrain en pente / Gravier</option>
                  <option value="Transpalette nécessaire">Transpalette manuel requis</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-gray-700">Remarques ou besoins spécifiques
              <textarea name="details" rows={4} className={inputClass} placeholder="Indiquez toute précision utile concernant vos contraintes de livraison, vos horaires ou vos exigences..." />
            </label>

            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{error}</p>}

            <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-4 text-base font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-orange-600/20">
              {sending ? 'Calcul du devis en cours…' : 'Recevoir mon devis gratuit'} {!sending && <ArrowRight size={19} />}
            </button>
          </form>
        </section>

        {/* Info Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-sm">
            <h3 className="text-lg font-black text-gray-950 flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-600" size={22} /> Nos engagements devis
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><b>Réponse rapide sous 24h</b> : Notre équipe analyse votre localisation pour vous offrir le meilleur tarif.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><b>Tarifs dégressifs</b> : Prix préférentiels appliqués dès 2 palettes ou commandes groupées.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><b>Transparence totale</b> : Prix des combustibles et frais de livraison détaillés sans coût caché.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-gray-950 p-6 text-white sm:p-7 shadow-lg">
            <Truck className="text-orange-400" size={28} />
            <h3 className="mt-4 text-xl font-black">Livraison professionnelle</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-300">
              Chaque livraison est effectuée par des transporteurs équipés de camions avec hayon et transpalette pour déposer vos palettes au plus près de votre zone de stockage.
            </p>
            <Link href="/services" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-white">
              Découvrir la logistique <ArrowRight size={15} />
            </Link>
          </div>

          <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-6 text-orange-950">
            <PhoneCall className="text-orange-600" size={26} />
            <h3 className="mt-3 font-black text-base">Besoin d’aide immédiate ?</h3>
            <p className="mt-2 text-sm text-orange-900 leading-relaxed">
              Consultez notre catalogue ou notre foire aux questions pour en savoir plus sur nos produits et bois certifiés.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/produits" className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700">
                Parcourir le catalogue
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <FaqSection compact />
    </main>
  );
}
