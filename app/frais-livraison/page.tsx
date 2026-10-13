import DeliveryPricingSection from '@/components/DeliveryPricingSection';
import {localizeMetadata, publicMetadata} from '@/lib/seo';
export async function generateMetadata(){return localizeMetadata(await publicMetadata('Frais de livraison | Bren-nholz — Leylines Park','Consultez les tarifs et calculez vos frais de livraison selon la distance routière depuis Mittenaar et les produits commandés.','/frais-livraison'));}
export default function DeliveryFeesPage(){return <main><DeliveryPricingSection standalone /></main>;}
