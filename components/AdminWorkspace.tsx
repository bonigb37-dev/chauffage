'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  Flame,
  LoaderCircle,
  Menu,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  User as UserIcon,
  UserMinus,
  X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/CartProvider';
import type { Product } from '@/lib/products';
import AdminPaymentProof from '@/components/AdminPaymentProof';
import AdminSidebar, { type TabType } from '@/components/AdminSidebar';
import { clearCachedRole } from '@/components/RoleAccessGuard';
import AdminConfirmModal, { type ConfirmVariant } from '@/components/AdminConfirmModal';
import SupportMessenger from '@/components/SupportMessenger';
import SupportNotifications from '@/components/SupportNotifications';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

// Types
export type Role = 'admin' | 'super_admin' | 'owner';
export type RequestStatus = 'new' | 'in_progress' | 'done';
export type RoleRow = { user_id: string; role: Role; created_at: string };
export type ContactRow = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  postal_code: string | null;
  subject: string;
  message: string;
  status: RequestStatus;
};
export type OrderRow = {
  id: number;
  created_at: string;
  reference: string;
  customer: Record<string, unknown>;
  shipping: Record<string, unknown> | null;
  items: unknown;
  total_cents: number;
  status: RequestStatus;
  payment_status: string;
  archived_at?: string | null;
};
export type ActivityRow = {
  user_id: string;
  email: string | null;
  first_seen_at: string;
  last_seen_at: string;
  sign_in_count: number;
};
export type ClientAccountRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};
export type UnifiedUser = {
  user_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'super_admin' | 'admin' | 'client';
  created_at: string;
  last_seen_at?: string;
  sign_in_count?: number;
};
export type AuditRow = {
  id: number;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const statusLabels: Record<RequestStatus, string> = {
  new: 'Nouvelle',
  in_progress: 'En cours',
  done: 'Traitée',
};

const subjectLabels: Record<string, string> = {
  product: 'Information produit',
  quote: 'Devis',
  delivery: 'Livraison',
  order: 'Commande',
  claim: 'Réclamation',
  other: 'Autre',
};

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'À l’instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  } catch {
    return dateString;
  }
}

function emptyProduct(products: Product[]): Product {
  const maxId = products.reduce((max, item) => Math.max(max, item.id), 0);
  return {
    id: maxId + 1,
    name: '',
    type: 'Granulés',
    quantity: '',
    price: 'Sur devis',
    priceAmount: 0,
    description: '',
    image: '/pellets.webp',
    stock: -1,
  };
}

export default function AdminWorkspace({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const brenLocale = useLocale() as Locale;
  const router = useRouter();
  const siteData = useCart();

  // Authentication & Access States
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mobile Sidebar Toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>(superAdminOnly ? 'users' : 'overview');

  // Business Data States
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [accounts, setAccounts] = useState<ClientAccountRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [bankForm, setBankForm] = useState('');
  const [bankSaved, setBankSaved] = useState(false);

  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === '#support-messages') setActiveTab('support');
      else if (window.location.hash === '#site-statistics') setActiveTab('analytics');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  // Forms and Modals
  const [workingId, setWorkingId] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('admin');
  const [savingRole, setSavingRole] = useState(false);

  // Product Editing
  const [productForm, setProductForm] = useState<Product>(() => emptyProduct(siteData.products));
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | RequestStatus>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | RequestStatus>('all');

  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admins' | 'clients'>('all');
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    requireMatchText?: string;
    requireMatchPlaceholder?: string;
    action?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: null,
  });

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // 1. Data Loader
  const loadData = useCallback(async (activeUser: User | null) => {
    if (!supabase) {
      setError('Supabase n’est pas configuré sur cette version du site.');
      setLoading(false);
      return;
    }
    if (!activeUser) {
      setLoading(false);
      return;
    }

    setError('');
    setIsRefreshing(true);

    try {
      const roleResult = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      if (roleResult.error) {
        setError('Impossible de vérifier votre rôle administratif.');
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const currentRole = roleResult.data?.role as Role | undefined;
      setRole(currentRole ?? null);

      if (!currentRole) {
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const isOwnerOrSuperAdmin = currentRole === 'owner' || currentRole === 'super_admin';

      const [
        contactRes,
        orderRes,
        activityRes,
        accountRes,
        settingsRes,
        roleRes,
        auditRes,
      ] = await Promise.all([
        supabase
          .from('contact_requests')
          .select('id, created_at, name, email, phone, postal_code, subject, message, status')
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('order_requests')
          .select('id, created_at, reference, customer, shipping, items, total_cents, status, payment_status, archived_at')
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('user_activity')
          .select('user_id, email, first_seen_at, last_seen_at, sign_in_count')
          .order('last_seen_at', { ascending: false })
          .limit(200),
        supabase
          .from('client_accounts')
          .select('user_id, email, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('site_settings').select('value').eq('key', 'bank_transfer').maybeSingle(),
        isOwnerOrSuperAdmin
          ? supabase
              .from('admin_roles')
              .select('user_id, role, created_at')
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] }),
        isOwnerOrSuperAdmin
          ? supabase
              .from('admin_audit_log')
              .select('id, actor_user_id, actor_role, action, entity, entity_id, details, created_at')
              .order('created_at', { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] }),
      ]);

      if (!contactRes.error && contactRes.data) setContacts(contactRes.data as ContactRow[]);
      if (!orderRes.error && orderRes.data) setOrders(orderRes.data as OrderRow[]);
      if (activityRes.data) setActivities(activityRes.data as ActivityRow[]);
      if (accountRes.data) setAccounts(accountRes.data as ClientAccountRow[]);
      if (settingsRes.data && (settingsRes.data as { value?: { details?: string } }).value?.details) {
        setBankForm(String((settingsRes.data as { value?: { details?: string } }).value?.details));
      }

      if (isOwnerOrSuperAdmin) {
        if (roleRes.data) setRoles(roleRes.data as RoleRow[]);
        if (auditRes.data) setAudit(auditRes.data as AuditRow[]);
      }
    } catch {
      setError('Une erreur est survenue lors de la synchronisation des données.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 2. Auth state subscription
  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const refresh = async (currentUser: User | null) => {
      if (!active) return;
      setUser(currentUser);
      if (currentUser) {
        await loadData(currentUser);
      } else {
        setRole(null);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => refresh(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void refresh(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadData]);

  // 3. Actions: Update Order / Contact status
  async function handleUpdateStatus(
    table: 'contact_requests' | 'order_requests',
    id: number,
    newStatus: RequestStatus
  ) {
    if (!supabase) return;
    const key = `${table}-${id}`;
    setWorkingId(key);
    setError('');

    const { error: updateError } = await supabase.from(table).update({ status: newStatus }).eq('id', id);

    if (updateError) {
      setError('Le statut n’a pas pu être modifié. Vérifiez vos autorisations.');
    } else {
      if (table === 'contact_requests') {
        setContacts((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      } else {
        setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      }
      setNotice('Statut mis à jour avec succès.');
      setTimeout(() => setNotice(''), 3000);
    }
    setWorkingId('');
  }

  // 4. Actions: Confirm Bank Transfer
  async function handleConfirmTransfer(orderId: number) {
    if (!supabase) return;
    const targetOrder = orders.find((o) => o.id === orderId);

    setConfirmModal({
      isOpen: true,
      title: 'Validation de virement bancaire',
      variant: 'success',
      confirmLabel: 'Confirmer la réception',
      cancelLabel: 'Annuler',
      description: (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Confirmez-vous que les fonds pour cette commande ont bien été crédités sur le compte bancaire de l’entreprise ?
          </p>
          <div className="rounded-xl bg-[#17212B] border border-white/10 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Référence de commande</span>
              <span className="font-mono font-bold text-white">{targetOrder?.reference || `#${orderId}`}</span>
            </div>
            {targetOrder?.total_cents && (
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-zinc-400">Montant total</span>
                <span className="font-bold text-emerald-400">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                    targetOrder.total_cents / 100
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
      action: async () => {
        if (!supabase) return;
        const key = `payment-${orderId}`;
        setWorkingId(key);
        setError('');
        try {
          const { data, error: confirmationError } = await supabase.rpc('confirm_bank_transfer', {
            p_order_request_id: orderId,
            p_note: 'Vérifié manuellement par le propriétaire',
          });

          if (confirmationError) {
            setError('Le virement n’a pas pu être confirmé. Vérifiez les droits administrateur.');
          } else {
            setOrders((prev) =>
              prev.map((item) =>
                item.id === orderId ? { ...item, payment_status: String(data ?? 'confirmed') } : item
              )
            );
            setNotice('Virement validé avec succès.');
            setTimeout(() => setNotice(''), 3000);
          }
        } finally {
          setWorkingId('');
          closeConfirmModal();
        }
      },
    });
  }

  // 4b. Actions: Archive / Restore Order
  async function handleArchiveOrder(id: number, archived: boolean) {
    if (!supabase || workingId) return;
    const order = orders.find((row) => row.id === id);
    if (!order) return;

    setConfirmModal({
      isOpen: true,
      title: archived ? 'Archiver la commande' : 'Restaurer la commande',
      variant: archived ? 'warning' : 'role',
      confirmLabel: archived ? 'Confirmer l’archivage' : 'Restaurer la commande',
      cancelLabel: 'Annuler',
      description: (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            {archived
              ? `Souhaitez-vous archiver la commande ${order.reference} ? Elle ne sera plus affichée dans la liste principale des commandes en cours.`
              : `Souhaitez-vous restaurer la commande ${order.reference} parmi les commandes actives ?`}
          </p>
          <div className="rounded-xl bg-[#17212B] border border-white/10 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Référence</span>
              <span className="font-mono font-bold text-white">{order.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Client</span>
              <span className="text-zinc-200">
                {safeText(order.customer?.firstName)} {safeText(order.customer?.lastName)}
              </span>
            </div>
          </div>
        </div>
      ),
      action: async () => {
        if (!supabase) return;
        setWorkingId(`archive-${id}`);
        setError('');
        setNotice('');
        try {
          const result = await supabase.rpc('set_order_archived', { p_order_id: id, p_archived: archived });
          if (result.error) {
            setError('Impossible de modifier le statut d’archivage de la commande.');
            return;
          }
          setOrders((rows) =>
            rows.map((r) => (r.id === id ? { ...r, archived_at: archived ? new Date().toISOString() : null } : r))
          );
          setNotice(archived ? 'Commande archivée avec succès.' : 'Commande restaurée avec succès.');
          setTimeout(() => setNotice(''), 3000);
        } catch {
          setError('Erreur lors de l’archivage.');
        } finally {
          setWorkingId('');
          closeConfirmModal();
        }
      },
    });
  }

  // 5. Actions: Save / Update Role
  async function handleSaveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const email = targetUserEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    setSavingRole(true);
    setError('');

    try {
      const { data: account, error: lookupError } = await supabase
        .from('client_accounts')
        .select('user_id')
        .ilike('email', email.replace(/[\\%_]/g, '\\$&'))
        .maybeSingle();

      if (lookupError || !account) {
        setError('Aucun compte trouvé avec cet email. L’utilisateur doit d’abord s’inscrire sur le site.');
        setSavingRole(false);
        return;
      }

      if (account.user_id === user?.id && newRole !== role) {
        setError('Par mesure de sécurité, vous ne pouvez pas rétrograder votre propre compte.');
        setSavingRole(false);
        return;
      }

      if (newRole === 'owner' && role !== 'owner') {
        setError('Seul un propriétaire (Owner) peut promouvoir un autre Owner.');
        setSavingRole(false);
        return;
      }

      const { error: saveError } = await supabase
        .from('admin_roles')
        .upsert({ user_id: account.user_id, role: newRole }, { onConflict: 'user_id' });

      if (saveError) {
        setError('Impossible d’enregistrer le rôle.');
      } else {
        setTargetUserEmail('');
        setNotice(`Rôle « ${newRole} » attribué à ${email}.`);
        setTimeout(() => setNotice(''), 3500);
        await loadData(user);
      }
    } catch {
      setError('Une erreur est survenue lors de l’attribution du rôle.');
    } finally {
      setSavingRole(false);
    }
  }

  // 6. Actions: Set or update any user's role directly (Client <-> Admin <-> Super Admin)
  async function handleSetUserRole(
    targetUserId: string,
    targetEmail: string,
    newTargetRole: 'client' | 'admin' | 'super_admin'
  ) {
    if (!supabase || !user) return;

    if (role !== 'owner' && role !== 'super_admin') {
      setError('Droits insuffisants : seuls le Propriétaire et les Super Administrateurs peuvent modifier les rôles.');
      return;
    }

    if (targetUserId === user.id) {
      setError('Sécurité : vous ne pouvez pas modifier votre propre rôle.');
      return;
    }

    const currentTargetRole = roles.find((r) => r.user_id === targetUserId)?.role || 'client';

    if (currentTargetRole === 'owner') {
      setError('Sécurité : le rôle de Propriétaire (Owner) est strictement protégé.');
      return;
    }

    if (role === 'super_admin' && (newTargetRole === 'super_admin' || currentTargetRole === 'super_admin')) {
      setError('Droits insuffisants : seul le Propriétaire (Owner) peut nommer ou modifier un Super Administrateur.');
      return;
    }

    const targetRoleLabel =
      newTargetRole === 'super_admin'
        ? 'Super Administrateur'
        : newTargetRole === 'admin'
        ? 'Administrateur'
        : 'Client simple';

    const isDemotion = newTargetRole === 'client';

    setConfirmModal({
      isOpen: true,
      title: isDemotion ? 'Rétrograder un administrateur' : 'Attribution d’accréditation',
      variant: isDemotion ? 'danger' : 'role',
      confirmLabel: isDemotion ? 'Confirmer la rétrogradation' : `Nommer ${targetRoleLabel}`,
      cancelLabel: 'Annuler',
      description: (
        <div className="space-y-3.5">
          <p className="text-sm text-zinc-300">
            {isDemotion
              ? 'Confirmer l’opération : souhaitez-vous vraiment retirer les privilèges et rétrograder ce compte ?'
              : 'Confirmer l’opération : souhaitez-vous vraiment attribuer cette accréditation ?'}
          </p>
          <div className="rounded-xl bg-[#17212B] border border-white/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Compte utilisateur</span>
              <span className="font-mono font-bold text-white truncate max-w-[240px]">
                {targetEmail || targetUserId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
              <span className="text-zinc-400">Nouvelle accréditation</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  newTargetRole === 'super_admin'
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    : newTargetRole === 'admin'
                    ? 'bg-[#FF6B00]/15 text-[#FF9547] border border-[#FF6B00]/30'
                    : 'bg-white/10 text-zinc-300'
                }`}
              >
                {targetRoleLabel}
              </span>
            </div>
          </div>
          {isDemotion && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              L’utilisateur perdra immédiatement tous ses privilèges d’accès à la console de direction.
            </p>
          )}
        </div>
      ),
      action: async () => {
        if (!supabase) return;
        setWorkingId(`role-${targetUserId}`);
        setError('');

        try {
          if (newTargetRole === 'client') {
            const { error: delError } = await supabase.from('admin_roles').delete().eq('user_id', targetUserId);
            if (delError) {
              setError('Impossible de révoquer les privilèges.');
            } else {
              setNotice(`L’utilisateur ${targetEmail || targetUserId} a été rétrogradé en Client.`);
              setTimeout(() => setNotice(''), 3500);
              await loadData(user);
            }
          } else {
            const { error: upsertError } = await supabase
              .from('admin_roles')
              .upsert({ user_id: targetUserId, role: newTargetRole }, { onConflict: 'user_id' });

            if (upsertError) {
              setError('Impossible d’enregistrer le nouveau rôle.');
            } else {
              setNotice(
                `L’utilisateur ${targetEmail || targetUserId} a été nommé ${
                  newTargetRole === 'admin' ? 'Administrateur' : 'Super Administrateur'
                }.`
              );
              setTimeout(() => setNotice(''), 3500);
              await loadData(user);
            }
          }
        } catch {
          setError('Erreur lors de la modification du rôle.');
        } finally {
          setWorkingId('');
          closeConfirmModal();
        }
      },
    });
  }

  // 7. Actions: Save Bank Settings
  async function handleSaveBankDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSavingRole(true);
    setError('');

    try {
      const { data, error: saveError } = await supabase
        .from('site_settings')
        .update({ value: { details: bankForm }, updated_at: new Date().toISOString() })
        .eq('key', 'bank_transfer')
        .select('key')
        .single();

      if (saveError || !data) {
        setError('Les coordonnées bancaires n’ont pas pu être enregistrées.');
      } else {
        setBankSaved(true);
        setNotice('Coordonnées bancaires enregistrées avec succès.');
        setTimeout(() => {
          setBankSaved(false);
          setNotice('');
        }, 3000);
      }
    } catch {
      setError('Erreur lors de la sauvegarde bancaire.');
    } finally {
      setSavingRole(false);
    }
  }

  // 8. Actions: Save Product
  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSavingProduct(true);
    setError('');

    const p = {
      ...productForm,
      priceAmount: productForm.priceAmount ? productForm.priceAmount : null,
      stock: productForm.stock !== undefined && productForm.stock < 0 ? null : productForm.stock,
    };
    const data = {
      ...p,
      price: typeof p.priceAmount === 'number' ? euros.format(p.priceAmount / 100) : 'Sur devis',
    };

    const { error: saveError } = await supabase
      .from('product_overrides')
      .upsert(
        { product_id: p.id, data, is_deleted: false, updated_at: new Date().toISOString() },
        { onConflict: 'product_id' }
      );

    if (saveError) {
      setError('Le produit n’a pas pu être enregistré.');
      setSavingProduct(false);
    } else {
      setNotice('Produit enregistré avec succès.');
      setShowProductForm(false);
      setIsEditingProduct(false);
      setProductForm(emptyProduct(siteData.products));
      setTimeout(() => setNotice(''), 3000);
      window.location.reload();
    }
  }

  // 9. Actions: Delete Product(s)
  async function handleDeleteProduct(productId: number | number[]) {
    const ids = [...new Set(Array.isArray(productId) ? productId : [productId])];
    if (ids.length === 0) return;

    if (ids.length === siteData.products.length) {
      setConfirmModal({
        isOpen: true,
        title: 'Suppression intégrale du catalogue',
        variant: 'danger',
        confirmLabel: 'Supprimer tout le catalogue',
        cancelLabel: 'Annuler',
        requireMatchText: 'SUPPRIMER TOUT',
        requireMatchPlaceholder: 'SUPPRIMER TOUT',
        description: (
          <div className="space-y-3">
            <p className="text-sm text-rose-300 font-semibold">
              Attention : vous êtes sur le point de supprimer l’intégralité des {ids.length} produits du catalogue.
            </p>
            <p className="text-xs text-zinc-400">
              Tous les produits cesseront immédiatement d’être disponibles sur la boutique en ligne.
            </p>
          </div>
        ),
        action: async () => {
          await executeDeleteProducts(ids);
        },
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: ids.length === 1 ? 'Retirer ce produit' : `Retirer ${ids.length} produits`,
        variant: 'danger',
        confirmLabel: 'Confirmer le retrait',
        cancelLabel: 'Annuler',
        description: (
          <p className="text-sm text-zinc-300">
            {ids.length === 1
              ? 'Êtes-vous certain de vouloir retirer ce produit du catalogue ?'
              : `Êtes-vous certain de vouloir retirer ces ${ids.length} produits du catalogue ?`}
          </p>
        ),
        action: async () => {
          await executeDeleteProducts(ids);
        },
      });
    }
  }

  async function executeDeleteProducts(ids: number[]) {
    if (!supabase) return;
    setSavingProduct(true);
    setError('');

    try {
      const updatedAt = new Date().toISOString();
      const { error: deleteError } = await supabase.from('product_overrides').upsert(
        ids.map((id) => ({ product_id: id, data: {}, is_deleted: true, updated_at: updatedAt })),
        { onConflict: 'product_id' }
      );

      if (deleteError) {
        setError('Impossible de supprimer les produits.');
      } else {
        setNotice('Produits supprimés.');
        setTimeout(() => setNotice(''), 3000);
        window.location.reload();
      }
    } catch {
      setError('Erreur lors de la suppression.');
    } finally {
      setSavingProduct(false);
      closeConfirmModal();
    }
  }

  // 10. Actions: Sign Out
  async function handleSignOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setError('');
    try {
      clearCachedRole();
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      router.replace('/compte');
      router.refresh();
    } catch {
      setError('La déconnexion a échoué.');
    } finally {
      setSigningOut(false);
    }
  }

  // KPIs
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status !== 'done').length,
    [orders]
  );
  const pendingTransferTotalCents = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status !== 'confirmed')
        .reduce((sum, o) => sum + (o.total_cents || 0), 0),
    [orders]
  );
  const pendingContactsCount = useMemo(
    () => contacts.filter((c) => c.status !== 'done').length,
    [contacts]
  );
  const onlineCutoff = Date.now() - 2 * 60_000;
  const onlineUsersCount = useMemo(
    () => activities.filter((a) => new Date(a.last_seen_at).getTime() > onlineCutoff).length,
    [activities, onlineCutoff]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (showArchived) {
        if (!order.archived_at) return false;
      } else {
        if (order.archived_at) return false;
      }
      const customer = order.customer ?? {};
      const searchTerms = `${order.reference} ${safeText(customer.firstName)} ${safeText(
        customer.lastName
      )} ${safeText(customer.email)}`.toLowerCase();
      const matchesSearch = !orderSearch || searchTerms.includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const matchesPayment =
        orderPaymentFilter === 'all' ||
        (orderPaymentFilter === 'confirmed'
          ? order.payment_status === 'confirmed'
          : order.payment_status !== 'confirmed');
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, showArchived, orderSearch, orderStatusFilter, orderPaymentFilter]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const searchTerms = `${contact.name} ${contact.email} ${contact.message} ${contact.subject}`.toLowerCase();
      const matchesSearch = !contactSearch || searchTerms.includes(contactSearch.toLowerCase());
      const matchesStatus = contactStatusFilter === 'all' || contact.status === contactStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, contactSearch, contactStatusFilter]);

  // Unified Users Directory (All users: Owners, Super Admins, Admins, Clients)
  const unifiedUsers = useMemo<UnifiedUser[]>(() => {
    const roleMap = new Map<string, Role>();
    roles.forEach((r) => roleMap.set(r.user_id, r.role));

    const actMap = new Map<string, ActivityRow>();
    activities.forEach((a) => actMap.set(a.user_id, a));

    const userMap = new Map<string, UnifiedUser>();

    // 1. All registered clients in client_accounts
    accounts.forEach((acc) => {
      const assignedRole = roleMap.get(acc.user_id) || 'client';
      const act = actMap.get(acc.user_id);
      userMap.set(acc.user_id, {
        user_id: acc.user_id,
        email: acc.email || '',
        full_name: acc.full_name || '',
        role: assignedRole,
        created_at: acc.created_at,
        last_seen_at: act?.last_seen_at,
        sign_in_count: act?.sign_in_count,
      });
    });

    // 2. Any admins not in client_accounts
    roles.forEach((r) => {
      if (!userMap.has(r.user_id)) {
        const act = actMap.get(r.user_id);
        userMap.set(r.user_id, {
          user_id: r.user_id,
          email: act?.email || r.user_id,
          full_name: '',
          role: r.role,
          created_at: r.created_at,
          last_seen_at: act?.last_seen_at,
          sign_in_count: act?.sign_in_count,
        });
      }
    });

    // Sort by role hierarchy then creation date
    const priority: Record<string, number> = {
      owner: 4,
      super_admin: 3,
      admin: 2,
      client: 1,
    };

    return Array.from(userMap.values()).sort((a, b) => {
      const pDiff = (priority[b.role] || 0) - (priority[a.role] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [accounts, roles, activities]);

  const filteredUnifiedUsers = useMemo(() => {
    return unifiedUsers.filter((u) => {
      if (userRoleFilter === 'admins' && u.role === 'client') return false;
      if (userRoleFilter === 'clients' && u.role !== 'client') return false;
      if (userSearchTerm.trim()) {
        const q = userSearchTerm.trim().toLowerCase();
        const match =
          u.email.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.user_id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [unifiedUsers, userRoleFilter, userSearchTerm]);

  const isSuperOrOwner = role === 'super_admin' || role === 'owner';
  const canSeeWorkspace = superAdminOnly ? isSuperOrOwner : (role === 'admin' || isSuperOrOwner);

  // -------------------------------------------------------------
  // RENDER: LOADING OR ACCESS DENIED
  // -------------------------------------------------------------

  if (loading) {
    return localizeNode(
      <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-zinc-900">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-11 w-11 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-center">
            <Flame size={22} className="text-orange-600" />
          </div>
          <h2 className="text-sm font-semibold tracking-wide text-zinc-800">Bren-holz Direction</h2>
          <p className="text-xs text-zinc-400 flex items-center gap-2">
            <LoaderCircle size={14} className="animate-spin text-orange-600" />
            Chargement de l’espace de travail…
          </p>
        </div>
      </main>,
      brenLocale
    );
  }

  if (!user || !canSeeWorkspace) {
    return localizeNode(
      <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-stone-200/80 p-8 shadow-xs text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mb-4">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Accès Restreint</h1>
          <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
            Cet espace de direction est strictement réservé aux comptes administrateurs authentifiés.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            {user ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full rounded-xl bg-zinc-900 hover:bg-black py-2.5 font-semibold text-white text-xs transition"
              >
                Se déconnecter
              </button>
            ) : (
              <>
                <Link
                  href="/compte"
                  className="w-full rounded-xl bg-zinc-900 hover:bg-black py-2.5 font-semibold text-white text-xs transition"
                >
                  Se connecter avec un compte autorisé
                </Link>
                <Link
                  href="/"
                  className="w-full rounded-xl border border-stone-200 py-2.5 font-medium text-zinc-600 text-xs hover:bg-stone-50 transition"
                >
                  Retour à la boutique
                </Link>
              </>
            )}
          </div>
        </div>
      </main>,
      brenLocale
    );
  }

  return localizeNode(
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row font-sans selection:bg-orange-100">
      {/* ========================================================= */}
      {/* MOBILE TOP BAR */}
      {/* ========================================================= */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#101820] text-white border-b border-white/[0.08] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#E65A00] flex items-center justify-center text-white shadow-xs">
            <Flame size={16} strokeWidth={2.4} />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">Bren-holz Direction</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg text-[#9AA4AF] hover:text-white hover:bg-white/10 transition-colors"
          aria-label={mobileSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (EXECUTIVE PREMIUM DARK THEME) */}
      {/* ========================================================= */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        role={role}
        isSuperOrOwner={isSuperOrOwner}
        ordersCount={pendingOrdersCount}
        contactsCount={pendingContactsCount}
        isRefreshing={isRefreshing}
        signingOut={signingOut}
        onRefresh={() => loadData(user)}
        onSignOut={() => handleSignOut()}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT VIEWPORT */}
      {/* ========================================================= */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {/* Support Notifications */}
        <SupportNotifications />

        {/* Global Notifications */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm shadow-xs animate-in fade-in"
          >
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <span className="font-semibold flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm shadow-xs animate-in fade-in"
          >
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span className="font-semibold flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="text-emerald-400 hover:text-emerald-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 1: OVERVIEW & KPIS */}
        {/* ======================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Vue d’ensemble</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Indicateurs clés et commandes récentes en attente de traitement.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Virements en attente
                </span>
                <p className="mt-3 text-3xl font-black text-zinc-950 tracking-tight">
                  {euros.format(pendingTransferTotalCents / 100)}
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  <span className="font-bold text-amber-700">
                    {orders.filter((o) => o.payment_status !== 'confirmed').length} commande(s)
                  </span>{' '}
                  à encaisser
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Commandes actives
                </span>
                <p className="mt-3 text-3xl font-black text-zinc-950 tracking-tight">{pendingOrdersCount}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Sur un total de <span className="font-semibold text-zinc-900">{orders.length}</span> commandes
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Demandes de Devis
                </span>
                <p className="mt-3 text-3xl font-black text-zinc-950 tracking-tight">{pendingContactsCount}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  <span className="font-bold text-blue-700">{contacts.length}</span> messages reçus
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Comptes & Visiteurs
                </span>
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-zinc-950 tracking-tight">{accounts.length}</span>
                  {onlineUsersCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300/80 px-2.5 py-0.5 rounded-full">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {onlineUsersCount} en ligne
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-600">Inscriptions sur la boutique</p>
              </div>
            </div>

            {/* Split Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600">
                    Dernières Commandes
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-sm font-semibold text-zinc-900 hover:text-orange-600 flex items-center gap-1"
                  >
                    Voir tout <ChevronRight size={15} />
                  </button>
                </div>

                <div className="divide-y divide-stone-100">
                  {orders.slice(0, 5).map((order) => {
                    const cust = order.customer ?? {};
                    return (
                      <div key={order.id} className="py-3.5 flex items-center justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-950 truncate">{order.reference}</p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {safeText(cust.firstName)} {safeText(cust.lastName)} ·{' '}
                            {formatRelativeTime(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-base text-zinc-950">
                            {euros.format(order.total_cents / 100)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {orders.length === 0 && (
                    <p className="py-10 text-center text-sm text-zinc-400">Aucune commande enregistrée</p>
                  )}
                </div>
              </div>

              {/* Recent Messages */}
              <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600">
                    Messages Récents
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contacts')}
                    className="text-sm font-semibold text-zinc-900 hover:text-orange-600 flex items-center gap-1"
                  >
                    Voir tout <ChevronRight size={15} />
                  </button>
                </div>

                <div className="divide-y divide-stone-100">
                  {contacts.slice(0, 5).map((c) => (
                    <div key={c.id} className="py-3.5 flex items-center justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-950 truncate">{c.name}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {c.email} · {formatRelativeTime(c.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {statusLabels[c.status]}
                      </span>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="py-10 text-center text-sm text-zinc-400">Aucun message pour le moment</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: ORDERS & BANK TRANSFERS */}
        {/* ======================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Commandes & Virements</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Suivi des commandes passées, vérification des preuves et validation bancaire.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Référence, client…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-2xs"
                />
              </div>
            </div>

            {/* Filter pills & Archive toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'new', 'in_progress', 'done'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                      orderStatusFilter === st
                        ? 'bg-zinc-950 text-white'
                        : 'bg-white border border-stone-200 text-zinc-700 hover:bg-stone-50'
                    }`}
                  >
                    {st === 'all' ? 'Toutes' : statusLabels[st]}
                  </button>
                ))}

                <span className="text-stone-300 mx-1 hidden sm:inline">|</span>

                {(['all', 'pending', 'confirmed'] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setOrderPaymentFilter(pm)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                      orderPaymentFilter === pm
                        ? 'bg-orange-600 text-white'
                        : 'bg-white border border-stone-200 text-zinc-700 hover:bg-stone-50'
                    }`}
                  >
                    {pm === 'all' ? 'Tous virements' : pm === 'confirmed' ? 'Virement confirmé' : 'En attente'}
                  </button>
                ))}
              </div>

              {/* Archive vs Active toggle */}
              <div className="inline-flex rounded-xl bg-stone-200/70 p-1 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setShowArchived(false)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    !showArchived ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  En cours ({orders.filter((o) => !o.archived_at).length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchived(true)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    showArchived ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Archivées ({orders.filter((o) => !!o.archived_at).length})
                </button>
              </div>
            </div>

            {/* Orders list */}
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const customer = order.customer ?? {};
                const shipping = order.shipping;
                const items = Array.isArray(order.items)
                  ? (order.items as Array<Record<string, unknown>>)
                  : [];
                const isConfirmed = order.payment_status === 'confirmed';

                return (
                  <article
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all overflow-hidden"
                  >
                    {/* Header Bar */}
                    <div className="bg-stone-50/80 border-b border-stone-200/70 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-base text-zinc-950">
                          {order.reference}
                        </span>
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                            <Check size={12} className="stroke-[2.5]" /> Virement confirmé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20">
                            <Clock size={12} /> En attente de virement
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-500 font-medium">{formatDate(order.created_at)}</span>
                        <select
                          value={order.status}
                          disabled={workingId === `order_requests-${order.id}`}
                          onChange={(e) =>
                            void handleUpdateStatus(
                              'order_requests',
                              order.id,
                              e.target.value as RequestStatus
                            )
                          }
                          className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 shadow-2xs focus:outline-none"
                        >
                          <option value="new">Nouvelle</option>
                          <option value="in_progress">En cours</option>
                          <option value="done">Terminée</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-stone-50/60 rounded-xl p-4 border border-stone-200/60">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Facturation
                          </span>
                          <p className="font-bold text-base text-zinc-950">
                            {safeText(customer.firstName)} {safeText(customer.lastName)}
                          </p>
                          <p className="text-sm text-zinc-600 mt-1">
                            <a href={`mailto:${safeText(customer.email)}`} className="hover:underline font-medium">
                              {safeText(customer.email)}
                            </a>
                            {safeText(customer.phone) && ` · ${safeText(customer.phone)}`}
                          </p>
                          <p className="text-sm text-zinc-700 mt-1 font-medium">
                            {safeText(customer.street)} {safeText(customer.postalCode)} {safeText(customer.city)}
                          </p>
                        </div>

                        <div className="bg-stone-50/60 rounded-xl p-4 border border-stone-200/60">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Livraison Spedition
                          </span>
                          {shipping ? (
                            <div className="text-sm text-zinc-700 font-medium">
                              <p className="font-bold text-zinc-950">
                                {safeText(shipping.firstName)} {safeText(shipping.lastName)}
                              </p>
                              <p className="mt-1">
                                {safeText(shipping.street)} {safeText(shipping.postalCode)} {safeText(shipping.city)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-400 italic mt-1">Identique à l’adresse de facturation</p>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-stone-50/40 rounded-xl p-4 border border-stone-200/60 space-y-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                          Articles commandés
                        </span>
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-semibold text-zinc-900">
                              <span>{safeText(item.name)}</span>
                              <span className="px-2.5 py-0.5 rounded-md bg-stone-200/80 text-zinc-800 font-bold text-xs">
                                × {Number(item.quantity) || 1}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 flex items-center justify-between border-t border-stone-200/80">
                          <span className="text-sm font-bold text-zinc-600">Total (TVA & Livraison incluses) :</span>
                          <span className="text-2xl font-black text-zinc-950">
                            {euros.format(order.total_cents / 100)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Proof & Validate action bar */}
                    <div className="bg-stone-50/50 border-t border-stone-200/70 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <AdminPaymentProof reference={order.reference} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={workingId === `archive-${order.id}`}
                          onClick={() => handleArchiveOrder(order.id, !order.archived_at)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                            order.archived_at
                              ? 'border-stone-300 bg-white hover:bg-stone-50 text-zinc-800'
                              : 'border-stone-200 bg-white hover:bg-stone-100 text-zinc-600'
                          }`}
                        >
                          {order.archived_at ? 'Restaurer la commande' : 'Archiver'}
                        </button>

                        {!isConfirmed ? (
                          <button
                            type="button"
                            disabled={workingId === `payment-${order.id}`}
                            onClick={() => handleConfirmTransfer(order.id)}
                            className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-sm font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <Check size={16} />
                            {workingId === `payment-${order.id}` ? 'Validation en cours…' : 'Confirmer le virement reçu'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300/80 text-sm font-bold shadow-2xs">
                            <Check size={16} className="text-emerald-700" /> Virement validé par la direction
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center text-sm text-zinc-400">
                  Aucune commande ne correspond à ces critères.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 3: CONTACTS & QUOTES */}
        {/* ======================================================= */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Messages & Devis</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Traitement des demandes commerciales et questions clients.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Nom, e-mail…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-2xs"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2.5 text-sm">
              {(['all', 'new', 'in_progress', 'done'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setContactStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl font-semibold transition shadow-2xs ${
                    contactStatusFilter === st
                      ? 'bg-zinc-950 text-white'
                      : 'bg-white border border-stone-200 text-zinc-700 hover:bg-stone-50'
                  }`}
                >
                  {st === 'all' ? 'Toutes' : statusLabels[st]}
                </button>
              ))}
            </div>

            {/* Messages list */}
            <div className="space-y-6">
              {filteredContacts.map((contact) => (
                <article
                  key={contact.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all overflow-hidden"
                >
                  <div className="bg-stone-50/80 border-b border-stone-200/70 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-zinc-950">{contact.name}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-200/80 text-zinc-800">
                        {subjectLabels[contact.subject] ?? contact.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-zinc-500 font-medium">{formatDate(contact.created_at)}</span>
                      <select
                        value={contact.status}
                        disabled={workingId === `contact_requests-${contact.id}`}
                        onChange={(e) =>
                          void handleUpdateStatus(
                            'contact_requests',
                            contact.id,
                            e.target.value as RequestStatus
                          )
                        }
                        className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 font-semibold text-zinc-800 shadow-2xs focus:outline-none"
                      >
                        <option value="new">Nouvelle</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Traitée</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-sm text-zinc-600">
                      <span className="font-semibold text-zinc-800">E-mail :</span>{' '}
                      <a href={`mailto:${contact.email}`} className="font-bold text-zinc-900 hover:underline">
                        {contact.email}
                      </a>
                      {contact.phone && ` · Tél : ${contact.phone}`}
                      {contact.postal_code && ` · CP : ${contact.postal_code}`}
                    </p>

                    <div className="bg-stone-50/80 rounded-xl p-5 border border-stone-200/70 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap font-sans">
                      {contact.message}
                    </div>
                  </div>
                </article>
              ))}

              {filteredContacts.length === 0 && (
                <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center text-sm text-zinc-400">
                  Aucun message trouvé.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 3b: SUPPORT CLIENT & INBOX */}
        {/* ======================================================= */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Support Client & Messagerie</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Messagerie instantanée en temps réel et suivi des demandes d’assistance clients.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-4 sm:p-6 overflow-hidden">
              <SupportMessenger admin />
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 4: PRODUCTS & INVENTORY */}
        {/* ======================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Catalogue & Stocks</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Gestion des prix, quantités disponibles et coordonnées bancaires.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProductForm(emptyProduct(siteData.products));
                  setIsEditingProduct(false);
                  setShowProductForm(!showProductForm);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-sm font-bold shadow-xs transition"
              >
                <Plus size={16} />
                <span>{showProductForm ? 'Fermer l’éditeur' : 'Ajouter un produit'}</span>
              </button>
            </div>

            {/* Product Edit Card */}
            {showProductForm && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5 text-sm animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h3 className="font-bold text-base text-zinc-950">
                    {isEditingProduct ? 'Modifier la référence' : 'Nouvelle référence'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="text-zinc-400 hover:text-zinc-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="font-semibold text-zinc-800">
                    ID Produit
                    <input
                      required
                      type="number"
                      min="1"
                      value={productForm.id}
                      onChange={(e) => setProductForm({ ...productForm, id: Number(e.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="font-semibold text-zinc-800">
                    Désignation
                    <input
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Palette Granulés..."
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="font-semibold text-zinc-800">
                    Catégorie
                    <input
                      required
                      value={productForm.type}
                      onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                      placeholder="Granulés, Bois..."
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="font-semibold text-zinc-800">
                    Conditionnement
                    <input
                      required
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      placeholder="Palette de 66 sacs"
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="font-semibold text-zinc-800">
                    Prix en centimes (ex: 49900 = 499 €)
                    <input
                      type="number"
                      min="0"
                      value={productForm.priceAmount ?? 0}
                      onChange={(e) =>
                        setProductForm({ ...productForm, priceAmount: Number(e.target.value) })
                      }
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="font-semibold text-zinc-800">
                    Stock (-1 = Illimité, 0 = Rupture)
                    <input
                      required
                      type="number"
                      min="-1"
                      value={productForm.stock ?? -1}
                      onChange={(e) => {
                        const stock = Number(e.target.value);
                        setProductForm({
                          ...productForm,
                          stock,
                          availability:
                            stock < 0
                              ? undefined
                              : stock === 0
                              ? 'Rupture de stock'
                              : 'En stock',
                        });
                      }}
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="sm:col-span-2 font-semibold text-zinc-800">
                    Chemin de l’image
                    <input
                      required
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="/pellets.webp"
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>

                  <label className="sm:col-span-2 font-semibold text-zinc-800">
                    Description
                    <textarea
                      required
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-zinc-700 hover:bg-stone-50 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-5 py-2 rounded-xl bg-zinc-950 text-white font-bold hover:bg-black disabled:opacity-50 shadow-xs"
                  >
                    {savingProduct ? 'Enregistrement…' : 'Enregistrer le produit'}
                  </button>
                </div>
              </form>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {siteData.products.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3.5">
                      <div className="relative h-14 w-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
                          {item.type}
                        </span>
                        <h4 className="font-bold text-base text-zinc-950 truncate mt-0.5">{item.name}</h4>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{item.quantity}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
                      <span className="font-black text-base text-zinc-950">{item.price}</span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          item.stock === 0
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : item.stock !== undefined && item.stock > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-zinc-700'
                        }`}
                      >
                        {item.stock === 0
                          ? 'Rupture'
                          : item.stock !== undefined
                          ? `${item.stock} en stock`
                          : 'Stock libre'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm({
                          ...item,
                          priceAmount: item.priceAmount ?? 0,
                          stock: item.stock ?? -1,
                        });
                        setIsEditingProduct(true);
                        setShowProductForm(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 text-zinc-700 hover:bg-stone-50 font-semibold flex items-center gap-1.5 transition"
                    >
                      <Pencil size={13} /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(item.id)}
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1.5 transition"
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bank Settings */}
            <div className="rounded-2xl bg-white border border-stone-200/90 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                  <CreditCard size={18} className="text-zinc-600" />
                  Coordonnées Bancaires de Virement
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Texte affiché sur les pages de confirmation et dans le récapitulatif bancaire remis aux clients.
                </p>
              </div>

              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <textarea
                  rows={4}
                  value={bankForm}
                  onChange={(e) => {
                    setBankSaved(false);
                    setBankForm(e.target.value);
                  }}
                  placeholder="IBAN, BIC, Titulaire..."
                  className="w-full rounded-xl border border-stone-300 p-3.5 text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-2xs"
                />

                <div className="flex items-center justify-between text-sm">
                  {bankSaved ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Coordonnées enregistrées avec succès.
                    </span>
                  ) : (
                    <span />
                  )}

                  <button
                    type="submit"
                    disabled={savingRole}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white font-bold hover:bg-black transition disabled:opacity-50 shadow-xs"
                  >
                    {savingRole ? 'Sauvegarde…' : 'Mettre à jour l’IBAN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 4b: ANALYTICS & TRAFFIC */}
        {/* ======================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Statistiques Visiteurs & Trafic</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Analyse de la fréquentation du site, des conversions et des pages les plus consultées.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-4 sm:p-6 overflow-hidden">
              <AnalyticsDashboard />
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 5: UNIFIED DIRECTORY & ACCESS CONTROL */}
        {/* ======================================================= */}
        {activeTab === 'users' && isSuperOrOwner && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                  Annuaire & Contrôle des Accès
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Gestion centralisée de tous les comptes inscrits et attribution des privilèges administrateur.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-semibold shadow-xs transition shrink-0"
              >
                <Plus size={16} />
                <span>{showInviteForm ? 'Fermer l’invitation' : 'Accréditer par e-mail'}</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Total Comptes
                </span>
                <p className="mt-2 text-2xl font-black text-slate-950">{unifiedUsers.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Utilisateurs enregistrés</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Administrateurs
                </span>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {unifiedUsers.filter((u) => u.role !== 'client').length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Membres avec privilèges</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Clients Simples
                </span>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {unifiedUsers.filter((u) => u.role === 'client').length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Comptes sans droits admin</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Activité en direct
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950">{onlineUsersCount}</span>
                  {onlineUsersCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      En ligne
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Connectés récemment</p>
              </div>
            </div>

            {/* Optional Manual Email Privilege Grant Card */}
            {showInviteForm && (
              <form
                onSubmit={handleSaveRole}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">
                    Accréditation manuelle par adresse e-mail
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-4 text-sm">
                  <label className="font-semibold text-slate-800">
                    E-mail du compte client
                    <input
                      required
                      type="email"
                      value={targetUserEmail}
                      onChange={(e) => setTargetUserEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </label>

                  <label className="font-semibold text-slate-800">
                    Rôle à attribuer
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as Role)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    >
                      <option value="admin">Admin</option>
                      {role === 'owner' && <option value="super_admin">Super Admin</option>}
                      {role === 'owner' && <option value="owner">Owner</option>}
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={savingRole}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition disabled:opacity-50 shadow-xs"
                    >
                      {savingRole ? 'Attribution…' : 'Accréditer'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Segmented Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                    userRoleFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Tous ({unifiedUsers.length})
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('admins')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                    userRoleFilter === 'admins'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Administrateurs ({unifiedUsers.filter((u) => u.role !== 'client').length})
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('clients')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                    userRoleFilter === 'clients'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Clients simples ({unifiedUsers.filter((u) => u.role === 'client').length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, email ou ID…"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            {/* UNIFIED DIRECTORY TABLE */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-6">Utilisateur</th>
                      <th className="py-3.5 px-4">Rôle actuel</th>
                      <th className="py-3.5 px-4">Activité</th>
                      <th className="py-3.5 px-4">Date d’inscription</th>
                      <th className="py-3.5 px-6 text-right">Actions d’accréditation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUnifiedUsers.map((u) => {
                      const isSelf = u.user_id === user.id;
                      const isOnline =
                        u.last_seen_at && new Date(u.last_seen_at).getTime() > onlineCutoff;

                      return (
                        <tr key={u.user_id} className="hover:bg-slate-50/60 transition">
                          {/* User Identity */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                {u.full_name ? u.full_name.slice(0, 2).toUpperCase() : u.email.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-950 block truncate">
                                  {u.full_name || 'Sans nom'}
                                </span>
                                <span className="text-xs text-slate-600 block truncate font-mono">
                                  {u.email}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  {u.user_id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge with pure SVG */}
                          <td className="py-4 px-4">
                            {u.role === 'owner' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-900 border border-amber-500/30">
                                <Crown size={12} className="text-amber-600 shrink-0 stroke-[2]" />
                                Owner
                              </span>
                            ) : u.role === 'super_admin' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-900 border border-indigo-500/30">
                                <ShieldCheck size={12} className="text-indigo-600 shrink-0 stroke-[2]" />
                                Super Admin
                              </span>
                            ) : u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                                <Shield size={12} className="text-slate-600 shrink-0 stroke-[2]" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                                <UserIcon size={12} className="text-slate-400 shrink-0 stroke-[1.75]" />
                                Client
                              </span>
                            )}
                          </td>

                          {/* Activity */}
                          <td className="py-4 px-4">
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En ligne
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                {u.last_seen_at ? formatRelativeTime(u.last_seen_at) : 'Hors ligne'}
                              </span>
                            )}
                          </td>

                          {/* Inscription */}
                          <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                            {formatDate(u.created_at)}
                          </td>

                          {/* Actions (Strictly Super Admin / Owner) */}
                          <td className="py-4 px-6 text-right">
                            {isSelf ? (
                              <span className="text-xs text-slate-400 font-medium italic">
                                Votre session
                              </span>
                            ) : u.role === 'owner' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold">
                                <Crown size={12} /> Protégé
                              </span>
                            ) : u.role === 'client' ? (
                              /* Promote Client -> Admin */
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={workingId === `role-${u.user_id}`}
                                  onClick={() => handleSetUserRole(u.user_id, u.email, 'admin')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                                >
                                  <ShieldPlus size={13} strokeWidth={2} />
                                  <span>Nommer Admin</span>
                                </button>

                                {role === 'owner' && (
                                  <button
                                    type="button"
                                    disabled={workingId === `role-${u.user_id}`}
                                    onClick={() => handleSetUserRole(u.user_id, u.email, 'super_admin')}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                                  >
                                    <ShieldCheck size={13} />
                                    <span>Super Admin</span>
                                  </button>
                                )}
                              </div>
                            ) : u.role === 'admin' ? (
                              /* Demote Admin -> Client OR Promote to Super Admin if Owner */
                              <div className="flex items-center justify-end gap-2">
                                {role === 'owner' && (
                                  <button
                                    type="button"
                                    disabled={workingId === `role-${u.user_id}`}
                                    onClick={() => handleSetUserRole(u.user_id, u.email, 'super_admin')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                                  >
                                    <ShieldCheck size={13} strokeWidth={2} />
                                    <span>Super Admin</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={workingId === `role-${u.user_id}`}
                                  onClick={() => handleSetUserRole(u.user_id, u.email, 'client')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                                >
                                  <UserMinus size={13} strokeWidth={2} />
                                  <span>Rétrograder Client</span>
                                </button>
                              </div>
                            ) : u.role === 'super_admin' ? (
                              /* Super Admin row */
                              role === 'owner' ? (
                                <button
                                  type="button"
                                  disabled={workingId === `role-${u.user_id}`}
                                  onClick={() => handleSetUserRole(u.user_id, u.email, 'admin')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                                >
                                  <UserMinus size={13} strokeWidth={2} />
                                  <span>Passer Admin</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Protégé</span>
                              )
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredUnifiedUsers.length === 0 && (
                <div className="p-16 text-center text-sm text-slate-400">
                  Aucun utilisateur trouvé correspondant à vos critères de recherche.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 6: AUDIT TRAIL (SUPER-ADMIN / OWNER ONLY) */}
        {/* ======================================================= */}
        {activeTab === 'audit' && isSuperOrOwner && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Journal d’Audit & Sécurité</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Historique chronologique des modifications apportées par les administrateurs.
              </p>
            </div>

            <div className="space-y-4">
              {audit.map((entry) => {
                const actionBadge: Record<string, { label: string; bg: string; text: string }> = {
                  insert: { label: 'CRÉATION', bg: 'bg-emerald-100', text: 'text-emerald-950' },
                  update: { label: 'MODIFICATION', bg: 'bg-blue-100', text: 'text-blue-950' },
                  delete: { label: 'SUPPRESSION', bg: 'bg-red-100', text: 'text-red-950' },
                };
                const badge = actionBadge[entry.action] ?? {
                  label: entry.action.toUpperCase(),
                  bg: 'bg-stone-200',
                  text: 'text-zinc-800',
                };

                return (
                  <div
                    key={entry.id}
                    className="p-5 rounded-2xl border border-stone-200/90 bg-white text-sm space-y-2 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="font-bold text-base text-zinc-950">{entry.entity}</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">{formatDate(entry.created_at)}</span>
                    </div>

                    <p className="text-sm text-zinc-600">
                      Par : <span className="font-mono font-semibold text-zinc-900">{entry.actor_user_id || 'Système'}</span> ·
                      Rôle : <span className="font-bold text-zinc-800">{entry.actor_role || 'Auto'}</span>
                    </p>

                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <details className="mt-2 text-zinc-500">
                        <summary className="cursor-pointer font-bold text-zinc-700 hover:text-orange-600 text-xs">
                          Détails des valeurs enregistrées
                        </summary>
                        <pre className="mt-2 p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-xs overflow-auto max-h-48">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}

              {audit.length === 0 && (
                <div className="p-16 text-center text-sm text-zinc-400 bg-white rounded-2xl border border-stone-200/80">
                  Aucune trace d’audit enregistrée.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* Executive Confirmation Dialog Modal */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        variant={confirmModal.variant}
        isLoading={Boolean(workingId || savingProduct)}
        requireMatchText={confirmModal.requireMatchText}
        requireMatchPlaceholder={confirmModal.requireMatchPlaceholder}
        onConfirm={async () => {
          if (confirmModal.action) {
            await confirmModal.action();
          }
        }}
        onClose={closeConfirmModal}
      />
    </div>,
    brenLocale
  );
}
