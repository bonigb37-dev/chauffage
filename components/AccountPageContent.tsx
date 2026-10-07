'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Flame, LoaderCircle, LockKeyhole, Logs, Mail, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup' | 'forgot' | 'update';
type OwnOrder = { id: number; reference: string; created_at: string; total_cents: number; status: string; payment_status: string; items: unknown };
type OwnAddress = { id: number; label: string; recipient_name: string; street: string; postal_code: string; city: string; country_code: string };

function getFrenchAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Adresse e-mail ou mot de passe incorrect.';
  if (normalized.includes('email not confirmed')) return 'Confirmez votre adresse e-mail avant de vous connecter.';
  if (normalized.includes('user already registered')) return 'Un compte existe déjà avec cette adresse e-mail.';
  if (normalized.includes('password should be at least') || normalized.includes('password is too short')) return 'Choisissez un mot de passe plus long.';
  if (normalized.includes('unable to validate email')) return 'Cette adresse e-mail semble invalide.';
  if (normalized.includes('email rate limit exceeded') || normalized.includes('rate limit')) return 'Trop de demandes ont été envoyées. Veuillez patienter avant de réessayer.';
  if (normalized.includes('network') || normalized.includes('fetch')) return 'Impossible de joindre Supabase. Vérifiez les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans l’environnement Vercel, puis redéployez.';
  return 'Une erreur est survenue lors de la demande. Vérifiez les informations saisies puis réessayez.';
}

export default function AccountPageContent() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
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
    if (!supabase) {
      setReady(true);
      return;
    }
    const supabaseClient = supabase;

    if (new URLSearchParams(window.location.search).get('mode') === 'recovery') setMode('update');

    let mounted = true;
    const loadOwnOrders = async (userId: string) => {
      const { data, error: queryError } = await supabaseClient.from('order_requests')
        .select('id, reference, created_at, total_cents, status, payment_status, items')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      if (!mounted) return;
      if (queryError) setOrdersError('L’historique sera disponible après activation de la migration commerce Supabase.');
      else { setOrders(data as OwnOrder[]); setOrdersError(''); }
      const addressResult = await supabaseClient.from('customer_addresses').select('id,label,recipient_name,street,postal_code,city,country_code').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at', { ascending: false }).limit(20);
      if (!mounted) return;
      if (!addressResult.error) setAddresses(addressResult.data as OwnAddress[]);
    };
    supabaseClient.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setReady(true);
        if (data.session?.user) void loadOwnOrders(data.session.user.id);
      }
    });
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
      if (session?.user) void loadOwnOrders(session.user.id);
      else setOrders([]);
    });

    return () => {
      mounted = false;
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
    setSavingAddress(true); setAddressError('');
    const { error: saveError } = await supabase.from('customer_addresses').insert({
      user_id: user.id, label: String(values.label || 'Adresse'), recipient_name: String(values.recipient_name || ''),
      street: String(values.street || ''), postal_code: String(values.postal_code || ''), city: String(values.city || ''), country_code: 'DE',
    });
    if (saveError) setAddressError('Impossible d’enregistrer cette adresse. Vérifiez la migration commerce et le code postal allemand.');
    else {
      const { data } = await supabase.from('customer_addresses').select('id,label,recipient_name,street,postal_code,city,country_code').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
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
        const destination = roleData?.role === 'super_admin'
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
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? getFrenchAuthError(submitError.message) : 'Une erreur est survenue. Réessayez dans quelques instants.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    setError('');
    const { error: authError } = await supabase.auth.signOut();
    if (authError) setError(getFrenchAuthError(authError.message));
    else {
      setUser(null);
      setNotice('Vous êtes déconnecté.');
      router.refresh();
    }
  }

  const heading = mode === 'signup' ? 'Créer votre compte' : mode === 'forgot' ? 'Mot de passe oublié ?' : mode === 'update' ? 'Choisissez un nouveau mot de passe' : 'Ravi de vous retrouver';

  return (
    <main className="account-page">
      <div className="account-shell">
        <section className="account-intro">
          <Link href="/" aria-label="Bren-nholz, accueil" className="account-brand"><span><Logs size={23} strokeWidth={2.2} /></span> Bren-nholz</Link>
          <p className="account-eyebrow">Espace client</p>
          <h1>Votre chauffage, en toute simplicité.</h1>
          <p className="account-intro__copy">Retrouvez votre espace personnel Bren-nholz et gérez vos accès en toute sécurité.</p>
          <div className="account-benefits">
            <p><CheckCircle2 size={18} /> Un espace personnel protégé</p>
            <p><CheckCircle2 size={18} /> Une inscription rapide et gratuite</p>
            <p><CheckCircle2 size={18} /> Vos informations restent privées</p>
          </div>
        </section>

        <section className="account-card" aria-labelledby="account-title">
          <div className="account-card__top"><div className="account-card__icon"><UserRound size={21} /></div><Link href="/" className="account-back"><ArrowLeft size={16} /> Retour à la boutique</Link></div>
          {!ready ? <div className="account-loading"><LoaderCircle className="animate-spin" /> Chargement de votre espace…</div> : user ? (
            <div className="account-signed-in">
              <div className="account-success-icon"><CheckCircle2 size={28} /></div>
              <p className="account-eyebrow">Compte connecté</p>
              <h1 id="account-title">Bienvenue</h1>
              <p className="account-muted">Vous êtes connecté avec l’adresse <strong>{user.email}</strong>.</p>
              {notice && <p className="account-message account-message--success" role="status">{notice}</p>}
              {error && <p className="account-message account-message--error" role="alert">{error}</p>}
              <section className="mt-7 border-t border-stone-200 pt-6 text-left"><h2 className="text-lg font-bold text-gray-950">Mes commandes</h2>{ordersError ? <p className="mt-3 text-sm text-amber-800">{ordersError}</p> : orders.length === 0 ? <p className="mt-3 text-sm text-gray-600">Aucune commande liée à ce compte pour le moment.</p> : <ul className="mt-3 space-y-3">{orders.map((order) => <li key={order.id} className="rounded-xl border border-stone-200 p-4"><div className="flex flex-wrap justify-between gap-2"><b>{order.reference}</b><span className="text-sm text-gray-600">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_cents / 100)}</span></div><p className="mt-1 text-xs text-gray-500">{new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(order.created_at))} · Virement {order.payment_status === 'confirmed' ? 'confirmé' : 'en attente'}</p></li>)}</ul>}</section>
              <section className="mt-7 border-t border-stone-200 pt-6 text-left"><h2 className="text-lg font-bold text-gray-950">Mes adresses</h2>{addresses.length > 0 && <ul className="mt-3 space-y-2">{addresses.map((address) => <li key={address.id} className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 p-3 text-sm"><span><b>{address.label} · {address.recipient_name}</b><br/>{address.street}<br/>{address.postal_code} {address.city}, {address.country_code}</span><button type="button" onClick={() => void deleteAddress(address.id)} className="font-semibold text-red-700">Supprimer</button></li>)}</ul>}<form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2"><input required name="label" placeholder="Nom (Domicile…)" className="rounded-lg border border-stone-300 px-3 py-2 text-sm"/><input required name="recipient_name" placeholder="Nom du destinataire" className="rounded-lg border border-stone-300 px-3 py-2 text-sm"/><input required name="street" placeholder="Rue et numéro" className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"/><input required name="postal_code" pattern="[0-9]{5}" maxLength={5} placeholder="Code postal allemand" className="rounded-lg border border-stone-300 px-3 py-2 text-sm"/><input required name="city" placeholder="Ville" className="rounded-lg border border-stone-300 px-3 py-2 text-sm"/><button type="submit" disabled={savingAddress} className="rounded-lg bg-gray-950 px-4 py-2 font-bold text-white disabled:opacity-50 sm:col-span-2">{savingAddress ? 'Enregistrement…' : 'Enregistrer cette adresse'}</button></form>{addressError && <p role="alert" className="mt-3 text-sm text-red-700">{addressError}</p>}</section>
              <div className="account-actions"><Link href="/produits" className="account-submit">Découvrir les produits <ArrowRight size={18} /></Link><button type="button" className="account-secondary" onClick={handleSignOut}>Se déconnecter</button></div>
            </div>
          ) : (
            <>
              <p className="account-eyebrow">{mode === 'signup' ? 'Nouveau chez Bren-nholz ?' : mode === 'forgot' || mode === 'update' ? 'Récupération du compte' : 'Votre espace Bren-nholz'}</p>
              <h1 id="account-title">{heading}</h1>
              <p className="account-muted">{mode === 'signup' ? 'Créez un compte pour retrouver facilement votre espace client.' : mode === 'forgot' ? 'Saisissez votre adresse e-mail pour recevoir un lien sécurisé.' : mode === 'update' ? 'Saisissez un nouveau mot de passe pour votre compte.' : 'Connectez-vous ou créez un compte pour accéder à votre espace client.'}</p>

              {notice && <p className="account-message account-message--success" role="status">{notice}</p>}
              {error && <p className="account-message account-message--error" role="alert">{error}</p>}

              <form className="account-form" onSubmit={handleSubmit}>
                {mode === 'signup' && <>
                  <label>Prénom<span className="account-input-wrap"><UserRound size={17} /><input autoComplete="given-name" name="firstName" placeholder="Votre prénom" required /></span></label>
                  <label>Nom de famille<span className="account-input-wrap"><UserRound size={17} /><input autoComplete="family-name" name="lastName" placeholder="Votre nom de famille" required /></span></label>
                </>}
                {mode !== 'update' && <label>Adresse e-mail<span className="account-input-wrap"><Mail size={17} /><input autoComplete="email" name="email" type="email" placeholder="vous@exemple.fr" required /></span></label>}
                {mode !== 'forgot' && <label>{mode === 'update' ? 'Nouveau mot de passe' : 'Mot de passe'}<span className="account-input-wrap"><LockKeyhole size={17} /><input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} name="password" type={showPassword ? 'text' : 'password'} placeholder="8 caractères minimum" minLength={8} required /><button className="account-password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
                {mode === 'signup' && <label>Confirmer le mot de passe<span className="account-input-wrap"><LockKeyhole size={17} /><input autoComplete="new-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Saisissez à nouveau le mot de passe" minLength={8} required /><button className="account-password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
                {mode === 'signin' && <button type="button" className="account-forgot" onClick={() => switchMode('forgot')}>Mot de passe oublié ?</button>}
                <button className="account-submit" type="submit" disabled={busy}>
                  {busy ? <><LoaderCircle className="animate-spin" size={18} /> Patientez…</> : <>{mode === 'signup' ? 'Créer mon compte' : mode === 'forgot' ? 'Envoyer le lien de réinitialisation' : mode === 'update' ? 'Mettre à jour le mot de passe' : 'Se connecter'} <ArrowRight size={18} /></>}
                </button>
              </form>

              {(mode === 'signin' || mode === 'signup') && <p className="account-switch">{mode === 'signup' ? 'Vous avez déjà un compte ?' : 'Vous découvrez la boutique ?'} <button type="button" onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Se connecter' : 'Créer un compte'}</button></p>}
              {(mode === 'forgot' || mode === 'update') && <button type="button" className="account-return" onClick={() => switchMode('signin')}><ArrowLeft size={16} /> Retour à la connexion</button>}
              <p className="account-privacy">Vos informations sont utilisées pour gérer votre espace client. Une question sur vos données ? <Link href="/contact">Contactez notre équipe</Link>.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
