import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Le paiement en ligne est désactivé.' }, { status: 410 });
}
