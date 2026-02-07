-- Migration: Add missing email column to anonymous_sessions
-- Date: 2026-01-19
-- Purpose: Fix "column email does not exist" error in /api/anon/session

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'anonymous_sessions'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.anonymous_sessions ADD COLUMN email TEXT;

    -- Create index for email lookups
    CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_email
    ON public.anonymous_sessions(email);

    -- Add comment
    COMMENT ON COLUMN public.anonymous_sessions.email IS 'Optional email captured during anonymous session (for later matching)';

    RAISE NOTICE 'Added email column to anonymous_sessions table';
  ELSE
    RAISE NOTICE 'Email column already exists in anonymous_sessions table';
  END IF;
END $$;
