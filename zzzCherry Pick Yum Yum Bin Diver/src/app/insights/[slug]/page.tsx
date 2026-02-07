import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InsightArticleClient from './InsightArticleClient';
import GenericSiloClient from './GenericSiloClient';
import { createClient } from '@supabase/supabase-js';
import { SchemaMarkup } from '@/components/insights/SchemaMarkup';
import { generateAllSchemas } from '@/lib/schema-generator';
import { ATE_YNA_AUTHOR, BPOC_PUBLISHER } from '@/lib/schema-constants';

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if a slug is a silo (for dynamic silo pages without hardcoded routes)
async function getSiloBySlug(slug: string) {
  const { data: silo } = await supabase
    .from('insights_silos')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (!silo) return null;

  let pillarPost = null;
  if (silo.pillar_post_id) {
    const { data: pillar } = await supabase
      .from('insights_posts')
      .select('*')
      .eq('id', silo.pillar_post_id)
      .eq('is_published', true)
      .single();
    pillarPost = pillar;
  }

  const { data: articles, count } = await supabase
    .from('insights_posts')
    .select('*', { count: 'exact' })
    .eq('silo_id', silo.id)
    .eq('is_published', true)
    .or('is_pillar.is.null,is_pillar.eq.false')
    .order('published_at', { ascending: false })
    .limit(12);

  const { data: relatedSilos } = await supabase
    .from('insights_silos')
    .select('id, name, slug, description, icon, color')
    .eq('is_active', true)
    .neq('id', silo.id)
    .order('sort_order')
    .limit(4);

  return {
    silo,
    pillarPost,
    articles: articles || [],
    pagination: {
      page: 1, limit: 12, total: count || 0,
      totalPages: Math.ceil((count || 0) / 12),
      hasMore: (count || 0) > 12,
    },
    relatedSilos: relatedSilos || [],
  };
}

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0; // No cache - always fetch fresh data

// Generate static params for all articles (for SSG/ISR)
export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('insights_posts')
    .select('slug')
    .eq('is_published', true);
    
  return (posts || []).map((post) => ({
    slug: post.slug,
  }));
}

// Generate dynamic metadata for each article or silo
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Check if silo first
  const { data: silo } = await supabase
    .from('insights_silos')
    .select('name, slug, description, seo_title, seo_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (silo) {
    return {
      title: silo.seo_title || `${silo.name} | BPO Career Insights | BPOC.IO`,
      description: silo.seo_description || silo.description,
      openGraph: {
        title: silo.seo_title || `${silo.name} | BPOC.IO`,
        description: silo.seo_description || silo.description,
        url: `https://www.bpoc.io/insights/${silo.slug}`,
        type: 'website',
      },
      alternates: { canonical: `https://www.bpoc.io/insights/${silo.slug}` },
    };
  }

  const { data: post } = await supabase
    .from('insights_posts')
    .select('*, seo:seo_metadata(*)')
    .eq('slug', slug)
    .single();
  
  if (!post) {
    return {
      title: 'Article Not Found | BPOC.IO',
    };
  }

  return {
    title: post.seo?.meta_title || `${post.title} | BPOC.IO Insights`,
    description: post.seo?.meta_description || post.description,
    keywords: post.seo?.keywords?.join(', ') || `${post.category}, BPO, ${post.title}, Philippines outsourcing, remote work`,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.seo?.meta_title || post.title,
      description: post.seo?.meta_description || post.description,
      url: `https://www.bpoc.io/insights/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      authors: [post.author],
      images: [
        {
          url: post.hero_url || post.seo?.og_image || '/images/og-insights.jpg',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.meta_title || post.title,
      description: post.seo?.meta_description || post.description,
      images: [post.hero_url || post.seo?.og_image || '/images/og-insights.jpg'],
    },
    alternates: {
      canonical: post.seo?.canonical_url || `https://www.bpoc.io/insights/${post.slug}`,
    },
  };
}

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params;
  
  // Check if this slug is a silo page first (for dynamic silos without hardcoded routes)
  const siloData = await getSiloBySlug(slug);
  if (siloData) {
    return <GenericSiloClient {...siloData} />;
  }

  const { data: post } = await supabase
    .from('insights_posts')
    .select('*, seo:seo_metadata(*)')
    .eq('slug', slug)
    .single();

  if (!post) {
    notFound();
  }

  // Fetch related posts (simple logic: same category)
  const { data: relatedPosts } = await supabase
    .from('insights_posts')
    .select('title, slug, read_time')
    .eq('category', post.category)
    .neq('id', post.id)
    .eq('is_published', true)
    .limit(3);

  // Fetch explicit internal links (Link Manager)
  const { data: internalLinks } = await supabase
    .from('internal_links')
    .select('anchor_text, target_post:insights_posts!internal_links_target_post_id_fkey(slug, title)')
    .eq('source_post_id', post.id);

  // ============================================
  // JSON-LD SCHEMA MARKUP FOR RICH SNIPPETS
  // Uses pipeline Stage 7 stored schemas when available,
  // otherwise generates on-the-fly from article data
  // ============================================

  const storedSchema = post.seo?.schema_data || {};

  // Prefer stored schema from pipeline Stage 7; fallback to generated
  let schemas: {
    article: Record<string, any> | null;
    breadcrumbs: Record<string, any> | null;
    faq: Record<string, any> | null;
    howTo: Record<string, any> | null;
  };

  if (storedSchema.article || storedSchema.breadcrumbs) {
    // Use stored schemas from seo_metadata (populated at publish time)
    schemas = {
      article: storedSchema.article || null,
      breadcrumbs: storedSchema.breadcrumbs || storedSchema.breadcrumb || null,
      faq: storedSchema.faq || null,
      howTo: storedSchema.howTo || null,
    };
  } else {
    // Generate on-the-fly for older articles without stored schema
    const generated = generateAllSchemas({
      title: post.title,
      metaTitle: post.seo?.meta_title || post.title,
      metaDescription: post.seo?.meta_description || post.description || '',
      canonicalSlug: post.slug,
      focusKeyword: post.seo?.keywords?.[0] || post.category || '',
      semanticKeywords: post.seo?.keywords?.slice(1) || [],
      heroImageUrl: post.hero_url || undefined,
      publishDate: post.published_at || post.created_at,
      modifiedDate: post.updated_at,
      silo: post.silo_topic || post.category || undefined,
      isSiloPage: post.content_type === 'pillar',
      articleContent: post.content || '',
    });
    schemas = generated;
  }

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <InsightArticleClient post={post} relatedPosts={relatedPosts || []} internalLinks={internalLinks || []} />
    </>
  );
}
