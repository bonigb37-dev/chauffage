'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { FormEvent, useState } from 'react';
import Link from '@/i18n/navigation';
import { ArrowRight, Calculator, CheckCircle2, FileText, MapPin, PhoneCall, ShieldCheck, Truck } from 'lucide-react';
import FaqSection from '@/components/FaqSection';
import { useActionLoading } from '@/components/ActionLoadingProvider';
import { supabase } from '@/lib/supabase';

const inputClass = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function DemandeDevis() {
  const brenLocale = useLocale() as Locale;

  const { stopLoading } = useActionLoading();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!supabase) {
      stopLoading();
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
      const regionState = String(form.get('regionState') ?? 'Allemagne');
      const productType = String(form.get('productType') ?? '');
      const formatChoice = String(form.get('formatChoice') ?? '');
      const volumeQuantity = String(form.get('volumeQuantity') ?? '');
      const deliveryAccess = String(form.get('deliveryAccess') ?? '');
      const details = String(form.get('details') ?? '').trim();

      const messageContent = `[DEMANDE DE DEVIS ALLEMAGNE - ${clientType.toUpperCase()}]
${companyName ? `Firme / Raison sociale: ${companyName}\n` : ''}Produit: ${productType}
Format: ${formatChoice}
Quantité: ${volumeQuantity}
Adresse en Allemagne: ${address}, ${postalCode} ${city} (${regionState})
Accès camion/Spedition: ${deliveryAccess}
Précisions: ${details}`;

      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: companyName ? `${name} (${companyName})` : name,
        email,
        phone: phone || null,
        postal_code: postalCode || null,
        subject: 'quote',
        message: messageContent,
      }) });

      if (!response.ok) {
        stopLoading();
        setError('Une erreur est survenue lors de l’enregistrement de votre demande de devis.');
        return;
      }

      setNotice('Vielen Dank! Votre demande de devis pour l’Allemagne a été transmise. Notre service commercial vous répondra sous 24 heures ouvrées.');
      formElement.reset();
    } catch {
      stopLoading();
      setError('Une erreur est survenue lors de l’envoi. Veuillez vérifier votre connexion.');
    } finally {
      setSending(false);
    }
  }

  return localizeNode((
    <main className="bg-[#faf8f5] min-h-screen">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#2d221c] to-[#1d1612] py-14 text-white sm:py-20">
        <div className="container">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 backdrop-blur-sm border border-orange-500/30">
              <Calculator size={14} /> Service Commercial & Devis
            </p>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-stone-200 backdrop-blur-sm">
              <MapPin size={13} className="text-orange-400" /> Vente & Livraison sur toute l’Allemagne (Deutschland)
            </p>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Demande de devis gratuit pour l’Allemagne
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-stone-300">
            Obtenez un chiffrage personnalisé sous 24h ouvrées pour vos livraisons de bois de chauffage, granulés et briquettes partout en Allemagne.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container grid gap-10 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12 sm:py-16">
        {/* Quote Form */}
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="border-b border-stone-100 pb-6">
            <h2 className="text-2xl font-black text-gray-950 flex items-center gap-3">
              <FileText className="text-orange-600" size={26} /> Chiffrage sur-mesure (Deutschland)
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Remplissez le formulaire ci-dessous pour obtenir un devis adapté à vos quantités et à votre adresse en Allemagne. La livraison par transporteur spécialisé est incluse dans le prix des produits, sans supplément à régler au chauffeur.
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-6">
            {/* Type de client */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Statut du client</span>
              <div className="grid grid-cols-2 gap-3 sm:w-80">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-bold text-gray-800 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 has-[:checked]:text-orange-700">
                  <input type="radio" name="clientType" value="Particulier" defaultChecked className="sr-only" />
                  Particulier
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-bold text-gray-800 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 has-[:checked]:text-orange-700">
                  <input type="radio" name="clientType" value="Professionnel" className="sr-only" />
                  Professionnel / Firme
                </label>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-gray-700">Nom & Prénom *<input required name="name" autoComplete="name" className={inputClass} placeholder="Ex. Thomas Müller" /></label>
              <label className="text-xs font-bold text-gray-700">Entreprise / Firmenname (si pro)<input name="companyName" className={inputClass} placeholder="Nom de la société" /></label>
              <label className="text-xs font-bold text-gray-700">Adresse e-mail *<input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="exemple@domaine.de" /></label>
              <label className="text-xs font-bold text-gray-700">Téléphone (+49 / FR) *<input required name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="+49 170 0000000" /></label>
            </div>

            <hr className="border-stone-100" />

            {/* Choix des combustibles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-gray-700">Type de combustible *
                <select required name="productType" defaultValue="" className={inputClass}>
                  <option value="" disabled>Sélectionnez un produit</option>
                  <option value="Bois de chauffage (Brennholz)">Bois de chauffage (Brennholz)</option>
                  <option value="Granulés de bois (Holzpellets ENplus/DIN+)">Granulés de bois (Holzpellets ENplus / DIN+)</option>
                  <option value="Briquettes densifiées (Holzbriketts RUF/Pini-Kay)">Briquettes densifiées (Holzbriketts RUF / Pini-Kay)</option>
                  <option value="Bois d’allumage (Anzündholz)">Bois d’allumage & allume-feux (Anzündholz)</option>
                  <option value="Commande mixte">Commande mixte / Plusieurs références</option>
                </select>
              </label>

              <label className="text-xs font-bold text-gray-700">Format ou longueur
                <select name="formatChoice" defaultValue="" className={inputClass}>
                  <option value="" disabled>Choix du format</option>
                  <option value="Bûches 25 cm (Scheite 25 cm)">Bûches 25 cm</option>
                  <option value="Bûches 33 cm (Scheite 33 cm)">Bûches 33 cm</option>
                  <option value="Bûches 50 cm (Scheite 50 cm)">Bûches 50 cm</option>
                  <option value="Sacs de 15 kg (Sackware 15 kg)">Sacs de 15 kg</option>
                  <option value="Palette complète (Palette)">Palette complète rangée</option>
                  <option value="Big Bag">Big Bag</option>
                  <option value="Vrac (Schüttgut)">Vrac</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-gray-700">Quantité ou volume estimé *
              <select required name="volumeQuantity" defaultValue="" className={inputClass}>
                <option value="" disabled>Sélectionnez la quantité</option>
                <option value="1 palette / 1 à 2 stères">1 palette / 1 à 2 stères (SRM / RM)</option>
                <option value="2 à 4 palettes / 3 à 6 stères">2 à 4 palettes / 3 à 6 stères</option>
                <option value="5 à 10 palettes (Tarif dégressif)">5 à 10 palettes (Tarif dégressif)</option>
                <option value="Camion complet / Plus de 10 palettes">Camion complet / Gros volume</option>
                <option value="Sacs / Filets individuels">Moins de 1 palette (Sacs / Filets)</option>
              </select>
            </label>

            <hr className="border-stone-100" />

            {/* Adresse et livraison en Allemagne */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="sm:col-span-2 text-xs font-bold text-gray-700">Adresse de livraison en Allemagne *<input required name="address" autoComplete="street-address" className={inputClass} placeholder="Straße und Hausnummer" /></label>
              <label className="text-xs font-bold text-gray-700">Code postal (PLZ) *<input required name="postalCode" autoComplete="postal-code" className={inputClass} placeholder="PLZ (Ex. 80331)" /></label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-gray-700">Ville / Ort *<input required name="city" autoComplete="address-level2" className={inputClass} placeholder="Ex. München, Stuttgart, Berlin..." /></label>
              <label className="text-xs font-bold text-gray-700">Land (Région allemande)
                <select name="regionState" defaultValue="Baden-Württemberg / Bayern" className={inputClass}>
                  <option value="Baden-Württemberg">Baden-Württemberg</option>
                  <option value="Bayern">Bayern</option>
                  <option value="Nordrhein-Westfalen">Nordrhein-Westfalen</option>
                  <option value="Hessen">Hessen</option>
                  <option value="Rheinland-Pfalz">Rheinland-Pfalz</option>
                  <option value="Niedersachsen">Niedersachsen</option>
                  <option value="Saarland">Saarland</option>
                  <option value="Sachsen / Thüringen">Sachsen / Thüringen</option>
                  <option value="Autre Bundesland">Autre région en Allemagne</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-gray-700">Modalités d&apos;accès pour le camion (Spedition)
              <select name="deliveryAccess" defaultValue="Camion avec hayon et transpalette (Lkw mit Hebebühne)" className={inputClass}>
                <option value="Camion avec hayon et transpalette (Lkw mit Hebebühne)">Camion avec hayon et transpalette (Standard)</option>
                <option value="Rue étroite / Accès restreint">Rue étroite / Accès restreint</option>
                <option value="Terrain en pente / Gravier">Terrain en pente / Gravier</option>
                <option value="Livraison dans garage / Abri">Accès garage / Abri disponible</option>
              </select>
            </label>

            <label className="block text-xs font-bold text-gray-700">Remarques ou précisions
              <textarea name="details" rows={4} className={inputClass} placeholder="Précisez tout détail utile sur vos contraintes d'horaires ou de stockage en Allemagne..." />
            </label>

            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{error}</p>}

            <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-4 text-base font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-orange-600/20">
              {sending ? 'Envoi de votre demande…' : 'Demander mon devis gratuit (Deutschland)'} {!sending && <ArrowRight size={19} />}
            </button>
          </form>
        </section>

        {/* Info Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-sm">
            <h3 className="text-lg font-black text-gray-950 flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-600" size={22} /> Chiffrage officiel Allemagne
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><b>Réponse rapide sous 24h</b> : Notre service commercial prépare votre devis, livraison incluse, et vérifie les modalités de livraison à votre code postal (PLZ).</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><b>Tarifs dégressifs par volume</b> : Prix dégressifs appliqués dès la 2<sup>ème</sup> palette ou pour commandes groupées.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><b>Normes & Certifications</b> : Bûches sèches écorcées et granulés certifiés DINplus & ENplus A1.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-gray-950 p-6 text-white sm:p-7 shadow-lg">
            <Truck className="text-orange-400" size={28} />
            <h3 className="mt-4 text-xl font-black">Spedition & Livraison à domicile</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-300">
              Toutes nos livraisons en Allemagne sont assurées par transporteurs spécialisés équipés de camions avec hayon elevateur et transpalette (Lkw mit Hebebühne) pour déposer vos palettes en toute sécurité.
            </p>
            <Link href="/services" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-white">
              Détails de la livraison en Allemagne <ArrowRight size={15} />
            </Link>
          </div>

          <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-6 text-orange-950">
            <PhoneCall className="text-orange-600" size={26} />
            <h3 className="mt-3 font-black text-base">Des questions sur nos produits ?</h3>
            <p className="mt-2 text-sm text-orange-900 leading-relaxed">
              Consultez notre catalogue complet de combustibles bois pour l&apos;Allemagne ou contactez directement notre support client.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/produits" className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700">
                Consulter le catalogue
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <FaqSection compact />
    </main>
  ), brenLocale);
}
