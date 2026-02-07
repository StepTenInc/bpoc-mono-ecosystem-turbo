// AI Integration for BPOC.IO Platform
// Using OpenAI GPT-4 for resume analysis and career advice

import OpenAI from 'openai';

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// AI Service for resume analysis, career advice, and matching
export class AIService {
  // Analyze resume content using OpenAI GPT-4
  static async analyzeResume(resumeContent: string): Promise<AIResponse> {
    if (!openai) {
      console.warn('[AI] No OPENAI_API_KEY found, using fallback analysis');
      return this.fallbackResumeAnalysis(resumeContent);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert BPO (Business Process Outsourcing) recruiter in the Philippines. Analyze resumes and provide constructive feedback focusing on:
- Overall quality score (0-100)
- Key strengths (4-6 points)
- Areas for improvement (3-5 points)
- Career recommendations (3-4 points)

Be specific, actionable, and encouraging. Focus on BPO industry standards in the Philippines.

Return ONLY valid JSON in this exact format:
{
  "overallScore": number,
  "strengths": string[],
  "improvements": string[],
  "recommendations": string[]
}`
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${resumeContent.substring(0, 4000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: {
          overallScore: result.overallScore || 75,
          strengths: result.strengths || [],
          improvements: result.improvements || [],
          recommendations: result.recommendations || []
        }
      };
    } catch (error) {
      console.error('[AI] Resume analysis error:', error);
      return this.fallbackResumeAnalysis(resumeContent);
    }
  }

  // Get personalized career advice
  static async getCareerAdvice(candidateProfile: any): Promise<AIResponse> {
    if (!openai) {
      console.warn('[AI] No OPENAI_API_KEY found, using fallback advice');
      return this.fallbackCareerAdvice(candidateProfile);
    }

    try {
      const profileSummary = `
Experience: ${candidateProfile.experienceYears || 0} years
Current Role: ${candidateProfile.currentRole || 'Not specified'}
Skills: ${(candidateProfile.skills || []).join(', ')}
Target Role: ${candidateProfile.targetRole || 'Not specified'}
Location: ${candidateProfile.location || 'Philippines'}
      `.trim();

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a career advisor specializing in BPO careers in the Philippines. Provide personalized career advice including:
- Next steps for career development (3-5 actionable items)
- Role recommendations (3-5 suitable positions)
- Salary projection (current range, potential range, and timeframe)

Be specific to the Philippine BPO market. Use PHP currency.

Return ONLY valid JSON in this exact format:
{
  "nextSteps": string[],
  "roleRecommendations": string[],
  "salaryProjection": {
    "current": string,
    "potential": string,
    "timeframe": string
  }
}`
          },
          {
            role: 'user',
            content: `Provide career advice for this candidate:\n\n${profileSummary}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[AI] Career advice error:', error);
      return this.fallbackCareerAdvice(candidateProfile);
    }
  }

  // Generate interview preparation content
  static async generateInterviewPrep(role: string, industry: string): Promise<AIResponse> {
    if (!openai) {
      console.warn('[AI] No OPENAI_API_KEY found, using fallback prep');
      return this.fallbackInterviewPrep(role, industry);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an interview coach specializing in BPO roles in the Philippines. Generate interview preparation content including:
- Common interview questions (4-6 questions)
- Interview tips (4-6 practical tips)

Be specific to the role and industry.

Return ONLY valid JSON in this exact format:
{
  "commonQuestions": string[],
  "tips": string[]
}`
          },
          {
            role: 'user',
            content: `Generate interview prep for:\nRole: ${role}\nIndustry: ${industry}`
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[AI] Interview prep error:', error);
      return this.fallbackInterviewPrep(role, industry);
    }
  }

  // Analyze skill gaps
  static async analyzeSkillGaps(currentSkills: string[], targetRole: string): Promise<AIResponse> {
    if (!openai) {
      console.warn('[AI] No OPENAI_API_KEY found, using fallback skill analysis');
      return this.fallbackSkillGaps(currentSkills, targetRole);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a skills development advisor for BPO professionals. Analyze skill gaps and provide:
- Skill gaps (2-4 gaps)
- Each gap should include: skillName, importance (1-10), currentLevel (1-5), targetLevel (1-5), and suggestions (2-4 items)

Return ONLY valid JSON in this exact format:
{
  "gaps": [
    {
      "skillName": string,
      "importance": number,
      "currentLevel": number,
      "targetLevel": number,
      "suggestions": string[]
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Analyze skill gaps:\nCurrent Skills: ${currentSkills.join(', ')}\nTarget Role: ${targetRole}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[AI] Skill gaps error:', error);
      return this.fallbackSkillGaps(currentSkills, targetRole);
    }
  }

  // Generate improvement suggestions for resume sections
  static async generateImprovementSuggestions(resumeSection: string, content: string): Promise<AIResponse> {
    if (!openai) {
      console.warn('[AI] No OPENAI_API_KEY found, using fallback suggestions');
      return this.fallbackImprovementSuggestions(resumeSection);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a resume improvement expert for BPO professionals. Provide specific, actionable suggestions (3-5 items) for improving the given resume section.

Return ONLY valid JSON in this exact format:
{
  "suggestions": string[]
}`
          },
          {
            role: 'user',
            content: `Improve this ${resumeSection} section:\n\n${content.substring(0, 1000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[AI] Improvement suggestions error:', error);
      return this.fallbackImprovementSuggestions(resumeSection);
    }
  }

  // Match candidate to jobs using AI
  static async matchCandidateToJobs(candidateProfile: any, jobs: any[]): Promise<AIResponse> {
    if (!openai || !jobs || jobs.length === 0) {
      console.warn('[AI] No OPENAI_API_KEY or jobs found, using fallback matching');
      return this.fallbackJobMatching();
    }

    try {
      const profileSummary = `
Skills: ${(candidateProfile.skills || []).join(', ')}
Experience: ${candidateProfile.experienceYears || 0} years
Location: ${candidateProfile.location || 'Not specified'}
Expected Salary: ${candidateProfile.expectedSalary || 'Not specified'}
      `.trim();

      const jobsSummary = jobs.slice(0, 10).map((job, i) => `
Job ${i + 1}:
- Title: ${job.title}
- Company: ${job.company}
- Salary: ${job.salaryRange || 'Not specified'}
- Location: ${job.location || 'Not specified'}
- Requirements: ${(job.requiredSkills || []).join(', ')}
      `).join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI job matching system for BPO recruitment. Analyze candidate-job fit and return top 2-3 matches with scores and reasons.

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "jobTitle": string,
      "company": string,
      "matchScore": number (0-100),
      "salaryRange": string,
      "location": string,
      "matchReasons": string[] (3-5 reasons)
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Match this candidate:\n${profileSummary}\n\nTo these jobs:\n${jobsSummary}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[AI] Job matching error:', error);
      return this.fallbackJobMatching();
    }
  }

  // Fallback methods when OpenAI is not available
  private static fallbackResumeAnalysis(resumeContent: string): AIResponse {
    const wordCount = resumeContent.split(/\s+/).length;
    const hasContact = /email|phone|contact/i.test(resumeContent);
    const hasExperience = /experience|worked|position/i.test(resumeContent);
    const hasSkills = /skills|proficient|expertise/i.test(resumeContent);

    const score = 50 + (wordCount > 100 ? 10 : 0) + (hasContact ? 10 : 0) + (hasExperience ? 15 : 0) + (hasSkills ? 15 : 0);

    return {
      success: true,
      data: {
        overallScore: Math.min(score, 95),
        strengths: [
          'Resume structure is clear and organized',
          hasExperience ? 'Relevant work experience documented' : 'Professional format maintained',
          hasSkills ? 'Key skills highlighted effectively' : 'Good use of formatting'
        ],
        improvements: [
          'Add specific metrics and achievements',
          'Include industry-specific keywords',
          'Expand on technical competencies'
        ],
        recommendations: [
          'Obtain relevant certifications',
          'Build portfolio of work examples',
          'Network with industry professionals'
        ]
      }
    };
  }

  private static fallbackCareerAdvice(profile: any): AIResponse {
    return {
      success: true,
      data: {
        nextSteps: [
          'Complete additional BPO certifications',
          'Build portfolio of successful projects',
          'Develop leadership and mentoring skills',
          'Explore specialization in high-growth areas'
        ],
        roleRecommendations: [
          'Senior Customer Service Representative',
          'Team Lead / Supervisor',
          'Training Specialist',
          'Quality Assurance Analyst'
        ],
        salaryProjection: {
          current: 'PHP 25,000 - 35,000',
          potential: 'PHP 35,000 - 50,000',
          timeframe: '6-12 months'
        }
      }
    };
  }

  private static fallbackInterviewPrep(role: string, industry: string): AIResponse {
    return {
      success: true,
      data: {
        commonQuestions: [
          'Tell me about yourself and your experience',
          'Why are you interested in this role?',
          'Describe a challenging situation you handled',
          'What are your strengths and weaknesses?'
        ],
        tips: [
          'Research the company before the interview',
          'Prepare specific examples from your experience',
          'Practice answering common questions',
          'Ask thoughtful questions about the role'
        ]
      }
    };
  }

  private static fallbackSkillGaps(currentSkills: string[], targetRole: string): AIResponse {
    return {
      success: true,
      data: {
        gaps: [
          {
            skillName: 'Advanced Communication Skills',
            importance: 8,
            currentLevel: 3,
            targetLevel: 5,
            suggestions: [
              'Take professional communication courses',
              'Practice presentation skills',
              'Join speaking clubs or groups'
            ]
          }
        ]
      }
    };
  }

  private static fallbackImprovementSuggestions(section: string): AIResponse {
    const suggestions: Record<string, string[]> = {
      workExperience: [
        'Add specific metrics and KPIs achieved',
        'Include quantifiable results',
        'Mention team size or scope of responsibility',
        'Highlight key accomplishments'
      ],
      skills: [
        'Add technical skills relevant to your industry',
        'Include proficiency levels',
        'Mention software and tools expertise',
        'Add relevant certifications'
      ],
      summary: [
        'Start with years of experience and key strength',
        'Include quantifiable achievements',
        'Mention industry specializations',
        'End with career objective'
      ]
    };

    return {
      success: true,
      data: { suggestions: suggestions[section] || suggestions.summary }
    };
  }

  private static fallbackJobMatching(): AIResponse {
    return {
      success: true,
      data: {
        matches: [
          {
            jobTitle: 'Customer Service Representative',
            company: 'Available Position',
            matchScore: 75,
            salaryRange: 'PHP 25,000 - 35,000',
            location: 'Philippines',
            matchReasons: [
              'Skills alignment with role requirements',
              'Experience level matches position',
              'Location preference compatible'
            ]
          }
        ]
      }
    };
  }
}

// Helper functions for AI integration
export const aiHelpers = {
  formatResponse: (response: any): string => {
    if (typeof response === 'string') return response;
    if (Array.isArray(response)) return response.join('\n');
    return JSON.stringify(response, null, 2);
  },

  extractInsights: (analysis: any): string[] => {
    const insights: string[] = [];

    if (analysis.strengths) {
      insights.push(...analysis.strengths.map((s: string) => `✅ ${s}`));
    }

    if (analysis.improvements) {
      insights.push(...analysis.improvements.map((i: string) => `🔄 ${i}`));
    }

    return insights;
  },

  calculateConfidence: (score: number): { level: string; color: string } => {
    if (score >= 90) return { level: 'Excellent', color: 'text-neon-green' };
    if (score >= 80) return { level: 'Good', color: 'text-cyber-blue' };
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-400' };
    if (score >= 60) return { level: 'Needs Improvement', color: 'text-orange-400' };
    return { level: 'Poor', color: 'text-red-400' };
  }
}; 