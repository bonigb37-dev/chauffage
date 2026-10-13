import {NextResponse} from 'next/server';
// Retired endpoint: no routing provider or transport pricing is called.
export function POST(){return NextResponse.json({error:'delivery_calculator_retired',deliveryFeeCents:0},{status:410,headers:{'Cache-Control':'no-store'}});}
