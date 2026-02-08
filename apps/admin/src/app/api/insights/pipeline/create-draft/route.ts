/**
 * AI CONTENT PIPELINE - Create Initial Draft
 * Creates a draft record when user selects an idea (Stage 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { idea, brief, pipelineId } = await req.json();

    if (!idea) {
      return NextResponse.json({ success: false, error: 'Missing idea' }, { status: 400 });
    }

    if (!pipelineId) {
      return NextResponse.json({ success: false, error: 'Missing pipelineId' }, { status: 400 });
    }

    console.log('📝 Creating initial draft for:', idea.title);
    console.log('🔗 Linking to pipeline:', pipelineId);

    // Fetch pipeline to get silo data (source of truth)
    const { data: pipeline, error: pipelineError } = await supabase
      .from('content_pipelines')
      .select('selected_silo, selected_silo_id')
      .eq('id', pipelineId)
      .single();

    if (pipelineError || !pipeline) {
      return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });
    }

    const silo = pipeline.selected_silo;
    const siloId = pipeline.selected_silo_id;

    // Generate a slug from the title
    const slug = idea.slug || idea.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('insights_posts')
      .select('id, slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      // Return existing draft instead of creating duplicate
      console.log('📌 Found existing draft:', existing.id);

      // Update the pipeline with this insight_id if pipelineId provided
      if (pipelineId) {
        await supabase
          .from('content_pipelines')
          .update({ insight_id: existing.id })
          .eq('id', pipelineId);
      }

      return NextResponse.json({
        success: true,
        insightId: existing.id,
        isExisting: true,
      });
    }

    // Create new draft record with pipeline_id link
    // Try with pipeline_id first, fallback if column doesn't exist
    let insight;
    let error;

    const baseInsertData: Record<string, any> = {
      slug,
      title: idea.title,
      content: '', // Empty placeholder
      author: 'Ate Yna',
      author_slug: 'ate-yna',
      category: silo || 'Employment Guide',
      silo_topic: silo || null,
      pipeline_stage: 'idea',
      is_published: false,
      hero_type: null, // Don't set default - user chooses in stage 7
      hero_url: null,
      video_url: null,
      generation_metadata: {
        idea,
        brief,
        silo,
        siloId,
        pipelineId, // Always store in metadata
        created_at: new Date().toISOString(),
      },
      ai_logs: [{
        stage: 'idea_selected',
        timestamp: new Date().toISOString(),
        idea: idea.title,
        pipelineId,
      }],
    };

    // Add silo_id if provided (links to insights_silos table)
    if (siloId) {
      baseInsertData.silo_id = siloId;
    }

    // Try inserting with pipeline_id column
    const insertResult = await supabase
      .from('insights_posts')
      .insert({
        ...baseInsertData,
        pipeline_id: pipelineId || null, // Link to pipeline
      })
      .select()
      .single();

    // If failed due to missing column, retry without it
    if (insertResult.error && insertResult.error.message?.includes('pipeline_id')) {
      console.log('⚠️ pipeline_id column not found, retrying without it...');
      const retryResult = await supabase
        .from('insights_posts')
        .insert(baseInsertData)
        .select()
        .single();

      insight = retryResult.data;
      error = retryResult.error;
    } else {
      insight = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ Draft created:', insight.id);

    // Update the pipeline with this insight_id
    if (pipelineId) {
      const { error: updateError } = await supabase
        .from('content_pipelines')
        .update({
          insight_id: insight.id,
          status: 'in_progress',
        })
        .eq('id', pipelineId);

      if (updateError) {
        console.error('⚠️ Failed to update pipeline with insight_id:', updateError);
      } else {
        console.log('🔗 Pipeline linked to insight:', pipelineId, '→', insight.id);
      }
    }

    return NextResponse.json({
      success: true,
      insightId: insight.id,
      slug: insight.slug,
    });

  } catch (error: any) {
    console.error('❌ Create draft error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create draft'
    }, { status: 500 });
  }
}


