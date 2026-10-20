import { localizeMetadata } from '@/lib/seo';
﻿import type { Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import TopTrustBanner from '@/components/TopTrustBanner';
import Footer from '@/components/Footer';
import SupportHelpButton from '@/components/SupportHelpButton';
import { CartProvider } from '@/components/CartProvider';
import ActivityTracker from '@/components/ActivityTracker';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import RoleAccessGuard from '@/components/RoleAccessGuard';
import { ActionLoadingProvider } from '@/components/ActionLoadingProvider';
import { getServerCatalog } from '@/lib/server-catalog';
import { siteUrl } from '@/lib/seo';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() { return localizeMetadata(await ({
  metadataBase: new URL(siteUrl),
  title: 'Bren-nholz — Granulés, bois de chauffage & briquettes',
  description: 'Découvrez nos granulés de bois, bûches, briquettes et produits d’allumage. Catalogue et commande en ligne.',
  verification: {
    google: [
      'AOOe-3GSFcjvn7EgiJj3x8XyiXxvu_atMDM0jEqLeKI',
      ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? [process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION] : ['XOWkbHJv9AIriAc_YaLhmCIDkm2JvAm7qDk36RCUSPY']),
    ],
  },
})); }

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const pathname = (await headers()).get('x-bren-pathname') ?? '';
  const privateEntry = /^\/(admin|super-admin)(\/|$)/.test(pathname) || pathname === '/compte';
  const initialCatalog = privateEntry ? undefined : await getServerCatalog();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
        <CartProvider initialCatalog={initialCatalog}>
          <ActionLoadingProvider>
            <ActivityTracker />
            <RoleAccessGuard>
              <AnalyticsTracker />
              <TopTrustBanner />
              <Navbar />
              {children}
              <Footer />
              <SupportHelpButton />
            </RoleAccessGuard>
          </ActionLoadingProvider>
        </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
