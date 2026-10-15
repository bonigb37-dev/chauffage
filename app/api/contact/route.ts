import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BodyLimitError, protectApi, readLimitedJson } from '@/lib/api-security';
import { dispatchSupportMail } from '@/lib/support-mail';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const blocked = await protectApi(request, 5, 10 * 60_000);
  if (blocked) return blocked;
  const headers = { 'Cache-Control': 'no-store' };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Kontaktformular vorübergehend nicht verfügbar.', 503);
  try {
    const body = await readLimitedJson(request, 24_000);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Ungültige Anfrage.', 400);
    const { name, email, phone, postal_code, subject, message } = body as Record<string, unknown>;
    const text = (value: unknown, max: number, required = false) => typeof value === 'string' && value.length <= max && (!required || Boolean(value.trim()));
    if (!text(name, 120, true) || !text(email, 254, true) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string)
      || !text(message, 5000, true) || (phone != null && !text(phone, 50))
      || (postal_code != null && (typeof postal_code !== 'string' || !/^\d{5}$/.test(postal_code)))
      || typeof subject !== 'string' || !['product','quote','delivery','order','claim','other'].includes(subject)) return fail('Bitte füllen Sie alle erforderlichen Felder korrekt aus.', 400);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    // Never forward arbitrary browser fields such as status, id or created_at.
    const result = await db.from('contact_requests').insert({
      name: (name as string).trim(), email: (email as string).trim().toLowerCase(),
      phone: typeof phone === 'string' ? phone.trim() || null : null,
      postal_code: postal_code ?? null, subject, message: (message as string).trim(),
    });
    if (result.error) return fail('Ihre Nachricht konnte nicht gespeichert werden.', 503);
    try { after(async () => { await dispatchSupportMail(db); }); } catch { /* Outbox retained for retry. */ }
    return NextResponse.json({ success: true }, { status: 201, headers });
  } catch (cause) { return fail('Ungültige Anfrage.', cause instanceof BodyLimitError ? 413 : 400); }
}
