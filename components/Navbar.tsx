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
  Eye,
  EyeOff,
  Flame,
  Heart,
  LogOut,
  Mail,
  Menu,
  Search,
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

  // Instant Auth Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function openAuthModal(mode: 'signin' | 'signup') {
    setAuthModalMode(mode);
    setAuthError('');
    setAuthNotice('');
    setAuthModalOpen(true);
    setAccountOpen(false);
    setMobileMenuOpen(false);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || authLoading) return;
    setAuthError('');
    setAuthNotice('');

    if (authModalMode === 'signup') {
      if (!authEmail.trim() || !authPassword) {
        setAuthError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      if (authPassword !== authConfirmPassword) {
        setAuthError('Les deux mots de passe ne correspondent pas.');
        return;
      }
      if (authPassword.length < 8) {
        setAuthError('Le mot de passe doit comporter au moins 8 caractères.');
        return;
      }
      setAuthLoading(true);
      try {
        const fullName = `${authFirstName.trim()} ${authLastName.trim()}`.trim();
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: { first_name: authFirstName.trim(), last_name: authLastName.trim(), full_name: fullName },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/compte?mode=confirm` : undefined,
          },
        });
        if (error) throw error;
        if (data.session) {
          setUser(data.session.user);
          setAuthModalOpen(false);
          router.refresh();
        } else {
          setAuthNotice('Inscription enregistrée ! Veuillez vérifier vos e-mails pour confirmer votre compte.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
        if (msg.toLowerCase().includes('user already registered')) {
          setAuthError('Un compte existe déjà avec cette adresse e-mail.');
        } else {
          setAuthError(msg);
        }
      } finally {
        setAuthLoading(false);
      }
    } else {
      if (!authEmail.trim() || !authPassword) {
        setAuthError('Veuillez saisir votre e-mail et votre mot de passe.');
        return;
      }
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        if (!data.user.email_confirmed_at) {
          setAuthError('Votre adresse e-mail n’est pas encore confirmée. Vérifiez vos e-mails.');
          return;
        }
        setUser(data.user);
        setAuthModalOpen(false);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Identifiants incorrects.';
        if (msg.toLowerCase().includes('invalid login credentials')) {
          setAuthError('Adresse e-mail ou mot de passe incorrect.');
        } else {
          setAuthError(msg);
        }
      } finally {
        setAuthLoading(false);
      }
    }
  }

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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
        setAccountOpen(false);
        setCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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

  const totalCartItemsCount = itemCount ?? 0;

  const displayCartItems = (items ?? []).slice(0, 3).map((line) => {
    const product = (products ?? []).find((p) => p.id === line.productId);
    return {
      title: product?.name ?? 'Produit',
      quantity: line.quantity,
      price: product?.price ?? 'Sur devis',
    };
  });

  const totalCartPrice = (items ?? [])
    .reduce((sum, line) => {
      const product = (products ?? []).find((p) => p.id === line.productId);
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
        className="bg-[#a33d1e] py-2 px-4 text-center text-xs sm:text-sm font-bold text-white shadow-inner z-50 relative flex items-center justify-center gap-2"
      >
        <Truck size={17} className="shrink-0 text-white" />
        <span>Livraison en Allemagne · Aucun frais supplémentaire à régler au transporteur</span>
      </div>

      {/* Main Sticky Navbar */}
      <header
        ref={navRef}
        className={`sticky top-0 z-50 bg-[#fdfbf7] transition-all duration-200 border-b border-[#e8decb] ${
          isScrolled ? 'shadow-md py-2.5' : 'py-3.5 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* LEFT: Logo Bren-nholz */}
          <Link
            href="/"
            aria-label="Brennholz-direk — Leylines Park, accueil"
            className="flex items-center gap-1.5 sm:gap-2.5 font-black text-sm sm:text-xl tracking-tight text-[#1c1917] shrink-0 group"
          >
            <span className="grid h-7 w-7 sm:h-10 sm:w-10 place-items-center rounded-xl bg-[#a33d1e] text-white shadow-md shadow-[#a33d1e]/25 group-hover:bg-[#883015] transition-colors">
              <Flame size={22} strokeWidth={2.2} fill="currentColor" />
            </span>
            <span className="font-extrabold text-sm sm:text-xl tracking-tight text-[#1c1917]">
              <BrandWordmark hyphenClass="text-[#a33d1e]" />
            </span>
          </Link>

          {/* CENTER: Desktop Main Navigation */}
          <nav className="hidden xl:flex items-center gap-6 lg:gap-8 text-base font-medium text-[#1f2937]">
            {links.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              if (link.hasMegaMenu) {
                return (
                  <div key={link.href} className="relative group" onMouseEnter={() => setMegaMenuOpen(true)}>
                    <button
                      type="button"
                      onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                      className={`flex items-center gap-1.5 py-2 font-medium text-base transition-colors ${
                        isActive || megaMenuOpen ? 'text-[#a33d1e]' : 'text-[#1c1917] hover:text-[#a33d1e]'
                      }`}
                      aria-expanded={megaMenuOpen}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-[#a33d1e]' : 'text-[#57534e]'}`}
                      />
                    </button>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#a33d1e] rounded-full" />
                    )}
                  </div>
                );
              }

              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={`py-2 font-medium text-base transition-colors ${
                      isActive ? 'text-[#a33d1e]' : 'text-[#1c1917] hover:text-[#a33d1e]'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#a33d1e] rounded-full" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT: Desktop Actions */}
          <div className="hidden xl:flex items-center gap-2 lg:gap-3">
            {/* Search Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-xl text-[#1c1917] hover:text-[#a33d1e] hover:bg-[#f9f5ee] transition flex items-center justify-center relative"
                aria-label="Rechercher des produits"
                aria-expanded={searchOpen}
                aria-controls="product-search-panel"
              >
                <Search size={20} />
                <span className="absolute top-1 right-1 text-[9px] font-extrabold text-[#57534e] bg-[#f9f5ee] px-1 rounded border border-[#e8decb] pointer-events-none">
                  ⌘K
                </span>
              </button>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#a33d1e] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                Rechercher <kbd className="text-[9px] bg-white/20 px-1 rounded ml-1">⌘K</kbd>
              </span>
            </div>

            {/* Favorites Button */}
            <div className="relative group">
              <Link
                href="/produits"
                className="relative p-2.5 rounded-xl text-[#1c1917] hover:text-[#a33d1e] hover:bg-[#f9f5ee] transition flex items-center justify-center"
                aria-label="Mes favoris"
              >
                <Heart size={20} />
              </Link>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#a33d1e] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
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
                className="relative p-2.5 rounded-xl text-[#1c1917] hover:text-[#a33d1e] hover:bg-[#f9f5ee] transition flex items-center justify-center"
                aria-label={
                  totalCartItemsCount > 0
                    ? `Panier, ${totalCartItemsCount} article${totalCartItemsCount > 1 ? 's' : ''}`
                    : 'Panier vide'
                }
              >
                <ShoppingCart size={20} />
                {totalCartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#a33d1e] px-1 text-[11px] font-black text-white ring-2 ring-white shadow-sm">
                    {totalCartItemsCount}
                  </span>
                )}
              </button>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#a33d1e] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
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
                className="relative p-2.5 rounded-xl text-[#1c1917] hover:text-[#a33d1e] hover:bg-[#f9f5ee] transition flex items-center justify-center"
                aria-label="Espace compte client"
              >
                <CircleUserRound size={21} />
                {user && (
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-600 ring-2 ring-white" />
                )}
              </button>
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-bold text-white bg-[#a33d1e] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
                {accountTooltip}
              </span>
            </div>


          </div>

          {/* MOBILE RIGHT ACTIONS (reliable 44x44px touch targets) */}
          <div className="flex items-center gap-1 xl:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-[#1f2937] hover:bg-[#F5F7F8] active:bg-[#ECEEF0] transition"
              aria-label="Recherche"
              aria-expanded={searchOpen}
              aria-controls="product-search-panel"
            >
              <Search size={21} />
            </button>

            <Link
              href="/produits"
              className="relative w-11 h-11 flex items-center justify-center rounded-xl text-[#1f2937] hover:bg-[#F5F7F8] active:bg-[#ECEEF0] transition"
              aria-label="Mes favoris"
            >
              <Heart size={21} />
            </Link>

            <button
              type="button"
              onClick={() => {
                setCartOpen(!cartOpen);
                setAccountOpen(false);
              }}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl text-[#1f2937] hover:bg-[#F5F7F8] active:bg-[#ECEEF0] transition"
              aria-label="Voir le panier"
            >
              <ShoppingCart size={21} />
              {totalCartItemsCount > 0 && (
                <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#A33D1E] px-1 text-[10px] font-black text-white shadow-sm pointer-events-none">
                  {totalCartItemsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (user) {
                  setAccountOpen(!accountOpen);
                } else {
                  openAuthModal('signin');
                }
                setCartOpen(false);
                setSearchOpen(false);
                setMobileMenuOpen(false);
              }}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl text-[#1f2937] hover:bg-[#F5F7F8] active:bg-[#ECEEF0] transition"
              aria-label="Espace compte client"
            >
              <CircleUserRound size={22} />
              {user && (
                <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-[#1f2937] hover:bg-[#F5F7F8] active:bg-[#ECEEF0] transition"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MEGA MENU PRODUITS */}
        {megaMenuOpen && (
          <div
            className="hidden xl:block absolute top-full left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
              <div className="col-span-4 relative rounded-2xl overflow-hidden shadow-md flex flex-col justify-between p-6 text-white min-h-[240px] group bg-[#a33d1e]">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

                <div className="relative z-10">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#a33d1e] text-[11px] font-bold uppercase tracking-wider text-white mb-2">
                    Bren-nholz Qualité
                  </span>
                  <p className="text-lg font-bold leading-snug text-white drop-shadow-sm">
                    Du bois de qualité pour un chauffage naturel et durable.
                  </p>
                </div>

                <Link
                  href="/produits"
                  onClick={() => setMegaMenuOpen(false)}
                  className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-[#f9f5ee] hover:text-white transition mt-4"
                >
                  <span>Voir tous les produits</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="col-span-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#a33d1e] border-b border-[#e8decb] pb-2">
                  Bois de chauffage
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      href="/produits/categorie/bois-de-chauffage"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#a33d1e] font-medium transition"
                    >
                      <span>Bûches de chêne & hêtre</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#a33d1e]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits/categorie/granules-de-bois"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#a33d1e] font-medium transition"
                    >
                      <span>Granulés / Pellets DIN+</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#a33d1e]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits/categorie/briquettes-de-bois"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#a33d1e] font-medium transition"
                    >
                      <span>Bois compressé & Briquettes</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#a33d1e]" />
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-span-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#a33d1e] border-b border-[#e8decb] pb-2">
                  Guides & Conseils
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link
                      href="/guide-granules"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#a33d1e] font-medium transition"
                    >
                      <span className="font-semibold text-[#1c1917]">Guide de sélection des granulés</span>
                      <ArrowRight size={14} className="text-[#a33d1e]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/produits/categorie/bois-allumage"
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between text-[#57534e] hover:text-[#a33d1e] font-medium transition"
                    >
                      <span>Allume-feu naturel & Accessoires</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#a33d1e]" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT DROPDOWN */}
        {accountOpen && (
          <div className="absolute top-full right-4 sm:right-16 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#e8decb] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            {user ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-[#e8decb]">
                  <div className="w-10 h-10 rounded-full bg-[#f9f5ee] text-[#a33d1e] font-black flex items-center justify-center text-base border border-[#e8decb] shrink-0">
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
                  <Link href="/panier" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f9f5ee] hover:text-[#a33d1e] font-medium transition"><ShoppingCart size={16} /><span>Mon panier ({itemCount})</span><ArrowRight size={14} className="ml-auto text-gray-400" /></Link>
                  <Link href="/compte" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f9f5ee] hover:text-[#a33d1e] font-medium transition"><User size={16} /><span>Mon profil</span><ArrowRight size={14} className="ml-auto text-gray-400" /></Link>
                  <Link href="/compte" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f9f5ee] hover:text-[#a33d1e] font-medium transition"><ShoppingBag size={16} /><span>Mes commandes</span><ArrowRight size={14} className="ml-auto text-gray-400" /></Link>
                </div>

                <hr className="my-1 border-[#e8decb]" />

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
                <div className="text-center pb-2 border-b border-[#e8decb]">
                  <p className="font-bold text-[#1c1917] text-base">Espace Client</p>
                  <p className="text-xs text-[#57534e] mt-0.5">Connectez-vous pour suivre vos commandes & devis</p>
                </div>

                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="w-full bg-[#a33d1e] hover:bg-[#883015] text-white font-bold py-2.5 px-4 rounded-xl text-center block text-sm shadow-md transition"
                >
                  Se connecter
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="w-full bg-[#f9f5ee] hover:bg-[#e8decb] text-[#1c1917] font-semibold py-2.5 px-4 rounded-xl text-center block text-sm transition"
                >
                  Créer un compte
                </button>
              </div>
            )}
          </div>
        )}

        {/* MINI PANIER DROPDOWN */}
        {cartOpen && (
          <div className="absolute top-full right-2 sm:right-12 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#e8decb] p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8decb]">
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
                      <span className="w-8 h-8 rounded-lg bg-[#f9f5ee] text-[#a33d1e] flex items-center justify-center font-bold text-xs shrink-0">
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

            <div className="pt-3 border-t border-[#e8decb] space-y-3">
              {displayCartItems.length > 0 && (
                <div className="flex items-center justify-between font-bold text-base text-[#1c1917]">
                  <span>Total</span>
                  <span className="text-[#a33d1e] text-lg">{totalCartPrice} €</span>
                </div>
              )}

              <Link
                href="/panier"
                onClick={() => setCartOpen(false)}
                className="w-full bg-[#a33d1e] hover:bg-[#883015] text-white font-bold py-3 px-4 rounded-xl text-center block transition shadow-md text-sm"
              >
                Voir mon panier →
              </Link>
            </div>
          </div>
        )}

        {/* SEARCH OVERLAY */}
        {searchOpen && (
          <div id="product-search-panel" className="absolute top-full left-0 right-0 bg-white border-b border-[#e8decb] shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
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
                className="px-3.5 py-2 bg-[#a33d1e] text-white font-bold rounded-xl text-xs hover:bg-[#883015] transition shrink-0"
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
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] text-[#1C1917] flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#E6DCce]">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Brennholz-direk — Leylines Park, accueil"
                className="flex items-center gap-2.5 font-black text-xl tracking-tight text-[#1C1917]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#A33D1E] text-white shadow-md">
                  <Flame size={20} strokeWidth={2.2} fill="currentColor" />
                </span>
                <span className="font-extrabold text-xl tracking-tight text-[#1C1917]">
                  <BrandWordmark hyphenClass="text-[#A33D1E]" />
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-[#F4EDE4] text-[#1C1917] hover:bg-[#E6DCce] transition"
                aria-label="Fermer le menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="py-6 space-y-2 text-lg font-bold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-3 rounded-xl transition ${
                  pathname === '/' ? 'text-[#A33D1E] bg-[#F4EDE4]' : 'text-[#1C1917] hover:text-[#A33D1E]'
                }`}
              >
                Accueil
              </Link>

              <div>
                <button
                  type="button"
                  onClick={() => setMobileProduitsOpen(!mobileProduitsOpen)}
                  className="w-full flex items-center justify-between py-3 px-3 rounded-xl text-[#1C1917] hover:text-[#A33D1E] transition"
                >
                  <span>Produits</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${mobileProduitsOpen ? 'rotate-180 text-[#A33D1E]' : ''}`}
                  />
                </button>

                {mobileProduitsOpen && (
                  <div className="ml-4 pl-4 border-l border-[#E6DCce] space-y-3 py-2 text-sm font-medium text-[#6B5E55]">
                    <Link
                      href="/produits/categorie/bois-de-chauffage"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#A33D1E] py-1"
                    >
                      Bûches de chauffage
                    </Link>
                    <Link
                      href="/produits/categorie/granules-de-bois"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#A33D1E] py-1"
                    >
                      Granulés & Pellets DIN+
                    </Link>
                    <Link
                      href="/produits/categorie/briquettes-de-bois"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-[#A33D1E] py-1"
                    >
                      Bois compressé
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/guide-granules"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-3 rounded-xl transition ${
                  pathname === '/guide-granules' ? 'text-[#A33D1E] bg-[#F4EDE4]' : 'text-[#1C1917] hover:text-[#A33D1E]'
                }`}
              >
                Guide Pellets
              </Link>

              <Link
                href="/a-propos"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-3 rounded-xl transition ${
                  pathname === '/a-propos' ? 'text-[#A33D1E] bg-[#F4EDE4]' : 'text-[#1C1917] hover:text-[#A33D1E]'
                }`}
              >
                À propos
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-3 rounded-xl transition ${
                  pathname === '/contact' ? 'text-[#A33D1E] bg-[#F4EDE4]' : 'text-[#1C1917] hover:text-[#A33D1E]'
                }`}
              >
                Contact
              </Link>
            </nav>

            <div className="pt-6 border-t border-[#E6DCce] space-y-2.5">
              {user ? (
                <>
                  <Link
                    href="/compte"
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 bg-[#F4EDE4] hover:bg-[#E6DCce] text-[#1C1917] font-bold py-3 px-4 rounded-xl text-center text-sm transition"
                  >
                    <User size={16} />
                    <span>Mon compte</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 font-medium py-2.5 px-4 rounded-xl text-center text-sm transition"
                  >
                    <LogOut size={16} />
                    <span>Se déconnecter</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signin')}
                    className="w-full bg-[#A33D1E] hover:bg-[#883015] text-white font-bold py-3 px-4 rounded-xl text-center block text-sm shadow-md transition"
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="w-full bg-[#F4EDE4] hover:bg-[#E6DCce] text-[#1C1917] font-semibold py-3 px-4 rounded-xl text-center block text-sm transition"
                  >
                    Créer un compte
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* INSTANT AUTH MODAL (0ms response, zero page reload) */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 pt-5 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('signin'); setAuthError(''); setAuthNotice(''); }}
                  className={`pb-2 px-3 text-sm font-bold border-b-2 transition ${
                    authModalMode === 'signin'
                      ? 'border-[#a33d1e] text-[#a33d1e]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('signup'); setAuthError(''); setAuthNotice(''); }}
                  className={`pb-2 px-3 text-sm font-bold border-b-2 transition ${
                    authModalMode === 'signup'
                      ? 'border-[#a33d1e] text-[#a33d1e]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Créer un compte
                </button>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-stone-100 transition"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {authNotice}
                </div>
              )}
              {authError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {authError}
                </div>
              )}

              {authModalMode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      required
                      value={authFirstName}
                      onChange={(e) => setAuthFirstName(e.target.value)}
                      placeholder="Jean"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#a33d1e]/20 focus:border-[#a33d1e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={authLastName}
                      onChange={(e) => setAuthLastName(e.target.value)}
                      placeholder="Dupont"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#a33d1e]/20 focus:border-[#a33d1e]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Adresse e-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    autoComplete="email"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#a33d1e]/20 focus:border-[#a33d1e]"
                  />
                  <Mail size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Mot de passe</label>
                  {authModalMode === 'signin' && (
                    <Link
                      href="/compte?mode=forgot"
                      onClick={() => setAuthModalOpen(false)}
                      className="text-xs font-medium text-[#a33d1e] hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={authModalMode === 'signup' ? '8 caractères minimum' : '••••••••'}
                    autoComplete={authModalMode === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#a33d1e]/20 focus:border-[#a33d1e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authModalMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    required
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#a33d1e]/20 focus:border-[#a33d1e]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 bg-[#a33d1e] hover:bg-[#883015] text-white font-bold py-3 px-4 rounded-xl text-center block text-sm shadow-md transition disabled:opacity-50"
              >
                {authLoading ? 'Traitement en cours…' : authModalMode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
              </button>

              <div className="text-center pt-2">
                {authModalMode === 'signin' ? (
                  <p className="text-xs text-gray-500">
                    Vous n&apos;avez pas de compte ?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthModalMode('signup'); setAuthError(''); setAuthNotice(''); }}
                      className="font-bold text-[#a33d1e] hover:underline"
                    >
                      Créer un compte
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Vous avez déjà un compte ?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthModalMode('signin'); setAuthError(''); setAuthNotice(''); }}
                      className="font-bold text-[#a33d1e] hover:underline"
                    >
                      Se connecter
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  ), brenLocale);
}
