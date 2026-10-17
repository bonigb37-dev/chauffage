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
    try { body = await readLimitedJson(request, 4_000); }
    catch (error) {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: error instanceof BodyLimitError ? 413 : 400 });
    }
    const bulk = body && typeof body === 'object' && 'orderIds' in body ? body.orderIds : undefined;
    if (bulk !== undefined && (!Array.isArray(bulk) || bulk.length < 1 || bulk.length > 100
      || bulk.some(id => typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0)
      || new Set(bulk).size !== bulk.length)) {
      return NextResponse.json({ error: 'Bitte 1 bis 100 unterschiedliche Bestellungen auswählen.' }, { status: 400 });
    }
    if (bulk === undefined && (!body || typeof body !== 'object' || !('orderId' in body) || !('reference' in body)
      || typeof body.orderId !== 'number' || !Number.isSafeInteger(body.orderId) || body.orderId <= 0
      || typeof body.reference !== 'string' || !/^TP-[A-F0-9]{12}$/.test(body.reference))) {
      return NextResponse.json({ error: 'Ungültige Bestellkennung.' }, { status: 400 });
    }
    // Keep the archive condition on the DELETE itself: a restored order must never be deleted.
    const query = db.from('order_requests').delete().not('archived_at', 'is', null);
    const result = bulk !== undefined
      ? await query.in('id', bulk as number[]).select('id, reference')
      : await query.eq('id', (body as { orderId: number }).orderId)
        .eq('reference', (body as { reference: string }).reference).select('id, reference').maybeSingle();
    const { error } = result;
    const removed = result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : [];
    if (error) return NextResponse.json({ error: 'Die Bestellung konnte nicht gelöscht werden.' }, { status: 500 });
    if (!removed.length) return NextResponse.json({ error: 'Archivierte Bestellung nicht gefunden. Bitte die Liste aktualisieren.' }, { status: 409 });
    // Related order lines and payment events are removed by database cascade.
    let proofFailed = false;
    try {
      const proof = await db.storage.from('payment-proofs').remove(removed.map(order => `${order.reference}/proof`));
      proofFailed = !!proof.error;
    } catch { proofFailed = true; }
    return NextResponse.json({ deleted: true, deletedIds: removed.map(order => order.id), warning: proofFailed
      ? 'Bestellungen gelöscht. Zahlungsbelege konnten nicht vollständig entfernt werden. Bitte den Support kontaktieren.' : undefined });
  } catch {
    return NextResponse.json({ error: 'Dienst vorübergehend nicht verfügbar.' }, { status: 503 });
  }
}
