import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BodyLimitError, protectApi, readLimitedJson, readLimitedBody } from '@/lib/api-security';
import { attachmentType, attachmentName, supportAttachmentLimit, supportAttachmentBucket } from '@/lib/support-attachments';
import { dispatchSupportMail, supportMailConfigured } from '@/lib/support-mail';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';

export const runtime = 'nodejs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = 'id,user_id,sender_kind,body,locale,created_at,attachment_name,attachment_type,attachment_size';
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
async function authenticate(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;
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
    const isNotifications = new URL(request.url).searchParams.get('notifications') === '1';
    const blocked = await protectApi(request, isNotifications ? 300 : 120); if (blocked) return blocked;
    const access = await authenticate(request); if (access.error) return access.error;
    const { db, user, admin } = access;
    const params = new URL(request.url).searchParams;
    if (params.has('attachment')) {
      const id = params.get('attachment')!;
      if (!uuid.test(id)) return response({ error: 'invalid' }, 400);
      const record = await db.from('support_messages').select('user_id,attachment_path,attachment_name,attachment_type').eq('id',id).maybeSingle();
      if (record.error) return response({ error: 'setup' }, 503);
      if (!record.data || (!admin && record.data.user_id !== user.id)) return response({ error: 'forbidden' }, 403);
      if (!record.data.attachment_path) return response({ error: 'invalid' }, 404);
      const downloaded = await db.storage.from(supportAttachmentBucket).download(record.data.attachment_path);
      if (downloaded.error || !downloaded.data) return response({ error: 'unavailable' }, 503);
      return new Response(await downloaded.data.arrayBuffer(), { headers: { 'Content-Type': record.data.attachment_type || 'application/octet-stream', 'Content-Disposition': `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(attachmentName(record.data.attachment_name || 'attachment'))}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", Vary: 'Authorization' } });
    }
    if (params.get('notifications') === '1') {
      let countsData: { support: number; contacts: number; threads?: unknown[] } | null = null;
      const counts = await db.rpc('support_notification_counts', { p_reader: user.id });
      if (!counts.error && counts.data && typeof counts.data.support === 'number') {
        countsData = counts.data;
      } else {
        try {
          const [contactsRes, supportRes] = await Promise.all([
            db.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
            db.from('support_messages').select('id', { count: 'exact', head: true }).eq('sender_kind', 'customer'),
          ]);
          countsData = {
            support: supportRes.count ?? 0,
            contacts: contactsRes.count ?? 0,
            threads: [],
          };
        } catch {
          if (counts.error) return response({ error: 'setup' }, 503);
        }
      }
      if (!countsData) return response({ error: 'setup' }, 503);
      if (!admin) return response(countsData);
      let mailData = { pending: 0, failed: 0, configured: supportMailConfigured() };
      try {
        const mail = await db.rpc('mail_notification_status');
        if (!mail.error && mail.data) {
          mailData = { ...mail.data, configured: supportMailConfigured() };
        }
      } catch { /* Mail notification status is secondary; do not fail notifications if mail RPC is unavailable */ }
      return response({ ...countsData, mail: mailData });
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
      const profiles = threads.length ? await db.from('client_accounts').select('user_id,full_name').in('user_id', threads.map(row => row.user_id)) : { data: [] };
      const names = new Map<string, string>((profiles.data ?? []).map(row => [row.user_id, typeof row.full_name === 'string' ? row.full_name.trim().slice(0,160) : '']));
      return response({ threads: threads.map(row => ({ ...row, customer_name: names.get(row.user_id) || null, unread: unread.get(row.user_id) ?? 0 })) });
    }
    const target = params.get('user_id') ?? user.id;
    if (!uuid.test(target)) return response({ error: 'invalid' }, 400);
    if (target !== user.id && !admin) return response({ error: 'forbidden' }, 403);
    const result = await db.from('support_messages').select(fields).eq('user_id', target).order('created_at', { ascending: false }).limit(100);
    if (result.error) return response({ error: 'setup' }, 503);
    const profile = admin ? await db.from('client_accounts').select('full_name').eq('user_id',target).maybeSingle() : null;
    const name = typeof profile?.data?.full_name === 'string' ? profile.data.full_name.trim().slice(0,160) : null;
    return response({ messages: (result.data ?? []).reverse().map(row => admin ? { ...row, customer_name: name || null } : row) });
  } catch { return response({ error: 'unavailable' }, 503); }
}
export async function POST(request: Request) {
  try {
    const blocked = await protectApi(request, 20, 10 * 60_000); if (blocked) return blocked;
    const access = await authenticate(request); if (access.error) return access.error;
    const { db, user, admin } = access;
    let file: File | null = null;
    let payload: unknown;
    if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      const bytes = await readLimitedBody(request, supportAttachmentLimit + 20000);
      const form = await new Response(bytes.buffer as ArrayBuffer, { headers: { 'Content-Type': request.headers.get('content-type')! } }).formData();
      const candidate = form.get('file');
      if (!(candidate instanceof File) || !candidate.size || candidate.size > supportAttachmentLimit) return response({ error: 'attachment' }, 400);
      file = candidate;
      payload = { body: form.get('body'), locale: form.get('locale'), ...(form.has('user_id') ? { user_id: form.get('user_id') } : {}) };
    } else payload = await readLimitedJson(request, 14000);
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
    let attachment: Record<string, unknown> = {};
    let uploadedPath: string | null = null;
    if (file) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const detected = attachmentType(bytes);
      if (!detected || file.type !== detected.mime) return response({ error: 'attachment' }, 400);
      uploadedPath = `${target}/${crypto.randomUUID()}.${detected.extension}`;
      const saved = await db.storage.from(supportAttachmentBucket).upload(uploadedPath, bytes, { contentType: detected.mime, upsert: false });
      if (saved.error) return response({ error: 'setup' }, 503);
      attachment = { attachment_path: uploadedPath, attachment_name: attachmentName(file.name), attachment_type: detected.mime, attachment_size: file.size };
    }
    const result = await db.from('support_messages').insert({ user_id: target, sender_id: user.id, sender_kind: admin ? 'admin' : 'customer', body: body.body.trim(), locale: body.locale, ...attachment });
    if (result.error) {
      if (uploadedPath) await db.storage.from(supportAttachmentBucket).remove([uploadedPath]);
      return response({ error: 'setup' }, 503);
    }
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
