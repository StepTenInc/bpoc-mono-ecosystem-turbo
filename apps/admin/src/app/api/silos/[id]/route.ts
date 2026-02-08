import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/silos/[id]
 * Get a single silo by ID or slug
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeArticles = searchParams.get('includeArticles') === 'true';

    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('insights_silos').select('*');

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: silo, error } = await query.single();

    if (error || !silo) {
      return NextResponse.json({ error: 'Silo not found' }, { status: 404 });
    }

    // Optionally include articles
    if (includeArticles) {
      const { data: articles, count } = await supabase
        .from('insights_posts')
        .select('id, slug, title, description, hero_url, video_url, hero_type, is_published, created_at, published_at', { count: 'exact' })
        .eq('silo_id', silo.id)
        .order('published_at', { ascending: false, nullsFirst: false });

      return NextResponse.json({
        silo,
        articles: articles || [],
        article_count: count || 0,
      });
    }

    return NextResponse.json({ silo });
  } catch (error: any) {
    console.error('Error in GET /api/admin/silos/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/silos/[id]
 * Update a silo
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      name,
      slug,
      description,
      context,
      voice,
      subreddits,
      platforms,
      icon,
      color,
      hero_image,
      seo_title,
      seo_description,
      seo_keywords,
      is_active,
      sort_order,
    } = body;

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (context !== undefined) updateData.context = context;
    if (voice !== undefined) updateData.voice = voice;
    if (subreddits !== undefined) updateData.subreddits = subreddits;
    if (platforms !== undefined) updateData.platforms = platforms;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (hero_image !== undefined) updateData.hero_image = hero_image;
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Check for slug conflict if slug is being changed
    if (slug) {
      const { data: existing } = await supabase
        .from('insights_silos')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'A silo with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const { data: silo, error } = await supabase
      .from('insights_silos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating silo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!silo) {
      return NextResponse.json({ error: 'Silo not found' }, { status: 404 });
    }

    return NextResponse.json({ silo });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/silos/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/silos/[id]
 * Delete a silo (with safeguards)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // Check if silo has articles
    const { count: articleCount } = await supabase
      .from('insights_posts')
      .select('*', { count: 'exact', head: true })
      .eq('silo_id', id);

    if (articleCount && articleCount > 0 && !force) {
      return NextResponse.json(
        {
          error: 'Cannot delete silo with existing articles',
          article_count: articleCount,
          message: 'Use force=true to delete anyway (will unassign articles from this silo)',
        },
        { status: 400 }
      );
    }

    // If force delete, unassign articles first
    if (force && articleCount && articleCount > 0) {
      await supabase
        .from('insights_posts')
        .update({ silo_id: null })
        .eq('silo_id', id);
    }

    const { error } = await supabase
      .from('insights_silos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting silo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Silo deleted' });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/silos/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
