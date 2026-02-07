/**
 * DYNAMIC SITEMAP - BPOC.IO
 * Pulls content from Supabase for real-time accuracy
 *
 * Includes:
 * - Static pages (home, about, etc.)
 * - Published insights articles
 * - Active job listings
 * - Silo pillar pages
 */

import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bpoc.io';

  // ============================================
  // STATIC PAGES
  // ============================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/try-resume-builder`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/talent-search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/recruiter/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ============================================
  // DYNAMIC INSIGHTS ARTICLES (from Supabase)
  // ============================================
  let insightPages: MetadataRoute.Sitemap = [];

  try {
    const { data: posts } = await supabase
      .from('insights_posts')
      .select('slug, updated_at, published_at, is_pillar')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (posts && posts.length > 0) {
      insightPages = posts.map((post) => ({
        url: `${baseUrl}/insights/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at),
        changeFrequency: 'monthly' as const,
        priority: post.is_pillar ? 0.9 : 0.8, // Pillar posts get higher priority
      }));
    }
  } catch (error) {
    console.error('Failed to fetch insights posts for sitemap:', error);
  }

  // ============================================
  // SILO PILLAR PAGES (from Supabase)
  // ============================================
  let siloPillarPages: MetadataRoute.Sitemap = [];

  try {
    const { data: silos } = await supabase
      .from('insights_silos')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (silos && silos.length > 0) {
      siloPillarPages = silos.map((silo) => ({
        url: `${baseUrl}/insights/${silo.slug}`,
        lastModified: new Date(silo.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.85, // Silo pages are important hubs
      }));
    }
  } catch (error) {
    console.error('Failed to fetch silo pages for sitemap:', error);
  }

  // ============================================
  // ACTIVE JOB LISTINGS (from Supabase)
  // ============================================
  let jobPages: MetadataRoute.Sitemap = [];

  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to 1000 most recent jobs

    if (jobs && jobs.length > 0) {
      jobPages = jobs.map((job) => ({
        url: `${baseUrl}/jobs/${job.id}`,
        lastModified: new Date(job.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch jobs for sitemap:', error);
  }

  // ============================================
  // COMBINE ALL PAGES
  // ============================================
  return [
    ...staticPages,
    ...siloPillarPages,
    ...insightPages,
    ...jobPages,
  ];
}
















