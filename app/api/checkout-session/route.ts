import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ error: 'La vérification des paiements en ligne est désactivée.' }, { status: 410 });
}
