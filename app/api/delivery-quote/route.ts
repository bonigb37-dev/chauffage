import { NextResponse } from 'next/server';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';
import { quoteDelivery } from '@/lib/delivery-quote-server';
export const runtime='nodejs';
export async function POST(request:Request){
 const blocked=await protectApi(request,12,10*60_000);if(blocked)return blocked;
 const headers={'Cache-Control':'no-store'};
 try{
  const input=await readLimitedJson(request,12000) as {address?:{street?:unknown;postalCode?:unknown;city?:unknown};items?:{productId:number;quantity:number}[]};
  const a=input?.address;const items=input?.items;
  if(!a||typeof a.street!=='string'||a.street.length>180||!a.street.trim()||typeof a.postalCode!=='string'||!/^\d{5}$/.test(a.postalCode)||typeof a.city!=='string'||!a.city.trim()||a.city.length>100||!Array.isArray(items)||!items.length||items.length>50||items.some(i=>!i||!Number.isSafeInteger(i.productId)||i.productId<1||!Number.isSafeInteger(i.quantity)||i.quantity<1||i.quantity>100)||new Set(items.map(i=>i.productId)).size!==items.length)return NextResponse.json({error:'invalid_delivery'},{status:400,headers});
  return NextResponse.json(await quoteDelivery({street:a.street.trim(),postalCode:a.postalCode,city:a.city.trim()},items),{headers});
 }catch(e){const code=e instanceof Error?e.message:'delivery_unavailable';const allowed=['delivery_unconfigured','delivery_unavailable','delivery_address_not_found','delivery_product_invalid','pallet_zone_unpriced'];return NextResponse.json({error:allowed.includes(code)?code:'delivery_unavailable'},{status:e instanceof BodyLimitError?413:code==='pallet_zone_unpriced'||code==='delivery_address_not_found'?422:503,headers});}
}
