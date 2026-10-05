import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { products } from '@/lib/products';

type AddressInput = { firstName?: unknown; lastName?: unknown; street?: unknown; addressLine2?: unknown; postalCode?: unknown; city?: unknown; state?: unknown; phone?: unknown; email?: unknown };
type CartRequest = { items?: unknown; acceptedTerms?: unknown; customer?: AddressInput & { shipping?: AddressInput | null } };
type MolliePayment = { id?: string; _links?: { checkout?: { href?: string } } };

function clean(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validAddress(value: AddressInput) {
  return ['firstName', 'lastName', 'street', 'postalCode', 'city'].every((key) => clean(value[key as keyof AddressInput], 120).length > 0);
}

function mollieAddress(value: AddressInput) {
  const line2 = clean(value.addressLine2, 160);
  const state = clean(value.state, 100);
  return {
    givenName: clean(value.firstName, 80),
    familyName: clean(value.lastName, 80),
    streetAndNumber: [clean(value.street, 160), line2].filter(Boolean).join(', '),
    postalCode: clean(value.postalCode, 20),
    city: clean(value.city, 100),
    ...(state ? { region: state } : {}),
    country: 'DE',
  };
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Le paiement en ligne est désactivé.' }, { status: 410 });

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Le paiement Mollie n’est pas configuré sur le serveur.' }, { status: 503 });

  let body: CartRequest;
  try {
    body = await request.json() as CartRequest;
  } catch {
    return NextResponse.json({ error: 'La commande est invalide.' }, { status: 400 });
  }

  const customer = body.customer;
  if (body.acceptedTerms !== true) return NextResponse.json({ error: 'Veuillez accepter les conditions de vente avant de continuer.' }, { status: 400 });
  if (!customer || !validAddress(customer) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(customer.email, 254))) {
    return NextResponse.json({ error: 'Complétez les coordonnées de facturation et indiquez une adresse e-mail valide.' }, { status: 400 });
  }
  if (customer.shipping && !validAddress(customer.shipping)) {
    return NextResponse.json({ error: 'Complétez les champs obligatoires de l’adresse de livraison en Allemagne.' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) {
    return NextResponse.json({ error: 'Le panier est vide ou comporte trop d’articles.' }, { status: 400 });
  }

  const quantities = new Map<number, number>();
  for (const item of body.items) {
    if (!item || typeof item !== 'object') return NextResponse.json({ error: 'Un article du panier est invalide.' }, { status: 400 });
    const { productId, quantity } = item as { productId?: unknown; quantity?: unknown };
    if (typeof productId !== 'number' || !Number.isInteger(productId) || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: 'Une quantité ou une référence est invalide.' }, { status: 400 });
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }

  const orderLines = [...quantities].map(([productId, quantity]) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product || product.priceAmount === undefined || (product.stock !== undefined && quantity > product.stock)) return null;
    return { product, quantity };
  });
  if (orderLines.some((line) => line === null)) {
    return NextResponse.json({ error: 'Un produit est sur devis, indisponible ou dépasse le stock affiché.' }, { status: 409 });
  }

  const validLines = orderLines.filter((line): line is NonNullable<typeof line> => line !== null);
  const totalCents = validLines.reduce((sum, line) => sum + line.product.priceAmount! * line.quantity, 0);
  const orderReference = randomUUID();
  const origin = new URL(request.url).origin;
  const shipping = customer.shipping ?? customer;
  const payload = {
    method: 'banktransfer',
    amount: { currency: 'EUR', value: (totalCents / 100).toFixed(2) },
    description: `ThermoPro · commande ${orderReference.slice(0, 8)}`,
    redirectUrl: `${origin}/commande/succes?payment_id=pending`,
    cancelUrl: `${origin}/panier`,
    locale: 'fr_FR',
    billingEmail: clean(customer.email, 254),
    billingAddress: { ...mollieAddress(customer), email: clean(customer.email, 254) },
    shippingAddress: { ...mollieAddress(shipping), email: clean(customer.email, 254) },
    metadata: { source: 'thermopro-checkout', orderReference },
  };

  try {
    const paymentResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const payment = await paymentResponse.json() as MolliePayment & { _links?: { checkout?: { href?: string } }; message?: string };
    const checkoutUrl = payment._links?.checkout?.href;
    if (!paymentResponse.ok || !payment.id || !checkoutUrl) {
      return NextResponse.json({ error: 'Mollie n’a pas pu préparer le paiement. Vérifiez le compte et les moyens de paiement activés.' }, { status: 502 });
    }

    const returnUrl = `${origin}/commande/succes?payment_id=${encodeURIComponent(payment.id)}`;
    const updateResponse = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(payment.id)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectUrl: returnUrl }),
      cache: 'no-store',
    });
    if (!updateResponse.ok) return NextResponse.json({ error: 'Mollie n’a pas pu configurer le retour sécurisé après paiement.' }, { status: 502 });

    const url = new URL(checkoutUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'www.mollie.com') {
      return NextResponse.json({ error: 'Adresse de paiement Mollie invalide.' }, { status: 502 });
    }
    return NextResponse.json({ url: url.toString() });
  } catch {
    return NextResponse.json({ error: 'Impossible de joindre Mollie pour le moment.' }, { status: 502 });
  }
}
