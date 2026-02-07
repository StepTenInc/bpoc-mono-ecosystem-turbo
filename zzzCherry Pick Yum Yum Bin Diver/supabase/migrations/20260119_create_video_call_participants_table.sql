-- Migration: Create video_call_participants table
-- Date: 2026-01-19
-- Purpose: Track all participants in video calls, including external users without accounts

-- ========================================
-- 1. Create video_call_participants table
-- ========================================
CREATE TABLE IF NOT EXISTS video_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  room_id UUID NOT NULL REFERENCES video_call_rooms(id) ON DELETE CASCADE,

  -- Participant identification
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for external participants
  email VARCHAR(255), -- Required for external participants
  display_name VARCHAR(255),

  -- Participant type
  participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('host', 'candidate', 'interviewer', 'observer', 'external')),

  -- Join/Leave tracking
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Connection details
  daily_participant_id VARCHAR(255), -- Daily.co participant ID
  connection_quality VARCHAR(20) CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor', 'unknown')),

  -- Permissions during call
  can_share_screen BOOLEAN DEFAULT TRUE,
  can_record BOOLEAN DEFAULT FALSE,
  is_recording BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 2. Add constraints
-- ========================================
-- Either user_id OR email must be present
ALTER TABLE video_call_participants
ADD CONSTRAINT video_call_participants_identification_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Unique constraint: For registered users, one entry per (room_id, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_call_participants_room_user
ON video_call_participants(room_id, user_id)
WHERE user_id IS NOT NULL;

-- Unique constraint: For external users, one entry per (room_id, email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_call_participants_room_email
ON video_call_participants(room_id, email)
WHERE user_id IS NULL AND email IS NOT NULL;

-- ========================================
-- 3. Add comments
-- ========================================
COMMENT ON TABLE video_call_participants IS 'Tracks all participants in video calls, including multi-join and external participants';
COMMENT ON COLUMN video_call_participants.user_id IS 'User ID if participant has an account (NULL for external)';
COMMENT ON COLUMN video_call_participants.email IS 'Email address (required for external participants)';
COMMENT ON COLUMN video_call_participants.participant_type IS 'Type of participant in the call';
COMMENT ON COLUMN video_call_participants.daily_participant_id IS 'Daily.co internal participant ID';
COMMENT ON COLUMN video_call_participants.duration_seconds IS 'Total time participant was in call';

-- ========================================
-- 4. Create indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_video_call_participants_room_id ON video_call_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_user_id ON video_call_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_call_participants_email ON video_call_participants(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_call_participants_joined_at ON video_call_participants(joined_at DESC);

-- ========================================
-- 5. Create RLS policies
-- ========================================
ALTER TABLE video_call_participants ENABLE ROW LEVEL SECURITY;

-- Participants can view other participants in their room
CREATE POLICY video_call_participants_room_select ON video_call_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM video_call_rooms vcr
    WHERE vcr.id = room_id
    AND (vcr.host_user_id = auth.uid() OR vcr.participant_user_id = auth.uid())
  )
);

-- System can insert participant records
CREATE POLICY video_call_participants_system_insert ON video_call_participants
FOR INSERT
TO authenticated
WITH CHECK (TRUE); -- Will be restricted by application logic

-- Participants can update their own records
CREATE POLICY video_call_participants_update_own ON video_call_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins can see all participants
CREATE POLICY video_call_participants_admin_all ON video_call_participants
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
-- 6. Add updated_at trigger
-- ========================================
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

-- ========================================
-- 7. Add function to calculate duration on leave
-- ========================================
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
