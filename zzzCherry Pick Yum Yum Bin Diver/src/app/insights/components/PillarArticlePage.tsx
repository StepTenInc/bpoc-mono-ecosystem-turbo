import { notFound } from 'next/navigation';
import SiloArticleClient from './SiloArticleClient';
import { createClient } from '@supabase/supabase-js';
import { SchemaMarkup } from '@/components/insights/SchemaMarkup';
import { generateAllSchemas } from '@/lib/schema-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Silo color mapping
const SILO_COLORS: Record<string, string> = {
  'bpo-salary-compensation': '#EAB308',      // Yellow/Gold
  'bpo-career-growth': '#10B981',      // Emerald
  'bpo-jobs': '#3B82F6',        // Blue
  'interview-tips': '#F97316',   // Orange
  'bpo-employment-guide': '#64748B', // Slate
  'bpo-company-reviews': '#8B5CF6',   // Violet
  'training-and-certifications': '#06B6D4',    // Cyan
  'work-life-balance': '#F43F5E',    // Rose
};

interface PillarArticlePageProps {
  siloSlug: string;
  articleSlug: string;
}

export async function getSiloArticle(siloSlug: string, articleSlug: string) {
  // First, get the silo by slug to get its ID
  const { data: silo } = await supabase
    .from('insights_silos')
    .select('id, slug, name')
    .eq('slug', siloSlug)
    .single();

  if (!silo) {
    console.log(`[getSiloArticle] Silo not found for slug: ${siloSlug}`);
    return null;
  }

  // Fetch the article and verify it belongs to this silo (include SEO metadata for schema)
  const { data: post, error } = await supabase
    .from('insights_posts')
    .select('*, seo:seo_metadata(*)')
    .eq('slug', articleSlug)
    .eq('silo_id', silo.id)
    .eq('is_published', true)
    .single();

  if (error || !post) {
    console.log(`[getSiloArticle] Article not found: ${articleSlug}, silo_id: ${silo.id}, error:`, error?.message);
    return null;
  }

  // Attach silo info to post for use in component
  post.silo = silo;

  return post;
}

export async function getSiloMetadata(siloSlug: string, articleSlug: string) {
  // First, get the silo by slug
  const { data: silo } = await supabase
    .from('insights_silos')
    .select('id, slug, name')
    .eq('slug', siloSlug)
    .single();

  if (!silo) {
    return null;
  }

  // Fetch the article with SEO data
  const { data: post } = await supabase
    .from('insights_posts')
    .select('*, seo:seo_metadata(*)')
    .eq('slug', articleSlug)
    .eq('silo_id', silo.id)
    .eq('is_published', true)
    .single();

  if (!post) {
    return null;
  }

  post.silo = silo;

  return {
    post,
    canonicalUrl: `https://www.bpoc.io/insights/${siloSlug}/${articleSlug}`,
  };
}

export default async function PillarArticlePage({ siloSlug, articleSlug }: PillarArticlePageProps) {
  const post = await getSiloArticle(siloSlug, articleSlug);

  if (!post) {
    notFound();
  }

  // Fetch related articles from the same silo
  const { data: relatedPosts } = await supabase
    .from('insights_posts')
    .select('id, title, slug, description, hero_url, category, created_at')
    .eq('silo_id', post.silo_id)
    .eq('is_published', true)
    .neq('id', post.id)
    .limit(4);

  // ============================================
  // SCHEMA MARKUP — uses stored schema or generates on-the-fly
  // ============================================
  const storedSchema = post.seo?.schema_data || {};

  let schemas: {
    article: Record<string, any> | null;
    breadcrumbs: Record<string, any> | null;
    faq: Record<string, any> | null;
    howTo: Record<string, any> | null;
  };

  if (storedSchema.article || storedSchema.breadcrumbs) {
    schemas = {
      article: storedSchema.article || null,
      breadcrumbs: storedSchema.breadcrumbs || storedSchema.breadcrumb || null,
      faq: storedSchema.faq || null,
      howTo: storedSchema.howTo || null,
    };
  } else {
    // Reverse-map siloSlug to silo key for schema generation
    const siloKey = Object.entries(SILO_COLORS).find(
      ([slug]) => slug === siloSlug
    )?.[0];

    // Find the silo id (key in SILO_MAP) from the slug
    const { SILO_MAP } = await import('@/lib/schema-constants');
    const siloId = Object.entries(SILO_MAP).find(
      ([, info]) => info.slug === siloSlug
    )?.[0];

    schemas = generateAllSchemas({
      title: post.title,
      metaTitle: post.seo?.meta_title || post.title,
      metaDescription: post.seo?.meta_description || post.description || '',
      canonicalSlug: `${siloSlug}/${post.slug}`,
      focusKeyword: post.seo?.keywords?.[0] || post.category || '',
      semanticKeywords: post.seo?.keywords?.slice(1) || [],
      heroImageUrl: post.hero_url || undefined,
      publishDate: post.published_at || post.created_at,
      modifiedDate: post.updated_at,
      silo: siloId || undefined,
      isSiloPage: post.content_type === 'pillar',
      articleContent: post.content || '',
    });
  }

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <SiloArticleClient
        post={post}
        relatedPosts={relatedPosts || []}
        siloSlug={siloSlug}
        siloName={post.silo?.name || siloSlug}
        siloColor={SILO_COLORS[siloSlug] || '#06B6D4'}
      />
    </>
  );
}
