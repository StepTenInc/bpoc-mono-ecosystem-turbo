/**
 * Job Matching Engine - Core Scoring Logic
 * Rule-based matching algorithm without AI dependency
 */

import { CandidateData, JobData, MatchScoreBreakdown } from './types';

/**
 * Calculate skills match score
 * Weight: 40% of overall score
 */
export function calculateSkillsScore(
    candidate: CandidateData,
    job: JobData
): number {
    if (!job.skills || job.skills.length === 0) {
        return 100; // No skills required = perfect match
    }

    const candidateSkillNames = new Set(
        candidate.skills.map(s => s.name.toLowerCase())
    );

    let matchingSkills = 0;
    let totalProficiency = 0;
    let matchedSkillCount = 0;

    for (const requiredSkill of job.skills) {
        const skillLower = requiredSkill.toLowerCase();

        if (candidateSkillNames.has(skillLower)) {
            matchingSkills++;

            // Find the skill in candidate's skills to get proficiency
            const candidateSkill = candidate.skills.find(
                s => s.name.toLowerCase() === skillLower
            );

            if (candidateSkill) {
                const proficiency = candidateSkill.proficiency_level || 3; // Default to mid-level
                totalProficiency += proficiency;
                matchedSkillCount++;
            }
        }
    }

    // Base score: percentage of skills matched
    const coverageScore = (matchingSkills / job.skills.length) * 100;

    // Proficiency bonus: average proficiency of matched skills (1-5 scale)
    let proficiencyBonus = 0;
    if (matchedSkillCount > 0) {
        const avgProficiency = totalProficiency / matchedSkillCount;
        proficiencyBonus = ((avgProficiency - 3) / 2) * 10; // -10 to +10
    }

    const finalScore = Math.min(100, Math.max(0, coverageScore + proficiencyBonus));
    return Math.round(finalScore);
}

/**
 * Calculate salary compatibility score
 * Weight: 30% of overall score
 */
export function calculateSalaryScore(
    candidate: CandidateData,
    job: JobData
): number {
    // If no salary expectations or no job salary, assume compatibility
    if (!candidate.expected_salary_min && !candidate.expected_salary_max) {
        return 85; // Neutral good score
    }

    if (!job.salary_min && !job.salary_max) {
        return 85; // Neutral good score
    }

    const candMin = candidate.expected_salary_min || 0;
    const candMax = candidate.expected_salary_max || candMin * 1.3; // Estimate if not provided
    const jobMin = job.salary_min || 0;
    const jobMax = job.salary_max || jobMin * 1.3;

    // DEAL BREAKER: Candidate minimum exceeds job maximum
    if (candMin > jobMax && jobMax > 0) {
        return 15; // Major mismatch
    }

    // UNDERPAID: Candidate expectations below job minimum (they're undervaluing)
    if (candMax < jobMin && jobMin > 0) {
        return 70; // Still a match, but candidate might be surprised
    }

    // Calculate overlap percentage
    const overlapMin = Math.max(candMin, jobMin);
    const overlapMax = Math.min(candMax, jobMax);

    if (overlapMax >= overlapMin) {
        const overlapRange = overlapMax - overlapMin;
        const candidateRange = candMax - candMin;
        const jobRange = jobMax - jobMin;

        const avgRange = (candidateRange + jobRange) / 2;
        const overlapPercentage = avgRange > 0 ? (overlapRange / avgRange) * 100 : 100;

        // Score between 85-100 based on overlap
        return Math.round(85 + (overlapPercentage / 100) * 15);
    }

    // No overlap but close
    const gap = Math.min(
        Math.abs(candMin - jobMax),
        Math.abs(jobMin - candMax)
    );

    const avgSalary = (candMin + candMax + jobMin + jobMax) / 4;
    const gapPercentage = (gap / avgSalary) * 100;

    if (gapPercentage < 10) return 75;
    if (gapPercentage < 20) return 60;
    if (gapPercentage < 30) return 45;
    return 30;
}

/**
 * Calculate experience level match
 * Weight: 15% of overall score
 */
export function calculateExperienceScore(
    candidate: CandidateData,
    job: JobData
): number {
    // Extract seniority level from job title
    const titleLower = job.title.toLowerCase();
    let requiredYears = 3; // Default mid-level

    if (titleLower.includes('junior') || titleLower.includes('entry')) {
        requiredYears = 1;
    } else if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
        requiredYears = 5;
    } else if (titleLower.includes('mid') || titleLower.includes('intermediate')) {
        requiredYears = 3;
    }

    const candidateYears = candidate.experience_years;
    const diff = Math.abs(candidateYears - requiredYears);

    // Perfect match: within 2 years
    if (diff <= 2) return 100;

    // Overqualified (too much experience for junior role)
    if (candidateYears > requiredYears + 2) {
        if (titleLower.includes('junior')) {
            return 60; // Senior person for junior role - might leave
        }
        return 85; // Generally good but might be overqualified
    }

    // Underqualified
    if (candidateYears < requiredYears - 2) {
        const gap = requiredYears - candidateYears;
        if (gap <= 1) return 80;
        if (gap <= 2) return 60;
        if (gap <= 3) return 40;
        return 25;
    }

    return 90;
}

/**
 * Calculate work arrangement compatibility
 * Weight: 10% of overall score
 */
export function calculateArrangementScore(
    candidate: CandidateData,
    job: JobData
): number {
    if (!candidate.preferred_work_setup || !job.work_arrangement) {
        return 80; // Neutral if not specified
    }

    const candPref = candidate.preferred_work_setup.toLowerCase();
    const jobArrangement = job.work_arrangement.toLowerCase();

    // Perfect match
    if (candPref === jobArrangement) return 100;

    // Flexible arrangements
    if (candPref === 'hybrid' || jobArrangement === 'hybrid') return 85;

    // Remote candidate, onsite job = mismatch
    if (candPref === 'remote' && jobArrangement === 'onsite') return 30;

    // Onsite candidate, remote job = usually okay
    if (candPref === 'onsite' && jobArrangement === 'remote') return 70;

    return 60;
}

/**
 * Calculate shift preference compatibility score
 * Weight: 5% of overall score
 */
export function calculateShiftCompatibility(
    candidate: CandidateData,
    job: JobData
): number {
    if (!candidate.preferred_shift || !job.shift) {
        return 80; // Neutral if not specified
    }

    const candShift = candidate.preferred_shift.toLowerCase();
    const jobShift = job.shift.toLowerCase();

    // Perfect match: same shift preference
    if (candShift === jobShift) return 100;

    // Flexible candidate: can work any shift
    if (candShift === 'flexible') return 90;

    // Job offers flexibility or both shifts
    if (jobShift === 'flexible' || jobShift === 'both') return 90;

    // Day candidate + night job: significant mismatch
    if (candShift === 'day' && (jobShift === 'night' || jobShift === 'graveyard')) {
        return 30;
    }

    // Night/graveyard candidate + day job: moderate compatibility
    if ((candShift === 'night' || candShift === 'graveyard') && jobShift === 'day') {
        return 50;
    }

    // Default: some compatibility
    return 60;
}

/**
 * Calculate location compatibility score
 * Weight: 5% of overall score
 */
export function calculateLocationCompatibility(
    candidate: CandidateData,
    job: JobData
): number {
    // If job is remote, location doesn't matter much
    if (job.work_arrangement === 'remote') return 90;

    // If no location data available, assume moderate compatibility
    if (!candidate.location_city && !candidate.location_region) {
        return 70;
    }

    // For hybrid/onsite jobs, location matters
    const candCity = candidate.location_city?.toLowerCase() || '';
    const candRegion = candidate.location_region?.toLowerCase() || '';
    const jobCity = job.location_city?.toLowerCase() || '';
    const jobRegion = job.location_region?.toLowerCase() || '';

    // Same city: perfect match
    if (candCity && jobCity && candCity === jobCity) return 100;

    // Same region: good match
    if (candRegion && jobRegion && candRegion === jobRegion) return 80;

    // Different city + onsite job: poor match
    if (job.work_arrangement === 'onsite' && candCity && jobCity && candCity !== jobCity) {
        return 40;
    }

    // Hybrid arrangement: more forgiving
    if (job.work_arrangement === 'hybrid') return 70;

    // Default: moderate compatibility
    return 60;
}

/**
 * Calculate urgency bonus
 * Weight: 5% of overall score (adjusted down from previous allocation)
 */
export function calculateUrgencyScore(candidate: CandidateData): number {
    const baseScore = 50; // Neutral

    if (candidate.work_status === 'actively_looking') {
        return baseScore + 50; // 100
    } else if (candidate.work_status === 'open_to_offers') {
        return baseScore + 20; // 70
    } else if (candidate.work_status === 'employed_not_looking') {
        return baseScore - 20; // 30
    }

    return baseScore;
}

/**
 * Calculate overall weighted score
 * Updated weights to include shift and location compatibility
 */
export function calculateOverallScore(breakdown: MatchScoreBreakdown): number {
    const weights = {
        skills: 0.35,          // Reduced from 40%
        salary: 0.25,          // Reduced from 30%
        experience: 0.15,      // Same
        arrangement: 0.10,     // Same
        shift: 0.05,           // New
        location: 0.05,        // New
        urgency: 0.05,         // Same
    };

    const score =
        breakdown.skills_score * weights.skills +
        breakdown.salary_score * weights.salary +
        breakdown.experience_score * weights.experience +
        breakdown.arrangement_score * weights.arrangement +
        breakdown.shift_score * weights.shift +
        breakdown.location_score * weights.location +
        breakdown.urgency_score * weights.urgency;

    return Math.round(score);
}

/**
 * Main function: Calculate all scores for a candidate-job pair
 */
export function calculateMatchScores(
    candidate: CandidateData,
    job: JobData
): MatchScoreBreakdown {
    return {
        skills_score: calculateSkillsScore(candidate, job),
        salary_score: calculateSalaryScore(candidate, job),
        experience_score: calculateExperienceScore(candidate, job),
        arrangement_score: calculateArrangementScore(candidate, job),
        shift_score: calculateShiftCompatibility(candidate, job),
        location_score: calculateLocationCompatibility(candidate, job),
        urgency_score: calculateUrgencyScore(candidate),
    };
}
