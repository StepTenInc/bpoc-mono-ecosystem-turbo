-- =====================================================
-- CREATE AGENCY DOCUMENTS STORAGE BUCKET
-- Date: 2026-01-28
-- Purpose: Store agency verification documents (TIN, DTI, business permit, SEC)
-- =====================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency-documents',
  'agency-documents',
  false, -- Private bucket (not publicly accessible)
  5242880, -- 5MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR AGENCY DOCUMENTS
-- =====================================================

-- Allow recruiters to upload documents for their own agency
CREATE POLICY "Recruiters can upload documents for their agency"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agency-documents' AND
  auth.uid() IN (
    SELECT user_id
    FROM agency_recruiters
    WHERE role IN ('admin', 'owner')
      AND agency_id::text = (storage.foldername(name))[1]
      AND is_active = true
  )
);

-- Allow recruiters to view documents for their own agency
CREATE POLICY "Recruiters can view their agency documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'agency-documents' AND
  auth.uid() IN (
    SELECT user_id
    FROM agency_recruiters
    WHERE agency_id::text = (storage.foldername(name))[1]
      AND is_active = true
  )
);

-- Allow BPOC admins to view all agency documents
CREATE POLICY "BPOC admins can view all agency documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'agency-documents' AND
  auth.uid() IN (
    SELECT id
    FROM bpoc_users
    WHERE role = 'admin'
  )
);

-- Allow recruiters to update/replace documents for their agency
CREATE POLICY "Recruiters can update their agency documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agency-documents' AND
  auth.uid() IN (
    SELECT user_id
    FROM agency_recruiters
    WHERE role IN ('admin', 'owner')
      AND agency_id::text = (storage.foldername(name))[1]
      AND is_active = true
  )
);

-- Allow recruiters to delete documents for their agency
CREATE POLICY "Recruiters can delete their agency documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'agency-documents' AND
  auth.uid() IN (
    SELECT user_id
    FROM agency_recruiters
    WHERE role IN ('admin', 'owner')
      AND agency_id::text = (storage.foldername(name))[1]
      AND is_active = true
  )
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Storage bucket "agency-documents" created successfully';
  RAISE NOTICE 'RLS policies applied for recruiter and admin access';
END $$;
