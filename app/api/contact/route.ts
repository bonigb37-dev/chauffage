import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BodyLimitError, protectApi, readLimitedJson } from '@/lib/api-security';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const blocked = protectApi(request, 5, 10 * 60_000);
  if (blocked) return blocked;
  const headers = { 'Cache-Control': 'no-store' };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Service indisponible.', 503);
  try {
    const body = await readLimitedJson(request, 24_000);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Demande invalide.', 400);
    const { name, email, phone, postal_code, subject, message } = body as Record<string, unknown>;
    const text = (value: unknown, max: number, required = false) => typeof value === 'string' && value.length <= max && (!required || Boolean(value.trim()));
    if (!text(name, 120, true) || !text(email, 254, true) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string)
      || !text(message, 5000, true) || (phone != null && !text(phone, 50))
      || (postal_code != null && (typeof postal_code !== 'string' || !/^\d{5}$/.test(postal_code)))
      || typeof subject !== 'string' || !['product','quote','delivery','order','claim','other'].includes(subject)) return fail('Demande invalide.', 400);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    // Never forward arbitrary browser fields such as status, id or created_at.
    const result = await db.from('contact_requests').insert({
      name: (name as string).trim(), email: (email as string).trim().toLowerCase(),
      phone: typeof phone === 'string' ? phone.trim() || null : null,
      postal_code: postal_code ?? null, subject, message: (message as string).trim(),
    });
    if (result.error) return fail('La demande n’a pas pu être enregistrée.', 503);
    return NextResponse.json({ success: true }, { status: 201, headers });
  } catch (cause) { return fail('Demande invalide.', cause instanceof BodyLimitError ? 413 : 400); }
}
