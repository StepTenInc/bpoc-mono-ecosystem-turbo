-- Migration: Setup unified candidate bucket with folder structure
-- Date: 2026-01-19
-- Purpose: Organize all candidate files in one bucket with clear folder structure
--
-- Folder Structure:
-- candidate/
-- ├── profile_photos/{userId}-{timestamp}.jpg
-- ├── resumes/{userId}/{filename}.pdf
-- ├── employment_contracts/{userId}/{contractId}.pdf
-- ├── offer_letters/{userId}/{offerId}.pdf
-- └── documents/{userId}/{documentType}/{filename}

-- Create the candidate bucket (public for profile photos, private for other docs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate', 'candidate', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing policies on the candidate bucket
DROP POLICY IF EXISTS "Candidates can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can view their own private files" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to their own folders
-- Pattern: candidate/profile_photos/{userId}-{timestamp}.jpg
-- Pattern: candidate/resumes/{userId}/{filename}
-- Pattern: candidate/contracts/{userId}/{filename}
CREATE POLICY "Candidates can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate'
  AND (
    -- Profile photos: candidate/profile_photos/{userId}-{timestamp}.ext
    (name LIKE 'profile_photos/' || auth.uid()::text || '-%')
    OR
    -- Resumes: candidate/resumes/{userId}/*
    (name LIKE 'resumes/' || auth.uid()::text || '/%')
    OR
    -- Employment contracts: candidate/employment_contracts/{userId}/*
    (name LIKE 'employment_contracts/' || auth.uid()::text || '/%')
    OR
    -- Offer letters: candidate/offer_letters/{userId}/*
    (name LIKE 'offer_letters/' || auth.uid()::text || '/%')
    OR
    -- Generic documents: candidate/documents/{userId}/*
    (name LIKE 'documents/' || auth.uid()::text || '/%')
  )
);

-- Policy 2: Allow authenticated users to update their own files
CREATE POLICY "Candidates can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'candidate'
  AND (
    (name LIKE 'profile_photos/' || auth.uid()::text || '-%')
    OR (name LIKE 'resumes/' || auth.uid()::text || '/%')
    OR (name LIKE 'employment_contracts/' || auth.uid()::text || '/%')
    OR (name LIKE 'offer_letters/' || auth.uid()::text || '/%')
    OR (name LIKE 'documents/' || auth.uid()::text || '/%')
  )
)
WITH CHECK (
  bucket_id = 'candidate'
  AND (
    (name LIKE 'profile_photos/' || auth.uid()::text || '-%')
    OR (name LIKE 'resumes/' || auth.uid()::text || '/%')
    OR (name LIKE 'employment_contracts/' || auth.uid()::text || '/%')
    OR (name LIKE 'offer_letters/' || auth.uid()::text || '/%')
    OR (name LIKE 'documents/' || auth.uid()::text || '/%')
  )
);

-- Policy 3: Allow authenticated users to delete their own files
CREATE POLICY "Candidates can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate'
  AND (
    (name LIKE 'profile_photos/' || auth.uid()::text || '-%')
    OR (name LIKE 'resumes/' || auth.uid()::text || '/%')
    OR (name LIKE 'employment_contracts/' || auth.uid()::text || '/%')
    OR (name LIKE 'offer_letters/' || auth.uid()::text || '/%')
    OR (name LIKE 'documents/' || auth.uid()::text || '/%')
  )
);

-- Policy 4: Allow public to view profile photos only (not private documents)
CREATE POLICY "Public can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'candidate'
  AND name LIKE 'profile_photos/%'
);

-- Policy 5: Allow authenticated users to view their own private files
CREATE POLICY "Candidates can view their own private files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate'
  AND (
    (name LIKE 'resumes/' || auth.uid()::text || '/%')
    OR (name LIKE 'employment_contracts/' || auth.uid()::text || '/%')
    OR (name LIKE 'offer_letters/' || auth.uid()::text || '/%')
    OR (name LIKE 'documents/' || auth.uid()::text || '/%')
  )
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Candidate bucket created with folder-based RLS policies';
  RAISE NOTICE 'Structure: candidate/profile_photos/, candidate/resumes/, candidate/employment_contracts/, etc.';
END $$;
