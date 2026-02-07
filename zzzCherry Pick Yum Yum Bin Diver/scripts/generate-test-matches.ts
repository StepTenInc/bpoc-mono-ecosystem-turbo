import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateJobMatch, saveJobMatch } from '@/lib/matching/match-service';
import { CandidateData, JobData } from '@/lib/matching/types';

/**
 * Script to generate job matches for testing
 * Run with: npx tsx scripts/generate-test-matches.ts
 */

async function generateMatches() {
    console.log('🎯 Starting match generation...\n');

    // Fetch all active jobs (excluding job_skills for now)
    const { data: jobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select(`
      id,
      title,
      description,
      requirements,
      salary_min,
      salary_max,
      currency,
      work_arrangement,
      shift
    `)
        .eq('status', 'active');

    if (jobsError) {
        console.error('❌ Error fetching jobs:', jobsError);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.error('❌ No active jobs found');
        return;
    }

    console.log(`📋 Found ${jobs.length} active job(s)`);

    // Fetch all active candidates
    const { data: candidates, error: candidatesError } = await supabaseAdmin
        .from('candidate_truth')
        .select('*')
        .eq('is_active', true);

    if (candidatesError || !candidates || candidates.length === 0) {
        console.error('❌ No active candidates found');
        return;
    }

    console.log(`👥 Found ${candidates.length} active candidate(s)\n`);

    let processed = 0;
    let created = 0;
    let errors = 0;

    for (const jobData of jobs) {
        console.log(`\n🔨 Processing job: "${jobData.title}"`);

        for (const candidateData of candidates) {
            processed++;

            try {
                // Transform to matching engine format
                const candidate: CandidateData = {
                    id: candidateData.id,
                    skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
                    work_experiences: Array.isArray(candidateData.work_experiences)
                        ? candidateData.work_experiences
                        : [],
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
                    skills: [], // Skills will be empty for now - focus on salary/experience matching
                    work_arrangement: jobData.work_arrangement,
                    shift: jobData.shift,
                };

                // Calculate and save match
                console.log(`   ⚙️  Calculating match for ${candidateData.first_name} ${candidateData.last_name}...`);
                const matchResult = await calculateJobMatch(candidate, job);
                await saveJobMatch(candidateData.id, jobData.id, matchResult);

                console.log(`   ✅ Match score: ${matchResult.overall_score}%`);
                created++;

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error: any) {
                console.error(`   ❌ Error: ${error.message}`);
                errors++;
            }
        }
    }

    console.log(`\n\n🎉 Match generation complete!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Created: ${created}`);
    console.log(`   Errors: ${errors}`);
}

// Run the script
generateMatches()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
