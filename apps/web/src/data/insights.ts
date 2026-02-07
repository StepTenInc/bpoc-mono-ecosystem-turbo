// Static insights data for author pages
// This is a fallback when data can't be fetched from Supabase

export interface InsightData {
  slug: string;
  authorSlug: string;
  category: string;
  color: string;
  date: string;
  title: string;
  description: string;
}

export const insightsData: InsightData[] = [
  {
    slug: 'bpo-interview-preparation-guide',
    authorSlug: 'ate-yna',
    category: 'Interview Tips',
    color: 'text-purple-400',
    date: 'Jan 2025',
    title: 'How to Ace Your BPO Interview: A Complete Guide',
    description: 'From "Tell me about yourself" to salary negotiations - everything you need to know to land that call center job.',
  },
  {
    slug: 'surviving-graveyard-shift',
    authorSlug: 'ate-yna',
    category: 'Work-Life Balance',
    color: 'text-cyan-400',
    date: 'Jan 2025',
    title: 'Surviving the Graveyard Shift: Real Talk from Someone Who\'s Been There',
    description: 'Tips for staying healthy, maintaining relationships, and not losing your mind when the world sleeps and you work.',
  },
  {
    slug: 'first-job-bpo-expectations',
    authorSlug: 'ate-yna',
    category: 'Career Growth',
    color: 'text-green-400',
    date: 'Dec 2024',
    title: 'Your First BPO Job: What to Expect in the First 90 Days',
    description: 'Training, nesting, going live - here\'s what really happens when you start your BPO career.',
  },
  {
    slug: 'resume-tips-fresh-graduates',
    authorSlug: 'ate-yna',
    category: 'Job Search',
    color: 'text-orange-400',
    date: 'Dec 2024',
    title: 'Resume Tips for Fresh Graduates Entering BPO',
    description: 'No experience? No problem! Here\'s how to create a resume that gets you noticed.',
  },
];
