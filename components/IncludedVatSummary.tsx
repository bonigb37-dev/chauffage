import type { Locale } from '@/i18n/routing';
import type { vatSummary } from '@/lib/vat';
export default function IncludedVatSummary({summary,locale}:{summary:ReturnType<typeof vatSummary>;locale:Locale}){
 const euros=new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'});
 return <div data-original-content className="mt-2 space-y-1 text-xs text-gray-500">{summary.breakdown.map(group=><p key={group.rate}>{locale==='de'?`davon ${group.rate} % MwSt.`:locale==='en'?`including ${group.rate}% VAT`:`dont TVA ${group.rate} %`} : {euros.format(group.vatCents/100)}</p>)}{!summary.complete&&<p>{locale==='de'?'inkl. MwSt. für weitere Artikel':locale==='en'?'VAT included for other items':'TVA incluse pour les autres articles'}</p>}</div>;
}
