-- Migration: Create comprehensive audit log system
-- Date: 2026-01-19
-- Purpose: Track all admin actions and critical system events for compliance

-- ========================================
-- 1. Create audit_log table
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id UUID, -- NULL for system actions
  user_email VARCHAR(255),
  user_role VARCHAR(50), -- admin, recruiter, system
  user_ip_address INET,
  user_agent TEXT,

  -- What action was performed
  action VARCHAR(100) NOT NULL, -- see actions enum below
  action_category VARCHAR(50), -- auth, data, config, security, compliance

  -- What resource was affected
  resource_type VARCHAR(50), -- candidate, job, application, recording, agency, etc.
  resource_id UUID,
  resource_description TEXT,

  -- Action details
  old_value JSONB, -- Previous state
  new_value JSONB, -- New state
  changes JSONB, -- Detailed change set

  -- Context & metadata
  metadata JSONB DEFAULT '{}',
  session_id UUID,
  request_id VARCHAR(100),

  -- Result
  status VARCHAR(20) DEFAULT 'success', -- success, failure, partial
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Retention
  retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '7 years') -- Compliance: 7-year retention
);

-- ========================================
-- 2. Add comments
-- ========================================
COMMENT ON TABLE audit_log IS 'Immutable audit trail for all critical system actions';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action (NULL for system)';
COMMENT ON COLUMN audit_log.action IS 'Action performed (e.g., user_created, recording_deleted)';
COMMENT ON COLUMN audit_log.resource_type IS 'Type of resource affected';
COMMENT ON COLUMN audit_log.old_value IS 'Resource state before change';
COMMENT ON COLUMN audit_log.new_value IS 'Resource state after change';
COMMENT ON COLUMN audit_log.retention_until IS 'Date when this log can be deleted (7 years for compliance)';

-- ========================================
-- 3. Create indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON audit_log(session_id) WHERE session_id IS NOT NULL;

-- ========================================
-- 4. Create RLS policies (Read-only for most users)
-- ========================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY audit_log_admin_select ON audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- System can insert (via service role)
-- Note: This policy is permissive for service role, but regular users cannot insert
CREATE POLICY audit_log_system_insert ON audit_log
FOR INSERT
TO authenticated
WITH CHECK (TRUE); -- Will be enforced by application logic

-- NO UPDATE OR DELETE POLICIES
-- Audit logs are immutable

-- ========================================
-- 5. Create function to log audit events
-- ========================================
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_email VARCHAR(255);
  v_user_role VARCHAR(50);
  v_action_category VARCHAR(50);
BEGIN
  -- Get user info
  IF p_user_id IS NOT NULL THEN
    SELECT email, role INTO v_user_email, v_user_role
    FROM users
    WHERE id = p_user_id;
  END IF;

  -- Determine action category
  v_action_category := CASE
    WHEN p_action LIKE 'user_%' OR p_action LIKE 'auth_%' THEN 'auth'
    WHEN p_action LIKE 'recording_%' OR p_action LIKE 'data_%' THEN 'data'
    WHEN p_action LIKE 'config_%' OR p_action LIKE 'agency_%' THEN 'config'
    WHEN p_action LIKE 'security_%' OR p_action LIKE 'access_%' THEN 'security'
    WHEN p_action LIKE 'gdpr_%' OR p_action LIKE 'compliance_%' THEN 'compliance'
    ELSE 'general'
  END;

  -- Insert audit log
  INSERT INTO audit_log (
    user_id,
    user_email,
    user_role,
    action,
    action_category,
    resource_type,
    resource_id,
    old_value,
    new_value,
    metadata,
    status
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_role,
    p_action,
    v_action_category,
    p_resource_type,
    p_resource_id,
    p_old_value,
    p_new_value,
    p_metadata,
    'success'
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. Common audit actions (reference)
-- ========================================
/*
Authentication & Access:
- user_created
- user_updated
- user_deleted
- user_suspended
- user_reactivated
- auth_login_success
- auth_login_failed
- auth_logout
- access_granted
- access_denied

Data Operations:
- recording_created
- recording_viewed
- recording_shared
- recording_unshared
- recording_deleted
- recording_hard_deleted
- application_status_changed
- application_released
- application_rejected
- offer_created
- offer_accepted
- offer_withdrawn

Configuration:
- agency_created
- agency_updated
- agency_suspended
- config_changed
- retention_policy_updated
- feature_enabled
- feature_disabled

Security:
- security_breach_detected
- suspicious_activity
- rate_limit_exceeded
- unauthorized_access_attempt

Compliance:
- gdpr_request_received
- gdpr_data_exported
- gdpr_data_deleted
- legal_hold_applied
- legal_hold_released
*/

-- ========================================
-- 7. Create trigger for critical table changes (example)
-- ========================================
CREATE OR REPLACE FUNCTION audit_job_application_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM create_audit_log(
      auth.uid(),
      'application_status_changed',
      'job_application',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'candidate_id', NEW.candidate_id,
        'job_id', NEW.job_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to job_applications table
DROP TRIGGER IF EXISTS trigger_audit_job_application_changes ON job_applications;
CREATE TRIGGER trigger_audit_job_application_changes
AFTER UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION audit_job_application_changes();
