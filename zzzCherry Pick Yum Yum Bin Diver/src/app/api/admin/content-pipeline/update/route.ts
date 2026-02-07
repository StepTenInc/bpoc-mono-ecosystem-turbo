/**
 * UPDATE PIPELINE
 * Stores complete pipeline state including all article versions and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pipelineId, stage, data, aiLog } = await req.json();

    if (!pipelineId) {
      return NextResponse.json({ success: false, error: 'Pipeline ID required' }, { status: 400 });
    }

    console.log(`💾 Updating pipeline ${pipelineId} - Stage ${stage}`);

    // Check if marking as abandoned
    if (data.markAbandoned) {
      const { error } = await supabase
        .from('content_pipelines')
        .update({
          status: 'abandoned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pipelineId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      console.log(`🗑️ Pipeline ${pipelineId} marked as abandoned`);
      return NextResponse.json({ success: true });
    }

    // Build update object
    const updateData: Record<string, any> = {
      current_stage: stage,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    };

    // Stage-specific data mapping (9-stage pipeline)
    // Stage 1: Brief + Ideas | Stage 2: Research | Stage 3: Plan | Stage 4: Write
    // Stage 5: Humanize | Stage 6: SEO | Stage 7: Meta | Stage 8: Media | Stage 9: Publish
    switch (stage) {
      case 1: // Brief + Ideas
        if (data.transcript) updateData.brief_transcript = data.transcript;
        if (data.briefType) updateData.brief_type = data.briefType;
        if (data.selectedSilo) updateData.selected_silo = data.selectedSilo;
        if (data.selectedSiloId) updateData.selected_silo_id = data.selectedSiloId;
        if (data.generatedIdeas) updateData.generated_ideas = data.generatedIdeas;
        if (data.selectedIdea) updateData.selected_idea = data.selectedIdea;
        break;

      case 2: // Research
        if (data.selectedIdea) updateData.selected_idea = data.selectedIdea;
        if (data.researchData) {
          const rd = data.researchData?.research || data.researchData;
          if (rd?.serper) updateData.serper_results = rd.serper;
          if (rd?.perplexity) updateData.hr_kb_results = rd.perplexity;
          if (rd?.synthesis) updateData.research_synthesis = rd.synthesis;
        }
        if (data.serperResults) updateData.serper_results = data.serperResults;
        if (data.hrKbResults) updateData.hr_kb_results = data.hrKbResults;
        if (data.researchSynthesis) updateData.research_synthesis = data.researchSynthesis;
        break;

      case 3: // Plan
        if (data.plan) updateData.article_plan = data.plan;
        if (data.planApproved !== undefined) updateData.plan_approved = data.planApproved;
        break;

      case 4: // Write
        if (data.article) updateData.raw_article = data.article;
        if (data.wordCount) updateData.word_count = data.wordCount;
        if (data.planApproved !== undefined) updateData.plan_approved = data.planApproved;
        break;

      case 5: // Humanize
        if (data.humanizedArticle) updateData.humanized_article = data.humanizedArticle;
        if (data.humanScore !== undefined) updateData.human_score = data.humanScore;
        break;

      case 6: // SEO
        if (data.seoArticle) updateData.seo_article = data.seoArticle;
        if (data.seoStats) updateData.seo_stats = data.seoStats;
        break;

      case 7: // Meta
        if (data.meta) updateData.meta_data = data.meta;
        if (data.images) updateData.generated_images = data.images;
        if (data.imagePrompts) updateData.image_prompts = data.imagePrompts;
        break;

      case 8: // Media
        if (data.heroSource) updateData.hero_source = data.heroSource;
        if (data.sectionSource) updateData.section_source = data.sectionSource;
        if (data.videoUrl) updateData.video_url = data.videoUrl;
        if (data.heroType) updateData.hero_type = data.heroType;
        if (data.images) updateData.generated_images = data.images;
        if (data.contentSections) {
          updateData.content_section1 = data.contentSections[0] || null;
          updateData.content_section2 = data.contentSections[1] || null;
          updateData.content_section3 = data.contentSections[2] || null;
        }
        break;

      case 9: // Publish
        if (data.markComplete) {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
        }
        break;
    }

    // First get current ai_logs and meta_data
    const { data: current } = await supabase
      .from('content_pipelines')
      .select('ai_logs, meta_data')
      .eq('id', pipelineId)
      .single();

    // Persist isSiloPage flag into meta_data (any stage can set this)
    if (data.isSiloPage !== undefined) {
      updateData.meta_data = { ...(current?.meta_data || {}), ...(updateData.meta_data || {}), isSiloPage: data.isSiloPage };
    } else if (updateData.meta_data && current?.meta_data?.isSiloPage !== undefined) {
      // Preserve existing isSiloPage when meta_data is being updated (e.g. Stage 7)
      updateData.meta_data = { ...updateData.meta_data, isSiloPage: current.meta_data.isSiloPage };
    }

    // Append new log entry
    if (aiLog) {
      const currentLogs = current?.ai_logs || [];
      updateData.ai_logs = [
        ...currentLogs,
        {
          stage,
          timestamp: new Date().toISOString(),
          ...aiLog,
        },
      ];
    }

    // Update pipeline
    const { data: pipeline, error } = await supabase
      .from('content_pipelines')
      .update(updateData)
      .eq('id', pipelineId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`✅ Pipeline updated - Stage ${stage}`);

    return NextResponse.json({
      success: true,
      pipeline,
    });

  } catch (error: any) {
    console.error('❌ Update pipeline error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
