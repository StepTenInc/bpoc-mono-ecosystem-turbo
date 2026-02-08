import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import NewAdminLayout from '@/components/admin/NewAdminLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin | BPOC.IO',
  description: 'BPOC.IO Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        <AuthProvider>
          <NewAdminLayout>{children}</NewAdminLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
