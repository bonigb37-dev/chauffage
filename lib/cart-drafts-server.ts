import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
export const draftBucket = 'private-cart-drafts';
export const draftCookie = 'bren-cart-session';
export type DraftLine = { productId: number; name: string; quantity: number; unitPrice: number };
export type CartDraft = { id: string; createdAt: string; updatedAt: string; userId: string | null; email: string | null; items: DraftLine[]; totalCents: number };
export function draftDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) } }) : null;
}
export function draftId(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith(draftCookie + '='))?.slice(draftCookie.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? createHash('sha256').update(value).digest('hex') : null;
}
export async function readDraft<T>(db: SupabaseClient, path: string): Promise<T | null> {
  const result = await db.storage.from(draftBucket).download(path);
  if (result.error) {
    if (String(result.error.message).toLowerCase().includes('not found') || (result.error as unknown as { statusCode?: string }).statusCode === '404') return null;
    throw new Error('draft_storage');
  }
  const envelope = JSON.parse(await result.data.text());
  const key = createHash('sha256').update(process.env.SUPABASE_SERVICE_ROLE_KEY! + ':cart-drafts').digest();
  const cipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'hex'));
  cipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
  const bytes = Buffer.concat([cipher.update(Buffer.from(envelope.data, 'base64')), cipher.final()]);
  return JSON.parse(bytes.toString('utf8')) as T;
}
export async function writeDraft(db: SupabaseClient, path: string, value: unknown) {
  const key = createHash('sha256').update(process.env.SUPABASE_SERVICE_ROLE_KEY! + ':cart-drafts').digest(), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const result = await db.storage.from(draftBucket).upload(path, JSON.stringify({ iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('base64') }), { contentType: 'application/json', upsert: true });
  if (result.error) throw new Error('draft_storage');
}
export async function closeDraft(db: SupabaseClient, id: string, reason: 'deleted' | 'converted') {
  // A separate marker prevents a late browser update from resurrecting a closed cart.
  await writeDraft(db, `closed/${id}.json`, { reason, closedAt: new Date().toISOString() });
  const removed = await db.storage.from(draftBucket).remove([`drafts/${id}.json`]);
  if (removed.error) throw new Error('draft_storage');
}
export async function purgeDrafts(db: SupabaseClient) {
  const cutoff = Date.now() - 30 * 86400000;
  for (const prefix of ['drafts', 'closed']) {
    const result = await db.storage.from(draftBucket).list(prefix, { limit: 100, sortBy: { column: 'updated_at', order: 'asc' } });
    if (result.error) throw new Error('draft_storage');
    const paths = result.data.filter(f => f.updated_at && Date.parse(f.updated_at) < cutoff).map(f => `${prefix}/${f.name}`);
    if (paths.length) { const removed = await db.storage.from(draftBucket).remove(paths); if (removed.error) throw new Error('draft_storage'); }
  }
}
