import 'server-only';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import de from '@/translations/de.json';
import { storeConfig } from '@/lib/store-config';
import { generateInvoicePdf } from '@/lib/invoice-pdf';

export type OrderEmailData = {
  reference: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    street: string;
    postalCode: string;
    city: string;
  };
  shipping?: {
    firstName: string;
    lastName: string;
    street: string;
    postalCode: string;
    city: string;
  } | null;
  totalCents: number;
  lines: {
    name: string;
    quantity: number;
    unit_price_cents: number;
  }[];
  locale?: 'fr' | 'de' | 'en';
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const BANK_DETAILS = {
  recipient: 'Simone Römer',
  iban: 'DE38760260000039479100',
  bic: 'NORSDE71XXX',
  bank: 'Sparkasse',
};

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const customerEmail = data.customer?.email?.trim();
  if (!customerEmail || !customerEmail.includes('@')) {
    return false;
  }

  const customerName = [data.customer.firstName, data.customer.lastName].filter(Boolean).join(' ').trim() || 'Kunde';
  const formatEuro = (cents: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const amountEuros = formatEuro(data.totalCents);
  const addr = data.shipping || data.customer;
  const addressText = `${addr.firstName} ${addr.lastName}\n${addr.street}\n${addr.postalCode} ${addr.city}\nDeutschland`;

  const linesText = data.lines
    .map((l) => {
      const germanName = (de as Record<string, string>)[l.name] || l.name;
      return `• ${germanName} (${l.quantity}x) — ${formatEuro(l.unit_price_cents * l.quantity)}`;
    })
    .join('\n');

  const linesHtml = data.lines
    .map(
      (l) => {
        const germanName = (de as Record<string, string>)[l.name] || l.name;
        return `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">
            <strong>${escapeHtml(germanName)}</strong> × ${l.quantity}
          </td>
          <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600;">
            ${escapeHtml(formatEuro(l.unit_price_cents * l.quantity))}
          </td>
        </tr>`;
      }
    )
    .join('');

  const subject = `Brennholz-direk – Bestelleingangsbestätigung (${data.reference}) : ${amountEuros}`;

  const textDe = `Brennholz-direk — Bestelleingangsbestätigung

Guten Tag ${customerName},

vielen Dank für Ihre Bestellung bei Brennholz-direk! Wir bestätigen Ihnen hiermit den Eingang Ihrer Bestellung unter der Referenz ${data.reference}.

BESTELLÜBERSICHT:
---------------------------------------------
• Bestellnummer: ${data.reference}
• Gesamtbetrag (inkl. MwSt. & kostenloser Lieferung): ${amountEuros}

BESTELLTE ARTIKEL:
${linesText}

LIEFERADRESSE:
${addressText}

ZAHLUNGSANWEISUNG (BANKÜBERWEISUNG):
---------------------------------------------
Bitte überweisen Sie den Gesamtbetrag von ${amountEuros} auf folgendes Bankkonto:
• Begünstigte: ${BANK_DETAILS.recipient}
• IBAN: ${BANK_DETAILS.iban}
• BIC: ${BANK_DETAILS.bic}
• Bank: ${BANK_DETAILS.bank}
• Verwendungszweck (zwingend erforderlich): ${data.reference}

NÄCHSTE SCHRITTE:
1. Führen Sie die Überweisung mit dem Verwendungszweck "${data.reference}" durch.
2. Nach Abschluss der Überweisung können Sie Ihren Überweisungsbeleg direkt im Shop hochladen, um die Bereitstellung zu beschleunigen.
3. Die Lieferung erfolgt innerhalb von 2 bis 4 Werktagen nach Zahlungseingang (ohne Zusatzkosten).

Haben Sie Fragen zu Ihrer Bestellung?
• E-Mail: ${storeConfig.email}
• Telefon: ${storeConfig.phone}
• Lageradresse: ${storeConfig.warehouseAddress}

Mit freundlichen Grüßen,
Ihr Team von ${storeConfig.name} – ${storeConfig.brandSubtitle}
https://www.brennholz-direk.de
`;

  const htmlDe = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Bestelleingangsbestätigung</title>
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
              <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 8px 20px; margin-bottom: 16px;">
                <span style="color: #1e40af; font-size: 14px; font-weight: 700;">✓ Bestellung erfolgreich eingegangen</span>
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">
                Vielen Dank für Ihre Bestellung!
              </h2>
              <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0;">
                Guten Tag <strong>${escapeHtml(customerName)}</strong>, wir haben Ihre Bestellung <strong>${escapeHtml(data.reference)}</strong> dankend erhalten.
              </p>
            </td>
          </tr>

          <!-- Amount Highlight Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px;">
                <tr>
                  <td align="left" style="font-size: 14px; color: #9a3412; font-weight: 600;">
                    Gesamtbetrag (inkl. MwSt. & Versand):
                  </td>
                  <td align="right" style="font-size: 22px; color: #a33d1e; font-weight: 800;">
                    ${escapeHtml(amountEuros)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bank Transfer Details -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Bankverbindung für Ihre Überweisung:
                </h3>
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.4;">
                  Bitte überweisen Sie den Betrag von <strong>${escapeHtml(amountEuros)}</strong> auf folgendes Konto:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 140px;">Begünstigte:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${escapeHtml(BANK_DETAILS.recipient)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">IBAN:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 700; font-size: 15px;">${escapeHtml(BANK_DETAILS.iban)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">BIC:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 700;">${escapeHtml(BANK_DETAILS.bic)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Bank:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${escapeHtml(BANK_DETAILS.bank)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #9a3412; font-weight: 600;">Verwendungszweck:</td>
                    <td style="padding: 6px 0; color: #a33d1e; font-family: monospace; font-weight: 800; font-size: 15px;">${escapeHtml(data.reference)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                Bestellte Artikel
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${linesHtml}
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                Lieferadresse
              </h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}<br>
                ${escapeHtml(addr.street)}<br>
                ${escapeHtml(addr.postalCode)} ${escapeHtml(addr.city)}<br>
                Deutschland (Kostenlose Lieferung)
              </p>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #334155;">
                Haben Sie Fragen zu Ihrer Bestellung?
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                E-Mail: <a href="mailto:${escapeHtml(storeConfig.email)}" style="color: #a33d1e; text-decoration: none; font-weight: 600;">${escapeHtml(storeConfig.email)}</a><br>
                Telefon: <a href="tel:${escapeHtml(storeConfig.phoneHref)}" style="color: #a33d1e; text-decoration: none; font-weight: 600;">${escapeHtml(storeConfig.phone)}</a><br>
                Lager: ${escapeHtml(storeConfig.warehouseAddress)}
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${escapeHtml(storeConfig.name)} · Alle Rechte vorbehalten
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateInvoicePdf({
      reference: data.reference,
      customer: data.customer,
      shipping: data.shipping,
      totalCents: data.totalCents,
      lines: data.lines,
    });
  } catch (pdfErr) {
    console.error('Invoice PDF generation error for email:', pdfErr);
  }

  // 1. Primary: SMTP via Hostinger
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const initialPort = Number(process.env.SMTP_PORT ?? 465);
    const portsToTry = initialPort === 587 ? [587, 465] : [465, 587];

    for (const port of portsToTry) {
      try {
        const isSecure = port === 465;
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: isSecure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
          connectionTimeout: 12000,
          greetingTimeout: 8000,
          socketTimeout: 20000,
          disableFileAccess: true,
          disableUrlAccess: true,
        } as SMTPTransport.Options);

        await transport.sendMail({
          from: `"${storeConfig.name}" <${fromAddress}>`,
          to: customerEmail,
          replyTo: storeConfig.email,
          subject,
          text: textDe,
          html: htmlDe,
          ...(pdfBuffer ? {
            attachments: [
              {
                filename: `Rechnung-${data.reference}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ],
          } : {}),
        });

        console.log(`Order confirmation email + PDF sent successfully via SMTP (port ${port}) to ${customerEmail} (${data.reference})`);
        return true;
      } catch (smtpErr) {
        console.error(`SMTP port ${port} order confirmation email error:`, smtpErr);
      }
    }
  }

  // 2. Fallback: Resend API
  const mailKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || process.env.WITHDRAWAL_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  if (mailKey && from) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mailKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `order-receipt-${data.reference}`,
        },
        body: JSON.stringify({
          from,
          to: [customerEmail],
          subject,
          text: textDe,
          html: htmlDe,
          reply_to: storeConfig.email,
          ...(pdfBuffer ? {
            attachments: [
              {
                filename: `Rechnung-${data.reference}.pdf`,
                content: pdfBuffer.toString('base64'),
              },
            ],
          } : {}),
        }),
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch (resendErr) {
      console.error('Resend order confirmation email error:', resendErr);
    }
  }

  return false;
}
