-- =====================================================
-- Add Employment Tracking Fields to Onboarding
-- Date: January 31, 2026
-- Purpose: Track when candidates confirm their first day
-- =====================================================

-- Add employment tracking fields to candidate_onboarding
ALTER TABLE candidate_onboarding
ADD COLUMN IF NOT EXISTS employment_started BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS employment_start_date TIMESTAMPTZ;

-- Add index for querying active employees
CREATE INDEX IF NOT EXISTS idx_candidate_onboarding_employment_started
  ON candidate_onboarding(employment_started);

-- Add comment for documentation
COMMENT ON COLUMN candidate_onboarding.employment_started IS 'True when candidate confirms completing their first day';
COMMENT ON COLUMN candidate_onboarding.employment_start_date IS 'Timestamp when candidate confirmed their first day of employment';
