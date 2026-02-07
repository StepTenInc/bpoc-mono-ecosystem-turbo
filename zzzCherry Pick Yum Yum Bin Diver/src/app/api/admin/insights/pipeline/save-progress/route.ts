/**
 * AI CONTENT PIPELINE - Save Progress
 * Updates insight record at any stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { insightId, updates, pipelineStage } = await req.json();

    if (!insightId) {
      return NextResponse.json({ success: false, error: 'Missing insightId' }, { status: 400 });
    }

    console.log(`💾 Saving progress for ${insightId} - Stage: ${pipelineStage}`);

    // Build update object
    const updateData: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Set pipeline stage if provided
    if (pipelineStage) {
      updateData.pipeline_stage = pipelineStage;
    }

    // Update the insight record
    const { data, error } = await supabase
      .from('insights_posts')
      .update(updateData)
      .eq('id', insightId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`✅ Progress saved: ${pipelineStage}`);

    return NextResponse.json({
      success: true,
      insight: data,
    });

  } catch (error: any) {
    console.error('❌ Save progress error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to save progress' 
    }, { status: 500 });
  }
}


