/**
 * DELETE PIPELINE
 * Remove a pipeline (for cleanup of abandoned drafts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pipelineId = searchParams.get('id');

    if (!pipelineId) {
      return NextResponse.json({ success: false, error: 'Pipeline ID required' }, { status: 400 });
    }

    console.log(`🗑️ Deleting pipeline ${pipelineId}`);

    // Check if pipeline exists and is not published
    const { data: pipeline } = await supabase
      .from('content_pipelines')
      .select('id, status, insight_id')
      .eq('id', pipelineId)
      .single();

    if (!pipeline) {
      return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });
    }

    if (pipeline.status === 'published' && pipeline.insight_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete published pipeline. Delete the article first.' 
      }, { status: 400 });
    }

    // Delete the pipeline
    const { error } = await supabase
      .from('content_pipelines')
      .delete()
      .eq('id', pipelineId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`✅ Pipeline deleted`);

    return NextResponse.json({
      success: true,
      message: 'Pipeline deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete pipeline error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


