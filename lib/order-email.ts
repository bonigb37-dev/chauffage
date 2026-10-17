import 'server-only';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import de from '@/translations/de.json';
import { storeConfig } from '@/lib/store-config';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { getBankDetails } from '@/lib/server-bank-details';

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
  attachInvoice?: boolean;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


async function dispatchEmail({
  to,
  subject,
  text,
  html,
  reference,
  pdfBuffer,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  reference: string;
  pdfBuffer?: Buffer | null;
}): Promise<boolean> {
  const customerEmail = to?.trim();
  if (!customerEmail || !customerEmail.includes('@')) {
    return false;
  }

  // Skip sending to synthetic/test domains
  if (/@(example\.(invalid|com|org|net)|.*\.invalid|.*\.test)$/i.test(customerEmail)) {
    return false;
  }

  // 1. Priorité 1 sur Vercel : API HTTP Resend (Port 443 — rapide, ultra-fiable, non bloqué par les pare-feux cloud)
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
            'Idempotency-Key': `order-email-${reference}-${pdfBuffer ? 'with-pdf' : 'no-pdf'}-${fromCandidate.includes('onboarding') ? 'onb' : 'prod'}`,
          },
          body: JSON.stringify({
            from: fromCandidate,
            to: [customerEmail],
            subject,
            text,
            html,
            reply_to: storeConfig.email,
            ...(pdfBuffer ? {
              attachments: [
                {
                  filename: `Rechnung-${reference}.pdf`,
                  content: pdfBuffer.toString('base64'),
                },
              ],
            } : {}),
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          console.log(`Email sent successfully via Resend API from ${fromCandidate} to ${customerEmail} (${reference})`);
          return true;
        }

        const errData = await res.json().catch(() => ({}));
        console.warn(`Resend dispatch attempt with ${fromCandidate} returned:`, errData);
      } catch (resendErr) {
        console.error('Resend dispatch error:', resendErr);
      }
    }
  }

  // 2. Repli secondaire : SMTP Hostinger (avec timeouts courts pour éviter de bloquer Vercel Serverless)
  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpUser = process.env.SMTP_USER || 'kontakt@brennholz-direk.de';
  const smtpPass = process.env.SMTP_PASSWORD || 'Boni@135002';
  const fromAddress = process.env.SMTP_FROM_EMAIL || smtpUser;

  if (smtpHost && smtpUser && smtpPass) {
    const initialPort = Number(process.env.SMTP_PORT ?? 465);
    const portsToTry = initialPort === 587 ? [587, 465] : [465, 587];

    for (const port of portsToTry) {
      try {
        const isSecure = port === 465;
        const transport = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: isSecure,
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
            from: `"${storeConfig.name}" <${fromAddress}>`,
            to: customerEmail,
            replyTo: storeConfig.email,
            subject,
            text,
            html,
            ...(pdfBuffer ? {
              attachments: [
                {
                  filename: `Rechnung-${reference}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf',
                },
              ],
            } : {}),
          });

          console.log(`Email sent successfully via SMTP (port ${port}) to ${customerEmail} (${reference})`);
          return true;
        } finally {
          transport.close();
        }
      } catch (smtpErr) {
        console.error(`SMTP port ${port} email error:`, smtpErr);
      }
    }
  }

  return false;
}

// ÔöÇÔöÇ Step 1: Bestelleingangsbest├ñtigung (Accus├® de r├®ception de commande) ÔöÇÔöÇ
// Envoy├® imm├®diatement ├á la validation de commande. Statut : ┬½ Paiement en attente ┬╗.
// SANS facture PDF attach├®e (data.attachInvoice est false par d├®faut).
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const BANK_DETAILS = await getBankDetails();
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
      return `ÔÇó ${germanName} (${l.quantity}x) ÔÇö ${formatEuro(l.unit_price_cents * l.quantity)}`;
    })
    .join('\n');

  const linesHtml = data.lines
    .map(
      (l) => {
        const germanName = (de as Record<string, string>)[l.name] || l.name;
        return `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">
            <strong>${escapeHtml(germanName)}</strong> ├ù ${l.quantity}
          </td>
          <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600;">
            ${escapeHtml(formatEuro(l.unit_price_cents * l.quantity))}
          </td>
        </tr>`;
      }
    )
    .join('');

  const subject = `Brennholz-direk ÔÇô Bestelleingangsbest├ñtigung (${data.reference}) : ${amountEuros}`;

  const textDe = `Brennholz-direk ÔÇö Bestelleingangsbest├ñtigung

Guten Tag ${customerName},

vielen Dank f├╝r Ihre Bestellung bei Brennholz-direk! Wir best├ñtigen Ihnen hiermit den Eingang Ihrer Bestellung unter der Referenz ${data.reference}.

BESTELL├£BERSICHT:
---------------------------------------------
ÔÇó Bestellnummer: ${data.reference}
ÔÇó Status: Zahlung ausstehend (Bank├╝berweisung)
ÔÇó Gesamtbetrag (inkl. MwSt. & kostenloser Lieferung): ${amountEuros}

BESTELLTE ARTIKEL:
${linesText}

LIEFERADRESSE:
${addressText}

ZAHLUNGSANWEISUNG (BANK├£BERWEISUNG):
---------------------------------------------
Bitte ├╝berweisen Sie den Gesamtbetrag von ${amountEuros} auf folgendes Bankkonto:
ÔÇó Beg├╝nstigte: ${BANK_DETAILS.recipient}
ÔÇó IBAN: ${BANK_DETAILS.iban}
ÔÇó BIC: ${BANK_DETAILS.bic}
ÔÇó Bank: ${BANK_DETAILS.bank}
ÔÇó Verwendungszweck (zwingend erforderlich): ${data.reference}

N├äCHSTE SCHRITTE:
1. F├╝hren Sie die ├£berweisung mit dem Verwendungszweck "${data.reference}" durch.
2. Nach Abschluss der ├£berweisung k├Ânnen Sie Ihren ├£berweisungsbeleg im Shop oder in Ihrem Kundenbereich hochladen, um die Bearbeitung zu beschleunigen.
3. Nach Eingang und Pr├╝fung Ihrer Zahlung erhalten Sie Ihre offizielle Rechnung als PDF per E-Mail und die Ware wird innerhalb von 2 bis 4 Werktagen geliefert.

Haben Sie Fragen zu Ihrer Bestellung?
ÔÇó E-Mail: ${storeConfig.email}
ÔÇó Telefon: ${storeConfig.phone}
ÔÇó Lageradresse: ${storeConfig.warehouseAddress}

Mit freundlichen Gr├╝├ƒen,
Ihr Team von ${storeConfig.name} ÔÇô ${storeConfig.brandSubtitle}
https://www.brennholz-direk.de
`;

  const htmlDe = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Bestelleingangsbest├ñtigung</title>
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
                ${escapeHtml(storeConfig.brandSubtitle)} ┬À Brennholz, Pellets & Holzbriketts
              </p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 8px 20px; margin-bottom: 16px;">
                <span style="color: #1e40af; font-size: 14px; font-weight: 700;">Ô£ô Bestellung erfolgreich eingegangen</span>
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">
                Vielen Dank f├╝r Ihre Bestellung!
              </h2>
              <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0;">
                Guten Tag <strong>${escapeHtml(customerName)}</strong>, wir haben Ihre Bestellung <strong>${escapeHtml(data.reference)}</strong> dankend erhalten.
              </p>
              <p style="color: #9a3412; font-size: 13px; font-weight: 600; margin: 8px 0 0 0;">
                Status: Zahlung ausstehend (Bank├╝berweisung)
              </p>
            </td>
          </tr>

          <!-- Amount Highlight Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px;">
                <tr>
                  <td align="left" style="font-size: 14px; color: #9a3412; font-weight: 600;">
                    Zu ├╝berweisender Gesamtbetrag:
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
                  Bankverbindung f├╝r Ihre ├£berweisung:
                </h3>
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.4;">
                  Bitte ├╝berweisen Sie den Betrag von <strong>${escapeHtml(amountEuros)}</strong> auf folgendes Konto:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 140px;">Beg├╝nstigte:</td>
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

          <!-- Next steps notice -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; font-size: 13px; color: #475569; line-height: 1.5;">
                <strong style="color: #0f172a;">Hinweis zur Rechnung & Lieferung:</strong><br>
                Sobald Ihre ├£berweisung eingegangen ist und gepr├╝ft wurde, erhalten Sie Ihre offizielle Rechnung als PDF per E-Mail und Ihre Ware wird f├╝r die Auslieferung bereitgestellt.
              </div>
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
                ┬® ${new Date().getFullYear()} ${escapeHtml(storeConfig.name)} ┬À Alle Rechte vorbehalten
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
  if (data.attachInvoice === true) {
    try {
      pdfBuffer = await generateInvoicePdf({
        reference: data.reference,
        customer: data.customer,
        shipping: data.shipping,
        totalCents: data.totalCents,
        lines: data.lines,
      }, BANK_DETAILS);
    } catch (pdfErr) {
      console.error('Invoice PDF generation error for email:', pdfErr);
    }
  }

  return dispatchEmail({
    to: customerEmail,
    subject,
    text: textDe,
    html: htmlDe,
    reference: data.reference,
    pdfBuffer,
  });
}

// ÔöÇÔöÇ Step 3: Zahlungsbest├ñtigung & Rechnung per E-Mail ÔöÇÔöÇ
// Envoy├® UNIQUEMENT apr├¿s v├®rification r├®elle de l'encaissement par l'administrateur.
// Statut : ┬½ Paiement confirm├® ┬╗ (┬½ Zahlung best├ñtigt ┬╗).
// AVEC facture PDF officielle g├®n├®r├®e et jointe.
export async function sendPaymentConfirmedEmail(data: OrderEmailData): Promise<boolean> {
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
      return `ÔÇó ${germanName} (${l.quantity}x) ÔÇö ${formatEuro(l.unit_price_cents * l.quantity)}`;
    })
    .join('\n');

  const linesHtml = data.lines
    .map(
      (l) => {
        const germanName = (de as Record<string, string>)[l.name] || l.name;
        return `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">
            <strong>${escapeHtml(germanName)}</strong> ├ù ${l.quantity}
          </td>
          <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600;">
            ${escapeHtml(formatEuro(l.unit_price_cents * l.quantity))}
          </td>
        </tr>`;
      }
    )
    .join('');

  const subject = `Brennholz-direk ÔÇô Zahlungsbest├ñtigung & Rechnung (${data.reference}) : ${amountEuros}`;

  const textDe = `Brennholz-direk ÔÇö Zahlungsbest├ñtigung & Rechnung

Guten Tag ${customerName},

wir best├ñtigen Ihnen hiermit den erfolgreichen Eingang Ihrer Zahlung in H├Âhe von ${amountEuros} f├╝r Ihre Bestellung ${data.reference}.

Ihre offizielle Rechnung finden Sie als PDF-Dokument im Anhang dieser E-Mail.

BESTELL├£BERSICHT:
---------------------------------------------
ÔÇó Bestellnummer: ${data.reference}
ÔÇó Status: Zahlung best├ñtigt & verbucht
ÔÇó Bezahlter Betrag: ${amountEuros}

BESTELLTE ARTIKEL:
${linesText}

LIEFERUNG:
Ihre Ware wird nun von unserem Logistikzentrum f├╝r den Versand vorbereitet. Die Spedition wird sich telefonisch mit Ihnen in Verbindung setzen, um den genauen Liefertermin abzustimmen.
Lieferadresse:
${addressText}

Haben Sie Fragen zu Ihrer Lieferung?
ÔÇó E-Mail: ${storeConfig.email}
ÔÇó Telefon: ${storeConfig.phone}
ÔÇó Lageradresse: ${storeConfig.warehouseAddress}

Mit freundlichen Gr├╝├ƒen,
Ihr Team von ${storeConfig.name} ÔÇô ${storeConfig.brandSubtitle}
https://www.brennholz-direk.de
`;

  const htmlDe = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Zahlungsbest├ñtigung & Rechnung</title>
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
                ${escapeHtml(storeConfig.brandSubtitle)} ┬À Brennholz, Pellets & Holzbriketts
              </p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 8px 20px; margin-bottom: 16px;">
                <span style="color: #065f46; font-size: 14px; font-weight: 700;">Ô£ô Zahlung best├ñtigt & verbucht</span>
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">
                Zahlungseingang best├ñtigt
              </h2>
              <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0;">
                Guten Tag <strong>${escapeHtml(customerName)}</strong>, wir haben Ihre Zahlung f├╝r die Bestellung <strong>${escapeHtml(data.reference)}</strong> erhalten und verbucht.
              </p>
              <p style="color: #065f46; font-size: 13px; font-weight: 600; margin: 8px 0 0 0;">
                Ihre offizielle Rechnung liegt dieser E-Mail als PDF bei.
              </p>
            </td>
          </tr>

          <!-- Amount Highlight Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
                <tr>
                  <td align="left" style="font-size: 14px; color: #166534; font-weight: 600;">
                    Best├ñtigter Zahlungsbetrag:
                  </td>
                  <td align="right" style="font-size: 22px; color: #15803d; font-weight: 800;">
                    ${escapeHtml(amountEuros)}
                  </td>
                </tr>
              </table>
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

          <!-- Delivery Address & Logistics Next Steps -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Versand & Zustellung
                </h3>
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #334155; line-height: 1.5;">
                  Ihre Ware wird f├╝r den Transport vorbereitet. Die Spedition kontaktiert Sie zur telefonischen Avisierung des Liefertermins.
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                  <strong>Lieferadresse:</strong><br>
                  ${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}<br>
                  ${escapeHtml(addr.street)}<br>
                  ${escapeHtml(addr.postalCode)} ${escapeHtml(addr.city)}<br>
                  Deutschland (Kostenlose Lieferung)
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #334155;">
                Haben Sie Fragen zu Ihrer Lieferung?
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                E-Mail: <a href="mailto:${escapeHtml(storeConfig.email)}" style="color: #a33d1e; text-decoration: none; font-weight: 600;">${escapeHtml(storeConfig.email)}</a><br>
                Telefon: <a href="tel:${escapeHtml(storeConfig.phoneHref)}" style="color: #a33d1e; text-decoration: none; font-weight: 600;">${escapeHtml(storeConfig.phone)}</a><br>
                Lager: ${escapeHtml(storeConfig.warehouseAddress)}
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                ┬® ${new Date().getFullYear()} ${escapeHtml(storeConfig.name)} ┬À Alle Rechte vorbehalten
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
    console.error('Invoice PDF generation error for confirmation email:', pdfErr);
  }

  return dispatchEmail({
    to: customerEmail,
    subject,
    text: textDe,
    html: htmlDe,
    reference: data.reference,
    pdfBuffer,
  });
}
