import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: analysis, error } = await supabase
      .from('ai_analysis_results')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching AI analysis:', error);
      return NextResponse.json({ error: 'Failed to fetch AI analysis' }, { status: 500 });
    }

    if (!analysis) {
      return NextResponse.json({ analysis: null });
    }

    return NextResponse.json({
      analysis: {
        overall_score: analysis.overall_score,
        ats_compatibility: analysis.ats_compatibility_score,
        content_quality: analysis.content_quality_score,
        professional_presentation: analysis.professional_presentation_score,
        skills_alignment: analysis.skills_alignment_score,
        key_strengths: analysis.key_strengths,
        improvements: analysis.improvements,
        recommendations: analysis.recommendations,
        improved_summary: analysis.improved_summary,
        salary_analysis: analysis.salary_analysis,
        career_path: analysis.career_path,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at,
      }
    });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch AI analysis' }, { status: 500 });
  }
}
