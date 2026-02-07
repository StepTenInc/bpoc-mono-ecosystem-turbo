-- ============================================================================
-- BPOC Webhooks System
-- Created: 2026-01-22
-- Purpose: Enable real-time webhook notifications for agency integrations
-- ============================================================================

-- Webhooks table - stores webhook configurations per agency
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Webhook configuration
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,

  -- Security
  secret TEXT NOT NULL, -- HMAC secret for signature verification

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES agency_recruiters(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_url CHECK (url ~ '^https?://'),
  CONSTRAINT valid_events CHECK (array_length(events, 1) > 0)
);

-- Webhook deliveries table - tracks every webhook delivery attempt
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Event data
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, retrying
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  -- Response tracking
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'retrying'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhooks_agency_id ON webhooks(agency_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING gin(events);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at)
  WHERE status = 'retrying';

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- RLS Policies
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Agencies can only see their own webhooks
CREATE POLICY webhooks_agency_isolation ON webhooks
  FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_recruiters WHERE user_id = auth.uid()
    )
  );

-- Agencies can only see deliveries for their webhooks
CREATE POLICY webhook_deliveries_agency_isolation ON webhook_deliveries
  FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE agency_id IN (
        SELECT agency_id FROM agency_recruiters WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can do everything (for webhook delivery system)
CREATE POLICY webhooks_service_role ON webhooks
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY webhook_deliveries_service_role ON webhook_deliveries
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get webhooks for a specific event type
CREATE OR REPLACE FUNCTION get_webhooks_for_event(
  p_event_type TEXT
)
RETURNS TABLE (
  id UUID,
  agency_id UUID,
  url TEXT,
  secret TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.agency_id,
    w.url,
    w.secret
  FROM webhooks w
  WHERE
    w.is_active = true
    AND (
      p_event_type = ANY(w.events)
      OR EXISTS (
        SELECT 1 FROM unnest(w.events) AS event
        WHERE p_event_type LIKE event
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON webhooks TO service_role;
GRANT ALL ON webhook_deliveries TO service_role;
GRANT EXECUTE ON FUNCTION get_webhooks_for_event TO service_role;

-- Comments
COMMENT ON TABLE webhooks IS 'Webhook configurations for agency integrations';
COMMENT ON TABLE webhook_deliveries IS 'Tracks webhook delivery attempts and responses';
COMMENT ON FUNCTION get_webhooks_for_event IS 'Retrieves active webhooks subscribed to a specific event type (supports wildcards)';

-- Done!
