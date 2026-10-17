import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { DEFAULT_SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY } from '@/lib/supabase-defaults';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  const blocked = await protectApi(request, 15, 60_000);
  if (blocked) return blocked;
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: 'Anmeldung erforderlich.' }, { status: 401 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || DEFAULT_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: 'Bitte erneut anmelden.' }, { status: 401 });
    const { data: role, error: roleError } = await db.from('admin_roles').select('role').eq('user_id', auth.user.id).maybeSingle();
    if (roleError || !role || !['admin', 'super_admin', 'owner'].includes(role.role)) {
      return NextResponse.json({ error: 'Zugriff verweigert.' }, { status: 403 });
    }
    let body;
    try { body = await readLimitedJson(request, 2_000); }
    catch (error) {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: error instanceof BodyLimitError ? 413 : 400 });
    }
    if (!body || typeof body !== 'object' || !('orderId' in body) || !('reference' in body)
      || typeof body.orderId !== 'number' || !Number.isSafeInteger(body.orderId) || body.orderId <= 0
      || typeof body.reference !== 'string' || !/^TP-[A-F0-9]{12}$/.test(body.reference)) {
      return NextResponse.json({ error: 'Ungültige Bestellkennung.' }, { status: 400 });
    }
    // Keep the archive condition on the DELETE itself: a restored order must never be deleted.
    const { data: removed, error } = await db.from('order_requests').delete()
      .eq('id', body.orderId).eq('reference', body.reference).not('archived_at', 'is', null)
      .select('id, reference').maybeSingle();
    if (error) return NextResponse.json({ error: 'Die Bestellung konnte nicht gelöscht werden.' }, { status: 500 });
    if (!removed) return NextResponse.json({ error: 'Archivierte Bestellung nicht gefunden. Bitte die Liste aktualisieren.' }, { status: 409 });
    // Related order lines and payment events are removed by database cascade.
    let proofFailed = false;
    try {
      const proof = await db.storage.from('payment-proofs').remove([`${removed.reference}/proof`]);
      proofFailed = !!proof.error;
    } catch { proofFailed = true; }
    return NextResponse.json({ deleted: true, warning: proofFailed
      ? 'Bestellung gelöscht. Der Zahlungsbeleg konnte nicht entfernt werden. Bitte den Support kontaktieren.' : undefined });
  } catch {
    return NextResponse.json({ error: 'Dienst vorübergehend nicht verfügbar.' }, { status: 503 });
  }
}
