-- ============================================
-- FINAL MIGRATION: Storage Bucket & RLS
-- ============================================

BEGIN;

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
-- Note: Modifying storage.objects RLS often requires superuser privileges.
-- If this fails via MCP, please run in Supabase SQL Editor.

-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Generally already enabled

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
