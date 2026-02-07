-- Add profile completion fields to candidate_profiles
-- This migration adds fields needed for the gamified profile completion system

ALTER TABLE candidate_profiles
ADD COLUMN IF NOT EXISTS cover_photo text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS work_status text,
ADD COLUMN IF NOT EXISTS preferred_shift text,
ADD COLUMN IF NOT EXISTS preferred_work_setup text,
ADD COLUMN IF NOT EXISTS expected_salary_min numeric,
ADD COLUMN IF NOT EXISTS expected_salary_max numeric,
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS current_mood text;

-- Add comments for clarity
COMMENT ON COLUMN candidate_profiles.cover_photo IS 'URL to cover photo (Facebook-style profile header)';
COMMENT ON COLUMN candidate_profiles.position IS 'Desired job position/title';
COMMENT ON COLUMN candidate_profiles.work_status IS 'Current work status: employed, unemployed, student, etc';
COMMENT ON COLUMN candidate_profiles.preferred_shift IS 'Preferred work shift: day, night, graveyard, flexible';
COMMENT ON COLUMN candidate_profiles.preferred_work_setup IS 'Preferred work setup: remote, onsite, hybrid';
COMMENT ON COLUMN candidate_profiles.expected_salary_min IS 'Minimum expected salary';
COMMENT ON COLUMN candidate_profiles.expected_salary_max IS 'Maximum expected salary range';
COMMENT ON COLUMN candidate_profiles.birthday IS 'Date of birth';
COMMENT ON COLUMN candidate_profiles.gender IS 'Gender identity';
COMMENT ON COLUMN candidate_profiles.current_mood IS 'Current career mood/status';
