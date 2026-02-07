import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateJobMatch, saveJobMatch } from '@/lib/matching/match-service';
import { CandidateData, JobData } from '@/lib/matching/types';

/**
 * POST /api/admin/generate-matches
 * Helper endpoint to generate matches for specific job or all active jobs
 * Body: { job_id?: string, candidate_id?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { job_id, candidate_id } = body;

        let jobsToProcess: any[] = [];
        let candidatesToProcess: any[] = [];

        // Fetch jobs
        if (job_id) {
            const { data: job, error } = await supabaseAdmin
                .from('jobs')
                .select('*')
                .eq('id', job_id)
                .single();

            if (error || !job) {
                return NextResponse.json({ error: 'Job not found' }, { status: 404 });
            }
            jobsToProcess = [job];
        } else {
            const { data: jobs, error } = await supabaseAdmin
                .from('jobs')
                .select('*')
                .limit(50);

            if (error) {
                console.error('Jobs error:', error);
                return NextResponse.json({ error: 'Failed to fetch jobs', details: error.message }, { status: 500 });
            }
            jobsToProcess = jobs || [];
        }

        // Fetch job skills separately
        if (jobsToProcess.length > 0) {
            const jobIds = jobsToProcess.map(j => j.id);
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

            jobsToProcess.forEach(job => {
                job.job_skills = skillsByJob.get(job.id) || [];
            });
        }

        // Fetch candidates
        if (candidate_id) {
            const { data: candidate, error } = await supabaseAdmin
                .from('candidate_truth')
                .select('*')
                .eq('id', candidate_id)
                .single();

            if (error || !candidate) {
                return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
            }
            candidatesToProcess = [candidate];
        } else {
            const { data: candidates, error } = await supabaseAdmin
                .from('candidate_truth')
                .select('*')
                .eq('is_active', true)
                .limit(100);

            if (error) {
                console.error('Candidates error:', error);
                return NextResponse.json({ error: 'Failed to fetch candidates', details: error.message }, { status: 500 });
            }
            candidatesToProcess = candidates || [];
        }

        // Generate matches
        const results = {
            processed: 0,
            created: 0,
            errors: 0,
            jobs: jobsToProcess.length,
            candidates: candidatesToProcess.length,
        };

        for (const jobData of jobsToProcess) {
            for (const candidateData of candidatesToProcess) {
                results.processed++;

                try {
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

                    const matchResult = await calculateJobMatch(candidate, job);
                    await saveJobMatch(candidateData.id, jobData.id, matchResult);

                    results.created++;
                } catch (error: any) {
                    console.error(`Match error for ${candidateData.id} + ${jobData.id}:`, error.message);
                    results.errors++;
                }

                // Small delay
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }

        return NextResponse.json({
            success: true,
            message: `Generated ${results.created} matches`,
            results,
        });
    } catch (error: any) {
        console.error('Generate matches error:', error);
        return NextResponse.json(
            { error: 'Failed to generate matches', details: error.message },
            { status: 500 }
        );
    }
}
