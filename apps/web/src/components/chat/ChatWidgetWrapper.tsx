'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import ChatWidget to avoid SSR issues
const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
});

// Pages where we DON'T want the chat widget
const EXCLUDED_PATHS = [
  '/admin',
  '/recruiter',
  '/candidate/dashboard',
  '/candidate/settings',
  '/candidate/applications',
  '/candidate/interviews',
  '/candidate/offers',
];

// Pages where chat is most valuable (for analytics)
const HIGH_VALUE_PAGES: Record<string, string> = {
  '/': 'homepage',
  '/home': 'homepage',
  '/resume-builder': 'resume_builder',
  '/resume-builder/build': 'resume_builder_build',
  '/resume-builder/analysis': 'resume_analysis',
  '/jobs': 'jobs_listing',
  '/about': 'about',
  '/how-it-works': 'how_it_works',
  '/insights': 'insights',
  '/developer/docs': 'api_docs',
};

export default function ChatWidgetWrapper() {
  const pathname = usePathname();

  // Don't show on excluded paths (admin, recruiter dashboards)
  const isExcluded = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));
  if (isExcluded) {
    return null;
  }

  // Determine page context for analytics
  const pageContext = HIGH_VALUE_PAGES[pathname || ''] || pathname || 'unknown';

  return <ChatWidget pageContext={pageContext} />;
}

