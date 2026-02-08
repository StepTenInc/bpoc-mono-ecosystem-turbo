/**
 * LIST PIPELINES
 * Get all draft/in-progress pipelines for the dashboard
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
    const status = searchParams.get('status'); // draft, in_progress, completed, published, all
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log(`📋 Listing pipelines (status: ${status || 'all'})`);

    let query = supabase
      .from('content_pipelines')
      .select(`
        id,
        status,
        current_stage,
        brief_transcript,
        selected_silo,
        selected_idea,
        article_plan,
        hero_type,
        created_at,
        updated_at,
        completed_at,
        insight_id
      `)
      .order('updated_at', { ascending: false })
      .limit(limit);

    // Filter by status if provided
    if (status && status !== 'all') {
      if (status === 'active') {
        // Active = draft or in_progress
        query = query.in('status', ['draft', 'in_progress']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: pipelines, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform for easier display
    const formattedPipelines = pipelines?.map(p => ({
      id: p.id,
      status: p.status,
      current_stage: p.current_stage,
      silo: p.selected_silo,
      title: p.selected_idea?.title || p.article_plan?.title || (p.brief_transcript ? p.brief_transcript.slice(0, 60) + '...' : 'Untitled'),
      hero_type: p.hero_type,
      created_at: p.created_at,
      updated_at: p.updated_at,
      completed_at: p.completed_at,
      insight_id: p.insight_id,
      stage_label: getStageLabel(p.current_stage),
    }));

    console.log(`✅ Found ${pipelines?.length || 0} pipelines`);

    return NextResponse.json({
      success: true,
      pipelines: formattedPipelines,
      count: pipelines?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ List pipelines error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getStageLabel(stage: number): string {
  const stages: Record<number, string> = {
    1: 'Brief',
    2: 'Research',
    3: 'Plan',
    4: 'Write',
    5: 'Humanize',
    6: 'SEO',
    7: 'Meta',
    8: 'Media',
    9: 'Publish',
  };
  return stages[stage] || `Stage ${stage}`;
}


