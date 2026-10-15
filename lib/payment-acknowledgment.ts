import 'server-only';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { storeConfig } from './store-config';

interface CustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
}

interface OrderItem {
  name?: string;
  quantity?: number;
  priceCents?: number;
}

interface PaymentAcknowledgmentPayload {
  reference: string;
  customer?: CustomerData | null;
  totalCents?: number | null;
  items?: OrderItem[] | null;
}

export async function sendPaymentAcknowledgmentEmail(payload: PaymentAcknowledgmentPayload): Promise<boolean> {
  const customerEmail = payload.customer?.email?.trim();
  if (!customerEmail || !customerEmail.includes('@')) {
    return false;
  }

  // Skip sending to synthetic/test domains
  if (/@(example\.(invalid|com|org|net)|.*\.invalid|.*\.test)$/i.test(customerEmail)) {
    return false;
  }

  const customerName = [payload.customer?.firstName, payload.customer?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Kunde';

  const amountEuros = typeof payload.totalCents === 'number'
    ? (payload.totalCents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    : 'Bestätigter Betrag';

  const itemsListText = Array.isArray(payload.items) && payload.items.length > 0
    ? payload.items.map((it) => `• ${it.name ?? 'Artikel'} (${it.quantity ?? 1}x)`).join('\n')
    : '• Brennholz & Holzpellets';

  const itemsListHtml = Array.isArray(payload.items) && payload.items.length > 0
    ? payload.items.map((it) => `<li style="margin-bottom: 6px;"><strong>${escapeHtml(it.name ?? 'Artikel')}</strong> × ${it.quantity ?? 1}</li>`).join('')
    : '<li>Brennholz & Holzpellets</li>';

  const subject = `Brennholz-direk – Eingang Ihres Zahlungsbelegs (${payload.reference})`;

  const formattedDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const textBody = `Guten Tag ${customerName},

wir bestätigen Ihnen hiermit den erfolgreichen Eingang Ihres Überweisungsnachweises für Ihre Bestellung ${payload.reference}.

STATUS IHRER ZAHLUNG:
---------------------------------------------
• Bestellnummer: ${payload.reference}
• Angegebener Betrag: ${amountEuros}
• Status: Prüfung läuft (Zahlungsnachweis eingegangen)
• Eingangsdatum: ${formattedDate}

BESTELLTE ARTIKEL:
${itemsListText}

NÄCHSTE SCHRITTE:
Ihr Zahlungsbeleg wurde an unsere Buchhaltung übermittelt und befindet sich derzeit in Prüfung.
Sobald die Gutschrift auf unserem Bankkonto durch unsere Buchhaltung verbucht wurde, erhalten Sie Ihre offizielle Zahlungsbestätigung samt Rechnung im PDF-Format per E-Mail und Ihre Ware wird für den Versand freigegeben.

Haben Sie Fragen zu Ihrer Bestellung oder Lieferung?
• E-Mail: ${storeConfig.email}
• Telefon: ${storeConfig.phone}
• Lageradresse: ${storeConfig.warehouseAddress}

Mit freundlichen Grüßen,
Ihr Team von ${storeConfig.name} – ${storeConfig.brandSubtitle}
https://www.brennholz-direk.de
`;

  const htmlBody = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Eingangsbestätigung Zahlungsbeleg</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f291e; padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                ${escapeHtml(storeConfig.name)}
              </h1>
              <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px; font-weight: 500;">
                ${escapeHtml(storeConfig.brandSubtitle)} · Brennholz, Pellets & Holzbriketts
              </p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <div style="display: inline-block; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 9999px; padding: 8px 20px; margin-bottom: 16px;">
                <span style="color: #92400e; font-size: 14px; font-weight: 700;">⏳ Zahlungsbeleg eingegangen · Prüfung läuft</span>
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">
                Zahlungsnachweis erhalten
              </h2>
              <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0;">
                Guten Tag <strong>${escapeHtml(customerName)}</strong>, wir haben Ihren Überweisungsnachweis für die Bestellung <strong>${escapeHtml(payload.reference)}</strong> erhalten.
              </p>
              <p style="color: #9a3412; font-size: 13px; font-weight: 600; margin: 8px 0 0 0;">
                Status: Prüfung läuft (in Prüfung durch unsere Buchhaltung)
              </p>
            </td>
          </tr>

          <!-- Amount Highlight Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px;">
                <tr>
                  <td align="left" style="font-size: 14px; color: #9a3412; font-weight: 600;">
                    Gezahlter Gesamtbetrag:
                  </td>
                  <td align="right" style="font-size: 22px; color: #a33d1e; font-weight: 800;">
                    ${escapeHtml(amountEuros)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 12px; font-size: 13px; color: #7c2d12; border-top: 1px dashed #fdba74; margin-top: 12px;">
                    <strong>Bestellnummer:</strong> <span style="font-family: monospace; font-size: 14px;">${escapeHtml(payload.reference)}</span><br>
                    <strong>Zahlungsart:</strong> Banküberweisung (Beleg hinterlegt)
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Bestellte Artikel
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                ${itemsListHtml}
              </ul>
            </td>
          </tr>

          <!-- Delivery & Next steps -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="background-color: #f8fafc; border-left: 4px solid #0f291e; padding: 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6;">
                  <strong>Nächste Schritte:</strong> Ihr Beleg wurde an unsere Buchhaltung übermittelt. Ihre Bestellung ist bestätigt und wird für den Versand vorbereitet. Die <strong>Lieferung erfolgt innerhalb von 2 bis 4 Werktagen in ganz Deutschland</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer Contact Info -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">
                Haben Sie Fragen oder benötigen Sie Informationen zu Ihrer Lieferung?
              </p>
              <p style="margin: 0 0 12px 0;">
                E-Mail: <a href="mailto:${escapeHtml(storeConfig.email)}" style="color: #a33d1e; font-weight: 600; text-decoration: none;">${escapeHtml(storeConfig.email)}</a> &nbsp;|&nbsp;
                Telefon: <a href="tel:${escapeHtml(storeConfig.phoneHref)}" style="color: #a33d1e; font-weight: 600; text-decoration: none;">${escapeHtml(storeConfig.phone)}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Lager in Deutschland: ${escapeHtml(storeConfig.warehouseAddress)}<br>
                © ${new Date().getFullYear()} ${escapeHtml(storeConfig.name)} – Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // 1. Priorité 1 : API Resend via HTTPS (Port 443 — immédiat, non bloqué par les pare-feux cloud)
  const mailKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.ORDER_FROM_EMAIL || process.env.WITHDRAWAL_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (mailKey) {
    const fromCandidates = [
      configuredFrom,
      'Brennholz-direk <kontakt@brennholz-direk.de>',
      'Brennholz-direk <bestellung@brennholz-direk.de>',
      'Brennholz-direk <onboarding@resend.dev>',
    ].filter(Boolean) as string[];

    for (const fromCandidate of fromCandidates) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mailKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `proof-ack-${payload.reference}-${fromCandidate.includes('onboarding') ? 'onb' : 'prod'}`,
          },
          body: JSON.stringify({
            from: fromCandidate,
            to: [customerEmail],
            subject,
            text: textBody,
            html: htmlBody,
            reply_to: storeConfig.email,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          console.log(`Payment acknowledgment sent via Resend API from ${fromCandidate} to ${customerEmail}`);
          return true;
        }
      } catch (resendErr) {
        console.error('Resend payment acknowledgment error:', resendErr);
      }
    }
  }

  // 2. Repli secondaire : SMTP Hostinger
  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpUser = process.env.SMTP_USER || 'kontakt@brennholz-direk.de';
  const smtpPass = process.env.SMTP_PASSWORD || 'Boni@135002';

  if (!smtpHost || !smtpUser || !smtpPass) {
    return false;
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  const fromAddress = process.env.SMTP_FROM_EMAIL || smtpUser;

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: port === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    family: 4,
    connectionTimeout: 4000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
    tls: {
      rejectUnauthorized: false,
    },
    disableFileAccess: true,
    disableUrlAccess: true,
  } as SMTPTransport.Options);

  try {
    await transport.sendMail({
      from: {
        name: storeConfig.name,
        address: fromAddress,
      },
      to: customerEmail,
      bcc: storeConfig.email,
      replyTo: storeConfig.email,
      subject,
      text: textBody,
      html: htmlBody,
    });
    return true;
  } catch (err) {
    console.error('Error dispatching payment acknowledgment email via SMTP:', err);
    return false;
  } finally {
    transport.close();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
