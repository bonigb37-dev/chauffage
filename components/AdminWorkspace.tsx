'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/CartProvider';
import type { Product } from '@/lib/products';
import AdminPaymentProof from '@/components/AdminPaymentProof';

type Role = 'admin' | 'super_admin' | 'owner';
type RequestStatus = 'new' | 'in_progress' | 'done';
type RoleRow = { user_id: string; role: Role; created_at: string };
type ContactRow = { id: number; created_at: string; name: string; email: string; phone: string | null; postal_code: string | null; subject: string; message: string; status: RequestStatus };
type OrderRow = { id: number; created_at: string; reference: string; customer: Record<string, unknown>; shipping: Record<string, unknown> | null; items: unknown; total_cents: number; status: RequestStatus; payment_status: string };
type ActivityRow = { user_id: string; email: string | null; first_seen_at: string; last_seen_at: string; sign_in_count: number };
type ClientAccountRow = { user_id: string; email: string | null; full_name: string | null; created_at: string };
type AuditRow = { id: number; actor_user_id: string | null; actor_role: string | null; action: string; entity: string; entity_id: string | null; details: Record<string, unknown>; created_at: string };

const statusLabels: Record<RequestStatus, string> = { new: 'Nouvelle', in_progress: 'En cours', done: 'Terminée' };
const subjectLabels: Record<string, string> = { product: 'Information produit', quote: 'Devis', delivery: 'Livraison', order: 'Commande', claim: 'Réclamation', other: 'Autre' };
const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function text(value: unknown) { return typeof value === 'string' ? value : ''; }
function date(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function emptyProduct(products: Product[]): Product { return { id: Math.max(0, ...products.map((item) => item.id)) + 1, name: '', type: 'Granulés', quantity: '', price: 'Sur devis', priceAmount: 0, description: '', image: '/pellets.webp', stock: -1 }; }

function StatusSelect({ value, onChange, disabled }: { value: RequestStatus; onChange: (status: RequestStatus) => void; disabled: boolean }) {
  return <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as RequestStatus)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">
    {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
  </select>;
}

export default function AdminWorkspace({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const siteData = useCart();
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
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [accounts, setAccounts] = useState<ClientAccountRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [bankForm, setBankForm] = useState('');
  const [productForm, setProductForm] = useState<Product>(() => emptyProduct(siteData.products));
  const [editingProduct, setEditingProduct] = useState(false);

  useEffect(() => {
    if (!editingProduct && !productForm.name) setProductForm(emptyProduct(siteData.products));
  }, [siteData.products, editingProduct, productForm.name]);

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
    if (!currentRole || (superAdminOnly && currentRole !== 'super_admin' && currentRole !== 'owner')) { setLoading(false); return; }

    if (superAdminOnly) {
      const [roleList, activityList, accountList, auditList] = await Promise.all([
        supabase.from('admin_roles').select('user_id, role, created_at').order('created_at', { ascending: true }),
        supabase.from('user_activity').select('user_id, email, first_seen_at, last_seen_at, sign_in_count').order('last_seen_at', { ascending: false }).limit(200),
        supabase.from('client_accounts').select('user_id, email, full_name, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('admin_audit_log').select('id, actor_user_id, actor_role, action, entity, entity_id, details, created_at').order('created_at', { ascending: false }).limit(200),
      ]);
      if (roleList.error) setError('Impossible de charger la liste des rôles.');
      else setRoles((roleList.data ?? []) as RoleRow[]);
      if (!activityList.error) setActivities((activityList.data ?? []) as ActivityRow[]);
      if (!accountList.error) setAccounts((accountList.data ?? []) as ClientAccountRow[]);
      if (!auditList.error) setAudit((auditList.data ?? []) as AuditRow[]);
    } else {
      const [contactResult, orderResult, activityList, accountList, settingsResult] = await Promise.all([
        supabase.from('contact_requests').select('id, created_at, name, email, phone, postal_code, subject, message, status').order('created_at', { ascending: false }).limit(100),
        supabase.from('order_requests').select('id, created_at, reference, customer, shipping, items, total_cents, status, payment_status').order('created_at', { ascending: false }).limit(100),
        supabase.from('user_activity').select('user_id, email, first_seen_at, last_seen_at, sign_in_count').order('last_seen_at', { ascending: false }).limit(200),
        supabase.from('client_accounts').select('user_id, email, full_name, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('site_settings').select('value').eq('key', 'bank_transfer').maybeSingle(),
      ]);
      if (contactResult.error || orderResult.error) setError('Impossible de charger les demandes. Vérifiez les politiques RLS de supabase-admin.sql.');
      else {
        setContacts((contactResult.data ?? []) as ContactRow[]);
        setOrders((orderResult.data ?? []) as OrderRow[]);
      }
      if (!activityList.error) setActivities((activityList.data ?? []) as ActivityRow[]);
      if (!accountList.error) setAccounts((accountList.data ?? []) as ClientAccountRow[]);
      if (!settingsResult.error) setBankForm(String((settingsResult.data?.value as { details?: unknown } | null)?.details ?? ''));
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

  async function confirmTransfer(orderId: number) {
    if (!supabase || !window.confirm('Confirmer que le virement a bien été reçu sur le compte bancaire ?')) return;
    const key = `payment-${orderId}`;
    setWorkingId(key); setError(''); setNotice('');
    const { data, error: confirmationError } = await supabase.rpc('confirm_bank_transfer', { p_order_request_id: orderId, p_note: 'Vérifié manuellement par l’administrateur' });
    if (confirmationError) setError('Le virement n’a pas pu être confirmé. Vérifiez la migration supabase-commerce.sql et les droits administrateur.');
    else {
      setOrders((items) => items.map((item) => item.id === orderId ? { ...item, payment_status: String(data ?? 'confirmed') } : item));
      setNotice('Virement confirmé. L’action est inscrite dans l’historique des paiements.');
    }
    setWorkingId('');
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const email = userId.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Saisissez une adresse e-mail valide.'); return;
    }
    setSavingRole(true); setError(''); setNotice('');
    try {
      const { data: account, error: lookupError } = await supabase.from('client_accounts')
        .select('user_id').ilike('email', email.replace(/[\\%_]/g, '\\$&')).maybeSingle();
      if (lookupError) {
        setError('Impossible de rechercher ce compte. Vérifiez vos droits et la configuration Supabase.'); return;
      }
      if (!account) {
        setError('Aucun compte trouvé avec cette adresse e-mail. L’utilisateur doit d’abord créer son compte.'); return;
      }
      if (account.user_id === user?.id && newRole !== role) {
        setError('Pour éviter de perdre vos accès, vous ne pouvez pas modifier votre propre rôle ici.'); return;
      }
      if (newRole === 'owner' && role !== 'owner') {
        setError('Seul un owner peut attribuer le rôle owner.'); return;
      }
      const { error: saveError } = await supabase.from('admin_roles').upsert({ user_id: account.user_id, role: newRole }, { onConflict: 'user_id' });
      if (saveError) setError('Le rôle n’a pas pu être enregistré. Seul un administrateur autorisé peut gérer ce rôle.');
      else { setUserId(''); setNotice(`Rôle enregistré pour ${email}.`); await loadData(user); }
    } catch {
      setError('Le rôle n’a pas pu être enregistré. Veuillez réessayer.');
    } finally {
      setSavingRole(false);
    }
  }

  async function removeRole(targetId: string) {
    if (!supabase || targetId === user?.id || !window.confirm('Retirer les droits administrateur de cet utilisateur ?')) return;
    setWorkingId(targetId); setError(''); setNotice('');
    const { error: removeError } = await supabase.from('admin_roles').delete().eq('user_id', targetId);
    if (removeError) setError('Impossible de retirer ce rôle.');
    else { setRoles((items) => items.filter((item) => item.user_id !== targetId)); setNotice('Rôle retiré.'); }
    setWorkingId('');
  }

  async function saveBankDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || savingRole) return false;
    setSavingRole(true); setError(''); setNotice('');
    try {
      const { data, error: saveError } = await supabase.from('site_settings')
        .update({ value: { details: bankForm }, updated_at: new Date().toISOString() })
        .eq('key', 'bank_transfer').select('key').single();
      if (saveError || !data) {
        setError('Les coordonnées bancaires n’ont pas pu être enregistrées.');
        return false;
      }
      return true;
    } catch {
      setError('Les coordonnées bancaires n’ont pas pu être enregistrées. Veuillez réessayer.');
      return false;
    } finally {
      setSavingRole(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    const p = { ...productForm, priceAmount: productForm.priceAmount ? productForm.priceAmount : null, stock: productForm.stock !== undefined && productForm.stock < 0 ? null : productForm.stock };
    const data = { ...p, price: typeof p.priceAmount === 'number' ? euros.format(p.priceAmount / 100) : 'Sur devis' };
    setSavingRole(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('product_overrides').upsert({ product_id: p.id, data, is_deleted: false, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
    if (saveError) setError('Le produit n’a pas pu être enregistré. Vérifiez le script SQL et votre rôle.');
    else window.location.reload();
    setSavingRole(false);
  }

  async function deleteProduct(productId: number | number[]) {
    const ids = [...new Set(Array.isArray(productId) ? productId : [productId])];
    if (ids.length > 0 && ids.length === siteData.products.length) {
      const confirmation = window.prompt(`Cette action supprimera les ${ids.length} produits et rendra le catalogue vide sur tous les appareils. Pour confirmer, saisissez SUPPRIMER TOUT.`);
      if (confirmation !== 'SUPPRIMER TOUT') return;
    }
    if (!supabase || savingRole || ids.length === 0 || !window.confirm(ids.length === 1
      ? 'Supprimer ce produit du catalogue ?'
      : `Supprimer les ${ids.length} produits sélectionnés du catalogue ?`)) return;
    setSavingRole(true); setError(''); setNotice('');
    try {
      const updatedAt = new Date().toISOString();
      const { error: deleteError } = await supabase.from('product_overrides').upsert(
        ids.map((id) => ({ product_id: id, data: {}, is_deleted: true, updated_at: updatedAt })),
        { onConflict: 'product_id' },
      );
      if (deleteError) setError('Les produits n’ont pas pu être supprimés.'); else window.location.reload();
    } catch {
      setError('La suppression a échoué. Veuillez réessayer.');
    } finally {
      setSavingRole(false);
    }
  }

  async function handleSignOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError('La déconnexion a échoué. Veuillez réessayer.');
        return;
      }
      setUser(null);
      setRole(null);
      router.replace('/compte');
      router.refresh();
    } catch {
      setError('La déconnexion a échoué. Veuillez réessayer.');
    } finally {
      setSigningOut(false);
    }
  }

  const canSeeWorkspace = role === 'admin' || role === 'super_admin' || role === 'owner';
  const canSeeSuperAdmin = role === 'super_admin' || role === 'owner';

  return <main className="min-h-[70vh] bg-[#fffaf5] py-10 sm:py-14">
    <div className="container max-w-6xl">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-[.18em] text-orange-600">Bren-nholz · administration</p><h1 className="mt-2 text-3xl font-black text-gray-950 sm:text-4xl">{superAdminOnly ? (role === 'owner' ? 'Administration Owner' : 'Super administration') : 'Espace administrateur'}</h1></div>
        {user && <div className="flex flex-wrap items-center gap-3"><div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-gray-600">{user.email}</div><button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{signingOut ? 'Déconnexion...' : 'Se déconnecter'}</button></div>}
      </div>

      {loading ? <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white p-8 text-gray-600"><LoaderCircle className="animate-spin"/> Vérification de l’accès...</div>
        : !user ? <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-8"><h2 className="text-xl font-bold">Connexion requise</h2><p className="mt-2 text-gray-600">Connectez-vous avec votre compte administrateur pour continuer.</p><Link href="/compte" className="mt-5 inline-flex rounded-xl bg-orange-600 px-5 py-3 font-bold text-white">Se connecter</Link></section>
          : superAdminOnly && !canSeeSuperAdmin ? <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-8"><h2 className="text-xl font-bold">Page indisponible</h2><p className="mt-2 text-gray-600">Cette page n’est pas accessible avec ce compte.</p></section>
            : !canSeeWorkspace ? <section className="mt-8 rounded-2xl border border-red-200 bg-white p-8"><h2 className="text-xl font-bold text-red-800">Accès administrateur requis</h2><p className="mt-2 text-gray-600">Ce compte n’a pas de rôle administrateur.</p></section>
              : superAdminOnly ? <><Link href="/admin" className="mt-7 inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold">Ouvrir l’espace boutique</Link><SuperAdminPanel roles={roles} userId={user.id} currentRole={role} newRole={newRole} setNewRole={setNewRole} targetUserId={userId} setTargetUserId={setUserId} onSubmit={saveRole} onRemove={removeRole} saving={savingRole} workingId={workingId} /><AccountRegistrationPanel accounts={accounts} /><ActivityPanel activities={activities} /><AuditPanel audit={audit} /></>
                : <><AdminPanel contacts={contacts} orders={orders} workingId={workingId} onStatusChange={updateStatus} onConfirmTransfer={confirmTransfer} /><ProductAdminPanel products={siteData.products} product={productForm} setProduct={setProductForm} editing={editingProduct} setEditing={setEditingProduct} saving={savingRole} onSave={saveProduct} onDelete={deleteProduct} onBankSave={saveBankDetails} bankForm={bankForm} setBankForm={setBankForm} /><AccountRegistrationPanel accounts={accounts} /><ActivityPanel activities={activities} /></>}

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{notice}</p>}
      <button type="button" onClick={() => void loadData(user)} className="mt-8 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><RefreshCw size={15}/> Actualiser les données</button>
    </div>
  </main>;
}

function AdminPanel({ contacts, orders, workingId, onStatusChange, onConfirmTransfer }: { contacts: ContactRow[]; orders: OrderRow[]; workingId: string; onStatusChange: (table: 'contact_requests' | 'order_requests', id: number, status: RequestStatus) => void; onConfirmTransfer: (id: number) => void }) {
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
          <p className="mt-3 text-sm font-bold text-gray-900">Sous-total produits : {euros.format(order.total_cents / 100)} · frais de livraison à confirmer selon la zone</p>
          <AdminPaymentProof reference={order.reference} />
          <div className="mt-3 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.payment_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>Virement : {order.payment_status === 'confirmed' ? 'confirmé' : 'en attente'}</span>{order.payment_status !== 'confirmed' && <button type="button" disabled={workingId === `payment-${order.id}`} onClick={() => onConfirmTransfer(order.id)} className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{workingId === `payment-${order.id}` ? 'Vérification…' : 'Confirmer le virement reçu'}</button>}</div>
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

function SuperAdminPanel({ roles, userId, currentRole, newRole, setNewRole, targetUserId, setTargetUserId, onSubmit, onRemove, saving, workingId }: {
  roles: RoleRow[]; userId: string; currentRole: Role | null; newRole: Role; setNewRole: (role: Role) => void; targetUserId: string; setTargetUserId: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onRemove: (userId: string) => void; saving: boolean; workingId: string;
}) {
  const visibleRoles = roles.filter((entry) => currentRole === 'owner' || entry.role !== 'owner');
  return <>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Attribuer un rôle</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Saisissez l’adresse e-mail d’un utilisateur ayant déjà créé son compte sur le site.</p>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_190px_auto]">
        <label className="text-sm font-semibold text-gray-700">Adresse e-mail utilisateur<input required type="email" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="utilisateur@exemple.com" className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-sm" /></label>
        <label className="text-sm font-semibold text-gray-700">Rôle<select value={newRole} onChange={(event) => setNewRole(event.target.value as Role)} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3"><option value="admin">Administrateur</option><option value="super_admin">Super administrateur</option>{currentRole === 'owner' && <option value="owner">Owner</option>}</select></label>
        <button type="submit" disabled={saving} className="self-end rounded-lg bg-gray-950 px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
    </section>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Rôles attribués</h2>
      {visibleRoles.length === 0 ? <p className="mt-4 text-gray-500">Aucun rôle attribué. Le premier super administrateur doit être créé dans le SQL Editor.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="pb-3 pr-4">UUID utilisateur</th><th className="pb-3 pr-4">Rôle</th><th className="pb-3 pr-4">Ajouté le</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{visibleRoles.map((entry) => <tr key={entry.user_id} className="border-b last:border-0"><td className="py-4 pr-4 font-mono text-xs">{entry.user_id}</td><td className="py-4 pr-4 font-bold">{entry.role === 'owner' ? 'Owner' : entry.role === 'super_admin' ? 'Super admin' : 'Admin'}</td><td className="py-4 pr-4 text-gray-500">{date(entry.created_at)}</td><td className="py-4 text-right"><button type="button" disabled={entry.user_id === userId || workingId === entry.user_id} onClick={() => void onRemove(entry.user_id)} title={entry.user_id === userId ? 'Vous ne pouvez pas retirer votre propre accès ici.' : 'Retirer les droits'} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={15}/> Retirer</button></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}

function ActivityPanel({ activities }: { activities: ActivityRow[] }) {
  const onlineCutoff = Date.now() - 2 * 60_000;
  return <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
    <h2 className="text-2xl font-black">Activité des comptes</h2>
    <p className="mt-2 text-sm text-gray-500">Un compte est marqué actif si sa dernière présence remonte à moins de deux minutes.</p>
    {activities.length === 0 ? <p className="mt-4 text-gray-500">Aucune connexion enregistrée.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="pb-3 pr-4">Compte</th><th className="pb-3 pr-4">État</th><th className="pb-3 pr-4">Dernière activité</th><th className="pb-3">Connexions</th></tr></thead><tbody>{activities.map((entry) => <tr key={entry.user_id} className="border-b last:border-0"><td className="py-4 pr-4">{entry.email ?? entry.user_id}</td><td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${new Date(entry.last_seen_at).getTime() > onlineCutoff ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{new Date(entry.last_seen_at).getTime() > onlineCutoff ? 'En ligne' : 'Hors ligne'}</span></td><td className="py-4 pr-4 text-gray-600">{date(entry.last_seen_at)}</td><td className="py-4">{entry.sign_in_count}</td></tr>)}</tbody></table></div>}
  </section>;
}

function AccountRegistrationPanel({ accounts }: { accounts: ClientAccountRow[] }) {
  return <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
    <h2 className="text-2xl font-black">Comptes inscrits</h2>
    <p className="mt-2 text-sm text-gray-500">Les inscriptions effectuées sur le site apparaissent ici, même avant leur première connexion confirmée.</p>
    {accounts.length === 0 ? <p className="mt-4 text-gray-500">Aucune inscription trouvée. Vérifiez que le script SQL de l’administration a été exécuté dans le projet Supabase utilisé par le site.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="pb-3 pr-4">Nom</th><th className="pb-3 pr-4">Adresse e-mail</th><th className="pb-3 pr-4">Inscrit le</th><th className="pb-3">UUID</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.user_id} className="border-b last:border-0"><td className="py-4 pr-4">{account.full_name || '—'}</td><td className="py-4 pr-4">{account.email || '—'}</td><td className="py-4 pr-4 text-gray-600">{date(account.created_at)}</td><td className="py-4 font-mono text-xs">{account.user_id}</td></tr>)}</tbody></table></div>}
  </section>;
}

function AuditPanel({ audit }: { audit: AuditRow[] }) {
  const actionNames: Record<string, string> = { insert: 'Création', update: 'Modification', delete: 'Suppression' };
  return <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
    <h2 className="text-2xl font-black">Journal des actions</h2>
    <p className="mt-2 text-sm text-gray-500">Journal privé des changements faits dans l’administration.</p>
    {audit.length === 0 ? <p className="mt-4 text-gray-500">Aucune action enregistrée.</p> : <div className="mt-5 space-y-3">{audit.map((entry) => <article key={entry.id} className="rounded-xl border border-stone-200 p-4"><div className="flex flex-wrap justify-between gap-2"><b>{actionNames[entry.action] ?? entry.action} · {entry.entity}</b><time className="text-sm text-gray-500">{date(entry.created_at)}</time></div><p className="mt-1 text-sm text-gray-600">Compte : {entry.actor_user_id ?? 'système'} · identifiant : {entry.entity_id ?? '—'} · rôle : {entry.actor_role ?? 'aucun'}</p><details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-orange-700">Afficher les valeurs enregistrées</summary><pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-stone-50 p-3 text-xs leading-5">{JSON.stringify(entry.details, null, 2)}</pre></details></article>)}</div>}
  </section>;
}

function ProductAdminPanel({ products, product, setProduct, editing, setEditing, saving, onSave, onDelete, onBankSave, bankForm, setBankForm }: {
  products: Product[]; product: Product; setProduct: (product: Product) => void; editing: boolean; setEditing: (editing: boolean) => void; saving: boolean;
  onSave: (event: FormEvent<HTMLFormElement>) => void; onDelete: (id: number | number[]) => void; onBankSave: (event: FormEvent<HTMLFormElement>) => Promise<boolean>; bankForm: string; setBankForm: (value: string) => void;
}) {
  const [bankSaved, setBankSaved] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectedProducts = products.filter((item) => selectedIds.includes(item.id));
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const input = 'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm';
  return <>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black">Catalogue et stock</h2>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-4">
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={allSelected} disabled={saving || products.length === 0} ref={(element) => { if (element) element.indeterminate = selectedProducts.length > 0 && !allSelected; }} onChange={(event) => setSelectedIds(event.target.checked ? products.map((item) => item.id) : [])} className="h-5 w-5 accent-orange-600" />Tout sélectionner</label>
        <span className="text-sm text-gray-600">{selectedProducts.length} produit(s) sélectionné(s)</span>
        <button type="button" disabled={saving || selectedProducts.length === 0} onClick={() => onDelete(selectedProducts.map((item) => item.id))} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Veuillez patienter...' : 'Supprimer la sélection'}</button>
      </div>
      <div className="mt-5 space-y-3">{products.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-4"><div className="flex items-center gap-3"><input type="checkbox" aria-label={`Sélectionner ${item.name}`} checked={selectedIds.includes(item.id)} disabled={saving} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} className="h-5 w-5 shrink-0 accent-orange-600" /><div><b>{item.name}</b><p className="mt-1 text-sm text-gray-500">{item.price} · {item.stock === 0 ? 'Rupture de stock' : item.stock !== undefined ? `${item.stock} en stock` : item.availability ?? 'Stock non suivi'}</p></div></div><div className="flex gap-2"><button type="button" disabled={saving} onClick={() => { setProduct({ ...item, priceAmount: item.priceAmount ?? 0, stock: item.stock ?? -1 }); setEditing(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">Modifier</button><button type="button" disabled={saving} onClick={() => onDelete(item.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50">Supprimer</button></div></article>)}</div>
      <form onSubmit={onSave} className="mt-6 rounded-xl bg-stone-50 p-4 sm:p-5"><h3 className="text-lg font-bold">{editing ? 'Modifier le produit sélectionné' : 'Ajouter un produit'}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">ID produit<input required type="number" min="1" value={product.id} onChange={(e) => setProduct({ ...product, id: Number(e.target.value) })} className={input} /></label><label className="text-sm font-semibold">Nom<input required value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className={input} /></label><label className="text-sm font-semibold">Catégorie<input required value={product.type} onChange={(e) => setProduct({ ...product, type: e.target.value })} className={input} /></label><label className="text-sm font-semibold">Conditionnement<input required value={product.quantity} onChange={(e) => setProduct({ ...product, quantity: e.target.value })} className={input} /></label><label className="text-sm font-semibold">Prix en centimes (0 = sur devis)<input type="number" min="0" value={product.priceAmount ?? 0} onChange={(e) => setProduct({ ...product, priceAmount: Number(e.target.value) })} className={input} /></label><label className="text-sm font-semibold">Stock (-1 non suivi, 0 rupture)<input required type="number" min="-1" value={product.stock ?? -1} onChange={(e) => { const stock = Number(e.target.value); setProduct({ ...product, stock, availability: stock < 0 ? (product.availability === 'Rupture de stock' ? undefined : product.availability) : stock === 0 ? 'Rupture de stock' : 'En stock' }); }} className={input} /></label><label className="text-sm font-semibold sm:col-span-2">Image (chemin dans /public, ex. /pellets.webp)<input required value={product.image} onChange={(e) => setProduct({ ...product, image: e.target.value })} className={input} /></label><label className="text-sm font-semibold sm:col-span-2">Description<textarea required rows={3} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} className={input} /></label></div><div className="mt-4 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-gray-950 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer le produit'}</button>{editing && <button type="button" onClick={() => { setEditing(false); setProduct(emptyProduct(products)); }} className="rounded-lg border px-5 py-3 font-bold">Nouveau produit</button>}</div></form>
    </section>
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"><h2 className="text-2xl font-black">Coordonnées de virement</h2><form onSubmit={async (event) => { setBankSaved(false); setBankSaved(await onBankSave(event)); }} className="mt-4"><label className="text-sm font-semibold">Informations bancaires affichées aux clients<textarea rows={5} value={bankForm} disabled={saving} onChange={(e) => { setBankSaved(false); setBankForm(e.target.value); }} placeholder="Bénéficiaire, IBAN, BIC et référence à indiquer..." className={input} /></label><button type="submit" disabled={saving} className="mt-4 rounded-lg bg-gray-950 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>{bankSaved && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Les coordonnées bancaires ont été sauvegardées avec succès.</p>}</form></section>
  </>;
}


