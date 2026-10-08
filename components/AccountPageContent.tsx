'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldAlert,
  UserCheck,
  UserRound,
  WifiOff,
  X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isPasswordRecoveryRedirect, supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup' | 'forgot' | 'update';
type OwnOrder = { id: number; reference: string; created_at: string; total_cents: number; status: string; payment_status: string; items: unknown };
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
  if (!error && !notice) return null;

  if (notice) {
    return (
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
    );
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

  return (
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
  );
}

/* Background Animated Hearth Loop (Cinematic 14-second loop) */
function BackgroundHearthLoop() {
  return (
    <div className="bg-hearth-canvas" aria-hidden="true">
      <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] flex items-center justify-center">
        <svg
          className="w-full h-full relative z-10"
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="hearthRadialGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#ea580c" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#9a3412" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#08090b" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="logGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#854823" />
              <stop offset="35%" stopColor="#542c13" />
              <stop offset="70%" stopColor="#3d1d0a" />
              <stop offset="100%" stopColor="#241004" />
            </linearGradient>

            <linearGradient id="logGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#965228" />
              <stop offset="50%" stopColor="#5c3014" />
              <stop offset="100%" stopColor="#311707" />
            </linearGradient>

            <linearGradient id="logGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8d4c24" />
              <stop offset="50%" stopColor="#542b12" />
              <stop offset="100%" stopColor="#2b1305" />
            </linearGradient>

            <linearGradient id="flameOuter" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="30%" stopColor="#ea580c" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>

            <linearGradient id="flameInner" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <linearGradient id="flameCore" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <filter id="hearthGlowBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" />
            </filter>

            <filter id="sparkBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          {/* Ambient Glow */}
          <circle
            cx="150"
            cy="170"
            r="90"
            fill="url(#hearthRadialGlow)"
            className="bg-glow"
            filter="url(#hearthGlowBlur)"
          />

          {/* Log 1 (Base horizontal log) */}
          <g className="bg-log-1">
            <rect
              x="60"
              y="210"
              width="180"
              height="24"
              rx="12"
              fill="url(#logGrad1)"
            />
            <path
              d="M85 218 H215 M95 225 H200"
              stroke="#261004"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.65"
            />
            <ellipse cx="72" cy="222" rx="8" ry="10" fill="#a06035" />
            <ellipse cx="72" cy="222" rx="4" ry="5.5" fill="#5e3318" />
          </g>

          {/* Log 2 (Left diagonal log) */}
          <g className="bg-log-2">
            <rect
              x="70"
              y="190"
              width="160"
              height="22"
              rx="11"
              fill="url(#logGrad2)"
            />
            <path
              d="M92 197 H210 M105 204 H195"
              stroke="#200a02"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.6"
            />
            <ellipse cx="82" cy="201" rx="7" ry="9" fill="#9c5b31" />
          </g>

          {/* Log 3 (Right diagonal log) */}
          <g className="bg-log-3">
            <rect
              x="70"
              y="190"
              width="160"
              height="22"
              rx="11"
              fill="url(#logGrad3)"
            />
            <path
              d="M92 197 H210 M105 204 H195"
              stroke="#1f0902"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.6"
            />
            <ellipse cx="218" cy="201" rx="7" ry="9" fill="#95542b" />
          </g>

          {/* Spark starburst */}
          <g className="bg-spark">
            <circle cx="150" cy="180" r="12" fill="#fef08a" filter="url(#sparkBlur)" />
            <path
              d="M150 160 L153.5 176.5 L170 180 L153.5 183.5 L150 200 L146.5 183.5 L130 180 L146.5 176.5 Z"
              fill="#ffffff"
            />
          </g>

          {/* Dancing Flame */}
          <g className="bg-flame">
            <path
              d="M150 65 C180 105 192 142 183 177 C174 207 126 207 117 177 C108 142 120 105 150 65 Z"
              fill="url(#flameOuter)"
            />
            <path
              d="M150 90 C170 120 177 147 171 172 C165 195 135 195 129 172 C123 147 130 120 150 90 Z"
              fill="url(#flameInner)"
            />
            <path
              d="M150 120 C160 138 165 156 160 170 C155 183 145 183 140 170 C135 156 140 138 150 120 Z"
              fill="url(#flameCore)"
            />
          </g>

          {/* Floating Embers */}
          <circle cx="140" cy="125" r="3" fill="#facc15" className="bg-ember-1" />
          <circle cx="162" cy="105" r="3.5" fill="#f97316" className="bg-ember-2" />
          <circle cx="148" cy="80" r="2.5" fill="#fef08a" className="bg-ember-3" />
        </svg>
      </div>
    </div>
  );
}

export default function AccountPageContent() {
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

  useEffect(() => {
    const urlMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null;
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
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
      const [orderResult, addressResult] = await Promise.all([
        supabaseClient.from('order_requests')
        .select('id, reference, created_at, total_cents, status, payment_status, items')
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
            emailRedirectTo: `${window.location.origin}/compte`,
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
        const { data: roleData, error: roleError } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (roleError) {
          setError('Vous êtes connecté, mais votre rôle n’a pas pu être vérifié. Réessayez de vous connecter pour accéder à votre tableau de bord.');
          return;
        }
        const destination = roleData?.role === 'owner' || roleData?.role === 'super_admin'
          ? '/super-admin'
          : roleData?.role === 'admin' ? '/admin' : '/';
        router.replace(destination);
        router.refresh();
      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/compte?mode=recovery`,
        });
        if (authError) throw authError;
        setNotice('Si cette adresse est associée à un compte, un lien de réinitialisation vient de lui être envoyé.');
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setNotice('Votre mot de passe a été mis à jour.');
        window.history.replaceState({}, '', '/compte');
        setMode('signin');
        router.replace('/');
      }
    } catch (submitError) {
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
      setNotice('Vous êtes déconnecté.');
      router.refresh();
    }
  }

  const heading =
    mode === 'signup'
      ? 'Créer un compte '
      : mode === 'forgot'
      ? 'Mot de passe oublié ?'
      : mode === 'update'
      ? 'Nouveau mot de passe'
      : 'Bon retour ';

  return (
    <div className="account-auth-container min-h-dvh flex flex-col justify-between relative overflow-hidden text-white">
      {/* Background Animated Hearth Loop */}
      <BackgroundHearthLoop />

      {/* Embedded Minimalist Header */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
        <Link href="/" aria-label="Bren-nholz, accueil" className="group flex items-center gap-2.5 font-black text-xl tracking-tight text-white transition">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 group-hover:bg-orange-600 transition">
            <Flame size={23} strokeWidth={2.2} fill="currentColor" />
          </span>
          <span className="text-white font-black tracking-tight text-xl">
            Bren<span className="text-orange-500">-</span>nholz
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition backdrop-blur-md"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Retour boutique</span>
          <span className="sm:hidden">Boutique</span>
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="account-dark-glass-card">
          {!ready ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <LoaderCircle className="animate-spin text-orange-500" size={28} />
              <span className="text-sm font-medium text-zinc-400">Chargement de votre espace...</span>
            </div>
          ) : user && mode !== 'update' ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-400 mb-1">Compte connecté</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Bienvenue</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Connecté avec l’adresse <strong className="text-zinc-200">{user.email}</strong>
                </p>
              </div>

              <DarkFormAlert notice={notice} error={error} onDismiss={() => { setNotice(''); setError(''); }} />

              <div className="space-y-5 text-left">
                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-sm font-bold text-white">Mes commandes</h3>
                  {ordersError ? (
                    <p className="mt-2 text-xs leading-relaxed text-amber-300">{ordersError}</p>
                  ) : orders.length === 0 ? (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">Aucune commande liée à ce compte pour le moment.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {orders.map((order) => (
                        <li key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <b className="text-white">{order.reference}</b>
                            <span className="text-zinc-300">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_cents / 100)}</span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(order.created_at))} · Virement {order.payment_status === 'confirmed' ? 'confirmé' : 'en attente'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-sm font-bold text-white">Mes adresses</h3>
                  {addresses.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {addresses.map((address) => (
                        <li key={address.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
                          <span><b className="text-white">{address.label} · {address.recipient_name}</b><br />{address.street}<br />{address.postal_code} {address.city}, {address.country_code}</span>
                          <button type="button" onClick={() => void deleteAddress(address.id)} className="font-semibold text-red-300 hover:text-red-200">Supprimer</button>
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
                    <button type="submit" disabled={savingAddress} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50 sm:col-span-2">
                      {savingAddress ? 'Enregistrement...' : 'Enregistrer cette adresse'}
                    </button>
                  </form>
                  {addressError && <p role="alert" className="mt-3 text-xs text-red-300">{addressError}</p>}
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
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm"
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
                <div className="flex items-center p-1 bg-[#090A0D]/80 rounded-2xl border border-white/10 mb-6 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                      mode === 'signin'
                        ? 'bg-zinc-800 text-white shadow-md border border-white/15'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                      mode === 'signup'
                        ? 'bg-zinc-800 text-white shadow-md border border-white/15'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Inscription
                  </button>
                </div>
              )}

              {/* Header Title & Subtitle */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {heading}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        Prénom
                      </label>
                      <div className="relative flex items-center">
                        <UserRound size={17} className="absolute left-3 text-zinc-500 pointer-events-none" />
                        <input
                          autoComplete="given-name"
                          name="firstName"
                          placeholder="Jean"
                          required
                          className="account-input-field"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        Nom
                      </label>
                      <div className="relative flex items-center">
                        <UserRound size={17} className="absolute left-3 text-zinc-500 pointer-events-none" />
                        <input
                          autoComplete="family-name"
                          name="lastName"
                          placeholder="Dupont"
                          required
                          className="account-input-field"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {mode !== 'update' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={17} className="absolute left-3 text-zinc-500 pointer-events-none" />
                      <input
                        autoComplete="email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        required
                        className="account-input-field"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        {mode === 'update' ? 'Nouveau mot de passe' : 'Mot de passe'}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          className="text-xs text-orange-400 hover:text-orange-300 hover:underline transition font-medium"
                          onClick={() => switchMode('forgot')}
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <LockKeyhole size={17} className="absolute left-3 text-zinc-500 pointer-events-none" />
                      <input
                        autoComplete={mode === 'signup' || mode === 'update' ? 'new-password' : 'current-password'}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'signup' ? '8 caractères minimum' : 'Votre mot de passe'}
                        minLength={8}
                        required
                        className="account-input-field pr-10"
                      />
                      <button
                        className="absolute right-3 text-zinc-400 hover:text-white transition p-1"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative flex items-center">
                      <LockKeyhole size={17} className="absolute left-3 text-zinc-500 pointer-events-none" />
                      <input
                        autoComplete="new-password"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Saisissez à nouveau le mot de passe"
                        minLength={8}
                        required
                        className="account-input-field pr-10"
                      />
                    </div>
                  </div>
                )}

                <button
                  className="w-full mt-2 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-950/40 hover:shadow-orange-900/60 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#121215]"
                  type="submit"
                  disabled={busy}
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
                <div className="mt-6 text-center text-xs text-zinc-400">
                  {mode === 'signin' ? (
                    <p>
                      Vous n&apos;avez pas de compte ?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        className="font-bold text-white hover:text-orange-400 transition underline underline-offset-2"
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
                        className="font-bold text-white hover:text-orange-400 transition underline underline-offset-2"
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
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
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Bren-nholz — Espace sécurisé. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

