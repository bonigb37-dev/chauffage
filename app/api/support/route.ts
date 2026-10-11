import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BodyLimitError, protectApi, readLimitedJson } from '@/lib/api-security';
import { dispatchSupportMail, supportMailConfigured } from '@/lib/support-mail';

export const runtime = 'nodejs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = 'id,user_id,sender_kind,body,locale,created_at';
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
async function authenticate(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return { error: response({ error: 'unavailable' }, 503) };
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return { error: response({ error: 'signin' }, 401) };
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) } });
  const verified = await db.auth.getUser(token);
  if (verified.error || !verified.data.user || !verified.data.user.email_confirmed_at) return { error: response({ error: 'signin' }, 401) };
  const user = verified.data.user;
  const roles = await db.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (roles.error) return { error: response({ error: 'unavailable' }, 503) };
  const admin = ['admin','super_admin','owner'].includes(roles.data?.role ?? '');
  return { db, user, admin };
}
export async function GET(request: Request) {
  try {
    const blocked = await protectApi(request, 120); if (blocked) return blocked;
    const access = await authenticate(request); if (access.error) return access.error;
    const { db, user, admin } = access;
    const params = new URL(request.url).searchParams;
    if (params.get('notifications') === '1') {
      const counts = await db.rpc('support_notification_counts', { p_reader: user.id });
      if (counts.error) return response({ error: 'setup' }, 503);
      if (!admin) return response(counts.data);
      const mail = await db.rpc('mail_notification_status');
      if (mail.error) return response({ error: 'setup' }, 503);
      return response({ ...counts.data, mail: { ...mail.data, configured: supportMailConfigured() } });
    }
    if (params.get('inbox') === '1') {
      if (!admin) return response({ error: 'forbidden' }, 403);
      const result = await db.from('support_messages').select('user_id,body,locale,created_at,sender_kind').order('created_at', { ascending: false }).limit(500);
      if (result.error) return response({ error: 'setup' }, 503);
      const seen = new Set<string>();
      const threads = (result.data ?? []).filter(row => { if (seen.has(row.user_id)) return false; seen.add(row.user_id); return true; });
      const counts = await db.rpc('support_notification_counts', { p_reader: user.id });
      if (counts.error) return response({ error: 'setup' }, 503);
      const unread = new Map<string, number>((counts.data?.threads ?? []).map((row: { user_id: string; unread: number }) => [row.user_id, row.unread]));
      return response({ threads: threads.map(row => ({ ...row, unread: unread.get(row.user_id) ?? 0 })) });
    }
    const target = params.get('user_id') ?? user.id;
    if (!uuid.test(target)) return response({ error: 'invalid' }, 400);
    if (target !== user.id && !admin) return response({ error: 'forbidden' }, 403);
    const result = await db.from('support_messages').select(fields).eq('user_id', target).order('created_at', { ascending: false }).limit(100);
    if (result.error) return response({ error: 'setup' }, 503);
    return response({ messages: (result.data ?? []).reverse() });
  } catch { return response({ error: 'unavailable' }, 503); }
}
export async function POST(request: Request) {
  try {
    const blocked = await protectApi(request, 20, 10 * 60_000); if (blocked) return blocked;
    const access = await authenticate(request); if (access.error) return access.error;
    const { db, user, admin } = access;
    const payload = await readLimitedJson(request, 14000);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return response({ error: 'invalid' }, 400);
    const body = payload as Record<string, unknown>;
    if (body.action === 'retry_mail') {
      if (!admin) return response({ error: 'forbidden' }, 403);
      return response(await dispatchSupportMail(db, 1));
    }
    if (typeof body.body !== 'string' || !body.body.trim() || body.body.length > 3000 || typeof body.locale !== 'string' || !['de','fr','en'].includes(body.locale)) return response({ error: 'invalid' }, 400);
    const target = body.user_id ?? user.id;
    if (typeof target !== 'string' || !uuid.test(target)) return response({ error: 'invalid' }, 400);
    if (target !== user.id && !admin) return response({ error: 'forbidden' }, 403);
    if (admin) {
      // Administrators reply to existing conversations only.
      const existing = await db.from('support_messages').select('id').eq('user_id', target).limit(1);
      if (existing.error) return response({ error: 'setup' }, 503);
      if (!existing.data?.length) return response({ error: 'invalid' }, 400);
    }
    const result = await db.from('support_messages').insert({ user_id: target, sender_id: user.id, sender_kind: admin ? 'admin' : 'customer', body: body.body.trim(), locale: body.locale });
    if (result.error) return response({ error: 'setup' }, 503);
    try { after(async () => { await dispatchSupportMail(db); }); } catch { /* Outbox retained for retry. */ }
    return response({ success: true }, 201);
  } catch (cause) { const invalid = cause instanceof BodyLimitError || cause instanceof SyntaxError; return response({ error: invalid ? 'invalid' : 'unavailable' }, cause instanceof BodyLimitError ? 413 : invalid ? 400 : 503); }
}

export async function PATCH(request: Request) {
  try {
    const blocked = await protectApi(request, 60); if (blocked) return blocked;
    const access = await authenticate(request); if (access.error) return access.error;
    const { db, user, admin } = access;
    const body = await readLimitedJson(request, 2000) as Record<string, unknown>;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return response({ error: 'invalid' }, 400);
    const target = body.user_id ?? user.id;
    if (typeof target !== 'string' || !uuid.test(target) || typeof body.message_id !== 'string' || !uuid.test(body.message_id)) return response({ error: 'invalid' }, 400);
    if (target !== user.id && !admin) return response({ error: 'forbidden' }, 403);
    const result = await db.rpc('mark_support_read', { p_reader: user.id, p_customer: target, p_message: body.message_id });
    if (result.error) return response({ error: 'setup' }, 503);
    return response({ success: true });
  } catch { return response({ error: 'unavailable' }, 503); }
}
