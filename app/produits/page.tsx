import ProductsPageContent from '@/components/ProductsPageContent';
import { publicMetadata } from '@/lib/seo';

export const metadata = publicMetadata('Bois de chauffage, granulés et briquettes | Bren-nholz', 'Comparez les bûches, granulés de bois, briquettes et allume-feux par format et conditionnement. Livraison incluse en Allemagne.', '/produits');

export default function ProductsPage() { return <ProductsPageContent />; }
