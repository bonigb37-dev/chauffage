import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'super_admin' | 'owner';
// Share only requests that are currently running. No stored role or persistent role cache.
const pending = new WeakMap<SupabaseClient, Map<string, Promise<AdminRole | null>>>();

export function getAdminRole(client: SupabaseClient, userId: string): Promise<AdminRole | null> {
  let requests = pending.get(client);
  if (!requests) { requests = new Map(); pending.set(client, requests); }
  const existing = requests.get(userId);
  if (existing) return existing;
  const request = (async () => {
    const { data, error } = await client.from('admin_roles').select('role').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data?.role === 'admin' || data?.role === 'super_admin' || data?.role === 'owner' ? data.role as AdminRole : null;
  })();
  requests.set(userId, request);
  void request.finally(() => { requests.delete(userId); }).catch(() => { /* The caller handles errors. */ });
  return request;
}
