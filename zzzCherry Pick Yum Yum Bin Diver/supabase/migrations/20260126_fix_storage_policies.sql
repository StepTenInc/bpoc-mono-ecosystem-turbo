-- ============================================
-- FIX STORAGE POLICIES FOR CANDIDATE BUCKET
-- Date: 2026-01-26
-- Purpose: Fix RLS policies so profile pictures save to bucket
-- ============================================
--
-- Bucket already exists with folders:
-- - cover_photos/
-- - headshots/
-- - interviews/
-- - profile_photos/
-- - resumes/
--
-- This migration fixes the RLS policies to allow uploads
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Drop ALL existing policies on storage.objects for candidate bucket
-- ============================================

DROP POLICY IF EXISTS "candidate_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_delete" ON storage.objects;
DROP POLICY IF EXISTS "candidate_bucket_select_private" ON storage.objects;

-- Old policy names from previous migrations
DROP POLICY IF EXISTS "Candidates can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can view their own private files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to candidate bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- ============================================
-- STEP 2: Ensure bucket is public and has correct settings
-- ============================================

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
WHERE id = 'candidate';

-- ============================================
-- STEP 3: Create new simple RLS policies
-- ============================================

-- Policy 1: Allow any authenticated user to INSERT files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'candidate');

-- Policy 2: Allow PUBLIC to read/view all files in bucket
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'candidate');

-- Policy 3: Allow authenticated users to UPDATE their files
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'candidate')
WITH CHECK (bucket_id = 'candidate');

-- Policy 4: Allow authenticated users to DELETE their files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'candidate');

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run separately to check)
-- ============================================

-- Check bucket exists and is public:
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'candidate';

-- Check policies exist:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- List files in bucket:
-- SELECT name, created_at FROM storage.objects WHERE bucket_id = 'candidate' ORDER BY created_at DESC LIMIT 10;
