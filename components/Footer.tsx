import Link from 'next/link';
import { Flame, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2b2b2b] text-white border-t border-white/10">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" aria-label="Bren-nholz, accueil" className="flex items-center gap-2 text-xl font-black tracking-tight text-white"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-white"><Flame size={20} strokeWidth={2.2} fill="currentColor" /></span><span>Bren<span className="text-orange-500">-</span>nholz</span></Link>
          <p className="mt-4 max-w-md leading-7 text-gray-300">Granulés, bois de chauffage, briquettes et conseils pour préparer votre approvisionnement.</p>
        </div>
        <div><h3 className="font-black text-white">Navigation</h3><div className="mt-4 space-y-3 text-sm text-gray-300"><Link className="block transition hover:text-orange-400" href="/produits">Produits</Link><Link className="block transition hover:text-orange-400" href="/guide-pellets">Guide Granulés</Link><Link className="block transition hover:text-orange-400" href="/services">Services</Link><Link className="block transition hover:text-orange-400" href="/faq">Questions fréquentes</Link><Link className="block transition hover:text-orange-400" href="/a-propos">À propos</Link></div></div>
        <div><h3 className="font-black text-white">Contact</h3><div className="mt-4 space-y-3 text-sm text-gray-300"><div className="flex items-start gap-3"><MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-orange-400" /><div><p className="font-semibold text-white">Adresse</p><address className="mt-1 not-italic leading-6">Brauerstraße 3<br />66663 Merzig, Allemagne</address></div></div><p>Livraison en Allemagne</p><p>Une question sur un produit ou une commande ?</p><Link className="inline-block font-semibold text-orange-400 hover:text-orange-300" href="/contact">Accéder au formulaire de contact</Link></div></div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm text-gray-400">
        <div className="container flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p>© {new Date().getFullYear()} Bren-nholz. Tous droits réservés.</p>
          <Link href="/agb" className="font-semibold text-gray-300 underline underline-offset-4 transition hover:text-orange-400">Conditions générales de vente</Link>
        </div>
      </div>
    </footer>
  );
}
