import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/user/resume-status
 * Check the user's resume builder progress
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for extracted resume in candidate_resumes
    const { data: resume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id, slug, updated_at, resume_data')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .single();

    // Check for AI analysis in candidate_ai_analysis
    const { data: analysis } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .select('id, updated_at, overall_score')
      .eq('candidate_id', userId)
      .single();

    const hasExtractedResume = !!resume?.resume_data;
    const hasAIAnalysis = !!analysis?.overall_score;
    const hasSavedResume = hasExtractedResume && hasAIAnalysis;

    return NextResponse.json({
      success: true,
      hasExtractedResume,
      hasAIAnalysis,
      hasSavedResume,
      resumeSlug: resume?.slug || null,
      lastUpdated: resume?.updated_at || analysis?.updated_at || null,
    });

  } catch (error) {
    console.error('Error checking resume status:', error);
    return NextResponse.json(
      { error: 'Failed to check resume status' },
      { status: 500 }
    );
  }
}

