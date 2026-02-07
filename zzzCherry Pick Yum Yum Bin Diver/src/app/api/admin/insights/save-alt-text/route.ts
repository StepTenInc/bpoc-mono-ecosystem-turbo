import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Save image URL and alt text to database for a specific section
 */
export async function POST(req: NextRequest) {
  console.log('💾 [SAVE-ALT] ========== REQUEST RECEIVED ==========');

  try {
    const body = await req.json();
    const { pipelineId, insightId, sectionNumber, altText, imageUrl } = body;

    console.log('💾 [SAVE-ALT] Request data:', {
      pipelineId,
      insightId,
      sectionNumber,
      altText: altText?.substring(0, 50),
      imageUrl: imageUrl?.substring(0, 50),
    });

    if (!altText) {
      console.error('❌ [SAVE-ALT] Alt text is required');
      return NextResponse.json(
        { success: false, error: 'Alt text is required' },
        { status: 400 }
      );
    }

    let savedToPipeline = false;
    let savedToInsights = false;

    // Save to pipeline draft if pipelineId exists
    if (pipelineId) {
      console.log('💾 [SAVE-ALT] Saving to pipeline draft...');

      try {
        // Get current draft data
        const { data: draft } = await supabase
          .from('insights_pipeline_drafts')
          .select('id, content')
          .eq('pipeline_id', pipelineId)
          .eq('step', 'publish')
          .maybeSingle();

        // Build content with alt texts and images
        const currentContent = draft?.content || {};
        const sectionAltTexts = currentContent.sectionAltTexts || {};
        const sectionImages = currentContent.sectionImages || {};

        sectionAltTexts[`section${sectionNumber}`] = altText;
        if (imageUrl) {
          sectionImages[`section${sectionNumber}`] = imageUrl;
        }

        const newContent = {
          ...currentContent,
          sectionAltTexts,
          sectionImages,
        };

        if (draft?.id) {
          // Update existing draft
          const { error } = await supabase
            .from('insights_pipeline_drafts')
            .update({ content: newContent })
            .eq('id', draft.id);

          if (error) {
            console.error('❌ [SAVE-ALT] Update error:', error);
          } else {
            savedToPipeline = true;
            console.log('✅ [SAVE-ALT] Updated pipeline draft');
          }
        } else {
          // Insert new draft
          const { error } = await supabase
            .from('insights_pipeline_drafts')
            .insert({
              pipeline_id: pipelineId,
              step: 'publish',
              content: newContent,
            });

          if (error) {
            console.error('❌ [SAVE-ALT] Insert error:', error);
          } else {
            savedToPipeline = true;
            console.log('✅ [SAVE-ALT] Created pipeline draft');
          }
        }
      } catch (pipelineError: any) {
        console.error('❌ [SAVE-ALT] Pipeline error:', pipelineError.message);
      }
    }

    // If we have an insightId, update the insights_posts table directly
    if (insightId) {
      console.log('💾 [SAVE-ALT] Saving to insights_posts...');

      try {
        // Try to update with the new column names first
        const altColumnName = `section${sectionNumber}_image_alt`;
        const updateData: Record<string, any> = {};
        updateData[altColumnName] = altText;

        // If imageUrl is provided, also update the content_imageX column
        if (imageUrl) {
          const imageColumnMap: Record<number, string> = {
            1: 'content_image0',
            2: 'content_image1',
            3: 'content_image2',
          };
          const imageColumn = imageColumnMap[sectionNumber];
          if (imageColumn) {
            updateData[imageColumn] = imageUrl;
            console.log(`💾 [SAVE-ALT] Adding ${imageColumn} to updateData: ${imageUrl.substring(0, 50)}...`);
          }
        }

        const { error } = await supabase
          .from('insights_posts')
          .update(updateData)
          .eq('id', insightId);

        if (error) {
          console.error('❌ [SAVE-ALT] insights_posts error:', error);
          // Column might not exist yet - that's OK, will be saved on publish
        } else {
          savedToInsights = true;
          console.log('✅ [SAVE-ALT] Saved to insights_posts');
        }
      } catch (insightsError: any) {
        console.error('❌ [SAVE-ALT] insights_posts exception:', insightsError.message);
      }
    }

    // Return success if at least one save worked, or if no IDs were provided
    if (savedToPipeline || savedToInsights || (!pipelineId && !insightId)) {
      console.log('✅ [SAVE-ALT] Save completed', { savedToPipeline, savedToInsights });
      return NextResponse.json({
        success: true,
        message: `Section ${sectionNumber} alt text saved`,
        savedToPipeline,
        savedToInsights,
      });
    }

    // Both failed
    return NextResponse.json(
      { success: false, error: 'Failed to save alt text' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('❌ [SAVE-ALT] Exception:', error.message);
    console.error('❌ [SAVE-ALT] Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save' },
      { status: 500 }
    );
  }
}
