-- ============================================
-- JOB MATCHING SYSTEM
-- Extends job_matches table with caching and rate limiting
-- ============================================

-- Add fields for caching, refresh tracking, and AI metadata
ALTER TABLE job_matches 
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'groq',
  ADD COLUMN IF NOT EXISTS candidate_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS job_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS match_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS concerns JSONB DEFAULT '[]'::jsonb;

-- Create index for finding stale matches
CREATE INDEX IF NOT EXISTS idx_job_matches_stale 
  ON job_matches(is_stale, analyzed_at) 
  WHERE is_stale = true;

-- Create index for refresh rate limiting
CREATE INDEX IF NOT EXISTS idx_job_matches_refresh 
  ON job_matches(candidate_id, last_refreshed_at);

-- Create index for overall score sorting
CREATE INDEX IF NOT EXISTS idx_job_matches_score 
  ON job_matches(candidate_id, overall_score DESC);

-- Add unique constraint to prevent duplicate matches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_candidate_job_match'
  ) THEN
    ALTER TABLE job_matches 
      ADD CONSTRAINT unique_candidate_job_match 
      UNIQUE(candidate_id, job_id);
  END IF;
END $$;

-- Comment on new columns
COMMENT ON COLUMN job_matches.last_refreshed_at IS 'Timestamp of last manual refresh by candidate';
COMMENT ON COLUMN job_matches.refresh_count IS 'Number of times candidate has refreshed this match';
COMMENT ON COLUMN job_matches.is_stale IS 'True if candidate or job data has changed since last calculation';
COMMENT ON COLUMN job_matches.ai_provider IS 'AI provider used for match analysis (groq, claude, gpt4)';
COMMENT ON COLUMN job_matches.candidate_snapshot IS 'Snapshot of candidate data used for matching';
COMMENT ON COLUMN job_matches.job_snapshot IS 'Snapshot of job data used for matching';
COMMENT ON COLUMN job_matches.match_reasons IS 'Array of reasons why this is a good match';
COMMENT ON COLUMN job_matches.concerns IS 'Array of potential concerns or gaps';
