import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { deliveryRegions } from '@/lib/delivery-regions';
import { publicMetadata } from '@/lib/seo';
import DeliveryRegionContent from '@/components/DeliveryRegionContent';
type Props = { params: Promise<{ region: string }> };
export async function generateMetadata({ params }: Props) {
 const { region: slug } = await params, region = deliveryRegions.find(r => r.slug === slug);
 if (!region) return {};
 const locale = await getLocale();
 const title = locale === 'de' ? `Brennholz-Lieferung in ${region.name} | Bren-nholz` : locale === 'en' ? `Firewood delivery in ${region.name} | Bren-nholz` : `Livraison de bois de chauffage en ${region.name} | Bren-nholz`;
 const description = locale === 'de' ? 'Finden Sie Ihre Stadt oder Lieferadresse. Lieferkosten nach Entfernung ab Mittenaar.' : locale === 'en' ? 'Find your city or delivery address. Delivery fees based on distance from Mittenaar.' : 'Retrouvez votre ville ou adresse de livraison. Livraison en Allemagne, frais selon la distance.';
 return publicMetadata(title, description, `/livraison/${region.slug}`);
}
export default async function DeliveryRegionPage({ params }: Props) {
 const { region: slug } = await params, region = deliveryRegions.find(r => r.slug === slug);
 if (!region) notFound();
 return <DeliveryRegionContent region={region} />;
}
