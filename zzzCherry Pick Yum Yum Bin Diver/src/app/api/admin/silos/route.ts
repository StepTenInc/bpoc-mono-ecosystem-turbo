import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface InsightSilo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  context: string | null;
  voice: string | null;
  subreddits: string | null;
  platforms: string | null;
  icon: string | null;
  color: string | null;
  hero_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  article_count?: number;
}

/**
 * GET /api/admin/silos
 * List all silos with optional article counts
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCount = searchParams.get('includeCount') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = supabase
      .from('insights_silos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: silos, error } = await query;

    if (error) {
      console.error('Error fetching silos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If includeCount, get article counts for each silo
    if (includeCount && silos) {
      const silosWithCounts = await Promise.all(
        silos.map(async (silo) => {
          const { count } = await supabase
            .from('insights_posts')
            .select('*', { count: 'exact', head: true })
            .eq('silo_id', silo.id)
            .eq('is_published', true);

          return {
            ...silo,
            article_count: count || 0,
          };
        })
      );

      return NextResponse.json({ silos: silosWithCounts });
    }

    return NextResponse.json({ silos });
  } catch (error: any) {
    console.error('Error in GET /api/admin/silos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/silos
 * Create a new silo
 */
export async function POST(req: NextRequest) {
  try {
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
      is_active = true,
      sort_order = 0,
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim();

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('insights_silos')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A silo with this slug already exists' },
        { status: 400 }
      );
    }

    const { data: silo, error } = await supabase
      .from('insights_silos')
      .insert({
        name,
        slug: finalSlug,
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
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating silo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ silo }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/silos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
