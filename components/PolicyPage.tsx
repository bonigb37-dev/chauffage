
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';

export default function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<main className="min-h-[60vh] bg-stone-50 py-12 sm:py-16"><article className="container max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-10"><p className="text-sm font-bold uppercase tracking-widest text-orange-600">Bren-nholz</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1><p className="mt-4 text-sm text-gray-500">Mis à jour le 8 octobre 2026</p><div className="mt-8 space-y-6 leading-7 text-gray-700">{children}</div><div className="mt-10 flex flex-wrap gap-4"><Link href="/" className="font-semibold text-orange-700 underline">Retour à l’accueil</Link><Link href="/produits" className="font-semibold text-orange-700 underline">Voir les produits</Link><Link href="/contact" className="font-semibold text-orange-700 underline">Nous contacter</Link></div></article></main>, brenLocale);
}
