import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { isLocale } from './routing';

export default getRequestConfig(async () => {
  const value = (await headers()).get('x-bren-locale');
  return { locale: isLocale(value) ? value : 'de', messages: {}, timeZone: 'Europe/Berlin' };
});
