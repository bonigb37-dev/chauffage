import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { deliveryRegions } from '@/lib/delivery-regions';
import { publicMetadata } from '@/lib/seo';
import DeliveryRegionContent from '@/components/DeliveryRegionContent';

type Props = { params: Promise<{ region: string }> };

export async function generateMetadata({ params }: Props) {
  const { region: slug } = await params;
  const region = deliveryRegions.find(r => r.slug === slug);
  if (!region) return {};

  const title = `Brennholz-Lieferung in ${region.name} | Bren-nholz`;
  const description = 'Finden Sie Ihre Stadt oder Lieferadresse. Lieferung inklusive in Deutschland.';

  return publicMetadata(title, description, `/livraison/${region.slug}`);
}

export default async function DeliveryRegionPage({ params }: Props) {
  const { region: slug } = await params;
  const region = deliveryRegions.find(r => r.slug === slug);
  if (!region) notFound();

  return <DeliveryRegionContent region={region} />;
}
