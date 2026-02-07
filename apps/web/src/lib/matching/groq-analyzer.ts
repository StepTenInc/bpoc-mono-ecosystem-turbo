/**
 * Groq AI Analyzer
 * Enhances rule-based matching with AI-generated insights
 */

import Groq from 'groq-sdk';
import { CandidateData, JobData, MatchScoreBreakdown } from './types';

const groq = new Groq({
    apiKey: process.env.GROK_API_KEY || '',
});

interface GroqAnalysisResult {
    match_reasons: string[];
    concerns: string[];
    summary: string;
}

/**
 * Analyze match with Groq AI
 * Provides qualitative insights to complement quantitative scores
 */
export async function analyzeMatchWithGroq(
    candidate: CandidateData,
    job: JobData,
    scores: MatchScoreBreakdown
): Promise<GroqAnalysisResult> {
    try {
        const prompt = buildAnalysisPrompt(candidate, job, scores);

        const completion = await groq.chat.completions.create({
            model: 'mixtral-8x7b-32768', // Fast and cheap
            messages: [
                {
                    role: 'system',
                    content: 'You are a BPO recruitment expert. Analyze candidate-job matches concisely and return JSON only.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3, // Low temperature for consistent, factual output
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);

        return {
            match_reasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons.slice(0, 3) : [],
            concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 2) : [],
            summary: parsed.summary || 'Match analysis completed.',
        };
    } catch (error) {
        console.error('Groq analysis failed:', error);

        // Fallback to rule-based reasons
        return generateFallbackReasons(candidate, job, scores);
    }
}

/**
 * Build the prompt for Groq analysis
 */
function buildAnalysisPrompt(
    candidate: CandidateData,
    job: JobData,
    scores: MatchScoreBreakdown
): string {
    const candidateSkills = candidate.skills.map(s => s.name).join(', ');
    const jobSkills = job.skills.join(', ');

    const recentExperience = candidate.work_experiences
        .slice(0, 2)
        .map(exp => `${exp.job_title} at ${exp.company_name}`)
        .join('; ');

    return `Analyze this BPO candidate-job match. Provide 2-3 specific match reasons, 1-2 concerns, and a one-sentence summary.

CANDIDATE:
- Skills: ${candidateSkills || 'None listed'}
- Experience: ${candidate.experience_years} years
- Recent roles: ${recentExperience || 'None listed'}
- Salary expectation: ${candidate.expected_salary_min || 'N/A'}-${candidate.expected_salary_max || 'N/A'} PHP
- Work status: ${candidate.work_status || 'Unknown'}

JOB:
- Title: ${job.title}
- Required skills: ${jobSkills || 'None specified'}
- Salary range: ${job.salary_min || 'N/A'}-${job.salary_max || 'N/A'} ${job.currency}
- Arrangement: ${job.work_arrangement || 'Not specified'}

RULE-BASED SCORES:
- Skills: ${scores.skills_score}%
- Salary: ${scores.salary_score}%
- Experience: ${scores.experience_score}%
- Arrangement: ${scores.arrangement_score}%

Return JSON: {
  "match_reasons": ["Reason 1", "Reason 2", "Reason 3"],
  "concerns": ["Concern 1", "Concern 2"],
  "summary": "One sentence summary"
}`;
}

/**
 * Generate fallback reasons if Groq fails
 */
function generateFallbackReasons(
    candidate: CandidateData,
    job: JobData,
    scores: MatchScoreBreakdown
): GroqAnalysisResult {
    const reasons: string[] = [];
    const concerns: string[] = [];

    // Skills
    if (scores.skills_score >= 80) {
        reasons.push('Strong skill alignment with job requirements');
    } else if (scores.skills_score < 50) {
        concerns.push('Limited skill overlap with requirements');
    }

    // Salary
    if (scores.salary_score >= 85) {
        reasons.push('Salary expectations well-aligned with budget');
    } else if (scores.salary_score < 40) {
        concerns.push('Salary expectations may not align');
    }

    // Experience
    if (scores.experience_score >= 90) {
        reasons.push('Experience level is a perfect fit');
    } else if (scores.experience_score < 60) {
        if (candidate.experience_years < 2) {
            concerns.push('May be early in career for this role');
        } else {
            concerns.push('Experience level differs from typical requirements');
        }
    }

    // Work status
    if (candidate.work_status === 'actively_looking') {
        reasons.push('Actively seeking new opportunities');
    }

    // Default if nothing notable
    if (reasons.length === 0) {
        reasons.push('Candidate meets basic job requirements');
    }

    const summary = scores.skills_score >= 70
        ? 'Good potential match for this role'
        : 'Consider for roles requiring different skill sets';

    return {
        match_reasons: reasons.slice(0, 3),
        concerns: concerns.slice(0, 2),
        summary,
    };
}
