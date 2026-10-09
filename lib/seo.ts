import type { Metadata } from 'next';

export const siteUrl = 'https://bois-de-chauffage-de.vercel.app';

export function publicMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: `${siteUrl}${path}` } };
}
