import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

// Burst protection per server instance, not a distributed quota. Use the
// Vercel Firewall for a durable limit across instances and cold starts.
const windows = new Map<string, { count: number; until: number }>();
export function protectApi(request: Request, limit: number, windowMs = 60_000) {
  const deny = (error: string, status: number, extra: Record<string, string> = {}) =>
    NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected) return deny('Origine de la demande refusée.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return deny('Origine de la demande refusée.', 403);
  const now = Date.now();
  for (const [key, value] of windows) if (value.until <= now) windows.delete(key);
  // On Vercel this header is overwritten by the platform; do not trust arbitrary
  // x-forwarded-for supplied by a caller. Local tests deliberately share a bucket.
  const ip = process.env.VERCEL === '1'
    ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    : 'local';
  const key = createHash('sha256').update(`${new URL(request.url).pathname}:${ip}`).digest('hex');
  let entry = windows.get(key);
  if (!entry) {
    if (windows.size >= 10_000) return deny('Trop de demandes. Réessayez plus tard.', 429, { 'Retry-After': '60' });
    entry = { count: 0, until: now + windowMs }; windows.set(key, entry);
  }
  if (++entry.count > limit) return deny('Trop de demandes. Réessayez plus tard.', 429, { 'Retry-After': String(Math.ceil((entry.until - now) / 1000)) });
  return null;
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
