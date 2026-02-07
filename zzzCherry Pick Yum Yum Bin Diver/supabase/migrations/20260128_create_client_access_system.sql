-- ============================================
-- CLIENT ACCESS SYSTEM FOR STANDARD PLATFORM
-- ============================================
-- Date: 2026-01-28
-- Purpose: Enable token-based client access to job dashboard and candidates
--
-- This migration creates:
-- 1. client_job_access_tokens - Job-level dashboard access (persistent)
-- 2. client_candidate_access_tokens - Candidate-level direct links (optional)
-- 3. client_access_log - Unified audit log for both token types
-- 4. Indexes for performance
-- 5. RLS policies for security
-- ============================================

BEGIN;

-- ============================================
-- PART 1: CLIENT JOB ACCESS TOKENS (PRIMARY ACCESS)
-- ============================================

CREATE TABLE IF NOT EXISTS client_job_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  agency_client_id UUID NOT NULL REFERENCES agency_clients(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,

  -- Access control
  can_view_statistics BOOLEAN DEFAULT true,
  can_view_released_candidates BOOLEAN DEFAULT true,
  can_download_resumes BOOLEAN DEFAULT true,
  can_join_interviews BOOLEAN DEFAULT true,

  -- Timeline
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,  -- NULL = permanent until job closes
  last_accessed_at TIMESTAMPTZ,
  access_count INT DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES bpoc_users(id),
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Constraints
  UNIQUE(job_id, agency_client_id)  -- One token per job-client pair
);

-- Comments
COMMENT ON TABLE client_job_access_tokens IS 'Job-level access tokens for clients (standard platform)';
COMMENT ON COLUMN client_job_access_tokens.token IS 'Secure random 64-character token for authentication';
COMMENT ON COLUMN client_job_access_tokens.expires_at IS 'NULL means permanent access until job closes';
COMMENT ON COLUMN client_job_access_tokens.is_revoked IS 'Manual revocation flag (candidate withdrew, access denied, etc.)';

-- Indexes for fast lookup
CREATE INDEX idx_client_job_tokens_token ON client_job_access_tokens(token) WHERE is_revoked = false;
CREATE INDEX idx_client_job_tokens_job ON client_job_access_tokens(job_id);
CREATE INDEX idx_client_job_tokens_client ON client_job_access_tokens(agency_client_id);
CREATE INDEX idx_client_job_tokens_expires ON client_job_access_tokens(expires_at) WHERE expires_at IS NOT NULL AND is_revoked = false;

-- ============================================
-- PART 2: CLIENT CANDIDATE ACCESS TOKENS (OPTIONAL DIRECT LINKS)
-- ============================================

CREATE TABLE IF NOT EXISTS client_candidate_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  agency_client_id UUID NOT NULL REFERENCES agency_clients(id) ON DELETE CASCADE,
  job_access_token_id UUID REFERENCES client_job_access_tokens(id) ON DELETE CASCADE,  -- Links to parent job token
  token VARCHAR(64) UNIQUE NOT NULL,

  -- Access control
  can_view_profile BOOLEAN DEFAULT true,
  can_view_resume BOOLEAN DEFAULT true,
  can_view_timeline BOOLEAN DEFAULT true,
  can_join_interviews BOOLEAN DEFAULT true,

  -- Timeline
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,  -- Default: 30 days
  last_accessed_at TIMESTAMPTZ,
  access_count INT DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES bpoc_users(id),
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Constraints
  UNIQUE(application_id, agency_client_id)  -- One token per application-client pair
);

-- Comments
COMMENT ON TABLE client_candidate_access_tokens IS 'Candidate-level access tokens for direct links (optional convenience)';
COMMENT ON COLUMN client_candidate_access_tokens.token IS 'Secure random 64-character token for authentication';
COMMENT ON COLUMN client_candidate_access_tokens.job_access_token_id IS 'Reference to parent job token (optional)';
COMMENT ON COLUMN client_candidate_access_tokens.expires_at IS 'Candidate tokens expire in 30 days by default';

-- Indexes for fast lookup
CREATE INDEX idx_client_candidate_tokens_token ON client_candidate_access_tokens(token) WHERE is_revoked = false;
CREATE INDEX idx_client_candidate_tokens_application ON client_candidate_access_tokens(application_id);
CREATE INDEX idx_client_candidate_tokens_job_token ON client_candidate_access_tokens(job_access_token_id);
CREATE INDEX idx_client_candidate_tokens_expires ON client_candidate_access_tokens(expires_at) WHERE is_revoked = false;

-- ============================================
-- PART 3: CLIENT ACCESS LOG (UNIFIED AUDIT LOG)
-- ============================================

CREATE TABLE IF NOT EXISTS client_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to either job token or candidate token
  job_token_id UUID REFERENCES client_job_access_tokens(id) ON DELETE CASCADE,
  candidate_token_id UUID REFERENCES client_candidate_access_tokens(id) ON DELETE CASCADE,

  -- Action tracking
  action VARCHAR(50) NOT NULL,  -- viewed_job_dashboard, viewed_candidate, downloaded_resume, joined_interview
  action_metadata JSONB DEFAULT '{}',  -- { application_id, interview_id, candidate_name, etc }

  -- Security
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraint: must reference at least one token type
  CONSTRAINT check_token_ref CHECK (job_token_id IS NOT NULL OR candidate_token_id IS NOT NULL)
);

-- Comments
COMMENT ON TABLE client_access_log IS 'Unified audit log for all client access events';
COMMENT ON COLUMN client_access_log.action IS 'Type of action performed (viewed_job_dashboard, viewed_candidate, etc.)';
COMMENT ON COLUMN client_access_log.action_metadata IS 'Additional context for the action (JSON)';

-- Indexes
CREATE INDEX idx_client_access_log_job_token ON client_access_log(job_token_id, created_at DESC);
CREATE INDEX idx_client_access_log_candidate_token ON client_access_log(candidate_token_id, created_at DESC);
CREATE INDEX idx_client_access_log_created ON client_access_log(created_at DESC);
CREATE INDEX idx_client_access_log_action ON client_access_log(action, created_at DESC);

-- ============================================
-- PART 4: TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update access count and last_accessed_at for job tokens
CREATE OR REPLACE FUNCTION update_job_token_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_token_id IS NOT NULL THEN
    UPDATE client_job_access_tokens
    SET
      access_count = access_count + 1,
      last_accessed_at = NEW.created_at
    WHERE id = NEW.job_token_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_token_access
  AFTER INSERT ON client_access_log
  FOR EACH ROW
  WHEN (NEW.job_token_id IS NOT NULL)
  EXECUTE FUNCTION update_job_token_access();

-- Update access count and last_accessed_at for candidate tokens
CREATE OR REPLACE FUNCTION update_candidate_token_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.candidate_token_id IS NOT NULL THEN
    UPDATE client_candidate_access_tokens
    SET
      access_count = access_count + 1,
      last_accessed_at = NEW.created_at
    WHERE id = NEW.candidate_token_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_token_access
  AFTER INSERT ON client_access_log
  FOR EACH ROW
  WHEN (NEW.candidate_token_id IS NOT NULL)
  EXECUTE FUNCTION update_candidate_token_access();

-- ============================================
-- PART 5: RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE client_job_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_candidate_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_access_log ENABLE ROW LEVEL SECURITY;

-- Job tokens: SELECT policy (no auth required, token-based)
CREATE POLICY "Anyone can read job tokens with valid token"
  ON client_job_access_tokens
  FOR SELECT
  USING (
    is_revoked = false
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Candidate tokens: SELECT policy (no auth required, token-based)
CREATE POLICY "Anyone can read candidate tokens with valid token"
  ON client_candidate_access_tokens
  FOR SELECT
  USING (
    is_revoked = false
    AND expires_at > now()
  );

-- Access log: INSERT policy (anyone can log access)
CREATE POLICY "Anyone can insert access log"
  ON client_access_log
  FOR INSERT
  WITH CHECK (true);

-- Access log: SELECT policy (only authenticated users can view logs)
CREATE POLICY "Authenticated users can view access logs"
  ON client_access_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Job tokens: INSERT/UPDATE policy (only authenticated users)
CREATE POLICY "Authenticated users can manage job tokens"
  ON client_job_access_tokens
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Candidate tokens: INSERT/UPDATE policy (only authenticated users)
CREATE POLICY "Authenticated users can manage candidate tokens"
  ON client_candidate_access_tokens
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PART 6: HELPER FUNCTIONS
-- ============================================

-- Function to validate job token
CREATE OR REPLACE FUNCTION validate_job_token(token_value VARCHAR)
RETURNS TABLE (
  token_id UUID,
  job_id UUID,
  agency_client_id UUID,
  can_view_statistics BOOLEAN,
  can_view_released_candidates BOOLEAN,
  can_download_resumes BOOLEAN,
  can_join_interviews BOOLEAN,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.job_id,
    t.agency_client_id,
    t.can_view_statistics,
    t.can_view_released_candidates,
    t.can_download_resumes,
    t.can_join_interviews,
    (t.is_revoked = false AND (t.expires_at IS NULL OR t.expires_at > now())) AS is_valid
  FROM client_job_access_tokens t
  WHERE t.token = token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate candidate token
CREATE OR REPLACE FUNCTION validate_candidate_token(token_value VARCHAR)
RETURNS TABLE (
  token_id UUID,
  application_id UUID,
  agency_client_id UUID,
  can_view_profile BOOLEAN,
  can_view_resume BOOLEAN,
  can_view_timeline BOOLEAN,
  can_join_interviews BOOLEAN,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.application_id,
    t.agency_client_id,
    t.can_view_profile,
    t.can_view_resume,
    t.can_view_timeline,
    t.can_join_interviews,
    (t.is_revoked = false AND t.expires_at > now()) AS is_valid
  FROM client_candidate_access_tokens t
  WHERE t.token = token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE 'client_%';

-- Verify indexes were created
-- SELECT indexname FROM pg_indexes
-- WHERE tablename LIKE 'client_%'
-- ORDER BY tablename, indexname;

-- Verify RLS policies
-- SELECT tablename, policyname FROM pg_policies
-- WHERE tablename LIKE 'client_%';
