import PolicyPage from '@/components/PolicyPage';
import {localizeNode} from '@/i18n/copy';
import type {Locale} from '@/i18n/routing';
import {useLocale} from 'next-intl';
import {localizeMetadata,publicMetadata} from '@/lib/seo';
export async function generateMetadata(){return localizeMetadata(await publicMetadata('Conditions de livraison | Bren-nholz — Leylines Park','Livraison en Allemagne sans supplément. Les prix TTC des produits incluent déjà la TVA.','/frais-livraison'));}
export default function DeliveryFeesPage(){const locale=useLocale() as Locale;return localizeNode(<PolicyPage title="Conditions de livraison"><section><h2 className="text-xl font-bold">Livraison en Allemagne</h2><p>Aucun supplément de livraison n’est facturé pour toute commande livrée en Allemagne. Les frais de livraison sont de 0,00 €, quels que soient la distance, la région, le code postal, les produits ou les quantités.</p><p>Les prix des produits sont TTC. La TVA est déjà incluse et n’est jamais ajoutée au paiement. Le total à payer correspond exactement à la somme des prix TTC des produits commandés.</p><p>La livraison intervient sous 2 à 4 jours ouvrables après réception effective du paiement. Les conditions d’accès pour le camion et le déchargement des palettes restent applicables. Aucun paiement n’est demandé au transporteur.</p></section></PolicyPage>,locale);}
