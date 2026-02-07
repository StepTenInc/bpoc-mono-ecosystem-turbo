import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/user/resume-for-build
 * Get the user's resume data for the build/edit page
 * Combines extracted resume + AI analysis improvements
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!userId || !sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch extracted resume
    const { data: resume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('*')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .single();

    // Fetch AI analysis with improved data
    const { data: analysis } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .select('*')
      .eq('candidate_id', userId)
      .single();

    // Fetch candidate profile for position, location
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select('position, location')
      .eq('candidate_id', userId)
      .single();
    
    // Fetch candidate for phone, email, avatar
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('phone, email, avatar_url')
      .eq('id', userId)
      .single();

    // Use generated_data if available (latest saved version), otherwise use resume_data or extracted_data (extracted version)
    const resumeContent = resume?.generated_data || resume?.resume_data || resume?.extracted_data || null;
    
    if (!resumeContent) {
      // Even without resume data, return candidate avatar if available
      return NextResponse.json({
        success: true,
        hasData: false,
        profilePhoto: candidate?.avatar_url || null,
        profile: {
          avatar_url: candidate?.avatar_url || null,
          email: candidate?.email || null,
          phone: candidate?.phone || null,
        }
      });
    }

    // Combine resume content with AI improvements
    // Try extracted_data first (most recent extraction), then resume_data
    const extractedResume = resume.extracted_data || resume.resume_data || {};
    const improvedSummary = analysis?.improved_summary;
    
    // Build the improved resume by merging data
    // Use generated_data as base (if exists), then merge with extracted data and AI improvements
    // IMPORTANT: Preserve skills from extractedResume if resumeContent has empty skills
    // Handle both structured format (object with technical/soft) and flat array format
    const hasSkillsInContent = resumeContent.skills && 
      (Array.isArray(resumeContent.skills) && resumeContent.skills.length > 0) ||
      ((resumeContent.skills.technical && Array.isArray(resumeContent.skills.technical) && resumeContent.skills.technical.length > 0) ||
       (resumeContent.skills.soft && Array.isArray(resumeContent.skills.soft) && resumeContent.skills.soft.length > 0) ||
       (resumeContent.skills.soft_skills && Array.isArray(resumeContent.skills.soft_skills) && resumeContent.skills.soft_skills.length > 0));
    
    const hasSkillsInExtracted = extractedResume.skills && 
      (Array.isArray(extractedResume.skills) && extractedResume.skills.length > 0) ||
      ((extractedResume.skills.technical && Array.isArray(extractedResume.skills.technical) && extractedResume.skills.technical.length > 0) ||
       (extractedResume.skills.soft && Array.isArray(extractedResume.skills.soft) && extractedResume.skills.soft.length > 0) ||
       (extractedResume.skills.soft_skills && Array.isArray(extractedResume.skills.soft_skills) && extractedResume.skills.soft_skills.length > 0));

    // Convert flat array skills to structured format if needed
    const normalizeSkillsArray = (skills: any) => {
      if (!skills) return null;
      if (Array.isArray(skills) && skills.length > 0) {
        // It's a flat array, need to categorize
        const technicalKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'git', 'api', 'database', 'framework', 'library', 'tool', 'software', 'system', 'development', 'programming', 'code', 'typescript', 'vue', 'angular', 'express', 'mongodb', 'mysql', 'postgresql', 'docker', 'aws', 'azure', 'linux', 'windows', 'ios', 'android', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'bootstrap', 'tailwind', 'wordpress', 'figma', 'canva', 'adobe'];
        const softKeywords = ['communication', 'leadership', 'teamwork', 'problem', 'creative', 'adaptable', 'organized', 'detail', 'time management', 'collaboration', 'interpersonal', 'analytical', 'critical thinking', 'presentation', 'negotiation', 'customer service', 'empathy', 'patience', 'flexibility', 'hardworking', 'eager', 'learn'];
        
        const technical: string[] = [];
        const soft: string[] = [];
        
        skills.forEach((skill: string) => {
          const skillLower = skill.toLowerCase();
          if (technicalKeywords.some(keyword => skillLower.includes(keyword))) {
            technical.push(skill);
          } else if (softKeywords.some(keyword => skillLower.includes(keyword))) {
            soft.push(skill);
          } else {
            // Default to technical if unclear
            technical.push(skill);
          }
        });
        
        return { technical, soft, languages: [] };
      }
      // Already structured format
      return skills;
    };

    const improvedResume = {
      ...extractedResume, // Base extracted data
      ...resumeContent, // Override with generated_data (latest saved version)
      summary: improvedSummary || resumeContent.summary || extractedResume.summary || '',
      // Preserve and normalize skills
      skills: (() => {
        if (hasSkillsInContent) {
          return normalizeSkillsArray(resumeContent.skills) || resumeContent.skills;
        } else if (hasSkillsInExtracted) {
          return normalizeSkillsArray(extractedResume.skills) || extractedResume.skills;
        }
        return resumeContent.skills || {};
      })(),
      // Include analysis scores if available
      analysisScores: analysis ? {
        overall: analysis.overall_score,
        ats: analysis.ats_compatibility_score,
        content: analysis.content_quality_score,
      } : null
    };

    console.log('🔍 Skills check before normalization:', {
      hasSkillsInContent,
      hasSkillsInExtracted,
      contentSkills: resumeContent.skills,
      extractedSkills: extractedResume.skills,
      finalSkills: improvedResume.skills,
      isArray: Array.isArray(improvedResume.skills)
    });

    // Normalize skills structure to ensure it matches resume builder format
    if (!improvedResume.skills) {
      improvedResume.skills = {};
    } else if (Array.isArray(improvedResume.skills)) {
      // Convert flat array to structured format
      const normalized = normalizeSkillsArray(improvedResume.skills);
      if (normalized) {
        improvedResume.skills = normalized;
      }
    }

    // Map soft_skills to soft (OpenAI format compatibility)
    if (improvedResume.skills.soft_skills && !improvedResume.skills.soft) {
      improvedResume.skills.soft = Array.isArray(improvedResume.skills.soft_skills) 
        ? improvedResume.skills.soft_skills 
        : [];
    }

    // Check if we have skills from AI analysis
    // Try improved_resume first, then skills_snapshot
    let aiSkills = null;
    if (analysis?.improved_resume?.skills) {
      aiSkills = analysis.improved_resume.skills;
    } else if (analysis?.skills_snapshot && Array.isArray(analysis.skills_snapshot) && analysis.skills_snapshot.length > 0) {
      // Convert skills_snapshot array to structured format
      const technical: string[] = [];
      const soft: string[] = [];
      analysis.skills_snapshot.forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        if (skillName) {
          const category = typeof skill === 'object' ? skill.category : 'technical';
          if (category === 'technical' || category === 'tool') {
            technical.push(skillName);
          } else if (category === 'soft') {
            soft.push(skillName);
          } else {
            technical.push(skillName); // Default to technical
          }
        }
      });
      aiSkills = { technical, soft };
    }

    // Only use AI skills if current skills are empty
    if (aiSkills && (!improvedResume.skills.technical || improvedResume.skills.technical.length === 0) &&
        (!improvedResume.skills.soft || improvedResume.skills.soft.length === 0)) {
      if (aiSkills.technical && Array.isArray(aiSkills.technical) && aiSkills.technical.length > 0) {
        improvedResume.skills.technical = aiSkills.technical;
      }
      if (aiSkills.soft && Array.isArray(aiSkills.soft) && aiSkills.soft.length > 0) {
        improvedResume.skills.soft = aiSkills.soft;
      }
      console.log('📝 Using skills from AI analysis:', {
        technical: aiSkills.technical?.length || 0,
        soft: aiSkills.soft?.length || 0
      });
    }

    // Extract from parsed.skills if it's a flat array and skills are missing
    if (improvedResume.parsed?.skills && Array.isArray(improvedResume.parsed.skills) && improvedResume.parsed.skills.length > 0) {
      // Only populate if skills are completely empty
      const hasAnySkills = (improvedResume.skills.technical && improvedResume.skills.technical.length > 0) ||
                          (improvedResume.skills.soft && improvedResume.skills.soft.length > 0);
      
      if (!hasAnySkills) {
        // If technical skills are empty or missing, try to populate from parsed skills
        if (!improvedResume.skills.technical || improvedResume.skills.technical.length === 0) {
          const technicalKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'git', 'api', 'database', 'framework', 'library', 'tool', 'software', 'system', 'development', 'programming', 'code', 'typescript', 'vue', 'angular', 'express', 'mongodb', 'mysql', 'postgresql', 'docker', 'aws', 'azure', 'linux', 'windows', 'ios', 'android'];
          const technical = improvedResume.parsed.skills.filter((skill: string) => {
            const skillLower = skill.toLowerCase();
            return technicalKeywords.some(keyword => skillLower.includes(keyword));
          });
          if (technical.length > 0) {
            improvedResume.skills.technical = technical;
          }
        }

        // If soft skills are empty or missing, populate from parsed skills
        if (!improvedResume.skills.soft || improvedResume.skills.soft.length === 0) {
          const softKeywords = ['communication', 'leadership', 'teamwork', 'problem', 'creative', 'adaptable', 'organized', 'detail', 'time management', 'collaboration', 'interpersonal', 'analytical', 'critical thinking', 'presentation', 'negotiation', 'customer service'];
          const soft = improvedResume.parsed.skills.filter((skill: string) => {
            const skillLower = skill.toLowerCase();
            return softKeywords.some(keyword => skillLower.includes(keyword));
          });
          if (soft.length > 0) {
            improvedResume.skills.soft = soft;
          }
        }

        // If we still have unassigned skills and arrays are empty, put remaining in technical
        if ((!improvedResume.skills.technical || improvedResume.skills.technical.length === 0) && 
            (!improvedResume.skills.soft || improvedResume.skills.soft.length === 0)) {
          // Put all parsed skills in technical as fallback
          improvedResume.skills.technical = [...improvedResume.parsed.skills];
        }
      }
    }

    // Ensure arrays exist and are arrays (preserve existing data)
    improvedResume.skills.technical = Array.isArray(improvedResume.skills.technical) ? improvedResume.skills.technical : [];
    improvedResume.skills.soft = Array.isArray(improvedResume.skills.soft) ? improvedResume.skills.soft : [];
    improvedResume.skills.languages = Array.isArray(improvedResume.skills.languages) ? improvedResume.skills.languages : [];

    console.log('📝 Normalized skills in resume-for-build:', {
      technical: improvedResume.skills.technical.length,
      soft: improvedResume.skills.soft.length,
      languages: improvedResume.skills.languages.length,
      hasParsedSkills: !!(improvedResume.parsed?.skills && improvedResume.parsed.skills.length > 0)
    });

    // Pre-fill phone, email, location, and profile photo from profile if missing in resume
    if (!improvedResume.phone && candidate?.phone) {
      improvedResume.phone = candidate.phone;
    }
    if (!improvedResume.email && candidate?.email) {
      improvedResume.email = candidate.email;
    }
    if (!improvedResume.location && profile?.location) {
      improvedResume.location = profile.location;
    }
    if (!improvedResume.profilePhoto && candidate?.avatar_url) {
      improvedResume.profilePhoto = candidate.avatar_url;
    }

    return NextResponse.json({
      success: true,
      hasData: true,
      extractedResume: extractedResume,
      improvedResume: improvedResume,
      resumeData: improvedResume, // Also provide as resumeData for compatibility
      slug: resume.slug,
      profilePhoto: improvedResume.profilePhoto || resumeContent.profilePhoto || extractedResume.profilePhoto || candidate?.avatar_url || null,
      template: resume.template_used ? { id: resume.template_used } : null,
      profile: profile ? { 
        position: profile.position,
        location: profile.location,
        phone: candidate?.phone,
        email: candidate?.email,
        avatar_url: candidate?.avatar_url
      } : null, // Include profile data
      analysis: analysis ? {
        keyStrengths: analysis.key_strengths,
        improvements: analysis.improvements,
        recommendations: analysis.recommendations,
      } : null
    });

  } catch (error) {
    console.error('Error fetching resume for build:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}

