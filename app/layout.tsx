import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import TopTrustBanner from '@/components/TopTrustBanner';
import AllReviewsModal from '@/components/AllReviewsModal';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import ActivityTracker from '@/components/ActivityTracker';
import RoleAccessGuard from '@/components/RoleAccessGuard';
import { ActionLoadingProvider } from '@/components/ActionLoadingProvider';
import { getServerCatalog } from '@/lib/server-catalog';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Bren-nholz — Granulés, bois de chauffage & briquettes',
  description: 'Découvrez nos granulés de bois, bûches, briquettes et produits d’allumage. Catalogue et demande de devis.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialCatalog = await getServerCatalog();
  return (
    <html lang="fr">
      <body>
        <CartProvider initialCatalog={initialCatalog}>
          <ActionLoadingProvider>
            <ActivityTracker />
            <RoleAccessGuard>
              <TopTrustBanner />
              <Navbar />
              {children}
              <Footer />
              <AllReviewsModal />
            </RoleAccessGuard>
          </ActionLoadingProvider>
        </CartProvider>
      </body>
    </html>
  );
}
