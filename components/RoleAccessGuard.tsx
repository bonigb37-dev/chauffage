'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type AdminRole = 'admin' | 'super_admin' | 'owner';
export type Role = AdminRole | null;

const CACHE_KEY = 'bren_admin_session_role';

export const ADMIN_BASE_PATH = '/bren-gate-9f4a';
export const SUPER_ADMIN_PATH = '/bren-gate-9f4a/exec';
export const SIMPLE_ADMIN_PATH = '/bren-gate-9f4a';

export function isAdministrationPath(pathname: string): boolean {
  return pathname === ADMIN_BASE_PATH || pathname.startsWith(ADMIN_BASE_PATH + '/');
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

  useEffect(() => {
    if (!supabase) {
      setSessionReady(true);
      return;
    }
    let active = true;
    const client = supabase;

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser || event === 'SIGNED_OUT') {
        clearCachedRole();
        setAccess(null);
      } else {
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
    if (!supabase || !sessionReady || !user) {
      if (sessionReady && !user) {
        setAccess(null);
      }
      return;
    }

    let active = true;
    setError('');

    void supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: roleError }) => {
        if (!active) return;
        if (roleError) {
          setError('Impossible de vérifier votre rôle. Veuillez réessayer.');
        } else {
          const r = data?.role;
          const verifiedRole: Role =
            r === 'admin' || r === 'super_admin' || r === 'owner' ? r : null;
          setCachedRole(user.id, verifiedRole);
          setAccess({ userId: user.id, role: verifiedRole });
        }
      });

    return () => {
      active = false;
    };
  }, [sessionReady, user, retry]);

  const verified = sessionReady && (!user || access?.userId === user.id || access?.role !== undefined);
  const role = user ? (access?.userId === user.id ? access.role : access?.role ?? null) : null;

  const isSuperAdminPage = pathname === SUPER_ADMIN_PATH || pathname.startsWith(SUPER_ADMIN_PATH + '/');
  const isAdminWorkspace = isAdministrationPath(pathname);
  const isSimpleAdminPage = isAdminWorkspace && !isSuperAdminPage;

  // super_admin and owner can ONLY access administration pages (/bren-gate-9f4a/exec or /bren-gate-9f4a)
  // simple admin can ONLY access /bren-gate-9f4a (NOT /bren-gate-9f4a/exec)
  const destination =
    role === 'owner' || role === 'super_admin'
      ? (isAdminWorkspace ? null : SUPER_ADMIN_PATH)
      : role === 'admin'
        ? (isSimpleAdminPage ? null : SIMPLE_ADMIN_PATH)
        : null;

  useEffect(() => {
    if (verified && destination) {
      router.replace(destination);
    }
  }, [verified, destination, router]);

  if (error) {
    return (
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
      </main>
    );
  }

  if (!verified || destination) {
    return (
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
            Bren-holz Direction
          </p>
          <p className="text-sm font-medium text-zinc-400">
            Vérification de vos accès sécurisés…
          </p>
        </div>
      </main>
    );
  }

  return children;
}
