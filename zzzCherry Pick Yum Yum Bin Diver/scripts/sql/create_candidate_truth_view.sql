-- ============================================
-- CANDIDATE_TRUTH VIEW (UPDATED FOR CURRENT SCHEMA)
-- Single source of truth for candidate data
-- Aggregates data from multiple candidate tables
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS candidate_truth CASCADE;

-- Create the candidate_truth view
CREATE OR REPLACE VIEW candidate_truth AS
SELECT
  -- Basic candidate info from candidates table
  c.id,
  c.first_name,
  c.last_name,
  CONCAT(c.first_name, ' ', c.last_name) as full_name,
  c.avatar_url,
  c.username,
  c.slug,
  c.is_active,
  c.created_at as candidate_created_at,
  c.updated_at as candidate_updated_at,

  -- Profile data from candidate_profiles
  cp.bio,
  cp.headline,
  cp.birthday,
  cp.gender,
  cp.location,
  cp.location_city,
  cp.location_province,
  cp.location_country,
  cp.location_region,
  cp.work_status,
  cp.position as current_employer,
  cp.position as current_position,
  NULL::numeric as current_salary,
  cp.expected_salary_min,
  cp.expected_salary_max,
  NULL::integer as notice_period_days,
  cp.preferred_shift,
  cp.preferred_work_setup,
  cp.profile_completed,
  NULL::numeric as profile_completion_percentage,

  -- Skills as JSONB array
  (SELECT COALESCE(json_agg(
    json_build_object(
      'name', cs.name,
      'category', cs.category,
      'verified', cs.verified,
      'isPrimary', cs.is_primary,
      'yearsExperience', cs.years_experience,
      'proficiencyLevel', cs.proficiency_level
    ) ORDER BY cs.name
  ), '[]'::json)
   FROM candidate_skills cs
   WHERE cs.candidate_id = c.id) as skills,

  -- Typing assessment (table doesn't exist, return nulls)
  NULL::jsonb as typing_assessment,

  -- DISC assessment (table doesn't exist, return nulls)
  NULL::jsonb as disc_assessment,

  -- Work experience as JSONB array (ordered by most recent first)
  (SELECT COALESCE(json_agg(
    json_build_object(
      'id', cw.id,
      'companyName', cw.company_name,
      'jobTitle', cw.job_title,
      'startDate', cw.start_date,
      'endDate', cw.end_date,
      'isCurrent', cw.is_current,
      'description', cw.description,
      'responsibilities', cw.responsibilities,
      'achievements', cw.achievements,
      'location', cw.location
    ) ORDER BY cw.start_date DESC
  ), '[]'::json)
   FROM candidate_work_experiences cw
   WHERE cw.candidate_id = c.id) as work_experiences,

  -- Education as JSONB array (ordered by most recent first)
  (SELECT COALESCE(json_agg(
    json_build_object(
      'id', ce.id,
      'institution', ce.institution,
      'degree', ce.degree,
      'fieldOfStudy', ce.field_of_study,
      'startDate', ce.start_date,
      'endDate', ce.end_date,
      'isCurrent', ce.is_current,
      'grade', ce.grade,
      'description', ce.description
    ) ORDER BY ce.end_date DESC NULLS FIRST
  ), '[]'::json)
   FROM candidate_educations ce
   WHERE ce.candidate_id = c.id) as educations,

  -- Resume info (primary resume only)
  (SELECT json_build_object(
    'id', cr.id,
    'title', cr.title,
    'fileName', cr.original_filename,
    'fileUrl', cr.file_url,
    'uploadedAt', cr.created_at,
    'viewCount', cr.view_count
  )
   FROM candidate_resumes cr
   WHERE cr.candidate_id = c.id AND cr.is_primary = true
   LIMIT 1) as resume,

  -- AI analysis (latest only)
  (SELECT json_build_object(
    'id', caa.id,
    'overallScore', caa.overall_score,
    'atsCompatibilityScore', caa.ats_compatibility_score,
    'skillsAlignmentScore', caa.skills_alignment_score,
    'contentQualityScore', caa.content_quality_score,
    'professionalPresentationScore', caa.professional_presentation_score,
    'keyStrengths', caa.key_strengths,
    'improvements', caa.improvements,
    'improvedSummary', caa.improved_summary,
    'recommendations', caa.recommendations,
    'careerPath', caa.career_path,
    'salaryAnalysis', caa.salary_analysis,
    'createdAt', caa.created_at
  )
   FROM candidate_ai_analysis caa
   WHERE caa.candidate_id = c.id
   ORDER BY caa.created_at DESC LIMIT 1) as ai_analysis,

  -- Calculated years of experience from work experiences
  (SELECT COALESCE(
    SUM(
      EXTRACT(YEAR FROM AGE(
        COALESCE(cw.end_date, CURRENT_DATE),
        cw.start_date
      ))
    ), 0
  )::integer
   FROM candidate_work_experiences cw
   WHERE cw.candidate_id = c.id) as experience_years,

  -- Convenience booleans
  CASE WHEN EXISTS (
    SELECT 1 FROM candidate_resumes cr
    WHERE cr.candidate_id = c.id AND cr.is_primary = true
  ) THEN true ELSE false END as has_resume,

  CASE WHEN EXISTS (
    SELECT 1 FROM candidate_ai_analysis caa
    WHERE caa.candidate_id = c.id
  ) THEN true ELSE false END as has_ai_analysis,

  -- Activity tracking
  CASE
    WHEN c.created_at > NOW() - INTERVAL '7 days' THEN true
    ELSE false
  END as is_new,

  CASE
    WHEN c.updated_at > NOW() - INTERVAL '24 hours' THEN 'online'
    WHEN c.updated_at > NOW() - INTERVAL '7 days' THEN 'recent'
    ELSE 'inactive'
  END as activity_status,

  c.updated_at as last_active,

  -- Application counts (for recruiter context)
  (SELECT COUNT(*) FROM job_applications ja
   WHERE ja.candidate_id = c.id) as total_applications,

  (SELECT COUNT(*) FROM job_applications ja
   WHERE ja.candidate_id = c.id AND ja.status = 'hired') as total_placements,

  -- Gamification defaults (no gamification table)
  0 as total_xp,
  1 as level

FROM candidates c
LEFT JOIN candidate_profiles cp ON cp.candidate_id = c.id;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_active ON candidates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_updated ON candidates(updated_at);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_candidate_id ON candidate_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate_id ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_work_experiences_candidate_id ON candidate_work_experiences(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_educations_candidate_id ON candidate_educations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_candidate_id ON candidate_resumes(candidate_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_candidate_ai_analysis_candidate_id ON candidate_ai_analysis(candidate_id);

-- Grant access to authenticated users and service role
GRANT SELECT ON candidate_truth TO authenticated;
GRANT SELECT ON candidate_truth TO service_role;
GRANT SELECT ON candidate_truth TO anon;

-- Add comment
COMMENT ON VIEW candidate_truth IS 'Aggregated candidate data from multiple tables. Single source of truth for candidate profiles. Updated for current schema (2026-01-26).';
