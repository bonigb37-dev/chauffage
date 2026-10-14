import 'server-only';
import nodemailer from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { storeConfig } from './store-config';

export function supportMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && [465,587].includes(Number(process.env.SMTP_PORT ?? 465)));
}
export function notificationContent(kind: string, locale: string) {
  const base = 'https://www.brennholz-direk.de';
  if (kind !== 'customer_reply') return { subject: 'Bren-nholz – Neue Kundenanfrage', text: `Eine neue Kundenanfrage ist eingegangen. Melden Sie sich an, um sie zu lesen und zu beantworten.\n\n${base}/admin#${kind === 'admin_contact' ? 'contact-requests' : 'support-messages'}\n\nBren-nholz · Leylines` };
  const copy = ['Bren-nholz – Eine Antwort wartet auf Sie', 'Unser Team hat auf Ihre Unterhaltung geantwortet. Melden Sie sich an, um die Antwort zu lesen.'];
  return { subject: copy[0], text: `${copy[1]}\n\naide\n\nBren-nholz · Leylines` };
}
// A durable SQL outbox and atomic leases coordinate all serverless instances.
// SMTP cannot guarantee exactly-once delivery if the process dies after send.
export async function dispatchSupportMail(db: SupabaseClient, limit = 1) {
  if (!supportMailConfigured()) return { configured: false, sent: 0, failed: 0 };
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: true, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000, dnsTimeout: 5000, disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false });
  let sent = 0, failed = 0;
  try {
    for (let i=0; i<Math.min(limit,3); i++) {
      const claimed = await db.rpc('claim_mail_notification');
      const job = claimed.data;
      if (claimed.error || !job) break;
      let success = false; let error = 'smtp';
      try {
        let recipient = storeConfig.email;
        if (job.kind === 'customer_reply') {
          const user = await db.auth.admin.getUserById(job.customer_id);
          if (user.error || !user.data.user?.email_confirmed_at || !user.data.user.email) { error = 'recipient'; throw new Error('recipient'); }
          recipient = user.data.user.email;
        }
        const content = notificationContent(job.kind, job.locale);
        const delivery = await transport.sendMail({ from: { name: storeConfig.name, address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER! }, to: recipient, replyTo: storeConfig.email, ...content, messageId: `<${Buffer.from(job.key).toString('base64url')}@brennholz-direk.de>` });
        success = (delivery.accepted?.length ?? 0) > 0;
      } catch { /* No secret, message content or customer email in logs. */ }
      const finished = await db.rpc('finish_mail_notification', { p_key: job.key, p_lease: job.lease_id, p_success: success, p_error: success ? null : error });
      if (success && !finished.error) sent++; else failed++;
    }
  } finally { transport.close(); }
  return { configured: true, sent, failed };
}
