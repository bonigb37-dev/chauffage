import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { mergeCatalog } from '@/lib/catalog';
import { calculateDeliveryFee, deliveryOrigin, deliveryShippingClass } from '@/lib/delivery-pricing';
export type DeliveryAddress = { street: string; postalCode: string; city: string };
export type DeliveryItem = { productId: number; quantity: number };
export type DeliveryQuote = { feeCents: number; distanceKm: number; pallets: number; localCents: number; palletCents: number; address: string; expiresAt: number };
function fingerprint(address: DeliveryAddress, items: DeliveryItem[]) {
  return createHash('sha256').update(JSON.stringify({ address: [address.street,address.postalCode,address.city].map(s=>s.trim().normalize('NFC').toLowerCase()), items: [...items].sort((a,b)=>a.productId-b.productId) })).digest('hex');
}
function key() { const value=process.env.SUPABASE_SERVICE_ROLE_KEY; if(!value)throw new Error('delivery_unconfigured'); return value; }
export function readDeliveryQuote(token: string, address: DeliveryAddress, items: DeliveryItem[]): DeliveryQuote {
  const parts=token.split('.');if(parts.length!==2||token.length>4000)throw new Error('delivery_quote_invalid');
  const signature=createHmac('sha256',key()).update(parts[0]).digest();const supplied=Buffer.from(parts[1],'base64url');
  if(supplied.length!==signature.length||!timingSafeEqual(signature,supplied))throw new Error('delivery_quote_invalid');
  const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  if(payload.fingerprint!==fingerprint(address,items)||payload.quote.expiresAt<Date.now()||!Number.isSafeInteger(payload.quote.feeCents))throw new Error('delivery_quote_invalid');
  return payload.quote;
}
export async function quoteDelivery(address: DeliveryAddress, items: DeliveryItem[]) {
  const apiKey=process.env.GEOAPIFY_API_KEY?.trim() ?? '';const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if(!apiKey||!url)throw new Error('delivery_unconfigured');
  const admin=createClient(url,key(),{auth:{persistSession:false}});
  const {data,error}=await admin.from('product_overrides').select('product_id,data,is_deleted').in('product_id',items.map(i=>i.productId));
  if(error)throw new Error('delivery_unavailable');const catalog=mergeCatalog(data??[]);
  let pallets=0,hasLoose=false;
  for(const line of items){const p=catalog.find(p=>p.id===line.productId);if(!p||!p.priceAmount||p.stock===0)throw new Error('delivery_product_invalid');
    // Each sold palette or half-palette occupies one transport pallet.
    if(deliveryShippingClass(p)==='delivery_palettes')pallets+=line.quantity;else hasLoose=true;
  }
  async function geocode(text:string, destination:boolean) {
    const u=new URL('https://api.geoapify.com/v1/geocode/search');u.search=new URLSearchParams({text,filter:'countrycode:de',format:'json',limit:'1',apiKey}).toString();
    const r=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('delivery_unavailable');const result=(await r.json()).results?.[0];
    if(!result||result.country_code!=='de'||typeof result.lat!=='number'||typeof result.lon!=='number'||(!result.housenumber)||(destination&&result.postcode!==address.postalCode)||(!destination&&(result.postcode!=='35756'||String(result.housenumber).toLowerCase()!=='5')))throw new Error('delivery_address_not_found');
    if(destination){
      const normalize=(value:string)=>value.normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replaceAll('ß','ss').replace(/[^a-z0-9]/g,'');
      if(typeof result.street!=='string'||normalize(address.street)!==normalize(result.street+' '+result.housenumber))throw new Error('delivery_address_not_found');
    }
    return result;
  }
  const configuredLat=process.env.DELIVERY_ORIGIN_LAT?.trim();
  const configuredLon=process.env.DELIVERY_ORIGIN_LON?.trim();
  let origin:{lat:number;lon:number};
  if(configuredLat||configuredLon){
    const lat=Number(configuredLat),lon=Number(configuredLon);
    if(!configuredLat||!configuredLon||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat-50.6913331)>0.1||Math.abs(lon-8.3857953)>0.1)throw new Error('delivery_origin_invalid');
    origin={lat,lon};
  }else{origin=await geocode(deliveryOrigin,false);}
  const destination=await geocode(`${address.street}, ${address.postalCode} ${address.city}, Deutschland`,true);
  const route=new URL('https://api.geoapify.com/v1/routing');route.search=new URLSearchParams({waypoints:`${origin.lat},${origin.lon}|${destination.lat},${destination.lon}`,mode:'truck',apiKey}).toString();
  const response=await fetch(route,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('delivery_unavailable');const meters=(await response.json()).features?.[0]?.properties?.distance;
  if(typeof meters!=='number'||meters<0)throw new Error('delivery_unavailable');const distanceKm=meters/1000;const fee=calculateDeliveryFee(distanceKm,pallets,hasLoose);
  const quote:DeliveryQuote={...fee,distanceKm,pallets,address:destination.formatted,expiresAt:Date.now()+15*60*1000};
  const encoded=Buffer.from(JSON.stringify({fingerprint:fingerprint(address,items),quote})).toString('base64url');
  return {quote,token:encoded+'.'+createHmac('sha256',key()).update(encoded).digest('base64url')};
}
