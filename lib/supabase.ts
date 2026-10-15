import { createClient } from '@supabase/supabase-js';

import { incomingAuthLink } from '@/lib/auth-link';
import { DEFAULT_SUPABASE_URL, DEFAULT_PUBLISHABLE_KEY } from '@/lib/supabase-defaults';

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
// Only expose Supabase's low-privilege publishable key to browser code.
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_PUBLISHABLE_KEY;

// Some browsers deny access to localStorage. Keep authentication usable in
// those browsers without making client initialization fail.
const sessionMemory = new Map<string, string>();
const authStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      if (typeof window !== 'undefined') return window.localStorage.getItem(key) ?? sessionMemory.get(key) ?? null;
    } catch { /* Use memory when browser storage is unavailable. */ }
    return sessionMemory.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    sessionMemory.set(key, value);
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch { /* The session remains available in memory. */ }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    sessionMemory.delete(key);
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch { /* Browser storage is unavailable. */ }
  },
};

function normalizeSupabaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  if (/^sb_(publishable|secret)_/.test(value)) return null;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return (url.protocol === 'http:' || url.protocol === 'https:') && (url.hostname.includes('.') || isLocalhost) ? url.toString() : null;
  } catch {
    return null;
  }
}

const supabaseUrl = normalizeSupabaseUrl(configuredSupabaseUrl);
// Capture recovery intent before the auth client consumes the URL fragment.
export const isPasswordRecoveryRedirect = incomingAuthLink?.kind === 'recovery';
function makeSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) return null;
  try {
    return createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    // Invalid local configuration should not crash unrelated pages.
    return null;
  }
}

export const supabase = makeSupabaseClient();
export const isSupabaseConfigured = Boolean(supabase);
