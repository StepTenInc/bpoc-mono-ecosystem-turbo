-- =====================================================
-- RECRUITER AUTHORIZATION SYSTEM MIGRATION
-- Date: 2026-01-28
-- Purpose: Add authorization levels, document tracking, and verification workflow
-- =====================================================

-- =====================================================
-- PART 1: CREATE ENUM FOR VERIFICATION STATUS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE recruiter_verification_status AS ENUM (
    'pending_documents',           -- Signed up as admin/owner, needs to upload docs
    'pending_admin_review',        -- Docs uploaded, BPOC admin reviewing
    'verified',                    -- Admin approved, account active
    'rejected',                    -- Admin rejected
    'pending_authorization_head'   -- Regular recruiter waiting for their agency head to be verified
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PART 2: ALTER agency_recruiters TABLE
-- =====================================================

-- Add authorization tracking columns
ALTER TABLE agency_recruiters
  ADD COLUMN IF NOT EXISTS invited_by_recruiter_id UUID REFERENCES agency_recruiters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_status recruiter_verification_status DEFAULT 'pending_documents',
  ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_recruiters_invited_by ON agency_recruiters(invited_by_recruiter_id);
CREATE INDEX IF NOT EXISTS idx_agency_recruiters_verification_status ON agency_recruiters(verification_status);

-- Add comments for documentation
COMMENT ON COLUMN agency_recruiters.invited_by_recruiter_id IS 'References the recruiter who invited this person (authorization chain tracking)';
COMMENT ON COLUMN agency_recruiters.verification_status IS 'Current verification status in the authorization workflow';
COMMENT ON COLUMN agency_recruiters.profile_completion_percentage IS 'Profile completion progress (0-100%)';

-- =====================================================
-- PART 3: ALTER agencies TABLE (DOCUMENT STORAGE)
-- =====================================================

-- Add document tracking columns
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS tin_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dti_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS business_permit_url TEXT,
  ADD COLUMN IF NOT EXISTS sec_registration_url TEXT,
  ADD COLUMN IF NOT EXISTS documents_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documents_verified_by UUID REFERENCES bpoc_users(id) ON DELETE SET NULL;

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_agencies_documents_verified ON agencies(documents_verified);

-- Add comments
COMMENT ON COLUMN agencies.tin_number IS 'Tax Identification Number';
COMMENT ON COLUMN agencies.dti_certificate_url IS 'DTI registration certificate URL (Supabase storage)';
COMMENT ON COLUMN agencies.business_permit_url IS 'Business permit document URL (Supabase storage)';
COMMENT ON COLUMN agencies.sec_registration_url IS 'SEC registration document URL (Supabase storage)';
COMMENT ON COLUMN agencies.documents_uploaded_at IS 'Timestamp when documents were uploaded';
COMMENT ON COLUMN agencies.documents_verified IS 'Whether BPOC admin has verified the documents';
COMMENT ON COLUMN agencies.documents_verified_at IS 'Timestamp when documents were verified';
COMMENT ON COLUMN agencies.documents_verified_by IS 'BPOC admin user who verified the documents';

-- =====================================================
-- PART 4: ALTER team_invitations TABLE
-- =====================================================

-- Add authorization head tracking
ALTER TABLE team_invitations
  ADD COLUMN IF NOT EXISTS requires_documents BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intended_role VARCHAR(50) DEFAULT 'recruiter';

-- Add comments
COMMENT ON COLUMN team_invitations.requires_documents IS 'TRUE if invitee needs to upload company documents (admin/owner role)';
COMMENT ON COLUMN team_invitations.intended_role IS 'Role this person will have after accepting (admin, owner, recruiter, etc.)';

-- =====================================================
-- PART 5: MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing is_verified status to new verification_status enum
UPDATE agency_recruiters SET
  verification_status = CASE
    WHEN is_verified = TRUE THEN 'verified'::recruiter_verification_status
    WHEN rejected_at IS NOT NULL THEN 'rejected'::recruiter_verification_status
    ELSE 'pending_documents'::recruiter_verification_status
  END
WHERE verification_status = 'pending_documents'; -- Only update records that haven't been migrated

-- Set profile completion percentage based on current state
UPDATE agency_recruiters SET
  profile_completion_percentage = CASE
    WHEN is_verified = TRUE THEN 100
    WHEN rejected_at IS NOT NULL THEN 0
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND email IS NOT NULL THEN 50
    ELSE 25
  END
WHERE profile_completion_percentage = 0; -- Only update records that haven't been set

-- =====================================================
-- PART 6: CREATE FUNCTION TO SYNC is_verified (BACKWARDS COMPAT)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_is_verified_from_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-sync is_verified based on verification_status
  NEW.is_verified := (NEW.verification_status = 'verified');

  -- Set verified_at timestamp if newly verified
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    NEW.verified_at := NOW();
  END IF;

  -- Set rejected_at timestamp if newly rejected
  IF NEW.verification_status = 'rejected' AND OLD.verification_status != 'rejected' THEN
    NEW.rejected_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_is_verified_trigger ON agency_recruiters;
CREATE TRIGGER sync_is_verified_trigger
  BEFORE UPDATE OF verification_status ON agency_recruiters
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_verified_from_verification_status();

-- =====================================================
-- PART 7: CREATE FUNCTION TO AUTO-APPROVE TEAM MEMBERS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_approve_team_members()
RETURNS TRIGGER AS $$
BEGIN
  -- When an authorization head is verified, auto-verify their team members
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    IF NEW.role IN ('admin', 'owner') THEN
      -- Update team members who are waiting for this person's verification
      UPDATE agency_recruiters
      SET
        verification_status = 'verified',
        is_verified = TRUE,
        verified_at = NOW(),
        is_active = TRUE
      WHERE
        invited_by_recruiter_id = NEW.id
        AND verification_status = 'pending_authorization_head'
        AND agency_id = NEW.agency_id;

      -- Also verify the agency documents if uploaded
      UPDATE agencies
      SET
        documents_verified = TRUE,
        documents_verified_at = NOW(),
        documents_verified_by = NEW.id
      WHERE
        id = NEW.agency_id
        AND documents_uploaded_at IS NOT NULL
        AND documents_verified = FALSE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_approve_team_members_trigger ON agency_recruiters;
CREATE TRIGGER auto_approve_team_members_trigger
  AFTER UPDATE OF verification_status ON agency_recruiters
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_team_members();

-- =====================================================
-- PART 8: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if recruiter can perform actions
CREATE OR REPLACE FUNCTION can_recruiter_perform_action(recruiter_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recruiter_status recruiter_verification_status;
  recruiter_active BOOLEAN;
BEGIN
  SELECT verification_status, is_active
  INTO recruiter_status, recruiter_active
  FROM agency_recruiters
  WHERE id = recruiter_id;

  -- Can only perform actions if verified and active
  RETURN (recruiter_status = 'verified' AND recruiter_active = TRUE);
END;
$$ LANGUAGE plpgsql;

-- Function to get authorization head for an agency
CREATE OR REPLACE FUNCTION get_authorization_head(p_agency_id UUID)
RETURNS TABLE(
  id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  role VARCHAR,
  verification_status recruiter_verification_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.first_name,
    ar.last_name,
    ar.email,
    ar.role,
    ar.verification_status
  FROM agency_recruiters ar
  WHERE ar.agency_id = p_agency_id
    AND ar.role IN ('admin', 'owner')
    AND ar.invited_by_recruiter_id IS NULL
  ORDER BY
    CASE ar.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END,
    ar.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 9: UPDATE RLS POLICIES (IF NEEDED)
-- =====================================================

-- Note: Existing RLS policies on agency_recruiters should continue to work
-- The new columns inherit the table's existing RLS policies

-- =====================================================
-- PART 10: CREATE VERIFICATION STATISTICS VIEW
-- =====================================================

CREATE OR REPLACE VIEW recruiter_verification_stats AS
SELECT
  verification_status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE role IN ('admin', 'owner')) as authorization_heads,
  COUNT(*) FILTER (WHERE role = 'recruiter') as regular_recruiters
FROM agency_recruiters
WHERE deleted_at IS NULL
GROUP BY verification_status;

-- =====================================================
-- PART 11: DATA VALIDATION CHECKS
-- =====================================================

-- Check for orphaned invitations (invited_by_recruiter_id points to non-existent recruiter)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM agency_recruiters ar
  WHERE ar.invited_by_recruiter_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM agency_recruiters ar2
      WHERE ar2.id = ar.invited_by_recruiter_id
    );

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned invited_by_recruiter_id references. Setting to NULL.', orphaned_count;

    UPDATE agency_recruiters
    SET invited_by_recruiter_id = NULL
    WHERE invited_by_recruiter_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM agency_recruiters ar2
        WHERE ar2.id = invited_by_recruiter_id
      );
  END IF;
END $$;

-- =====================================================
-- PART 12: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users (through RLS)
GRANT SELECT ON recruiter_verification_stats TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20260128_recruiter_authorization_system.sql completed successfully';
  RAISE NOTICE 'Added: verification_status enum, document tracking, authorization chain';
  RAISE NOTICE 'Backwards compatibility: is_verified field syncs automatically';
  RAISE NOTICE 'New features: Auto-approve team members, helper functions, statistics view';
END $$;
