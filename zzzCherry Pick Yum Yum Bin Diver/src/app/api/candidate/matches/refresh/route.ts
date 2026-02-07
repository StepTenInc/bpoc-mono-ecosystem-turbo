import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { refreshJobMatch, calculateJobMatch, saveJobMatch } from '@/lib/matching/match-service';
import { CandidateData, JobData } from '@/lib/matching/types';

/**
 * POST /api/candidate/matches/refresh
 * Refresh (recalculate) a job match
 * Body: { job_id: string }
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { job_id } = body;

        if (!job_id) {
            return NextResponse.json(
                { error: 'job_id is required' },
                { status: 400 }
            );
        }

        // Fetch candidate data from candidate_truth view
        const { data: candidateData, error: candError } = await supabaseAdmin
            .from('candidate_truth')
            .select('*')
            .eq('id', user.id)
            .single();

        if (candError || !candidateData) {
            return NextResponse.json(
                { error: 'Candidate not found' },
                { status: 404 }
            );
        }

        // Fetch job data
        const { data: jobData, error: jobError } = await supabaseAdmin
            .from('jobs')
            .select(`
        *,
        job_skills (
          skill_name
        )
      `)
            .eq('id', job_id)
            .single();

        if (jobError || !jobData) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Transform to matching engine format
        const candidate: CandidateData = {
            id: candidateData.id,
            skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
            work_experiences: Array.isArray(candidateData.work_experiences) ? candidateData.work_experiences : [],
            expected_salary_min: candidateData.expected_salary_min,
            expected_salary_max: candidateData.expected_salary_max,
            experience_years: candidateData.experience_years || 0,
            preferred_shift: candidateData.preferred_shift,
            preferred_work_setup: candidateData.preferred_work_setup,
            work_status: candidateData.work_status,
        };

        const job: JobData = {
            id: jobData.id,
            title: jobData.title,
            description: jobData.description || '',
            requirements: jobData.requirements,
            salary_min: jobData.salary_min,
            salary_max: jobData.salary_max,
            currency: jobData.currency || 'PHP',
            skills: jobData.job_skills?.map((s: any) => s.skill_name) || [],
            work_arrangement: jobData.work_arrangement,
            shift: jobData.shift,
        };

        // Try to refresh existing match
        try {
            const matchResult = await refreshJobMatch(user.id, job_id, candidate, job);

            return NextResponse.json({
                success: true,
                refreshed: true,
                match: {
                    job_id,
                    overall_score: matchResult.overall_score,
                    breakdown: matchResult.breakdown,
                    match_reasons: matchResult.match_reasons,
                    concerns: matchResult.concerns,
                    ai_summary: matchResult.ai_summary,
                    analyzed_at: new Date().toISOString(),
                },
            });
        } catch (refreshError: any) {
            // If rate limit hit, return error
            if (refreshError.message.includes('Cannot refresh yet')) {
                return NextResponse.json(
                    {
                        error: 'Rate limit exceeded',
                        message: refreshError.message,
                    },
                    { status: 429 }
                );
            }

            // If match doesn't exist, create new one
            const matchResult = await calculateJobMatch(candidate, job);
            await saveJobMatch(user.id, job_id, matchResult);

            return NextResponse.json({
                success: true,
                refreshed: false,
                created: true,
                match: {
                    job_id,
                    overall_score: matchResult.overall_score,
                    breakdown: matchResult.breakdown,
                    match_reasons: matchResult.match_reasons,
                    concerns: matchResult.concerns,
                    ai_summary: matchResult.ai_summary,
                    analyzed_at: new Date().toISOString(),
                },
            });
        }
    } catch (error) {
        console.error('Error refreshing match:', error);
        return NextResponse.json(
            { error: 'Failed to refresh match' },
            { status: 500 }
        );
    }
}
