import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function protectApi(request: Request, limit: number, windowMs = 60_000) {
  const deny = (error: string, status: number, extra: Record<string, string> = {}) =>
    NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected) return deny('Origine de la demande refusée.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return deny('Origine de la demande refusée.', 403);
  // On Vercel this header is overwritten by the platform; do not trust arbitrary
  // x-forwarded-for supplied by a caller. Local tests deliberately share a bucket.
  const ip = process.env.VERCEL === '1'
    ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    : 'local';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return deny('Service temporairement indisponible. Réessayez plus tard.', 503);
  const key = createHmac('sha256', secret).update(`${request.method}:${new URL(request.url).pathname}:${ip}`).digest('hex');
  try {
    const db = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
    });
    const result = await (async () => {
      try {
        const first = await db.rpc('consume_api_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: Math.ceil(windowMs / 1000) });
        if (!first.error || first.status < 500) return first;
        console.error('API rate-limit check returned a server error:', first.status, first.error.code);
      } catch (cause) {
        console.error('API rate-limit check failed:', cause);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      return db.rpc('consume_api_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: Math.ceil(windowMs / 1000) });
    })();
    const quota = Array.isArray(result.data) ? result.data[0] : null;
    if (result.error || !quota || typeof quota.allowed !== 'boolean' || !Number.isInteger(quota.retry_after) || quota.retry_after < 1 || quota.retry_after > 3600) {
      if (result.error) console.error('API rate-limit check failed after retry:', result.status, result.error.code);
      return deny('Service temporairement indisponible. Réessayez plus tard.', 503);
    }
    return quota.allowed ? null : deny('Trop de demandes. Réessayez plus tard.', 429, { 'Retry-After': String(quota.retry_after) });
  } catch (cause) {
    console.error('API rate-limit check failed after retry:', cause);
    return deny('Service temporairement indisponible. Réessayez plus tard.', 503);
  }
}

export class BodyLimitError extends Error {}
export async function readLimitedBody(request: Request, maxBytes: number) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new BodyLimitError();
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new BodyLimitError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export async function readLimitedJson(request: Request, maxBytes: number): Promise<unknown> {
  return JSON.parse(new TextDecoder().decode(await readLimitedBody(request, maxBytes)));
}
