import { deliverySummary, deliveryAccess } from '@/lib/store-config';

export default function DeliveryInformation() {
  return <div className="mt-4 space-y-2 text-sm leading-6 text-gray-600"><p>{deliverySummary}</p><p>{deliveryAccess}</p></div>;
}
