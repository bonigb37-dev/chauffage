
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export default function ContactCTA() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <section data-analytics-section="contact" className="container py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#A54829] px-7 py-14 text-white sm:px-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-bold uppercase tracking-[.2em] text-orange-100">Un projet d&apos;approvisionnement ?</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-5xl">Choisissez vos combustibles et commandez en ligne.</h2>
            <p className="mt-4 max-w-xl text-orange-50">Consultez nos produits et ajoutez vos articles au panier. Les prix sont TTC. Aucun supplément de livraison n’est facturé en Allemagne.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/produits#catalogue"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-extrabold transition shadow-lg hover:bg-stone-100"
              style={{ color: '#ea580c' }}
            >
              <span style={{ color: '#ea580c' }}>Choisir mes produits</span>
              <ArrowRight size={18} style={{ color: '#ea580c' }} />
            </Link>

          </div>
        </div>
      </div>
    </section>
  ), brenLocale);
}
