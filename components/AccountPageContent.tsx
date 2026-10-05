'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Flame, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup' | 'forgot' | 'update';

function getFrenchAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Adresse e-mail ou mot de passe incorrect.';
  if (normalized.includes('email not confirmed')) return 'Confirmez votre adresse e-mail avant de vous connecter.';
  if (normalized.includes('user already registered')) return 'Un compte existe déjà avec cette adresse e-mail.';
  if (normalized.includes('password should be at least') || normalized.includes('password is too short')) return 'Choisissez un mot de passe plus long.';
  if (normalized.includes('unable to validate email')) return 'Cette adresse e-mail semble invalide.';
  if (normalized.includes('email rate limit exceeded') || normalized.includes('rate limit')) return 'Trop de demandes ont été envoyées. Veuillez patienter avant de réessayer.';
  if (normalized.includes('network') || normalized.includes('fetch')) return 'Connexion impossible pour le moment. Vérifiez votre connexion internet et réessayez.';
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

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    if (new URLSearchParams(window.location.search).get('mode') === 'recovery') setMode('update');

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setReady(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!supabase) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const fullName = String(form.get('fullName') ?? '').trim();
    setBusy(true);

    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/compte`,
          },
        });
        if (authError) throw authError;
        setNotice(data.session ? 'Votre compte est créé. Bienvenue chez ThermoPro !' : 'Votre demande est enregistrée. Consultez votre boîte e-mail pour confirmer la création de votre compte.');
        if (data.session) {
          setUser(data.session.user);
          router.replace('/');
          router.refresh();
        }
      } else if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setUser(data.user);
        router.replace('/');
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
          <Link href="/" className="account-brand"><span><Flame size={22} /></span> THERMO<span className="account-brand__accent">PRO</span></Link>
          <p className="account-eyebrow">Espace client</p>
          <h1>Votre chauffage, en toute simplicité.</h1>
          <p className="account-intro__copy">Retrouvez votre espace personnel ThermoPro et gérez vos accès en toute sécurité.</p>
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
              <div className="account-actions"><Link href="/produits" className="account-submit">Découvrir les produits <ArrowRight size={18} /></Link><button type="button" className="account-secondary" onClick={handleSignOut}>Se déconnecter</button></div>
              <p className="account-footnote">L’historique des commandes sera disponible lorsque le suivi des commandes sera relié à un espace client.</p>
            </div>
          ) : (
            <>
              <p className="account-eyebrow">{mode === 'signup' ? 'Nouveau chez ThermoPro ?' : mode === 'forgot' || mode === 'update' ? 'Récupération du compte' : 'Votre espace ThermoPro'}</p>
              <h1 id="account-title">{heading}</h1>
              <p className="account-muted">{mode === 'signup' ? 'Créez un compte pour retrouver facilement votre espace client.' : mode === 'forgot' ? 'Saisissez votre adresse e-mail pour recevoir un lien sécurisé.' : mode === 'update' ? 'Saisissez un nouveau mot de passe pour votre compte.' : 'Connectez-vous ou créez un compte pour accéder à votre espace client.'}</p>

              {notice && <p className="account-message account-message--success" role="status">{notice}</p>}
              {error && <p className="account-message account-message--error" role="alert">{error}</p>}

              <form className="account-form" onSubmit={handleSubmit}>
                {mode === 'signup' && <label>Nom complet<span className="account-input-wrap"><UserRound size={17} /><input autoComplete="name" name="fullName" placeholder="Votre nom" required /></span></label>}
                {mode !== 'update' && <label>Adresse e-mail<span className="account-input-wrap"><Mail size={17} /><input autoComplete="email" name="email" type="email" placeholder="vous@exemple.fr" required /></span></label>}
                {mode !== 'forgot' && <label>{mode === 'update' ? 'Nouveau mot de passe' : 'Mot de passe'}<span className="account-input-wrap"><LockKeyhole size={17} /><input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} name="password" type={showPassword ? 'text' : 'password'} placeholder="8 caractères minimum" minLength={8} required /><button className="account-password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
                {mode === 'signin' && <button type="button" className="account-forgot" onClick={() => switchMode('forgot')}>Mot de passe oublié ?</button>}
                <button className="account-submit" type="submit" disabled={busy || !isSupabaseConfigured}>
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
