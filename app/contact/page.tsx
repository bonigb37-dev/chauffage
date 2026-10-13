'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { FormEvent, useState } from 'react';
import Link from '@/i18n/navigation';
import { ArrowRight, Boxes, CircleHelp, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import FaqSection from '@/components/FaqSection';
import { supabase } from '@/lib/supabase';
import { storeConfig } from '@/lib/store-config';
import { emitAnalytics } from '@/lib/analytics';
import WhatsAppLink from '@/components/WhatsAppLink';

const inputClass = 'mt-2 w-full rounded-xl border border-[#E7E0D3] bg-white px-4 py-3 text-base text-[#1c1917] outline-none transition placeholder:text-gray-400 focus:border-[#A54829] focus:ring-2 focus:ring-[#A54829]/15';

export default function Contact() {
  const brenLocale = useLocale() as Locale;

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!supabase) {
      setError('Erreur de connexion. Veuillez réessayer ultérieurement.');
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const deliveryAddress = String(form.get('deliveryAddress') ?? '').trim();
    const message = String(form.get('message') ?? '').trim();
    setSending(true);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: String(form.get('name') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        phone: String(form.get('phone') ?? '').trim() || null,
        subject: String(form.get('subject') ?? ''),
        message: deliveryAddress ? `${message}\n\nAdresse de livraison :\n${deliveryAddress}` : message,
      }) });
      if (!response.ok) {
        setError('Votre message n’a pas pu être envoyé. Veuillez vérifier les informations saisies.');
        return;
      }
      setNotice('Merci pour votre message ! Notre service client reviendra vers vous dans les meilleurs délais.');
      emitAnalytics('contact_sent');
      formElement.reset();
    } catch {
      setError('Votre message n’a pas pu être envoyé. Veuillez vérifier votre connexion.');
    } finally {
      setSending(false);
    }
  }

  return localizeNode((
    <main className="bg-[#F4F0E5] min-h-screen text-[#1c1917]">
      {/* Header in Terracotta (#A54829) */}
      <section className="bg-[#A54829] py-14 sm:py-20 text-white shadow-md">
        <div className="container">
          <div>
            <p className="font-bold uppercase tracking-[.2em] text-[#F4F0E5]">Contact & Support Client</p>
            <p data-original-content className="mt-2 text-sm font-semibold text-[#F4F0E5]/80">{storeConfig.name}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">Besoin d’aide ou d’informations ?</h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[#F4F0E5]">Notre équipe est à votre disposition pour toute question sur nos combustibles, un suivi de commande ou une assistance livraison.</p>
          </div>
        </div>
      </section>

      {/* Main Form & Sidebar */}
      <section className="container grid gap-10 py-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:py-16">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-[#E7E0D3] bg-white p-6 sm:p-7 shadow-sm">
            <a href={`tel:${storeConfig.phoneHref}`} className="block font-bold text-[#123524] underline underline-offset-4">{storeConfig.phone}</a>
            <WhatsAppLink className="mt-4 border border-[#E7E0D3]" />
          </div>
          <div className="rounded-2xl border border-[#E7E0D3] bg-white p-6 sm:p-7 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F4F0E5] text-[#A54829]"><Mail size={21} aria-hidden="true"/></span>
            <h2 className="mt-5 text-xl font-black text-[#123524]">Adresse e-mail</h2>
            <a href={`mailto:${storeConfig.email}`} className="mt-3 inline-block max-w-full break-all font-semibold text-[#A54829] underline underline-offset-4 hover:text-[#8c3b20]">{storeConfig.email}</a>
          </div>

          <div className="rounded-2xl border border-[#E7E0D3] bg-white p-6 sm:p-7 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F4F0E5] text-[#A54829]"><MessageCircle size={21}/></span>
            <h2 className="mt-5 text-xl font-black text-[#123524]">Comment pouvons-nous vous aider ?</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#57534e]">Pour un suivi de commande, merci d’indiquer votre numéro de référence. Pour toute question sur les produits, utilisez ce formulaire.</p>
          </div>

          <div className="rounded-2xl bg-[#123524] p-6 text-white sm:p-7 shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#F4F0E5]"><Boxes size={21}/></span>
            <h2 className="mt-5 text-xl font-black text-white">Prêt à commander ?</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#F4F0E5]/90">Choisissez vos produits dans notre catalogue. Les prix sont TTC. Aucun supplément de livraison n’est facturé en Allemagne.</p>
            <Link href="/produits" className="mt-5 inline-flex items-center gap-2 font-bold text-white hover:text-[#F4F0E5] underline">Voir les produits <ArrowRight size={17}/></Link>
          </div>

          <Link href="/faq" className="flex items-center gap-4 rounded-2xl border border-[#E7E0D3] bg-white p-5 transition hover:border-[#A54829] hover:bg-[#F4F0E5]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F4F0E5] text-[#A54829]"><CircleHelp size={21}/></span>
            <span className="flex-1"><b className="block text-[#123524]">Questions fréquentes</b><span className="mt-0.5 block text-xs text-[#57534e]">Trouvez des réponses immédiates dans notre FAQ</span></span><ArrowRight size={18} className="text-[#A54829]"/>
          </Link>
        </aside>

        <section className="rounded-3xl border border-[#E7E0D3] bg-white p-6 shadow-sm sm:p-9">
          <div className="flex items-start gap-4 border-b border-[#E7E0D3] pb-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F4F0E5] text-[#123524]"><ShieldCheck size={21}/></span>
            <div><h2 className="text-2xl font-black text-[#123524]">Formulaire de contact</h2><p className="mt-1 text-sm text-[#57534e]">Les champs marqués d’un astérisque (*) sont obligatoires.</p></div>
          </div>

          <form onSubmit={submit} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#1c1917]">Nom complet *<input required name="name" autoComplete="name" className={inputClass} placeholder="Votre nom et prénom"/></label>
              <label className="text-sm font-semibold text-[#1c1917]">Adresse e-mail *<input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="vous@exemple.com"/></label>
              <label className="text-sm font-semibold text-[#1c1917]">Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" maxLength={50} className={inputClass} placeholder="Ex. : +49 151 23456789"/></label>
              <label className="text-sm font-semibold text-[#1c1917]">Adresse complète de livraison (facultatif)<textarea name="deliveryAddress" autoComplete="street-address" maxLength={300} rows={3} className={inputClass} placeholder="Rue et numéro, code postal, ville, Allemagne"/></label>
            </div>
            <label className="mt-5 block text-sm font-semibold text-[#1c1917]">Sujet de votre message *
              <select required name="subject" defaultValue="" className={inputClass}>
                <option value="" disabled>Choisissez un motif</option>
                <option value="product">Information sur un produit ou stock</option>
                <option value="order">Suivi d’une commande en cours</option>
                <option value="delivery">Question sur les modalités de livraison</option>
                <option value="claim">Service après-vente / Réclamation</option>
                <option value="other">Autre question générale</option>
              </select>
            </label>
            <label className="mt-5 block text-sm font-semibold text-[#1c1917]">Votre message *<textarea required name="message" maxLength={4500} rows={6} className={inputClass} placeholder="Expliquez-nous votre demande en détail…"/></label>

            {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</p>}
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{error}</p>}

            {/* Vert forêt button (#123524) */}
            <button type="submit" disabled={sending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#123524] px-5 py-4 font-bold text-white transition hover:bg-[#1b4d35] disabled:cursor-not-allowed disabled:opacity-60 shadow-md">
              {sending ? 'Envoi du message…' : 'Envoyer mon message'} {!sending && <ArrowRight size={18}/>}
            </button>
          </form>
        </section>
      </section>

      <FaqSection compact/>
    </main>
  ), brenLocale);
}
