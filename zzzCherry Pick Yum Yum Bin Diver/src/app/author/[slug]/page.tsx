import { Metadata } from 'next';
import AuthorProfileClient from './AuthorProfileClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (slug === 'ate-yna') {
    return {
      title: 'Ate Yna | BPOC Career Coach',
      description:
        'Meet Ate Yna, your supportive BPO career guide. Honest advice, resume tips, and industry secrets from someone who\'s been there.',
      openGraph: {
        title: 'Ate Yna | BPOC Career Coach',
        description: 'Your supportive "ate" in the BPO industry — real talk advice for Filipino professionals.',
        url: 'https://www.bpoc.io/author/ate-yna',
        type: 'profile',
      },
      alternates: { canonical: 'https://www.bpoc.io/author/ate-yna' },
    };
  }

  return { title: 'Author Profile | BPOC' };
}

export default async function AuthorProfilePage({ params }: Props) {
  const { slug } = await params;

  // Fetch all published articles (Ate Yna is sole author), most recent first
  const { data: articles } = await supabase
    .from('insights_posts')
    .select('id, title, slug, description, hero_url, category, content_type, created_at, published_at, silo_id')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  // Fetch silos for category mapping
  const { data: silos } = await supabase
    .from('insights_silos')
    .select('id, name, slug');

  // Build silo lookup
  const siloMap: Record<string, { name: string; slug: string }> = {};
  (silos || []).forEach((s: any) => {
    siloMap[s.id] = { name: s.name, slug: s.slug };
  });

  // Attach silo info to each article
  const articlesWithSilo = (articles || []).map((a: any) => ({
    ...a,
    siloName: siloMap[a.silo_id]?.name || a.category || 'Insights',
    siloSlug: siloMap[a.silo_id]?.slug || '',
  }));

  return <AuthorProfileClient slug={slug} articles={articlesWithSilo} />;
}
