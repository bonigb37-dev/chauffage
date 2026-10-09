'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { isPasswordRecoveryRedirect, supabase } from '@/lib/supabase';
import { incomingAuthLink, verifyIncomingAuthLink, clearEmailConfirmation } from '@/lib/auth-link';
import { getAdminRole, type AdminRole } from '@/lib/admin-access';
import { AccessContext } from '@/components/AccessContext';

type Role = AdminRole | null;

export default function RoleAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [access, setAccess] = useState<{ userId: string; role: Role } | null>(null);
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
      router.replace(result?.success ? recovery ? '/compte?mode=recovery' : '/compte?confirmed=1' : `/compte?mode=${recovery ? 'recovery' : 'confirm'}&linkError=${result?.expired ? 'expired' : 'invalid'}`);
      setAuthLinkReady(true);
    });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (pathname === '/compte' && (
      new URLSearchParams(window.location.search).get('mode') === 'recovery'
      || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
    )) setRecoveringPassword(true);
  }, [pathname]);

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
    let active = true;
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true);
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') setRecoveringPassword(false);
      if (event === 'SIGNED_OUT') clearEmailConfirmation();
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && new URLSearchParams(window.location.search).get('mode') === 'signin')) {
        setAuthLinkFailure(false);
        setRecoveringPassword(false);
      }
      setUser(session?.user ?? null);
      setSessionReady(true);
    });
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError('Impossible de vérifier votre session.');
      else setUser(data.session?.user ?? null);
      setSessionReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !sessionReady || !userId) return;
    let active = true;
    setAccess(null);
    setError('');
    void getAdminRole(supabase, userId)
      .then((role) => {
        if (!active) return;
        setAccess({ userId, role });
      }).catch(() => { if (active) setError('Impossible de vérifier votre rôle. Veuillez réessayer.'); });
    return () => { active = false; };
  }, [sessionReady, userId, retry]);

  const verified = sessionReady && (!user || access?.userId === user.id);
  const role = user && access?.userId === user.id ? access.role : null;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isSuperAdminPage = pathname === '/super-admin' || pathname.startsWith('/super-admin/');
  const destination = authLinkFailure ? null : recoveringPassword ? (pathname === '/compte' ? null : '/compte?mode=recovery') : role === 'super_admin' || role === 'owner'
    ? (isAdminPage || isSuperAdminPage ? null : '/super-admin')
    : role === 'admin' ? (isAdminPage ? null : '/admin') : null;

  useEffect(() => {
    if (authLinkReady && verified && destination) router.replace(destination);
  }, [authLinkReady, verified, destination, router]);

  // Public content must be rendered for visitors and crawlers before session checks finish.
  // Account, checkout and administration retain the existing access checks.
  const requiresSessionCheck = isAdminPage || isSuperAdminPage || pathname === '/compte'
    || pathname === '/panier' || pathname === '/commande' || pathname.startsWith('/commande/');
  const content = <AccessContext.Provider value={{ user, role, verified: verified && !error }}>{children}</AccessContext.Provider>;
  if (!requiresSessionCheck && authLinkReady && !destination) return content;

  if (error) return <main className="min-h-[70vh] p-8 text-center">
    <p role="alert">{error}</p>
    <button type="button" onClick={() => { setError(''); setRetry((value) => value + 1); }} className="mt-4 rounded-lg bg-gray-950 px-5 py-3 font-bold text-white">Réessayer</button>
    <button type="button" onClick={() => void supabase?.auth.signOut()} className="ml-4 underline">Se déconnecter</button>
  </main>;
  if (!authLinkReady || !verified || destination) return <main className="min-h-[70vh] p-8 text-center" role="status">Vérification de votre accès…</main>;
  return content;
}
