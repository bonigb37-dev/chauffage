import type { Product } from '@/lib/products';
import type { Locale } from '@/i18n/routing';
export type VatRate = 7 | 19;
// Rates for firelighters 16, 17 and 78 confirmed by the merchant on 2026-10-13.
export const pendingVatProductIds = [] as const;
export function vatRateForProduct(product: Pick<Product,'id'|'type'>): VatRate | null {
  if ((pendingVatProductIds as readonly number[]).includes(product.id)) return null;
  if ([16,17,77,78].includes(product.id)) return 19;
  if (['Bois de chauffage','Granulés','Briquettes'].includes(product.type)) return 7;
  if ([13,14,15,79].includes(product.id)) return 7; // Untreated wood kindling.
  return 19; // Standard rate, including wood/wax firelighters (77).
}
export function vatLabel(product:Pick<Product,'id'|'type'>,locale:Locale){
  const rate=vatRateForProduct(product);
  return locale==='de' ? rate===null?'inkl. MwSt.':`inkl. ${rate} % MwSt.` : locale==='en' ? rate===null?'VAT included':`incl. ${rate}% VAT` : rate===null?'TVA incluse':`TVA ${rate} % incluse`;
}
export function includedVat(grossCents:number,rate:VatRate){
  if(!Number.isSafeInteger(grossCents)||grossCents<0||![7,19].includes(rate))throw new Error('invalid_vat_amount');
  const vatCents=Number((BigInt(grossCents)*BigInt(rate)+BigInt((100+rate)/2|0))/BigInt(100+rate));
  return {grossCents,netCents:grossCents-vatCents,vatCents,rate};
}
export function vatSummary(lines:{product:Pick<Product,'id'|'type'>;grossCents:number}[]){
  const groups=new Map<VatRate,number>();let pendingGrossCents=0;
  for(const line of lines){if(!Number.isSafeInteger(line.grossCents)||line.grossCents<0)throw new Error('invalid_vat_amount');const rate=vatRateForProduct(line.product);if(rate===null)pendingGrossCents+=line.grossCents;else groups.set(rate,(groups.get(rate)??0)+line.grossCents);}
  const breakdown=[...groups].sort(([a],[b])=>a-b).map(([rate,gross])=>includedVat(gross,rate));
  return {included:true,rounding:'per_rate_total',breakdown,pendingGrossCents,complete:pendingGrossCents===0};
}
