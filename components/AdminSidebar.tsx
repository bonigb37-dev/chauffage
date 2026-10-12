'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Boxes,
  ChevronRight,
  Crown,
  Flame,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { SIMPLE_ADMIN_PATH, SUPER_ADMIN_PATH } from '@/components/RoleAccessGuard';

export type TabType = 'overview' | 'orders' | 'contacts' | 'support' | 'products' | 'analytics' | 'users' | 'audit';
export type Role = 'admin' | 'super_admin' | 'owner';

interface AdminSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: User | null;
  role: Role | null;
  isSuperOrOwner: boolean;
  ordersCount: number;
  contactsCount: number;
  unreadSupportCount?: number;
  isRefreshing: boolean;
  signingOut: boolean;
  onRefresh: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  user,
  role,
  isSuperOrOwner,
  ordersCount,
  contactsCount,
  unreadSupportCount = 0,
  isRefreshing,
  signingOut,
  onRefresh,
  onSignOut,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  // Navigation structure adhering strictly to specified Bren-holz items
  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'Vue d’ensemble',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'orders' as TabType,
      label: 'Commandes & Virements',
      icon: ShoppingBag,
      badge: ordersCount > 12 ? ordersCount : 12,
    },
    {
      id: 'support' as TabType,
      label: 'Support Client',
      icon: MessageSquare,
      badge: unreadSupportCount > 0 ? unreadSupportCount : null,
    },
    {
      id: 'contacts' as TabType,
      label: 'Messages & Devis',
      icon: Mail,
      badge: contactsCount > 0 ? contactsCount : null,
    },
    {
      id: 'products' as TabType,
      label: 'Catalogue & Stocks',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'analytics' as TabType,
      label: 'Statistiques Visiteurs',
      icon: BarChart3,
      badge: null,
    },
    ...(isSuperOrOwner
      ? [
          {
            id: 'users' as TabType,
            label: 'Utilisateurs & Accès',
            icon: Users,
            badge: null,
          },
          {
            id: 'audit' as TabType,
            label: 'Journal d’Audit',
            icon: ShieldCheck,
            badge: null,
          },
        ]
      : []),
  ];

  // User initials
  const userName = user?.user_metadata?.full_name || 'Mike Work';
  const userEmail = user?.email || 'mikework318@gmail.com';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'MW';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-[270px] bg-[#101820] text-white border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0 select-none overflow-hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation principale"
      >
        {/* Subtle Hearth / Fireplace ambient background glowing behind the lower section */}
        <div className="absolute -bottom-6 inset-x-0 h-80 pointer-events-none select-none overflow-hidden z-0">
          <Image
            src="/sidebar-fireplace.webp"
            alt=""
            width={680}
            height={600}
            className="w-full h-full object-cover object-bottom opacity-25 mix-blend-screen"
            priority={false}
          />
          {/* Smooth radial & linear dark gradient fade masks */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/75 to-[#101820]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#101820] via-transparent to-transparent opacity-90" />
        </div>

        {/* Scrollable Upper Section: Brand, Profile, Navigation */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {/* 1. Header: Bren-holz Brand */}
          <div className="flex items-center justify-between px-1">
            <Link
              href={isSuperOrOwner ? SUPER_ADMIN_PATH : SIMPLE_ADMIN_PATH}
              className="flex items-center gap-3 group focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]/60 rounded-xl p-1 -m-1"
              title="Console de Direction Bren-holz"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E65A00] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(255,107,0,0.3)] shrink-0 transition-transform duration-150 group-hover:scale-105">
                <Flame size={20} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-[17px] tracking-tight text-white block leading-tight">
                  Bren<span className="text-[#FF6B00]">-</span>holz
                </span>
                <span className="text-[11px] font-medium tracking-wide text-[#9AA4AF] block">
                  Console de Direction
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-[#9AA4AF] hover:text-white hover:bg-white/[0.08] focus:outline-hidden"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. Admin Profile Card */}
          <div className="rounded-xl bg-[#17212B] border border-white/[0.08] p-3 shadow-xs space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#22303E] text-white border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] text-[#9AA4AF] truncate font-mono mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>

            {/* Accreditation Badge */}
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
              <span className="text-[11px] font-medium text-[#9AA4AF]">Accréditation</span>
              {role === 'owner' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FF6B00]/15 text-[#FF9547] border border-[#FF6B00]/30 text-[11px] font-semibold shrink-0">
                  <Crown size={12} className="text-[#FF9547] stroke-[2]" /> Owner
                </span>
              ) : role === 'super_admin' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold shrink-0">
                  <ShieldCheck size={12} className="text-indigo-400 stroke-[2]" /> Super Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-300 border border-white/10 text-[11px] font-semibold shrink-0">
                  <Shield size={12} className="text-slate-400 stroke-[2]" /> Admin
                </span>
              )}
            </div>
          </div>

          {/* 3. Section NAVIGATION */}
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#9AA4AF]">
              NAVIGATION
            </p>
            <nav className="space-y-1" aria-label="Sections du tableau de bord">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]/60 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-white shadow-[0_2px_12px_rgba(255,107,0,0.25)]'
                        : 'text-[#9AA4AF] hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={18}
                        className={`shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-[#9AA4AF] group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold leading-none shrink-0 ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-[#FF6B00]/15 text-[#FF8533] border border-[#FF6B00]/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight size={14} className="text-white/80 shrink-0 stroke-[2.2]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 4. Bottom Area: Utilities & Branding Signature */}
        <div className="relative z-10 mt-auto px-4 pt-3 pb-4 border-t border-white/[0.08] space-y-2 bg-[#101820]/90 backdrop-blur-md">
          {/* Action Links */}
          <div className="space-y-0.5">

            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#9AA4AF] hover:text-white hover:bg-white/[0.05] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]/60 disabled:opacity-60 text-left"
            >
              <RefreshCw
                size={15}
                className={isRefreshing ? 'animate-spin text-[#FF6B00]' : 'text-[#9AA4AF]'}
              />
              <span>{isRefreshing ? 'Synchronisation…' : 'Actualiser'}</span>
            </button>

            <button
              type="button"
              onClick={() => void onSignOut()}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#9AA4AF] hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-500/40 disabled:opacity-60 text-left"
            >
              <LogOut size={15} className="text-[#9AA4AF] group-hover:text-rose-400" />
              <span>{signingOut ? 'Déconnexion…' : 'Déconnexion'}</span>
            </button>
          </div>

          {/* Bren-holz Signature Brand Card (As in mockup) */}
          <div className="rounded-xl bg-[#17212B]/90 border border-white/[0.08] p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#E65A00] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Flame size={14} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">Bren-holz</p>
                <p className="text-[10px] text-[#9AA4AF] truncate">Solutions bois & chaleur</p>
              </div>
            </div>
            <ChevronRight size={13} className="text-[#9AA4AF]/60 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
