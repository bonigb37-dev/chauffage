import type { Metadata } from 'next';
import AccountPageContent from '@/components/AccountPageContent';

export const metadata: Metadata = {
  title: 'Mon compte — ThermoPro',
  description: 'Créez votre compte client ThermoPro ou connectez-vous.',
};

export default function AccountPage() {
  return <AccountPageContent />;
}
