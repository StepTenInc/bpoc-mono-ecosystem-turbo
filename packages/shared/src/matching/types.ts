/**
 * Job Matching Engine - Core Types
 * Defines interfaces for job matching system
 */

export interface MatchScoreBreakdown {
    skills_score: number;        // 0-100
    salary_score: number;        // 0-100
    experience_score: number;    // 0-100
    arrangement_score: number;   // 0-100
    shift_score: number;         // 0-100
    location_score: number;      // 0-100
    urgency_score: number;       // 0-100
}

export interface CandidateSkill {
    name: string;
    category?: string;
    proficiency_level?: number;  // 1-5
    years_experience?: number;
    is_primary?: boolean;
}

export interface WorkExperience {
    company_name: string;
    job_title: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    location?: string;
    description?: string;
}

export interface CandidateData {
    id: string;
    skills: CandidateSkill[];
    work_experiences: WorkExperience[];
    expected_salary_min?: number;
    expected_salary_max?: number;
    experience_years: number;
    preferred_shift?: 'day' | 'night' | 'flexible' | 'graveyard';
    preferred_work_setup?: 'remote' | 'onsite' | 'hybrid';
    work_status?: 'actively_looking' | 'open_to_offers' | 'employed_not_looking';
    location_city?: string;
    location_region?: string;
    location_country?: string;
}

export interface JobData {
    id: string;
    title: string;
    description: string;
    requirements?: string;
    salary_min?: number;
    salary_max?: number;
    currency: string;
    skills: string[];  // Required skill names
    work_arrangement?: 'remote' | 'onsite' | 'hybrid';
    shift?: 'day' | 'night' | 'both' | 'flexible';
    location_city?: string;
    location_region?: string;
    location_country?: string;
}

export interface MatchResult {
    overall_score: number;       // Weighted average 0-100
    breakdown: MatchScoreBreakdown;
    match_reasons: string[];     // Positive reasons
    concerns: string[];          // Potential issues
    ai_summary: string;          // AI-generated summary
    candidate_snapshot: Record<string, any>;
    job_snapshot: Record<string, any>;
    missing_skills?: string[];   // Skills candidate lacks
}

export interface JobMatch {
    id: string;
    candidate_id: string;
    job_id: string;
    overall_score: number;
    breakdown: MatchScoreBreakdown;
    reasoning: string;
    match_reasons: string[];
    concerns: string[];
    status: string;
    analyzed_at: string;
    last_refreshed_at?: string;
    is_stale: boolean;
    can_refresh: boolean;
    next_refresh_at?: string;
}
