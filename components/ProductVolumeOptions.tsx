import Link from '@/i18n/navigation';
import { productPathSegment, type Product } from '@/lib/products';
import type { Locale } from '@/i18n/routing';

export default function ProductVolumeOptions({ product, variants, locale }: { product: Product; variants: Product[]; locale: Locale }) {
  const labels = {
    fr: { title: 'Choisir le volume', total: 'Prix total', unavailable: 'Indisponible' },
    de: { title: 'Menge wählen', total: 'Gesamtpreis', unavailable: 'Nicht verfügbar' },
    en: { title: 'Choose the volume', total: 'Total price', unavailable: 'Unavailable' },
  }[locale];
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
  return <section data-original-content className="mt-6" aria-label={labels.title}>
    <h2 className="font-bold text-stone-900">{labels.title}</h2>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {variants.map(variant => {
        const selected = variant.id === product.id;
        const available = variant.stock !== 0 && variant.priceAmount !== undefined;
        const content = <><span className="text-base font-bold">{variant.volumeRm} RM</span><span className="mt-1 block text-sm">{available ? money(variant.priceAmount!) : labels.unavailable}</span></>;
        const className = `rounded-xl border-2 px-3 py-3 text-center transition ${selected ? 'border-[#A33D1E] bg-[#A33D1E] text-white' : 'border-stone-200 bg-white text-stone-800 hover:border-[#A33D1E]'}`;
        return available ? <Link key={variant.id} href={`/produits/${productPathSegment(variant)}`} aria-current={selected ? 'page' : undefined} className={className}>{content}</Link> : <span key={variant.id} aria-disabled="true" className="rounded-xl border-2 border-stone-100 px-3 py-3 text-center text-stone-400">{content}</span>;
      })}
    </div>
    {product.priceAmount !== undefined && product.volumeRm && <p className="mt-3 text-sm text-[#6B5E55]">{labels.total}: {money(product.priceAmount)} · {money(Math.round(product.priceAmount / product.volumeRm))} / RM</p>}
  </section>;
}
