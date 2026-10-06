import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import ActivityTracker from '@/components/ActivityTracker';

export const metadata: Metadata = {
  title: 'Bren-nholz — Granulés, bois de chauffage & briquettes',
  description: 'Découvrez nos granulés de bois, bûches, briquettes et produits d’allumage. Catalogue et demande de devis.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><CartProvider><ActivityTracker /><Navbar />{children}<Footer /></CartProvider></body></html>;
}
