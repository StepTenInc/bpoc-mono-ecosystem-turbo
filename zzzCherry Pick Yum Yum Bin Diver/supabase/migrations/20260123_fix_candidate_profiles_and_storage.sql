-- ============================================
-- FINAL MIGRATION: Candidate Profiles & Storage
-- ============================================

BEGIN;

-- STEP 1: Create Gender Enum (if not exists)
DO $$
BEGIN
    -- Drop existing enum if it exists (to recreate clean)
    DROP TYPE IF EXISTS gender_type CASCADE;

    -- Create new enum with proper values
    CREATE TYPE gender_type AS ENUM (
        'male',
        'female',
        'non_binary',
        'prefer_not_to_say',
        'other'
    );
END $$;

-- STEP 2: Update candidate_profiles gender column to use enum

-- First, backup existing gender values to gender_custom if needed
-- (assuming gender_custom exists or we handle it if not, but user instruction implies we might need to be careful. 
--  However, provided SQL assumes gender_custom exists or is created? 
--  The prompt implies: "SET gender_custom = gender::text". 
--  If gender_custom doesn't exist, this will fail. Let's check or add it momentarily.)
--  Actually user instruction Step 3 adds fields, but doesn't mention gender_custom.
--  Let's safely add gender_custom first if it doesn't exist to avoid errors.

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS gender_custom text;

UPDATE candidate_profiles
SET gender_custom = gender::text
WHERE gender IS NOT NULL
  AND gender::text NOT IN ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other');

-- Drop the old gender column
ALTER TABLE candidate_profiles DROP COLUMN IF EXISTS gender;

-- Add it back with the enum type
ALTER TABLE candidate_profiles ADD COLUMN gender gender_type;

-- Set default to prefer_not_to_say for privacy
ALTER TABLE candidate_profiles ALTER COLUMN gender SET DEFAULT 'prefer_not_to_say';

-- STEP 3: Add missing fields
ALTER TABLE candidate_profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS cover_photo text,
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS github text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS portfolio text,
ADD COLUMN IF NOT EXISTS facebook text;

-- STEP 4: Remove bloat fields
ALTER TABLE candidate_profiles
DROP COLUMN IF EXISTS current_employer,
DROP COLUMN IF EXISTS current_position,
DROP COLUMN IF EXISTS current_salary,
DROP COLUMN IF EXISTS notice_period_days,
DROP COLUMN IF EXISTS privacy_settings,
DROP COLUMN IF EXISTS gamification,
DROP COLUMN IF EXISTS profile_completion_percentage,
DROP COLUMN IF EXISTS location_place_id;

-- STEP 5: Set Philippines as default country

-- Set default country to Philippines for existing rows
UPDATE candidate_profiles
SET location_country = 'Philippines'
WHERE location_country IS NULL OR location_country = '';

-- Make Philippines the default for new rows
ALTER TABLE candidate_profiles
ALTER COLUMN location_country SET DEFAULT 'Philippines';

-- STEP 6: Migrate phone from candidates → candidate_profiles

-- Copy phone data from candidates to candidate_profiles
UPDATE candidate_profiles cp
SET phone = c.phone
FROM candidates c
WHERE cp.candidate_id = c.id
  AND c.phone IS NOT NULL
  AND cp.phone IS NULL;

-- Remove phone column from candidates table
ALTER TABLE candidates DROP COLUMN IF EXISTS phone;

-- STEP 7: Add helpful comments
COMMENT ON COLUMN candidate_profiles.phone IS 'Contact phone number (moved from candidates table)';
COMMENT ON COLUMN candidate_profiles.cover_photo IS 'Facebook-style cover photo URL';
COMMENT ON COLUMN candidate_profiles.headline IS 'Professional headline (e.g., "Senior CSR | 5 years BPO")';
COMMENT ON COLUMN candidate_profiles.facebook IS 'Facebook profile URL';
COMMENT ON COLUMN candidate_profiles.gender IS 'Gender: male, female, non_binary, prefer_not_to_say, other';
COMMENT ON COLUMN candidate_profiles.gender_custom IS 'Custom gender text when "other" is selected';
COMMENT ON COLUMN candidate_profiles.location_region IS 'Philippines region (e.g., Region 3 - Central Luzon, NCR)';
COMMENT ON COLUMN candidate_profiles.location_province IS 'Province (e.g., Pampanga, Bulacan)';
COMMENT ON COLUMN candidate_profiles.location_city IS 'City/Municipality (e.g., Angeles City, Manila)';
COMMENT ON COLUMN candidate_profiles.location_barangay IS 'Barangay (smallest administrative unit)';

-- Storage Bucket Setup (Idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate',
  'candidate',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can upload to candidate bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to candidate photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload to candidate bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'candidate');

CREATE POLICY "Users can update their own candidate photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'candidate' AND (storage.foldername(name))[1] IN ('profile_photos', 'cover_photos'))
WITH CHECK (bucket_id = 'candidate' AND (storage.foldername(name))[1] IN ('profile_photos', 'cover_photos'));

CREATE POLICY "Users can delete their own candidate photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate' AND (storage.foldername(name))[1] IN ('profile_photos', 'cover_photos'));

CREATE POLICY "Public read access to candidate photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'candidate');

COMMIT;
