import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BodyLimitError, protectApi, readLimitedJson } from '@/lib/api-security';
import { analyticsConsentVersion, validateAnalyticsEvents } from '@/lib/analytics';

export const runtime = 'nodejs';
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) } }) : null;
}
export async function POST(request: Request) {
  try {
    const blocked = await protectApi(request, 120); if (blocked) return blocked;
    const input = await readLimitedJson(request, 16000) as { consent?: string; account_link?: boolean; events?: unknown } | null;
    if (input?.consent !== analyticsConsentVersion) return response({ error: 'consent' }, 400);
    const events = validateAnalyticsEvents(input.events); if (!events) return response({ error: 'invalid' }, 400);
    const db = database(); if (!db) return response({ error: 'unavailable' }, 503);
    let userId: string | null = null;
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (token) {
      const verified = await db.auth.getUser(token);
      if (verified.error || !verified.data.user) return response({ error: 'signin' }, 401);
      const role = await db.from('admin_roles').select('role').eq('user_id', verified.data.user.id).maybeSingle();
      if (role.error) return response({ error: 'unavailable' }, 503);
      if (role.data) return response({ ok: true, excluded: true });
      if (input.account_link === true) userId = verified.data.user.id;
    }
    const result = await db.rpc('record_analytics_events', { p_events: events, p_user_id: userId, p_consent_version: analyticsConsentVersion });
    if (result.error) return response({ error: result.error.code === 'PGRST202' || result.error.code === '42P01' ? 'setup' : 'unavailable' }, 503);
    return response({ ok: true });
  } catch (error) { return response({ error: error instanceof BodyLimitError || error instanceof SyntaxError ? 'invalid' : 'unavailable' }, error instanceof BodyLimitError ? 413 : error instanceof SyntaxError ? 400 : 503); }
}
export async function GET(request: Request) {
  try {
    const blocked = await protectApi(request, 60); if (blocked) return blocked;
    const db = database(); if (!db) return response({ error: 'unavailable' }, 503);
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return response({ error: 'signin' }, 401);
    const verified = await db.auth.getUser(token);
    if (verified.error || !verified.data.user) return response({ error: 'signin' }, 401);
    const role = await db.from('admin_roles').select('role').eq('user_id', verified.data.user.id).maybeSingle();
    if (role.error) return response({ error: 'unavailable' }, 503);
    if (!['admin','super_admin','owner'].includes(role.data?.role ?? '')) return response({ error: 'forbidden' }, 403);
    const params = new URL(request.url).searchParams;
    const days = Number(params.get('days') ?? 30), offset = Number(params.get('offset') ?? 0), session = params.get('session');
    if (![7,30,90].includes(days) || !Number.isInteger(offset) || offset < 0 || offset > 100000 || (session && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(session))) return response({ error: 'invalid' }, 400);
    const result = await db.rpc(session ? 'analytics_session_journey' : 'analytics_dashboard', session ? { p_session: session, p_days: days } : { p_days: days, p_offset: offset });
    if (result.error) {
      const isSetupError = ['PGRST202', 'PGRST204', '42P01', '42883', 'PGRST200', 'PGRST301'].includes(result.error.code);
      return response({ error: isSetupError ? 'setup' : 'unavailable', message: result.error.message, code: result.error.code }, isSetupError ? 200 : 503);
    }
    return response(result.data);
  } catch (cause) {
    return response({ error: 'unavailable', message: cause instanceof Error ? cause.message : String(cause) }, 503);
  }
}
