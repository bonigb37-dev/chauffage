import type { Metadata } from 'next';
import AdminWorkspace from '@/components/AdminWorkspace';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SuperAdminPage() {
  return <AdminWorkspace superAdminOnly />;
}
