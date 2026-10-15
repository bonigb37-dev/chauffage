import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import de from '@/translations/de.json';
import { storeConfig } from './store-config';

export interface InvoiceData {
  reference: string;
  orderDate?: string;
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
}

const BANK_DETAILS = {
  recipient: 'Simone Römer',
  iban: 'DE38760260000039479100',
  bic: 'NORSDE71XXX',
  bank: 'Sparkasse',
};

// Clean non-ASCII or problematic characters for PDF standard font
function sanitize(text: string): string {
  if (!text) return '';
  return text
    .replace(/[•·]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/’/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/×/g, 'x')
    .replace(/€/g, 'EUR')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.059, 0.161, 0.118); // #0f291e dark green
  const accentColor = rgb(0.639, 0.239, 0.118);  // #a33d1e rust
  const textDark = rgb(0.094, 0.145, 0.208);      // #182535
  const textMuted = rgb(0.392, 0.455, 0.545);     // #64748b
  const borderColor = rgb(0.886, 0.910, 0.941);   // #e2e8f0
  const lightBg = rgb(0.973, 0.980, 0.988);       // #f8fafc

  const formatEuro = (cents: number) =>
    sanitize(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100));

  const totalStr = formatEuro(data.totalCents);
  const dateStr = data.orderDate || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Top header bar
  page.drawRectangle({
    x: 0,
    y: 785,
    width: 595.28,
    height: 56.89,
    color: primaryColor,
  });

  page.drawText(sanitize(storeConfig.name), {
    x: 40,
    y: 805,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(sanitize(`${storeConfig.brandSubtitle} - Brennholz, Pellets & Holzbriketts`), {
    x: 40,
    y: 792,
    size: 9,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.85),
  });

  page.drawText('OFFIZIELLE RECHNUNG', {
    x: 420,
    y: 805,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Seller info line
  page.drawText(sanitize(`${storeConfig.legalRepresentatives} | ${storeConfig.address} | ${storeConfig.email}`), {
    x: 40,
    y: 760,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  // Customer block (left)
  const cust = data.shipping || data.customer;
  page.drawText('Empfänger / Lieferadresse:', {
    x: 40,
    y: 735,
    size: 9,
    font: fontBold,
    color: textMuted,
  });

  page.drawText(sanitize(`${cust.firstName} ${cust.lastName}`), {
    x: 40,
    y: 720,
    size: 11,
    font: fontBold,
    color: textDark,
  });

  page.drawText(sanitize(cust.street), {
    x: 40,
    y: 706,
    size: 10,
    font: fontRegular,
    color: textDark,
  });

  page.drawText(sanitize(`${cust.postalCode} ${cust.city}`), {
    x: 40,
    y: 692,
    size: 10,
    font: fontRegular,
    color: textDark,
  });

  page.drawText('Deutschland', {
    x: 40,
    y: 678,
    size: 10,
    font: fontRegular,
    color: textDark,
  });

  // Invoice Meta Block (right box)
  page.drawRectangle({
    x: 360,
    y: 665,
    width: 195,
    height: 85,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const metaItems = [
    { label: 'Rechnungs-Nr.:', val: data.reference },
    { label: 'Bestelldatum:', val: dateStr },
    { label: 'Lieferzeit:', val: '2-4 Werktage' },
    { label: 'Zahlungsart:', val: 'Banküberweisung' },
  ];

  let metaY = 733;
  for (const m of metaItems) {
    page.drawText(m.label, { x: 370, y: metaY, size: 8, font: fontRegular, color: textMuted });
    page.drawText(sanitize(m.val), { x: 445, y: metaY, size: 8, font: fontBold, color: textDark });
    metaY -= 17;
  }

  // Heading
  page.drawText('RECHNUNG', {
    x: 40,
    y: 635,
    size: 18,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText(sanitize(`Bestellreferenz: ${data.reference}`), {
    x: 40,
    y: 620,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  // Items Table Header
  const tableY = 595;
  page.drawRectangle({
    x: 40,
    y: tableY,
    width: 515,
    height: 22,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText('Pos.', { x: 48, y: tableY + 7, size: 8, font: fontBold, color: textMuted });
  page.drawText('Artikelbezeichnung', { x: 80, y: tableY + 7, size: 8, font: fontBold, color: textMuted });
  page.drawText('Menge', { x: 340, y: tableY + 7, size: 8, font: fontBold, color: textMuted });
  page.drawText('Einzelpreis', { x: 410, y: tableY + 7, size: 8, font: fontBold, color: textMuted });
  page.drawText('Gesamtpreis', { x: 485, y: tableY + 7, size: 8, font: fontBold, color: textMuted });

  // Rows
  let currentY = tableY - 20;
  data.lines.forEach((line, idx) => {
    const lineTotal = line.unit_price_cents * line.quantity;
    const rawName = line.name;
    const germanName = (de as Record<string, string>)[rawName] || rawName;
    const nameSanitized = sanitize(germanName);
    const displayName = nameSanitized.length > 42 ? `${nameSanitized.slice(0, 39)}...` : nameSanitized;

    page.drawText(String(idx + 1), { x: 48, y: currentY, size: 9, font: fontRegular, color: textMuted });
    page.drawText(displayName, { x: 80, y: currentY, size: 9, font: fontBold, color: textDark });
    page.drawText(`${line.quantity}x`, { x: 345, y: currentY, size: 9, font: fontRegular, color: textDark });
    page.drawText(formatEuro(line.unit_price_cents), { x: 410, y: currentY, size: 9, font: fontRegular, color: textDark });
    page.drawText(formatEuro(lineTotal), { x: 485, y: currentY, size: 9, font: fontBold, color: textDark });

    page.drawLine({
      start: { x: 40, y: currentY - 6 },
      end: { x: 555, y: currentY - 6 },
      thickness: 0.5,
      color: borderColor,
    });

    currentY -= 24;
  });

  // Summary box
  const summaryTop = currentY - 10;
  page.drawText('Versandkosten (Deutschland):', { x: 340, y: summaryTop, size: 9, font: fontRegular, color: textMuted });
  page.drawText('0,00 EUR (Kostenlos)', { x: 460, y: summaryTop, size: 9, font: fontRegular, color: textDark });

  page.drawText('Enthaltene MwSt.:', { x: 340, y: summaryTop - 16, size: 9, font: fontRegular, color: textMuted });
  page.drawText('inklusive', { x: 460, y: summaryTop - 16, size: 9, font: fontRegular, color: textDark });

  // Total bar
  page.drawRectangle({
    x: 330,
    y: summaryTop - 46,
    width: 225,
    height: 24,
    color: rgb(0.98, 0.96, 0.94),
    borderColor: rgb(0.99, 0.84, 0.67),
    borderWidth: 1,
  });

  page.drawText('Gesamtbetrag (brutto):', { x: 340, y: summaryTop - 38, size: 9, font: fontBold, color: accentColor });
  page.drawText(totalStr, { x: 470, y: summaryTop - 38, size: 11, font: fontBold, color: accentColor });

  // Bank transfer box
  const bankY = summaryTop - 150;
  page.drawRectangle({
    x: 40,
    y: bankY,
    width: 515,
    height: 85,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText('ZAHLUNGSANWEISUNG - BITTE AUF FOLGENDES BANKKONTO ÜBERWEISEN:', {
    x: 52,
    y: bankY + 67,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText('Empfängerin:', { x: 52, y: bankY + 50, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.recipient), { x: 130, y: bankY + 50, size: 9, font: fontBold, color: textDark });

  page.drawText('IBAN:', { x: 52, y: bankY + 35, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.iban), { x: 130, y: bankY + 35, size: 9, font: fontBold, color: textDark });

  page.drawText('BIC:', { x: 52, y: bankY + 20, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.bic), { x: 130, y: bankY + 20, size: 9, font: fontBold, color: textDark });

  page.drawText('Bank:', { x: 52, y: bankY + 6, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.bank), { x: 130, y: bankY + 6, size: 9, font: fontBold, color: textDark });

  page.drawText('Verwendungszweck:', { x: 320, y: bankY + 45, size: 8, font: fontBold, color: accentColor });
  page.drawText(sanitize(data.reference), { x: 410, y: bankY + 45, size: 10, font: fontBold, color: accentColor });

  page.drawText('(Zwingend angeben)', { x: 410, y: bankY + 33, size: 7, font: fontRegular, color: textMuted });

  // Bottom Notice
  page.drawText(
    sanitize('Vielen Dank für Ihren Einkauf bei Brennholz-direk. Die Ware wird nach Zahlungseingang versendet.'),
    { x: 40, y: bankY - 25, size: 8, font: fontRegular, color: textMuted }
  );

  // Bottom Footer
  page.drawLine({
    start: { x: 40, y: 50 },
    end: { x: 555, y: 50 },
    thickness: 0.5,
    color: borderColor,
  });

  page.drawText(
    sanitize(`${storeConfig.name} - ${storeConfig.address} - USt-IdNr.: ${storeConfig.vatNumber} - Tel: ${storeConfig.phone}`),
    { x: 40, y: 38, size: 7, font: fontRegular, color: textMuted }
  );

  page.drawText(sanitize(`E-Mail: ${storeConfig.email} - Web: https://www.brennholz-direk.de`), {
    x: 40,
    y: 28,
    size: 7,
    font: fontRegular,
    color: textMuted,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
