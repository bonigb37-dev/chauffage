import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';
import { parseBankDetails, type BankDetails } from '@/lib/bank-details';

export async function getBankDetails(): Promise<BankDetails> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    });
  const { data, error } = await db.from('site_settings').select('value').eq('key', 'bank_transfer').maybeSingle();
  const details = !error && typeof data?.value?.details === 'string' ? parseBankDetails(data.value.details) : null;
  if (!details) throw new Error('Die aktuelle Bankverbindung ist nicht verfügbar. Bitte kontaktieren Sie den Kundenservice.');
  return details;
}
