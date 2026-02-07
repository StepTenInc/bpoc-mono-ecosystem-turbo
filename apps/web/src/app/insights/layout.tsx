import { ReactNode } from 'react';

interface InsightsLayoutProps {
  children: ReactNode;
}

export default function InsightsLayout({ children }: InsightsLayoutProps) {
  // Simple pass-through layout - Header is in the client components
  return <>{children}</>;
}
