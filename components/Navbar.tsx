'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleUserRound, Flame, Menu, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

const links = [['Accueil', '/'], ['Produits', '/produits'], ['Services', '/services'], ['À propos', '/a-propos'], ['Contact', '/contact']];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white"><Flame size={22} /></span>THERMO<span className="text-orange-500">PRO</span></Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-gray-600 lg:flex xl:gap-7">
          {links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-orange-500">{label}</Link>)}
          <Link href="/compte" className="flex items-center gap-2 transition hover:text-orange-500"><CircleUserRound size={19} /> Mon compte</Link>
          <Link href="/panier" aria-label={`Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`} className="relative grid h-11 w-11 place-items-center rounded-full bg-gray-100 text-gray-800 transition hover:bg-orange-50 hover:text-orange-600"><ShoppingBag size={19} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{itemCount}</span>}</Link>
          <Link href="/contact" className="rounded-full bg-orange-500 px-5 py-3 text-white transition hover:bg-orange-600">Demander un devis</Link>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/compte" aria-label="Mon compte" className="grid h-10 w-10 place-items-center rounded-full bg-gray-100"><CircleUserRound size={20} /></Link>
          <Link href="/panier" aria-label={`Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`} className="relative grid h-10 w-10 place-items-center rounded-full bg-gray-100"><ShoppingBag size={19} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{itemCount}</span>}</Link>
          <button type="button" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} className="grid h-10 w-10 place-items-center" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <div className="border-t bg-white px-5 py-4 lg:hidden">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} className="block py-3 font-semibold" key={href} href={href}>{label}</Link>)}<Link onClick={() => setOpen(false)} href="/compte" className="flex items-center gap-2 py-3 font-semibold"><CircleUserRound size={19} /> Mon compte</Link><Link onClick={() => setOpen(false)} href="/contact" className="mt-2 block rounded-xl bg-orange-500 px-5 py-3 text-center font-bold text-white">Demander un devis</Link></div>}
    </header>
  );
}
