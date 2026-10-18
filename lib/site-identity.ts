import { storeConfig } from '@/lib/store-config';

// Domain identity shared by the home page and search metadata.
export function siteIdentity() {
  const root = `${storeConfig.siteUrl}/`;
  const organization = `${root}#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: storeConfig.name,
        url: root,
        email: storeConfig.email,
        telephone: storeConfig.phone,
      },
      {
        '@type': 'WebSite',
        '@id': `${root}#website`,
        name: storeConfig.name,
        url: root,
        inLanguage: 'de-DE',
        publisher: { '@id': organization },
      },
    ],
  };
}
