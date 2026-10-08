'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Role = 'admin' | 'super_admin' | null;

export default function RoleAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [access, setAccess] = useState<{ userId: string; role: Role } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
    let active = true;
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
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
    if (!supabase || !sessionReady || !user) return;
    let active = true;
    setAccess(null);
    setError('');
    void supabase.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle()
      .then(({ data, error: roleError }) => {
        if (!active) return;
        if (roleError) setError('Impossible de vérifier votre rôle. Veuillez réessayer.');
        else setAccess({ userId: user.id, role: data?.role === 'admin' || data?.role === 'super_admin' ? data.role : null });
      });
    return () => { active = false; };
  }, [sessionReady, user, pathname, retry]);

  const verified = sessionReady && (!user || access?.userId === user.id);
  const role = user && access?.userId === user.id ? access.role : null;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isSuperAdminPage = pathname === '/super-admin' || pathname.startsWith('/super-admin/');
  const destination = role === 'super_admin'
    ? (isAdminPage || isSuperAdminPage ? null : '/super-admin')
    : role === 'admin' ? (isAdminPage ? null : '/admin') : null;

  useEffect(() => {
    if (verified && destination) router.replace(destination);
  }, [verified, destination, router]);

  if (error) return <main className="min-h-[70vh] p-8 text-center">
    <p role="alert">{error}</p>
    <button type="button" onClick={() => { setError(''); setRetry((value) => value + 1); }} className="mt-4 rounded-lg bg-gray-950 px-5 py-3 font-bold text-white">Réessayer</button>
    <button type="button" onClick={() => void supabase?.auth.signOut()} className="ml-4 underline">Se déconnecter</button>
  </main>;
  if (!verified || destination) return <main className="min-h-[70vh] p-8 text-center" role="status">Vérification de votre accès…</main>;
  return children;
}
