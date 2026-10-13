import PelletGuide from '@/components/PelletGuide';

export const metadata = {
  title: 'Guide de sélection des granulés de bois — Bren-nholz',
  description: 'Trouvez la quantité de granulés de bois idéale pour votre poêle ou chaudière. Guide pratique et simulateur express pour sacs et palettes certifiés ENplus A1 & DINplus.',
};

export default function GuideGranulesAliasPage() {
  return (
    <main>
      <PelletGuide />
    </main>
  );
}
