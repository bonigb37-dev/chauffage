import type { SupabaseClient } from '@supabase/supabase-js';

export const confirmationMessage = 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Willkommen bei Bren-nholz, Ihr Kundenkonto ist jetzt aktiv.';
export function readAuthLink(url: string) {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.slice(1));
  const get = (key: string) => hash.get(key) ?? parsed.searchParams.get(key);
  const type = get('type');
  const mode = parsed.searchParams.get('mode');
  const error = get('error_code') || get('error') || get('error_description');
  const kind = type === 'recovery' || mode === 'recovery' ? 'recovery' : type === 'signup' || mode === 'confirm' || error ? 'confirmation' : null;
  return { kind, error: Boolean(error), expired: get('error_code') === 'otp_expired', accessToken: get('access_token'), code: get('code') };
}
export const incomingAuthLink = typeof window === 'undefined' ? null : readAuthLink(window.location.href);
let confirmationUserId: string | null = null;
let verification: Promise<{ success: boolean; recovery: boolean; expired: boolean }> | null = null;
export function wasEmailConfirmed(userId: string) { return confirmationUserId === userId; }
export function clearEmailConfirmation() { confirmationUserId = null; }
export async function verifyAuthLink(client: SupabaseClient, intent: ReturnType<typeof readAuthLink>) {
  const failure = { success: false, recovery: intent.kind === 'recovery', expired: intent.expired };
  if (intent.error || (!intent.accessToken && !intent.code)) return failure;
  const initialized = await client.auth.initialize();
  if (initialized.error) return failure;
  const { data, error } = await client.auth.getSession();
  if (error || !data.session || (intent.accessToken && data.session.access_token !== intent.accessToken)) return failure;
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user || verified.data.user.id !== data.session.user.id || !verified.data.user.email_confirmed_at) return failure;
  if (intent.kind === 'confirmation') confirmationUserId = verified.data.user.id;
  return { success: true, recovery: intent.kind === 'recovery', expired: false };
}
export function verifyIncomingAuthLink(client: SupabaseClient) {
  if (!verification && incomingAuthLink?.kind) {
    verification = verifyAuthLink(client, incomingAuthLink).catch(() => ({ success: false, recovery: incomingAuthLink.kind === 'recovery', expired: false })).finally(() => {
      incomingAuthLink.accessToken = null;
      incomingAuthLink.code = null;
    });
  }
  return verification;
}
