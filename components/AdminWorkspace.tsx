'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Role = 'admin' | 'super_admin';
type RequestStatus = 'new' | 'in_progress' | 'done';
type RoleRow = { user_id: string; role: Role; created_at: string };
type ContactRow = { id: number; created_at: string; name: string; email: string; phone: string | null; postal_code: string | null; subject: string; message: string; status: RequestStatus };
type OrderRow = { id: number; created_at: string; reference: string; customer: Record<string, unknown>; shipping: Record<string, unknown> | null; items: unknown; total_cents: number; status: RequestStatus };

const statusLabels: Record<RequestStatus, string> = { new: 'Nouvelle', in_progress: 'En cours', done: 'Terminée' };
const subjectLabels: Record<string, string> = { product: 'Information produit', quote: 'Devis', delivery: 'Livraison', order: 'Commande', claim: 'Réclamation', other: 'Autre' };
const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function text(value: unknown) { return typeof value === 'string' ? value : ''; }
function date(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }

function StatusSelect({ value, onChange, disabled }: { value: RequestStatus; onChange: (status: RequestStatus) => void; disabled: boolean }) {
  return <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as RequestStatus)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">
    {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
  </select>;
}

export default function AdminWorkspace({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [userId, setUserId] = useState('');
  const [newRole, setNewRole] = useState<Role>('admin');
  const [workingId, setWorkingId] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const loadData = useCallback(async (activeUser: User | null) => {
    if (!supabase) { setError('Supabase n’est pas configuré sur cette version du site.'); setLoading(false); return; }
    const currentUser = activeUser;
    if (!currentUser) { setLoading(false); return; }
    setError('');
    const roleResult = await supabase.from('admin_roles').select('role').eq('user_id', currentUser.id).maybeSingle();
    if (roleResult.error) {
      setError('Impossible de vérifier votre rôle. Exécutez supabase-admin.sql dans le SQL Editor Supabase.');
      setLoading(false);
      return;
    }
    const currentRole = roleResult.data?.role as Role | undefined;
    setRole(currentRole ?? null);
    if (!currentRole || (superAdminOnly && currentRole !== 'super_admin')) { setLoading(false); return; }

    if (superAdminOnly) {
      const roleList = await supabase.from('admin_roles').select('user_id, role, created_at').order('created_at', { ascending: true });
      if (roleList.error) setError('Impossible de charger la liste des rôles.');
      else setRoles((roleList.data ?? []) as RoleRow[]);
    } else {
      const [contactResult, orderResult] = await Promise.all([
        supabase.from('contact_requests').select('id, created_at, name, email, phone, postal_code, subject, message, status').order('created_at', { ascending: false }).limit(100),
        supabase.from('order_requests').select('id, created_at, reference, customer, shipping, items, total_cents, status').order('created_at', { ascending: false }).limit(100),
      ]);
      if (contactResult.error || orderResult.error) setError('Impossible de charger les demandes. Vérifiez les politiques RLS de supabase-admin.sql.');
      else {
        setContacts((contactResult.data ?? []) as ContactRow[]);
        setOrders((orderResult.data ?? []) as OrderRow[]);
      }
    }
    setLoading(false);
  }, [superAdminOnly]);

  useEffect(() => {
    if (!supabase) { setError('Supabase n’est pas configuré sur cette version du site.'); setLoading(false); return; }
    let active = true;
    const refresh = async (currentUser: User | null) => {
      if (!active) return;
      setUser(currentUser);
      if (currentUser) await loadData(currentUser);
      else { setRole(null); setLoading(false); }
    };
    supabase.auth.getSession().then(({ data }) => refresh(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void refresh(session?.user ?? null); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadData]);

  async function updateStatus(table: 'contact_requests' | 'order_requests', id: number, status: RequestStatus) {
    if (!supabase) return;
    const key = `${table}-${id}`;
    setWorkingId(key); setError(''); setNotice('');
    const { error: updateError } = await supabase.from(table).update({ status }).eq('id', id);
    if (updateError) setError('Le statut n’a pas pu être modifié. Vérifiez votre rôle et les règles RLS.');
    else {
      if (table === 'contact_requests') setContacts((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      else setOrders((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setNotice('Statut mis à jour.');
    }
    setWorkingId('');
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId.trim())) {
      setError('Saisissez un UUID utilisateur valide depuis Authentication → Users.'); return;
    }
    if (userId.trim() === user?.id && newRole !== 'super_admin') {
      setError('Pour éviter de perdre le dernier accès, vous ne pouvez pas réduire votre propre rôle ici.'); return;
    }
    setSavingRole(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('admin_roles').upsert({ user_id: userId.trim(), role: newRole }, { onConflict: 'user_id' });
    if (saveError) setError('Le rôle n’a pas pu être enregistré. Seul un super administrateur peut gérer les rôles.');
    else { setUserId(''); setNotice('Rôle enregistré.'); await loadData(user); }
    setSavingRole(false);
  }

  async function removeRole(targetId: string) {
    if (!supabase || targetId === user?.id || !window.confirm('Retirer les droits administrateur de cet utilisateur ?')) return;
    setWorkingId(targetId); setError(''); setNotice('');
    const { error: removeError } = await supabase.from('admin_roles').delete().eq('user_id', targetId);
    if (removeError) setError('Impossible de retirer ce rôle.');
    else { setRoles((items) => items.filter((item) => item.user_id !== targetId)); setNotice('Rôle retiré.'); }
    setWorkingId('');
  }

  const canSeeWorkspace = role === 'admin' || role === 'super_admin';
  const canSeeSuperAdmin = role === 'super_admin';

  return <main className="min-h-[70vh] bg-[#fffaf5] py-10 sm:py-14">
    <div className="container max-w-6xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600"><ArrowLeft size={16}/> Retour à la boutique</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-[.18em] text-orange-600">ThermoPro · administration</p><h1 className="mt-2 text-3xl font-black text-gray-950 sm:text-4xl">{superAdminOnly ? 'Super administration' : 'Espace administrateur'}</h1></div>
        {user && <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-gray-600">{user.email} · {role === 'super_admin' ? 'Super admin' : role === 'admin' ? 'Admin' : 'Accès standard'}</div>}
      </div>

      {loading ? <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white p-8 text-gray-600"><LoaderCircle className="animate-spin"/> Vérification de l’accès…</div>
        : !user ? <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-8"><h2 className="text-xl font-bold">Connexion requise</h2><p className="mt-2 text-gray-600">Connectez-vous avec votre compte administrateur pour continuer.</p><Link href="/compte" className="mt-5 inline-flex rounded-xl bg-orange-600 px-5 py-3 font-bold text-white">Se connecter</Link></section>
          : superAdminOnly && !canSeeSuperAdmin ? <section className="mt-8 rounded-2xl border border-red-200 bg-white p-8"><h2 className="text-xl font-bold text-red-800">Accès super administrateur requis</h2><p className="mt-2 text-gray-600">Votre compte ne possède pas le rôle super_admin.</p><Link href="/admin" className="mt-5 inline-flex rounded-xl bg-gray-950 px-5 py-3 font-bold text-white">Ouvrir l’administration</Link></section>
            : !canSeeWorkspace ? <section className="mt-8 rounded-2xl border border-red-200 bg-white p-8"><h2 className="text-xl font-bold text-red-800">Accès administrateur requis</h2><p className="mt-2 text-gray-600">Ce compte n’a pas de rôle administrateur.</p></section>
              : superAdminOnly ? <SuperAdminPanel roles={roles} userId={user.id} newRole={newRole} setNewRole={setNewRole} targetUserId={userId} setTargetUserId={setUserId} onSubmit={saveRole} onRemove={removeRole} saving={savingRole} workingId={workingId} />
                : <AdminPanel contacts={contacts} orders={orders} workingId={workingId} onStatusChange={updateStatus} />}

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{notice}</p>}
      {canSeeSuperAdmin && !superAdminOnly && <Link href="/super-admin" className="mt-6 inline-flex items-center gap-2 font-bold text-orange-700 hover:text-orange-900"><ShieldCheck size={18}/> Ouvrir la super administration</Link>}
      <button type="button" onClick={() => void loadData(user)} className="mt-8 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><RefreshCw size={15}/> Actualiser les données</button>
    </div>
  </main>;
}

function AdminPanel({ contacts, orders, workingId, onStatusChange }: { contacts: ContactRow[]; orders: OrderRow[]; workingId: string; onStatusChange: (table: 'contact_requests' | 'order_requests', id: number, status: RequestStatus) => void }) {
  return <>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {[['Demandes de contact', contacts.length], ['Demandes de commande', orders.length], ['À traiter', contacts.filter((item) => item.status !== 'done').length + orders.filter((item) => item.status !== 'done').length]].map(([label, count]) => <article key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-2 text-3xl font-black text-gray-950">{count}</p></article>)}
    </div>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Demandes de commande</h2>
      {orders.length === 0 ? <p className="mt-4 text-gray-500">Aucune demande de commande pour le moment.</p> : <div className="mt-5 space-y-4">{orders.map((order) => {
        const customer = order.customer ?? {};
        const items = Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : [];
        return <article key={order.id} className="rounded-xl border border-stone-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{order.reference}</p><p className="mt-1 text-sm text-gray-500">{date(order.created_at)}</p></div><StatusSelect value={order.status} disabled={workingId === `order_requests-${order.id}`} onChange={(status) => void onStatusChange('order_requests', order.id, status)} /></div>
          <p className="mt-3 font-semibold">{text(customer.firstName)} {text(customer.lastName)} · <a href={`mailto:${text(customer.email)}`} className="text-orange-700 underline">{text(customer.email)}</a></p>
          <div className="mt-3 grid gap-4 text-sm text-gray-600 sm:grid-cols-2"><p><b className="text-gray-800">Facturation :</b><br/>{text(customer.street)} {text(customer.addressLine2)}<br/>{text(customer.postalCode)} {text(customer.city)} {text(customer.state)}</p>{order.shipping && <p><b className="text-gray-800">Livraison :</b><br/>{text(order.shipping.street)} {text(order.shipping.addressLine2)}<br/>{text(order.shipping.postalCode)} {text(order.shipping.city)} {text(order.shipping.state)}</p>}</div>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">{items.map((item, index) => <li key={`${order.id}-${index}`}>{text(item.name)} × {Number(item.quantity) || 0}</li>)}</ul>
          <p className="mt-3 text-sm font-bold text-gray-900">Sous-total indicatif : {euros.format(order.total_cents / 100)} · livraison à confirmer</p>
        </article>;
      })}</div>}
    </section>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Demandes de contact</h2>
      {contacts.length === 0 ? <p className="mt-4 text-gray-500">Aucune demande de contact pour le moment.</p> : <div className="mt-5 space-y-4">{contacts.map((item) => <article key={item.id} className="rounded-xl border border-stone-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{item.name} · {subjectLabels[item.subject] ?? item.subject}</p><p className="mt-1 text-sm text-gray-500">{date(item.created_at)} · <a className="text-orange-700 underline" href={`mailto:${item.email}`}>{item.email}</a>{item.phone ? ` · ${item.phone}` : ''}{item.postal_code ? ` · ${item.postal_code}` : ''}</p></div><StatusSelect value={item.status} disabled={workingId === `contact_requests-${item.id}`} onChange={(status) => void onStatusChange('contact_requests', item.id, status)} /></div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.message}</p>
      </article>)}</div>}
    </section>
  </>;
}

function SuperAdminPanel({ roles, userId, newRole, setNewRole, targetUserId, setTargetUserId, onSubmit, onRemove, saving, workingId }: {
  roles: RoleRow[]; userId: string; newRole: Role; setNewRole: (role: Role) => void; targetUserId: string; setTargetUserId: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onRemove: (userId: string) => void; saving: boolean; workingId: string;
}) {
  return <>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Attribuer un rôle</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Copiez l’UUID du compte depuis Authentication → Users. Aucun mot de passe ni clé secrète n’est demandé ici.</p>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_190px_auto]">
        <label className="text-sm font-semibold text-gray-700">UUID utilisateur<input required value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 font-mono text-sm" /></label>
        <label className="text-sm font-semibold text-gray-700">Rôle<select value={newRole} onChange={(event) => setNewRole(event.target.value as Role)} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3"><option value="admin">Administrateur</option><option value="super_admin">Super administrateur</option></select></label>
        <button type="submit" disabled={saving} className="self-end rounded-lg bg-gray-950 px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </section>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Rôles attribués</h2>
      {roles.length === 0 ? <p className="mt-4 text-gray-500">Aucun rôle attribué. Le premier super administrateur doit être créé dans le SQL Editor.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="pb-3 pr-4">UUID utilisateur</th><th className="pb-3 pr-4">Rôle</th><th className="pb-3 pr-4">Ajouté le</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{roles.map((entry) => <tr key={entry.user_id} className="border-b last:border-0"><td className="py-4 pr-4 font-mono text-xs">{entry.user_id}</td><td className="py-4 pr-4 font-bold">{entry.role === 'super_admin' ? 'Super admin' : 'Admin'}</td><td className="py-4 pr-4 text-gray-500">{date(entry.created_at)}</td><td className="py-4 text-right"><button type="button" disabled={entry.user_id === userId || workingId === entry.user_id} onClick={() => void onRemove(entry.user_id)} title={entry.user_id === userId ? 'Vous ne pouvez pas retirer votre propre accès ici.' : 'Retirer les droits'} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={15}/> Retirer</button></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
