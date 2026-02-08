import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCandidateById } from '@/lib/db/candidates';
import { syncSkillsFromAnalysis } from '@/lib/db/candidates/sync-from-analysis';

// Unified candidate bucket with folder structure
const CANDIDATE_BUCKET = 'candidate';
const RESUMES_FOLDER = 'resumes';

/**
 * Generate a clean resume slug from candidate name
 * Format: firstName-lastName-XX (where XX is last 2 digits of user ID)
 */
function generateResumeSlug(firstName: string, lastName: string, userId: string): string {
  // Clean and normalize names
  const cleanFirst = (firstName || 'user')
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
    .slice(0, 20); // Limit length
  
  const cleanLast = (lastName || 'profile')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  
  // Get last 2 digits of user ID
  const lastTwoDigits = userId.slice(-2).padStart(2, '0');
  
  return `${cleanFirst}-${cleanLast}-${lastTwoDigits}`;
}

/**
 * Extract name from resume data
 */
function extractNameFromResumeData(resumeData: any): { firstName: string; lastName: string; fullName: string } {
  // Try different possible fields for name
  const name = resumeData.name || resumeData.fullName || resumeData.full_name || '';
  
  if (typeof name === 'string' && name.trim()) {
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'user';
    const lastName = nameParts.slice(1).join(' ') || 'profile';
    return { firstName, lastName, fullName: name };
  }
  
  // Fallback: try first_name and last_name fields
  if (resumeData.first_name || resumeData.last_name) {
    const firstName = resumeData.first_name || 'user';
    const lastName = resumeData.last_name || 'profile';
    return { firstName, lastName, fullName: `${firstName} ${lastName}`.trim() };
  }
  
  // Final fallback
  return { firstName: 'user', lastName: 'profile', fullName: 'user profile' };
}

/**
 * Convert skills from resume format to sync format
 * Handles multiple input formats and normalizes to array of skill objects
 */
function convertSkillsToSyncFormat(skills: any): any[] {
  const skillsArray: any[] = [];
  
  if (!skills) return skillsArray;
  
  // Handle object format: { technical: [...], soft: [...], languages: [...] }
  if (typeof skills === 'object' && !Array.isArray(skills)) {
    // Technical skills
    if (Array.isArray(skills.technical)) {
      skills.technical.forEach((skill: string) => {
        skillsArray.push({
          name: skill.trim(),
          category: 'technical',
          proficiency_level: 'intermediate'
        });
      });
    }
    
    // Soft skills
    if (Array.isArray(skills.soft) || Array.isArray(skills.soft_skills)) {
      const softSkills = skills.soft || skills.soft_skills;
      softSkills.forEach((skill: string) => {
        skillsArray.push({
          name: skill.trim(),
          category: 'soft',
          proficiency_level: 'intermediate'
        });
      });
    }
    
    // Languages
    if (Array.isArray(skills.languages)) {
      skills.languages.forEach((skill: string) => {
        skillsArray.push({
          name: skill.trim(),
          category: 'language',
          proficiency_level: 'intermediate'
        });
      });
    }
  }
  
  // Handle array format: already in correct format
  if (Array.isArray(skills)) {
    skills.forEach((skill: any) => {
      if (typeof skill === 'string') {
        skillsArray.push({
          name: skill.trim(),
          category: 'technical', // Default to technical
          proficiency_level: 'intermediate'
        });
      } else if (skill.name) {
        skillsArray.push(skill);
      }
    });
  }
  
  return skillsArray;
}

/**
 * Upload resume file to Supabase Storage
 */
async function uploadResumeFile(fileData: string, fileName: string, candidateId: string): Promise<string | null> {
  try {
    // Extract base64 data if it's a data URL
    let base64Data = fileData;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // Convert base64 to Buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename with folder structure: resumes/{userId}/{timestamp}-{filename}
    const fileExt = fileName.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const storageFileName = `${RESUMES_FOLDER}/${candidateId}/${timestamp}-${fileName}`;

    console.log('📤 Uploading resume file to storage:', {
      bucket: CANDIDATE_BUCKET,
      fileName: storageFileName,
      size: fileBuffer.length,
    });

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(CANDIDATE_BUCKET)
      .upload(storageFileName, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Error uploading resume file:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(CANDIDATE_BUCKET)
      .getPublicUrl(storageFileName);

    console.log('✅ Resume file uploaded:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error in uploadResumeFile:', error);
    return null;
  }
}

/**
 * POST /api/candidates/resume/save-extracted
 * Save extracted resume data to candidate_resumes table in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/candidates/resume/save-extracted] Starting...');
    
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Verify candidate exists
    const candidate = await getCandidateById(userId, true);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { resumeData, originalFileName, candidateId, fileUrl, fileData } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'No resume data provided' },
        { status: 400 }
      );
    }

    // Extract bestJobTitle from resume data if not already present
    if (!resumeData.bestJobTitle && !resumeData.position) {
      // Try to get it from the most recent work experience
      if (resumeData.experience && Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
        // Get the first (most recent) experience entry
        const mostRecentExp = resumeData.experience[0];
        resumeData.bestJobTitle = mostRecentExp.title || mostRecentExp.position || mostRecentExp.jobTitle || null;
        console.log('📝 Extracted bestJobTitle from experience:', resumeData.bestJobTitle);
      }
      
      // If still not found, try to extract from parsed personalInfo
      if (!resumeData.bestJobTitle && resumeData.parsed?.personalInfo?.title) {
        resumeData.bestJobTitle = resumeData.parsed.personalInfo.title;
        console.log('📝 Extracted bestJobTitle from personalInfo:', resumeData.bestJobTitle);
      }
      
      // If still not found, try to extract from header section (first few lines after name)
      if (!resumeData.bestJobTitle && resumeData.rawText) {
        const lines = resumeData.rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        const nameLineIndex = lines.findIndex((line: string) => {
          const name = resumeData.name || '';
          return name && line.toLowerCase().includes(name.toLowerCase().split(' ')[0]);
        });
        
        if (nameLineIndex >= 0 && nameLineIndex < lines.length - 1) {
          // Check the next 2 lines after name for title
          for (let i = nameLineIndex + 1; i <= nameLineIndex + 2 && i < lines.length; i++) {
            const line = lines[i];
            // Skip if it looks like email, phone, or location
            if (!line.includes('@') && !line.match(/[\d\+\-\(\)]/) && line.length > 3 && line.length < 100) {
              resumeData.bestJobTitle = line;
              console.log('📝 Extracted bestJobTitle from header:', resumeData.bestJobTitle);
              break;
            }
          }
        }
      }
    }

    // Normalize skills structure to match resume builder format
    // Initialize skills object if it doesn't exist
    if (!resumeData.skills) {
      resumeData.skills = {};
    }

    // Map from different possible formats
    // Handle soft_skills -> soft mapping (OpenAI format uses soft_skills)
    if (resumeData.skills.soft_skills && !resumeData.skills.soft) {
      resumeData.skills.soft = Array.isArray(resumeData.skills.soft_skills) 
        ? resumeData.skills.soft_skills 
        : [];
    }

    // Extract from parsed.skills if it's a flat array and skills are missing
    if (resumeData.parsed?.skills && Array.isArray(resumeData.parsed.skills) && resumeData.parsed.skills.length > 0) {
      // If technical skills are empty or missing, try to populate from parsed skills
      if (!resumeData.skills.technical || resumeData.skills.technical.length === 0) {
        // Categorize skills - technical skills are usually programming languages, tools, technologies
        const technicalKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'git', 'api', 'database', 'framework', 'library', 'tool', 'software', 'system', 'development', 'programming', 'code', 'typescript', 'vue', 'angular', 'express', 'mongodb', 'mysql', 'postgresql', 'docker', 'aws', 'azure', 'linux', 'windows', 'ios', 'android'];
        const technical = resumeData.parsed.skills.filter((skill: string) => {
          const skillLower = skill.toLowerCase();
          return technicalKeywords.some(keyword => skillLower.includes(keyword));
        });
        if (technical.length > 0) {
          resumeData.skills.technical = technical;
        }
      }

      // If soft skills are empty or missing, populate from parsed skills
      if (!resumeData.skills.soft || resumeData.skills.soft.length === 0) {
        const softKeywords = ['communication', 'leadership', 'teamwork', 'problem', 'creative', 'adaptable', 'organized', 'detail', 'time management', 'collaboration', 'interpersonal', 'analytical', 'critical thinking', 'presentation', 'negotiation', 'customer service'];
        const soft = resumeData.parsed.skills.filter((skill: string) => {
          const skillLower = skill.toLowerCase();
          return softKeywords.some(keyword => skillLower.includes(keyword));
        });
        if (soft.length > 0) {
          resumeData.skills.soft = soft;
        }
      }

      // If we still have unassigned skills and arrays are empty, put remaining in technical
      if ((!resumeData.skills.technical || resumeData.skills.technical.length === 0) && 
          (!resumeData.skills.soft || resumeData.skills.soft.length === 0)) {
        // Put all parsed skills in technical as fallback
        resumeData.skills.technical = [...resumeData.parsed.skills];
      }
    }

    // Ensure arrays exist and are arrays (preserve existing data)
    resumeData.skills.technical = Array.isArray(resumeData.skills.technical) ? resumeData.skills.technical : [];
    resumeData.skills.soft = Array.isArray(resumeData.skills.soft) ? resumeData.skills.soft : [];
    resumeData.skills.languages = Array.isArray(resumeData.skills.languages) ? resumeData.skills.languages : [];
    
    console.log('📝 Normalized skills structure:', {
      technical: resumeData.skills.technical.length,
      soft: resumeData.skills.soft.length,
      languages: resumeData.skills.languages.length,
      hasParsedSkills: !!(resumeData.parsed?.skills && resumeData.parsed.skills.length > 0)
    });

    console.log('💾 Saving extracted resume to candidate_resumes:', {
      candidate_id: userId,
      has_name: !!resumeData.name,
      has_email: !!resumeData.email,
      has_experience: !!resumeData.experience?.length,
      has_education: !!resumeData.education?.length,
      has_skills: !!resumeData.skills,
      original_filename: originalFileName,
      file_url: fileUrl,
      has_file_data: !!fileData,
    });

    // Upload file if provided and fileUrl is not already set
    let finalFileUrl = fileUrl;
    if (!finalFileUrl && fileData && originalFileName) {
      console.log('📤 Uploading resume file to storage...');
      finalFileUrl = await uploadResumeFile(fileData, originalFileName, userId);
      if (!finalFileUrl) {
        console.warn('⚠️ File upload failed, continuing without file_url');
      }
    }

    // Extract name from resume data for slug and title
    const { firstName, lastName, fullName } = extractNameFromResumeData(resumeData);
    
    // Generate slug in format: firstName-lastName-XX
    const slug = generateResumeSlug(firstName, lastName, userId);
    
    // Generate title: "Full Name's Resume"
    const title = fullName ? `${fullName}'s Resume` : 'Resume';
    
    console.log('📝 Generated resume metadata:', {
      slug,
      title,
      fullName,
      firstName,
      lastName
    });

    // Check if an extracted resume already exists for this candidate
    const { data: existingResume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .single();

    let savedResume;
    
    if (existingResume) {
      // Update existing resume
      const { data, error } = await supabaseAdmin
        .from('candidate_resumes')
        .update({
          extracted_data: resumeData, // Save to extracted_data column
          resume_data: resumeData, // Also save to resume_data for backward compatibility
          file_url: finalFileUrl || null,
          original_filename: originalFileName || null,
          slug: slug, // Update slug to readable format
          title: title, // Update title with candidate's name
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResume.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating resume:', error);
        return NextResponse.json(
          { error: 'Failed to update resume', details: error.message },
          { status: 500 }
        );
      }
      savedResume = data;
      console.log('✅ Updated existing resume:', savedResume.id);
    } else {
      // Insert new resume
      const { data, error } = await supabaseAdmin
        .from('candidate_resumes')
        .insert({
          candidate_id: userId,
          extracted_data: resumeData, // Save to extracted_data column
          resume_data: resumeData, // Also save to resume_data for backward compatibility
          file_url: finalFileUrl || null,
          original_filename: originalFileName || null,
          slug: slug, // Use readable slug format
          title: title, // Use candidate's name in title
          is_primary: true,
          is_public: false,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting resume:', error);
        return NextResponse.json(
          { error: 'Failed to save resume', details: error.message },
          { status: 500 }
        );
      }
      savedResume = data;
      console.log('✅ Inserted new resume:', savedResume.id);
    }

    // IMMEDIATE SKILLS SYNC - Don't wait for AI analysis
    // This ensures candidate_skills table is populated for job matching
    console.log('🔄 Syncing skills immediately to candidate_skills table...');
    try {
      if (resumeData.skills) {
        const skillsForSync = convertSkillsToSyncFormat(resumeData.skills);
        if (skillsForSync.length > 0) {
          await syncSkillsFromAnalysis(userId, skillsForSync);
          console.log(`✅ Synced ${skillsForSync.length} skills immediately`);
        } else {
          console.log('⚠️ No skills to sync (empty array after conversion)');
        }
      } else {
        console.log('⚠️ No skills found in resume data');
      }
    } catch (syncError) {
      // Don't fail the whole request if sync fails
      console.error('⚠️ Skills sync failed (non-critical):', syncError);
    }

    return NextResponse.json({
      success: true,
      message: 'Resume saved to database',
      resume: {
        id: savedResume.id,
        candidate_id: savedResume.candidate_id,
        slug: savedResume.slug,
        title: savedResume.title,
        created_at: savedResume.created_at,
        updated_at: savedResume.updated_at,
      }
    });

  } catch (error) {
    console.error('❌ Error saving extracted resume:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

