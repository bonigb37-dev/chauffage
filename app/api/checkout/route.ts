import { vatSummary, vatRateForProduct } from '@/lib/vat';
import { draftId, closeDraft } from '@/lib/cart-drafts-server';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { products as catalog } from '@/lib/products';
import { paymentProofToken } from '@/lib/payment-proof-token';
import { mergeCatalog } from '@/lib/catalog';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { sendOrderConfirmationEmail } from '@/lib/order-email';
import de from '@/translations/de.json';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const blocked = await protectApi(request, 8, 10 * 60_000);
  if (blocked) return blocked;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return error('Der Bestellservice ist derzeit nicht verfügbar. Bitte kontaktieren Sie uns.', 503);
  }

  let input: unknown;
  try {
    input = await readLimitedJson(request, 32_000);
  } catch (cause) {
    if (cause instanceof BodyLimitError) return error('Die Bestellanfrage ist zu umfangreich.', 413);
    return error('Die Bestellanfrage ist ungültig.', 400);
  }

  if (!isRecord(input) || input.acceptedTerms !== true || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50 || !isRecord(input.customer)) {
    return error('Bitte überprüfen Sie die ausgewählten Artikel, Ihre Kontaktdaten und die Zustimmung zu den AGB.', 400);
  }

  const customer = {
    firstName: cleanText(input.customer.firstName, 100),
    lastName: cleanText(input.customer.lastName, 100),
    street: cleanText(input.customer.street, 180),
    addressLine2: cleanText(input.customer.addressLine2, 120),
    postalCode: cleanText(input.customer.postalCode, 12),
    city: cleanText(input.customer.city, 100),
    state: cleanText(input.customer.state, 100),
    phone: cleanText(input.customer.phone, 40),
    email: cleanText(input.customer.email, 254).toLowerCase(),
  };
  if (!customer.firstName || !customer.lastName || !customer.street || !/^\d{5}$/.test(customer.postalCode) || !customer.city || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return error('Bitte geben Sie einen vollständigen Namen, eine gültige deutsche Adresse mit 5-stelliger PLZ und eine gültige E-Mail-Adresse an.', 400);
  }

  const shippingInput = isRecord(input.shipping) ? input.shipping : null;
  const shipping = shippingInput ? {
    firstName: cleanText(shippingInput.firstName, 100),
    lastName: cleanText(shippingInput.lastName, 100),
    street: cleanText(shippingInput.street, 180),
    addressLine2: cleanText(shippingInput.addressLine2, 120),
    postalCode: cleanText(shippingInput.postalCode, 12),
    city: cleanText(shippingInput.city, 100),
    state: cleanText(shippingInput.state, 100),
  } : null;
  if (shipping && (!shipping.firstName || !shipping.lastName || !shipping.street || !/^\d{5}$/.test(shipping.postalCode) || !shipping.city)) {
    return error('Bitte geben Sie die Lieferadresse vollständig an.', 400);
  }

  const quantities = new Map<number, number>();
  const expectedPrices = new Map<number, number>();
  for (const item of input.items) {
    if (!isRecord(item) || !Number.isSafeInteger(item.productId) || !Number.isSafeInteger(item.quantity)) {
      return error('Ein Artikel oder eine Mengenbezeichnung ist ungültig.', 400);
    }
    const productId = item.productId as number;
    const quantity = item.quantity as number;
    if (productId < 1 || quantity < 1 || quantity > 100 || quantities.has(productId)) {
      return error('Jeder Artikel darf nur einmal im Warenkorb mit einer gültigen Menge vorkommen.', 400);
    }
    quantities.set(productId, quantity);
    if (!Number.isSafeInteger(item.unitPriceCents) || Number(item.unitPriceCents) <= 0) return error('Bitte aktualisieren Sie den Warenkorb, um die Preise vor der Bestellung zu überprüfen.', 409);
    expectedPrices.set(productId, item.unitPriceCents as number);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const ids = [...quantities.keys()];
  const { data: overrides, error: overrideError } = await admin.from('product_overrides')
    .select('product_id,data,is_deleted').in('product_id', ids);
  if (overrideError) return error('Der Katalog konnte nicht überprüft werden. Bitte versuchen Sie es später erneut.', 503);

  const overrideById = new Map((overrides ?? []).map((row) => [row.product_id, row] as const));
  const resolvedCatalog = mergeCatalog(overrides ?? []);
  const orderLines: { product_id: number; name: string; quantity: number; unit_price_cents: number; vat_rate: 7 | 19 | null }[] = [];
  let totalCents = 0;
  const vatLines: Parameters<typeof vatSummary>[0] = [];
  for (const [productId, quantity] of quantities) {
    const base = catalog.find((product) => product.id === productId);
    const override = overrideById.get(productId);
    if (override?.is_deleted) return error('Ein Artikel aus Ihrem Warenkorb ist leider nicht mehr verfügbar.', 409);
    const data = isRecord(override?.data) ? override.data : {};
    if (!base && !override) return error('Ein Artikel aus Ihrem Warenkorb existiert nicht mehr.', 409);

    const name = cleanText(data.name, 200) || base?.name || '';
    const priceValue = resolvedCatalog.find((product) => product.id === productId)?.priceAmount;
    if (!Number.isSafeInteger(priceValue) || (priceValue as number) <= 0) {
      return error(`„${name}“ steht derzeit nicht zum Verkauf. Bitte aktualisieren Sie Ihren Warenkorb.`, 409);
    }
    if (expectedPrices.get(productId) !== priceValue) return error('Ein Preis hat sich geändert. Bitte aktualisieren Sie Ihren Warenkorb vor der Bestellung.', 409);
    const stockValue = Object.hasOwn(data, 'stock') ? data.stock : base?.stock;
    if (typeof stockValue === 'number' && (!Number.isSafeInteger(stockValue) || stockValue < 0)) {
      return error(`Der Lagerbestand von „${name}“ muss korrigiert werden.`, 409);
    }
    if (typeof stockValue === 'number' && quantity > stockValue) {
      return error(`Unzureichender Lagerbestand für „${name}“: nur noch ${stockValue} Einheit(en) verfügbar.`, 409);
    }
    const unitPrice = priceValue as number;
    totalCents += unitPrice * quantity;
    if (!Number.isSafeInteger(totalCents) || totalCents > 2_000_000_000) return error('Der Bestellwert übersteigt das zulässige Limit.', 400);
    const product = resolvedCatalog.find(p => p.id === productId)!;
    vatLines.push({product,grossCents:unitPrice * quantity});
    const germanName = (de as Record<string, string>)[name] || name;
    orderLines.push({ product_id: productId, name: germanName, quantity, unit_price_cents: unitPrice, vat_rate: vatRateForProduct(product) });
  }

  const subtotalCents = totalCents;
  const delivery = { feeCents: 0 };
  const vat = vatSummary(vatLines);
  let userId: string | null = null;
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error: authError } = await authClient.auth.getUser();
    if (authError || !data.user) return error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', 401);
    userId = data.user.id;
  }

  const reference = `TP-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const { data: orderId, error: createError } = await admin.rpc('create_order_request_atomic', {
    p_reference: reference,
    p_customer: {...customer, deliveryFeeCents: 0, vat},
    p_shipping: shipping,
    p_items: orderLines,
    p_total_cents: totalCents,
    p_user_id: userId,
  });
  if (createError) {
    if (createError.message.includes('insufficient_stock')) return error('Der Lagerbestand hat sich soeben geändert. Bitte aktualisieren Sie den Warenkorb.', 409);
    if (createError.message.includes('product_unavailable')) return error('Ein Artikel aus Ihrem Warenkorb ist nicht mehr verfügbar.', 409);
    return error('Die Bestellung konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.', 503);
  }

  const cartDraftId = draftId(request);
  if (cartDraftId) {
    try { await closeDraft(admin, cartDraftId, 'converted'); }
    catch { console.error('Cart draft cleanup unavailable after successful order'); }
  }

  let emailSent = false;
  // Service d'envoi de l'accusé de réception par e-mail au client (toujours en allemand)
  try {
    emailSent = await sendOrderConfirmationEmail({
      reference,
      customer,
      shipping,
      totalCents,
      lines: orderLines,
      locale: 'de',
    });
  } catch (err) {
    console.error('Order receipt email notification error:', err);
  }

  return NextResponse.json({ reference, orderId, totalCents, subtotalCents, delivery, vat, lines: orderLines, proofToken: paymentProofToken(reference, serviceRoleKey), emailSent }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
