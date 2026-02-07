import { Metadata } from 'next';
import NewAdminLayout from '@/components/admin/NewAdminLayout';

export const metadata: Metadata = {
  title: 'Admin | BPOC.IO',
  description: 'BPOC.IO Admin Dashboard',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NewAdminLayout>{children}</NewAdminLayout>;
}

