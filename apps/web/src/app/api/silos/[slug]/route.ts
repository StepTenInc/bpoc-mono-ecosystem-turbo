import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/silos/[slug]
 * Public endpoint to get a silo with its published articles
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // Get the silo with pillar post
    const { data: silo, error: siloError } = await supabase
      .from('insights_silos')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (siloError || !silo) {
      return NextResponse.json({ error: 'Silo not found' }, { status: 404 });
    }

    // Fetch pillar post if exists
    let pillarPost = null;
    if (silo.pillar_post_id) {
      const { data: pillar } = await supabase
        .from('insights_posts')
        .select(`
          id,
          slug,
          title,
          description,
          content,
          content_part1,
          content_part2,
          content_part3,
          hero_url,
          video_url,
          hero_type,
          read_time,
          published_at,
          content_image0,
          content_image1,
          content_image2,
          author,
          author_slug
        `)
        .eq('id', silo.pillar_post_id)
        .eq('is_published', true)
        .single();

      pillarPost = pillar;
    }

    // Get published articles in this silo with pagination (exclude pillar post)
    let articlesQuery = supabase
      .from('insights_posts')
      .select(`
        id,
        slug,
        title,
        description,
        hero_url,
        video_url,
        hero_type,
        read_time,
        published_at,
        created_at,
        view_count,
        content_image0,
        is_pillar,
        seo:seo_metadata(meta_title, meta_description, keywords)
      `, { count: 'exact' })
      .eq('silo_id', silo.id)
      .eq('is_published', true)
      .or('is_pillar.is.null,is_pillar.eq.false') // Exclude pillar posts from listing
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: articles, error: articlesError, count } = await articlesQuery;

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return NextResponse.json({ error: articlesError.message }, { status: 500 });
    }

    // Get related silos (other active silos)
    const { data: relatedSilos } = await supabase
      .from('insights_silos')
      .select('id, name, slug, description, icon, color')
      .eq('is_active', true)
      .neq('id', silo.id)
      .order('sort_order', { ascending: true })
      .limit(4);

    return NextResponse.json({
      silo,
      pillarPost,
      articles: articles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      },
      relatedSilos: relatedSilos || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/silos/[slug]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
