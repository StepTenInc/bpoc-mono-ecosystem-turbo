import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Save hero media (video or image) URL to insights_posts table
 */
export async function POST(req: NextRequest) {
  console.log('💾 [SAVE-HERO] ========== REQUEST RECEIVED ==========');

  try {
    const body = await req.json();
    const { insightId, videoUrl, heroUrl, heroType } = body;

    console.log('💾 [SAVE-HERO] Request data:', {
      insightId,
      videoUrl: videoUrl?.substring(0, 50),
      heroUrl: heroUrl?.substring(0, 50),
      heroType,
    });

    if (!insightId) {
      console.error('❌ [SAVE-HERO] Insight ID is required');
      return NextResponse.json(
        { success: false, error: 'Insight ID is required' },
        { status: 400 }
      );
    }

    // Build update data based on what was provided
    const updateData: Record<string, any> = {};

    if (heroType) {
      updateData.hero_type = heroType;
    }

    if (videoUrl) {
      updateData.video_url = videoUrl;
      // If setting video, also set hero_type to video
      if (!heroType) {
        updateData.hero_type = 'video';
      }
    }

    if (heroUrl) {
      updateData.hero_url = heroUrl;
      // If setting hero image, also set hero_type to image (unless video is also set)
      if (!heroType && !videoUrl) {
        updateData.hero_type = 'image';
      }
    }

    if (Object.keys(updateData).length === 0) {
      console.error('❌ [SAVE-HERO] No media URL provided');
      return NextResponse.json(
        { success: false, error: 'No media URL provided' },
        { status: 400 }
      );
    }

    console.log('💾 [SAVE-HERO] Updating insights_posts with:', updateData);

    const { error } = await supabase
      .from('insights_posts')
      .update(updateData)
      .eq('id', insightId);

    if (error) {
      console.error('❌ [SAVE-HERO] Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [SAVE-HERO] Hero media saved successfully');
    return NextResponse.json({
      success: true,
      message: 'Hero media saved',
    });

  } catch (error: any) {
    console.error('❌ [SAVE-HERO] Exception:', error.message);
    console.error('❌ [SAVE-HERO] Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save' },
      { status: 500 }
    );
  }
}
