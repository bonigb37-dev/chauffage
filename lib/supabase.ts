import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
// Only expose Supabase's low-privilege publishable key to browser code.
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
function makeSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) return null;
  try {
    return createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
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
