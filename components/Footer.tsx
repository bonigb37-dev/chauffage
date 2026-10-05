import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-black"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-white"><Flame size={19} /></span>THERMOPRO</Link>
          <p className="mt-4 max-w-md leading-7 text-gray-500">Granulés, bois de chauffage, briquettes et conseils pour préparer votre approvisionnement.</p>
        </div>
        <div><h3 className="font-black">Navigation</h3><div className="mt-4 space-y-3 text-sm text-gray-500"><Link className="block hover:text-orange-500" href="/produits">Produits</Link><Link className="block hover:text-orange-500" href="/services">Services</Link><Link className="block hover:text-orange-500" href="/faq">Questions fréquentes</Link><Link className="block hover:text-orange-500" href="/a-propos">À propos</Link></div></div>
        <div><h3 className="font-black">Contact</h3><div className="mt-4 space-y-3 text-sm text-gray-500"><p>Livraison en Allemagne</p><p>Une question sur un produit ou une commande ?</p><Link className="inline-block font-semibold text-orange-600 hover:text-orange-700" href="/contact">Accéder au formulaire de contact</Link></div></div>
      </div>
      <div className="border-t py-6 text-center text-sm text-gray-400">© {new Date().getFullYear()} ThermoPro. Tous droits réservés.</div>
    </footer>
  );
}
