import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { translate } from '@/i18n/copy';
import { locales, localizedPath, type Locale } from '@/i18n/routing';

export const siteUrl = 'https://www.brennholz-direk.de';

export async function publicMetadata(title: string, description: string, path: string): Promise<Metadata> {
  return localizeMetadata({ title, description }, path);
}

export async function localizeMetadata(metadata: Metadata, path?: string): Promise<Metadata> {
  const locale = await getLocale() as Locale;
  const route = path ?? (await headers()).get('x-bren-pathname') ?? '/';
  const localizedTitle = typeof metadata.title === 'string' ? translate(metadata.title, locale) : metadata.title;
  return { ...metadata, title: localizedTitle, description: metadata.description ? translate(metadata.description, locale) : metadata.description,
    alternates: { ...metadata.alternates, canonical: `${siteUrl}${localizedPath(route, locale)}`,
      languages: { ...Object.fromEntries(locales.map(language => [language, `${siteUrl}${localizedPath(route, language)}`])), 'x-default': `${siteUrl}${localizedPath(route, 'de')}` } },
  };
}
