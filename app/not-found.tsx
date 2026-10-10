
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';

export default function NotFound() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<main className="container min-h-[60vh] py-20 text-center"><p className="font-bold text-orange-600">404</p><h1 className="mt-3 text-3xl font-black">Page introuvable</h1><p className="mt-4 text-gray-600">Cette adresse ne correspond à aucune page du site.</p><div className="mt-8 flex flex-wrap justify-center gap-4"><Link href="/" className="rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Retour à l’accueil</Link><Link href="/produits" className="rounded-full border border-stone-300 px-6 py-3 font-bold">Voir les produits</Link></div></main>, brenLocale);
}
