import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Conditions générales de vente — Bren-nholz", "Consultez les conditions de commande, de paiement par virement, de livraison, de rétractation et de garantie des produits Bren-nholz.", "/agb"))); }

import Link from '@/i18n/navigation';
import PolicyPage from '@/components/PolicyPage';
import { salesTerms } from '@/lib/sales-terms';
export default function SalesTermsPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<PolicyPage title="Conditions générales de vente">{salesTerms.map((article, index) => <section key={article.title}><h2 className="text-xl font-bold">{index + 1}. {article.title}</h2><div className="mt-3 space-y-3">{article.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></section>)}<nav aria-label="Informations complémentaires" className="flex flex-wrap gap-4"><Link href="/retractation" className="font-semibold text-orange-700 underline">Rétractation, retours et remboursements</Link><Link href="/datenschutz" className="font-semibold text-orange-700 underline">Confidentialité</Link><Link href="/commande" className="font-semibold text-orange-700 underline">Retour au formulaire de commande</Link></nav></PolicyPage>, brenLocale);
}
