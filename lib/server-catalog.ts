import { createClient } from '@supabase/supabase-js';
import { mergeCatalog } from '@/lib/catalog';

export async function getServerCatalog() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return mergeCatalog([]);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } });
  const { data, error } = await db.from('product_overrides').select('product_id,data,is_deleted');
  if (error) throw new Error('Catalogue indisponible');
  return mergeCatalog(data ?? []);
}
