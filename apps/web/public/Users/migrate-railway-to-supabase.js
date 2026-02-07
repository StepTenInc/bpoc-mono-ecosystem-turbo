/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ⚫ SHADOW'S RAILWAY → SUPABASE MIGRATION SCRIPT
 * ===============================================
 * Migrates matched user data from Railway to Supabase
 * 
 * IMPORTANT: Review the migration guide before running!
 * Run: node scripts/migrate-railway-to-supabase.js
 * 
 * Options:
 *   --dry-run    Preview without inserting (default)
 *   --execute    Actually perform the migration
 *   --user=ID    Migrate single user by ID
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load env from repo root (.env.local preferred, fallback to .env)
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = fs.existsSync(envLocalPath) ? envLocalPath : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATION_DATA_PATH = path.join(__dirname, 'matched-users-for-migration.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');
const SINGLE_USER_ID = args.find(a => a.startsWith('--user='))?.split('=')[1];

// ============================================
// VALIDATION
// ============================================

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('⚫ ABORT: Missing environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============================================
// DATA MAPPING FUNCTIONS
// ============================================

/**
 * Map Railway work_status enum to Supabase WorkStatus enum
 */
function mapWorkStatus(railwayStatus) {
  const mapping = {
    'employed': 'employed',
    'unemployed-looking-for-work': 'unemployed',
    'freelancer': 'freelancer',
    'part-time': 'part_time',
    'student': 'student',
    'on-leave': 'unemployed',
    'retired': 'unemployed',
    'career-break': 'unemployed',
    'transitioning': 'unemployed',
    'remote-worker': 'employed'
  };
  return mapping[railwayStatus] || null;
}

/**
 * Map Railway shift enum to Supabase Shift enum
 */
function mapShift(railwayShift) {
  const mapping = {
    'day': 'day',
    'night': 'night',
    'both': 'both'
  };
  return mapping[railwayShift] || null;
}

/**
 * Map Railway work_setup enum to Supabase WorkSetup enum
 */
function mapWorkSetup(railwaySetup) {
  const mapping = {
    'Work From Office': 'office',
    'Work From Home': 'remote',
    'Hybrid': 'hybrid',
    'Any': 'any'
  };
  return mapping[railwaySetup] || null;
}

/**
 * Map Railway gender to Supabase Gender enum
 */
function mapGender(railwayGender) {
  const mapping = {
    'male': 'male',
    'female': 'female',
    'other': 'other',
    'prefer-not-to-say': 'prefer_not_to_say'
  };
  return mapping[railwayGender?.toLowerCase()] || null;
}

/**
 * Map Railway session status
 */
function mapSessionStatus(status) {
  const mapping = {
    'completed': 'completed',
    'in_progress': 'in_progress',
    'started': 'started',
    'abandoned': 'abandoned'
  };
  return mapping[status] || 'completed';
}

/**
 * Parse date duration string to extract start/end dates
 * Format: "January 2021 - Present" or "March 2018 - May 2019"
 */
function parseDuration(durationStr) {
  if (!durationStr) return { startDate: null, endDate: null, isCurrent: false };
  
  const parts = durationStr.split(' - ');
  if (parts.length !== 2) return { startDate: null, endDate: null, isCurrent: false };
  
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.toLowerCase() === 'present') return null;
    
    const months = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
    const match = dateStr.toLowerCase().match(/(\w+)\s+(\d{4})/);
    if (match) {
      const month = months[match[1]] || '01';
      return `${match[2]}-${month}-01`;
    }
    return null;
  };
  
  const isCurrent = parts[1].toLowerCase() === 'present';
  
  return {
    startDate: parseDate(parts[0]),
    endDate: isCurrent ? null : parseDate(parts[1]),
    isCurrent
  };
}

/**
 * Categorize skills based on keywords
 */
function categorizeSkill(skillName) {
  const skillLower = skillName.toLowerCase();
  
  // Technical/Software
  if (/revit|autocad|bluebeam|sketchup|navisworks|lumion|enscape|bim|cad/.test(skillLower)) {
    return 'Technical - Design Software';
  }
  if (/microsoft|office|excel|word|powerpoint/.test(skillLower)) {
    return 'Technical - Office Software';
  }
  if (/python|javascript|java|php|sql|react|node|programming|coding/.test(skillLower)) {
    return 'Technical - Programming';
  }
  
  // Communication
  if (/communication|english|writing|presentation|public speaking/.test(skillLower)) {
    return 'Communication';
  }
  
  // Management
  if (/project management|team lead|coordination|planning/.test(skillLower)) {
    return 'Management';
  }
  
  // Design
  if (/design|drafting|modeling|documentation|architectural/.test(skillLower)) {
    return 'Design & Drafting';
  }
  
  // Customer Service
  if (/customer|client|support|service/.test(skillLower)) {
    return 'Customer Service';
  }
  
  return 'General';
}

// ============================================
// MIGRATION FUNCTIONS
// ============================================

/**
 * Migrate a single user's candidate record
 */
async function migrateCandidate(user, dryRun = true) {
  const profile = user.personal_profile;
  
  const candidateData = {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone || null,
    avatar_url: profile.avatar_url || null,
    username: profile.username || null,
    slug: profile.slug || null,
    is_active: true,
    email_verified: true,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };

  if (dryRun) {
    return { table: 'candidates', action: 'upsert', data: candidateData };
  }

  const { data, error } = await supabase
    .from('candidates')
    .upsert(candidateData, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(`candidates: ${error.message}`);
  return data;
}

/**
 * Migrate candidate profile (includes work status data)
 */
async function migrateCandidateProfile(user, dryRun = true) {
  const profile = user.personal_profile;
  const location = user.location_data || {};
  const workStatus = user.work_status || {};

  const profileData = {
    candidate_id: profile.id,
    bio: profile.bio || null,
    position: profile.position || workStatus.current_position || null,
    birthday: profile.birthday ? profile.birthday.split('T')[0] : null,
    gender: mapGender(profile.gender),
    gender_custom: profile.gender_custom || null,
    
    // Location data
    location: location.location || null,
    location_place_id: location.location_place_id || null,
    location_lat: location.location_lat || null,
    location_lng: location.location_lng || null,
    location_city: location.location_city || null,
    location_province: location.location_province || null,
    location_country: location.location_country || null,
    location_barangay: location.location_barangay || null,
    location_region: location.location_region || null,
    
    // Work status data
    work_status: mapWorkStatus(workStatus.work_status),
    current_employer: workStatus.current_employer || null,
    current_position: workStatus.current_position || null,
    current_salary: workStatus.current_salary || null,
    expected_salary_min: workStatus.minimum_salary_range ? parseFloat(workStatus.minimum_salary_range) * 1000 : null,
    expected_salary_max: workStatus.maximum_salary_range ? parseFloat(workStatus.maximum_salary_range) * 1000 : null,
    notice_period_days: workStatus.notice_period_days || null,
    preferred_shift: mapShift(workStatus.preferred_shift),
    preferred_work_setup: mapWorkSetup(workStatus.work_setup),
    
    // Completion flags
    profile_completed: profile.completed_data || workStatus.completed_data || false,
    profile_completion_percentage: profile.completed_data ? 100 : 0,
    
    created_at: workStatus.created_at || profile.created_at,
    updated_at: workStatus.updated_at || profile.updated_at
  };

  if (dryRun) {
    return { table: 'candidate_profiles', action: 'upsert', data: profileData };
  }

  const { data, error } = await supabase
    .from('candidate_profiles')
    .upsert(profileData, { onConflict: 'candidate_id' })
    .select()
    .single();

  if (error) throw new Error(`candidate_profiles: ${error.message}`);
  return data;
}

/**
 * Migrate DISC assessment sessions
 */
async function migrateDiscAssessments(user, dryRun = true) {
  const sessions = user.disc_personality_sessions || [];
  if (sessions.length === 0) return [];

  const candidateId = user.personal_profile.id;
  const results = [];

  for (const session of sessions) {
    const assessmentData = {
      candidate_id: candidateId,
      session_status: mapSessionStatus(session.session_status),
      started_at: session.started_at,
      finished_at: session.finished_at,
      duration_seconds: session.duration_seconds || null,
      total_questions: session.total_questions || 30,
      d_score: session.d_score || 0,
      i_score: session.i_score || 0,
      s_score: session.s_score || 0,
      c_score: session.c_score || 0,
      primary_type: session.primary_type,
      secondary_type: session.secondary_type || null,
      confidence_score: session.confidence_score || 0,
      consistency_index: session.consistency_index || null,
      cultural_alignment: session.cultural_alignment || 95,
      authenticity_score: null,
      ai_assessment: session.ai_assessment || {},
      ai_bpo_roles: session.ai_bpo_roles || [],
      core_responses: session.core_responses || [],
      personalized_responses: session.personalized_responses || [],
      response_patterns: session.response_patterns || {},
      user_position: session.user_position || null,
      user_location: session.user_location || null,
      user_experience: session.user_experience || null,
      xp_earned: 0,
      created_at: session.created_at || session.started_at,
      updated_at: session.updated_at || session.finished_at
    };

    if (dryRun) {
      results.push({ table: 'candidate_disc_assessments', action: 'insert', data: assessmentData });
    } else {
      const { data, error } = await supabase
        .from('candidate_disc_assessments')
        .insert(assessmentData)
        .select()
        .single();

      if (error) throw new Error(`candidate_disc_assessments: ${error.message}`);
      results.push(data);
    }
  }

  return results;
}

/**
 * Migrate Typing Hero sessions
 */
async function migrateTypingAssessments(user, dryRun = true) {
  const sessions = user.typing_hero_sessions || [];
  if (sessions.length === 0) return [];

  const candidateId = user.personal_profile.id;
  const results = [];

  for (const session of sessions) {
    const assessmentData = {
      candidate_id: candidateId,
      session_status: mapSessionStatus(session.session_status),
      difficulty_level: session.difficulty_level || 'rockstar',
      elapsed_time: session.elapsed_time || 0,
      score: session.score || 0,
      wpm: session.wpm || 0,
      overall_accuracy: session.overall_accuracy || 0,
      longest_streak: session.longest_streak || 0,
      correct_words: session.correct_words || 0,
      wrong_words: session.wrong_words || 0,
      words_correct: session.words_correct || [],
      words_incorrect: session.words_incorrect || [],
      ai_analysis: session.ai_analysis || {},
      vocabulary_strengths: [],
      vocabulary_weaknesses: [],
      generated_story: null,
      created_at: session.created_at,
      updated_at: session.updated_at
    };

    if (dryRun) {
      results.push({ table: 'candidate_typing_assessments', action: 'insert', data: assessmentData });
    } else {
      const { data, error } = await supabase
        .from('candidate_typing_assessments')
        .insert(assessmentData)
        .select()
        .single();

      if (error) throw new Error(`candidate_typing_assessments: ${error.message}`);
      results.push(data);
    }
  }

  return results;
}

/**
 * Migrate AI Analysis results
 */
async function migrateAiAnalysis(user, dryRun = true) {
  const analysis = user.ai_analysis_results;
  if (!analysis) return null;

  const candidateId = user.personal_profile.id;

  const analysisData = {
    candidate_id: candidateId,
    resume_id: null, // Will be linked after resume migration
    session_id: analysis.session_id,
    overall_score: analysis.overall_score || 0,
    ats_compatibility_score: analysis.ats_compatibility_score || null,
    content_quality_score: analysis.content_quality_score || null,
    professional_presentation_score: analysis.professional_presentation_score || null,
    skills_alignment_score: analysis.skills_alignment_score || null,
    key_strengths: analysis.key_strengths || [],
    strengths_analysis: analysis.strengths_analysis || {},
    improvements: analysis.improvements || [],
    recommendations: analysis.recommendations || [],
    section_analysis: analysis.section_analysis || {},
    improved_summary: analysis.improved_summary || null,
    salary_analysis: analysis.salary_analysis || null,
    career_path: analysis.career_path || null,
    candidate_profile_snapshot: analysis.candidate_profile || null,
    skills_snapshot: analysis.skills_snapshot || null,
    experience_snapshot: analysis.experience_snapshot || null,
    education_snapshot: analysis.education_snapshot || null,
    analysis_metadata: analysis.analysis_metadata || null,
    portfolio_links: analysis.portfolio_links || null,
    files_analyzed: analysis.files_analyzed || null,
    created_at: analysis.created_at,
    updated_at: analysis.updated_at
  };

  if (dryRun) {
    return { table: 'candidate_ai_analysis', action: 'insert', data: analysisData };
  }

  const { data, error } = await supabase
    .from('candidate_ai_analysis')
    .insert(analysisData)
    .select()
    .single();

  if (error) throw new Error(`candidate_ai_analysis: ${error.message}`);
  return data;
}

/**
 * Migrate saved resumes
 */
async function migrateResumes(user, dryRun = true) {
  const savedResumes = user.saved_resumes || [];
  const extractedResume = user.resumes_extracted;
  const generatedResume = user.resumes_generated;
  
  if (savedResumes.length === 0 && !extractedResume) return [];

  const candidateId = user.personal_profile.id;
  const results = [];

  // Migrate saved resumes
  for (const resume of savedResumes) {
    const resumeData = {
      candidate_id: candidateId,
      slug: resume.resume_slug,
      title: resume.resume_title || 'Resume',
      extracted_data: extractedResume?.resume_data || null,
      generated_data: generatedResume?.generated_resume_data || null,
      resume_data: resume.resume_data,
      original_filename: extractedResume?.original_filename || null,
      file_url: null,
      template_used: resume.template_used || generatedResume?.template_used || null,
      is_primary: savedResumes.length === 1, // Primary if only one
      is_public: resume.is_public ?? true,
      view_count: resume.view_count || 0,
      generation_metadata: generatedResume?.generation_metadata || null,
      created_at: resume.created_at,
      updated_at: resume.updated_at
    };

    if (dryRun) {
      results.push({ table: 'candidate_resumes', action: 'insert', data: resumeData });
    } else {
      // Check if slug exists
      const { data: existing } = await supabase
        .from('candidate_resumes')
        .select('id')
        .eq('slug', resume.resume_slug)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('candidate_resumes')
          .update(resumeData)
          .eq('slug', resume.resume_slug)
          .select()
          .single();

        if (error) throw new Error(`candidate_resumes update: ${error.message}`);
        results.push(data);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('candidate_resumes')
          .insert(resumeData)
          .select()
          .single();

        if (error) throw new Error(`candidate_resumes insert: ${error.message}`);
        results.push(data);
      }
    }
  }

  return results;
}

/**
 * Migrate skills from resume_data to candidate_skills table
 */
async function migrateSkills(user, dryRun = true) {
  const savedResumes = user.saved_resumes || [];
  if (savedResumes.length === 0) return [];

  const candidateId = user.personal_profile.id;
  const results = [];
  
  // Get skills from the first resume with resume_data
  const resumeWithSkills = savedResumes.find(r => r.resume_data?.skills);
  if (!resumeWithSkills) return [];

  const skills = resumeWithSkills.resume_data.skills || [];
  if (!Array.isArray(skills) || skills.length === 0) return [];

  // Track which skills we've processed to avoid duplicates
  const processedSkills = new Set();

  for (let i = 0; i < skills.length; i++) {
    const skillName = typeof skills[i] === 'string' ? skills[i] : skills[i]?.name;
    if (!skillName || processedSkills.has(skillName.toLowerCase())) continue;
    
    processedSkills.add(skillName.toLowerCase());

    const skillData = {
      candidate_id: candidateId,
      name: skillName,
      category: categorizeSkill(skillName),
      proficiency_level: null, // Not available in source data
      years_experience: null, // Not available in source data
      is_primary: i < 5, // First 5 skills marked as primary
      verified: false,
      verified_at: null,
      created_at: resumeWithSkills.created_at || new Date().toISOString(),
      updated_at: resumeWithSkills.updated_at || new Date().toISOString()
    };

    if (dryRun) {
      results.push({ table: 'candidate_skills', action: 'insert', data: skillData });
    } else {
      // Check if skill already exists for this candidate
      const { data: existing } = await supabase
        .from('candidate_skills')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('name', skillName)
        .single();

      if (!existing) {
        const { data, error } = await supabase
          .from('candidate_skills')
          .insert(skillData)
          .select()
          .single();

        if (error) {
          // Skip duplicate key errors silently
          if (!error.message.includes('duplicate key')) {
            throw new Error(`candidate_skills: ${error.message}`);
          }
        } else {
          results.push(data);
        }
      }
    }
  }

  return results;
}

/**
 * Migrate education from resume_data to candidate_educations table
 */
async function migrateEducation(user, dryRun = true) {
  const savedResumes = user.saved_resumes || [];
  if (savedResumes.length === 0) return [];

  const candidateId = user.personal_profile.id;
  const results = [];
  
  // Get education from the first resume with resume_data
  const resumeWithEducation = savedResumes.find(r => r.resume_data?.education);
  if (!resumeWithEducation) return [];

  const educationList = resumeWithEducation.resume_data.education || [];
  if (!Array.isArray(educationList) || educationList.length === 0) return [];

  for (const edu of educationList) {
    // Parse graduation date for end_date
    let endDate = null;
    if (edu.graduation_date) {
      const match = edu.graduation_date.match(/(\w+)\s+(\d{4})/);
      if (match) {
        const months = {
          'january': '01', 'february': '02', 'march': '03', 'april': '04',
          'may': '05', 'june': '06', 'july': '07', 'august': '08',
          'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        const month = months[match[1].toLowerCase()] || '01';
        endDate = `${match[2]}-${month}-01`;
      }
    }

    // Build description from achievements and coursework
    const descriptionParts = [];
    if (edu.honors) descriptionParts.push(`Honors: ${edu.honors}`);
    if (edu.achievements && edu.achievements.length > 0) {
      descriptionParts.push(`Achievements: ${edu.achievements.join(', ')}`);
    }
    if (edu.relevant_coursework && edu.relevant_coursework.length > 0) {
      descriptionParts.push(`Relevant Coursework: ${edu.relevant_coursework.slice(0, 5).join(', ')}`);
    }

    const educationData = {
      candidate_id: candidateId,
      institution: edu.institution || 'Unknown Institution',
      degree: edu.degree || null,
      field_of_study: edu.field_of_study || edu.degree?.replace(/Bachelor of |Master of |Doctor of /gi, '') || null,
      start_date: null, // Usually not provided
      end_date: endDate,
      is_current: false,
      grade: edu.gpa || null,
      description: descriptionParts.length > 0 ? descriptionParts.join(' | ') : null,
      created_at: resumeWithEducation.created_at || new Date().toISOString(),
      updated_at: resumeWithEducation.updated_at || new Date().toISOString()
    };

    if (dryRun) {
      results.push({ table: 'candidate_educations', action: 'insert', data: educationData });
    } else {
      // Check if education already exists (same institution + degree)
      const { data: existing } = await supabase
        .from('candidate_educations')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('institution', educationData.institution)
        .single();

      if (!existing) {
        const { data, error } = await supabase
          .from('candidate_educations')
          .insert(educationData)
          .select()
          .single();

        if (error) throw new Error(`candidate_educations: ${error.message}`);
        results.push(data);
      }
    }
  }

  return results;
}

/**
 * Migrate work experience from resume_data to candidate_work_experiences table
 */
async function migrateWorkExperiences(user, dryRun = true) {
  const savedResumes = user.saved_resumes || [];
  if (savedResumes.length === 0) return [];

  const candidateId = user.personal_profile.id;
  const results = [];
  
  // Get experience from the first resume with resume_data
  const resumeWithExp = savedResumes.find(r => r.resume_data?.experience);
  if (!resumeWithExp) return [];

  const experiences = resumeWithExp.resume_data.experience || [];
  if (!Array.isArray(experiences) || experiences.length === 0) return [];

  for (const exp of experiences) {
    const { startDate, endDate, isCurrent } = parseDuration(exp.duration);

    const workExpData = {
      candidate_id: candidateId,
      company_name: exp.company || 'Unknown Company',
      job_title: exp.position || exp.title || 'Unknown Position',
      location: exp.location || null,
      start_date: startDate,
      end_date: endDate,
      is_current: isCurrent,
      description: exp.description || null,
      responsibilities: exp.key_responsibilities || exp.responsibilities || [],
      achievements: exp.achievements || [],
      created_at: resumeWithExp.created_at || new Date().toISOString(),
      updated_at: resumeWithExp.updated_at || new Date().toISOString()
    };

    if (dryRun) {
      results.push({ table: 'candidate_work_experiences', action: 'insert', data: workExpData });
    } else {
      // Check if work experience already exists (same company + job_title)
      const { data: existing } = await supabase
        .from('candidate_work_experiences')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('company_name', workExpData.company_name)
        .eq('job_title', workExpData.job_title)
        .single();

      if (!existing) {
        const { data, error } = await supabase
          .from('candidate_work_experiences')
          .insert(workExpData)
          .select()
          .single();

        if (error) throw new Error(`candidate_work_experiences: ${error.message}`);
        results.push(data);
      }
    }
  }

  return results;
}

// ============================================
// MAIN MIGRATION ORCHESTRATOR
// ============================================

async function candidateAlreadyExists(candidateId) {
  const { data, error } = await supabase
    .from('candidates')
    .select('id')
    .eq('id', candidateId)
    .maybeSingle();

  if (error) throw new Error(`candidates existence check: ${error.message}`);
  return !!data?.id;
}

async function migrateUser(user, dryRun = true) {
  const profile = user.personal_profile;
  const results = {
    user_id: profile.id,
    email: profile.email,
    name: profile.full_name,
    dry_run: dryRun,
    success: false,
    operations: [],
    errors: []
  };

  try {
    // Safety: if candidate already exists, skip to avoid duplicate inserts in insert-only tables
    const exists = await candidateAlreadyExists(profile.id);
    if (exists) {
      results.success = true;
      results.skipped = true;
      results.skip_reason = 'candidate already exists in candidates table';
      results.operations.push({ type: 'skip_existing_candidate', candidate_id: profile.id });
      return results;
    }

    // 1. Migrate candidate record
    const candidate = await migrateCandidate(user, dryRun);
    results.operations.push({ type: 'candidate', result: candidate });

    // 2. Migrate profile (includes work status)
    const candidateProfile = await migrateCandidateProfile(user, dryRun);
    results.operations.push({ type: 'candidate_profile', result: candidateProfile });

    // 3. Migrate DISC assessments
    const discAssessments = await migrateDiscAssessments(user, dryRun);
    if (discAssessments.length > 0) {
      results.operations.push({ type: 'disc_assessments', count: discAssessments.length, results: discAssessments });
    }

    // 4. Migrate Typing assessments
    const typingAssessments = await migrateTypingAssessments(user, dryRun);
    if (typingAssessments.length > 0) {
      results.operations.push({ type: 'typing_assessments', count: typingAssessments.length, results: typingAssessments });
    }

    // 5. Migrate resumes
    const resumes = await migrateResumes(user, dryRun);
    if (resumes.length > 0) {
      results.operations.push({ type: 'resumes', count: resumes.length, results: resumes });
    }

    // 6. Migrate AI Analysis
    const aiAnalysis = await migrateAiAnalysis(user, dryRun);
    if (aiAnalysis) {
      results.operations.push({ type: 'ai_analysis', result: aiAnalysis });
    }

    // 7. Migrate Skills (from resume_data)
    const skills = await migrateSkills(user, dryRun);
    if (skills.length > 0) {
      results.operations.push({ type: 'skills', count: skills.length, results: skills });
    }

    // 8. Migrate Education (from resume_data)
    const education = await migrateEducation(user, dryRun);
    if (education.length > 0) {
      results.operations.push({ type: 'education', count: education.length, results: education });
    }

    // 9. Migrate Work Experiences (from resume_data)
    const workExperiences = await migrateWorkExperiences(user, dryRun);
    if (workExperiences.length > 0) {
      results.operations.push({ type: 'work_experiences', count: workExperiences.length, results: workExperiences });
    }

    results.success = true;
  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

async function runMigration() {
  console.log('\n⚫ ============================================');
  console.log('   RAILWAY → SUPABASE DATA MIGRATION');
  console.log('   ============================================\n');

  if (DRY_RUN) {
    console.log('   🔍 MODE: DRY RUN (no changes will be made)');
    console.log('   Use --execute to perform actual migration\n');
  } else {
    console.log('   ⚡ MODE: EXECUTE (changes WILL be made)');
    console.log('   Press Ctrl+C within 5 seconds to abort...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Load migration data
  if (!fs.existsSync(MIGRATION_DATA_PATH)) {
    console.error('❌ Migration data file not found:', MIGRATION_DATA_PATH);
    console.error('   Run build-matched-users-for-migration.js first');
    process.exit(1);
  }

  const migrationData = JSON.parse(fs.readFileSync(MIGRATION_DATA_PATH, 'utf-8'));
  let users = migrationData.users;

  // Filter to single user if specified
  if (SINGLE_USER_ID) {
    users = users.filter(u => u.personal_profile.id === SINGLE_USER_ID);
    if (users.length === 0) {
      console.error(`❌ User not found: ${SINGLE_USER_ID}`);
      process.exit(1);
    }
    console.log(`   🎯 Migrating single user: ${SINGLE_USER_ID}\n`);
  }

  console.log(`   📊 Users to migrate: ${users.length}`);
  console.log('   ────────────────────────────────────────\n');

  const results = {
    total: users.length,
    successful: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const profile = user.personal_profile;
    
    console.log(`   [${i + 1}/${users.length}] ${profile.full_name}`);
    console.log(`       📧 ${profile.email}`);

    try {
      const result = await migrateUser(user, DRY_RUN);
      results.details.push(result);

      if (result.success) {
        results.successful++;
        if (result.skipped) {
          console.log(`       ⏭️  Skipped: ${result.skip_reason}`);
        } else {
          const ops = result.operations.map(o => o.type).join(', ');
          console.log(`       ✅ ${DRY_RUN ? 'Would migrate' : 'Migrated'}: ${ops}`);
        }
      } else {
        results.failed++;
        console.log(`       ❌ Failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        user_id: profile.id,
        email: profile.email,
        success: false,
        errors: [error.message]
      });
      console.log(`       ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  // Summary
  console.log('⚫ ============================================');
  console.log('   MIGRATION SUMMARY');
  console.log('   ============================================\n');
  console.log(`   Total Users: ${results.total}`);
  console.log(`   ✅ Successful: ${results.successful}`);
  console.log(`   ❌ Failed: ${results.failed}`);

  if (DRY_RUN) {
    console.log('\n   🔍 This was a DRY RUN. No data was modified.');
    console.log('   Run with --execute to perform the migration.');
  }

  // Export results
  const outputPath = `migration-results-${Date.now()}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n   📁 Results exported to: ${outputPath}`);

  return results;
}

// Execute
runMigration()
  .then(() => {
    console.log('\n⚫ Migration complete. Trust but verify. 🕳️\n');
  })
  .catch(error => {
    console.error('\n⚫ Migration failed:', error.message);
    process.exit(1);
  });

