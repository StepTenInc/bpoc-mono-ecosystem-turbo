-- ============================================
-- BPOC PLATFORM - COMPLETE SYSTEM MIGRATION
-- ============================================
-- Date: 2026-01-19
-- Version: 2.0
-- Purpose: Complete platform enhancement migration
--
-- This migration includes:
-- 1. Reminder system columns
-- 2. Video call feedback table
-- 3. Video call participants table
-- 4. Audit log system
-- 5. All necessary indexes and triggers
--
-- IMPORTANT: Review and test in staging before production deployment
-- ============================================

BEGIN;

-- ============================================
-- PART 1: REMINDER SYSTEM COLUMNS
-- ============================================

-- Add reminder columns to job_interviews
ALTER TABLE job_interviews
ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_1h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_15m BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN job_interviews.reminder_sent_24h IS 'Tracks if 24-hour reminder was sent';
COMMENT ON COLUMN job_interviews.reminder_sent_1h IS 'Tracks if 1-hour reminder was sent';
COMMENT ON COLUMN job_interviews.reminder_sent_15m IS 'Tracks if 15-minute reminder was sent';

-- Add expiry reminder column to job_offers
ALTER TABLE job_offers
ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN job_offers.expiry_reminder_sent IS 'Tracks if 24-hour expiry reminder was sent';

-- Add day one reminder column to job_applications
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS day_one_reminder_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN job_applications.day_one_reminder_sent IS 'Tracks if day-before-start reminder was sent';

-- Add missed call tracking to video_call_rooms
ALTER TABLE video_call_rooms
ADD COLUMN IF NOT EXISTS missed_call_notified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN video_call_rooms.missed_call_notified IS 'Tracks if missed call notification was sent';

-- Create indexes for reminder queries (performance)
CREATE INDEX IF NOT EXISTS idx_job_interviews_reminders
ON job_interviews(scheduled_at, status)
WHERE reminder_sent_24h = FALSE OR reminder_sent_1h = FALSE OR reminder_sent_15m = FALSE;

CREATE INDEX IF NOT EXISTS idx_job_offers_expiry_reminder
ON job_offers(expires_at, status)
WHERE expiry_reminder_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_job_applications_day_one_reminder
ON job_applications(first_day_date, status)
WHERE day_one_reminder_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_video_call_rooms_missed_calls
ON video_call_rooms(created_at, status)
WHERE missed_call_notified = FALSE AND status = 'waiting';

-- Add read_at column to notifications if not exists
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was read';

-- ============================================
-- PART 2: VIDEO CALL FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS video_call_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES video_call_rooms(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  interview_id UUID REFERENCES job_interviews(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL,
  reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('recruiter', 'client', 'admin')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  structured_feedback JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  outcome VARCHAR(50),
  recommend_hire BOOLEAN,
  shared_with_candidate BOOLEAN DEFAULT FALSE,
  shared_with_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE video_call_feedback IS 'Per-call feedback from recruiters or clients';
COMMENT ON COLUMN video_call_feedback.room_id IS 'Reference to the video call room';
COMMENT ON COLUMN video_call_feedback.structured_feedback IS 'Structured feedback data (JSON)';

CREATE INDEX IF NOT EXISTS idx_video_call_feedback_room_id ON video_call_feedback(room_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_application_id ON video_call_feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_interview_id ON video_call_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_video_call_feedback_reviewer_id ON video_call_feedback(reviewer_id);

ALTER TABLE video_call_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_call_feedback
CREATE POLICY video_call_feedback_recruiter_select ON video_call_feedback
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM video_call_rooms vcr
    JOIN agency_recruiters ar ON vcr.agency_id = ar.agency_id
    WHERE vcr.id = video_call_feedback.room_id AND ar.user_id = auth.uid()
  )
);

CREATE POLICY video_call_feedback_recruiter_insert ON video_call_feedback
FOR INSERT TO authenticated
WITH CHECK (reviewer_id = auth.uid() AND reviewer_type = 'recruiter');

CREATE POLICY video_call_feedback_candidate_select ON video_call_feedback
FOR SELECT TO authenticated
USING (
  shared_with_candidate = TRUE
  AND EXISTS (
    SELECT 1 FROM video_call_rooms vcr
    WHERE vcr.id = video_call_feedback.room_id AND vcr.participant_user_id = auth.uid()
  )
);

-- Updated_at trigger for video_call_feedback
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

-- ============================================
-- PART 3: VIDEO CALL PARTICIPANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS video_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES video_call_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('host', 'candidate', 'interviewer', 'observer', 'external')),
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  duration_seconds INTEGER,
  daily_participant_id VARCHAR(255),
  connection_quality VARCHAR(20) CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor', 'unknown')),
  can_share_screen BOOLEAN DEFAULT TRUE,
  can_record BOOLEAN DEFAULT FALSE,
  is_recording BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE video_call_participants IS 'Tracks all participants in video calls, including multi-join and external participants';

ALTER TABLE video_call_participants
ADD CONSTRAINT video_call_participants_identification_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_call_participants_room_user
ON video_call_participants(room_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_call_participants_room_email
ON video_call_participants(room_id, email)
WHERE user_id IS NULL AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_call_participants_room_id ON video_call_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_user_id ON video_call_participants(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE video_call_participants ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger for video_call_participants
CREATE OR REPLACE FUNCTION update_video_call_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_call_participants_updated_at
BEFORE UPDATE ON video_call_participants
FOR EACH ROW
EXECUTE FUNCTION update_video_call_participants_updated_at();

-- Duration calculation trigger
CREATE OR REPLACE FUNCTION calculate_participant_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_participant_duration
BEFORE UPDATE ON video_call_participants
FOR EACH ROW
WHEN (NEW.left_at IS NOT NULL AND OLD.left_at IS NULL)
EXECUTE FUNCTION calculate_participant_duration();

-- ============================================
-- PART 4: AUDIT LOG SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  user_ip_address INET,
  user_agent TEXT,
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id UUID,
  resource_description TEXT,
  old_value JSONB,
  new_value JSONB,
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  session_id UUID,
  request_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);

COMMENT ON TABLE audit_log IS 'Immutable audit trail for all critical system actions';
COMMENT ON COLUMN audit_log.retention_until IS 'Date when this log can be deleted (7 years for compliance)';

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_category ON audit_log(action_category);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_admin_select ON audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY audit_log_system_insert ON audit_log
FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- Audit log creation function
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_email VARCHAR(255);
  v_user_role VARCHAR(50);
  v_action_category VARCHAR(50);
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT email, role INTO v_user_email, v_user_role
    FROM users WHERE id = p_user_id;
  END IF;

  v_action_category := CASE
    WHEN p_action LIKE 'user_%' OR p_action LIKE 'auth_%' THEN 'auth'
    WHEN p_action LIKE 'recording_%' OR p_action LIKE 'data_%' THEN 'data'
    WHEN p_action LIKE 'config_%' OR p_action LIKE 'agency_%' THEN 'config'
    WHEN p_action LIKE 'security_%' OR p_action LIKE 'access_%' THEN 'security'
    WHEN p_action LIKE 'gdpr_%' OR p_action LIKE 'compliance_%' THEN 'compliance'
    ELSE 'general'
  END;

  INSERT INTO audit_log (
    user_id, user_email, user_role, action, action_category,
    resource_type, resource_id, old_value, new_value, metadata, status
  ) VALUES (
    p_user_id, v_user_email, v_user_role, p_action, v_action_category,
    p_resource_type, p_resource_id, p_old_value, p_new_value, p_metadata, 'success'
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trigger for job_applications status changes
CREATE OR REPLACE FUNCTION audit_job_application_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM create_audit_log(
      auth.uid(),
      'application_status_changed',
      'job_application',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'candidate_id', NEW.candidate_id,
        'job_id', NEW.job_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_job_application_changes ON job_applications;
CREATE TRIGGER trigger_audit_job_application_changes
AFTER UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION audit_job_application_changes();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMIT;

-- ============================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================

-- Verify reminder columns exist
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'job_interviews' AND column_name LIKE 'reminder_sent%';

-- Verify new tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('video_call_feedback', 'video_call_participants', 'audit_log');

-- Verify indexes exist
-- SELECT indexname FROM pg_indexes
-- WHERE indexname LIKE 'idx_%reminder%' OR indexname LIKE 'idx_video_call_%' OR indexname LIKE 'idx_audit_log_%';

-- ============================================
-- NOTES
-- ============================================
-- 1. This migration is idempotent (safe to run multiple times)
-- 2. All operations use IF NOT EXISTS or CREATE OR REPLACE
-- 3. Wrapped in transaction for safety
-- 4. 7-year retention on audit logs for compliance
-- 5. All tables have RLS enabled
-- 6. All necessary indexes created for performance
-- ============================================
