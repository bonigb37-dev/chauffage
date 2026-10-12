'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { User } from '@supabase/supabase-js';
import { isPasswordRecoveryRedirect, supabase } from '@/lib/supabase';
import { incomingAuthLink, verifyIncomingAuthLink, clearEmailConfirmation } from '@/lib/auth-link';
import { getAdminRole, type AdminRole } from '@/lib/admin-access';
import { AccessContext } from '@/components/AccessContext';
import { Flame } from 'lucide-react';

export type { AdminRole };
export type Role = AdminRole | null;

const CACHE_KEY = 'bren_admin_session_role';

export const ADMIN_BASE_PATH = '/bren-gate-9f4a';
export const SUPER_ADMIN_PATH = '/bren-gate-9f4a/exec';
export const SIMPLE_ADMIN_PATH = '/bren-gate-9f4a';

export function isAdministrationPath(pathname: string): boolean {
  return (
    pathname === ADMIN_BASE_PATH ||
    pathname.startsWith(ADMIN_BASE_PATH + '/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/super-admin' ||
    pathname.startsWith('/super-admin/')
  );
}

export function getCachedRole(userId?: string): Role {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (userId && parsed?.userId !== userId) return null;
    const r = parsed?.role;
    if (r === 'admin' || r === 'super_admin' || r === 'owner') return r;
  } catch {
    // Ignore storage issues
  }
  return null;
}

export function setCachedRole(userId: string, role: Role) {
  if (typeof window === 'undefined') return;
  try {
    if (role) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, role }));
    } else {
      window.localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

export function clearCachedRole() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore storage issues
  }
}

export default function RoleAccessGuard({ children }: { children: ReactNode }) {
  const brenLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [access, setAccess] = useState<{ userId: string; role: Role } | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = getCachedRole();
      if (cached) {
        return { userId: '', role: cached };
      }
    }
    return null;
  });
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [recoveringPassword, setRecoveringPassword] = useState(isPasswordRecoveryRedirect);
  const userId = user?.id;
  const [authLinkReady, setAuthLinkReady] = useState(!incomingAuthLink?.kind);
  const [authLinkFailure, setAuthLinkFailure] = useState(false);

  useEffect(() => {
    if (!incomingAuthLink?.kind) return;
    let active = true;
    const verification = supabase ? verifyIncomingAuthLink(supabase) : null;
    void Promise.resolve(verification).then((result) => {
      if (!active) return;
      const recovery = result?.recovery ?? isPasswordRecoveryRedirect;
      setRecoveringPassword(recovery);
      setAuthLinkFailure(!result?.success);
      router.replace(
        result?.success
          ? recovery
            ? '/compte?mode=recovery'
            : '/compte?confirmed=1'
          : `/compte?mode=${recovery ? 'recovery' : 'confirm'}&linkError=${result?.expired ? 'expired' : 'invalid'}`
      );
      setAuthLinkReady(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (
      pathname === '/compte' &&
      (new URLSearchParams(window.location.search).get('mode') === 'recovery' ||
        new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery')
    ) {
      setRecoveringPassword(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!supabase) {
      setSessionReady(true);
      return;
    }
    let active = true;
    const client = supabase;

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true);
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') setRecoveringPassword(false);
      if (event === 'SIGNED_OUT') {
        clearEmailConfirmation();
        clearCachedRole();
        setAccess(null);
      }
      if (
        event === 'SIGNED_OUT' ||
        (event === 'SIGNED_IN' && new URLSearchParams(window.location.search).get('mode') === 'signin')
      ) {
        setAuthLinkFailure(false);
        setRecoveringPassword(false);
      }
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser && event !== 'SIGNED_OUT') {
        const cachedRole = getCachedRole(currentUser.id);
        if (cachedRole) {
          setAccess({ userId: currentUser.id, role: cachedRole });
        }
      }
      setSessionReady(true);
    });

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError('Impossible de vérifier votre session.');
      } else {
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const cachedRole = getCachedRole(currentUser.id);
          if (cachedRole) {
            setAccess({ userId: currentUser.id, role: cachedRole });
          }
        } else {
          clearCachedRole();
          setAccess(null);
        }
      }
      setSessionReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !sessionReady || !userId) {
      if (sessionReady && !userId) {
        setAccess(null);
      }
      return;
    }
    let active = true;
    setError('');

    void getAdminRole(supabase, userId)
      .then((role) => {
        if (!active) return;
        setCachedRole(userId, role);
        setAccess({ userId, role });
      })
      .catch(() => {
        if (active) setError('Impossible de vérifier votre rôle. Veuillez réessayer.');
      });

    return () => {
      active = false;
    };
  }, [sessionReady, userId, retry]);

  const verified = sessionReady && (!user || access?.userId === user.id || access?.role !== undefined);
  const role = user ? (access?.userId === user.id ? access.role : access?.role ?? null) : null;

  const isSuperAdminPage = pathname === SUPER_ADMIN_PATH || pathname.startsWith(SUPER_ADMIN_PATH + '/');
  const isAdminWorkspace = isAdministrationPath(pathname);
  const isSimpleAdminPage = isAdminWorkspace && !isSuperAdminPage;

  // Strict redirection rule:
  // Admins never access public storefront pages.
  // super_admin / owner -> SUPER_ADMIN_PATH (/bren-gate-9f4a/exec)
  // simple admin -> SIMPLE_ADMIN_PATH (/bren-gate-9f4a)
  const destination = authLinkFailure
    ? null
    : recoveringPassword
    ? pathname === '/compte'
      ? null
      : '/compte?mode=recovery'
    : role === 'owner' || role === 'super_admin'
    ? isAdminWorkspace
      ? null
      : SUPER_ADMIN_PATH
    : role === 'admin'
    ? isSimpleAdminPage
      ? null
      : SIMPLE_ADMIN_PATH
    : null;

  useEffect(() => {
    if (authLinkReady && verified && destination) {
      router.replace(destination);
    }
  }, [authLinkReady, verified, destination, router]);

  // Public content must be rendered for visitors and crawlers before session checks finish.
  // Account, checkout and administration retain strict session checks.
  const requiresSessionCheck =
    isAdminWorkspace ||
    pathname === '/compte' ||
    pathname === '/panier' ||
    pathname === '/commande' ||
    pathname.startsWith('/commande/');

  const content = (
    <AccessContext.Provider value={{ user, role, verified: verified && !error }}>
      {children}
    </AccessContext.Provider>
  );

  if (!requiresSessionCheck && authLinkReady && !destination) return content;

  if (error) {
    return localizeNode(
      <main className="min-h-screen bg-[#101820] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full rounded-2xl bg-[#17212B] border border-white/10 p-6 shadow-xl">
          <p role="alert" className="text-red-400 font-semibold text-sm mb-4">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError('');
                setRetry((value) => value + 1);
              }}
              className="w-full sm:w-auto rounded-xl bg-[#FF6B00] hover:bg-[#E65A00] px-5 py-2.5 font-bold text-white text-xs transition shadow-md shadow-orange-500/20"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => {
                clearCachedRole();
                void supabase?.auth.signOut();
              }}
              className="w-full sm:w-auto rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 font-medium text-zinc-300 hover:text-white text-xs transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </main>,
      brenLocale
    );
  }

  if (!authLinkReady || !verified || destination) {
    return localizeNode(
      <main
        className="min-h-screen bg-[#101820] text-white flex flex-col items-center justify-center p-6 select-none"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#E65A00] flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
            <Flame size={24} className="text-white" strokeWidth={2.4} />
          </div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-[#FF8533]">
            Bren-nholz Direction
          </p>
          <p className="text-sm font-medium text-zinc-400">
            Vérification de vos accès sécurisés…
          </p>
        </div>
      </main>,
      brenLocale
    );
  }

  return content;
}
