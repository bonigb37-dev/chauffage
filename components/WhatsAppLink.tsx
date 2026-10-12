'use client';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { whatsappUrl } from '@/lib/store-config';
import type { Locale } from '@/i18n/routing';

export default function WhatsAppLink({ className = '' }: { className?: string }) {
  const locale = useLocale() as Locale;
  const label = { de: 'Kontakt über WhatsApp', fr: 'Nous contacter sur WhatsApp', en: 'Contact us on WhatsApp' }[locale];
  return <a data-original-content href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-gray-950 shadow-sm transition hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 ${className}`}>
    <Image src="/whatsapp.svg" width={28} height={28} alt="" aria-hidden="true" />
  </a>;
}
