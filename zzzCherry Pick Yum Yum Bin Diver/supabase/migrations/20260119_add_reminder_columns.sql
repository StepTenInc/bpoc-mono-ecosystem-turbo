-- Migration: Add reminder tracking columns
-- Date: 2026-01-19
-- Purpose: Add columns to track reminder notifications for interviews, offers, and missed calls

-- ========================================
-- 1. Add reminder columns to job_interviews
-- ========================================
ALTER TABLE job_interviews
ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_1h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_15m BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN job_interviews.reminder_sent_24h IS 'Tracks if 24-hour reminder was sent';
COMMENT ON COLUMN job_interviews.reminder_sent_1h IS 'Tracks if 1-hour reminder was sent';
COMMENT ON COLUMN job_interviews.reminder_sent_15m IS 'Tracks if 15-minute reminder was sent';

-- ========================================
-- 2. Add expiry reminder column to job_offers
-- ========================================
ALTER TABLE job_offers
ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN job_offers.expiry_reminder_sent IS 'Tracks if 24-hour expiry reminder was sent';

-- ========================================
-- 3. Add day one reminder column to job_applications
-- ========================================
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS day_one_reminder_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN job_applications.day_one_reminder_sent IS 'Tracks if day-before-start reminder was sent';

-- ========================================
-- 4. Add missed call tracking to video_call_rooms
-- ========================================
ALTER TABLE video_call_rooms
ADD COLUMN IF NOT EXISTS missed_call_notified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN video_call_rooms.missed_call_notified IS 'Tracks if missed call notification was sent';

-- ========================================
-- 5. Create indexes for reminder queries (performance)
-- ========================================
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

-- ========================================
-- 6. Add read_at column to notifications if not exists
-- ========================================
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was read';
