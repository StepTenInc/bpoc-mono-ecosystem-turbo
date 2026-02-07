-- Add rejection_reason column to jobs table
-- Date: 2026-01-31
-- Purpose: Allow admins to provide rejection reasons when rejecting job postings

BEGIN;

-- Add rejection_reason column to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN jobs.rejection_reason IS 'Reason provided by admin when rejecting a job posting';

-- Create index for querying rejected jobs with reasons
CREATE INDEX IF NOT EXISTS idx_jobs_rejection_reason
ON jobs(status, rejection_reason)
WHERE status = 'rejected' AND rejection_reason IS NOT NULL;

COMMIT;
