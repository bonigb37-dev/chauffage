import { publicMetadata } from '@/lib/seo';

export const metadata = publicMetadata("Bois de chauffage et granulés en Allemagne | Bren-nholz", "Découvrez nos bûches, granulés de bois, briquettes et allume-feux. Comparez les conditionnements et commandez avec livraison incluse en Allemagne.", "/");

import Hero from '@/components/Hero'; import ProductCategories from '@/components/ProductCategories'; import Products from '@/components/Products'; import Services from '@/components/Services'; import ContactCTA from '@/components/ContactCTA'; import LogisticsGallery from '@/components/LogisticsGallery';
export default function Home(){return <><main><Hero/><ProductCategories/><Products/><Services/><ContactCTA/><LogisticsGallery/></main></>}
