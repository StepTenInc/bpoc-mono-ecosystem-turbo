import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Fetch candidates with their profiles and related data
    let query = supabaseAdmin
      .from('candidates')
      .select(`
        id,
        email,
        first_name,
        last_name,
        full_name,
        avatar_url,
        is_active,
        created_at,
        candidate_profiles (
          location,
          position,
          headline,
          phone
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: candidates, count, error } = await query;

    if (error) {
      console.error('Candidates fetch error:', error);
      throw error;
    }

    // Get resume and AI analysis for each candidate
    const candidatesWithData = await Promise.all(
      (candidates || []).map(async (candidate) => {
        const [resumeResult, analysisResult] = await Promise.all([
          // Check for resume
          supabaseAdmin
            .from('candidate_resumes')
            .select('id')
            .eq('candidate_id', candidate.id)
            .limit(1),

          // Check for AI analysis
          supabaseAdmin
            .from('candidate_ai_analysis')
            .select('id, overall_score')
            .eq('candidate_id', candidate.id)
            .limit(1)
        ]);

        return {
          id: candidate.id,
          name: candidate.full_name || `${candidate.first_name} ${candidate.last_name}`.trim() || candidate.email,
          email: candidate.email,
          phone: candidate.phone,
          avatar: candidate.avatar_url,
          location: candidate.candidate_profiles?.[0]?.location || null,
          hasResume: (resumeResult.data?.length || 0) > 0,
          hasAiAnalysis: (analysisResult.data?.length || 0) > 0,
          aiScore: analysisResult.data?.[0]?.overall_score || null,
          status: candidate.is_active ? 'active' : 'inactive',
          createdAt: candidate.created_at,
        };
      })
    );

    return NextResponse.json({
      candidates: candidatesWithData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Candidates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

