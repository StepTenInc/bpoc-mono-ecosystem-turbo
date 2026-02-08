import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCandidateMatches, canRefreshMatch } from '@/lib/matching/match-service';

/**
 * GET /api/candidate/matches
 * Get all job matches for authenticated candidate
 * Optional: ?job_id=xxx to get specific match
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        if (jobId) {
            // Get specific match
            const { data: match, error } = await supabaseAdmin
                .from('job_matches')
                .select('*')
                .eq('candidate_id', user.id)
                .eq('job_id', jobId)
                .single();

            if (error || !match) {
                return NextResponse.json({ match: null });
            }

            // Check if can refresh
            const refreshStatus = await canRefreshMatch(user.id, jobId);

            return NextResponse.json({
                success: true,
                match: {
                    ...match,
                    can_refresh: refreshStatus.canRefresh,
                    next_refresh_at: refreshStatus.nextRefreshAt?.toISOString(),
                },
            });
        } else {
            // Get all matches for candidate
            const matches = await getCandidateMatches(user.id);

            // Add refresh status to each match
            const matchesWithRefreshStatus = await Promise.all(
                matches.map(async (match) => {
                    const refreshStatus = await canRefreshMatch(user.id, match.job_id);
                    return {
                        ...match,
                        can_refresh: refreshStatus.canRefresh,
                        next_refresh_at: refreshStatus.nextRefreshAt?.toISOString(),
                    };
                })
            );

            return NextResponse.json({
                success: true,
                matches: matchesWithRefreshStatus,
            });
        }
    } catch (error) {
        console.error('Error fetching matches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch matches' },
            { status: 500 }
        );
    }
}
