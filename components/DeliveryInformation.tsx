
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { deliverySummary, deliveryAccess } from '@/lib/store-config';

export default function DeliveryInformation() {
  const brenLocale = useLocale() as Locale;

  return localizeNode(<div className="mt-4 space-y-2 text-sm leading-6 text-gray-600"><p>{deliverySummary}</p><p>{deliveryAccess}</p></div>, brenLocale);
}
