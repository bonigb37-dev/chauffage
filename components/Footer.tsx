'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import Link from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { storeConfig } from '@/lib/store-config';
import { supportCopy } from '@/lib/support-copy';
import { ArrowRight, Flame, MapPin, Phone, Truck } from 'lucide-react';

export default function Footer() {
  const brenLocale = useLocale() as Locale;

  const pathname = usePathname();
  if (pathname === '/compte') return null;
  return localizeNode((
    <footer className="bg-[#2b2b2b] text-white border-t border-white/10">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" aria-label="Bren-nholz, accueil" className="flex items-center gap-2 text-xl font-black tracking-tight text-white"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-white"><Flame size={20} strokeWidth={2.2} fill="currentColor" /></span><span>Bren<span className="text-orange-500">-</span>nholz</span></Link>
          <p className="mt-4 max-w-md leading-7 text-gray-300">Granulés, bois de chauffage, briquettes et conseils pour préparer votre approvisionnement.</p>
        </div>
        <div><h3 className="font-black text-white">Navigation</h3><div className="mt-4 space-y-3 text-sm text-gray-300"><Link className="block transition hover:text-orange-400" href="/">Accueil</Link><Link className="block transition hover:text-orange-400" href="/produits">Produits</Link><Link className="block transition hover:text-orange-400" href="/guide-pellets">Guide Granulés</Link><Link className="block transition hover:text-orange-400" href="/services">Services</Link><Link className="block transition hover:text-orange-400" href="/faq">Questions fréquentes</Link><Link className="block transition hover:text-orange-400" href="/a-propos">À propos</Link><Link className="block transition hover:text-orange-400" href="/avis-juridique">Avis juridique</Link><Link className="block transition hover:text-orange-400" href="/datenschutz">Confidentialité</Link><Link className="block transition hover:text-orange-400" href="/retractation">Retours et remboursements</Link><Link className="block rounded-lg border border-orange-400/50 px-3 py-2 font-bold text-orange-300 hover:bg-white/5" href="/retractation#retractation">Me rétracter du contrat</Link><Link className="block transition hover:text-orange-400" href="/compte">Mon compte</Link><Link className="block transition hover:text-orange-400" href="/compte?mode=signup">Créer un compte</Link></div></div>
        <div>
          <h3 className="font-black text-white">Contact</h3>
          <Link href="/aide" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-orange-600 px-4 py-3 font-bold transition hover:bg-orange-700" style={{ color: '#ffffff' }}>{supportCopy[brenLocale].help}</Link>
          <div className="mt-5 space-y-5 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <Phone size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-orange-400" />
              <a href={`tel:${storeConfig.phoneHref}`} className="font-semibold leading-6 text-white transition hover:text-orange-400">{storeConfig.phone}</a>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-orange-400" />
              <div className="min-w-0">
                <p className="font-semibold text-white">Entrepôt en Allemagne</p>
                <address className="mt-1 not-italic leading-6">{storeConfig.warehouseAddress}</address>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-orange-400" />
              <p className="leading-6">Livraison incluse en Allemagne</p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <p className="leading-6">Une question sur un produit ou votre commande ?</p>
              <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-400/40 px-4 py-2.5 font-semibold text-orange-400 transition hover:border-orange-300 hover:bg-white/5 hover:text-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400">Nous contacter<ArrowRight size={16} aria-hidden="true" className="shrink-0" /></Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm text-gray-400">
        <div className="container flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p>© {new Date().getFullYear()} Bren-nholz. Tous droits réservés.</p>
          <Link href="/agb" className="font-semibold text-gray-300 underline underline-offset-4 transition hover:text-orange-400">Conditions générales de vente</Link>
        </div>
      </div>
    </footer>
  ), brenLocale);
}
