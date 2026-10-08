import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { products as catalog } from '@/lib/products';
import { paymentProofToken } from '@/lib/payment-proof-token';

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return error('Le service de commande n’est pas configuré. Contactez l’entreprise.', 503);
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return error('La demande de commande est invalide.', 400);
  }

  if (!isRecord(input) || input.acceptedTerms !== true || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50 || !isRecord(input.customer)) {
    return error('Vérifiez les produits, les coordonnées et l’acceptation des conditions.', 400);
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
    return error('Renseignez un nom, une adresse allemande complète, un code postal à cinq chiffres et un e-mail valide.', 400);
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
    return error('Renseignez complètement l’adresse de livraison.', 400);
  }

  const quantities = new Map<number, number>();
  for (const item of input.items) {
    if (!isRecord(item) || !Number.isSafeInteger(item.productId) || !Number.isSafeInteger(item.quantity)) {
      return error('Un produit ou une quantité est invalide.', 400);
    }
    const productId = item.productId as number;
    const quantity = item.quantity as number;
    if (productId < 1 || quantity < 1 || quantity > 100 || quantities.has(productId)) {
      return error('Chaque produit doit apparaître une seule fois et avec une quantité valide.', 400);
    }
    quantities.set(productId, quantity);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const ids = [...quantities.keys()];
  const { data: overrides, error: overrideError } = await admin.from('product_overrides')
    .select('product_id,data,is_deleted').in('product_id', ids);
  if (overrideError) return error('Impossible de vérifier le catalogue. Réessayez plus tard.', 503);

  const overrideById = new Map((overrides ?? []).map((row) => [row.product_id, row] as const));
  const orderLines: { product_id: number; name: string; quantity: number; unit_price_cents: number }[] = [];
  let totalCents = 0;
  for (const [productId, quantity] of quantities) {
    const base = catalog.find((product) => product.id === productId);
    const override = overrideById.get(productId);
    if (override?.is_deleted) return error('Un produit de votre panier n’est plus disponible.', 409);
    const data = isRecord(override?.data) ? override.data : {};
    if (!base && !override) return error('Un produit de votre panier n’existe plus.', 409);

    const name = cleanText(data.name, 200) || base?.name || '';
    const priceValue = Object.hasOwn(data, 'priceAmount')
      ? data.priceAmount
      : base?.priceAmount;
    if (!Number.isSafeInteger(priceValue) || (priceValue as number) <= 0) {
      return error(`Le prix de « ${name} » doit être confirmé avant la commande.`, 409);
    }
    const stockValue = Object.hasOwn(data, 'stock') ? data.stock : base?.stock;
    if (typeof stockValue === 'number' && (!Number.isSafeInteger(stockValue) || stockValue < 0)) {
      return error(`Le stock de « ${name} » doit être corrigé dans l’administration.`, 409);
    }
    if (typeof stockValue === 'number' && quantity > stockValue) {
      return error(`Stock insuffisant pour « ${name} » : ${stockValue} unité(s) disponible(s).`, 409);
    }
    const unitPrice = priceValue as number;
    totalCents += unitPrice * quantity;
    if (!Number.isSafeInteger(totalCents) || totalCents > 2_000_000_000) return error('Le montant de la commande dépasse la limite autorisée.', 400);
    orderLines.push({ product_id: productId, name, quantity, unit_price_cents: unitPrice });
  }

  let userId: string | null = null;
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error: authError } = await authClient.auth.getUser();
    if (authError || !data.user) return error('Votre session a expiré. Reconnectez-vous puis réessayez.', 401);
    userId = data.user.id;
  }

  const reference = `TP-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const { data: orderId, error: createError } = await admin.rpc('create_order_request_atomic', {
    p_reference: reference,
    p_customer: customer,
    p_shipping: shipping,
    p_items: orderLines,
    p_total_cents: totalCents,
    p_user_id: userId,
  });
  if (createError) {
    if (createError.message.includes('insufficient_stock')) return error('Le stock vient de changer. Actualisez le panier et réessayez.', 409);
    if (createError.message.includes('product_unavailable')) return error('Un produit de votre panier n’est plus disponible.', 409);
    return error('La commande n’a pas pu être enregistrée. Vérifiez que la migration Supabase commerce a été appliquée.', 503);
  }

  return NextResponse.json({ reference, orderId, totalCents, lines: orderLines, proofToken: paymentProofToken(reference, serviceRoleKey) }, { status: 201 });
}
