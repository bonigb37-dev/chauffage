import type { Metadata } from 'next';
import LegalNotice from '@/components/LegalNotice';

export const metadata: Metadata = {
  title: 'Avis juridique — Bren-nholz',
};

export default function LegalNoticePage() {
  return <main><LegalNotice /></main>;
}
