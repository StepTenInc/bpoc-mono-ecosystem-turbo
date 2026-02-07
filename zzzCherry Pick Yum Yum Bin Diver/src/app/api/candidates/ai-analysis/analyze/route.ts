import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCandidateById } from '@/lib/db/candidates';
import { syncAllFromAnalysis } from '@/lib/db/candidates/sync-from-analysis';
import { getResumeByCandidateId } from '@/lib/db/resumes';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/candidates/ai-analysis/analyze
 * Perform AI analysis on extracted resume data using Claude
 * Then save to candidate_ai_analysis and sync to structured tables
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/candidates/ai-analysis/analyze] Starting...');
    
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const userId = request.headers.get('x-user-id') || null;

    // For anonymous users, allow analysis but skip candidate lookup and DB persistence
    let candidate: any = null;
    if (userId) {
      candidate = await getCandidateById(userId, true);
      if (!candidate) {
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
    }

    const { resumeData, candidateId, originalFileName } = await request.json();

    if (!resumeData) {
      return NextResponse.json({ error: 'No resume data provided' }, { status: 400 });
    }

    // Extract bestJobTitle from resume data if not already present
    if (!resumeData.bestJobTitle && !resumeData.position) {
      // Try to get it from the most recent work experience
      if (resumeData.experience && Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
        // Get the first (most recent) experience entry
        const mostRecentExp = resumeData.experience[0];
        resumeData.bestJobTitle = mostRecentExp.title || mostRecentExp.position || mostRecentExp.jobTitle || null;
        console.log('📝 Extracted bestJobTitle from experience for AI analysis:', resumeData.bestJobTitle);
      }
      
      // If still not found, try to extract from parsed personalInfo
      if (!resumeData.bestJobTitle && resumeData.parsed?.personalInfo?.title) {
        resumeData.bestJobTitle = resumeData.parsed.personalInfo.title;
        console.log('📝 Extracted bestJobTitle from personalInfo for AI analysis:', resumeData.bestJobTitle);
      }
    }

    console.log('🤖 Starting AI analysis for candidate:', userId);

    // Prepare resume text for analysis
    const resumeText = formatResumeForAnalysis(resumeData);
    
    // Check if we have Claude API key (use CLAUDE_API_KEY from env)
    const anthropicApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    let analysis: any;
    let improvedResume: any;
    let skillsSnapshot: any[] = [];
    let experienceSnapshot: any[] = [];
    let educationSnapshot: any[] = [];

    if (anthropicApiKey) {
      // Perform real Claude AI analysis
      console.log('🧠 Calling Claude API for analysis...');
      
      try {
        const anthropic = new Anthropic({
          apiKey: anthropicApiKey,
        });

        const aiResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `You are analyzing a resume for the BPO (Business Process Outsourcing) industry in the Philippines.

CONTEXT:
- Target Industry: BPO / Remote Virtual Work for international clients
- Common Roles: Customer Service Representative, Sales Representative, Technical Support, Virtual Assistant, Admin Support, Data Entry, Web Development, Graphic Design, Content Moderation
- Key Requirements: English proficiency, communication skills, tech tools (Zendesk, Salesforce, Slack, MS Office, CRM systems), client-facing experience, remote work capability
- Candidate Level: Entry to mid-level professionals (NOT C-suite executives)
- Focus: Measurable achievements, KPIs, customer satisfaction scores, call metrics, sales targets, typing speed (WPM), productivity metrics

DO NOT expect or penalize for lack of:
- Executive leadership experience
- Management of large teams  
- Corporate strategy roles
- Advanced degrees for entry-level positions

DO reward and look for:
- Clear communication skills (grammar, English proficiency)
- Quantifiable metrics (e.g., "Handled 50+ calls per day with 95% satisfaction", "Achieved 120% of monthly sales quota")
- BPO-relevant tools and software (Zendesk, Freshdesk, Salesforce, HubSpot, Zoom, Slack, Asana, Google Workspace, MS Office)
- Customer service or client-facing experience
- Remote/work-from-home experience
- Achievements with numbers (call handling time, response time, accuracy rates, customer retention)
- Soft skills: patience, empathy, problem-solving, adaptability
- Certifications relevant to BPO (e.g., ITIL, customer service training, typing certificates)

SCORES (0-100):
1. overall_score - Overall resume quality FOR BPO ROLES
2. ats_compatibility_score - ATS keyword matching for BPO job descriptions
3. content_quality_score - Quality of descriptions with measurable BPO-relevant achievements
4. professional_presentation_score - Professional formatting (clear, scannable, ATS-friendly)
5. skills_alignment_score - How well skills match BPO industry requirements

ANALYSIS:
6. key_strengths - Array of main strengths (focus on BPO-relevant strengths)
7. strengths_analysis - Detailed analysis of each strength (how it applies to BPO)
8. improvements - Areas needing improvement (specific to BPO industry standards)
9. recommendations - Actionable recommendations (how to improve for BPO roles)
10. section_analysis - Analyze each section (summary, experience, education, skills) with BPO lens
11. improved_summary - Enhanced professional summary tailored for BPO industry

CAREER INSIGHTS:
12. salary_analysis - Object with {current_range, market_range, recommendations}
13. career_path - Object with {current_level, next_steps, growth_path, timeline}

EXTRACTED DATA:
14. skills - Array of {name, category, proficiency_level}
15. experience - Array of work experiences
16. education - Array of education entries
17. improved_resume - Enhanced resume content

Resume:
${resumeText}

Respond in this exact JSON format:
{
  "overall_score": number,
  "ats_compatibility_score": number,
  "content_quality_score": number,
  "professional_presentation_score": number,
  "skills_alignment_score": number,
  "key_strengths": ["string"],
  "strengths_analysis": {"strength1": "detailed analysis", "strength2": "..."},
  "improvements": ["string"],
  "recommendations": ["string"],
  "section_analysis": {
    "summary": "analysis",
    "experience": "analysis",
    "education": "analysis",
    "skills": "analysis"
  },
  "improved_summary": "string",
  "salary_analysis": {
    "current_range": "string",
    "market_range": "string",
    "recommendations": "string"
  },
  "career_path": {
    "current_level": "string",
    "next_steps": ["string"],
    "growth_path": "string",
    "timeline": "string"
  },
  "skills": [{"name": "string", "category": "technical|soft|language", "proficiency_level": "beginner|intermediate|advanced|expert"}],
  "experience": [{"company": "string", "title": "string", "location": "string", "start_date": "string", "end_date": "string", "description": "string", "achievements": ["string"]}],
  "education": [{"institution": "string", "degree": "string", "field_of_study": "string", "start_date": "string", "end_date": "string", "grade": "string"}],
  "improved_resume": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "bestJobTitle": "string",
    "summary": "string",
    "experience": [...],
    "education": [...],
    "skills": {"technical": [...], "soft": [...], "languages": [...]},
    "achievements": [...],
    "certifications": [...]
  }
}`
            }
          ]
        });

        // Parse Claude response
        const responseText = aiResponse.content[0].type === 'text' 
          ? aiResponse.content[0].text 
          : '';
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          analysis = {
            overallScore: parsedResponse.overall_score || 75,
            atsCompatibility: parsedResponse.ats_compatibility_score || 70,
            contentQuality: parsedResponse.content_quality_score || 70,
            professionalPresentation: parsedResponse.professional_presentation_score || 70,
            skillsAlignmentScore: parsedResponse.skills_alignment_score || 70,
            keyStrengths: parsedResponse.key_strengths || [],
            strengthsAnalysis: parsedResponse.strengths_analysis || {},
            improvements: parsedResponse.improvements || [],
            recommendations: parsedResponse.recommendations || [],
            sectionAnalysis: parsedResponse.section_analysis || {},
            improvedSummary: parsedResponse.improved_summary || resumeData.summary || '',
            salaryAnalysis: parsedResponse.salary_analysis || null,
            careerPath: parsedResponse.career_path || null,
          };
          
          improvedResume = parsedResponse.improved_resume || enhanceResumeData(resumeData, analysis);
          skillsSnapshot = parsedResponse.skills || extractSkillsFromResume(resumeData);
          experienceSnapshot = parsedResponse.experience || resumeData.experience || [];
          educationSnapshot = parsedResponse.education || resumeData.education || [];
          
          console.log('✅ Claude analysis complete');
        } else {
          throw new Error('Could not parse Claude response');
        }
      } catch (claudeError) {
        console.warn('⚠️ Claude API error, using fallback:', claudeError);
        // Use fallback analysis
        const fallback = generateFallbackAnalysis(resumeData, candidate);
        analysis = fallback.analysis;
        improvedResume = fallback.improvedResume;
        skillsSnapshot = fallback.skills;
        experienceSnapshot = fallback.experience;
        educationSnapshot = fallback.education;
      }
    } else {
      console.log('ℹ️ No Claude API key, using enhanced fallback analysis');
      // Use fallback analysis
      const fallback = generateFallbackAnalysis(resumeData, candidate);
      analysis = fallback.analysis;
      improvedResume = fallback.improvedResume;
      skillsSnapshot = fallback.skills;
      experienceSnapshot = fallback.experience;
      educationSnapshot = fallback.education;
    }

    // Generate session ID (supports anonymous)
    const sessionId = `analysis-${userId || 'anon'}-${Date.now()}`;

    // Get resume_id if candidate exists
    let resumeId: string | null = null;
    if (userId) {
      try {
        const resume = await getResumeByCandidateId(userId);
        resumeId = resume?.id || null;
        console.log('📄 Resume ID found:', resumeId);
      } catch (error) {
        console.warn('⚠️ Could not fetch resume_id:', error);
      }
    }

    // Extract portfolio links and files analyzed from resume data
    const portfolioLinks = extractPortfolioLinks(resumeData);
    const filesAnalyzed = extractFilesAnalyzed(resumeData, originalFileName);

    let savedToDatabase = false;

    if (userId) {
      // Save to candidate_ai_analysis table
      console.log('💾 Saving AI analysis to candidate_ai_analysis...');
      
      const { error: analysisError } = await supabaseAdmin
        .from('candidate_ai_analysis')
        .insert({
          candidate_id: userId,
          resume_id: resumeId,
          session_id: sessionId,
          overall_score: analysis.overallScore,
          ats_compatibility_score: analysis.atsCompatibility,
          content_quality_score: analysis.contentQuality,
          professional_presentation_score: analysis.professionalPresentation,
          skills_alignment_score: analysis.skillsAlignmentScore || null,
          key_strengths: analysis.keyStrengths,
          strengths_analysis: analysis.strengthsAnalysis || {},
          improvements: analysis.improvements,
          recommendations: analysis.recommendations,
          section_analysis: analysis.sectionAnalysis || {},
          improved_summary: analysis.improvedSummary,
          salary_analysis: analysis.salaryAnalysis,
          career_path: analysis.careerPath,
          portfolio_links: portfolioLinks,
          files_analyzed: filesAnalyzed,
          skills_snapshot: skillsSnapshot,
          experience_snapshot: experienceSnapshot,
          education_snapshot: educationSnapshot,
          candidate_profile_snapshot: {
            name: resumeData.name,
            email: resumeData.email,
            phone: resumeData.phone,
            bestJobTitle: resumeData.bestJobTitle,
          },
          analysis_metadata: {
            analyzed_at: new Date().toISOString(),
            model_used: anthropicApiKey ? 'claude-sonnet-4-5-20250929' : 'fallback',
            source: 'dashboard-resume-builder',
          },
        });

      if (analysisError) {
        console.error('❌ Error saving AI analysis:', analysisError);
      } else {
        savedToDatabase = true;

        // Sync to structured tables (non-blocking)
        console.log('🔄 Syncing to structured tables...');
        console.log('📊 Snapshot data:', {
          skillsCount: Array.isArray(skillsSnapshot) ? skillsSnapshot.length : 0,
          experienceCount: Array.isArray(experienceSnapshot) ? experienceSnapshot.length : 0,
          educationCount: Array.isArray(educationSnapshot) ? educationSnapshot.length : 0,
          skillsSample: Array.isArray(skillsSnapshot) && skillsSnapshot.length > 0 ? skillsSnapshot[0] : null,
          experienceSample: Array.isArray(experienceSnapshot) && experienceSnapshot.length > 0 ? experienceSnapshot[0] : null,
          educationSample: Array.isArray(educationSnapshot) && educationSnapshot.length > 0 ? educationSnapshot[0] : null,
        });
        try {
          await syncAllFromAnalysis(userId, {
            skills_snapshot: skillsSnapshot,
            experience_snapshot: experienceSnapshot,
            education_snapshot: educationSnapshot,
          });
          console.log('✅ Structured data synced successfully');
        } catch (syncError) {
          console.error('❌ Error syncing structured data:', syncError);
          // Log the full error details
          if (syncError instanceof Error) {
            console.error('Error message:', syncError.message);
            console.error('Error stack:', syncError.stack);
          }
          // Don't throw - allow analysis to succeed even if sync fails
          // But log it prominently so we can debug
        }
      }
    }

    console.log('✅ AI analysis complete for candidate:', userId || 'anonymous');

    return NextResponse.json({
      success: true,
      message: 'AI analysis completed successfully',
      analysis: analysis,
      improvedResume: improvedResume,
      savedToDatabase,
      sessionId,
    });

  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform AI analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Format resume data as text for Claude analysis
 */
function formatResumeForAnalysis(resumeData: any): string {
  const sections = [];
  
  if (resumeData.name) sections.push(`Name: ${resumeData.name}`);
  if (resumeData.email) sections.push(`Email: ${resumeData.email}`);
  if (resumeData.phone) sections.push(`Phone: ${resumeData.phone}`);
  if (resumeData.bestJobTitle) sections.push(`Current Title: ${resumeData.bestJobTitle}`);
  
  if (resumeData.summary) {
    sections.push(`\nProfessional Summary:\n${resumeData.summary}`);
  }
  
  if (resumeData.experience?.length) {
    sections.push('\nWork Experience:');
    resumeData.experience.forEach((exp: any) => {
      sections.push(`\n- ${exp.title || exp.position} at ${exp.company}`);
      if (exp.location) sections.push(`  Location: ${exp.location}`);
      if (exp.dates || exp.start_date) sections.push(`  Dates: ${exp.dates || `${exp.start_date} - ${exp.end_date || 'Present'}`}`);
      if (exp.description) sections.push(`  ${exp.description}`);
      if (exp.achievements?.length) {
        sections.push('  Achievements:');
        exp.achievements.forEach((a: string) => sections.push(`    • ${a}`));
      }
    });
  }
  
  if (resumeData.education?.length) {
    sections.push('\nEducation:');
    resumeData.education.forEach((edu: any) => {
      sections.push(`\n- ${edu.degree || edu.qualification} at ${edu.institution || edu.school}`);
      if (edu.field_of_study || edu.major) sections.push(`  Field: ${edu.field_of_study || edu.major}`);
      if (edu.graduation_date || edu.end_date) sections.push(`  Graduated: ${edu.graduation_date || edu.end_date}`);
    });
  }
  
  if (resumeData.skills) {
    sections.push('\nSkills:');
    if (resumeData.skills.technical?.length) {
      sections.push(`Technical: ${resumeData.skills.technical.join(', ')}`);
    }
    if (resumeData.skills.soft?.length) {
      sections.push(`Soft Skills: ${resumeData.skills.soft.join(', ')}`);
    }
    if (resumeData.skills.languages?.length) {
      sections.push(`Languages: ${resumeData.skills.languages.join(', ')}`);
    }
  }
  
  if (resumeData.certifications?.length) {
    sections.push('\nCertifications:');
    resumeData.certifications.forEach((cert: any) => {
      sections.push(`- ${typeof cert === 'string' ? cert : cert.name || cert.title}`);
    });
  }
  
  return sections.join('\n');
}

/**
 * Generate fallback analysis when Claude API is not available
 */
function generateFallbackAnalysis(resumeData: any, candidate: any) {
  const hasExperience = resumeData.experience?.length > 0;
  const hasEducation = resumeData.education?.length > 0;
  const hasSkills = resumeData.skills && (
    resumeData.skills.technical?.length > 0 || 
    resumeData.skills.soft?.length > 0
  );
  
  // Calculate scores based on content completeness
  let overallScore = 50;
  if (hasExperience) overallScore += 15;
  if (hasEducation) overallScore += 10;
  if (hasSkills) overallScore += 10;
  if (resumeData.summary) overallScore += 10;
  if (resumeData.certifications?.length > 0) overallScore += 5;
  
  const analysis = {
    overallScore: Math.min(overallScore, 100),
    atsCompatibility: hasSkills ? 80 : 60,
    contentQuality: hasExperience ? 75 : 55,
    professionalPresentation: resumeData.summary ? 80 : 60,
    skillsAlignmentScore: hasSkills ? 75 : 60,
    strengthsAnalysis: {
      experience: hasExperience ? `${resumeData.experience.length} position(s) of relevant experience` : 'Limited work experience',
      education: hasEducation ? 'Educational background included' : 'Education section could be enhanced',
      skills: hasSkills ? 'Skills section present' : 'Skills section needs improvement',
      summary: resumeData.summary ? 'Professional summary included' : 'Missing professional summary',
    },
    sectionAnalysis: {
      summary: resumeData.summary ? 'Summary present but could be more impactful' : 'Summary missing - add a compelling professional summary',
      experience: hasExperience ? 'Experience section is present' : 'Experience section needs content',
      education: hasEducation ? 'Education section is present' : 'Education section could be enhanced',
      skills: hasSkills ? 'Skills section is present' : 'Skills section needs to be added',
    },
    salaryAnalysis: {
      current_range: 'Based on experience level',
      market_range: 'Market competitive',
      recommendations: 'Research industry standards for your role and location',
    },
    careerPath: {
      current_level: hasExperience ? 'Experienced' : 'Entry Level',
      next_steps: [
        'Enhance skills section with specific technologies',
        'Add quantifiable achievements to experience',
        'Include relevant certifications',
      ],
      growth_path: 'Continue building experience and skills',
      timeline: '6-12 months for next level',
    },
    keyStrengths: [
      hasExperience ? `${resumeData.experience.length} work experience(s) listed` : null,
      hasEducation ? 'Educational background included' : null,
      hasSkills ? 'Skills section present' : null,
      resumeData.summary ? 'Professional summary included' : null,
    ].filter(Boolean),
    improvements: [
      !resumeData.summary ? 'Add a professional summary' : null,
      !hasExperience ? 'Add work experience details' : null,
      !hasSkills ? 'Add skills section' : null,
      'Include quantifiable achievements in experience',
      'Add relevant certifications if available',
    ].filter(Boolean),
    recommendations: [
      'Use action verbs to start bullet points',
      'Quantify achievements with numbers and percentages',
      'Tailor resume keywords to target job descriptions',
      'Keep formatting consistent throughout',
    ],
    improvedSummary: resumeData.summary || 
      `Experienced professional with a background in ${resumeData.bestJobTitle || 'their field'}. ${
        hasExperience ? `Bringing ${resumeData.experience.length} position(s) of relevant experience.` : ''
      } ${hasSkills ? 'Strong technical and interpersonal skills.' : ''}`
  };

  const improvedResume = enhanceResumeData(resumeData, analysis);
  
  // Extract skills for structured table
  const skills = extractSkillsFromResume(resumeData);
  
  return {
    analysis,
    improvedResume,
    skills,
    experience: resumeData.experience || [],
    education: resumeData.education || [],
  };
}

/**
 * Enhance resume data based on analysis
 */
function enhanceResumeData(resumeData: any, analysis: any) {
  // Extract bestJobTitle if not already present
  let bestJobTitle = resumeData.bestJobTitle || resumeData.position;
  
  if (!bestJobTitle && resumeData.experience && Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
    // Get from most recent work experience
    const mostRecentExp = resumeData.experience[0];
    bestJobTitle = mostRecentExp.title || mostRecentExp.position || mostRecentExp.jobTitle || null;
  }
  
  return {
    name: resumeData.name || '',
    email: resumeData.email || '',
    phone: resumeData.phone || '',
    bestJobTitle: bestJobTitle || 'Professional',
    summary: analysis.improvedSummary || resumeData.summary || '',
    experience: resumeData.experience || [],
    education: resumeData.education || [],
    skills: resumeData.skills || {
      technical: [],
      soft: ['Communication', 'Problem Solving', 'Team Collaboration'],
      languages: ['English']
    },
    certifications: resumeData.certifications || [],
    projects: resumeData.projects || [],
    achievements: resumeData.achievements || [],
  };
}

/**
 * Extract skills from resume data in structured format
 */
function extractSkillsFromResume(resumeData: any): any[] {
  const skills: any[] = [];
  
  if (resumeData.skills?.technical) {
    resumeData.skills.technical.forEach((skill: string) => {
      skills.push({ name: skill, category: 'technical', proficiency_level: 'intermediate' });
    });
  }
  
  if (resumeData.skills?.soft) {
    resumeData.skills.soft.forEach((skill: string) => {
      skills.push({ name: skill, category: 'soft', proficiency_level: 'intermediate' });
    });
  }
  
  if (resumeData.skills?.languages) {
    resumeData.skills.languages.forEach((lang: string) => {
      skills.push({ name: lang, category: 'language', proficiency_level: 'intermediate' });
    });
  }
  
  return skills;
}

/**
 * Extract portfolio links from resume data
 */
function extractPortfolioLinks(resumeData: any): any[] | null {
  const links: any[] = [];
  
  // Check various possible fields for portfolio links
  if (resumeData.portfolioLinks) {
    return Array.isArray(resumeData.portfolioLinks) ? resumeData.portfolioLinks : [resumeData.portfolioLinks];
  }
  
  if (resumeData.portfolio_links) {
    return Array.isArray(resumeData.portfolio_links) ? resumeData.portfolio_links : [resumeData.portfolio_links];
  }
  
  if (resumeData.links?.portfolio) {
    return Array.isArray(resumeData.links.portfolio) ? resumeData.links.portfolio : [resumeData.links.portfolio];
  }
  
  // Check projects for portfolio links
  if (resumeData.projects?.length) {
    resumeData.projects.forEach((project: any) => {
      if (project.url || project.link) {
        links.push({
          type: 'project',
          title: project.title || project.name || 'Project',
          url: project.url || project.link,
        });
      }
    });
  }
  
  return links.length > 0 ? links : null;
}

/**
 * Extract files analyzed information
 */
function extractFilesAnalyzed(resumeData: any, originalFileName?: string): any[] | null {
  const files: any[] = [];
  
  if (originalFileName) {
    files.push({
      filename: originalFileName,
      type: originalFileName.split('.').pop()?.toLowerCase() || 'unknown',
      analyzed_at: new Date().toISOString(),
    });
  }
  
  // Check if there are other files mentioned
  if (resumeData.files_analyzed) {
    const additionalFiles = Array.isArray(resumeData.files_analyzed) 
      ? resumeData.files_analyzed 
      : [resumeData.files_analyzed];
    files.push(...additionalFiles);
  }
  
  return files.length > 0 ? files : null;
}
