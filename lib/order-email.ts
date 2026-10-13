import { storeConfig } from '@/lib/store-config';

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

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const mailKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || process.env.WITHDRAWAL_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!mailKey || !from || !data.customer.email) {
    return false;
  }

  const isDe = data.locale === 'de';

  const subject = isDe
    ? `Bren-nholz — Bestelleingangsbestätigung ${data.reference}`
    : `Bren-nholz — Accusé de réception de votre commande ${data.reference}`;

  const formatEuro = (cents: number) =>
    new Intl.NumberFormat(isDe ? 'de-DE' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const linesText = data.lines
    .map((l) => `- ${l.name} x${l.quantity} (${formatEuro(l.unit_price_cents * l.quantity)})`)
    .join('\n');

  const addr = data.shipping || data.customer;
  const addressText = `${addr.firstName} ${addr.lastName}\n${addr.street}\n${addr.postalCode} ${addr.city}`;

  const textFr = `Bren-nholz — Accusé de réception de commande

Bonjour ${data.customer.firstName} ${data.customer.lastName},

Nous vous remercions pour votre commande sur Bren-nholz. Votre demande a bien été enregistrée sous la référence ${data.reference}.

RÉSUMÉ DE LA COMMANDE :
Référence : ${data.reference}
Montant total (TVA & livraison incluses) : ${formatEuro(data.totalCents)}

ARTICLES COMMANDÉS :
${linesText}

ADRESSE DE LIVRAISON :
${addressText}

RÈGLEMENT PAR VIREMENT BANCAIRE :
Afin de valider l'expédition, merci d'effectuer le virement bancaire sur le compte de l'entreprise :
- Titulaire : Bren-nholz GmbH
- IBAN : DE89 1203 0000 1234 5678 90
- BIC : BYLADEM1100
- Libellé / Motif obligatoire : ${data.reference}

Une fois le virement effectué, vous pouvez joindre votre reçu/preuve de virement directement sur votre espace client ou depuis le lien de suivi.

Pour toute question, contactez notre équipe : ${storeConfig.email}

Cordialement,
L'équipe Bren-nholz`;

  const textDe = `Bren-nholz — Bestelleingangsbestätigung

Guten Tag ${data.customer.firstName} ${data.customer.lastName},

vielen Dank für Ihre Bestellung bei Bren-nholz. Ihre Bestellung wurde erfolgreich unter der Referenz ${data.reference} erfasst.

BESTELLÜBERSICHT:
Bestellnummer: ${data.reference}
Gesamtbetrag (inkl. MwSt. & Lieferung): ${formatEuro(data.totalCents)}

BESTELLTE ARTIKEL:
${linesText}

LIEFERADRESSE:
${addressText}

ZAHLUNG PER BANKÜBERWEISUNG:
Um den Versand vorzubereiten, überweisen Sie bitte den Gesamtbetrag auf folgendes Konto:
- Kontoinhaber: Bren-nholz GmbH
- IBAN: DE89 1203 0000 1234 5678 90
- BIC: BYLADEM1100
- Verwendungszweck: ${data.reference}

Nach der Überweisung können Sie den Zahlungsbeleg direkt in Ihrem Kundenkonto hochladen.

Bei Fragen stehen wir Ihnen gerne zur Verfügung: ${storeConfig.email}

Mit freundlichen Grüßen,
Ihr Bren-nholz Team`;

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
        to: [data.customer.email.trim()],
        subject,
        text: isDe ? textDe : textFr,
        reply_to: storeConfig.email,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch (err) {
    console.error('Email order confirmation send error:', err);
    return false;
  }
}
