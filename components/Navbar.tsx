'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUserRound, Flame, MapPin, Menu, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import DeliveryZonesModal from '@/components/DeliveryZonesModal';

const links = [
  ['Accueil', '/'],
  ['Produits', '/produits'],
  ['À propos', '/a-propos'],
  ['Contact', '/contact'],
];

export default function Navbar() {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
    || pathname === '/super-admin' || pathname.startsWith('/super-admin/');
  const [open, setOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        {/* Top Banner for Delivery Zones */}
        <div
          onClick={() => setDeliveryModalOpen(true)}
          className="cursor-pointer bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 py-2.5 px-4 text-center text-xs sm:text-sm font-bold text-white transition hover:brightness-105 flex items-center justify-center gap-2 shadow-inner"
          role="button"
          tabIndex={0}
          aria-label="Consultez nos différentes zones de livraison à domicile"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setDeliveryModalOpen(true);
          }}
        >
          <span>Frais de livraison selon la zone : demandez un tarif avec votre code postal</span>
          <MapPin size={16} className="shrink-0" />
        </div>

        <div className="container flex h-20 items-center justify-between">
          <Link href="/" aria-label="Bren-nholz, accueil" className="flex items-center gap-2 font-black text-xl tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20"><Flame size={23} strokeWidth={2.2} fill="currentColor" /></span><span>Bren<span className="text-orange-500">-</span>nholz</span></Link>
          {!isAdminPage && <nav className="hidden items-center gap-5 text-sm font-semibold text-gray-600 lg:flex xl:gap-7">
            {links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-orange-500">{label}</Link>)}
            <Link href="/compte" className="flex items-center gap-1.5 transition hover:text-orange-500"><CircleUserRound size={19} /> Mon compte</Link>
            <Link href="/panier" aria-label={`Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`} className="relative grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-800 transition hover:bg-orange-50 hover:text-orange-600"><ShoppingCart size={18} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{itemCount}</span>}</Link>
            <Link href="/devis" className="rounded-full bg-orange-500 px-5 py-2.5 text-white transition hover:bg-orange-600 font-bold">Demander un devis</Link>
          </nav>}
          {!isAdminPage && <div className="flex items-center gap-2 lg:hidden">
            <Link href="/compte" aria-label="Mon compte" className="grid h-10 w-10 place-items-center rounded-full bg-gray-100"><CircleUserRound size={20} /></Link>
            <Link href="/panier" aria-label={`Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`} className="relative grid h-10 w-10 place-items-center rounded-full bg-gray-100"><ShoppingCart size={18} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{itemCount}</span>}</Link>
            <button type="button" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} className="grid h-10 w-10 place-items-center" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          </div>}
        </div>
        {!isAdminPage && open && <div className="border-t bg-white px-5 py-4 lg:hidden">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} className="block py-3 font-semibold" key={href} href={href}>{label}</Link>)}<Link onClick={() => setOpen(false)} href="/compte" className="flex items-center gap-2 py-3 font-semibold"><CircleUserRound size={19} /> Mon compte</Link><Link onClick={() => setOpen(false)} href="/devis" className="mt-2 block rounded-xl bg-orange-500 px-5 py-3 text-center font-bold text-white">Demander un devis</Link></div>}
      </header>

      <DeliveryZonesModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
      />
    </>
  );
}
