'use client';
import IncludedVatSummary from '@/components/IncludedVatSummary';
import type {vatSummary} from '@/lib/vat';
import BrandWordmark from '@/components/BrandWordmark';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';


import { orderStatusLabels, paymentStatusLabel } from '@/lib/order-status';
import { getAdminRole } from '@/lib/admin-access';
import { FormEvent, useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldAlert,
  Upload,
  UserCheck,
  UserRound,
  WifiOff,
  X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isPasswordRecoveryRedirect, supabase } from '@/lib/supabase';
import { confirmationMessage, wasEmailConfirmed } from '@/lib/auth-link';
import { useCart } from '@/components/CartProvider';
import { siteUrl } from '@/lib/store-config';

function getAuthRedirectUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) return `${window.location.origin}${path}`;
  }
  return `${siteUrl}${path}`;
}

type Mode = 'signin' | 'signup' | 'forgot' | 'update';
type OwnOrder = {customer?: {vat?:ReturnType<typeof vatSummary>;deliveryFeeCents?:number;delivery?: {feeCents:number;distanceKm:number}; payment_proof_submitted?: boolean; payment_proof_submitted_at?: string; [key: string]: unknown}; id: number; reference: string; created_at: string; total_cents: number; status: string; payment_status: string; items: unknown };
type OwnAddress = { id: number; label: string; recipient_name: string; street: string; postal_code: string; city: string; country_code: string };

export type ParsedError = {
  kind: 'config' | 'credentials' | 'user_exists' | 'unconfirmed' | 'weak_password' | 'rate_limit' | 'network' | 'generic';
  badge: string;
  title: string;
  description: string;
  codeSnippet?: string[];
  actionLabel?: string;
  onAction?: () => void;
  icon: 'config' | 'credentials' | 'user_exists' | 'unconfirmed' | 'weak_password' | 'rate_limit' | 'network' | 'generic';
};

export function parseAuthError(raw: string, options?: { onSwitchToSignin?: () => void }): ParsedError {
  const norm = raw.toLowerCase();

  if (norm.includes('auth session missing') || norm.includes('session de réinitialisation')) {
    return {
      kind: 'generic',
      badge: 'Lien de réinitialisation',
      title: 'Session de réinitialisation absente ou expirée',
      description: 'Ouvrez le lien reçu par e-mail dans ce navigateur. Si ce lien a déjà été utilisé ou a expiré, demandez un nouveau lien. Ouvrir cette page directement ne suffit pas.',
      icon: 'generic',
    };
  }

  if (norm.includes('supabase non configurée') || norm.includes('next_public_supabase')) {
    return {
      kind: 'config',
      badge: 'Configuration Supabase',
      title: 'Connexion à la base de données non configurée',
      description: 'Cette version du site n’est pas encore reliée à un projet Supabase actif.',
      codeSnippet: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
      icon: 'config',
    };
  }

  if (norm.includes('invalid login credentials')) {
    return {
      kind: 'credentials',
      badge: 'Identifiants',
      title: 'Adresse e-mail ou mot de passe incorrect',
      description: 'Vérifiez les informations saisies ou utilisez le lien « Mot de passe oublié ? » pour le réinitialiser.',
      icon: 'credentials',
    };
  }

  if (norm.includes('email not confirmed')) {
    return {
      kind: 'unconfirmed',
      badge: 'Validation e-mail',
      title: 'Validation de l’adresse e-mail requise',
      description: 'Votre inscription est enregistrée mais nécessite la validation de votre e-mail. Cliquez sur le lien reçu dans votre boîte de réception.',
      icon: 'unconfirmed',
    };
  }

  if (norm.includes('user already registered')) {
    return {
      kind: 'user_exists',
      badge: 'Compte existant',
      title: 'Un compte existe déjà avec cet e-mail',
      description: 'Vous possèdez déjà un compte client Bren-nholz avec cette adresse e-mail. Vous pouvez vous connecter directement.',
      actionLabel: options?.onSwitchToSignin ? 'Se connecter avec cet e-mail' : undefined,
      onAction: options?.onSwitchToSignin,
      icon: 'user_exists',
    };
  }

  if (norm.includes('password should be at least') || norm.includes('password is too short')) {
    return {
      kind: 'weak_password',
      badge: 'Sécurité du mot de passe',
      title: 'Mot de passe trop court',
      description: 'Le mot de passe doit comporter au moins 8 caractères pour protéger votre espace client.',
      icon: 'weak_password',
    };
  }

  if (norm.includes('email rate limit') || norm.includes('over_email_send_rate_limit')) {
    return {
      kind: 'rate_limit',
      badge: 'Envoi temporairement limité',
      title: 'Limite d’envoi des e-mails atteinte',
      description: 'Le service ne peut pas envoyer de nouveau lien pour le moment. Réessayez plus tard : l’attente peut aller jusqu’à une heure. Si un lien précédent vous a déjà connecté, ouvrez la page de nouveau mot de passe.',
      icon: 'rate_limit',
    };
  }

  if (norm.includes('rate limit') || norm.includes('too many requests')) {
    return {
      kind: 'rate_limit',
      badge: 'Tentatives limitées',
      title: 'Trop de tentatives effectuées',
      description: 'Les demandes sont temporairement limitées. Réessayez plus tard. Cela ne signifie pas que votre compte est bloqué ou supprimé.',
      icon: 'rate_limit',
    };
  }

  if (norm.includes('network') || norm.includes('fetch') || norm.includes('failed to fetch')) {
    return {
      kind: 'network',
      badge: 'Connexion réseau',
      title: 'Impossible de contacter le serveur',
      description: 'Problème de communication avec Supabase. Vérifiez votre connexion Internet puis réessayez.',
      icon: 'network',
    };
  }

  return {
    kind: 'generic',
    badge: 'Erreur',
    title: 'Une erreur est survenue',
    description: raw || 'Impossible de traiter votre demande. Veuillez vérifier les informations saisies puis réessayer.',
    icon: 'generic',
  };
}



function DarkFormAlert({
  error,
  notice,
  onDismiss,
  onSwitchToSignin,
}: {
  error?: string | null;
  notice?: string | null;
  onDismiss?: () => void;
  onSwitchToSignin?: () => void;
}) {
  const brenLocale = useLocale() as Locale;

  if (!error && !notice) return null;

  if (notice) {
    return localizeNode((
      <div className="account-alert-dark account-alert-dark--success" role="status">
        <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-emerald-200">{notice}</p>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-emerald-400 hover:text-white transition" aria-label="Fermer">
            <X size={15} />
          </button>
        )}
      </div>
    ), brenLocale);
  }

  const parsed = parseAuthError(error!, { onSwitchToSignin });

  const iconMap = {
    config: <AlertTriangle size={18} className="shrink-0 text-blue-400 mt-0.5" />,
    credentials: <ShieldAlert size={18} className="shrink-0 text-red-400 mt-0.5" />,
    user_exists: <UserCheck size={18} className="shrink-0 text-amber-400 mt-0.5" />,
    unconfirmed: <Mail size={18} className="shrink-0 text-amber-400 mt-0.5" />,
    weak_password: <KeyRound size={18} className="shrink-0 text-red-400 mt-0.5" />,
    rate_limit: <Clock size={18} className="shrink-0 text-amber-400 mt-0.5" />,
    network: <WifiOff size={18} className="shrink-0 text-red-400 mt-0.5" />,
    generic: <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />,
  };

  const themeClass =
    parsed.kind === 'config'
      ? 'account-alert-dark--config'
      : parsed.kind === 'unconfirmed' || parsed.kind === 'rate_limit' || parsed.kind === 'user_exists'
      ? 'account-alert-dark--warning'
      : 'account-alert-dark--error';

  return localizeNode((
    <div className={`account-alert-dark ${themeClass}`} role="alert">
      {iconMap[parsed.icon]}
      <div className="flex-1 space-y-1">
        <h4 className="font-semibold text-xs uppercase tracking-wider opacity-90">{parsed.badge}</h4>
        <p className="font-medium">{parsed.title}</p>
        {parsed.description && <p className="text-xs opacity-80 leading-relaxed">{parsed.description}</p>}

        {parsed.codeSnippet && parsed.codeSnippet.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.codeSnippet.map((code) => (
              <code key={code} className="px-1.5 py-0.5 rounded bg-black/40 text-[11px] font-mono border border-white/10 text-zinc-300">
                {code}
              </code>
            ))}
          </div>
        )}

        {parsed.onAction && parsed.actionLabel && (
          <button
            type="button"
            onClick={parsed.onAction}
            className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-300 hover:underline"
          >
            {parsed.actionLabel} <ArrowRight size={13} />
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-zinc-400 hover:text-white transition" aria-label="Fermer l'alerte">
          <X size={15} />
        </button>
      )}
    </div>
  ), brenLocale);
}

/* Background Animated Hearth Loop (Gathering logs -> Ignition -> Flames & Embers) */
function BackgroundHearthLoop() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {/* Soft light aura */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-orange-400/15 blur-[140px] animate-heat-glow z-0" />

      {/* Hearth Fire SVG Scene (Soft ethereal presence in light theme) */}
      <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] z-0 flex items-center justify-center opacity-30 sm:opacity-40">
        <svg
          className="w-full h-full relative z-0"
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="hearthGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#ea580c" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#9a3412" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#08090b" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="logWood1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9a5228" />
              <stop offset="40%" stopColor="#633216" />
              <stop offset="80%" stopColor="#3d1b09" />
              <stop offset="100%" stopColor="#210a02" />
            </linearGradient>

            <linearGradient id="logWood2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a35a2d" />
              <stop offset="50%" stopColor="#693717" />
              <stop offset="100%" stopColor="#381a09" />
            </linearGradient>

            <linearGradient id="logWood3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8d4b24" />
              <stop offset="50%" stopColor="#572b12" />
              <stop offset="100%" stopColor="#280e03" />
            </linearGradient>

            <linearGradient id="flameLayerOuter" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="25%" stopColor="#ea580c" />
              <stop offset="65%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>

            <linearGradient id="flameLayerInner" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <linearGradient id="flameLayerCore" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="22" />
            </filter>

            <filter id="coreSparkBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Ambient Heat Aura */}
          <circle
            cx="150"
            cy="185"
            r="95"
            fill="url(#hearthGlow)"
            className="animate-heat-glow"
            filter="url(#glowBlur)"
          />

          {/* Log 1 (Left diagonal log) */}
          <g className="animate-log-1">
            <rect x="50" y="215" width="160" height="26" rx="13" fill="url(#logWood1)" transform="rotate(-15 130 228)" />
            <ellipse cx="60" cy="223" rx="7" ry="10" fill="#a05e32" />
            <ellipse cx="60" cy="223" rx="3.5" ry="5" fill="#583015" />
          </g>

          {/* Log 2 (Right diagonal log) */}
          <g className="animate-log-2">
            <rect x="90" y="215" width="160" height="26" rx="13" fill="url(#logWood2)" transform="rotate(15 170 228)" />
            <ellipse cx="240" cy="223" rx="7" ry="10" fill="#9e5a2e" />
          </g>

          {/* Log 3 (Base horizontal log) */}
          <g className="animate-log-3">
            <rect x="65" y="225" width="170" height="28" rx="14" fill="url(#logWood3)" />
            <ellipse cx="78" cy="239" rx="8" ry="11" fill="#8d4d25" />
          </g>

          {/* Fire Ignition & Burning Flame Container */}
          <g className="animate-fire-ignite">
            {/* Spark burst on ignition */}
            <circle cx="150" cy="180" r="14" fill="#fef08a" filter="url(#coreSparkBlur)" />

            {/* Dancing Main Flame */}
            <g className="animate-flame-main">
              <path
                d="M150 55 C185 100 198 142 188 180 C178 212 122 212 112 180 C102 142 115 100 150 55 Z"
                fill="url(#flameLayerOuter)"
              />
            </g>

            {/* Inner Flame */}
            <g className="animate-flame-inner">
              <path
                d="M150 85 C172 118 180 148 174 175 C168 198 132 198 126 175 C120 148 128 118 150 85 Z"
                fill="url(#flameLayerInner)"
              />
              <path
                d="M150 115 C162 135 167 155 162 170 C157 184 143 184 138 170 C133 155 138 135 150 115 Z"
                fill="url(#flameLayerCore)"
              />
            </g>

            {/* Rising Embers & Floating Sparks */}
            <circle cx="138" cy="120" r="3" fill="#facc15" className="animate-ember-1" />
            <circle cx="165" cy="100" r="3.5" fill="#f97316" className="animate-ember-2" />
            <circle cx="148" cy="75" r="2.5" fill="#fef08a" className="animate-ember-3" />
            <circle cx="125" cy="140" r="2" fill="#fb923c" className="animate-ember-2" />
            <circle cx="172" cy="130" r="2.5" fill="#fef08a" className="animate-ember-1" />
          </g>
        </svg>
      </div>
    </div>
  ), brenLocale);
}


export default function AccountPageContent() {
  const brenLocale = useLocale() as Locale;

  const { items: cartItems, products: cartProducts, itemCount, ready: cartReady } = useCart();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(isPasswordRecoveryRedirect ? 'update' : 'signin');
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<OwnOrder[]>([]);
  const [ordersError, setOrdersError] = useState('');
  const [addresses, setAddresses] = useState<OwnAddress[]>([]);
  const [addressError, setAddressError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [needsConfirmationLink, setNeedsConfirmationLink] = useState(false);
  const [recoveryLinkInvalid, setRecoveryLinkInvalid] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofNotice, setProofNotice] = useState('');

  useEffect(() => {
    const urlMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null;
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
    const linkError = new URLSearchParams(window.location.search).get('linkError');
    if (linkError) {
      setError(linkError === 'expired' ? 'Ce lien a expiré. Demandez un nouveau lien pour continuer.' : 'Ce lien est invalide ou a déjà été utilisé. Demandez un nouveau lien pour continuer.');
      if (urlMode !== 'recovery') setNeedsConfirmationLink(true);
      else setRecoveryLinkInvalid(true);
    }
    if (urlMode === 'recovery' || recoveryLink) setMode('update');
    else if (urlMode === 'signup') setMode('signup');
    else if (urlMode === 'signin') setMode('signin');
    else if (urlMode === 'forgot') setMode('forgot');

    if (!supabase) {
      setReady(true);
      return;
    }
    const supabaseClient = supabase;

    let mounted = true;
    let loadedUserId: string | null | undefined;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const loadOwnData = async (userId: string) => {
      // Administrators are redirected to their workspace; do not fetch customer history first.
      if (await getAdminRole(supabaseClient, userId)) return;
      if (!mounted) return;
      const [orderResult, addressResult] = await Promise.all([
        supabaseClient.from('order_requests')
        .select('id, reference, created_at, total_cents, status, payment_status, items, customer')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
        supabaseClient.from('customer_addresses')
          .select('id,label,recipient_name,street,postal_code,city,country_code')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      if (!mounted) return;
      const { data: orderData, error: orderError } = orderResult;
      if (orderError) setOrdersError('L’historique sera disponible après activation de la migration commerce Supabase.');
      else {
        setOrders((orderData ?? []) as OwnOrder[]);
        setOrdersError('');
      }

      const { data: addressData, error: addressQueryError } = addressResult;
      if (!addressQueryError) setAddresses((addressData ?? []) as OwnAddress[]);
    };
    const { data: listener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') setMode('update');
      if (session?.user && wasEmailConfirmed(session.user.id)) setNotice(confirmationMessage);
      setUser(session?.user ?? null);
      setReady(true);
      const nextUserId = session?.user.id ?? null;
      if (loadedUserId === nextUserId) return;
      loadedUserId = nextUserId;
      clearTimeout(loadTimer);
      if (nextUserId) {
        loadTimer = setTimeout(() => {
          if (mounted) void loadOwnData(nextUserId).catch(() => {
            if (mounted) setOrdersError('Impossible de charger les données du compte. Veuillez réessayer.');
          });
        }, 0);
      } else {
        setOrders([]);
        setAddresses([]);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setNotice('');
    setError('');
    setNeedsConfirmationLink(false);
    setRecoveryLinkInvalid(false);
    window.history.replaceState({}, '', `/compte?mode=${nextMode === 'update' ? 'recovery' : nextMode}`);
  }

  async function resendConfirmation(event: React.MouseEvent<HTMLButtonElement>) {
    if (!supabase || busy) return;
    const field = event.currentTarget.form?.elements.namedItem('email');
    if (!(field instanceof HTMLInputElement) || !field.reportValidity() || !field.value.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: field.value.trim(), options: { emailRedirectTo: getAuthRedirectUrl('/compte?mode=confirm') } });
      if (resendError) throw resendError;
      setNotice('Si cette adresse attend une confirmation, un nouveau lien sécurisé lui a été envoyé. Consultez aussi vos courriers indésirables.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'L’envoi a échoué. Réessayez dans quelques minutes.'); }
    finally { setBusy(false); }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setSavingAddress(true);
    setAddressError('');
    const { error: saveError } = await supabase.from('customer_addresses').insert({
      user_id: user.id,
      label: String(values.label || 'Adresse'),
      recipient_name: String(values.recipient_name || ''),
      street: String(values.street || ''),
      postal_code: String(values.postal_code || ''),
      city: String(values.city || ''),
      country_code: 'DE',
    });

    if (saveError) {
      setAddressError('Impossible d’enregistrer cette adresse. Vérifiez la migration commerce et le code postal allemand.');
    } else {
      const { data } = await supabase.from('customer_addresses')
        .select('id,label,recipient_name,street,postal_code,city,country_code')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setAddresses((data ?? []) as OwnAddress[]);
      form.reset();
    }
    setSavingAddress(false);
  }

  async function deleteAddress(addressId: number) {
    if (!supabase || !user) return;
    const { error: deleteError } = await supabase.from('customer_addresses').delete().eq('id', addressId).eq('user_id', user.id);
    if (deleteError) setAddressError('Impossible de supprimer cette adresse.');
    else setAddresses((current) => current.filter((address) => address.id !== addressId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!supabase) {
      setError('Connexion Supabase non configurée sur cette version du site. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans Vercel, puis redéployez.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');
    const firstName = String(form.get('firstName') ?? '').trim();
    const lastName = String(form.get('lastName') ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);

    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName, full_name: fullName },
            emailRedirectTo: getAuthRedirectUrl('/compte?mode=confirm'),
          },
        });
        if (authError) throw authError;
        if (data.session) {
          await supabase.auth.signOut();
          setError('La confirmation par e-mail n’est pas activée sur le projet Supabase. Activez « Confirm email » dans Authentication → Sign In / Providers → Email pour exiger la validation avant la connexion.');
        } else setNotice('Inscription enregistrée. Consultez votre boîte e-mail et cliquez sur le lien de confirmation pour activer votre compte.');
      } else if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setUser(data.user);
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setNeedsConfirmationLink(true);
          setError('Votre adresse e-mail n’est pas encore confirmée. Ouvrez le lien reçu par e-mail ou demandez un nouveau lien.');
          return;
        }
        let accountRole;
        try { accountRole = await getAdminRole(supabase, data.user.id); } catch {
          setError('Vous êtes connecté, mais votre rôle n’a pas pu être vérifié. Réessayez de vous connecter pour accéder à votre tableau de bord.');
          return;
        }
        const destination = accountRole === 'owner' || accountRole === 'super_admin'
          ? '/super-admin'
          : accountRole === 'admin' ? '/admin' : '/compte';
        router.replace(destination);
      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl('/compte?mode=recovery'),
        });
        if (authError) throw authError;
        setNotice('Si cette adresse est associée à un compte, un lien de réinitialisation vient de lui être envoyé.');
      } else {
        if (recoveryLinkInvalid) { setError('Ce lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.'); return; }
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          setError('Session de réinitialisation absente ou expirée.');
          return;
        }
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setNotice('Votre mot de passe a été mis à jour.');
        window.history.replaceState({}, '', '/compte');
        setMode('signin');
        router.replace('/compte');
      }
    } catch (submitError) {
      if (submitError && typeof submitError === 'object' && 'code' in submitError && submitError.code === 'email_not_confirmed') setNeedsConfirmationLink(true);
      setError(submitError instanceof Error ? submitError.message : 'Une erreur est survenue. Réessayez dans quelques instants.');
    } finally {
      setBusy(false);
    }
  }



  async function handleSignOut() {
    if (!supabase) return;
    setError('');
    const { error: authError } = await supabase.auth.signOut();
    if (authError) setError(authError.message);
    else {
      setUser(null);
      setMode('signin');
      setNotice('Vous êtes déconnecté.');
      router.refresh();
    }
  }

  const handleUploadProof = async (e: FormEvent, reference: string) => {
    e.preventDefault();
    if (!proofFile) return;
    setProofSubmitting(true);
    setProofNotice('');
    try {
      const formData = new FormData();
      formData.append('reference', reference);
      formData.append('file', proofFile);

      const headers: Record<string, string> = {};
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }
      }

      const res = await fetch('/api/payment-proof', {
        method: 'POST',
        headers,
        body: formData,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProofNotice(result.error || 'Erreur lors de l’envoi du justificatif.');
      } else {
        setProofNotice('Justificatif envoyé avec succès. Vérification en cours.');
        setProofFile(null);
        setOrders((prev) =>
          prev.map((ord) =>
            ord.reference === reference
              ? { ...ord, customer: { ...(ord.customer || {}), payment_proof_submitted: true } }
              : ord
          )
        );
        setTimeout(() => {
          setUploadingOrderId(null);
          setProofNotice('');
        }, 3000);
      }
    } catch {
      setProofNotice('Erreur réseau. Veuillez réessayer.');
    } finally {
      setProofSubmitting(false);
    }
  };

  const heading =
    mode === 'signup'
      ? 'Créer un compte '
      : mode === 'forgot'
      ? 'Mot de passe oublié ?'
      : mode === 'update'
      ? 'Nouveau mot de passe'
      : 'Bon retour ';

  return localizeNode((
    <div className="account-auth-container min-h-dvh flex flex-col justify-between relative overflow-hidden text-slate-900">
      {/* Background Animated Hearth Loop */}
      <BackgroundHearthLoop />

      {/* Embedded Minimalist Header */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
        <Link href="/" aria-label="Bren-nholz — Leylines Park, accueil" className="group flex items-center gap-2.5 font-black text-xl tracking-tight text-slate-950 transition">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25 group-hover:bg-orange-600 transition">
            <Flame size={23} strokeWidth={2.2} fill="currentColor" />
          </span>
          <span className="text-slate-950 font-black tracking-tight text-xl">
            <BrandWordmark hyphenClass="text-orange-500" />
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 transition shadow-2xs"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Retour boutique</span>
          <span className="sm:hidden">Boutique</span>
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="apple-liquid-glass-card">
          {!ready ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <LoaderCircle className="animate-spin text-orange-500" size={28} />
              <span className="text-sm font-medium text-slate-600">Chargement de votre espace...</span>
            </div>
          ) : user && mode !== 'update' && !needsConfirmationLink ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-700 mb-1">Compte connecté</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Bienvenue</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Connecté avec l’adresse <strong className="text-slate-800">{user.email}</strong>
                </p>
              </div>

              <DarkFormAlert notice={notice} error={error} onDismiss={() => { setNotice(''); setError(''); }} />

              <div className="space-y-5 text-left">
                <section className="rounded-2xl border border-orange-100 bg-white/70 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Mon panier{cartReady ? ` (${itemCount})` : ''}</h3>
                  {!cartReady ? <p role="status" className="mt-2 text-xs text-slate-600">Chargement du panier…</p> : cartItems.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600">{cartItems.map((item) => <li key={item.productId} className="flex justify-between gap-3"><span>{cartProducts.find((product) => product.id === item.productId)?.name ?? 'Produit'}</span><span className="shrink-0">× {item.quantity}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Votre panier est vide. Découvrez nos produits pour préparer votre prochaine commande.</p>}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/panier" className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700">Voir mon panier</Link>
                    <Link href="/produits" className="rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-50">Continuer mes achats</Link>
                  </div>
                </section>
                <section className="rounded-2xl border border-orange-100 bg-white/70 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Mes commandes</h3>
                  {ordersError ? (
                    <p className="mt-2 text-xs leading-relaxed text-amber-800">{ordersError}</p>
                  ) : orders.length === 0 ? (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">Aucune commande liée à ce compte pour le moment.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {orders.map((order) => (
                        <li key={order.id} className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <b className="text-slate-900">{order.reference}</b>
                            <span className="text-slate-600">{new Intl.NumberFormat(brenLocale, { style: 'currency', currency: 'EUR' }).format(order.total_cents / 100)}</span>
                          </div>
                          {order.customer?.vat && <IncludedVatSummary summary={order.customer.vat} locale={brenLocale}/>}
                          {(order.customer?.delivery || order.customer?.deliveryFeeCents!==undefined) && <p className="mt-1 text-xs text-slate-600">Livraison : {new Intl.NumberFormat(brenLocale,{style:'currency',currency:'EUR'}).format((order.customer?.deliveryFeeCents??order.customer?.delivery?.feeCents??0)/100)}</p>}
                          <p className="mt-1 text-xs text-slate-500">
                            {new Intl.DateTimeFormat(brenLocale, { dateStyle: 'medium' }).format(new Date(order.created_at))} · {paymentStatusLabel(order.payment_status, order.customer as Record<string, unknown>)} · {orderStatusLabels[order.status as keyof typeof orderStatusLabels] ?? order.status}
                          </p>
                          {order.payment_status === 'confirmed' ? (
                            <div className="mt-2.5 pt-2 border-t border-orange-200/60 flex items-center justify-between">
                              <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                Paiement confirmé
                              </span>
                              <a
                                href={`/api/invoice?reference=${order.reference}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-2xs transition"
                              >
                                <Download size={13} />
                                Télécharger la facture (PDF)
                              </a>
                            </div>
                          ) : order.customer?.payment_proof_submitted ? (
                            <div className="mt-2.5 pt-2 border-t border-orange-200/60 flex items-center justify-between">
                              <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                                <Clock size={14} className="text-amber-600" />
                                Preuve transmise · Vérification en cours
                              </span>
                            </div>
                          ) : (
                            <div className="mt-2.5 pt-2 border-t border-orange-200/60">
                              {uploadingOrderId === order.reference ? (
                                <form onSubmit={(e) => void handleUploadProof(e, order.reference)} className="space-y-2 mt-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                                      required
                                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                                      className="text-xs text-slate-700 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-800 hover:file:bg-orange-200 cursor-pointer"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="submit"
                                      disabled={proofSubmitting || !proofFile}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition disabled:opacity-50"
                                    >
                                      {proofSubmitting ? <LoaderCircle size={13} className="animate-spin" /> : <Upload size={13} />}
                                      Envoyer le justificatif
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setUploadingOrderId(null); setProofFile(null); setProofNotice(''); }}
                                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                  {proofNotice && <p className="text-xs text-orange-700 font-medium">{proofNotice}</p>}
                                </form>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">Paiement par virement bancaire</span>
                                  <button
                                    type="button"
                                    onClick={() => { setUploadingOrderId(order.reference); setProofFile(null); setProofNotice(''); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-2xs transition"
                                  >
                                    <Upload size={13} />
                                    Transmettre le justificatif
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-2xl border border-orange-100 bg-white/70 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Mes adresses</h3>
                  {addresses.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {addresses.map((address) => (
                        <li key={address.id} className="flex items-start justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 text-xs text-slate-600">
                          <span><b className="text-slate-900">{address.label} · {address.recipient_name}</b><br />{address.street}<br />{address.postal_code} {address.city}, {address.country_code}</span>
                          <button type="button" onClick={() => void deleteAddress(address.id)} className="font-semibold text-red-700 hover:text-red-800">Supprimer</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input required name="label" placeholder="Nom (Domicile...)" className="account-input-field" />
                    <input required name="recipient_name" placeholder="Nom du destinataire" className="account-input-field" />
                    <input required name="street" placeholder="Rue et numéro" className="account-input-field sm:col-span-2" />
                    <input required name="postal_code" pattern="[0-9]{5}" maxLength={5} placeholder="Code postal allemand" className="account-input-field" />
                    <input required name="city" placeholder="Ville" className="account-input-field" />
                    <button type="submit" disabled={savingAddress} className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-orange-100 disabled:opacity-50 sm:col-span-2">
                      {savingAddress ? 'Enregistrement...' : 'Enregistrer cette adresse'}
                    </button>
                  </form>
                  {addressError && <p role="alert" className="mt-3 text-xs text-red-700">{addressError}</p>}
                </section>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  href="/produits"
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-950/40 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  Découvrir le catalogue <ArrowRight size={18} />
                </Link>
                <button
                  type="button"
                  className="w-full bg-white/70 hover:bg-orange-50 border border-orange-100 hover:border-orange-200 text-slate-600 hover:text-slate-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm"
                  onClick={handleSignOut}
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Segmented Auth Tabs (Connexion / Inscription) */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200/80 mb-6">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                      mode === 'signin'
                        ? 'bg-white text-slate-950 shadow-xs border border-stone-200/60'
                        : 'text-stone-500 hover:text-slate-900'
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                      mode === 'signup'
                        ? 'bg-white text-slate-950 shadow-xs border border-stone-200/60'
                        : 'text-stone-500 hover:text-slate-900'
                    }`}
                  >
                    Inscription
                  </button>
                </div>
              )}

              {/* Header Title & Subtitle */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {heading}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed font-medium">
                  {mode === 'signup'
                    ? 'Inscrivez-vous pour passer vos commandes facilement.'
                    : mode === 'forgot'
                    ? 'Saisissez votre e-mail pour recevoir un lien de réinitialisation.'
                    : mode === 'update'
                    ? 'Saisissez votre nouveau mot de passe pour sécuriser votre compte.'
                    : 'Connectez-vous à votre compte pour continuer.'}
                </p>
              </div>

              <DarkFormAlert
                notice={notice}
                error={error}
                onDismiss={() => { setNotice(''); setError(''); }}
                onSwitchToSignin={() => switchMode('signin')}
              />

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Prénom
                      </label>
                      <div className="relative flex items-center">
                        <UserRound size={17} className="absolute left-3.5 text-stone-400 pointer-events-none z-10" />
                        <input
                          autoComplete="given-name"
                          name="firstName"
                          placeholder="Max"
                          required
                          className="account-input-field pl-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Nom
                      </label>
                      <div className="relative flex items-center">
                        <UserRound size={17} className="absolute left-3.5 text-stone-400 pointer-events-none z-10" />
                        <input
                          autoComplete="family-name"
                          name="lastName"
                          placeholder="Müller"
                          required
                          className="account-input-field pl-11"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {mode !== 'update' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={17} className="absolute left-3.5 text-stone-400 pointer-events-none z-10" />
                      <input
                        autoComplete="email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        required
                        className="account-input-field pl-11"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        {mode === 'update' ? 'Nouveau mot de passe' : 'Mot de passe'}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          className="text-xs text-orange-600 hover:text-orange-700 hover:underline transition font-bold"
                          onClick={() => switchMode('forgot')}
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <LockKeyhole size={17} className="absolute left-3.5 text-stone-400 pointer-events-none z-10" />
                      <input
                        autoComplete={mode === 'signup' || mode === 'update' ? 'new-password' : 'current-password'}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'signup' ? '8 caractères minimum' : 'Votre mot de passe'}
                        minLength={8}
                        required
                        className="account-input-field pl-11 pr-10"
                      />
                      <button
                        className="absolute right-3 text-stone-400 hover:text-stone-700 transition p-1 z-10"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative flex items-center">
                      <LockKeyhole size={17} className="absolute left-3.5 text-stone-400 pointer-events-none z-10" />
                      <input
                        autoComplete="new-password"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Saisissez à nouveau le mot de passe"
                        minLength={8}
                        required
                        className="account-input-field pl-11 pr-10"
                      />
                    </div>
                  </div>
                )}

                {(needsConfirmationLink || mode === 'signup') && <button type="button" disabled={busy} onClick={resendConfirmation} className="text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4 disabled:opacity-50">Demander un nouveau lien de confirmation</button>}
                {mode === 'update' && (!user || recoveryLinkInvalid) && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Ouvrez le lien de réinitialisation reçu par e-mail pour choisir un nouveau mot de passe.<button type="button" onClick={() => switchMode('forgot')} className="mt-2 block font-bold underline underline-offset-4">Demander un nouveau lien</button></div>}
                <button
                  className="w-full mt-3 bg-[#A33D1E] hover:bg-[#832F15] text-white font-black py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={busy || (mode === 'update' && (!user || recoveryLinkInvalid))}
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="animate-spin" size={18} /> Patientez...
                    </>
                  ) : (
                    <>
                      {mode === 'signup'
                        ? 'Créer mon compte'
                        : mode === 'forgot'
                        ? 'Envoyer le lien'
                        : mode === 'update'
                        ? 'Mettre à jour le mot de passe'
                        : 'Se connecter'} <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switches */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="mt-6 text-center text-xs text-stone-600">
                  {mode === 'signin' ? (
                    <p>
                      Vous n&apos;avez pas de compte ?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        className="font-bold text-slate-950 hover:text-orange-600 transition underline underline-offset-2"
                      >
                        Créer un compte
                      </button>
                    </p>
                  ) : (
                    <p>
                      Vous avez déjà un compte ?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="font-bold text-slate-950 hover:text-orange-600 transition underline underline-offset-2"
                      >
                        Se connecter
                      </button>
                    </p>
                    )}
                  </div>
              )}

              {(mode === 'forgot' || mode === 'update') && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-slate-950 transition"
                    onClick={() => switchMode('signin')}
                  >
                    <ArrowLeft size={15} /> Retour à la connexion
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Embedded Minimalist Footer */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 text-center text-xs text-stone-500">
        <p>© {new Date().getFullYear()} Brennholz-direk — Leylines Park — Sicherer Kundenbereich. Alle Rechte vorbehalten.</p>
        <nav aria-label="Informations juridiques" className="mt-3 flex flex-wrap justify-center gap-4"><Link href="/datenschutz" className="text-stone-600 hover:text-slate-950 underline">Confidentialité</Link><Link href="/retractation#retractation" className="rounded-lg border border-orange-300 bg-orange-50/60 px-3 py-1.5 font-bold text-orange-700 hover:bg-orange-100">Me rétracter du contrat</Link></nav>
      </footer>
    </div>
  ), brenLocale);
}

