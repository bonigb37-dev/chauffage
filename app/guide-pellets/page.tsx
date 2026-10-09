import { publicMetadata } from '@/lib/seo';

export const metadata = publicMetadata("Choisir et stocker ses granulés de bois | Bren-nholz", "Comprenez les certifications indiquées sur les granulés, comparez les sacs et palettes et obtenez une estimation indicative de vos besoins.", "/guide-pellets");

import PelletGuide from '@/components/PelletGuide';

export default function GuidePelletsPage() {
  return (
    <main>
      <PelletGuide />
    </main>
  );
}
