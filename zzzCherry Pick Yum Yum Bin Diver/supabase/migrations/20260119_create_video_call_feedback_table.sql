-- Migration: Create video_call_feedback table
-- Date: 2026-01-19
-- Purpose: Move from application-level feedback to per-call feedback for better context

-- ========================================
-- 1. Create video_call_feedback table
-- ========================================
CREATE TABLE IF NOT EXISTS video_call_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  room_id UUID NOT NULL REFERENCES video_call_rooms(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  interview_id UUID REFERENCES job_interviews(id) ON DELETE SET NULL,

  -- Who gave the feedback
  reviewer_id UUID NOT NULL, -- User ID of the person giving feedback
  reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('recruiter', 'client', 'admin')),

  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,

  -- Structured feedback (JSONB for flexibility)
  structured_feedback JSONB DEFAULT '{}',
  -- Example structure:
  -- {
  --   "technical_skills": 4,
  --   "communication": 5,
  --   "culture_fit": 3,
  --   "strengths": ["Good problem solver", "Clear communicator"],
  --   "concerns": ["Limited experience with X"],
  --   "recommendation": "advance" | "reject" | "needs_followup"
  -- }

  -- Tags for easy filtering
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Outcome/Decision
  outcome VARCHAR(50), -- passed, failed, needs_followup, undecided
  recommend_hire BOOLEAN,

  -- Sharing controls
  shared_with_candidate BOOLEAN DEFAULT FALSE,
  shared_with_client BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 2. Add comments
-- ========================================
COMMENT ON TABLE video_call_feedback IS 'Per-call feedback from recruiters or clients';
COMMENT ON COLUMN video_call_feedback.room_id IS 'Reference to the video call room';
COMMENT ON COLUMN video_call_feedback.reviewer_id IS 'User ID of the person providing feedback';
COMMENT ON COLUMN video_call_feedback.reviewer_type IS 'Type of reviewer (recruiter, client, admin)';
COMMENT ON COLUMN video_call_feedback.rating IS 'Overall rating from 1-5';
COMMENT ON COLUMN video_call_feedback.structured_feedback IS 'Structured feedback data (JSON)';
COMMENT ON COLUMN video_call_feedback.outcome IS 'Interview outcome (passed, failed, needs_followup)';
COMMENT ON COLUMN video_call_feedback.shared_with_candidate IS 'Whether feedback is shared with candidate';
COMMENT ON COLUMN video_call_feedback.shared_with_client IS 'Whether feedback is shared with client';

-- ========================================
-- 3. Create indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_room_id ON video_call_feedback(room_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_application_id ON video_call_feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_interview_id ON video_call_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_reviewer_id ON video_call_feedback(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_created_at ON video_call_feedback(created_at DESC);

-- ========================================
-- 4. Create RLS policies (Row Level Security)
-- ========================================
ALTER TABLE video_call_feedback ENABLE ROW LEVEL SECURITY;

-- Recruiters can view all feedback for their agency
CREATE POLICY video_call_feedback_recruiter_select ON video_call_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM video_call_rooms vcr
    JOIN agency_recruiters ar ON vcr.agency_id = ar.agency_id
    WHERE vcr.id = video_call_feedback.room_id
    AND ar.user_id = auth.uid()
  )
);

-- Recruiters can insert their own feedback
CREATE POLICY video_call_feedback_recruiter_insert ON video_call_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_id = auth.uid()
  AND reviewer_type = 'recruiter'
  AND EXISTS (
    SELECT 1
    FROM video_call_rooms vcr
    JOIN agency_recruiters ar ON vcr.agency_id = ar.agency_id
    WHERE vcr.id = room_id
    AND ar.user_id = auth.uid()
  )
);

-- Recruiters can update their own feedback
CREATE POLICY video_call_feedback_recruiter_update ON video_call_feedback
FOR UPDATE
TO authenticated
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

-- Candidates can view feedback shared with them
CREATE POLICY video_call_feedback_candidate_select ON video_call_feedback
FOR SELECT
TO authenticated
USING (
  shared_with_candidate = TRUE
  AND EXISTS (
    SELECT 1
    FROM video_call_rooms vcr
    WHERE vcr.id = video_call_feedback.room_id
    AND vcr.participant_user_id = auth.uid()
  )
);

-- Admins can see all feedback
CREATE POLICY video_call_feedback_admin_all ON video_call_feedback
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- 5. Add updated_at trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_video_call_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_call_feedback_updated_at
BEFORE UPDATE ON video_call_feedback
FOR EACH ROW
EXECUTE FUNCTION update_video_call_feedback_updated_at();

-- ========================================
-- 6. Migrate existing client feedback (if any)
-- ========================================
-- Note: This is a placeholder for data migration
-- Run this only if there's existing client_notes/client_rating on job_applications

-- Example migration (commented out - run manually if needed):
/*
INSERT INTO video_call_feedback (
  room_id,
  application_id,
  reviewer_id,
  reviewer_type,
  rating,
  feedback_text,
  created_at
)
SELECT
  vcr.id as room_id,
  ja.id as application_id,
  ja.reviewed_by as reviewer_id,
  'client' as reviewer_type,
  ja.client_rating as rating,
  ja.client_notes as feedback_text,
  ja.reviewed_at as created_at
FROM job_applications ja
JOIN video_call_rooms vcr ON vcr.application_id = ja.id
WHERE ja.client_notes IS NOT NULL
  AND ja.client_rating IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM video_call_feedback vcf
    WHERE vcf.room_id = vcr.id
  );
*/
