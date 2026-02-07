-- Migration: Create API Testing Simulator Tables
-- Created: 2026-01-26
-- Description: Tables to support the API testing simulator for enterprise/agency API validation

-- Track test agencies created via simulator
CREATE TABLE IF NOT EXISTS developer_test_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_developer_test_agencies_agency_id ON developer_test_agencies(agency_id);
CREATE INDEX IF NOT EXISTS idx_developer_test_agencies_created_by ON developer_test_agencies(created_by);
CREATE INDEX IF NOT EXISTS idx_developer_test_agencies_api_key ON developer_test_agencies(api_key);

-- Track webhook deliveries for monitoring and debugging
CREATE TABLE IF NOT EXISTS webhook_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook monitoring
CREATE INDEX IF NOT EXISTS idx_webhook_test_logs_webhook_id ON webhook_test_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_test_logs_event_type ON webhook_test_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_test_logs_created_at ON webhook_test_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_test_logs_response_status ON webhook_test_logs(response_status);

-- Track API test requests made through the simulator
CREATE TABLE IF NOT EXISTS api_test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_agency_id UUID REFERENCES developer_test_agencies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  response_headers JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for test request history
CREATE INDEX IF NOT EXISTS idx_api_test_requests_test_agency_id ON api_test_requests(test_agency_id);
CREATE INDEX IF NOT EXISTS idx_api_test_requests_created_at ON api_test_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_test_requests_created_by ON api_test_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_api_test_requests_endpoint ON api_test_requests(endpoint);

-- Enable RLS
ALTER TABLE developer_test_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_test_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_test_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can access simulator data
CREATE POLICY "Admins can manage test agencies"
  ON developer_test_agencies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bpoc_users
      WHERE id = auth.uid()
      AND admin_level IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can view webhook test logs"
  ON webhook_test_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bpoc_users
      WHERE id = auth.uid()
      AND admin_level IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can manage API test requests"
  ON api_test_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bpoc_users
      WHERE id = auth.uid()
      AND admin_level IN ('super_admin', 'admin')
    )
  );

-- Grant access to service role (for API routes)
GRANT ALL ON developer_test_agencies TO service_role;
GRANT ALL ON webhook_test_logs TO service_role;
GRANT ALL ON api_test_requests TO service_role;

-- Comments for documentation
COMMENT ON TABLE developer_test_agencies IS 'Test agencies created through the API simulator for testing enterprise API integration';
COMMENT ON TABLE webhook_test_logs IS 'Logs of webhook deliveries for monitoring and debugging';
COMMENT ON TABLE api_test_requests IS 'History of API requests made through the simulator UI';
