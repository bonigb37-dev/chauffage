'use client';
import BrandWordmark from '@/components/BrandWordmark';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import Link from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { storeConfig } from '@/lib/store-config';
import { supportCopy } from '@/lib/support-copy';
import { cookieConsentCopy } from '@/lib/analytics-copy';
import { ArrowRight, Flame, Mail, MapPin, Phone, Truck } from 'lucide-react';

export default function Footer() {
  const brenLocale = useLocale() as Locale;

  const pathname = usePathname();
  if (pathname === '/compte') return null;
  return localizeNode((
    <footer className="forest-surface text-white border-t border-white/10">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" aria-label="Bren-nholz — Leylines Park, accueil" className="flex items-center gap-2 text-xl font-black tracking-tight text-white"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#A54829] text-white"><Flame size={20} strokeWidth={2.2} fill="currentColor" /></span><span><BrandWordmark hyphenClass="text-[#F4F0E5]" /></span></Link>
          <p className="mt-4 max-w-md leading-7 text-[#F4F0E5]/90">Granulés, bois de chauffage, briquettes et conseils pour préparer votre approvisionnement en Allemagne.</p>
        </div>
        <div><h3 className="font-black text-white">Navigation</h3><div className="mt-4 space-y-3 text-sm text-[#F4F0E5]/80"><Link className="block transition hover:text-[#F4F0E5]" href="/">Accueil</Link><Link className="block transition hover:text-[#F4F0E5]" href="/produits">Produits</Link><Link className="block transition hover:text-[#F4F0E5]" href="/guide-granules">Guide Pellets</Link><Link className="block transition hover:text-[#F4F0E5]" href="/services">Services</Link><Link className="block transition hover:text-[#F4F0E5]" href="/faq">Questions fréquentes</Link><Link className="block transition hover:text-[#F4F0E5]" href="/a-propos">À propos</Link><Link className="block transition hover:text-[#F4F0E5]" href="/avis-juridique">Avis juridique</Link><Link className="block transition hover:text-[#F4F0E5]" href="/datenschutz">Confidentialité</Link><Link className="block transition hover:text-[#F4F0E5]" href="/retractation">Retours et remboursements</Link><Link className="block rounded-lg border border-[#A54829] px-3 py-2 font-bold text-white hover:bg-[#A54829]/20" href="/retractation#retractation">Me rétracter du contrat</Link><Link className="block transition hover:text-[#F4F0E5]" href="/compte">Mon compte</Link><Link className="block transition hover:text-[#F4F0E5]" href="/compte?mode=signup">Créer un compte</Link></div></div>
        <div>
          <h3 className="font-black text-white">Contact</h3>
          <Link href="/aide" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#A54829] px-4 py-3 font-bold transition hover:bg-[#8c3b20] text-white">{supportCopy[brenLocale].help}</Link>
          <div className="mt-5 space-y-5 text-sm text-[#F4F0E5]/80">
            <div className="flex items-start gap-3">
              <Phone size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[#A54829]" />
              <a href={`tel:${storeConfig.phoneHref}`} className="font-semibold leading-6 text-white transition hover:text-[#F4F0E5]">{storeConfig.phone}</a>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[#A54829]" />
              <a href={`mailto:${storeConfig.email}`} className="min-w-0 break-words font-semibold leading-6 text-white transition hover:text-[#F4F0E5]">{storeConfig.email}</a>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[#A54829]" />
              <div className="min-w-0">
                <p className="font-semibold text-white">Entrepôt en Allemagne</p>
                <address className="mt-1 not-italic leading-6">{storeConfig.warehouseAddress}</address>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[#A54829]" />
              <Link href="/frais-livraison" className="leading-6 underline">Livraison en Allemagne</Link>
            </div>
            <div className="border-t border-white/10 pt-5">
              <p className="leading-6">Une question sur un produit ou votre commande ?</p>
              <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10">Nous contacter<ArrowRight size={16} aria-hidden="true" className="shrink-0" /></Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm text-[#F4F0E5]/70">
        <div className="container flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p>© {new Date().getFullYear()} Bren-nholz — Leylines Park. Tous droits réservés.</p>
          <button data-original-content type="button" onClick={() => window.dispatchEvent(new Event('bren-analytics-settings'))} className="font-semibold text-white underline underline-offset-4 hover:text-[#F4F0E5]">{cookieConsentCopy[brenLocale].settings}</button>
          <Link href="/agb" className="font-semibold text-white underline underline-offset-4 transition hover:text-[#F4F0E5]">Conditions générales de vente</Link>
        </div>
      </div>
    </footer>
  ), brenLocale);
}
