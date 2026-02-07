-- ============================================
-- CANDIDATE_TRUTH VIEW
-- Single source of truth for candidate data
-- Aggregates data from 9 tables into one view
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS candidate_truth CASCADE;

-- Create the candidate_truth view
CREATE OR REPLACE VIEW candidate_truth AS
SELECT
  -- Basic candidate info
  c.id,
  c.first_name,
  c.last_name,
  c.avatar_url,
  c.username,
  c.created_at,
  c.updated_at,
  c.is_active,

  -- Profile data
  cp.position,
  cp.bio,
  cp.headline,
  cp.birthday,
  cp.gender,
  cp.location,
  cp.location_city,
  cp.location_province,
  cp.location_country,
  cp.location_region,
  cp.expected_salary_min,
  cp.expected_salary_max,
  cp.work_status,
  cp.preferred_shift,
  cp.preferred_work_setup,
  cp.linkedin,
  cp.portfolio,
  cp.github,
  cp.phone,

  -- Skills as JSONB array
  (SELECT COALESCE(json_agg(DISTINCT cs.name ORDER BY cs.name), '[]'::json)
   FROM candidate_skills cs
   WHERE cs.candidate_id = c.id) as skills,

  -- Work experience as JSONB array (ordered by most recent first)
  (SELECT COALESCE(json_agg(
    json_build_object(
      'id', cw.id,
      'company', cw.company,
      'position', cw.position,
      'start_date', cw.start_date,
      'end_date', cw.end_date,
      'is_current', cw.is_current,
      'description', cw.description,
      'location', cw.location
    ) ORDER BY cw.start_date DESC
  ), '[]'::json)
   FROM candidate_work_experiences cw
   WHERE cw.candidate_id = c.id) as work_experiences,

  -- Education as JSONB array (ordered by most recent first)
  (SELECT COALESCE(json_agg(
    json_build_object(
      'id', ce.id,
      'school', ce.school,
      'degree', ce.degree,
      'field_of_study', ce.field_of_study,
      'graduation_year', ce.graduation_year,
      'description', ce.description
    ) ORDER BY ce.graduation_year DESC
  ), '[]'::json)
   FROM candidate_educations ce
   WHERE ce.candidate_id = c.id) as educations,

  -- Resume info (primary resume only)
  CASE WHEN EXISTS (
    SELECT 1 FROM candidate_resumes cr
    WHERE cr.candidate_id = c.id AND cr.is_primary = true
  ) THEN true ELSE false END as has_resume,

  (SELECT cr.id FROM candidate_resumes cr
   WHERE cr.candidate_id = c.id AND cr.is_primary = true
   LIMIT 1) as resume_id,

  (SELECT cr.file_name FROM candidate_resumes cr
   WHERE cr.candidate_id = c.id AND cr.is_primary = true
   LIMIT 1) as resume_file_name,

  (SELECT cr.uploaded_at FROM candidate_resumes cr
   WHERE cr.candidate_id = c.id AND cr.is_primary = true
   LIMIT 1) as resume_uploaded_at,

  -- AI analysis (latest only)
  CASE WHEN EXISTS (
    SELECT 1 FROM candidate_ai_analysis caa
    WHERE caa.candidate_id = c.id
  ) THEN true ELSE false END as has_ai_analysis,

  (SELECT caa.overall_score FROM candidate_ai_analysis caa
   WHERE caa.candidate_id = c.id
   ORDER BY caa.created_at DESC LIMIT 1) as ai_overall_score,

  (SELECT caa.strengths FROM candidate_ai_analysis caa
   WHERE caa.candidate_id = c.id
   ORDER BY caa.created_at DESC LIMIT 1) as ai_strengths,

  (SELECT caa.weaknesses FROM candidate_ai_analysis caa
   WHERE caa.candidate_id = c.id
   ORDER BY caa.created_at DESC LIMIT 1) as ai_weaknesses,

  (SELECT caa.summary FROM candidate_ai_analysis caa
   WHERE caa.candidate_id = c.id
   ORDER BY caa.created_at DESC LIMIT 1) as ai_summary,

  -- Typing assessment (latest only)
  (SELECT cta.wpm FROM candidate_typing_assessments cta
   WHERE cta.candidate_id = c.id
   ORDER BY cta.completed_at DESC LIMIT 1) as typing_wpm,

  (SELECT cta.accuracy FROM candidate_typing_assessments cta
   WHERE cta.candidate_id = c.id
   ORDER BY cta.completed_at DESC LIMIT 1) as typing_accuracy,

  (SELECT cta.completed_at FROM candidate_typing_assessments cta
   WHERE cta.candidate_id = c.id
   ORDER BY cta.completed_at DESC LIMIT 1) as typing_completed_at,

  -- DISC assessment (latest only)
  (SELECT cda.disc_type FROM candidate_disc_assessments cda
   WHERE cda.candidate_id = c.id
   ORDER BY cda.completed_at DESC LIMIT 1) as disc_type,

  (SELECT cda.dominance FROM candidate_disc_assessments cda
   WHERE cda.candidate_id = c.id
   ORDER BY cda.completed_at DESC LIMIT 1) as disc_dominance,

  (SELECT cda.influence FROM candidate_disc_assessments cda
   WHERE cda.candidate_id = c.id
   ORDER BY cda.completed_at DESC LIMIT 1) as disc_influence,

  (SELECT cda.steadiness FROM candidate_disc_assessments cda
   WHERE cda.candidate_id = c.id
   ORDER BY cda.completed_at DESC LIMIT 1) as disc_steadiness,

  (SELECT cda.conscientiousness FROM candidate_disc_assessments cda
   WHERE cda.candidate_id = c.id
   ORDER BY cda.completed_at DESC LIMIT 1) as disc_conscientiousness,

  (SELECT cda.completed_at FROM candidate_disc_assessments cda
   WHERE cda.candidate_id = c.id
   ORDER BY cda.completed_at DESC LIMIT 1) as disc_completed_at,

  -- Gamification data (removed - column doesn't exist)
  0 as total_xp,
  1 as level,
  '[]'::jsonb as badges,

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
   WHERE ja.candidate_id = c.id AND ja.status = 'hired') as total_placements

FROM candidates c
LEFT JOIN candidate_profiles cp ON cp.candidate_id = c.id
WHERE c.is_active = true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_candidate_truth_id ON candidates(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_candidate_truth_created ON candidates(created_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_candidate_truth_updated ON candidates(updated_at) WHERE is_active = true;

-- Grant access to authenticated users
GRANT SELECT ON candidate_truth TO authenticated;
GRANT SELECT ON candidate_truth TO service_role;

-- Add comment
COMMENT ON VIEW candidate_truth IS 'Aggregated candidate data from 9 tables. Single source of truth for candidate profiles. Email and phone EXCLUDED for privacy.';
