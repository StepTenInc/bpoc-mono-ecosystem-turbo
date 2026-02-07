import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/recruiter/talent
 * Search and fetch candidates from the talent pool
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
    const hasResume = searchParams.get('hasResume') === 'true';
    const hasAiAnalysis = searchParams.get('hasAiAnalysis') === 'true';

    // PERFORMANCE OPTIMIZED: Use candidate_truth view (1 query instead of 7!)
    let candidatesQuery = supabaseAdmin
      .from('candidate_truth')
      .select('*')
      .eq('is_active', true)
      .order('candidate_created_at', { ascending: false })
      .limit(50);

    // Apply search filter
    if (search) {
      candidatesQuery = candidatesQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Apply hasResume filter at database level
    if (hasResume) {
      candidatesQuery = candidatesQuery.eq('has_resume', true);
    }

    // Apply hasAiAnalysis filter at database level
    if (hasAiAnalysis) {
      candidatesQuery = candidatesQuery.eq('has_ai_analysis', true);
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery;

    if (candidatesError) {
      console.error('Error fetching candidates from candidate_truth view:', candidatesError);
      return NextResponse.json({ error: 'Failed to fetch candidates', details: candidatesError.message }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ candidates: [], total: 0 });
    }

    // Format candidates - all data already aggregated in view!
    let formattedCandidates = candidates.map((c: any) => {
      // Parse skills array - now returns objects with {name, category, etc}
      const candidateSkills = Array.isArray(c.skills)
        ? c.skills.map((s: any) => typeof s === 'string' ? s : s.name)
        : [];

      return {
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: `candidate-${c.id.substring(0, 8)}@contact.bpoc.com`, // Privacy: masked email
        avatarUrl: c.avatar_url,
        headline: c.headline || c.current_position || c.bio?.substring(0, 50) || 'Candidate',
        location: c.location_city || c.location || null,
        experienceYears: c.experience_years || 0,
        skills: candidateSkills,
        hasResume: c.has_resume || false,
        hasAiAnalysis: c.has_ai_analysis || false,
        aiScore: c.ai_analysis?.overallScore || null,
        matchScore: c.ai_analysis?.overallScore || null,
        totalXp: c.total_xp || 0,
        level: c.level || 1,
        workStatus: c.work_status || null,
        activityStatus: c.activity_status || 'inactive',
        isNew: c.is_new || false,
        lastActive: c.activity_status === 'online' ? 'today' :
                   c.activity_status === 'recent' ? 'this week' : 'inactive',
        totalApplications: c.total_applications || 0,
        totalPlacements: c.total_placements || 0,
      };
    });

    // Apply skills filter (client-side for partial matching)
    if (skills.length > 0) {
      formattedCandidates = formattedCandidates.filter(c =>
        skills.some(skill =>
          c.skills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    return NextResponse.json({
      candidates: formattedCandidates,
      total: formattedCandidates.length,
    });

  } catch (error) {
    console.error('Error in talent search:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
