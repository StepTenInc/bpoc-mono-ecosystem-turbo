import { Metadata } from 'next';
import RecruiterLayoutClient from '@/components/recruiter/RecruiterLayoutClient';

export const metadata: Metadata = {
  title: 'Recruiter | BPOC.IO',
  description: 'BPOC.IO Recruiter Dashboard',
};

export default function RecruiterRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RecruiterLayoutClient>{children}</RecruiterLayoutClient>;
}
