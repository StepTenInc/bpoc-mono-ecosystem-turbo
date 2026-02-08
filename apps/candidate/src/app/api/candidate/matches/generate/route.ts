import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateJobMatch, saveJobMatch } from '@/lib/matching/match-service';

/**
 * POST /api/candidate/matches/generate
 * Generate job matches for the authenticated candidate
 * Called when a candidate has no matches and wants to generate them
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        console.log('🎯 Generating matches for candidate:', userId);

        // Check if candidate already has matches
        const { count: existingMatchCount } = await supabaseAdmin
            .from('job_matches')
            .select('*', { count: 'exact', head: true })
            .eq('candidate_id', userId);

        if (existingMatchCount && existingMatchCount > 10) {
            return NextResponse.json({
                success: true,
                message: 'Matches already exist',
                matchCount: existingMatchCount,
                generated: 0
            });
        }

        // Get candidate data from candidate_truth view
        const { data: candidateData, error: candidateError } = await supabaseAdmin
            .from('candidate_truth')
            .select('*')
            .eq('id', userId)
            .single();

        if (candidateError || !candidateData) {
            console.log('⚠️ Could not fetch candidate truth:', candidateError?.message);
            return NextResponse.json({
                error: 'Complete your profile first to generate matches',
                code: 'PROFILE_INCOMPLETE'
            }, { status: 400 });
        }

        // Get active jobs
        const { data: jobs, error: jobsError } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .limit(50);

        if (jobsError || !jobs?.length) {
            console.log('⚠️ No active jobs found');
            return NextResponse.json({
                success: true,
                message: 'No active jobs available',
                generated: 0
            });
        }

        // Get job skills
        const jobIds = jobs.map(j => j.id);
        const { data: allJobSkills } = await supabaseAdmin
            .from('job_skills')
            .select('job_id, skill_name')
            .in('job_id', jobIds);

        const skillsByJob = new Map();
        allJobSkills?.forEach(skill => {
            if (!skillsByJob.has(skill.job_id)) {
                skillsByJob.set(skill.job_id, []);
            }
            skillsByJob.get(skill.job_id).push({ skill_name: skill.skill_name });
        });

        jobs.forEach(job => {
            (job as any).job_skills = skillsByJob.get(job.id) || [];
        });

        let matchesGenerated = 0;
        let errors = 0;

        for (const jobData of jobs) {
            try {
                const candidate = {
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

                const job = {
                    id: jobData.id,
                    title: jobData.title,
                    description: jobData.description || '',
                    requirements: jobData.requirements,
                    salary_min: jobData.salary_min,
                    salary_max: jobData.salary_max,
                    currency: jobData.currency || 'PHP',
                    skills: (jobData as any).job_skills?.map((s: any) => s.skill_name) || [],
                    work_arrangement: jobData.work_arrangement,
                    shift: jobData.shift,
                };

                const matchResult = await calculateJobMatch(candidate, job);
                await saveJobMatch(userId, jobData.id, matchResult);
                matchesGenerated++;

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error('Match error for job', jobData.id, err);
                errors++;
            }
        }

        console.log(`✅ Generated ${matchesGenerated} matches for ${userId}`);

        return NextResponse.json({
            success: true,
            message: `Generated ${matchesGenerated} job matches`,
            generated: matchesGenerated,
            errors,
            total: jobs.length
        });

    } catch (error: any) {
        console.error('❌ Error generating matches:', error);
        return NextResponse.json({
            error: 'Failed to generate matches',
            details: error.message
        }, { status: 500 });
    }
}
