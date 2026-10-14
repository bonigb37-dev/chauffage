import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Rétractation, retours et remboursements — Bren-nholz", "Consultez les modalités de rétractation, de retour et de remboursement, l’adresse de retour et le formulaire de déclaration en ligne.", "/retractation"))); }

import Link from '@/i18n/navigation';
import PolicyPage from '@/components/PolicyPage';
import WithdrawalForm from '@/components/WithdrawalForm';
import { storeConfig } from '@/lib/store-config';

export default function ReturnsPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<PolicyPage title="Rétractation, retours et remboursements">
    <section><h2 className="text-xl font-bold">Votre droit de rétractation</h2><p>Si vous achetez en tant que consommateur, vous pouvez vous rétracter sans justification dans les 14 jours suivant la réception des marchandises par vous-même ou un tiers désigné autre que le transporteur. Pour une commande livrée en plusieurs envois, le délai commence à la réception du dernier bien. Les exceptions légales applicables, notamment aux produits confectionnés selon vos spécifications ou nettement personnalisés, doivent être indiquées avant l’achat ; aucune exclusion générale ne vise les combustibles de notre catalogue.</p></section>
    <section><h2 className="text-xl font-bold">Comment notifier votre décision</h2><p>Envoyez une déclaration claire à <a href={`mailto:${storeConfig.email}`} className="text-orange-700 underline">{storeConfig.email}</a>, par courrier à {storeConfig.address}, ou utilisez la fonction ci-dessous, accessible sans compte. Indiquez votre nom et les informations permettant d’identifier la commande ou les articles concernés. L’envoi avant l’expiration du délai suffit pour exercer ce droit. Le formulaire type est facultatif.</p><Link href="#retractation" className="inline-flex mt-3 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white">Me rétracter du contrat</Link></section>
    <section><h2 className="text-xl font-bold">Retour des marchandises</h2><p>Renvoyez les biens au plus tard dans les 14 jours suivant la notification, sauf si Bren-nholz propose de les récupérer. {storeConfig.returnCosts} Contactez-nous pour organiser le retour, notamment la collecte des palettes. Cette organisation ne conditionne pas la validité de votre notification.</p><p>{storeConfig.returnAddress ? `Adresse de retour : ${storeConfig.returnAddress}` : 'L’adresse de retour logistique doit encore être confirmée par Bren-nholz. Ne confondez pas l’adresse de contact avec une adresse de dépôt des marchandises ; contactez-nous pour obtenir les instructions de retour.'}</p><p>L’emballage intact n’est pas obligatoire et un sac ouvert n’est pas automatiquement exclu. Une dépréciation peut être prise en compte uniquement pour une manipulation dépassant ce qui est nécessaire pour examiner la nature, les caractéristiques et le fonctionnement du produit, dans les conditions légales applicables. Protégez les marchandises pour leur transport.</p></section>
    <section><h2 className="text-xl font-bold">Remboursement</h2><p>Bren-nholz rembourse les sommes reçues dans les 14 jours suivant la notification de rétractation. Le remboursement peut être différé jusqu’à réception des biens ou d’une preuve de leur expédition, selon le premier de ces événements, sauf si Bren-nholz propose de récupérer les biens.</p><p>Le remboursement utilise le même moyen de paiement, sauf accord exprès pour un autre moyen sans frais. La livraison en Allemagne est sans supplément : 0,00 €. Pour les anciennes commandes, les éventuels coûts d’envoi standard déjà réglés sont également remboursés ; les suppléments liés à un mode de livraison plus coûteux choisi par le client ne le sont pas.</p></section>
    <section><h2 className="text-xl font-bold">Produit endommagé, incorrect ou non conforme</h2><p>Une réclamation est distincte de la rétractation et ne réduit pas vos garanties légales. Signalez le problème via le <Link href="/contact" className="text-orange-700 underline">formulaire de contact</Link> avec votre référence et, si possible, des photos. Les droits liés aux défauts prévus par le droit allemand, notamment les §§ 434 et suivants et 437 BGB, restent applicables.</p></section>
    <section><h2 className="text-xl font-bold">Muster-Widerrufsformular</h2><p>An {storeConfig.legalName} — {storeConfig.name}, {storeConfig.address}, {storeConfig.email}:</p><p className="whitespace-pre-line rounded-xl bg-stone-50 p-4">{'Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren:\n\nWaren & Bestellnummer: …\nBestellt am / erhalten am: …\nName des/der Verbraucher(s): …\nAnschrift des/der Verbraucher(s): …\nDatum: …\nUnterschrift (nur bei Mitteilung auf Papier): …\n(Unzutreffendes streichen)'}</p></section>
    <WithdrawalForm />
    <p className="text-sm">Textes de référence : <a href="https://www.gesetze-im-internet.de/bgb/__355.html" className="underline">§ 355 BGB</a>, <a href="https://www.gesetze-im-internet.de/bgb/__356a.html" className="underline">§ 356a BGB</a> et <a href="https://www.gesetze-im-internet.de/bgb/__357.html" className="underline">§ 357 BGB</a>.</p>
  </PolicyPage>, brenLocale);
}
