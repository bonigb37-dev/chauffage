import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentConfirmedEmail, type OrderEmailData } from '@/lib/order-email';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  const blocked = await protectApi(request, 30, 60_000);
  if (blocked) return blocked;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || DEFAULT_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Dienst vorübergehend nicht verfügbar.' }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Authentification & vérification stricte du rôle administrateur
  const authHeader = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!authHeader) {
    return NextResponse.json({ error: 'Anmeldung erforderlich.' }, { status: 401 });
  }

  const { data: userData, error: userError } = await admin.auth.getUser(authHeader);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Ungültige oder abgelaufene Sitzung.' }, { status: 401 });
  }

  const { data: roleRow, error: roleError } = await admin
    .from('admin_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (roleError || !roleRow || !['admin', 'super_admin', 'owner'].includes(roleRow.role)) {
    return NextResponse.json({ error: 'Zugriff verweigert. Nur Administratoren dürfen Zahlungen bestätigen.' }, { status: 403 });
  }

  // 2. Lecture sécurisée du corps de la requête
  let body: unknown;
  try {
    body = await readLimitedJson(request, 16_000);
  } catch (cause) {
    if (cause instanceof BodyLimitError) {
      return NextResponse.json({ error: 'Anfrage zu groß.' }, { status: 413 });
    }
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (!isRecord(body) || (!body.orderId && !body.reference)) {
    return NextResponse.json({ error: 'Bestellkennung erforderlich.' }, { status: 400 });
  }

  // 3. Récupération de la commande
  let query = admin.from('order_requests').select('id, reference, customer, shipping, items, total_cents, status, payment_status, created_at');
  if (body.orderId && Number.isSafeInteger(Number(body.orderId))) {
    query = query.eq('id', Number(body.orderId));
  } else if (typeof body.reference === 'string' && /^TP-[A-F0-9]{12}$/.test(body.reference.trim())) {
    query = query.eq('reference', body.reference.trim());
  } else {
    return NextResponse.json({ error: 'Ungültige Bestellkennung.' }, { status: 400 });
  }

  const { data: order, error: orderErr } = await query.maybeSingle();
  if (orderErr || !order) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden.' }, { status: 404 });
  }

  // 4. Vérification que le paiement a bien été confirmé dans la base de données
  if (order.payment_status !== 'confirmed') {
    return NextResponse.json({
      error: 'Die Zahlung wurde in der Datenbank noch nicht als bestätigt markiert. Bitte bestätigen Sie zuerst die Überweisung.',
    }, { status: 400 });
  }

  const cust = isRecord(order.customer) ? order.customer : {};
  const ship = isRecord(order.shipping) ? order.shipping : null;
  const items = Array.isArray(order.items) ? order.items : [];

  // 5. Idempotence & prévention stricte des envois en double
  const forceResend = body.forceResend === true;
  if (cust.payment_confirmation_email_sent === true && !forceResend) {
    return NextResponse.json({
      success: true,
      alreadySent: true,
      message: 'Die Zahlungsbestätigung samt Rechnung wurde diesem Kunden bereits versandt.',
    });
  }

  const emailData: OrderEmailData = {
    reference: order.reference,
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
    locale: 'de',
  };

  // 6. Envoi de l'e-mail de confirmation de paiement AVEC facture PDF jointe
  let emailSent = false;
  try {
    emailSent = await sendPaymentConfirmedEmail(emailData);
  } catch (err) {
    console.error('Fehler beim Versenden der Zahlungsbestätigung & Rechnung:', err);
    return NextResponse.json({ error: 'Die Bestätigungs-E-Mail konnte nicht versendet werden.' }, { status: 500 });
  }

  if (!emailSent) {
    return NextResponse.json({ success: false, emailSent: false, error: 'Die Zahlung ist bestätigt, aber die E-Mail konnte nicht versendet werden. Bitte prüfen Sie die E-Mail-Konfiguration und versuchen Sie es erneut.' }, { status: 502 });
  }

  // 7. Enregistrement de l'envoi dans les métadonnées de commande
  try {
    const updatedCustomer = {
      ...cust,
      payment_confirmation_email_sent: true,
      payment_confirmation_email_sent_at: new Date().toISOString(),
      payment_confirmed_by: userData.user.id,
    };
    await admin.from('order_requests').update({ customer: updatedCustomer }).eq('id', order.id);
  } catch (persistErr) {
    console.error('Fehler beim Speichern des E-Mail-Sendestatus:', persistErr);
  }

  return NextResponse.json({ success: true, emailSent });
}
