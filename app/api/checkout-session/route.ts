import { NextResponse } from 'next/server';

type MolliePayment = {
  status?: string;
  amount?: { value?: string; currency?: string };
  metadata?: { source?: string };
};

export async function GET(request: Request) {
  return NextResponse.json({ error: 'La vérification des paiements en ligne est désactivée.' }, { status: 410 });

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Le paiement Mollie n’est pas configuré sur le serveur.' }, { status: 503 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^tr_[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: 'Référence de paiement invalide.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ error: 'La confirmation du paiement est indisponible.' }, { status: 502 });
    const payment = await response.json() as MolliePayment;
    if (payment.metadata?.source !== 'thermopro-checkout') {
      return NextResponse.json({ error: 'Cette référence ne correspond pas à une commande de cette boutique.' }, { status: 404 });
    }
    return NextResponse.json({
      paid: payment.status === 'paid',
      pending: ['open', 'pending', 'authorized'].includes(payment.status ?? ''),
      amount: payment.amount?.value ? Math.round(Number.parseFloat(payment.amount.value) * 100) : null,
      currency: payment.amount?.currency?.toLowerCase() ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Impossible de vérifier le paiement pour le moment.' }, { status: 502 });
  }
}
