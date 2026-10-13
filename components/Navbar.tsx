'use client';
import BrandWordmark from '@/components/BrandWordmark';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useEffect, useRef, useState } from 'react';
import Link from '@/i18n/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight,
  ChevronDown,
  CircleUserRound,
  Flame,
  Heart,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useCart } from '@/components/CartProvider';

const links = [
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits', hasMegaMenu: true },
  { label: 'Guide Pellets', href: '/guide-granules' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const brenLocale = useLocale() as Locale;

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
    router.push(`/produits?search=${encodeURIComponent(searchQuery.trim())}#catalogue`);
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setSearchOpen(false);
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

  return localizeNode((
    <>
      {/* Free delivery banner with truck icon in Terracotta background */}
      <div
        className="bg-[#A54829] py-2 px-4 text-center text-xs sm:text-sm font-bold text-white shadow-inner z-50 relative flex items-center justify-center gap-2"
      >
        <Truck size={17} className="shrink-0 text-white" />
        <span>Livraison en Allemagne · Aucun frais supplémentaire à régler au transporteur</span>
      </div>

      {/* Main Sticky Navbar */}
      <header
        ref={navRef}
        className={`sticky top-0 z-50 bg-white transition-all duration-200 border-b border-[#E7E0D3] ${
          isScrolled ? 'shadow-md py-2.5' : 'py-3.5 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* LEFT: Logo Bren-nholz */}
          <Link
            href="/"
            aria-label="Bren-nholz — Leylines Park, accueil"
            className="flex items-center gap-2.5 font-black text-xl tracking-tight text-[#1c1917] shrink-0 group"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#A54829] text-white shadow-md shadow-[#A54829]/25 group-hover:bg-[#8c3b20] transition-colors">
              <Flame size={22} strokeWidth={2.2} fill="currentColor" />
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#1c1917]">
              <BrandWordmark hyphenClass="text-[#A54829]" />
            </span>
          </Link>

          {/* CENTER: Desktop Main Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-base font-medium text-[#1c1917]">
            {links.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              if (link.hasMegaMenu) {
                return (
                  <div key={link.href} className="relative group" onMouseEnter={() => setMegaMenuOpen(true)}>
                    <button
                      type="button"
                      onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                      className={`flex items-center gap-1.5 py-2 font-medium text-base transition-colors ${
                        isActive || megaMenuOpen ? 'text-[#A54829]' : 'text-[#1c1917] hover:text-[#A54829]'
                      }`}
                      aria-expanded={megaMenuOpen}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-[#A54829]' : 'text-[#57534e]'}`}
                      />
                    </button>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#A54829] rounded-full" />
                    )}
                  </div>
                );
              }

              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={`py-2 font-medium text-base transition-colors ${
                      isActive ? 'text-[#A54829]' : 'text-[#1c1917] hover:text-[#A54829]'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#A54829] rounded-full" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT: Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Search Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-xl text-[#1c1917] hover:text-[#A54829] hover:bg-[#F4F0E5] transition flex items-center justify-center relative"
                aria-label="Rechercher des produits"
                aria-expanded={searchOpen}
                aria-controls="product-search-panel"
              >
                <Search size={20} />
                <span className="absolute top-1 right-1 text-[9px] font-extrabold text-[#57534e] bg-[#F4F0E5] px-1 rounded border border-[#E7E0D3] pointer-events-none">
                  ⌘K
                </span>
              </button>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#123524] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                Rechercher <kbd className="text-[9px] bg-white/20 px-1 rounded ml-1">⌘K</kbd>
              </span>
            </div>

            {/* Favorites Button */}
            <div className="relative group">
              <Link
                href="/produits"
                className="relative p-2.5 rounded-xl text-[#1c1917] hover:text-[#A54829] hover:bg-[#F4F0E5] transition flex items-center justify-center"
                aria-label="Mes favoris"
              >
                <Heart size={20} />
              </Link>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#123524] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                Favoris
              </span>
            </div>

            {/* Cart Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(!cartOpen);
                  setAccountOpen(false);
                  setMegaMenuOpen(false);
                }}
                className="relative p-2.5 rounded-xl text-[#1c1917] hover:text-[#A54829] hover:bg-[#F4F0E5] transition flex items-center justify-center"
                aria-label={
                  totalCartItemsCount > 0
                    ? `Panier, ${totalCartItemsCount} article${totalCartItemsCount > 1 ? 's' : ''}`
                    : 'Panier vide'
                }
              >
                <ShoppingCart size={20} />
                {totalCartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#A54829] px-1 text-[11px] font-black text-white ring-2 ring-white shadow-sm">
                    {totalCartItemsCount}
                  </span>
                )}
              </button>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#123524] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                {cartTooltip}
              </span>
            </div>

            {/* Account Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(!accountOpen);
                  setCartOpen(false);
                  setMegaMenuOpen(false);
                }}
                className="relative p-2.5 rounded-xl text-[#1c1917] hover:text-[#A54829] hover:bg-[#F4F0E5] transition flex items-center justify-center"
                aria-label="Espace compte client"
              >
                <CircleUserRound size={21} />
                {user && (
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
                )}
              </button>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#123524] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                {accountTooltip}
              </span>
            </div>

            {/* CTA Devis Button in Vert forêt (#123524) with white text */}
            <Link
              href="/devis"
              className="ml-1 rounded-full bg-[#123524] px-5 py-2.5 text-white transition hover:bg-[#1b4d35] font-bold text-sm shadow-md"
            >
              Demander un devis
            </Link>
          </div>

          {/* MOBILE RIGHT ACTIONS (< 768px) */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-xl text-[#1c1917] hover:bg-[#F4F0E5] transition"
              aria-label="Recherche"
              aria-expanded={searchOpen}
              aria-controls="product-search-panel"
            >
              <Search size={20} />
            </button>

            <Link
              href="/produits"
              className="relative p-2 rounded-xl text-[#1c1917] hover:bg-[#F4F0E5] transition"
              aria-label="Mes favoris"
            >
              <Heart size={20} />
            </Link>

            <button
              type="button"
              onClick={() => {
                setCartOpen(!cartOpen);
                setAccountOpen(false);
              }}
              className="relative p-2 rounded-xl text-[#1c1917] hover:bg-[#F4F0E5] transition"
              aria-label="Voir le panier"
            >
              <ShoppingCart size={20} />
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#A54829] px-1 text-[10px] font-black text-white shadow-sm">
                  {totalCartItemsCount}
                </span>
              )}
            </button>

            <Link
              href="/compte"
              className="relative p-2 rounded-xl text-[#1c1917] hover:bg-[#F4F0E5] transition"
              aria-label="Mon compte"
            >
              <CircleUserRound size={21} />
              {user && (
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#1c1917] hover:bg-[#F4F0E5] transition"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MEGA MENU PRODUITS */}
        {megaMenuOpen && (
          <div
            className="hidden md:block absolute top-full left-0 right-0 bg-white border-b border-[#E7E0D3] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
              <div className="col-span-4 relative rounded-2xl overflow-hidden shadow-md flex flex-col justify-between p-6 text-white min-h-[240px] group bg-[#123524]">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

                <div className="relative z-10">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#A54829] text-[11px] font-bold uppercase tracking-wider text-white mb-2">
                    Bren-nholz Qualité
                  </span>
                  <p className="text-lg font-bold leading-snug text-white drop-shadow-sm">
                    Du bois de qualité pour un chauffage naturel et durable.
                  </p>
                </div>

                <Link
                  href="/produits"
                  onClick={() => setMegaMenuOpen(false)}
                  className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-[#F4F0E5] hover:text-white transition mt-4"
                >
                  <span>Voir tous les produits</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="col-span-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#123524] border-b border-[#E7E0D3] pb-2">
                  Bois de chauffage
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      href="/produits/categorie/bois-de-chauffage"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#A54829] font-medium transition"
                    >
                      <span>Bûches de chêne & hêtre</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#A54829]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits/categorie/granules-de-bois"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#A54829] font-medium transition"
                    >
                      <span>Granulés / Pellets DIN+</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#A54829]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits/categorie/briquettes-de-bois"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#A54829] font-medium transition"
                    >
                      <span>Bois compressé & Briquettes</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#A54829]" />
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-span-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#123524] border-b border-[#E7E0D3] pb-2">
                  Guides & Conseils
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      href="/guide-granules"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#A54829] font-medium transition"
                    >
                      <span className="font-semibold text-[#1c1917]">Guide de sélection des granulés</span>
                      <ArrowRight size={14} className="text-[#A54829]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits/categorie/bois-allumage"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#A54829] font-medium transition"
                    >
                      <span>Allume-feu naturel & Accessoires</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#A54829]" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT DROPDOWN */}
        {accountOpen && (
          <div className="absolute top-full right-4 sm:right-16 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#E7E0D3] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            {user ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-[#E7E0D3]">
                  <div className="w-10 h-10 rounded-full bg-[#F4F0E5] text-[#A54829] font-black flex items-center justify-center text-base border border-[#E7E0D3] shrink-0">
                    {user.email?.[0].toUpperCase() ?? 'A'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-[#1c1917] text-sm truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client'}
                    </p>
                    <p className="text-xs text-[#57534e] truncate">{user.email}</p>
                  </div>
                </div>

                <div className="py-2 space-y-1 text-sm text-[#1c1917]">
                  <Link href="/panier" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F4F0E5] hover:text-[#A54829] font-medium transition"><ShoppingCart size={16} /><span>Mon panier ({itemCount})</span><ArrowRight size={14} className="ml-auto text-gray-400" /></Link>
                  <Link href="/compte" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F4F0E5] hover:text-[#A54829] font-medium transition"><User size={16} /><span>Mon profil</span><ArrowRight size={14} className="ml-auto text-gray-400" /></Link>
                  <Link href="/compte" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F4F0E5] hover:text-[#A54829] font-medium transition"><ShoppingBag size={16} /><span>Mes commandes</span><ArrowRight size={14} className="ml-auto text-gray-400" /></Link>
                </div>

                <hr className="my-1 border-[#E7E0D3]" />

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
                <div className="text-center pb-2 border-b border-[#E7E0D3]">
                  <p className="font-bold text-[#1c1917] text-base">Espace Client</p>
                  <p className="text-xs text-[#57534e] mt-0.5">Connectez-vous pour suivre vos commandes & devis</p>
                </div>

                <Link
                  href="/compte?mode=signin"
                  onClick={() => setAccountOpen(false)}
                  className="w-full bg-[#123524] hover:bg-[#1b4d35] text-white font-bold py-2.5 px-4 rounded-xl text-center block text-sm shadow-md transition"
                >
                  Se connecter
                </Link>

                <Link
                  href="/compte?mode=signup"
                  onClick={() => setAccountOpen(false)}
                  className="w-full bg-[#F4F0E5] hover:bg-[#e7e0d3] text-[#1c1917] font-semibold py-2.5 px-4 rounded-xl text-center block text-sm transition"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        )}

        {/* MINI PANIER DROPDOWN */}
        {cartOpen && (
          <div className="absolute top-full right-2 sm:right-12 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E7E0D3] p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3]">
              <h3 className="font-bold text-[#1c1917] text-base">
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

            <div className="py-3 space-y-3 max-h-60 overflow-y-auto">
              {displayCartItems.length > 0 ? (
                displayCartItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#F4F0E5] text-[#A54829] flex items-center justify-center font-bold text-xs shrink-0">
                        {item.quantity}×
                      </span>
                      <span className="font-semibold text-[#1c1917] line-clamp-1">{item.title}</span>
                    </div>
                    <span className="font-bold text-[#1c1917] shrink-0">
                      {item.price.includes('€') ? item.price : item.price === 'Sur devis' ? item.price : `${item.price} €`}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm font-medium text-[#57534e]">
                  Votre panier est vide.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7E0D3] space-y-3">
              {displayCartItems.length > 0 && (
                <div className="flex items-center justify-between font-bold text-base text-[#1c1917]">
                  <span>Total</span>
                  <span className="text-[#A54829] text-lg">{totalCartPrice} €</span>
                </div>
              )}

              <Link
                href="/panier"
                onClick={() => setCartOpen(false)}
                className="w-full bg-[#123524] hover:bg-[#1b4d35] text-white font-bold py-3 px-4 rounded-xl text-center block transition shadow-md text-sm"
              >
                Voir mon panier →
              </Link>
            </div>
          </div>
        )}

        {/* SEARCH OVERLAY */}
        {searchOpen && (
          <div id="product-search-panel" className="absolute top-full left-0 right-0 bg-white border-b border-[#E7E0D3] shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des produits (ex: bûches de chêne, granulés, allume-feu...)"
                aria-label="Nom du produit à rechercher"
                autoFocus
                className="w-full text-sm font-medium text-[#1c1917] bg-transparent border-0 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#123524] text-white font-bold rounded-xl text-xs hover:bg-[#1b4d35] transition shrink-0"
              >
                Chercher
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Fermer la recherche"
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg shrink-0"
              >
                <X size={20} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#123524] text-white flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Bren-nholz — Leylines Park, accueil"
                className="flex items-center gap-2.5 font-black text-xl tracking-tight text-white"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#A54829] text-white shadow-md">
                  <Flame size={20} strokeWidth={2.2} fill="currentColor" />
                </span>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  <BrandWordmark hyphenClass="text-[#A54829]" />
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

            <nav className="py-6 space-y-2 text-lg font-bold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/' ? 'text-[#F4F0E5] bg-white/10' : 'text-stone-200 hover:text-white'
                }`}
              >
                Accueil
              </Link>

              <div>
                <button
                  type="button"
                  onClick={() => setMobileProduitsOpen(!mobileProduitsOpen)}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-stone-200 hover:text-white transition"
                >
                  <span>Produits</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${mobileProduitsOpen ? 'rotate-180 text-[#F4F0E5]' : ''}`}
                  />
                </button>

                {mobileProduitsOpen && (
                  <div className="ml-4 pl-4 border-l border-white/10 space-y-3 py-2 text-sm font-medium text-stone-300">
                    <Link
                      href="/produits/categorie/bois-de-chauffage"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-white py-1"
                    >
                      Bûches de chauffage
                    </Link>
                    <Link
                      href="/produits/categorie/granules-de-bois"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-white py-1"
                    >
                      Granulés & Pellets DIN+
                    </Link>
                    <Link
                      href="/produits/categorie/briquettes-de-bois"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-white py-1"
                    >
                      Bois compressé
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/guide-granules"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/guide-granules' ? 'text-[#F4F0E5] bg-white/10' : 'text-stone-200 hover:text-white'
                }`}
              >
                Guide Pellets
              </Link>

              <Link
                href="/a-propos"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/a-propos' ? 'text-[#F4F0E5] bg-white/10' : 'text-stone-200 hover:text-white'
                }`}
              >
                À propos
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 rounded-xl transition ${
                  pathname === '/contact' ? 'text-[#F4F0E5] bg-white/10' : 'text-stone-200 hover:text-white'
                }`}
              >
                Contact
              </Link>

              <hr className="my-4 border-white/10" />

              <Link
                href="/devis"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-3.5 px-4 rounded-xl bg-[#A54829] font-extrabold text-white text-base shadow-md"
              >
                Demander un devis
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  ), brenLocale);
}
