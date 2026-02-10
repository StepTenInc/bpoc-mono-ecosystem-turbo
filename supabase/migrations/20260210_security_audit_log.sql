-- Security Audit Log table for tracking security-relevant events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'api_key', 'system')),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_agency_id ON security_audit_log(agency_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON security_audit_log(severity) WHERE severity IN ('warning', 'error', 'critical');

-- RLS policies
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert (API routes use admin client)
CREATE POLICY "Service role can insert audit logs" ON security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Agency admins can view their own audit logs
CREATE POLICY "Agency admins can view their audit logs" ON security_audit_log
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_recruiters 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Comment
COMMENT ON TABLE security_audit_log IS 'Security audit trail for compliance and monitoring';
