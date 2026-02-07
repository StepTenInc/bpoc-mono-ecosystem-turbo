import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import WorklifeSiloClient from './WorklifeSiloClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Work-Life Balance | BPO Lifestyle & Wellness | BPOC.IO',
    description: 'Maintain work-life balance in the BPO industry. Tips for wellness, mental health, and thriving in shift work.',
    openGraph: {
      title: 'Work-Life Balance | BPOC.IO',
      description: 'Work-life balance tips and wellness guides for BPO professionals.',
      url: 'https://www.bpoc.io/insights/work-life-balance',
      type: 'website',
    },
    alternates: { canonical: 'https://www.bpoc.io/insights/work-life-balance' },
  };
}

async function getSiloData() {
  const { data: silo } = await supabase.from('insights_silos').select('*').eq('slug', 'work-life-balance').eq('is_active', true).single();
  if (!silo) return null;

  let pillarPost = null;
  if (silo.pillar_post_id) {
    const { data: pillar } = await supabase.from('insights_posts').select('*').eq('id', silo.pillar_post_id).eq('is_published', true).single();
    pillarPost = pillar;
  }

  const { data: articles, count } = await supabase.from('insights_posts').select('*', { count: 'exact' }).eq('silo_id', silo.id).eq('is_published', true).or('is_pillar.is.null,is_pillar.eq.false').order('published_at', { ascending: false }).limit(12);
  const { data: relatedSilos } = await supabase.from('insights_silos').select('id, name, slug, description, icon, color').eq('is_active', true).neq('id', silo.id).order('sort_order').limit(4);

  return { silo, pillarPost, articles: articles || [], pagination: { page: 1, limit: 12, total: count || 0, totalPages: Math.ceil((count || 0) / 12), hasMore: (count || 0) > 12 }, relatedSilos: relatedSilos || [] };
}

export default async function WorklifePage() {
  const data = await getSiloData();
  if (!data) return <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center"><p className="text-gray-400">Silo not found</p></div>;
  return <WorklifeSiloClient {...data} />;
}
