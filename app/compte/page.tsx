import type { Metadata } from 'next';
import AccountPageContent from '@/components/AccountPageContent';

export const metadata: Metadata = {
  title: 'Mon compte — Bren-nholz',
  description: 'Créez votre compte client Bren-nholz ou connectez-vous.',
};

export default function AccountPage() {
  return <AccountPageContent />;
}
