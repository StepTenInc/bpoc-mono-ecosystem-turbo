import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/silos
 * Public endpoint to list active silos with article counts
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCount = searchParams.get('includeCount') !== 'false'; // Default true

    const { data: silos, error } = await supabase
      .from('insights_silos')
      .select('id, name, slug, description, icon, color, hero_image, seo_title, seo_description')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching silos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get article counts for each silo
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
    console.error('Error in GET /api/silos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
