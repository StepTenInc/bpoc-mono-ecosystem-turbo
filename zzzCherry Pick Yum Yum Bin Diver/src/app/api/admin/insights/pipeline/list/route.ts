/**
 * CMS - List Articles
 * 
 * Query articles with filtering, sorting, pagination
 * Supports multiple views:
 * - All articles
 * - Published only
 * - Drafts only
 * - By status (draft, review, published, archived)
 * - By category/silo
 * - Search by title/content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status'); // 'draft' | 'review' | 'published' | 'archived'
    const category = searchParams.get('category');
    const silo = searchParams.get('silo');
    const search = searchParams.get('search');
    const isPublished = searchParams.get('isPublished'); // 'true' | 'false'

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    console.log('📋 Listing articles:', {
      page,
      limit,
      status,
      category,
      search: search?.substring(0, 30),
    });

    // Build query
    let query = supabase
      .from('insights_posts')
      .select(`
        id,
        title,
        slug,
        description,
        category,
        silo_topic,
        author,
        hero_type,
        hero_url,
        is_published,
        pipeline_stage,
        published_at,
        created_at,
        updated_at,
        read_time_minutes,
        generation_metadata,
        pipeline_id
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('pipeline_stage', status);
    }

    if (isPublished !== null) {
      query = query.eq('is_published', isPublished === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (silo) {
      query = query.eq('silo_topic', silo);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    // Calculate stats
    const totalPages = Math.ceil((count || 0) / limit);

    // Enrich articles with additional data
    const enrichedArticles = articles?.map(article => ({
      ...article,
      url: `/insights/${article.slug}`,
      editUrl: `/admin/insights/edit/${article.id}`,
      qualityScore: article.generation_metadata?.qualityScore || null,
      rankMathScore: article.generation_metadata?.rankMathScore || null,
      internalLinks: article.generation_metadata?.internalLinksCount || 0,
      outboundLinks: article.generation_metadata?.outboundLinksCount || 0,
    }));

    console.log(`✅ Found ${count} articles (page ${page}/${totalPages})`);

    return NextResponse.json({
      success: true,
      articles: enrichedArticles,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('❌ List articles error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
