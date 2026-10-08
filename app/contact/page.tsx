'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, CircleHelp, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import FaqSection from '@/components/FaqSection';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const inputClass = 'mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function Contact() {
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
    setSending(true);
    try {
      const { error: insertError } = await supabase.from('contact_requests').insert({
        name: String(form.get('name') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        phone: String(form.get('phone') ?? '').trim() || null,
        postal_code: String(form.get('postalCode') ?? '').trim() || null,
        subject: String(form.get('subject') ?? ''),
        message: String(form.get('message') ?? '').trim(),
      });
      if (insertError) {
        setError('Votre message n’a pas pu être envoyé. Veuillez vérifier les informations saisies.');
        return;
      }
      setNotice('Merci pour votre message ! Notre service client reviendra vers vous dans les meilleurs délais.');
      formElement.reset();
    } catch {
      setError('Votre message n’a pas pu être envoyé. Veuillez vérifier votre connexion.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      {/* Header */}
      <section className="bg-[#fffaf5] py-14 sm:py-20 border-b border-orange-100/60">
        <div className="container grid items-end gap-8 lg:grid-cols-[1fr_.65fr]">
          <div>
            <p className="font-bold uppercase tracking-[.2em] text-orange-600">Contact & Support Client</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-gray-950 sm:text-5xl">Besoin d’aide ou d’informations ?</h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600">Notre équipe est à votre disposition pour toute question sur nos combustibles, un suivi de commande ou une assistance livraison.</p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700"><MapPin size={21}/></span>
              <div>
                <h2 className="font-bold text-gray-950">Zone de livraison & conseils</h2>
                <address className="mt-2 not-italic text-sm font-medium leading-relaxed text-gray-700">Brauerstraße 3<br />66663 Merzig, Allemagne</address>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">Nous livrons vos palettes et sacs à domicile. Pour un chiffrage personnalisé, utilisez notre page dédiée aux devis.</p>
                <Link href="/devis" className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700">Demander un devis sur-mesure <ArrowRight size={14}/></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form & Sidebar */}
      <section className="container grid gap-10 py-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:py-16">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-700"><MessageCircle size={21}/></span>
            <h2 className="mt-5 text-xl font-black">Comment pouvons-nous vous aider ?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">Pour un suivi de commande, merci d’indiquer votre numéro de référence. Pour une demande de tarification de gros volume, privilégiez le formulaire de devis.</p>
          </div>

          <div className="rounded-2xl bg-gray-950 p-6 text-white sm:p-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-orange-300"><Boxes size={21}/></span>
            <h2 className="mt-5 text-xl font-black">Besoin d’un devis tarifaire ?</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">Calculez précisément les coûts de vos palettes et frais de livraison grâce à notre formulaire de chiffrage dédié.</p>
            <Link href="/devis" className="mt-5 inline-flex items-center gap-2 font-bold text-orange-400 hover:text-white">Accéder à la demande de devis <ArrowRight size={17}/></Link>
          </div>

          <Link href="/faq" className="flex items-center gap-4 rounded-2xl border border-stone-200 p-5 transition hover:border-orange-300 hover:bg-orange-50/50">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gray-100 text-gray-700"><CircleHelp size={21}/></span>
            <span className="flex-1"><b className="block text-gray-950">Questions fréquentes</b><span className="mt-0.5 block text-xs text-gray-500">Trouvez des réponses immédiates dans notre FAQ</span></span><ArrowRight size={18} className="text-orange-600"/>
          </Link>
        </aside>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft sm:p-9">
          <div className="flex items-start gap-4 border-b border-stone-100 pb-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={21}/></span>
            <div><h2 className="text-2xl font-black text-gray-950">Formulaire de contact généraux</h2><p className="mt-1 text-sm text-gray-500">Les champs marqués d’un astérisque (*) sont obligatoires.</p></div>
          </div>

          <form onSubmit={submit} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Nom complet *<input required name="name" autoComplete="name" className={inputClass} placeholder="Votre nom et prénom"/></label>
              <label className="text-sm font-semibold text-gray-700">Adresse e-mail *<input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="vous@exemple.com"/></label>
              <label className="text-sm font-semibold text-gray-700">Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="06 00 00 00 00"/></label>
              <label className="text-sm font-semibold text-gray-700">Code postal de livraison<input name="postalCode" autoComplete="postal-code" className={inputClass} placeholder="Code postal"/></label>
            </div>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Sujet de votre message *
              <select required name="subject" defaultValue="" className={inputClass}>
                <option value="" disabled>Choisissez un motif</option>
                <option value="Information produit">Information sur un produit ou stock</option>
                <option value="Suivi de commande">Suivi d’une commande en cours</option>
                <option value="Question livraison">Question sur les modalités de livraison</option>
                <option value="SAV & Reclamation">Service après-vente / Réclamation</option>
                <option value="Autre demande">Autre question générale</option>
              </select>
            </label>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Votre message *<textarea required name="message" rows={6} className={inputClass} placeholder="Expliquez-nous votre demande en détail…"/></label>

            {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</p>}
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{error}</p>}

            <button type="submit" disabled={sending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60">
              {sending ? 'Envoi du message…' : 'Envoyer mon message'} {!sending && <ArrowRight size={18}/>}
            </button>
          </form>
        </section>
      </section>

      <FaqSection compact/>
    </main>
  );
}
