-- ============================================
-- ADD MISSING_SKILLS COLUMN TO JOB_MATCHES
-- Stores skills that candidate lacks for better transparency
-- ============================================

-- Add missing_skills column to job_matches table
ALTER TABLE job_matches
  ADD COLUMN IF NOT EXISTS missing_skills JSONB DEFAULT '[]'::jsonb;

-- Create index for querying matches with missing skills
CREATE INDEX IF NOT EXISTS idx_job_matches_missing_skills
  ON job_matches USING GIN (missing_skills);

-- Comment on new column
COMMENT ON COLUMN job_matches.missing_skills IS 'Array of skills required by job that candidate does not have';
