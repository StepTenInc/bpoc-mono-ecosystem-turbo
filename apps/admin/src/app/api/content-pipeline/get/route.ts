/**
 * GET PIPELINE
 * Fetch a pipeline by ID for resuming
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
    const pipelineId = searchParams.get('id');

    if (!pipelineId) {
      return NextResponse.json({ success: false, error: 'Pipeline ID required' }, { status: 400 });
    }

    console.log(`📂 Fetching pipeline ${pipelineId}`);

    const { data: pipeline, error } = await supabase
      .from('content_pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!pipeline) {
      return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });
    }

    console.log(`✅ Pipeline found - Stage ${pipeline.current_stage}`);

    return NextResponse.json({
      success: true,
      pipeline,
    });

  } catch (error: any) {
    console.error('❌ Get pipeline error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


