/**
 * Job Matching Service
 * Main orchestrator for calculating job matches
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { CandidateData, JobData, MatchResult } from './types';
import { calculateMatchScores, calculateOverallScore } from './scoring-engine';
import { analyzeMatchWithGroq } from './groq-analyzer';

/**
 * Calculate missing skills for a candidate-job pair
 */
export function calculateMissingSkills(
    candidate: CandidateData,
    job: JobData
): string[] {
    if (!job.skills || job.skills.length === 0) {
        return [];
    }

    const candidateSkillNames = new Set(
        candidate.skills.map(s => s.name.toLowerCase())
    );

    const missingSkills = job.skills.filter(
        requiredSkill => !candidateSkillNames.has(requiredSkill.toLowerCase())
    );

    return missingSkills;
}

/**
 * Calculate a match between a candidate and a job
 */
export async function calculateJobMatch(
    candidate: CandidateData,
    job: JobData
): Promise<MatchResult> {
    // Step 1: Calculate rule-based scores
    const breakdown = calculateMatchScores(candidate, job);
    const overall_score = calculateOverallScore(breakdown);

    // Step 2: Identify missing skills
    const missing_skills = calculateMissingSkills(candidate, job);

    // Step 3: Enhance with AI insights (Groq)
    const aiInsights = await analyzeMatchWithGroq(candidate, job, breakdown);

    // Step 4: Create snapshots for change detection
    const candidate_snapshot = {
        skills: candidate.skills,
        experience_years: candidate.experience_years,
        salary_min: candidate.expected_salary_min,
        salary_max: candidate.expected_salary_max,
        preferred_shift: candidate.preferred_shift,
        location_city: candidate.location_city,
        location_region: candidate.location_region,
    };

    const job_snapshot = {
        title: job.title,
        skills: job.skills,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        shift: job.shift,
        location_city: job.location_city,
        location_region: job.location_region,
    };

    return {
        overall_score,
        breakdown,
        match_reasons: aiInsights.match_reasons,
        concerns: aiInsights.concerns,
        ai_summary: aiInsights.summary,
        candidate_snapshot,
        job_snapshot,
        missing_skills,
    };
}

/**
 * Save or update a match in the database
 */
export async function saveJobMatch(
    candidateId: string,
    jobId: string,
    matchResult: MatchResult
): Promise<void> {
    const matchData = {
        candidate_id: candidateId,
        job_id: jobId,
        overall_score: matchResult.overall_score,
        breakdown: matchResult.breakdown,
        reasoning: matchResult.ai_summary,
        match_reasons: matchResult.match_reasons,
        concerns: matchResult.concerns,
        candidate_snapshot: matchResult.candidate_snapshot,
        job_snapshot: matchResult.job_snapshot,
        missing_skills: matchResult.missing_skills || [],
        is_stale: false,
        ai_provider: 'groq',
        analyzed_at: new Date().toISOString(),
        status: 'pending', // Default status
    };

    // Upsert (insert or update if exists)
    const { error } = await supabaseAdmin
        .from('job_matches')
        .upsert(matchData, {
            onConflict: 'candidate_id,job_id',
            ignoreDuplicates: false,
        });

    if (error) {
        console.error('Error saving job match:', error);
        throw new Error('Failed to save job match');
    }
}

/**
 * Get match for a specific candidate-job pair
 */
export async function getJobMatch(
    candidateId: string,
    jobId: string
): Promise<any | null> {
    const { data, error } = await supabaseAdmin
        .from('job_matches')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_id', jobId)
        .single();

    if (error || !data) return null;
    return data;
}

/**
 * Get all matches for a candidate
 */
export async function getCandidateMatches(
    candidateId: string
): Promise<any[]> {
    const { data, error } = await supabaseAdmin
        .from('job_matches')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('overall_score', { ascending: false });

    if (error) return [];
    return data || [];
}

/**
 * Check if candidate can refresh a match (1 per day limit)
 */
export async function canRefreshMatch(
    candidateId: string,
    jobId: string
): Promise<{ canRefresh: boolean; nextRefreshAt?: Date }> {
    const match = await getJobMatch(candidateId, jobId);

    if (!match || !match.last_refreshed_at) {
        return { canRefresh: true };
    }

    const lastRefresh = new Date(match.last_refreshed_at);
    const now = new Date();
    const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRefresh >= 24) {
        return { canRefresh: true };
    }

    const nextRefreshAt = new Date(lastRefresh.getTime() + 24 * 60 * 60 * 1000);
    return { canRefresh: false, nextRefreshAt };
}

/**
 * Refresh a match (recalculate and update)
 */
export async function refreshJobMatch(
    candidateId: string,
    jobId: string,
    candidate: CandidateData,
    job: JobData
): Promise<MatchResult> {
    // Check rate limit
    const { canRefresh, nextRefreshAt } = await canRefreshMatch(candidateId, jobId);

    if (!canRefresh) {
        throw new Error(`Cannot refresh yet. Next refresh available at ${nextRefreshAt?.toISOString()}`);
    }

    // Calculate new match
    const matchResult = await calculateJobMatch(candidate, job);

    // Update with refresh metadata
    const { error } = await supabaseAdmin
        .from('job_matches')
        .update({
            overall_score: matchResult.overall_score,
            breakdown: matchResult.breakdown,
            reasoning: matchResult.ai_summary,
            match_reasons: matchResult.match_reasons,
            concerns: matchResult.concerns,
            candidate_snapshot: matchResult.candidate_snapshot,
            job_snapshot: matchResult.job_snapshot,
            missing_skills: matchResult.missing_skills || [],
            is_stale: false,
            last_refreshed_at: new Date().toISOString(),
            analyzed_at: new Date().toISOString(),
            refresh_count: supabaseAdmin.raw('refresh_count + 1'),
        })
        .eq('candidate_id', candidateId)
        .eq('job_id', jobId);

    if (error) {
        throw new Error('Failed to refresh match');
    }

    return matchResult;
}

/**
 * Mark all matches for a candidate as stale
 * (called when candidate updates profile)
 */
export async function invalidateCandidateMatches(
    candidateId: string
): Promise<void> {
    await supabaseAdmin
        .from('job_matches')
        .update({ is_stale: true })
        .eq('candidate_id', candidateId);
}

/**
 * Mark all matches for a job as stale
 * (called when job is updated)
 */
export async function invalidateJobMatches(jobId: string): Promise<void> {
    await supabaseAdmin
        .from('job_matches')
        .update({ is_stale: true })
        .eq('job_id', jobId);
}
