'use client';

import Link from 'next/link';
import { MapPin, Truck, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DeliveryZonesModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return <div className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-gray-950/80 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-labelledby="modal-delivery-title" onClick={onClose}>
    <section className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white text-gray-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider"><Truck size={14} /> Livraison en Allemagne</span>
            <h2 id="modal-delivery-title" className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Vérifier les frais de livraison</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-100 sm:text-base">Les frais dépendent de la zone de livraison. Envoyez votre code postal allemand pour vérifier la desserte et recevoir un tarif avant de confirmer la commande.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer la fenêtre" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 transition hover:bg-white/30"><X size={20} /></button>
        </div>
      </div>
      <div className="space-y-5 p-6 sm:p-8">
        <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
          <MapPin size={19} className="mt-0.5 shrink-0 text-orange-700" />
          <p>La disponibilité, la zone desservie, le montant des frais et le délai sont confirmés par l’entreprise après vérification de votre adresse.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/devis" onClick={onClose} className="inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700">Demander un tarif avec mon code postal</Link>
          <button type="button" onClick={onClose} className="rounded-full border border-stone-300 px-6 py-3 font-bold text-gray-800 hover:border-orange-500">Fermer</button>
        </div>
      </div>
    </section>
  </div>;
}
