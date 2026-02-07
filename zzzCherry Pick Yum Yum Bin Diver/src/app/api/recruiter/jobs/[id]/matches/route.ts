import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/recruiter/jobs/[id]/matches
 * Get matched candidates for a specific job
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // Verify recruiter authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const jobId = params.id;

        // Fetch job matches with candidate details
        const { data: matches, error } = await supabaseAdmin
            .from('job_matches')
            .select(`
        *,
        candidates (
          id,
          first_name,
          last_name,
          avatar_url,
          email
        )
      `)
            .eq('job_id', jobId)
            .order('overall_score', { ascending: false });

        if (error) {
            console.error('Matches fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch matches' },
                { status: 500 }
            );
        }

        // Fetch candidate profiles for additional info
        const candidateIds = matches?.map(m => m.candidate_id) || [];

        let candidateProfiles = [];
        if (candidateIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from('candidate_profiles')
                .select('candidate_id, headline, location_city, work_status')
                .in('candidate_id', candidateIds);

            candidateProfiles = profiles || [];
        }

        // Combine data
        const enrichedMatches = matches?.map(match => {
            const profile = candidateProfiles.find(p => p.candidate_id === match.candidate_id);
            return {
                ...match,
                candidate_profile: profile,
            };
        }) || [];

        return NextResponse.json({
            success: true,
            matches: enrichedMatches,
            total: enrichedMatches.length,
        });
    } catch (error: any) {
        console.error('Error fetching job matches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job matches', details: error.message },
            { status: 500 }
        );
    }
}
