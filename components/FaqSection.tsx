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
    <section data-analytics-section="faq" className="bg-[#F5F7F8] py-16 sm:py-20 border-t border-[#E2E8F0]">
      <div className="container max-w-4xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#123524]">Besoin d’aide ?</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#123524]">Questions fréquentes</h2>
          </div>
          {compact && <Link href="/faq" className="inline-flex items-center gap-2 font-semibold text-[#123524] hover:underline">Toutes les réponses <ArrowRight size={17}/></Link>}
        </div>
        <div className="divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0] bg-white px-5 sm:px-7 shadow-sm">
          {items.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-[#123524] marker:hidden [&::-webkit-details-marker]:hidden">
                {question}<span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F5F7F8] text-xl font-normal text-[#123524] transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pr-10 pt-3 leading-7 text-[#475569]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  ), brenLocale);
}
