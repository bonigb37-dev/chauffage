import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
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
    phone?: string;
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
  iban: 'DE38 7602 6000 0039 4791 00',
  ibanRaw: 'DE38760260000039479100',
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
  const page = doc.addPage([595.28, 841.89]); // A4 format
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.059, 0.161, 0.118); // #0f291e dark forest green
  const accentColor = rgb(0.639, 0.239, 0.118);  // #a33d1e rust / terracotta
  const textDark = rgb(0.094, 0.145, 0.208);      // #182535 deep dark
  const textMuted = rgb(0.392, 0.455, 0.545);     // #64748b slate muted
  const borderColor = rgb(0.886, 0.910, 0.941);   // #e2e8f0 light border
  const lightBg = rgb(0.973, 0.980, 0.988);       // #f8fafc slate-50

  const formatEuro = (cents: number) =>
    sanitize(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100));

  const totalStr = formatEuro(data.totalCents);
  const dateStr = data.orderDate || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 1. Header Banner & Logo
  let bannerEmbedded = false;
  try {
    const bannerPaths = [
      path.join(process.cwd(), 'public', 'images', 'invoice-banner-opt.png'),
      path.join(process.cwd(), 'public', 'images', 'invoice-banner.png'),
    ];
    for (const bPath of bannerPaths) {
      if (fs.existsSync(bPath)) {
        const bannerBytes = fs.readFileSync(bPath);
        const bannerImage = await doc.embedPng(bannerBytes);
        const bannerWidth = 230;
        const bannerHeight = 82; // 230 / 2.805 ≈ 82
        const bannerY = 841.89 - 35 - bannerHeight;

        page.drawImage(bannerImage, {
          x: 40,
          y: bannerY,
          width: bannerWidth,
          height: bannerHeight,
        });
        bannerEmbedded = true;
        break;
      }
    }
  } catch (err) {
    console.error('Invoice banner embed error:', err);
  }

  // Fallback if image could not be loaded
  if (!bannerEmbedded) {
    page.drawRectangle({
      x: 40,
      y: 841.89 - 35 - 75,
      width: 230,
      height: 75,
      color: primaryColor,
    });
    page.drawText(sanitize(storeConfig.name), {
      x: 52,
      y: 841.89 - 72,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('Brennholz, Pellets & Holzbriketts', {
      x: 52,
      y: 841.89 - 90,
      size: 8,
      font: fontRegular,
      color: rgb(0.85, 0.9, 0.88),
    });
  }

  // Seller Details on Top Right (German professional layout)
  const rightX = 300;
  let sY = 841.89 - 42;
  page.drawText('OFFIZIELLE RECHNUNG', { x: rightX, y: sY, size: 12, font: fontBold, color: primaryColor });
  sY -= 15;
  page.drawText('Brennholz-direk · Leylines Park', { x: rightX, y: sY, size: 9, font: fontBold, color: textDark });
  sY -= 13;
  page.drawText(`Inhaberin: ${sanitize(storeConfig.legalRepresentatives)}`, { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText(sanitize(storeConfig.address), { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText(`USt-IdNr.: ${sanitize(storeConfig.vatNumber)} · St.-Nr.: ${sanitize(storeConfig.registrationNumber)}`, { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText(`Tel: ${sanitize(storeConfig.phone)} · E-Mail: ${sanitize(storeConfig.email)}`, { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText('Web: www.brennholz-direk.de', { x: rightX, y: sY, size: 8, font: fontBold, color: accentColor });

  // Divider line below header
  const headerBottomY = 841.89 - 35 - 84 - 10; // ~712
  page.drawLine({
    start: { x: 40, y: headerBottomY },
    end: { x: 555, y: headerBottomY },
    thickness: 1,
    color: primaryColor,
  });

  // 2. DIN 5008 Sender one-liner above customer address
  const senderLineY = headerBottomY - 14;
  page.drawText(`Brennholz-direk · ${sanitize(storeConfig.legalRepresentatives)} · Aarstraße 5a · 35756 Mittenaar`, {
    x: 40,
    y: senderLineY,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });
  page.drawLine({
    start: { x: 40, y: senderLineY - 3 },
    end: { x: 265, y: senderLineY - 3 },
    thickness: 0.5,
    color: borderColor,
  });

  // 3. Customer Address (Left Window)
  const cust = data.shipping || data.customer;
  let custY = senderLineY - 18;
  page.drawText('Empfänger / Lieferadresse:', { x: 40, y: custY, size: 8, font: fontBold, color: textMuted });
  custY -= 15;
  page.drawText(sanitize(`${cust.firstName} ${cust.lastName}`), { x: 40, y: custY, size: 11, font: fontBold, color: textDark });
  custY -= 14;
  page.drawText(sanitize(cust.street), { x: 40, y: custY, size: 9.5, font: fontRegular, color: textDark });
  custY -= 13;
  page.drawText(sanitize(`${cust.postalCode} ${cust.city}`), { x: 40, y: custY, size: 9.5, font: fontRegular, color: textDark });
  custY -= 13;
  page.drawText('Deutschland', { x: 40, y: custY, size: 9.5, font: fontRegular, color: textDark });
  if (data.customer.phone) {
    custY -= 12;
    page.drawText(sanitize(`Tel: ${data.customer.phone}`), { x: 40, y: custY, size: 8, font: fontRegular, color: textMuted });
  }

  // 4. Invoice Metadata Box (Right Side)
  const metaBoxY = senderLineY - 80;
  page.drawRectangle({
    x: 340,
    y: metaBoxY,
    width: 215,
    height: 78,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const metaList = [
    { label: 'Rechnungs-Nr.:', val: data.reference, isHighlight: true },
    { label: 'Bestelldatum:', val: dateStr, isHighlight: false },
    { label: 'Lieferzeit:', val: '2-4 Werktage (kostenlos)', isHighlight: false },
    { label: 'Zahlungsart:', val: 'Banküberweisung', isHighlight: false },
  ];

  let mY = metaBoxY + 62;
  for (const m of metaList) {
    page.drawText(m.label, { x: 350, y: mY, size: 8, font: fontRegular, color: textMuted });
    page.drawText(sanitize(m.val), {
      x: 430,
      y: mY,
      size: 8,
      font: fontBold,
      color: m.isHighlight ? accentColor : textDark,
    });
    mY -= 16;
  }

  // 5. Invoice Title / Subject line
  const headingY = metaBoxY - 26;
  page.drawText(sanitize(`RECHNUNG Nr. ${data.reference}`), {
    x: 40,
    y: headingY,
    size: 15,
    font: fontBold,
    color: primaryColor,
  });
  page.drawText('Vielen Dank für Ihre Bestellung. Die Lieferung erfolgt kostenlos nach Eingang Ihrer Überweisung.', {
    x: 40,
    y: headingY - 14,
    size: 8.5,
    font: fontRegular,
    color: textMuted,
  });

  // 6. Items Table Header
  const tableTop = headingY - 32;
  page.drawRectangle({
    x: 40,
    y: tableTop - 18,
    width: 515,
    height: 20,
    color: primaryColor,
  });

  page.drawText('Pos.', { x: 48, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Artikelbezeichnung', { x: 80, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Menge', { x: 340, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Einzelpreis (brutto)', { x: 400, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Gesamt (brutto)', { x: 485, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  // Rows
  let rowY = tableTop - 36;
  data.lines.forEach((line, idx) => {
    const rawName = line.name;
    const germanName = (de as Record<string, string>)[rawName] || rawName;
    const nameSanitized = sanitize(germanName);
    const displayName = nameSanitized.length > 40 ? `${nameSanitized.slice(0, 37)}...` : nameSanitized;
    const lineTotal = line.unit_price_cents * line.quantity;

    page.drawText(String(idx + 1), { x: 48, y: rowY, size: 8.5, font: fontRegular, color: textMuted });
    page.drawText(displayName, { x: 80, y: rowY, size: 8.5, font: fontBold, color: textDark });
    page.drawText(`${line.quantity}x`, { x: 345, y: rowY, size: 8.5, font: fontRegular, color: textDark });
    page.drawText(formatEuro(line.unit_price_cents), { x: 405, y: rowY, size: 8.5, font: fontRegular, color: textDark });
    page.drawText(formatEuro(lineTotal), { x: 485, y: rowY, size: 8.5, font: fontBold, color: textDark });

    page.drawLine({
      start: { x: 40, y: rowY - 6 },
      end: { x: 555, y: rowY - 6 },
      thickness: 0.5,
      color: borderColor,
    });
    rowY -= 22;
  });

  // 7. Totals & VAT Breakdown
  let sumY = rowY - 10;
  const sumLabelX = 330;
  const sumValX = 475;

  const totalCents = data.totalCents;
  // 7% ermäßigte MwSt. auf Brennstoffe (Brennholz, Pellets, Briketts)
  const netCents = Math.round(totalCents / 1.07);
  const vatCents = totalCents - netCents;

  page.drawText('Nettobetrag (Zwischensumme):', { x: sumLabelX, y: sumY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(formatEuro(netCents), { x: sumValX, y: sumY, size: 8, font: fontRegular, color: textDark });
  sumY -= 14;

  page.drawText('Enthaltene MwSt. (7% ermäßigt):', { x: sumLabelX, y: sumY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(formatEuro(vatCents), { x: sumValX, y: sumY, size: 8, font: fontRegular, color: textDark });
  sumY -= 14;

  page.drawText('Versandkosten (Deutschland):', { x: sumLabelX, y: sumY, size: 8, font: fontRegular, color: textMuted });
  page.drawText('0,00 EUR (Kostenlos)', { x: sumValX, y: sumY, size: 8, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
  sumY -= 18;

  // Highlight Box for Total
  page.drawRectangle({
    x: 325,
    y: sumY - 6,
    width: 230,
    height: 24,
    color: rgb(0.98, 0.96, 0.94),
    borderColor: rgb(0.99, 0.84, 0.67),
    borderWidth: 1,
  });

  page.drawText('Gesamtbetrag (brutto):', { x: 335, y: sumY + 1, size: 9, font: fontBold, color: accentColor });
  page.drawText(totalStr, { x: 470, y: sumY + 1, size: 11, font: fontBold, color: accentColor });

  // 8. Bank Transfer Card
  const bankBoxY = sumY - 110;
  page.drawRectangle({
    x: 40,
    y: bankBoxY,
    width: 515,
    height: 90,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText('ZAHLUNGSANWEISUNG · BITTE AUF FOLGENDES BANKKONTO ÜBERWEISEN:', {
    x: 52,
    y: bankBoxY + 73,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });

  // Left side: Bank info
  page.drawText('Empfängerin:', { x: 52, y: bankBoxY + 54, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.recipient), { x: 135, y: bankBoxY + 54, size: 8.5, font: fontBold, color: textDark });

  page.drawText('Kreditinstitut / Bank:', { x: 52, y: bankBoxY + 39, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.bank), { x: 135, y: bankBoxY + 39, size: 8.5, font: fontBold, color: textDark });

  page.drawText('IBAN:', { x: 52, y: bankBoxY + 24, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.iban), { x: 135, y: bankBoxY + 24, size: 8.5, font: fontBold, color: textDark });

  page.drawText('BIC / SWIFT:', { x: 52, y: bankBoxY + 9, size: 8, font: fontRegular, color: textMuted });
  page.drawText(sanitize(BANK_DETAILS.bic), { x: 135, y: bankBoxY + 9, size: 8.5, font: fontBold, color: textDark });

  // Right side: Purpose card
  page.drawRectangle({
    x: 320,
    y: bankBoxY + 12,
    width: 220,
    height: 52,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.99, 0.84, 0.67),
    borderWidth: 1,
  });

  page.drawText('Zwingender Verwendungszweck:', { x: 330, y: bankBoxY + 48, size: 7.5, font: fontBold, color: textMuted });
  page.drawText(sanitize(data.reference), { x: 330, y: bankBoxY + 32, size: 11, font: fontBold, color: accentColor });
  page.drawText('Bitte exakt angeben für automatische Zuordnung', { x: 330, y: bankBoxY + 18, size: 6.5, font: fontRegular, color: textMuted });

  // 9. Official 4-Column Footer at the bottom
  const footerLineY = 56;
  page.drawLine({
    start: { x: 40, y: footerLineY },
    end: { x: 555, y: footerLineY },
    thickness: 0.5,
    color: borderColor,
  });

  const colWidth = 125;
  const col1X = 40;
  const col2X = col1X + colWidth;
  const col3X = col2X + colWidth + 5;
  const col4X = col3X + colWidth + 5;

  const fY = 46;
  // Col 1: Firma & Inhaberin
  page.drawText('Brennholz-direk', { x: col1X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(`Inh. ${sanitize(storeConfig.legalRepresentatives)}`, { x: col1X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('Aarstraße 5a', { x: col1X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('35756 Mittenaar', { x: col1X, y: fY - 25, size: 6.5, font: fontRegular, color: textMuted });

  // Col 2: Register & Steuern
  page.drawText('Steuern & Register', { x: col2X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(`USt-IdNr.: ${sanitize(storeConfig.vatNumber)}`, { x: col2X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText(`Steuernummer: ${sanitize(storeConfig.registrationNumber)}`, { x: col2X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('Amtsgericht Wetzlar', { x: col2X, y: fY - 25, size: 6.5, font: fontRegular, color: textMuted });

  // Col 3: Bankverbindung
  page.drawText('Bankverbindung', { x: col3X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(sanitize(`Bank: ${BANK_DETAILS.bank}`), { x: col3X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText(sanitize(`IBAN: ${BANK_DETAILS.iban}`), { x: col3X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText(sanitize(`BIC: ${BANK_DETAILS.bic}`), { x: col3X, y: fY - 25, size: 6.5, font: fontRegular, color: textMuted });

  // Col 4: Kontakt & Web
  page.drawText('Kundenservice & Web', { x: col4X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(sanitize(`Tel: ${storeConfig.phone}`), { x: col4X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText(sanitize(storeConfig.email), { x: col4X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('www.brennholz-direk.de', { x: col4X, y: fY - 25, size: 6.5, font: fontRegular, color: accentColor });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

// ──────────────────────────────────────────────────────────────────────────────
// Payment Receipt / Zahlungsbestätigung — downloaded after proof submission
// Contains order confirmation + items + totals, but NO bank transfer instructions.
// ──────────────────────────────────────────────────────────────────────────────
export async function generatePaymentReceiptPdf(data: InvoiceData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.059, 0.161, 0.118); // #0f291e dark forest green
  const accentColor = rgb(0.639, 0.239, 0.118);  // #a33d1e rust
  const textDark = rgb(0.094, 0.145, 0.208);
  const textMuted = rgb(0.392, 0.455, 0.545);
  const borderColor = rgb(0.886, 0.910, 0.941);
  const lightBg = rgb(0.973, 0.980, 0.988);
  const confirmGreen = rgb(0.027, 0.443, 0.267); // emerald-800

  const formatEuro = (cents: number) =>
    sanitize(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100));

  const totalStr = formatEuro(data.totalCents);
  const dateStr = data.orderDate || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 1. Header Banner & Logo
  let bannerEmbedded = false;
  try {
    const bannerPaths = [
      path.join(process.cwd(), 'public', 'images', 'invoice-banner-opt.png'),
      path.join(process.cwd(), 'public', 'images', 'invoice-banner.png'),
    ];
    for (const bPath of bannerPaths) {
      if (fs.existsSync(bPath)) {
        const bannerBytes = fs.readFileSync(bPath);
        const bannerImage = await doc.embedPng(bannerBytes);
        const bannerWidth = 230;
        const bannerHeight = 82;
        const bannerY = 841.89 - 35 - bannerHeight;
        page.drawImage(bannerImage, { x: 40, y: bannerY, width: bannerWidth, height: bannerHeight });
        bannerEmbedded = true;
        break;
      }
    }
  } catch { /* fallback below */ }

  if (!bannerEmbedded) {
    page.drawRectangle({ x: 40, y: 841.89 - 35 - 75, width: 230, height: 75, color: primaryColor });
    page.drawText(sanitize(storeConfig.name), { x: 52, y: 841.89 - 72, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  }

  // Seller details top-right
  const rightX = 300;
  let sY = 841.89 - 42;
  page.drawText('ZAHLUNGSBESTATIGUNG', { x: rightX, y: sY, size: 12, font: fontBold, color: primaryColor });
  sY -= 15;
  page.drawText('Brennholz-direk · Leylines Park', { x: rightX, y: sY, size: 9, font: fontBold, color: textDark });
  sY -= 13;
  page.drawText(`Inhaberin: ${sanitize(storeConfig.legalRepresentatives)}`, { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText(sanitize(storeConfig.address), { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText(`USt-IdNr.: ${sanitize(storeConfig.vatNumber)} · St.-Nr.: ${sanitize(storeConfig.registrationNumber)}`, { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText(`Tel: ${sanitize(storeConfig.phone)} · E-Mail: ${sanitize(storeConfig.email)}`, { x: rightX, y: sY, size: 8, font: fontRegular, color: textMuted });
  sY -= 11;
  page.drawText('Web: www.brennholz-direk.de', { x: rightX, y: sY, size: 8, font: fontBold, color: accentColor });

  // Divider
  const headerBottomY = 841.89 - 35 - 84 - 10;
  page.drawLine({ start: { x: 40, y: headerBottomY }, end: { x: 555, y: headerBottomY }, thickness: 1, color: primaryColor });

  // 2. DIN 5008 sender line
  const senderLineY = headerBottomY - 14;
  page.drawText(`Brennholz-direk · ${sanitize(storeConfig.legalRepresentatives)} · Aarstrasse 5a · 35756 Mittenaar`, {
    x: 40, y: senderLineY, size: 7.5, font: fontRegular, color: textMuted,
  });
  page.drawLine({ start: { x: 40, y: senderLineY - 3 }, end: { x: 265, y: senderLineY - 3 }, thickness: 0.5, color: borderColor });

  // 3. Customer Address
  const cust = data.shipping || data.customer;
  let custY = senderLineY - 18;
  page.drawText('Empfanger / Lieferadresse:', { x: 40, y: custY, size: 8, font: fontBold, color: textMuted });
  custY -= 15;
  page.drawText(sanitize(`${cust.firstName} ${cust.lastName}`), { x: 40, y: custY, size: 11, font: fontBold, color: textDark });
  custY -= 14;
  page.drawText(sanitize(cust.street), { x: 40, y: custY, size: 9.5, font: fontRegular, color: textDark });
  custY -= 13;
  page.drawText(sanitize(`${cust.postalCode} ${cust.city}`), { x: 40, y: custY, size: 9.5, font: fontRegular, color: textDark });
  custY -= 13;
  page.drawText('Deutschland', { x: 40, y: custY, size: 9.5, font: fontRegular, color: textDark });

  // 4. Metadata Box (right side) — receipt version: show proof date
  const metaBoxY = senderLineY - 80;
  page.drawRectangle({ x: 340, y: metaBoxY, width: 215, height: 78, color: lightBg, borderColor, borderWidth: 1 });
  const metaList = [
    { label: 'Bestell-Nr.:', val: data.reference, isHighlight: true },
    { label: 'Bestelldatum:', val: dateStr, isHighlight: false },
    { label: 'Beleg eingegangen:', val: todayStr, isHighlight: false },
    { label: 'Zahlungsstatus:', val: 'Bestatigt', isHighlight: false },
  ];
  let mY = metaBoxY + 62;
  for (const m of metaList) {
    page.drawText(m.label, { x: 350, y: mY, size: 8, font: fontRegular, color: textMuted });
    page.drawText(sanitize(m.val), { x: 430, y: mY, size: 8, font: fontBold, color: m.isHighlight ? accentColor : textDark });
    mY -= 16;
  }

  // 5. Document Title
  const headingY = metaBoxY - 26;
  page.drawText(sanitize(`ZAHLUNGSBESTATIGUNG Nr. ${data.reference}`), {
    x: 40, y: headingY, size: 15, font: fontBold, color: primaryColor,
  });
  page.drawText('Wir bestätigen den Eingang Ihres Überweisungsbelegs. Ihre Bestellung wird für den Versand vorbereitet.', {
    x: 40, y: headingY - 14, size: 8.5, font: fontRegular, color: textMuted,
  });

  // 6. Items Table Header
  const tableTop = headingY - 32;
  page.drawRectangle({ x: 40, y: tableTop - 18, width: 515, height: 20, color: primaryColor });
  page.drawText('Pos.', { x: 48, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Artikelbezeichnung', { x: 80, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Menge', { x: 340, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Einzelpreis (brutto)', { x: 400, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Gesamt (brutto)', { x: 485, y: tableTop - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  let rowY = tableTop - 36;
  data.lines.forEach((line, idx) => {
    const rawName = line.name;
    const germanName = (de as Record<string, string>)[rawName] || rawName;
    const nameSanitized = sanitize(germanName);
    const displayName = nameSanitized.length > 40 ? `${nameSanitized.slice(0, 37)}...` : nameSanitized;
    const lineTotal = line.unit_price_cents * line.quantity;
    page.drawText(String(idx + 1), { x: 48, y: rowY, size: 8.5, font: fontRegular, color: textMuted });
    page.drawText(displayName, { x: 80, y: rowY, size: 8.5, font: fontBold, color: textDark });
    page.drawText(`${line.quantity}x`, { x: 345, y: rowY, size: 8.5, font: fontRegular, color: textDark });
    page.drawText(formatEuro(line.unit_price_cents), { x: 405, y: rowY, size: 8.5, font: fontRegular, color: textDark });
    page.drawText(formatEuro(lineTotal), { x: 485, y: rowY, size: 8.5, font: fontBold, color: textDark });
    page.drawLine({ start: { x: 40, y: rowY - 6 }, end: { x: 555, y: rowY - 6 }, thickness: 0.5, color: borderColor });
    rowY -= 22;
  });

  // 7. Totals
  let sumY = rowY - 10;
  const sumLabelX = 330;
  const sumValX = 475;
  const totalCents = data.totalCents;
  const netCents = Math.round(totalCents / 1.07);
  const vatCents = totalCents - netCents;

  page.drawText('Nettobetrag (Zwischensumme):', { x: sumLabelX, y: sumY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(formatEuro(netCents), { x: sumValX, y: sumY, size: 8, font: fontRegular, color: textDark });
  sumY -= 14;
  page.drawText('Enthaltene MwSt. (7% ermäßigt):', { x: sumLabelX, y: sumY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(formatEuro(vatCents), { x: sumValX, y: sumY, size: 8, font: fontRegular, color: textDark });
  sumY -= 14;
  page.drawText('Versandkosten (Deutschland):', { x: sumLabelX, y: sumY, size: 8, font: fontRegular, color: textMuted });
  page.drawText('0,00 EUR (Kostenlos)', { x: sumValX, y: sumY, size: 8, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
  sumY -= 18;
  page.drawRectangle({ x: 325, y: sumY - 6, width: 230, height: 24, color: rgb(0.98, 0.96, 0.94), borderColor: rgb(0.99, 0.84, 0.67), borderWidth: 1 });
  page.drawText('Gesamtbetrag (brutto):', { x: 335, y: sumY + 1, size: 9, font: fontBold, color: accentColor });
  page.drawText(totalStr, { x: 470, y: sumY + 1, size: 11, font: fontBold, color: accentColor });

  // 8. Green Confirmation Box (replaces bank transfer box)
  const confirmBoxY = sumY - 110;
  page.drawRectangle({
    x: 40, y: confirmBoxY, width: 515, height: 90,
    color: rgb(0.941, 0.992, 0.969),
    borderColor: rgb(0.167, 0.745, 0.506),
    borderWidth: 1.5,
  });
  page.drawText('ZAHLUNG BESTATIGT - LIEFERUNG WIRD VORBEREITET', {
    x: 52, y: confirmBoxY + 73, size: 8, font: fontBold, color: confirmGreen,
  });
  page.drawText('Ihr Uberweisungsbeleg wurde erfolgreich eingegangen und von unserem Team gepruft.', {
    x: 52, y: confirmBoxY + 54, size: 8, font: fontRegular, color: textDark,
  });
  page.drawText(`Bestellnummer: ${sanitize(data.reference)}`, { x: 52, y: confirmBoxY + 39, size: 8, font: fontBold, color: textDark });
  page.drawText(`Gesamtbetrag: ${totalStr}`, { x: 52, y: confirmBoxY + 24, size: 8, font: fontBold, color: textDark });
  page.drawText('Lieferung: 2-4 Werktage in ganz Deutschland · Kostenlos · Frei Bordsteinkante', {
    x: 52, y: confirmBoxY + 9, size: 8, font: fontRegular, color: confirmGreen,
  });

  // 9. Footer
  const footerLineY = 56;
  page.drawLine({ start: { x: 40, y: footerLineY }, end: { x: 555, y: footerLineY }, thickness: 0.5, color: borderColor });
  const colWidth = 125;
  const col1X = 40;
  const col2X = col1X + colWidth;
  const col3X = col2X + colWidth + 5;
  const col4X = col3X + colWidth + 5;
  const fY = 46;

  page.drawText('Brennholz-direk', { x: col1X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(`Inh. ${sanitize(storeConfig.legalRepresentatives)}`, { x: col1X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('Aarstrasse 5a', { x: col1X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('35756 Mittenaar', { x: col1X, y: fY - 25, size: 6.5, font: fontRegular, color: textMuted });

  page.drawText('Steuern & Register', { x: col2X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(`USt-IdNr.: ${sanitize(storeConfig.vatNumber)}`, { x: col2X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText(`Steuernummer: ${sanitize(storeConfig.registrationNumber)}`, { x: col2X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('Amtsgericht Wetzlar', { x: col2X, y: fY - 25, size: 6.5, font: fontRegular, color: textMuted });

  page.drawText('Bankverbindung', { x: col3X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText('Bank: Sparkasse', { x: col3X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('IBAN: DE38 7602 6000 0039 4791 00', { x: col3X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('BIC: NORSDE71XXX', { x: col3X, y: fY - 25, size: 6.5, font: fontRegular, color: textMuted });

  page.drawText('Kundenservice & Web', { x: col4X, y: fY, size: 7, font: fontBold, color: textDark });
  page.drawText(sanitize(`Tel: ${storeConfig.phone}`), { x: col4X, y: fY - 9, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText(sanitize(storeConfig.email), { x: col4X, y: fY - 17, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText('www.brennholz-direk.de', { x: col4X, y: fY - 25, size: 6.5, font: fontBold, color: accentColor });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
