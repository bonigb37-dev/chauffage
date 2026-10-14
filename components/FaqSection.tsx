'use client';
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import Link from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { faqItems } from '@/lib/faq';

type Props = { compact?: boolean };

export default function FaqSection({ compact = false }: Props) {
  const brenLocale = useLocale() as Locale;

  const items = compact ? faqItems.slice(0, 5) : faqItems;

  return localizeNode((
    <section data-analytics-section="faq" className="bg-[#FAF6F0] py-16 sm:py-20 border-t border-[#E6DCce]">
      <div className="container max-w-4xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#A33D1E]">Besoin d’aide ?</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#1C1917]">Questions fréquentes</h2>
          </div>
          {compact && <Link href="/faq" className="inline-flex items-center gap-2 font-semibold text-[#A33D1E] hover:underline">Toutes les réponses <ArrowRight size={17}/></Link>}
        </div>
        <div className="divide-y divide-[#E6DCce] rounded-2xl border border-[#E6DCce] bg-white px-5 sm:px-7 shadow-sm">
          {items.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-[#1C1917] hover:text-[#A33D1E] transition marker:hidden [&::-webkit-details-marker]:hidden">
                {question}<span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FAF6F0] text-xl font-normal text-[#A33D1E] transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pr-10 pt-3 leading-7 text-[#6B5E55]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  ), brenLocale);
}
