-- ============================================
-- COMPLETE FIX: Candidate Storage Bucket & RLS
-- Date: 2026-01-26
-- Purpose: Ensure profile pictures save correctly to storage and database
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Ensure bucket exists with correct settings
-- ============================================

-- Create or update the candidate bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate',
  'candidate',
  true,  -- Public bucket for profile photos
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- STEP 2: Drop all existing conflicting policies
-- ============================================

-- Drop old policies from 20260119 migration
DROP POLICY IF EXISTS "Candidates can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can view their own private files" ON storage.objects;

-- Drop policies from 20260123 migration
DROP POLICY IF EXISTS "Authenticated users can upload to candidate bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to candidate photos" ON storage.objects;

-- Drop any other potential policies
DROP POLICY IF EXISTS "candidate_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_delete" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_select" ON storage.objects;

-- ============================================
-- STEP 3: Create clean, working RLS policies
-- ============================================

-- Policy 1: Allow authenticated users to INSERT files to candidate bucket
-- Supports: profile_photos/, cover_photos/, resumes/, documents/
CREATE POLICY "candidate_bucket_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'candidate'
  AND (
    -- Profile photos: profile_photos/{userId}-{timestamp}.ext
    (storage.foldername(name))[1] = 'profile_photos'
    OR
    -- Cover photos: cover_photos/{userId}-{timestamp}.ext
    (storage.foldername(name))[1] = 'cover_photos'
    OR
    -- Resumes: resumes/{userId}/...
    (storage.foldername(name))[1] = 'resumes'
    OR
    -- Documents: documents/{userId}/...
    (storage.foldername(name))[1] = 'documents'
    OR
    -- Employment contracts
    (storage.foldername(name))[1] = 'employment_contracts'
    OR
    -- Offer letters
    (storage.foldername(name))[1] = 'offer_letters'
  )
);

-- Policy 2: Allow authenticated users to UPDATE their own files
CREATE POLICY "candidate_bucket_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'candidate')
WITH CHECK (bucket_id = 'candidate');

-- Policy 3: Allow authenticated users to DELETE their own files
CREATE POLICY "candidate_bucket_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate');

-- Policy 4: Allow PUBLIC read access to profile and cover photos
-- Other folders (resumes, contracts) require authentication
CREATE POLICY "candidate_bucket_select"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'candidate'
  AND (
    (storage.foldername(name))[1] = 'profile_photos'
    OR
    (storage.foldername(name))[1] = 'cover_photos'
  )
);

-- Policy 5: Allow authenticated users to read their own private files
CREATE POLICY "candidate_bucket_select_private"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate'
  AND (
    (storage.foldername(name))[1] = 'resumes'
    OR
    (storage.foldername(name))[1] = 'documents'
    OR
    (storage.foldername(name))[1] = 'employment_contracts'
    OR
    (storage.foldername(name))[1] = 'offer_letters'
  )
);

-- ============================================
-- STEP 4: Verify columns exist (for documentation)
-- ============================================

-- candidates.avatar_url - Already exists in schema ✅
-- candidate_profiles.cover_photo - Already exists in schema ✅

-- Note: Supabase Storage automatically creates folders when files are uploaded

COMMIT;

-- ============================================
-- Verification queries (run these to check)
-- ============================================

-- Check bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'candidate';

-- Check policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'candidate%';

-- Check columns exist:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'avatar_url';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'cover_photo';
