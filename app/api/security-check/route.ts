import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Operational, read-only check for key rotation. It is never called by the UI.
// A short-lived HMAC proves the caller and deployment use the same server key;
// the private key itself is never sent to this endpoint or returned from it.
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const fail = (status: number) => NextResponse.json({ ok: false }, { status, headers });
  const url = new URL(request.url);
  const timestamp = url.searchParams.get('timestamp') ?? '';
  const nonce = url.searchParams.get('nonce') ?? '';
  const provided = request.headers.get('x-security-check-signature') ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const project = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!key || !project) return fail(503);
  if (!/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(provided)
    || Math.abs(Date.now() / 1000 - Number(timestamp)) > 60) return fail(401);
  const expected = createHmac('sha256', key).update(`GET:/api/security-check:${timestamp}:${nonce}`).digest();
  if (!timingSafeEqual(Buffer.from(provided,'hex'), expected)) return fail(401);
  try {
    const db = createClient(project, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
    });
    // No rows, count or customer information are returned; no write/RPC.
    const result = await db.from('order_requests').select('id').limit(0);
    if (result.error) return fail(503);
    return NextResponse.json({ ok: true, deploymentKeyMatches: true, backendReadVerified: true }, { headers });
  } catch { return fail(503); }
}
