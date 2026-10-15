'use client';
import IncludedVatSummary from '@/components/IncludedVatSummary';
import type { vatSummary } from '@/lib/vat';
import CartDraftsPanel from '@/components/CartDraftsPanel';
import { localizeNode, translate } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import {
  LoaderCircle, RefreshCw, Trash2, LayoutDashboard,
  BarChart3, ShoppingCart, LogOut, Menu, X, Flame,
  ChevronRight, Package, MessageCircle, Mail, Layers, Users, Crown,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/CartProvider';
import type { Product } from '@/lib/products';
import AdminPaymentProof from '@/components/AdminPaymentProof';
import SupportMessenger from '@/components/SupportMessenger';
import SupportNotifications from '@/components/SupportNotifications';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { analyticsCopy } from '@/lib/analytics-copy';
import { orderArchiveCopy } from '@/lib/order-archive-copy';
import { orderStatusLabels, paymentStatusLabel } from '@/lib/order-status';
import { getAdminRole, type AdminRole } from '@/lib/admin-access';
import { useVerifiedAccess } from '@/components/AccessContext';

type Role = 'admin' | 'super_admin' | 'owner';
type RequestStatus = 'new' | 'in_progress' | 'done';
type RoleRow = { user_id: string; role: Role; created_at: string };
type ContactRow = { id: number; created_at: string; name: string; email: string; phone: string | null; postal_code: string | null; subject: string; message: string; status: RequestStatus };
type OrderRow = { id: number; created_at: string; reference: string; customer: Record<string, unknown>; shipping: Record<string, unknown> | null; items: unknown; total_cents: number; status: RequestStatus; payment_status: string; archived_at?: string | null };
type ActivityRow = { user_id: string; email: string | null; first_seen_at: string; last_seen_at: string; sign_in_count: number };
type ClientAccountRow = { user_id: string; email: string | null; full_name: string | null; created_at: string };
type AuditRow = { id: number; actor_user_id: string | null; actor_role: string | null; action: string; entity: string; entity_id: string | null; details: Record<string, unknown>; created_at: string };

const statusLabels: Record<RequestStatus, string> = { new: 'Neu', in_progress: 'In Bearbeitung', done: 'Abgeschlossen' };
const subjectLabels: Record<string, string> = { product: 'Produktinformationen', quote: 'Angebot', delivery: 'Lieferung', order: 'Bestellung', claim: 'Reklamation', other: 'Sonstiges' };
const euros = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

function text(value: unknown) { return typeof value === 'string' ? value : ''; }
function date(value: string, locale: Locale) { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function emptyProduct(products: Product[]): Product { return { id: Math.max(0, ...products.map((item) => item.id)) + 1, name: '', type: 'Pellets', quantity: '', price: 'Auf Anfrage', priceAmount: 0, description: '', image: '/pellets.webp', stock: -1 }; }

function StatusSelect({ value, onChange, disabled, order = false }: { value: RequestStatus; onChange: (status: RequestStatus) => void; disabled: boolean; order?: boolean }) {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as RequestStatus)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-900 shadow-2xs focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 disabled:opacity-50">
    {Object.entries(order ? orderStatusLabels : statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
  </select>, brenLocale);
}

export default function AdminWorkspace({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const brenLocale = useLocale() as Locale;

  const router = useRouter();
  const access = useVerifiedAccess();
  const loadGeneration = useRef(0);
  const loadedAccess = useRef('');
  const [signingOut, setSigningOut] = useState(false);
  const siteData = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [archiveReady, setArchiveReady] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [orderOffset, setOrderOffset] = useState(0);
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
  const [activeView, setActiveView] = useState<'workspace' | 'messages' | 'statistics' | 'carts'>('workspace');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string>(superAdminOnly ? 'users' : 'workspace');
  useEffect(() => {
    const syncHash = () => {
      const messages = window.location.hash === '#support-messages';
      const statistics = window.location.hash === '#site-statistics';
      setActiveView(messages ? 'messages' : statistics ? 'statistics' : 'workspace');
      if (messages) setActiveNavItem('support');
      else if (statistics) setActiveNavItem('statistics');
      else if (!superAdminOnly) setActiveNavItem('workspace');
      requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' }));
    };
    syncHash();
    const showMessages = () => { setActiveView('messages'); setActiveNavItem('support'); };
    const showWorkspace = () => { setActiveView('workspace'); setActiveNavItem('contacts'); requestAnimationFrame(() => document.getElementById('contact-requests')?.scrollIntoView({ block: 'start' })); };
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    window.addEventListener('bren-admin-messages', showMessages);
    window.addEventListener('bren-admin-workspace', showWorkspace);
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
      window.removeEventListener('bren-admin-messages', showMessages);
      window.removeEventListener('bren-admin-workspace', showWorkspace);
    };
  }, [superAdminOnly]);

  useEffect(() => {
    if (!editingProduct && !productForm.name) setProductForm(emptyProduct(siteData.products));
  }, [siteData.products, editingProduct, productForm.name]);

  const loadData = useCallback(async (activeUser: User | null, verifiedRole?: AdminRole | null) => {
    const generation = ++loadGeneration.current;
    if (!supabase) { setError('Supabase ist für diese Website-Version nicht eingerichtet.'); setLoading(false); return; }
    const currentUser = activeUser;
    if (!currentUser) { setLoading(false); return; }
    setError('');
    setDetailsLoading(true);
    let currentRole;
    try { currentRole = verifiedRole === undefined ? await getAdminRole(supabase, currentUser.id) : verifiedRole; } catch {
      setError('Ihre Rolle konnte nicht geprüft werden. Führen Sie supabase-admin.sql im Supabase SQL Editor aus.');
      setLoading(false);
      return;
    }
    if (generation !== loadGeneration.current) return;
    setRole(currentRole ?? null);
    if (!currentRole || (superAdminOnly && currentRole !== 'super_admin' && currentRole !== 'owner')) { setLoading(false); return; }

    const orderFields = 'id, created_at, reference, customer, shipping, items, total_cents, status, payment_status';
    const orderQuery = supabase.from('order_requests').select(`${orderFields}, archived_at`).order('created_at', { ascending: false }).range(orderOffset, orderOffset+99);
    let orderResult: { data: unknown; error: { code: string } | null } = await (showArchived ? orderQuery.not('archived_at', 'is', null) : orderQuery.is('archived_at', null));
    const ready = !orderResult.error;
    if (orderResult.error?.code === '42703' || orderResult.error?.code === 'PGRST204') orderResult = await supabase.from('order_requests').select(orderFields).order('created_at', { ascending: false }).range(orderOffset,orderOffset+99);
    if (generation !== loadGeneration.current) return;
    setArchiveReady(ready);
    if (orderResult.error) setError('Bestellungen konnten nicht geladen werden.');
    else setOrders((orderResult.data ?? []) as unknown as OrderRow[]);

    if (superAdminOnly) {
      const secondary = Promise.all([
        supabase.from('user_activity').select('user_id, email, first_seen_at, last_seen_at, sign_in_count').order('last_seen_at', { ascending: false }).limit(200),
        supabase.from('client_accounts').select('user_id, email, full_name, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('admin_audit_log').select('id, actor_user_id, actor_role, action, entity, entity_id, details, created_at').order('created_at', { ascending: false }).limit(200),
      ]);
      void secondary.catch(() => { /* Handled when awaited after the primary list. */ });
      const roleList = await supabase.from('admin_roles').select('user_id, role, created_at').order('created_at', { ascending: true });
      if (generation !== loadGeneration.current) return;
      if (roleList.error) setError('Die Rollenliste konnte nicht geladen werden.');
      else setRoles((roleList.data ?? []) as RoleRow[]);
      setLoading(false);
      const [activityList, accountList, auditList] = await secondary;
      if (generation !== loadGeneration.current) return;
      if (!activityList.error) setActivities((activityList.data ?? []) as ActivityRow[]);
      if (!accountList.error) setAccounts((accountList.data ?? []) as ClientAccountRow[]);
      if (!auditList.error) setAudit((auditList.data ?? []) as AuditRow[]);
    } else {
      const secondary = Promise.all([
        supabase.from('user_activity').select('user_id, email, first_seen_at, last_seen_at, sign_in_count').order('last_seen_at', { ascending: false }).limit(200),
        supabase.from('client_accounts').select('user_id, email, full_name, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('site_settings').select('value').eq('key', 'bank_transfer').maybeSingle(),
      ]);
      void secondary.catch(() => { /* Handled when awaited after the primary lists. */ });
      const contactResult = await supabase.from('contact_requests').select('id, created_at, name, email, phone, postal_code, subject, message, status').order('created_at', { ascending: false }).limit(100);
      if (generation !== loadGeneration.current) return;
      if (contactResult.error || orderResult.error) setError('Die Anfragen konnten nicht geladen werden. Prüfen Sie die RLS-Richtlinien in supabase-admin.sql.');
      else {
        setContacts((contactResult.data ?? []) as ContactRow[]);
        setOrders((orderResult.data ?? []) as OrderRow[]);
      }
      setLoading(false);
      const [activityList, accountList, settingsResult] = await secondary;
      if (generation !== loadGeneration.current) return;
      if (!activityList.error) setActivities((activityList.data ?? []) as ActivityRow[]);
      if (!accountList.error) setAccounts((accountList.data ?? []) as ClientAccountRow[]);
      if (!settingsResult.error) setBankForm(String((settingsResult.data?.value as { details?: unknown } | null)?.details ?? ''));
    }
    setDetailsLoading(false);
    setLoading(false);
  }, [superAdminOnly, showArchived, orderOffset]);

  async function archiveOrder(id: number, archived: boolean) {
    if (!supabase || workingId) return;
    const copy = orderArchiveCopy[brenLocale];
    const order = orders.find(row => row.id === id);
    if (!order || (archived && !window.confirm(`${copy.confirm}\n${order.reference}`))) return;
    setWorkingId(`archive-${id}`); setError(''); setNotice('');
    try {
      const result = await supabase.rpc('set_order_archived', { p_order_id: id, p_archived: archived });
      if (result.error) { setError(result.error.code === 'PGRST202' ? copy.setup : copy.error); return; }
      if (result.data !== true) { setError(copy.error); return; }
      setOrders(rows => rows.filter(row => row.id !== id));
      setNotice(archived ? copy.removed : copy.restored);
      void loadData(user);
    } catch { setError(copy.error); }
    finally { setWorkingId(''); }
  }

  useEffect(() => {
    if (!supabase) { setError('Supabase ist für diese Website-Version nicht eingerichtet.'); setLoading(false); return; }
    if (!access.verified) return;
    setUser(access.user);
    const key = `${access.user?.id ?? ''}:${access.role ?? ''}:${superAdminOnly}:${showArchived}:${orderOffset}`;
    if (loadedAccess.current === key) return;
    loadedAccess.current = key;
    setRole(null);
    setLoading(true);
    const generation = loadGeneration.current + 1;
    void loadData(access.user, access.role).catch(() => {
      if (generation === loadGeneration.current) { setError('Ihr Verwaltungsbereich konnte nicht geladen werden. Bitte versuchen Sie es erneut.'); setLoading(false); }
    });
  }, [access.user, access.role, access.verified, superAdminOnly, showArchived, orderOffset, loadData]);

  useEffect(() => () => { ++loadGeneration.current; loadedAccess.current = ''; }, []);

  async function updateStatus(table: 'contact_requests' | 'order_requests', id: number, status: RequestStatus) {
    if (!supabase) return;
    if (table === 'order_requests' && status !== 'new' && orders.find((order) => order.id === id)?.payment_status !== 'confirmed') {
      setError('Bestätigen Sie den tatsächlichen Zahlungseingang vor der Vorbereitung oder dem Versand.');
      return;
    }
    const key = `${table}-${id}`;
    setWorkingId(key); setError(''); setNotice('');
    const { error: updateError } = await supabase.from(table).update({ status }).eq('id', id);
    if (updateError) setError('Der Status konnte nicht geändert werden. Prüfen Sie Ihre Rolle und die RLS-Regeln.');
    else {
      if (table === 'contact_requests') setContacts((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      else setOrders((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setNotice('Status aktualisiert.');
    }
    setWorkingId('');
  }

  async function confirmTransfer(orderId: number) {
    if (!supabase || !window.confirm(translate('Bestätigen, dass die Überweisung tatsächlich auf dem Bankkonto eingegangen ist?', brenLocale))) return;
    const key = `payment-${orderId}`;
    setWorkingId(key); setError(''); setNotice('');
    const { data, error: confirmationError } = await supabase.rpc('confirm_bank_transfer', { p_order_request_id: orderId, p_note: 'Manuell durch Administrator überprüft' });
    if (confirmationError) {
      setError('Die Überweisung konnte nicht bestätigt werden. Prüfen Sie die Migration supabase-commerce.sql und Ihre Administratorrechte.');
    } else {
      setOrders((items) => items.map((item) => item.id === orderId ? { ...item, payment_status: String(data ?? 'confirmed') } : item));
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.access_token) {
          const res = await fetch('/api/payment-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ orderId }),
          });
          const resData = await res.json();
          if (resData.emailSent) {
            setNotice('Überweisung bestätigt. Die offizielle Zahlungsbestätigung samt Rechnung (PDF) wurde per E-Mail an den Kunden versandt.');
          } else if (resData.alreadySent) {
            setNotice('Überweisung bestätigt. Die Zahlungsbestätigung wurde diesem Kunden bereits versandt.');
          } else {
            setNotice('Überweisung bestätigt. Die Aktion wurde im Zahlungsverlauf protokolliert.');
          }
        } else {
          setNotice('Überweisung bestätigt. Die Aktion wurde im Zahlungsverlauf protokolliert.');
        }
      } catch (emailErr) {
        console.error('Fehler beim Auslösen der Zahlungsbestätigung per E-Mail:', emailErr);
        setNotice('Überweisung bestätigt. Die Aktion wurde im Zahlungsverlauf protokolliert.');
      }
    }
    setWorkingId('');
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const email = userId.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Geben Sie eine gültige E-Mail-Adresse ein.'); return;
    }
    setSavingRole(true); setError(''); setNotice('');
    try {
      const { data: account, error: lookupError } = await supabase.from('client_accounts')
        .select('user_id').ilike('email', email.replace(/[\\%_]/g, '\\$&')).maybeSingle();
      if (lookupError) {
        setError('Dieses Konto konnte nicht gesucht werden. Prüfen Sie Ihre Berechtigungen und die Supabase-Konfiguration.'); return;
      }
      if (!account) {
        setError('Für diese E-Mail-Adresse wurde kein Konto gefunden. Der Benutzer muss zuerst ein Konto erstellen.'); return;
      }
      if (account.user_id === user?.id && newRole !== role) {
        setError('Damit Sie Ihren Zugang nicht verlieren, können Sie Ihre eigene Rolle hier nicht ändern.'); return;
      }
      if (newRole === 'owner' && role !== 'owner') {
        setError('Nur ein Kontoinhaber kann die Rolle Kontoinhaber vergeben.'); return;
      }
      const { error: saveError } = await supabase.from('admin_roles').upsert({ user_id: account.user_id, role: newRole }, { onConflict: 'user_id' });
      if (saveError) setError('Die Rolle konnte nicht gespeichert werden. Nur ein berechtigter Administrator kann diese Rolle verwalten.');
      else { setUserId(''); setNotice(`Rolle gespeichert für ${email}.`); await loadData(user); }
    } catch {
      setError('Die Rolle konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setSavingRole(false);
    }
  }

  async function removeRole(targetId: string) {
    if (!supabase || targetId === user?.id || !window.confirm(translate('Diesem Benutzer die Administratorrechte entziehen?', brenLocale))) return;
    setWorkingId(targetId); setError(''); setNotice('');
    const { error: removeError } = await supabase.from('admin_roles').delete().eq('user_id', targetId);
    if (removeError) setError('Diese Rolle konnte nicht entzogen werden.');
    else { setRoles((items) => items.filter((item) => item.user_id !== targetId)); setNotice('Rolle entzogen.'); }
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
        setError('Die Bankverbindung konnte nicht gespeichert werden.');
        return false;
      }
      return true;
    } catch {
      setError('Die Bankverbindung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
      return false;
    } finally {
      setSavingRole(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    const p = { ...productForm, priceAmount: productForm.priceAmount ? productForm.priceAmount : null, stock: productForm.stock !== undefined && productForm.stock < 0 ? null : productForm.stock };
    const data = { ...p, price: typeof p.priceAmount === 'number' ? euros.format(p.priceAmount / 100) : 'Auf Anfrage' };
    setSavingRole(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('product_overrides').upsert({ product_id: p.id, data, is_deleted: false, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
    if (saveError) setError('Das Produkt konnte nicht gespeichert werden. Prüfen Sie das SQL-Skript und Ihre Rolle.');
    else window.location.reload();
    setSavingRole(false);
  }

  async function deleteProduct(productId: number | number[]) {
    const ids = [...new Set(Array.isArray(productId) ? productId : [productId])];
    if (ids.length > 0 && ids.length === siteData.products.length) {
      const confirmation = window.prompt(`${translate('Diese Aktion löscht die', brenLocale)} ${ids.length} ${translate('Produkte und leert den Katalog auf allen Geräten. Geben Sie zur Bestätigung Folgendes ein:', brenLocale)} ${translate('ALLES LÖSCHEN', brenLocale)}.`);
      if (confirmation !== translate('ALLES LÖSCHEN', brenLocale)) return;
    }
    if (!supabase || savingRole || ids.length === 0 || !window.confirm(ids.length === 1
      ? translate('Dieses Produkt aus dem Katalog löschen?', brenLocale)
      : `${translate('Löschen:', brenLocale)} ${ids.length} ${translate('ausgewählte Produkte aus dem Katalog?', brenLocale)}`)) return;
    setSavingRole(true); setError(''); setNotice('');
    try {
      const updatedAt = new Date().toISOString();
      const { error: deleteError } = await supabase.from('product_overrides').upsert(
        ids.map((id) => ({ product_id: id, data: {}, is_deleted: true, updated_at: updatedAt })),
        { onConflict: 'product_id' },
      );
      if (deleteError) setError('Die Produkte konnten nicht gelöscht werden.'); else window.location.reload();
    } catch {
      setError('Das Löschen ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
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
        setError('Das Abmelden ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
        return;
      }
      setUser(null);
      setRole(null);
      router.replace('/compte');
      router.refresh();
    } catch {
      setError('Das Abmelden ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setSigningOut(false);
    }
  }

  const canSeeWorkspace = role === 'admin' || role === 'super_admin' || role === 'owner';
  const canSeeSuperAdmin = role === 'super_admin' || role === 'owner';
  const userFullName = accounts.find(a => a.user_id === user?.id)?.full_name?.trim() ?? null;
  const userInitials = userFullName
    ? userFullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : user?.email ? user.email.slice(0, 2).toUpperCase() : 'AD';
  const pendingOrdersCount = orders.filter(o => o.status !== 'done').length;
  const newContactsCount = contacts.filter(c => c.status === 'new').length;

  const navBtnClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-white shadow-md shadow-[#FF6B00]/25'
        : 'text-[#9AA4AF] hover:text-white hover:bg-white/10'
    }`;

  const navContent = (
    <div className="flex flex-col h-full p-5 relative z-10 text-slate-200">

      {/* ── Brand ── */}
      <div className="flex items-center gap-3 pb-5 border-b border-white/10 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E65A00] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)] border border-orange-400/30 shrink-0">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black text-lg tracking-tight leading-none">
            Brennholz<span className="text-[#FF6B00]">-</span>direk
          </h1>
          <p className="text-[11px] text-[#9AA4AF] font-semibold mt-0.5">Leitkonsole</p>
        </div>
      </div>

      {/* ── Carte profil ── */}
      {user && (
        <div className="mt-4 rounded-xl bg-[#17212B]/80 border border-white/[0.08] p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-orange-500/40 text-orange-400 flex items-center justify-center font-mono font-black text-sm shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {userFullName ?? user.email?.split('@')[0] ?? 'Admin'}
              </p>
              <p className="text-[11px] text-[#9AA4AF] truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-[#9AA4AF] font-medium">Berechtigung</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              role === 'owner'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : role === 'super_admin'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-zinc-800/80 text-orange-400 border-orange-500/30'
            }`}>
              <Crown className="w-2.5 h-2.5" />
              {role === 'owner' ? 'Inhaber' : role === 'super_admin' ? 'Super-Admin' : 'Admin'}
            </span>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="mt-5 flex-1 min-h-0 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9AA4AF]/70 px-1 mb-2.5">Navigation</p>
        <nav className="space-y-0.5" aria-label="Hauptnavigation Administration">

          {[
            {
              id: 'workspace', label: 'Übersicht', icon: LayoutDashboard,
              badge: null as number | null, show: true,
              action: () => {
                setActiveNavItem('workspace'); setActiveView('workspace');
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                setMobileOpen(false);
              },
            },
            {
              id: 'orders', label: 'Bestellungen & Überw.', icon: Package,
              badge: pendingOrdersCount || null, show: true,
              action: () => {
                setActiveNavItem('orders'); setActiveView('workspace');
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                setMobileOpen(false);
              },
            },
            {
              id: 'support', label: 'Kundenservice', icon: MessageCircle,
              badge: null as number | null, show: true,
              action: () => {
                setActiveNavItem('support'); setActiveView('messages');
                window.history.replaceState(null, '', '#support-messages');
                setMobileOpen(false);
              },
            },
            {
              id: 'contacts', label: 'Nachrichten & Angebote', icon: Mail,
              badge: newContactsCount || null, show: !superAdminOnly,
              action: () => {
                setActiveNavItem('contacts'); setActiveView('workspace');
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                setMobileOpen(false);
                requestAnimationFrame(() => document.getElementById('contact-requests')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              },
            },
            {
              id: 'catalogue', label: 'Katalog & Bestände', icon: Layers,
              badge: null as number | null, show: !superAdminOnly,
              action: () => {
                setActiveNavItem('catalogue'); setActiveView('workspace');
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                setMobileOpen(false);
                requestAnimationFrame(() => document.getElementById('catalog-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              },
            },
            {
              id: 'statistics', label: 'Besucherstatistiken', icon: BarChart3,
              badge: null as number | null, show: true,
              action: () => {
                setActiveNavItem('statistics'); setActiveView('statistics');
                window.history.replaceState(null, '', '#site-statistics');
                setMobileOpen(false);
              },
            },
            {
              id: 'carts', label: 'Verlassene Warenkörbe', icon: ShoppingCart,
              badge: null as number | null, show: true,
              action: () => { setActiveNavItem('carts'); setActiveView('carts'); setMobileOpen(false); },
            },
          ].filter(item => item.show).map(({ id, label, icon: Icon, badge, action }) => {
            const isActive = activeNavItem === id;
            return (
              <button key={id} type="button" aria-pressed={isActive} onClick={action} className={navBtnClass(isActive)}>
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 ml-1">
                  {badge !== null && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-[#FF6B00] text-white'}`}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
                </span>
              </button>
            );
          })}

          {/* Benutzer & Zugänge — super admin / owner nur */}
          {canSeeSuperAdmin && (
            superAdminOnly ? (
              <button type="button" aria-pressed className={navBtnClass(true)}>
                <span className="flex items-center gap-3 min-w-0">
                  <Users className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">Benutzer & Zugänge</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />
              </button>
            ) : (
              <Link
                href="/super-admin"
                onClick={() => { setActiveNavItem('users'); setMobileOpen(false); }}
                className={navBtnClass(activeNavItem === 'users')}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Users className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">Benutzer & Zugänge</span>
                </span>
                {activeNavItem === 'users' && <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />}
              </Link>
            )
          )}
        </nav>
      </div>

      {/* ── Actions bas de sidebar ── */}
      <div className="mt-4 pt-4 border-t border-white/10 space-y-0.5 shrink-0">
        <button
          type="button"
          onClick={() => void loadData(user)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#9AA4AF] hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-[18px] h-[18px] shrink-0" />
          <span>Aktualisieren</span>
        </button>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#9AA4AF] hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span>{signingOut ? 'Abmeldung...' : 'Abmelden'}</span>
        </button>
      </div>
    </div>
  );


  return localizeNode(
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-[#101820] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#E65A00] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.4)]">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight leading-none text-white">Brennholz-direk</h1>
            <p className="text-[9px] text-[#9AA4AF] font-bold uppercase tracking-widest mt-0.5">Admin-Arbeitsbereich</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-[#17212B] border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div
            className="relative w-[270px] h-full shadow-2xl flex flex-col z-10 overflow-y-auto"
            style={{ backgroundImage: "url('/BD.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-[#101820]/88 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#FF6B00_1px,transparent_1px)] [background-size:16px_16px] opacity-10 mix-blend-screen pointer-events-none" />
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block w-[270px] shrink-0 sticky top-0 h-screen border-r border-white/10 overflow-y-auto z-30"
        style={{ backgroundImage: "url('/BD.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#101820]/88 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#FF6B00]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#FF6B00_1px,transparent_1px)] [background-size:16px_16px] opacity-10 mix-blend-screen pointer-events-none" />
        {navContent}
      </aside>

      {/* Main Workspace Area (Clean Industrial background #F8FAFC) */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 bg-[#F8FAFC]">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
              Brennholz-direk · Industrielle Verwaltung
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              {superAdminOnly
                ? (role === 'owner' ? 'Inhaberverwaltung' : 'Super-Administration')
                : 'Administratorkonsole'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadData(user)}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-stone-50 hover:border-stone-300 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Main Notifications / Error messages */}
        {!loading && canSeeWorkspace && user && (!superAdminOnly || canSeeSuperAdmin) && <SupportNotifications />}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm font-semibold text-red-900 shadow-2xs">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-semibold text-emerald-900 shadow-2xs">
            {notice}
          </div>
        )}

        {/* View Switcher Container */}
        <div className={activeView !== 'workspace' && !loading && canSeeWorkspace && (!superAdminOnly || canSeeSuperAdmin) ? 'hidden' : 'space-y-6'}>
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-8 text-zinc-600 shadow-2xs">
              <LoaderCircle className="w-5 h-5 animate-spin text-[#FF6B00]" />
              <span className="font-semibold text-sm">Berechtigungen werden geprüft …</span>
            </div>
          ) : !user ? (
            <section className="rounded-2xl border border-stone-200/90 bg-white p-8 shadow-2xs">
              <h2 className="text-xl font-black text-zinc-950 tracking-tight">Anmeldung erforderlich</h2>
              <p className="mt-2 text-sm text-stone-600">Melden Sie sich mit Ihrem Administratorkonto an, um auf die Leitkonsole zuzugreifen.</p>
              <Link href="/compte" className="mt-5 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-zinc-800 transition-all">
                Anmelden
              </Link>
            </section>
          ) : superAdminOnly && !canSeeSuperAdmin ? (
            <section className="rounded-2xl border border-stone-200/90 bg-white p-8 shadow-2xs">
              <h2 className="text-xl font-black text-zinc-950 tracking-tight">Zugriff eingeschränkt</h2>
              <p className="mt-2 text-sm text-stone-600">Dieser Bereich erfordert eine Super-Admin- oder Inhaber-Berechtigung.</p>
            </section>
          ) : !canSeeWorkspace ? (
            <section className="rounded-2xl border border-red-200 bg-white p-8 shadow-2xs">
              <h2 className="text-xl font-black text-red-800 tracking-tight">Administratorzugang erforderlich</h2>
              <p className="mt-2 text-sm text-stone-600">Dieses Konto verfügt nicht über die erforderlichen Administratorrechte.</p>
            </section>
          ) : superAdminOnly ? (
            <>
              <Link href="/admin" className="inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 shadow-2xs hover:bg-stone-50 transition-all">
                Shop-Bereich öffnen
              </Link>
              <AdminPanel contacts={contacts} orders={orders} workingId={workingId} onStatusChange={updateStatus} onConfirmTransfer={confirmTransfer} archiveReady={archiveReady} showArchived={showArchived} onArchive={archiveOrder} onArchiveView={(value) => { setShowArchived(value); setOrderOffset(0); }} orderOffset={orderOffset} onOrderPage={setOrderOffset} ordersOnly />
              <SuperAdminPanel roles={roles} userId={user.id} currentRole={role} newRole={newRole} setNewRole={setNewRole} targetUserId={userId} setTargetUserId={setUserId} onSubmit={saveRole} onRemove={removeRole} saving={savingRole} workingId={workingId} />
              <AccountRegistrationPanel accounts={accounts} />
              <ActivityPanel activities={activities} />
              <AuditPanel audit={audit} />
            </>
          ) : (
            <>
              <AdminPanel contacts={contacts} orders={orders} workingId={workingId} onStatusChange={updateStatus} onConfirmTransfer={confirmTransfer} archiveReady={archiveReady} showArchived={showArchived} onArchive={archiveOrder} onArchiveView={(value) => { setShowArchived(value); setOrderOffset(0); }} orderOffset={orderOffset} onOrderPage={setOrderOffset} />
              {siteData.ready && !detailsLoading ? (
                <ProductAdminPanel products={siteData.products} product={productForm} setProduct={setProductForm} editing={editingProduct} setEditing={setEditingProduct} saving={savingRole} onSave={saveProduct} onDelete={deleteProduct} onBankSave={saveBankDetails} bankForm={bankForm} setBankForm={setBankForm} />
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-8 text-zinc-600 shadow-2xs">
                  <LoaderCircle className="w-5 h-5 animate-spin text-[#FF6B00]" />
                  <span className="font-semibold text-sm">Katalog und Konfigurationen werden geladen …</span>
                </div>
              )}
              <AccountRegistrationPanel accounts={accounts} />
              <ActivityPanel activities={activities} />
            </>
          )}
        </div>

        {activeView === 'messages' && !loading && canSeeWorkspace && user && (!superAdminOnly || canSeeSuperAdmin) && <SupportMessenger admin />}
        {activeView === 'carts' && !loading && canSeeWorkspace && user && (!superAdminOnly || canSeeSuperAdmin) && <CartDraftsPanel />}
        {activeView === 'statistics' && !loading && canSeeWorkspace && user && (!superAdminOnly || canSeeSuperAdmin) && <AnalyticsDashboard />}
      </div>
    </div>,
    brenLocale
  );
}

function AdminPanel({ contacts, orders, workingId, onStatusChange, onConfirmTransfer, archiveReady, showArchived, onArchive, onArchiveView, orderOffset, onOrderPage, ordersOnly = false }: { archiveReady: boolean; showArchived: boolean; onArchive: (id: number, archived: boolean) => void; onArchiveView: (archived: boolean) => void; orderOffset: number; onOrderPage: (offset: number) => void; ordersOnly?: boolean; contacts: ContactRow[]; orders: OrderRow[]; workingId: string; onStatusChange: (table: 'contact_requests' | 'order_requests', id: number, status: RequestStatus) => void; onConfirmTransfer: (id: number) => void }) {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<>
    {!ordersOnly && (
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Kontaktanfragen', contacts.length, 'E-Mail-Anfragen und Kundenformulare'],
          ['Bestellanfragen', orders.length, 'Über den Shop aufgegebene Bestellungen'],
          ['Ausstehende Bearbeitung', contacts.filter((item) => item.status !== 'done').length + orders.filter((item) => item.status !== 'done').length, 'Vorgänge, die eine Bearbeitung erfordern'],
        ].map(([label, count, sub]) => (
          <article key={String(label)} className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">{String(label)}</p>
              <p className="mt-2 text-4xl font-black text-zinc-950 tracking-tight font-mono">{String(count)}</p>
            </div>
            <p className="mt-4 text-xs font-medium text-stone-500 border-t border-stone-100 pt-3">{String(sub)}</p>
          </article>
        ))}
      </div>
    )}

    {/* Bestellanfragen Panel */}
    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Bestellanfragen</h2>
          <p className="text-xs text-stone-500 font-medium mt-1">Verwaltung von Kundenbestellungen und Zahlungsstatus</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[false, true].map(archived => (
            <button
              key={String(archived)}
              type="button"
              disabled={!!workingId || (archived && !archiveReady)}
              aria-pressed={showArchived === archived}
              onClick={() => onArchiveView(archived)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs disabled:opacity-50 ${
                showArchived === archived
                  ? 'bg-zinc-950 text-white'
                  : 'border border-stone-200 bg-white text-zinc-700 hover:bg-stone-50'
              }`}
            >
              {archived ? orderArchiveCopy[brenLocale].archives : orderArchiveCopy[brenLocale].active}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm font-medium text-stone-500 bg-stone-50 p-6 rounded-xl border border-stone-200/80 text-center">
          {orderArchiveCopy[brenLocale].empty}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const customer = order.customer ?? {};
            const delivery = typeof customer.deliveryFeeCents === 'number' ? { feeCents: customer.deliveryFeeCents } as Record<string, unknown> : customer.delivery && typeof customer.delivery === 'object' ? customer.delivery as Record<string, unknown> : null;
            const items = Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : [];
            const isConfirmed = order.payment_status === 'confirmed';

            return (
              <article key={order.id} className="rounded-2xl border border-stone-200/90 bg-white p-5 lg:p-6 shadow-2xs hover:border-stone-300 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-zinc-950 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                      {order.reference}
                    </span>
                    <span className="text-xs font-semibold text-stone-500 font-mono">
                      {date(order.created_at, brenLocale)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusSelect order value={order.status} disabled={!!workingId || showArchived} onChange={(status) => void onStatusChange('order_requests', order.id, status)} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-bold text-zinc-950 text-base">
                      <span>{text(customer.firstName)} {text(customer.lastName)}</span>
                    </p>
                    <a href={`mailto:${text(customer.email)}`} className="text-[#FF6B00] font-semibold underline text-xs">
                      {text(customer.email)}
                    </a>

                    <div className="mt-3 text-xs text-stone-600 space-y-1">
                      <p><b className="text-zinc-900 font-bold uppercase tracking-wider text-[10px]">Rechnungsadresse:</b></p>
                      <p>{text(customer.street)} {text(customer.addressLine2)}</p>
                      <p>{text(customer.postalCode)} {text(customer.city)} {text(customer.state)}</p>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-stone-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">Bestellte Artikel</p>
                      <ul className="space-y-1 text-xs font-medium text-stone-800">
                        {items.map((item, index) => (
                          <li key={`${order.id}-${index}`} className="flex justify-between gap-2">
                            <span>{text(item.name)}</span>
                            <span className="font-mono font-bold text-zinc-950">× {Number(item.quantity) || 0}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-600">Gesamtbetrag:</span>
                      <span className="text-lg font-black text-zinc-950 font-mono">
                        {new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' }).format(order.total_cents / 100)}
                      </span>
                    </div>
                  </div>
                </div>

                {Boolean(customer.vat) && typeof customer.vat === 'object' && <IncludedVatSummary summary={customer.vat as ReturnType<typeof vatSummary>} locale={brenLocale}/>}
                {delivery && typeof delivery.feeCents === 'number' && (
                  <p className="mt-3 text-xs font-semibold text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                    Lieferung: {new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' }).format(delivery.feeCents / 100)}
                    {typeof delivery.distanceKm === 'number' && <> · <span>{delivery.distanceKm.toFixed(1)} km</span></>}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-bold ${
                      isConfirmed ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-900 border border-amber-500/20'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {paymentStatusLabel(order.payment_status, order.customer)}
                    </span>

                    {!isConfirmed && (
                      <button
                        type="button"
                        disabled={!!workingId || showArchived}
                        onClick={() => onConfirmTransfer(order.id)}
                        className="rounded-xl bg-zinc-950 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all"
                      >
                        {workingId === `payment-${order.id}` ? 'Wird geprüft …' : 'Zahlungseingang bestätigen'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <AdminPaymentProof reference={order.reference} />
                    <button
                      type="button"
                      disabled={!!workingId || !archiveReady}
                      onClick={() => onArchive(order.id, !showArchived)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-all shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{showArchived ? orderArchiveCopy[brenLocale].restore : orderArchiveCopy[brenLocale].remove}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
        <button type="button" disabled={orderOffset === 0 || !!workingId} onClick={() => onOrderPage(Math.max(0, orderOffset - 100))} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-stone-50 disabled:opacity-40">
          {analyticsCopy[brenLocale].previous}
        </button>
        <span className="text-xs font-mono font-bold text-stone-500">
          {orders.length ? orderOffset + 1 : 0}–{orderOffset + orders.length}
        </span>
        <button type="button" disabled={orders.length < 100 || !!workingId} onClick={() => onOrderPage(orderOffset + 100)} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-stone-50 disabled:opacity-40">
          {orderArchiveCopy[brenLocale].more}
        </button>
      </div>
    </section>

    {!ordersOnly && (
      <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
        <h2 id="contact-requests" className="scroll-mt-32 text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Kontaktanfragen</h2>
        {contacts.length === 0 ? (
          <p className="mt-4 text-sm font-medium text-stone-500 bg-stone-50 p-6 rounded-xl border border-stone-200/80 text-center">Bislang keine Kontaktanfragen eingegangen.</p>
        ) : (
          <div tabIndex={0} className="mt-4 space-y-3">
            {contacts.map((item) => (
              <article key={item.id} className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs hover:border-stone-300 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <p className="font-bold text-zinc-950 text-base">
                      <span>{item.name}</span> · <span className="text-xs uppercase font-mono font-bold text-[#FF6B00]">{subjectLabels[item.subject] ?? item.subject}</span>
                    </p>
                    <p className="mt-1 text-xs text-stone-500 font-mono">
                      {date(item.created_at, brenLocale)} · <a className="text-[#FF6B00] underline font-semibold" href={`mailto:${item.email}`}>{item.email}</a>
                      {item.phone ? ` · ${item.phone}` : ''}{item.postal_code ? ` · ${item.postal_code}` : ''}
                    </p>
                  </div>
                  <StatusSelect value={item.status} disabled={workingId === `contact_requests-${item.id}`} onChange={(status) => void onStatusChange('contact_requests', item.id, status)} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 bg-[#F8FAFC] p-4 rounded-xl border border-stone-100 font-sans">
                  {item.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    )}
  </>, brenLocale);
}

function SuperAdminPanel({ roles, userId, currentRole, newRole, setNewRole, targetUserId, setTargetUserId, onSubmit, onRemove, saving, workingId }: {
  roles: RoleRow[]; userId: string; currentRole: Role | null; newRole: Role; setNewRole: (role: Role) => void; targetUserId: string; setTargetUserId: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onRemove: (userId: string) => void; saving: boolean; workingId: string;
}) {
  const brenLocale = useLocale() as Locale;

  const visibleRoles = roles.filter((entry) => currentRole === 'owner' || entry.role !== 'owner');
  const roleGroups: { role: Role; title: string }[] = [
    ...(currentRole === 'owner' ? [{ role: 'owner' as const, title: 'Inhaber (Owner)' }] : []),
    { role: 'super_admin', title: 'Super-Administratoren' },
    { role: 'admin', title: 'Administratoren' },
  ];

  return localizeNode(<>
    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Rolle zuweisen oder ändern</h2>
      <p className="mt-1 text-xs text-stone-500 font-medium max-w-3xl">
        Geben Sie die E-Mail-Adresse eines registrierten Benutzerkontos ein, um ihm Administratorrechte zuzuweisen.
      </p>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_190px_auto]">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
          E-Mail-Adresse des Benutzers
          <input required type="email" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="administrator@beispiel.de" className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none" />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
          Zuzuweisende Rolle
          <select value={newRole} onChange={(event) => setNewRole(event.target.value as Role)} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none">
            <option value="admin">Administrator</option>
            <option value="super_admin">Super-Administrator</option>
            {currentRole === 'owner' && <option value="owner">Inhaber (Owner)</option>}
          </select>
        </label>
        <button type="submit" disabled={saving} className="self-end rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-60 transition-all">
          {saving ? 'Wird gespeichert...' : 'Rolle speichern'}
        </button>
      </form>
    </section>

    {roleGroups.map((group) => {
      const entries = visibleRoles.filter((entry) => entry.role === group.role);
      return (
        <section key={group.role} className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
          <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">{group.title}</h2>
          {entries.length === 0 ? (
            <p className="mt-4 text-xs font-medium text-stone-500 bg-stone-50 p-4 rounded-xl border border-stone-200/80">Keine Konten in dieser Kategorie.</p>
          ) : (
            <div tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F9FAFB] text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Benutzer-UUID</th>
                    <th className="px-4 py-3">Rolle</th>
                    <th className="px-4 py-3">Erstellt am</th>
                    <th className="px-4 py-3 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {entries.map((entry) => (
                    <tr key={entry.user_id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-zinc-900 break-all">{entry.user_id}</td>
                      <td className="px-4 py-3 font-bold">
                        <span className="bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-1 rounded-md text-xs font-mono">
                          {entry.role === 'owner' ? 'Inhaber' : entry.role === 'super_admin' ? 'Super-Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 font-mono text-xs">{date(entry.created_at, brenLocale)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={entry.user_id === userId || workingId === entry.user_id}
                          onClick={() => void onRemove(entry.user_id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40 transition-all shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Entfernen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      );
    })}
  </>, brenLocale);
}

function ActivityPanel({ activities }: { activities: ActivityRow[] }) {
  const brenLocale = useLocale() as Locale;
  const onlineCutoff = Date.now() - 2 * 60_000;

  return localizeNode(
    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Kürzliche Kontoaktivität</h2>
      <p className="mt-1 text-xs text-stone-500 font-medium">
        Ein Konto wird als online angezeigt, wenn es in den letzten 2 Minuten aktiv war.
      </p>
      {activities.length === 0 ? (
        <p className="mt-4 text-xs font-medium text-stone-500 bg-stone-50 p-4 rounded-xl border border-stone-200/80">Keine Aktivität aufgezeichnet.</p>
      ) : (
        <div tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F9FAFB] text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Konto</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Letzte Aktivität</th>
                <th className="px-4 py-3">Anmeldungen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activities.map((entry) => {
                const isOnline = new Date(entry.last_seen_at).getTime() > onlineCutoff;
                return (
                  <tr key={entry.user_id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{entry.email ?? entry.user_id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold font-mono ${
                        isOnline ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 font-mono text-xs">{date(entry.last_seen_at, brenLocale)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-zinc-900">{entry.sign_in_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>,
    brenLocale
  );
}

function AccountRegistrationPanel({ accounts }: { accounts: ClientAccountRow[] }) {
  const brenLocale = useLocale() as Locale;

  return localizeNode(
    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Registrierte Kundenkonten</h2>
      <p className="mt-1 text-xs text-stone-500 font-medium">Liste der auf der Plattform registrierten Kunden.</p>
      {accounts.length === 0 ? (
        <p className="mt-4 text-xs font-medium text-stone-500 bg-stone-50 p-4 rounded-xl border border-stone-200/80">Keine Registrierungen gefunden.</p>
      ) : (
        <div tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F9FAFB] text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Registriert am</th>
                <th className="px-4 py-3">UUID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {accounts.map((account) => (
                <tr key={account.user_id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-zinc-900">{account.full_name || '—'}</td>
                  <td className="px-4 py-3 text-stone-700">{account.email || '—'}</td>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs">{date(account.created_at, brenLocale)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-600 break-all">{account.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>,
    brenLocale
  );
}

function AuditPanel({ audit }: { audit: AuditRow[] }) {
  const brenLocale = useLocale() as Locale;
  const actionNames: Record<string, string> = { insert: 'Erstellung', update: 'Änderung', delete: 'Löschung' };

  return localizeNode(
    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Administratives Audit-Protokoll</h2>
      <p className="mt-1 text-xs text-stone-500 font-medium">Historie der in der Konsole durchgeführten Änderungen.</p>
      {audit.length === 0 ? (
        <p className="mt-4 text-xs font-medium text-stone-500 bg-stone-50 p-4 rounded-xl border border-stone-200/80">Keine Aktionen im Protokoll aufgezeichnet.</p>
      ) : (
        <div tabIndex={0} className="mt-4 space-y-3">
          {audit.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-stone-200/80 bg-[#F8FAFC] p-4 text-xs shadow-2xs">
              <div className="flex flex-wrap justify-between gap-2 font-bold text-zinc-900">
                <span>{actionNames[entry.action] ?? entry.action} · <span className="font-mono text-[#FF6B00]">{entry.entity}</span></span>
                <time className="text-stone-500 font-mono font-normal">{date(entry.created_at, brenLocale)}</time>
              </div>
              <p className="mt-1 text-stone-600 font-mono">
                Autor: {entry.actor_user_id ?? 'System'} · Entitäts-ID: {entry.entity_id ?? '—'}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-bold text-[#FF6B00] hover:underline">JSON-Details anzeigen</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-white p-3 font-mono text-[11px] border border-stone-200">
                  {JSON.stringify(entry.details, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>,
    brenLocale
  );
}

function ProductAdminPanel({ products, product, setProduct, editing, setEditing, saving, onSave, onDelete, onBankSave, bankForm, setBankForm }: {
  products: Product[]; product: Product; setProduct: (product: Product) => void; editing: boolean; setEditing: (editing: boolean) => void; saving: boolean;
  onSave: (event: FormEvent<HTMLFormElement>) => void; onDelete: (id: number | number[]) => void; onBankSave: (event: FormEvent<HTMLFormElement>) => Promise<boolean>; bankForm: string; setBankForm: (value: string) => void;
}) {
  const brenLocale = useLocale() as Locale;
  const [bankSaved, setBankSaved] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectedProducts = products.filter((item) => selectedIds.includes(item.id));
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const inputClass = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none transition-all';

  return localizeNode(<>
    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Katalog &amp; Bestände</h2>
          <p className="text-xs text-stone-500 font-medium">Verwalten Sie Produktverfügbarkeit und Preise</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
            <input type="checkbox" checked={allSelected} disabled={saving || products.length === 0} ref={(element) => { if (element) element.indeterminate = selectedProducts.length > 0 && !allSelected; }} onChange={(event) => setSelectedIds(event.target.checked ? products.map((item) => item.id) : [])} className="h-4 w-4 rounded accent-[#FF6B00]" />
            Alle auswählen
          </label>
          <span className="text-xs font-mono font-bold text-stone-500">({selectedProducts.length} ausgew.)</span>
          <button type="button" disabled={saving || selectedProducts.length === 0} onClick={() => onDelete(selectedProducts.map((item) => item.id))} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-red-700 disabled:opacity-50 transition-all">
            {saving ? 'Bitte warten...' : 'Löschen'}
          </button>
        </div>
      </div>

      <div tabIndex={0} role="region" aria-label="Produktkatalog" className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#F9FAFB] text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
            <tr>
              <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Auswählen</span></th>
              <th scope="col" className="px-3 py-3">Produkt</th>
              <th scope="col" className="px-3 py-3">Preis &amp; Bestand</th>
              <th scope="col" className="px-3 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((item) => (
              <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                <td className="px-3 py-3">
                  <input type="checkbox" aria-label={`${item.name} auswählen`} checked={selectedIds.includes(item.id)} disabled={saving} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} className="h-4 w-4 rounded accent-[#FF6B00]" />
                </td>
                <td className="px-3 py-3 font-bold text-zinc-950">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">#{item.id}</span>
                    <span>{item.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="font-bold text-zinc-950 font-mono">{item.price}</span>
                  <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                    {item.stock === 0 ? 'Ausverkauft' : item.stock !== undefined ? `${item.stock} auf Lager` : item.availability ?? 'Bestand nicht erfasst'}
                  </p>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" disabled={saving} onClick={() => { setProduct({ ...item, priceAmount: item.priceAmount ?? 0, stock: item.stock ?? -1 }); setEditing(true); document.getElementById('catalog-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-stone-50 shadow-2xs">
                      Bearbeiten
                    </button>
                    <button type="button" disabled={saving} onClick={() => onDelete(item.id)} className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 shadow-2xs">
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form id="catalog-product-form" onSubmit={onSave} className="scroll-mt-24 mt-6 rounded-2xl bg-[#F8FAFC] border border-stone-200 p-5 shadow-2xs">
        <h3 className="text-lg font-black text-zinc-950 tracking-tight">{editing ? 'Ausgewähltes Produkt bearbeiten' : 'Neues Produkt hinzufügen'}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Produkt-ID (numerisch)<input required type="number" min="1" value={product.id} onChange={(e) => setProduct({ ...product, id: Number(e.target.value) })} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Produktname<input required value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Kategorie<input required value={product.type} onChange={(e) => setProduct({ ...product, type: e.target.value })} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Verpackung / Gebinde<input required value={product.quantity} onChange={(e) => setProduct({ ...product, quantity: e.target.value })} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Preis in Cent (z. B. 49900 = 499,00 €)<input type="number" min="0" value={product.priceAmount ?? 0} onChange={(e) => setProduct({ ...product, priceAmount: Number(e.target.value) })} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Bestand (-1 = nicht erfasst, 0 = ausverkauft)<input required type="number" min="-1" value={product.stock ?? -1} onChange={(e) => { const stock = Number(e.target.value); setProduct({ ...product, stock, availability: stock < 0 ? (product.availability === 'Ausverkauft' ? undefined : product.availability) : stock === 0 ? 'Ausverkauft' : 'Auf Lager' }); }} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600 sm:col-span-2">Hauptbild (lokaler Pfad z. B. /pellets.webp)<input required value={product.image} onChange={(e) => setProduct({ ...product, image: e.target.value })} className={inputClass} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600 sm:col-span-2">Ausführliche Beschreibung<textarea required rows={3} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} className={inputClass} /></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all">
            {saving ? 'Wird gespeichert...' : 'Produkt speichern'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(false); setProduct(emptyProduct(products)); }} className="rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-zinc-800 hover:bg-stone-50 transition-all shadow-2xs">
              Zurücksetzen
            </button>
          )}
        </div>
      </form>
    </section>

    <section className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
      <h2 className="text-xl lg:text-2xl font-black text-zinc-950 tracking-tight">Bankverbindung für Überweisungen</h2>
      <form onSubmit={async (event) => { setBankSaved(false); setBankSaved(await onBankSave(event)); }} className="mt-4">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
          Bankdaten (IBAN, BIC) &amp; Anweisungen bei Zahlung
          <textarea rows={5} value={bankForm} disabled={saving} onChange={(e) => { setBankSaved(false); setBankForm(e.target.value); }} placeholder="Empfänger, IBAN, BIC und obligatorischer Verwendungszweck..." className={inputClass} />
        </label>
        <div className="mt-4 flex items-center gap-4">
          <button type="submit" disabled={saving} className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all">
            {saving ? 'Wird gespeichert...' : 'Bankdaten speichern'}
          </button>
          {bankSaved && <p role="status" className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">Erfolgreich gespeichert.</p>}
        </div>
      </form>
    </section>
  </>, brenLocale);
}
