/**
 * AI CONTENT PIPELINE - List Drafts
 * Returns unfinished drafts that can be resumed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log('📋 Fetching resumable drafts...');

    // Get all unpublished drafts with pipeline stages
    const { data: drafts, error } = await supabase
      .from('insights_posts')
      .select(`
        id,
        slug,
        title,
        category,
        pipeline_stage,
        content,
        serper_research,
        generation_metadata,
        created_at,
        updated_at
      `)
      .eq('is_published', false)
      .in('pipeline_stage', ['idea', 'research', 'plan_review', 'writing', 'humanizing', 'seo', 'meta', 'ready'])
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`✅ Found ${drafts?.length || 0} resumable drafts`);

    return NextResponse.json({
      success: true,
      drafts: drafts || [],
    });

  } catch (error: any) {
    console.error('❌ List drafts error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to list drafts' 
    }, { status: 500 });
  }
}


