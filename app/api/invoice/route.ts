import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdf, type InvoiceData } from '@/lib/invoice-pdf';
import { sendOrderConfirmationEmail, sendPaymentConfirmedEmail } from '@/lib/order-email';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isCallerAdmin(request: Request, adminClient: any): Promise<boolean> {
  const authHeader = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!authHeader) return false;
  try {
    const { data: userData } = await adminClient.auth.getUser(authHeader);
    if (!userData?.user) return false;
    const { data: roleData } = await adminClient
      .from('admin_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    const role = (roleData as { role?: string } | null)?.role;
    return Boolean(role && ['admin', 'super_admin', 'owner'].includes(role));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const blocked = await protectApi(request, 20, 60_000);
  if (blocked) return blocked;

  const url = new URL(request.url);
  const reference = url.searchParams.get('reference')?.trim().toUpperCase();

  if (!reference || !/^TP-[A-F0-9]{12}$/.test(reference)) {
    return NextResponse.json({ error: 'Ungültige Bestellreferenz.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || DEFAULT_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Rechnungsdienst vorübergehend nicht verfügbar.' }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: orderErr } = await admin
    .from('order_requests')
    .select('reference, customer, shipping, items, total_cents, created_at, payment_status')
    .eq('reference', reference)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden.' }, { status: 404 });
  }

  const cust = isRecord(order.customer) ? order.customer : {};
  const ship = isRecord(order.shipping) ? order.shipping : null;
  const items = Array.isArray(order.items) ? order.items : [];

  const invoiceData: InvoiceData = {
    reference: order.reference,
    orderDate: order.created_at ? new Date(order.created_at).toLocaleDateString('de-DE') : undefined,
    customer: {
      firstName: cleanText(cust.firstName, 100),
      lastName: cleanText(cust.lastName, 100),
      email: cleanText(cust.email, 254),
      street: cleanText(cust.street, 180),
      postalCode: cleanText(cust.postalCode, 12),
      city: cleanText(cust.city, 100),
    },
    shipping: ship ? {
      firstName: cleanText(ship.firstName, 100),
      lastName: cleanText(ship.lastName, 100),
      street: cleanText(ship.street, 180),
      postalCode: cleanText(ship.postalCode, 12),
      city: cleanText(ship.city, 100),
    } : null,
    totalCents: Number(order.total_cents) || 0,
    lines: items.map((it: unknown) => {
      const rec = isRecord(it) ? it : {};
      return {
        name: cleanText(rec.name, 200) || 'Holzartikel',
        quantity: Number(rec.quantity) || 1,
        unit_price_cents: Number(rec.unit_price_cents) || 0,
      };
    }),
  };

  const sendEmail = url.searchParams.get('sendEmail') === '1' || url.searchParams.get('sendEmail') === 'true';
  if (sendEmail) {
    try {
      let emailSent = false;
      if (order.payment_status === 'confirmed') {
        emailSent = await sendPaymentConfirmedEmail({
          reference: order.reference,
          customer: invoiceData.customer,
          shipping: invoiceData.shipping,
          totalCents: invoiceData.totalCents,
          lines: invoiceData.lines,
          locale: 'de',
        });
      } else {
        // Envoi de l'accusé de réception (sans facture PDF)
        emailSent = await sendOrderConfirmationEmail({
          reference: order.reference,
          customer: invoiceData.customer,
          shipping: invoiceData.shipping,
          totalCents: invoiceData.totalCents,
          lines: invoiceData.lines,
          locale: 'de',
          attachInvoice: false,
        });
      }
      return NextResponse.json({ success: true, emailSent });
    } catch (err) {
      console.error('Email dispatch error:', err);
      return NextResponse.json({ error: 'Die E-Mail konnte nicht versendet werden.' }, { status: 500 });
    }
  }

  // Vérification de sécurité : la facture PDF n'est téléchargeable que si le paiement est confirmé, ou pour l'administrateur
  const isConfirmed = order.payment_status === 'confirmed';
  if (!isConfirmed) {
    const adminUser = await isCallerAdmin(request, admin);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Die Rechnung steht erst nach bestätigtem Zahlungseingang zur Verfügung.' },
        { status: 403 }
      );
    }
  }

  try {
    const pdfBuffer = await generateInvoicePdf(invoiceData);
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${reference}.pdf"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (pdfErr) {
    console.error('Invoice PDF generation error:', pdfErr);
    return NextResponse.json({ error: 'Die PDF-Rechnung konnte nicht erstellt werden.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const blocked = await protectApi(request, 20, 60_000);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await readLimitedJson(request, 32_000);
  } catch (cause) {
    if (cause instanceof BodyLimitError) {
      return NextResponse.json({ error: 'Anfrage zu groß.' }, { status: 413 });
    }
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.reference !== 'string' || !/^TP-[A-F0-9]{12}$/.test(body.reference)) {
    return NextResponse.json({ error: 'Ungültige Bestellreferenz.' }, { status: 400 });
  }

  const reference = body.reference;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || DEFAULT_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Rechnungsdienst vorübergehend nicht verfügbar.' }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: orderErr } = await admin
    .from('order_requests')
    .select('reference, customer, shipping, items, total_cents, created_at, payment_status')
    .eq('reference', reference)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden.' }, { status: 404 });
  }

  const cust = isRecord(order.customer) ? order.customer : {};
  const ship = isRecord(order.shipping) ? order.shipping : null;
  const items = Array.isArray(order.items) ? order.items : [];

  const invoiceData: InvoiceData = {
    reference: order.reference,
    orderDate: order.created_at ? new Date(order.created_at).toLocaleDateString('de-DE') : undefined,
    customer: {
      firstName: cleanText(cust.firstName, 100),
      lastName: cleanText(cust.lastName, 100),
      email: cleanText(cust.email, 254),
      street: cleanText(cust.street, 180),
      postalCode: cleanText(cust.postalCode, 12),
      city: cleanText(cust.city, 100),
    },
    shipping: ship ? {
      firstName: cleanText(ship.firstName, 100),
      lastName: cleanText(ship.lastName, 100),
      street: cleanText(ship.street, 180),
      postalCode: cleanText(ship.postalCode, 12),
      city: cleanText(ship.city, 100),
    } : null,
    totalCents: Number(order.total_cents) || 0,
    lines: items.map((it: unknown) => {
      const rec = isRecord(it) ? it : {};
      return {
        name: cleanText(rec.name, 200) || 'Holzartikel',
        quantity: Number(rec.quantity) || 1,
        unit_price_cents: Number(rec.unit_price_cents) || 0,
      };
    }),
  };

  const sendEmail = isRecord(body) && (body.sendEmail === true || body.sendEmail === '1' || body.sendEmail === 'true');
  if (sendEmail) {
    try {
      let emailSent = false;
      if (order.payment_status === 'confirmed') {
        emailSent = await sendPaymentConfirmedEmail({
          reference: order.reference,
          customer: invoiceData.customer,
          shipping: invoiceData.shipping,
          totalCents: invoiceData.totalCents,
          lines: invoiceData.lines,
          locale: 'de',
        });
      } else {
        // Envoi de l'accusé de réception (sans facture PDF)
        emailSent = await sendOrderConfirmationEmail({
          reference: order.reference,
          customer: invoiceData.customer,
          shipping: invoiceData.shipping,
          totalCents: invoiceData.totalCents,
          lines: invoiceData.lines,
          locale: 'de',
          attachInvoice: false,
        });
      }
      return NextResponse.json({ success: true, emailSent });
    } catch (err) {
      console.error('Email dispatch error:', err);
      return NextResponse.json({ error: 'Die Bestätigung per E-Mail konnte nicht versendet werden.' }, { status: 500 });
    }
  }

  // Vérification de sécurité : la facture PDF n'est téléchargeable que si le paiement est confirmé, ou pour l'administrateur
  const isConfirmed = order.payment_status === 'confirmed';
  if (!isConfirmed) {
    const adminUser = await isCallerAdmin(request, admin);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Die Rechnung steht erst nach bestätigtem Zahlungseingang zur Verfügung.' },
        { status: 403 }
      );
    }
  }

  try {
    const pdfBuffer = await generateInvoicePdf(invoiceData);
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${reference}.pdf"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (pdfErr) {
    console.error('Invoice PDF generation error:', pdfErr);
    return NextResponse.json({ error: 'Die PDF-Rechnung konnte nicht erstellt werden.' }, { status: 500 });
  }
}
