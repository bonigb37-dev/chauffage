import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { storeConfig } from '@/lib/store-config';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { isLocale } from '@/i18n/routing';
import { withdrawalCopy } from '@/lib/withdrawal-copy';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const blocked = await protectApi(request, 5, 10 * 60_000);
  if (blocked) return blocked;
  const headers = { 'Cache-Control': 'no-store' };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  if (Number(request.headers.get('content-length')) > 12000) return fail('Erklärung zu lang.', 413);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Dienst vorübergehend nicht verfügbar. Bitte senden Sie Ihren Widerruf per E-Mail.', 503);
  try {
    const body = await readLimitedJson(request, 12000);
    if (!body || typeof body !== 'object') return fail('Ungültige Widerrufserklärung.', 400);
    const { name, email, contract, id } = body as Record<string, unknown>;
    const words = withdrawalCopy(isLocale((body as Record<string, unknown>).locale) ? (body as {locale: 'de' | 'fr' | 'en'}).locale : 'de');
    if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof contract !== 'string' || !contract.trim() || contract.length > 2000 || typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return fail('Bitte überprüfen Sie Ihren Namen, Ihre E-Mail-Adresse und die Bestellangaben.', 400);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const marker = `Rétractation ${id}`;
    const previous = await db.from('contact_requests').select('message').eq('email', email.trim().toLowerCase()).like('message', `${marker}\n%`).maybeSingle();
    if (previous.error) return fail('Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut oder nutzen Sie die E-Mail.', 503);
    const receipt = previous.data?.message ?? `${marker}\nBren-nholz — ${words[1]}\n${words[2]} : ${new Date().toISOString()}\n${words[3]} : ${name.trim()}\n${words[4]} : ${email.trim()}\n${words[5]} : ${contract.trim()}\n${words[6]} : ${words[7]}\n${words[8]} : ${storeConfig.email}`;
    const visibleReceipt = receipt.replace(/^Rétractation /, `${words[0]} `);
    if (!previous.data) {
      const saved = await db.from('contact_requests').insert({ name: name.trim(), email: email.trim().toLowerCase(), subject: 'order', message: receipt });
      if (saved.error) return fail('Die Widerrufserklärung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut oder senden Sie eine E-Mail.', 503);
    }
    let emailSent = false;
    const mailKey = process.env.RESEND_API_KEY;
    const from = process.env.WITHDRAWAL_FROM_EMAIL;
    if (mailKey && from) {
      try {
        const sent = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${mailKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `withdrawal-${id}` }, body: JSON.stringify({ from, to: [email.trim()], subject: `Bren-nholz — ${words[9]}`, text: visibleReceipt, reply_to: storeConfig.email }), signal: AbortSignal.timeout(10000) });
        emailSent = sent.ok;
      } catch { /* Die eingegangene Erklärung bleibt auch bei E-Mail-Fehlschlag gültig. */ }
    }
    return NextResponse.json({ receipt: visibleReceipt, emailSent }, { headers });
  } catch (cause) { return fail('Ungültige Widerrufserklärung. Bitte versuchen Sie es erneut oder nutzen Sie die E-Mail.', cause instanceof BodyLimitError ? 413 : 400); }
}
