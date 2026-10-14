import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export default function ContactCTA() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <section data-analytics-section="contact" className="container py-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#E6DCce] bg-[#F4EDE4] px-7 py-14 text-[#1C1917] sm:px-12 shadow-sm">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#A33D1E]/5" />
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-bold uppercase tracking-[.2em] text-[#A33D1E]">Planen Sie Ihren Brennstoffbedarf?</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black text-[#1C1917] sm:text-5xl">Wählen Sie Ihre Brennstoffe und bestellen Sie bequem online.</h2>
            <p className="mt-4 max-w-xl text-[#6B5E55]">Entdecken Sie unser Sortiment und legen Sie Ihre Wunschartikel in den Warenkorb. Alle Preise verstehen sich inkl. MwSt. und kostenloser Speditionslieferung in ganz Deutschland.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/produits#catalogue"
              className="inline-flex items-center gap-2 rounded-full bg-[#A33D1E] px-6 py-4 font-extrabold text-white transition shadow-lg hover:bg-[#832F15]"
            >
              <span>Produkte auswählen</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  ), brenLocale);
}
