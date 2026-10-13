import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { BodyLimitError, protectApi, readLimitedJson } from '@/lib/api-security';
import { mergeCatalog } from '@/lib/catalog';
import { draftBucket, draftCookie, draftDatabase, draftId, readDraft, writeDraft, closeDraft, purgeDrafts, type CartDraft } from '@/lib/cart-drafts-server';
export const runtime = 'nodejs';
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization, Cookie' } });
async function admin(request: Request) {
  const db = draftDatabase(); if (!db) return { denied: response({ error: 'unavailable' }, 503) };
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return { denied: response({ error: 'signin' }, 401) };
  const verified = await db.auth.getUser(token);
  if (verified.error || !verified.data.user?.email_confirmed_at) return { denied: response({ error: 'signin' }, 401) };
  const role = await db.from('admin_roles').select('role').eq('user_id', verified.data.user.id).maybeSingle();
  if (role.error) return { denied: response({ error: 'unavailable' }, 503) };
  if (!['admin', 'super_admin', 'owner'].includes(role.data?.role ?? '')) return { denied: response({ error: 'forbidden' }, 403) };
  return { db };
}
export async function POST(request: Request) {
  try {
    const blocked = await protectApi(request, 90); if (blocked) return blocked;
    const input = await readLimitedJson(request, 8000) as { items?: unknown };
    if (!Array.isArray(input?.items) || input.items.length > 50) return response({ error: 'invalid' }, 400);
    const seen = new Set<number>();
    for (const line of input.items) {
      if (!line || !Number.isSafeInteger(line.productId) || line.productId < 1 || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 1000 || seen.has(line.productId)) return response({ error: 'invalid' }, 400);
      seen.add(line.productId);
    }
    const db = draftDatabase(); if (!db) return response({ error: 'unavailable' }, 503);
    let id = draftId(request); let token: string | null = null;
    if (!input.items.length) {
      if (id) { const result = await db.storage.from(draftBucket).remove([`drafts/${id}.json`]); if (result.error) throw result.error; }
      const result = response({ ok: true }); result.cookies.set(draftCookie, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 }); return result;
    }
    if (!id) { token = randomBytes(32).toString('hex'); id = createHash('sha256').update(token).digest('hex'); }
    if (await readDraft(db, `closed/${id}.json`)) return response({ ok: true, closed: true });
    let userId: string | null = null, email: string | null = null;
    const auth = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (auth) {
      const verified = await db.auth.getUser(auth);
      if (verified.error || !verified.data.user?.email_confirmed_at) return response({ error: 'signin' }, 401);
      const role = await db.from('admin_roles').select('role').eq('user_id', verified.data.user.id).maybeSingle();
      if (role.error) throw role.error;
      if (role.data) return response({ ok: true, excluded: true });
      userId = verified.data.user.id; email = verified.data.user.email ?? null;
    }
    const overrides = await db.from('product_overrides').select('product_id,data,is_deleted'); if (overrides.error) throw overrides.error;
    const products = mergeCatalog(overrides.data ?? []);
    const items: CartDraft['items'] = [];
    for (const line of input.items) {
      const p = products.find(p => p.id === line.productId);
      if (!p?.priceAmount || p.stock === 0 || (p.stock !== undefined && line.quantity > p.stock)) return response({ error: 'invalid_product' }, 400);
      items.push({ productId: p.id, name: p.name, quantity: line.quantity, unitPrice: p.priceAmount });
    }
    const previous = await readDraft<CartDraft>(db, `drafts/${id}.json`); const now = new Date().toISOString();
    const draft: CartDraft = { id, createdAt: previous?.createdAt ?? now, updatedAt: now, userId, email, items, totalCents: items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) };
    await writeDraft(db, `drafts/${id}.json`, draft);
    const result = response({ ok: true });
    if (token) result.cookies.set(draftCookie, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 86400 });
    return result;
  } catch (e) { return response({ error: e instanceof BodyLimitError || e instanceof SyntaxError ? 'invalid' : 'unavailable' }, e instanceof BodyLimitError ? 413 : e instanceof SyntaxError ? 400 : 503); }
}
export async function GET(request: Request) {
  try {
    const blocked = await protectApi(request, 60); if (blocked) return blocked;
    const access = await admin(request); if (access.denied) return access.denied;
    const offset = Number(new URL(request.url).searchParams.get('offset') ?? 0); if (!Number.isInteger(offset) || offset < 0 || offset > 100000) return response({ error: 'invalid' }, 400);
    await purgeDrafts(access.db!);
    const listed = await access.db!.storage.from(draftBucket).list('drafts', { limit: 20, offset, sortBy: { column: 'updated_at', order: 'desc' } }); if (listed.error) throw listed.error;
    const drafts = (await Promise.all(listed.data.map(async file => {
      const id = file.name.replace(/\.json$/, '');
      if (!/^[a-f0-9]{64}$/.test(id) || await readDraft(access.db!, `closed/${id}.json`)) return null;
      return readDraft<CartDraft>(access.db!, `drafts/${id}.json`);
    }))).filter(Boolean);
    return response({ drafts, more: listed.data.length === 20 });
  } catch { return response({ error: 'unavailable' }, 503); }
}
export async function DELETE(request: Request) {
  try {
    const blocked = await protectApi(request, 30); if (blocked) return blocked;
    const access = await admin(request); if (access.denied) return access.denied;
    const input = await readLimitedJson(request, 1000) as { id?: unknown };
    if (typeof input?.id !== 'string' || !/^[a-f0-9]{64}$/.test(input.id)) return response({ error: 'invalid' }, 400);
    await closeDraft(access.db!, input.id, 'deleted'); return response({ ok: true });
  } catch { return response({ error: 'unavailable' }, 503); }
}
