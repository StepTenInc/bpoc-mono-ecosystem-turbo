import { Metadata } from 'next';
import InsightsPageClient from './InsightsPageClient';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for fetching content
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Always show fresh content (no cache) so newly published posts appear immediately
export const revalidate = 0;

async function getInsights() {
  const { data, error } = await supabase
    .from('insights_posts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching insights:', error);
    return [];
  }

  return data || [];
}

async function getSilos() {
  const { data } = await supabase
    .from('insights_silos')
    .select('id, name, slug, description, icon, color')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data || [];
}

export const metadata: Metadata = {
  title: 'BPO Industry Insights & Trends | BPOC.IO Intelligence',
  description: 'Data-driven analysis, salary guides, and expert perspectives on the future of BPO work. Stay ahead with insights on AI, remote culture, and global outsourcing trends.',
  keywords: 'BPO insights, BPO salary guide 2025, remote work trends, outsourcing industry, virtual assistant trends, AI in BPO, Philippines outsourcing',
  openGraph: {
    title: 'BPO Industry Insights & Trends | BPOC.IO',
    description: 'Expert analysis on BPO salaries, AI impact, and the future of remote work in the Philippines.',
    url: 'https://bpoc-stepten.vercel.app/insights',
    type: 'website',
    images: [
      {
        url: '/images/og-insights.jpg',
        width: 1200,
        height: 630,
        alt: 'BPOC.IO Industry Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BPO Industry Insights | BPOC.IO',
    description: 'Expert analysis on BPO salaries, AI impact, and future of work.',
  },
  alternates: {
    canonical: 'https://bpoc-stepten.vercel.app/insights',
  },
};

export default async function InsightsPage() {
  const [posts, silos] = await Promise.all([getInsights(), getSilos()]);

  // JSON-LD Schema for the insights listing page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'BPOC.IO Industry Insights',
    description: 'Data-driven analysis and expert perspectives on the BPO industry',
    url: 'https://bpoc-stepten.vercel.app/insights',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: `https://bpoc-stepten.vercel.app/insights/${post.slug}`,
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'BPOC.IO',
      url: 'https://bpoc-stepten.vercel.app',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InsightsPageClient initialPosts={posts} silos={silos} />
    </>
  );
}
