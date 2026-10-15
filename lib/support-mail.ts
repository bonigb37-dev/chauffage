import 'server-only';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { SupabaseClient } from '@supabase/supabase-js';
import { storeConfig } from './store-config';

export function supportMailConfigured() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const user = process.env.SMTP_USER || 'kontakt@brennholz-direk.de';
  const pass = process.env.SMTP_PASSWORD || 'Boni@135002';
  return Boolean(host && user && pass);
}
export function notificationContent(kind: string, locale: string) {
  const base = 'https://www.brennholz-direk.de';
  if (kind !== 'customer_reply') return { subject: 'Brennholz-direk – Neue Kundenanfrage', text: `Eine neue Kundenanfrage ist eingegangen. Melden Sie sich an, um sie zu lesen und zu beantworten.\n\n${base}/de/admin#${kind === 'admin_contact' ? 'contact-requests' : 'support-messages'}\n\nBrennholz-direk · Leylines` };
  const language = ['de','fr','en'].includes(locale) ? locale : 'de';
  const copy = language === 'fr' ? ['Brennholz-direk – Une réponse vous attend', 'Notre équipe a répondu à votre conversation. Connectez-vous pour lire la réponse.'] : language === 'en' ? ['Brennholz-direk – You have a new reply', 'Our team has replied to your conversation. Sign in to read the reply.'] : ['Brennholz-direk – Eine Antwort wartet auf Sie', 'Unser Team hat auf Ihre Unterhaltung geantwortet. Melden Sie sich an, um die Antwort zu lesen.'];
  return { subject: copy[0], text: `${copy[1]}\n\n${base}/${language}/aide\n\nBrennholz-direk · Leylines` };
}
// A durable SQL outbox and atomic leases coordinate all serverless instances.
export async function dispatchSupportMail(db: SupabaseClient, limit = 1) {
  const mailKey = process.env.RESEND_API_KEY;
  const hasSmtp = supportMailConfigured();
  if (!mailKey && !hasSmtp) return { configured: false, sent: 0, failed: 0 };

  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const user = process.env.SMTP_USER || 'kontakt@brennholz-direk.de';
  const pass = process.env.SMTP_PASSWORD || 'Boni@135002';
  const port = Number(process.env.SMTP_PORT ?? 465);

  let sent = 0, failed = 0;
  for (let i = 0; i < Math.min(limit, 3); i++) {
    const claimed = await db.rpc('claim_mail_notification');
    const job = claimed.data;
    if (claimed.error || !job) break;
    let success = false;
    let error = 'mail';

    try {
      let recipient = storeConfig.email;
      if (job.kind === 'customer_reply') {
        const user = await db.auth.admin.getUserById(job.customer_id);
        if (user.error || !user.data.user?.email_confirmed_at || !user.data.user.email) {
          error = 'recipient';
          throw new Error('recipient');
        }
        recipient = user.data.user.email;
      }
      const content = notificationContent(job.kind, job.locale);

      // 1. Try Resend HTTP API
      if (mailKey) {
        const fromCandidates = [
          process.env.SUPPORT_FROM_EMAIL,
          process.env.SMTP_FROM_EMAIL,
          'Brennholz-direk <kontakt@brennholz-direk.de>',
          'Brennholz-direk <onboarding@resend.dev>',
        ].filter(Boolean) as string[];

        for (const fromCandidate of fromCandidates) {
          try {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${mailKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: fromCandidate,
                to: [recipient],
                subject: content.subject,
                text: content.text,
                reply_to: storeConfig.email,
              }),
              signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
              success = true;
              break;
            }
          } catch { /* Try next or SMTP */ }
        }
      }

      // 2. Fallback to SMTP
      if (!success && hasSmtp) {
        try {
          const transport = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            family: 4,
            connectionTimeout: 4000,
            greetingTimeout: 3000,
            socketTimeout: 5000,
            disableFileAccess: true,
            disableUrlAccess: true,
          } as SMTPTransport.Options);

          const delivery = await transport.sendMail({
            from: { name: storeConfig.name, address: process.env.SMTP_FROM_EMAIL || user },
            to: recipient,
            replyTo: storeConfig.email,
            ...content,
            messageId: `<${Buffer.from(job.key).toString('base64url')}@brennholz-direk.de>`,
          });
          success = (delivery.accepted?.length ?? 0) > 0;
          transport.close();
        } catch { /* SMTP failed */ }
      }
    } catch { /* No secret, message content or customer email in logs. */ }

    const finished = await db.rpc('finish_mail_notification', {
      p_key: job.key,
      p_lease: job.lease_id,
      p_success: success,
      p_error: success ? null : error,
    });
    if (success && !finished.error) sent++;
    else failed++;
  }

  return { configured: true, sent, failed };
}
