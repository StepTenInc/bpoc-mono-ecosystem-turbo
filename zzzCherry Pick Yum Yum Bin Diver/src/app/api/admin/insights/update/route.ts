/**
 * UPDATE INSIGHT ARTICLE
 * Updates a published article and syncs with content_pipelines if connected
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id, updates, seoUpdates } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Article ID required' }, { status: 400 });
    }

    console.log(`📝 Updating insight ${id}`);

    // Get current article to check for pipeline connection
    const { data: currentArticle } = await supabase
      .from('insights_posts')
      .select('id, slug, generation_metadata')
      .eq('id', id)
      .single();

    if (!currentArticle) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If content parts are updated, also update the combined content
    if (updates.content_part1 || updates.content_part2 || updates.content_part3) {
      // Get current parts if not all are being updated
      const { data: current } = await supabase
        .from('insights_posts')
        .select('content_part1, content_part2, content_part3')
        .eq('id', id)
        .single();

      const part1 = updates.content_part1 ?? current?.content_part1 ?? '';
      const part2 = updates.content_part2 ?? current?.content_part2 ?? '';
      const part3 = updates.content_part3 ?? current?.content_part3 ?? '';
      
      updatePayload.content = [part1, part2, part3].filter(Boolean).join('\n\n');
    }

    // Update insights_posts
    const { data: article, error } = await supabase
      .from('insights_posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Update SEO metadata if provided
    if (seoUpdates && Object.keys(seoUpdates).length > 0) {
      const { error: seoError } = await supabase
        .from('seo_metadata')
        .upsert({
          post_id: id,
          ...seoUpdates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'post_id' });

      if (seoError) {
        console.error('SEO update error:', seoError);
        // Don't fail the whole request for SEO errors
      }
    }

    // Sync with content_pipelines if connected
    const pipelineId = currentArticle.generation_metadata?.pipelineId;
    if (pipelineId) {
      console.log(`🔄 Syncing with pipeline ${pipelineId}`);
      
      // Update pipeline with edited content
      const pipelineUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.content) pipelineUpdates.seo_article = updates.content;
      if (updates.content_part1) pipelineUpdates.content_section1 = updates.content_part1;
      if (updates.content_part2) pipelineUpdates.content_section2 = updates.content_part2;
      if (updates.content_part3) pipelineUpdates.content_section3 = updates.content_part3;
      if (updates.title) pipelineUpdates.article_plan = { 
        ...currentArticle.generation_metadata?.plan,
        title: updates.title 
      };
      if (updates.meta_description) {
        pipelineUpdates.meta_data = {
          ...currentArticle.generation_metadata,
          metaDescription: updates.meta_description,
        };
      }

      // Add edit log to pipeline
      const { data: pipeline } = await supabase
        .from('content_pipelines')
        .select('ai_logs')
        .eq('id', pipelineId)
        .single();

      if (pipeline) {
        pipelineUpdates.ai_logs = [
          ...(pipeline.ai_logs || []),
          {
            stage: 'post_publish_edit',
            timestamp: new Date().toISOString(),
            message: 'Article edited after publishing',
            editedFields: Object.keys(updates),
          },
        ];
      }

      await supabase
        .from('content_pipelines')
        .update(pipelineUpdates)
        .eq('id', pipelineId);
    }

    console.log(`✅ Article updated: ${article.slug}`);

    return NextResponse.json({
      success: true,
      article,
    });

  } catch (error: any) {
    console.error('❌ Update insight error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH method for partial updates
export async function PATCH(req: NextRequest) {
  return POST(req);
}


