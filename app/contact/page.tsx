'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, CircleHelp, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import FaqSection from '@/components/FaqSection';

const inputClass = 'mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function Contact() {
  const [notice, setNotice] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Votre demande n’a pas été envoyée : le formulaire doit encore être relié à l’adresse de contact de l’entreprise.');
  }

  return (
    <main>
      <section className="bg-[#fffaf5] py-16 sm:py-20">
        <div className="container grid items-end gap-8 lg:grid-cols-[1fr_.65fr]">
          <div>
            <p className="font-bold uppercase tracking-[.2em] text-orange-600">Contact & conseils</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-gray-950 sm:text-5xl">Parlons de votre approvisionnement.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">Décrivez les produits et les quantités recherchés. Pour estimer la livraison, indiquez également votre code postal en Allemagne.</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700"><MapPin size={21}/></span><div><h2 className="font-bold text-gray-950">Zone de livraison</h2><p className="mt-1 leading-6 text-gray-600">Allemagne uniquement. Les frais et délais sont à confirmer selon votre adresse.</p></div></div>
          </div>
        </div>
      </section>
      <section className="container grid gap-10 py-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:py-16">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-700"><MessageCircle size={21}/></span>
            <h2 className="mt-5 text-xl font-black">Comment nous aider à vous répondre ?</h2>
            <p className="mt-3 leading-7 text-gray-600">Précisez le nom du produit, le conditionnement, la quantité souhaitée et votre code postal. Pour une réclamation, ajoutez votre référence de commande et décrivez le problème.</p>
          </div>
          <div className="rounded-2xl bg-gray-950 p-6 text-white sm:p-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-orange-300"><Boxes size={21}/></span>
            <h2 className="mt-5 text-xl font-black">Un produit vous intéresse ?</h2>
            <p className="mt-3 leading-7 text-gray-300">Consultez les formats et les caractéristiques, puis ajoutez au panier les articles disponibles à la commande.</p>
            <Link href="/produits" className="mt-5 inline-flex items-center gap-2 font-bold text-orange-300 hover:text-white">Parcourir la boutique <ArrowRight size={17}/></Link>
          </div>
          <Link href="/faq" className="flex items-center gap-4 rounded-2xl border border-stone-200 p-5 transition hover:border-orange-300 hover:bg-orange-50/50">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gray-100 text-gray-700"><CircleHelp size={21}/></span>
            <span className="flex-1"><b className="block text-gray-950">Une question fréquente ?</b><span className="mt-1 block text-sm text-gray-500">Consultez notre FAQ</span></span><ArrowRight size={18} className="text-orange-600"/>
          </Link>
        </aside>
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft sm:p-9">
          <div className="flex items-start gap-4 border-b border-stone-100 pb-6"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={21}/></span><div><h2 className="text-2xl font-black text-gray-950">Écrivez-nous</h2><p className="mt-1 leading-6 text-gray-500">Les champs marqués d’un astérisque sont obligatoires.</p></div></div>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Formulaire en préparation : les coordonnées de l’entreprise et le service d’envoi restent à configurer. Aucune demande ne sera transmise pour l’instant.</div>
          <form onSubmit={submit} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Nom complet *<input required name="name" autoComplete="name" className={inputClass} placeholder="Votre nom"/></label>
              <label className="text-sm font-semibold text-gray-700">Adresse e-mail *<input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="vous@exemple.com"/></label>
              <label className="text-sm font-semibold text-gray-700">Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="+49 …"/></label>
              <label className="text-sm font-semibold text-gray-700">Code postal de livraison<input name="postalCode" autoComplete="postal-code" className={inputClass} placeholder="Code postal en Allemagne"/></label>
            </div>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Objet de votre demande *<select required name="subject" defaultValue="" className={inputClass}><option value="" disabled>Choisissez un sujet</option><option value="product">Information sur un produit</option><option value="quote">Demande de devis</option><option value="delivery">Livraison</option><option value="order">Commande en cours</option><option value="claim">Réclamation</option><option value="other">Autre demande</option></select></label>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Votre message *<textarea required name="message" rows={6} className={inputClass} placeholder="Produit, quantité souhaitée et détails utiles…"/></label>
            {notice && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{notice}</p>}
            <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-4 font-bold text-white transition hover:bg-orange-700">Envoyer ma demande <ArrowRight size={18}/></button>
          </form>
        </section>
      </section>
      <FaqSection compact/>
    </main>
  );
}
