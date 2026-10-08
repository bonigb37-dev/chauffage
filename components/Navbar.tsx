'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight,
  ChevronDown,
  CircleUserRound,
  FileText,
  Flame,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import DeliveryZonesModal from '@/components/DeliveryZonesModal';

const links = [
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits', hasMegaMenu: true },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, items, products } = useCart();
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
    || pathname === '/super-admin' || pathname.startsWith('/super-admin/');

  // Navigation & User states
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProduitsOpen, setMobileProduitsOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for click outside
  const navRef = useRef<HTMLDivElement>(null);

  // Sync Supabase Auth Session
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    router.refresh();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/produits?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
  }

  // Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMegaMenuOpen(false);
    setAccountOpen(false);
    setCartOpen(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
        setAccountOpen(false);
        setCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hotkey listener (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hide Navbar completely on dedicated fullscreen pages like /compte
  if (pathname === '/compte' || isAdminPage) return null;

  const totalCartItemsCount = itemCount;

  const displayCartItems = items.slice(0, 3).map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      title: product?.name ?? 'Produit',
      quantity: line.quantity,
      price: product?.price ?? 'Sur devis',
    };
  });

  const totalCartPrice = items
    .reduce((sum, line) => {
      const product = products.find((p) => p.id === line.productId);
      return sum + (product?.priceAmount ? product.priceAmount / 100 : 0) * line.quantity;
    }, 0)
    .toFixed(2)
    .replace('.', ',');

  const cartTooltip =
    totalCartItemsCount > 0
      ? `Mon panier (${totalCartItemsCount}) · ${totalCartPrice} €`
      : 'Mon panier';
  const accountTooltip = user
    ? `Compte client · ${user.user_metadata?.full_name || user.email?.split('@')[0] || 'Connecté'}`
    : 'Espace client';

  return (
    <>
      {/* Top Banner for Delivery Zones */}
      <div
        onClick={() => setDeliveryModalOpen(true)}
        className="cursor-pointer bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 py-2 px-4 text-center text-xs sm:text-sm font-bold text-white transition hover:brightness-105 flex items-center justify-center gap-2 shadow-inner z-50 relative"
        role="button"
        tabIndex={0}
        aria-label="Consultez nos différentes zones de livraison à domicile"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setDeliveryModalOpen(true);
        }}
      >
        <span>Livraison incluse en Allemagne · Aucun frais supplémentaire à régler au transporteur · Cliquez ici pour voir les détails</span>
        <MapPin size={15} className="shrink-0" />
      </div>

      {/* Main Sticky Navbar */}
      <header
        ref={navRef}
        className={`sticky top-0 z-50 bg-white transition-all duration-200 border-b border-black/[0.06] ${
          isScrolled ? 'shadow-md py-2.5' : 'py-3.5 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* LEFT: Logo Bren-holz */}
          <Link
            href="/"
            aria-label="Bren-holz, accueil"
            className="flex items-center gap-2.5 font-black text-xl tracking-tight text-[#172033] shrink-0 group"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FF6B00] text-white shadow-md shadow-orange-500/25 group-hover:bg-[#E85D00] transition-colors">
              <Flame size={22} strokeWidth={2.2} fill="currentColor" />
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#172033]">
              Bren<span className="text-[#FF6B00]">-</span>holz
            </span>
          </Link>

          {/* CENTER: Desktop Main Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-base font-medium text-[#172033]">
            {links.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              if (link.hasMegaMenu) {
                return (
                  <div key={link.href} className="relative group" onMouseEnter={() => setMegaMenuOpen(true)}>
                    <button
                      type="button"
                      onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                      className={`flex items-center gap-1.5 py-2 font-medium text-base transition-colors ${
                        isActive || megaMenuOpen ? 'text-[#FF6B00]' : 'text-[#172033] hover:text-[#FF6B00]'
                      }`}
                      aria-expanded={megaMenuOpen}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-[#FF6B00]' : 'text-[#687280]'}`}
                      />
                    </button>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF6B00] rounded-full" />
                    )}
                  </div>
                );
              }

              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={`py-2 font-medium text-base transition-colors ${
                      isActive ? 'text-[#FF6B00]' : 'text-[#172033] hover:text-[#FF6B00]'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF6B00] rounded-full" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT: Desktop Actions & CTA with Visual Tooltip Indices & Badges */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* 1. Search Icon Button with Hotkey Badge Index & Tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-xl text-[#172033] hover:text-[#FF6B00] hover:bg-orange-50/80 transition flex items-center justify-center relative"
                aria-label="Rechercher des produits"
              >
                <Search size={20} />
                <span className="absolute top-1 right-1 text-[9px] font-extrabold text-gray-400 bg-gray-100 px-1 rounded border border-gray-200 pointer-events-none">
                  ⌘K
                </span>
              </button>
              {/* Tooltip Index */}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#172033] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                Rechercher <kbd className="text-[9px] bg-white/20 px-1 rounded ml-1">⌘K</kbd>
              </span>
            </div>

            {/* 2. Favorites/Wishlist Icon & Tooltip */}
            <div className="relative group">
              <Link
                href="/produits"
                className="relative p-2.5 rounded-xl text-[#172033] hover:text-[#FF6B00] hover:bg-orange-50/80 transition flex items-center justify-center"
                aria-label="Mes favoris"
              >
                <Heart size={20} />
              </Link>
              {/* Tooltip Index */}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#172033] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                Favoris
              </span>
            </div>

            {/* 3. Cart Icon with Quantity Badge Index & Tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(!cartOpen);
                  setAccountOpen(false);
                  setMegaMenuOpen(false);
                }}
                className="relative p-2.5 rounded-xl text-[#172033] hover:text-[#FF6B00] hover:bg-orange-50/80 transition flex items-center justify-center"
                aria-label={
                  totalCartItemsCount > 0
                    ? `Panier, ${totalCartItemsCount} article${totalCartItemsCount > 1 ? 's' : ''}`
                    : 'Panier vide'
                }
              >
                <ShoppingCart size={20} />
                {totalCartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF6B00] px-1 text-[11px] font-black text-white ring-2 ring-white shadow-sm">
                    {totalCartItemsCount}
                  </span>
                )}
              </button>
              {/* Tooltip Index */}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#172033] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                {cartTooltip}
              </span>
            </div>

            {/* 4. Account Icon with Connected Status Dot Index & Tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(!accountOpen);
                  setCartOpen(false);
                  setMegaMenuOpen(false);
                }}
                className="relative p-2.5 rounded-xl text-[#172033] hover:text-[#FF6B00] hover:bg-orange-50/80 transition flex items-center justify-center"
                aria-label="Espace compte client"
              >
                <CircleUserRound size={21} />
                {user && (
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>
              {/* Tooltip Index */}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#172033] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                {accountTooltip}
              </span>
            </div>

            {/* Primary CTA: Demander un devis */}
            <Link
              href="/devis"
              className="ml-2 inline-flex items-center gap-1.5 bg-[#FF6B00] hover:bg-[#E85D00] text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] shrink-0"
            >
              <span>Demander un devis</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* MOBILE RIGHT ACTIONS (< 768px) */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:hidden">
            {/* Search Icon Mobile */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-xl text-[#172033] hover:bg-gray-100 transition"
              aria-label="Recherche"
            >
              <Search size={20} />
            </button>

            {/* Favorites Mobile */}
            <Link
              href="/produits"
              className="relative p-2 rounded-xl text-[#172033] hover:bg-gray-100 transition"
              aria-label="Mes favoris"
            >
              <Heart size={20} />
            </Link>

            {/* Cart Icon Mobile */}
            <button
              type="button"
              onClick={() => {
                setCartOpen(!cartOpen);
                setAccountOpen(false);
              }}
              className="relative p-2 rounded-xl text-[#172033] hover:bg-gray-100 transition"
              aria-label="Voir le panier"
            >
              <ShoppingCart size={20} />
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-black text-white shadow-sm">
                  {totalCartItemsCount}
                </span>
              )}
            </button>

            {/* Account Icon Mobile */}
            <Link
              href="/compte"
              className="relative p-2 rounded-xl text-[#172033] hover:bg-gray-100 transition"
              aria-label="Mon compte"
            >
              <CircleUserRound size={21} />
              {user && (
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </Link>

            {/* Hamburger Button Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#172033] hover:bg-gray-100 transition"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* 3. MEGA MENU PRODUITS DESKTOP */}
        {/* ================================================== */}
        {megaMenuOpen && (
          <div
            className="hidden md:block absolute top-full left-0 right-0 bg-white border-b border-black/[0.08] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
              {/* COLONNE GAUCHE: Photoreal Firewood Image Banner */}
              <div className="col-span-4 relative rounded-2xl overflow-hidden shadow-md flex flex-col justify-between p-6 text-white min-h-[240px] group bg-stone-900">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

                <div className="relative z-10">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#FF6B00] text-[11px] font-bold uppercase tracking-wider text-white mb-2">
                    Bren-holz Qualité
                  </span>
                  <p className="text-lg font-bold leading-snug text-white drop-shadow-sm">
                    Du bois de qualité pour un chauffage naturel et durable.
                  </p>
                </div>

                <Link
                  href="/produits"
                  onClick={() => setMegaMenuOpen(false)}
                  className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-[#FF6B00] hover:text-orange-400 transition mt-4"
                >
                  <span>Voir tous les produits</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* COLONNE CENTRALE: Bois de chauffage */}
              <div className="col-span-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#172033] border-b border-gray-100 pb-2">
                  Bois de chauffage
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      href="/produits?category=buches"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#687280] hover:text-[#FF6B00] font-medium transition"
                    >
                      <span>Bûches de chêne & hêtre</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits?category=granules"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#687280] hover:text-[#FF6B00] font-medium transition"
                    >
                      <span>Granulés / Pellets DIN+</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits?category=bois-compresse"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#687280] hover:text-[#FF6B00] font-medium transition"
                    >
                      <span>Bois compressé & Briquettes</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* COLONNE DROITE: Accessoires */}
              <div className="col-span-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#172033] border-b border-gray-100 pb-2">
                  Accessoires
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      href="/produits?category=allume-feu"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#687280] hover:text-[#FF6B00] font-medium transition"
                    >
                      <span>Allume-feu naturel</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits?category=packs"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#687280] hover:text-[#FF6B00] font-medium transition"
                    >
                      <span>Packs découverte</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits?category=stockage"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#687280] hover:text-[#FF6B00] font-medium transition"
                    >
                      <span>Stockage & transport</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* 4. MENU COMPTE DROPDOWN */}
        {/* ================================================== */}
        {accountOpen && (
          <div className="absolute top-full right-4 sm:right-16 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            {user ? (
              <>
                {/* User Info Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF6B00] font-black flex items-center justify-center text-base border border-orange-200 shrink-0">
                    {user.email?.[0].toUpperCase() ?? 'A'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-[#172033] text-sm truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Account Links */}
                <div className="py-2 space-y-1 text-sm text-[#172033]">
                  <Link
                    href="/compte"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-[#FF6B00] font-medium transition"
                  >
                    <User size={16} />
                    <span>Mon profil</span>
                    <ArrowRight size={14} className="ml-auto text-gray-400" />
                  </Link>

                  <Link
                    href="/compte"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-[#FF6B00] font-medium transition"
                  >
                    <ShoppingBag size={16} />
                    <span>Mes commandes</span>
                    <ArrowRight size={14} className="ml-auto text-gray-400" />
                  </Link>

                  <Link
                    href="/devis"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-[#FF6B00] font-medium transition"
                  >
                    <FileText size={16} />
                    <span>Mes devis</span>
                    <ArrowRight size={14} className="ml-auto text-gray-400" />
                  </Link>

                  <Link
                    href="/compte"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-[#FF6B00] font-medium transition"
                  >
                    <Settings size={16} />
                    <span>Préférences</span>
                    <ArrowRight size={14} className="ml-auto text-gray-400" />
                  </Link>
                </div>

                <hr className="my-1 border-gray-100" />

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium text-sm transition"
                >
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </button>
              </>
            ) : (
              <div className="space-y-3 py-1">
                <div className="text-center pb-2 border-b border-gray-100">
                  <p className="font-bold text-[#172033] text-base">Espace Client</p>
                  <p className="text-xs text-gray-500 mt-0.5">Connectez-vous pour suivre vos commandes & devis</p>
                </div>

                <Link
                  href="/compte?mode=signin"
                  onClick={() => setAccountOpen(false)}
                  className="w-full bg-[#FF6B00] hover:bg-[#E85D00] text-white font-bold py-2.5 px-4 rounded-xl text-center block text-sm shadow-md shadow-orange-500/20 transition"
                >
                  Se connecter
                </Link>

                <Link
                  href="/compte?mode=signup"
                  onClick={() => setAccountOpen(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-[#172033] font-semibold py-2.5 px-4 rounded-xl text-center block text-sm transition"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* 5. MINI PANIER DROPDOWN */}
        {/* ================================================== */}
        {cartOpen && (
          <div className="absolute top-full right-2 sm:right-12 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-[#172033] text-base">
                Votre panier ({totalCartItemsCount})
              </h3>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Product List */}
            <div className="py-3 space-y-3 max-h-60 overflow-y-auto">
              {displayCartItems.length > 0 ? (
                displayCartItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center font-bold text-xs shrink-0">
                        {item.quantity}×
                      </span>
                      <span className="font-semibold text-[#172033] line-clamp-1">{item.title}</span>
                    </div>
                    <span className="font-bold text-[#172033] shrink-0">
                      {item.price.includes('€') ? item.price : item.price === 'Sur devis' ? item.price : `${item.price} €`}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm font-medium text-gray-500">
                  Votre panier est vide.
                </p>
              )}
            </div>

            {/* Total Footer */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {displayCartItems.length > 0 && (
                <div className="flex items-center justify-between font-bold text-base text-[#172033]">
                  <span>Total</span>
                  <span className="text-[#FF6B00] text-lg">{totalCartPrice} €</span>
                </div>
              )}

              <Link
                href="/panier"
                onClick={() => setCartOpen(false)}
                className="w-full bg-[#FF6B00] hover:bg-[#E85D00] text-white font-bold py-3 px-4 rounded-xl text-center block transition shadow-md shadow-orange-500/20 text-sm"
              >
                Voir mon panier →
              </Link>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* SEARCH BAR OVERLAY */}
        {/* ================================================== */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des produits (ex: bûches de chêne, granulés, allume-feu...)"
                autoFocus
                className="w-full text-sm font-medium text-[#172033] bg-transparent border-0 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#FF6B00] text-white font-bold rounded-xl text-xs hover:bg-[#E85D00] transition shrink-0"
              >
                Chercher
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg shrink-0"
              >
                <X size={20} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ================================================== */}
      {/* 8. MENU MOBILE OVERLAY (< 768px) */}
      {/* ================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#101820] text-white flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in duration-200">
          {/* Header Mobile Drawer */}
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Bren-holz, accueil"
                className="flex items-center gap-2.5 font-black text-xl tracking-tight text-white"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF6B00] text-white shadow-md">
                  <Flame size={20} strokeWidth={2.2} fill="currentColor" />
                </span>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Bren<span className="text-[#FF6B00]">-</span>holz
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                aria-label="Fermer le menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="py-6 space-y-2 text-lg font-bold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/' ? 'text-[#FF6B00] bg-white/5' : 'text-zinc-200 hover:text-white'
                }`}
              >
                Accueil
              </Link>

              {/* Mobile Produits Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileProduitsOpen(!mobileProduitsOpen)}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-zinc-200 hover:text-white transition"
                >
                  <span>Produits</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${mobileProduitsOpen ? 'rotate-180 text-[#FF6B00]' : ''}`}
                  />
                </button>

                {mobileProduitsOpen && (
                  <div className="ml-4 pl-4 border-l border-white/10 space-y-3 py-2 text-sm font-medium text-zinc-400">
                    <Link
                      href="/produits?category=buches"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#FF6B00] py-1"
                    >
                      Bûches de chauffage
                    </Link>
                    <Link
                      href="/produits?category=granules"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#FF6B00] py-1"
                    >
                      Granulés & Pellets DIN+
                    </Link>
                    <Link
                      href="/produits?category=bois-compresse"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#FF6B00] py-1"
                    >
                      Bois compressé
                    </Link>
                    <Link
                      href="/produits?category=allume-feu"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#FF6B00] py-1"
                    >
                      Allume-feu & Accessoires
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/a-propos"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/a-propos' ? 'text-[#FF6B00] bg-white/5' : 'text-zinc-200 hover:text-white'
                }`}
              >
                À propos
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/contact' ? 'text-[#FF6B00] bg-white/5' : 'text-zinc-200 hover:text-white'
                }`}
              >
                Contact
              </Link>

              <hr className="my-4 border-white/10" />

              <Link
                href="/compte"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-2 rounded-xl text-zinc-200 hover:text-white transition"
              >
                <CircleUserRound size={22} className="text-[#FF6B00]" />
                <span>Mon compte</span>
              </Link>
            </nav>
          </div>

          {/* Bottom Mobile CTA */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <Link
              href="/devis"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-[#FF6B00] hover:bg-[#E85D00] text-white font-bold text-base py-4 rounded-xl text-center block shadow-lg shadow-orange-950/50 transition active:scale-[0.99]"
            >
              Demander un devis →
            </Link>
          </div>
        </div>
      )}

      {/* Delivery Zones Modal */}
      <DeliveryZonesModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
      />
    </>
  );
}

