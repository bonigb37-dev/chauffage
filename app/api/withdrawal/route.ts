import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { storeConfig } from '@/lib/store-config';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { isLocale } from '@/i18n/routing';
import { withdrawalCopy } from '@/lib/withdrawal-copy';

export const runtime = 'nodejs';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    const requestLocale = isLocale((body as Record<string, unknown>).locale) ? (body as {locale: 'de' | 'fr' | 'en'}).locale : 'de';
    const words = withdrawalCopy(requestLocale);
    if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof contract !== 'string' || !contract.trim() || contract.length > 2000 || typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return fail('Bitte überprüfen Sie Ihren Namen, Ihre E-Mail-Adresse und die Bestellangaben.', 400);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const marker = `Rétractation ${id}`;
    const previous = await db.from('contact_requests').select('message').eq('email', email.trim().toLowerCase()).like('message', `${marker}\n%`).maybeSingle();
    if (previous.error) return fail('Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut oder nutzen Sie die E-Mail.', 503);
    const receipt = previous.data?.message ?? `${marker}\nBrennholz-direk — ${words[1]}\n${words[2]} : ${new Date().toISOString()}\n${words[3]} : ${name.trim()}\n${words[4]} : ${email.trim()}\n${words[5]} : ${contract.trim()}\n${words[6]} : ${words[7]}\n${words[8]} : ${storeConfig.email}`;
    const visibleReceipt = receipt.replace(/^Rétractation /, `${words[0]} `);
    if (!previous.data) {
      const saved = await db.from('contact_requests').insert({ name: name.trim(), email: email.trim().toLowerCase(), subject: 'order', message: receipt });
      if (saved.error) return fail('Die Widerrufserklärung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut oder senden Sie eine E-Mail.', 503);
    }
    let emailSent = false;

    // 1. Envoi via SMTP (Hostinger / configurations SMTP du site)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        const port = Number(process.env.SMTP_PORT ?? 465);
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
          family: 4,
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
          disableFileAccess: true,
          disableUrlAccess: true,
        } as SMTPTransport.Options);

        const htmlContent = `<!DOCTYPE html>
<html lang="${requestLocale}">
<head><meta charset="utf-8"><title>Brennholz-direk — ${escapeHtml(words[9])}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 24px 16px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #0f291e; padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800;">${escapeHtml(storeConfig.name)}</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">${escapeHtml(words[1])}</p>
    </div>
    <div style="padding: 24px;">
      <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 6px 16px; margin-bottom: 16px;">
        <span style="color: #065f46; font-size: 13px; font-weight: 700;">✓ ${escapeHtml(words[1])}</span>
      </div>
      <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">${escapeHtml(words[9])}</h2>
      <pre style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; color: #334155; line-height: 1.5; border: 1px solid #e2e8f0;">${escapeHtml(visibleReceipt)}</pre>
      <p style="font-size: 13px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        ${escapeHtml(words[8])} : <a href="mailto:${escapeHtml(storeConfig.email)}" style="color: #a33d1e; font-weight: 600; text-decoration: none;">${escapeHtml(storeConfig.email)}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

        await transport.sendMail({
          from: `"${storeConfig.name}" <${fromAddress}>`,
          to: email.trim(),
          replyTo: storeConfig.email,
          subject: `Brennholz-direk — ${words[9]}`,
          text: visibleReceipt,
          html: htmlContent,
        });
        emailSent = true;
        transport.close();
      } catch (smtpErr) {
        console.error('SMTP withdrawal email error:', smtpErr);
      }
    }

    // 2. Envoi de secours via API Resend si SMTP non configuré ou échec
    if (!emailSent) {
      const mailKey = process.env.RESEND_API_KEY;
      const from = process.env.WITHDRAWAL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      if (mailKey && from) {
        try {
          const sent = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${mailKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `withdrawal-${id}` }, body: JSON.stringify({ from, to: [email.trim()], subject: `Brennholz-direk — ${words[9]}`, text: visibleReceipt, reply_to: storeConfig.email }), signal: AbortSignal.timeout(10000) });
          emailSent = sent.ok;
        } catch { /* Die eingegangene Erklärung bleibt auch bei E-Mail-Fehlschlag gültig. */ }
      }
    }
    return NextResponse.json({ receipt: visibleReceipt, emailSent }, { headers });
  } catch (cause) { return fail('Ungültige Widerrufserklärung. Bitte versuchen Sie es erneut oder nutzen Sie die E-Mail.', cause instanceof BodyLimitError ? 413 : 400); }
}
