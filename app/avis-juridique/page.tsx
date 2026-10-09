import { publicMetadata } from '@/lib/seo';

export const metadata = publicMetadata("Avis juridique — Bren-nholz", "Identité de Leylines, exploitant de Bren-nholz : siège social, représentants, entrepôt en Allemagne, numéro KvK, TVA et coordonnées de contact.", "/avis-juridique");

import LegalNotice from '@/components/LegalNotice';

export default function LegalNoticePage() {
  return <main><LegalNotice /></main>;
}
