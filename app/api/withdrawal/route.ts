import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { storeConfig } from '@/lib/store-config';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const blocked = protectApi(request, 5, 10 * 60_000);
  if (blocked) return blocked;
  const headers = { 'Cache-Control': 'no-store' };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  if (Number(request.headers.get('content-length')) > 12000) return fail('Déclaration trop longue.', 413);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Service indisponible. Notifiez votre rétractation par e-mail.', 503);
  try {
    const body = await readLimitedJson(request, 12000);
    if (!body || typeof body !== 'object') return fail('Déclaration invalide.', 400);
    const { name, email, contract, id } = body as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof contract !== 'string' || !contract.trim() || contract.length > 2000 || typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return fail('Vérifiez votre nom, votre e-mail et le contrat concerné.', 400);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const marker = `Rétractation ${id}`;
    const previous = await db.from('contact_requests').select('message').eq('email', email.trim().toLowerCase()).like('message', `${marker}\n%`).maybeSingle();
    if (previous.error) return fail('Service indisponible. Réessayez ou utilisez l’e-mail.', 503);
    const receipt = previous.data?.message ?? `${marker}\nBren-nholz — Accusé de réception\nReçue le : ${new Date().toISOString()}\nNom : ${name.trim()}\nE-mail : ${email.trim()}\nContrat ou articles : ${contract.trim()}\nDéclaration : Je me rétracte du contrat ou des articles identifiés ci-dessus.\nContact : ${storeConfig.email}`;
    if (!previous.data) {
      const saved = await db.from('contact_requests').insert({ name: name.trim(), email: email.trim().toLowerCase(), subject: 'order', message: receipt });
      if (saved.error) return fail('La déclaration n’a pas pu être enregistrée. Réessayez ou utilisez l’e-mail.', 503);
    }
    let emailSent = false;
    const mailKey = process.env.RESEND_API_KEY;
    const from = process.env.WITHDRAWAL_FROM_EMAIL;
    if (mailKey && from) {
      try {
        const sent = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${mailKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `withdrawal-${id}` }, body: JSON.stringify({ from, to: [email.trim()], subject: 'Bren-nholz — Confirmation de votre rétractation', text: receipt, reply_to: storeConfig.email }), signal: AbortSignal.timeout(10000) });
        emailSent = sent.ok;
      } catch { /* La déclaration reçue reste valable malgré un échec de l’e-mail. */ }
    }
    return NextResponse.json({ receipt, emailSent }, { headers });
  } catch (cause) { return fail('Déclaration invalide. Réessayez ou utilisez l’e-mail.', cause instanceof BodyLimitError ? 413 : 400); }
}
