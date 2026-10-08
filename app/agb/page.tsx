import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyPage from '@/components/PolicyPage';
import { salesTerms } from '@/lib/sales-terms';
export const metadata: Metadata = { title: 'Conditions de vente — Bren-nholz' };
export default function SalesTermsPage() {
  return <PolicyPage title="Conditions générales de vente">{salesTerms.map((article, index) => <section key={article.title}><h2 className="text-xl font-bold">{index + 1}. {article.title}</h2><div className="mt-3 space-y-3">{article.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></section>)}<nav aria-label="Informations complémentaires" className="flex flex-wrap gap-4"><Link href="/retractation" className="font-semibold text-orange-700 underline">Rétractation, retours et remboursements</Link><Link href="/datenschutz" className="font-semibold text-orange-700 underline">Confidentialité</Link><Link href="/commande" className="font-semibold text-orange-700 underline">Retour au formulaire de commande</Link></nav></PolicyPage>;
}
