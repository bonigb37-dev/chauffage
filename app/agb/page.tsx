import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions de vente — Bren-nholz',
  robots: { index: false, follow: false },
};

export default function SalesTermsPage() {
  return <main className="min-h-[60vh] bg-stone-50 py-12 sm:py-16">
    <section className="container max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-10">
      <h1 className="text-3xl font-black text-gray-950">Conditions de vente</h1>
      <p className="mt-6 rounded-xl bg-amber-50 p-4 leading-7 text-amber-950">Les conditions générales de vente complètes ne sont pas encore publiées sur cette page. Contactez l’entreprise pour les obtenir avant de confirmer votre commande ou d’effectuer un virement.</p>
      <h2 className="mt-8 text-xl font-bold">Fonctionnement de la demande de commande</h2>
      <p className="mt-3 leading-7 text-gray-700">Le formulaire transmet une demande de commande. L’entreprise doit confirmer la disponibilité des produits, les frais de livraison et le montant définitif avant le virement. Aucun paiement n’est prélevé par le formulaire.</p>
      <p className="mt-3 leading-7 text-gray-700">La livraison proposée sur le site concerne l’Allemagne. Les frais sont confirmés selon l’adresse de livraison.</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/contact" className="rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Demander les conditions de vente</Link>
        <Link href="/commande" className="rounded-full border border-stone-300 px-6 py-3 font-bold text-gray-800">Retour au formulaire de commande</Link>
      </div>
    </section>
  </main>;
}
