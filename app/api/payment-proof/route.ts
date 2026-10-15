import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validPaymentProofToken, proofValidityMs } from '@/lib/payment-proof-token';
import { protectApi, readLimitedBody, BodyLimitError } from '@/lib/api-security';
import { sendPaymentAcknowledgmentEmail } from '@/lib/payment-acknowledgment';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';

export const runtime = 'nodejs';
const bucket = 'payment-proofs';
const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;
  return url && key ? { db: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }), key } : null;
}

function fail(error: string, status: number) { return NextResponse.json({ error }, { status }); }

export async function POST(request: Request) {
  const blocked = await protectApi(request, 10, 10 * 60_000);
  if (blocked) return blocked;
  const server = client();
  if (!server) return fail('Übermittlungsdienst derzeit nicht verfügbar.', 503);
  if (Number(request.headers.get('content-length')) > 22 * 1024 * 1024) return fail('Der Zahlungsnachweis ist auf maximal 20 MB begrenzt.', 413);
  try {
    const bytesBody = await readLimitedBody(request, 22 * 1024 * 1024);
    const form = await new Response(bytesBody.buffer as ArrayBuffer, { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData();
    const reference = String(form.get('reference') ?? '');
    const token = String(form.get('token') ?? '');
    if (!/^TP-[A-F0-9]{12}$/.test(reference) || !validPaymentProofToken(reference, token, server.key)) return fail('Ungültiger oder abgelaufener Übermittlungslink.', 403);
    const file = form.get('file');
    if (!file || typeof file === 'string' || !(file as Blob).size || (file as Blob).size > 20 * 1024 * 1024) return fail('Bitte wählen Sie ein Dokument mit einer maximalen Dateigröße von 20 MB.', 400);
    const bytes = Buffer.from(await (file as Blob).arrayBuffer());
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    const pdf = bytes.toString('ascii', 0, 5) === '%PDF-';
    if (!png && !jpeg && !webp && !pdf) return fail('Zulässige Formate: PDF, JPG, PNG oder WebP.', 400);
    const order = await server.db.from('order_requests').select('id, reference, customer, total_cents, items').eq('reference', reference).maybeSingle();
    if (order.error || !order.data) return fail('Bestellung nicht gefunden.', 404);
    if (/^[a-f0-9]{64}$/.test(token)) {
      const dated = await server.db.from('order_requests').select('created_at').eq('reference', reference).maybeSingle();
      const created = Date.parse(dated.data?.created_at ?? '');
      if (dated.error || !Number.isFinite(created) || created > Date.now() || Date.now() - created >= proofValidityMs) return fail('Ungültiger oder abgelaufener Übermittlungslink.', 403);
    }
    const existingBucket = await server.db.storage.getBucket(bucket);
    if (!existingBucket.data) {
      await server.db.storage.createBucket(bucket, { public: false, fileSizeLimit: 20 * 1024 * 1024, allowedMimeTypes });
    }
    const upload = await server.db.storage.from(bucket).upload(`${reference}/proof`, bytes, { contentType: pdf ? 'application/pdf' : png ? 'image/png' : jpeg ? 'image/jpeg' : 'image/webp', upsert: true });
    if (upload.error) return fail('Der Zahlungsnachweis konnte nicht gespeichert werden.', 503);

    // Automatische Sendung der Zahlungsbestätigung per E-Mail an den Kunden
    let emailSent = false;
    try {
      emailSent = await sendPaymentAcknowledgmentEmail({
        reference,
        customer: order.data.customer,
        totalCents: order.data.total_cents,
        items: order.data.items,
      });
    } catch (err) {
      console.error('Fehler beim Versenden der Zahlungsbestätigung:', err);
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (cause) { return fail('Die Übermittlung ist fehlgeschlagen. Bitte versuchen Sie es erneut.', cause instanceof BodyLimitError ? 413 : 400); }
}

export async function GET(request: Request) {
  const blocked = await protectApi(request, 60);
  if (blocked) return blocked;
  const server = client();
  if (!server) return fail('Dienst derzeit nicht verfügbar.', 503);
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return fail('Anmeldung erforderlich.', 401);
  const user = await server.db.auth.getUser(token);
  if (user.error || !user.data.user) return fail('Ungültige Sitzung.', 401);
  const role = await server.db.from('admin_roles').select('role').eq('user_id', user.data.user.id).maybeSingle();
  if (role.error || !role.data || !['admin','super_admin','owner'].includes(role.data.role)) return fail('Zugriff verweigert.', 403);
  const reference = new URL(request.url).searchParams.get('reference') ?? '';
  if (!/^TP-[A-F0-9]{12}$/.test(reference)) return fail('Ungültige Bestellnummer.', 400);
  const signed = await server.db.storage.from(bucket).createSignedUrl(`${reference}/proof`, 60);
  if (signed.error) return fail('Kein Zahlungsbeleg für diese Bestellung vorhanden.', 404);
  return NextResponse.json({ url: signed.data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } });
}
