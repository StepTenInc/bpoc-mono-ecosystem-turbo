/**
 * AI CONTENT PIPELINE - Get Single Draft
 * Returns a draft by ID for resuming
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    console.log('📂 Fetching draft:', id);

    const { data: draft, error } = await supabase
      .from('insights_posts')
      .select(`
        id,
        slug,
        title,
        category,
        content,
        content_part1,
        content_part2,
        content_part3,
        pipeline_stage,
        serper_research,
        generation_metadata,
        humanization_score,
        hero_type,
        hero_url,
        video_url,
        content_image0,
        content_image1,
        content_image2,
        meta_description,
        silo_topic,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    console.log('✅ Draft loaded:', draft.title);

    return NextResponse.json({
      success: true,
      draft,
    });

  } catch (error: any) {
    console.error('❌ Get draft error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get draft' 
    }, { status: 500 });
  }
}


