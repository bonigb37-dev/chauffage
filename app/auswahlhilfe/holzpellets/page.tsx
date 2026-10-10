import { permanentRedirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { localizedPath, type Locale } from '@/i18n/routing';


export default async function AuswahlhilfeHolzpelletsPage() {
  permanentRedirect(localizedPath('/guide-pellets', await getLocale() as Locale));
}
