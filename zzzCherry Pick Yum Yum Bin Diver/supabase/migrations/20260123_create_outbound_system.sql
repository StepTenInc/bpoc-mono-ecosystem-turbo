-- ============================================
-- BPOC OUTBOUND CAMPAIGN SYSTEM
-- ============================================
-- Date: 2026-01-23
-- Purpose: Complete email campaign and contact management system
--
-- This migration includes:
-- 1. Outbound contacts table (master contact database)
-- 2. Email campaigns table
-- 3. Campaign recipients table (many-to-many)
-- 4. Email activity log table
-- 5. CSV import batches table
-- 6. Triggers for auto-sync with candidates
-- 7. Indexes for performance
-- ============================================

BEGIN;

-- ============================================
-- TABLE 1: OUTBOUND CONTACTS
-- Master contact database - tracks ALL contacts (registered and unregistered)
-- ============================================

CREATE TABLE IF NOT EXISTS outbound_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(50),

  -- Tracking fields
  source VARCHAR(50), -- 'csv_import', 'manual', 'signup', etc.
  imported_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),

  -- Status tracking
  email_valid BOOLEAN DEFAULT TRUE,
  is_registered BOOLEAN DEFAULT FALSE, -- Linked to candidates table
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,

  -- Contact metrics
  total_emails_sent INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMP,
  first_email_sent_at TIMESTAMP,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,

  -- Deduplication tracking
  duplicate_of UUID REFERENCES outbound_contacts(id) ON DELETE SET NULL,
  is_duplicate BOOLEAN DEFAULT FALSE,

  -- Metadata
  custom_fields JSONB DEFAULT '{}', -- Store CSV-specific data
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Segmentation (e.g., ['migration', 'high_priority'])

  -- Unsubscribe
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE outbound_contacts IS 'Master contact database for email campaigns';
COMMENT ON COLUMN outbound_contacts.email IS 'Contact email address (unique)';
COMMENT ON COLUMN outbound_contacts.is_registered IS 'Whether contact has signed up as candidate';
COMMENT ON COLUMN outbound_contacts.candidate_id IS 'Link to candidates table if registered';
COMMENT ON COLUMN outbound_contacts.duplicate_of IS 'If merged, references the master contact';
COMMENT ON COLUMN outbound_contacts.custom_fields IS 'JSON field for storing CSV-imported custom data';
COMMENT ON COLUMN outbound_contacts.tags IS 'Array of tags for segmentation';

-- ============================================
-- TABLE 2: EMAIL CAMPAIGNS
-- Campaign configuration and tracking
-- ============================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_type VARCHAR(50), -- 'migration', 'job_alert', 'follow_up', 'custom'
  email_html TEXT NOT NULL, -- Full HTML email template

  -- Campaign config
  from_name VARCHAR(100) DEFAULT 'BPOC Team',
  from_email VARCHAR(255) DEFAULT 'noreply@bpoc.com',
  reply_to VARCHAR(255),

  -- Sending config
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'
  batch_size INTEGER DEFAULT 50,
  delay_between_batches INTEGER DEFAULT 5000, -- milliseconds

  -- Schedule
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  paused_at TIMESTAMP,

  -- Stats (auto-updated)
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,

  -- Filters (who gets this campaign)
  target_filters JSONB DEFAULT '{}', -- { is_registered: false, tags: ['migration'], min_emails_sent: 0, etc }

  -- Metadata
  notes TEXT,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE email_campaigns IS 'Email campaign configurations and tracking';
COMMENT ON COLUMN email_campaigns.email_html IS 'HTML email template with variables like {firstName}, {email}';
COMMENT ON COLUMN email_campaigns.target_filters IS 'JSON filters for recipient selection';
COMMENT ON COLUMN email_campaigns.status IS 'Campaign status: draft, scheduled, sending, completed, paused, cancelled';

-- ============================================
-- TABLE 3: CAMPAIGN RECIPIENTS
-- Many-to-many relationship between campaigns and contacts
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES outbound_contacts(id) ON DELETE CASCADE,

  -- Sending status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced', 'opened', 'clicked', 'skipped'
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Email details (for audit)
  rendered_subject VARCHAR(255),
  rendered_html TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(campaign_id, contact_id) -- No duplicate sends per campaign
);

COMMENT ON TABLE campaign_recipients IS 'Tracks individual email sends per campaign';
COMMENT ON COLUMN campaign_recipients.status IS 'Recipient status: pending, sent, failed, bounced, opened, clicked, skipped';
COMMENT ON COLUMN campaign_recipients.rendered_html IS 'Final rendered email HTML (for audit trail)';

-- ============================================
-- TABLE 4: EMAIL ACTIVITY LOG
-- Detailed audit trail of all email events
-- ============================================

CREATE TABLE IF NOT EXISTS email_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES outbound_contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE SET NULL,

  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'
  event_data JSONB DEFAULT '{}', -- Additional event metadata

  -- Email details
  subject VARCHAR(255),
  from_email VARCHAR(255),
  to_email VARCHAR(255),

  -- Engagement tracking
  user_agent TEXT,
  ip_address INET,
  link_clicked TEXT, -- URL if event_type = 'clicked'
  bounce_reason TEXT, -- Reason if event_type = 'bounced'

  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE email_activity_log IS 'Detailed audit trail of all email events';
COMMENT ON COLUMN email_activity_log.event_type IS 'Event type: sent, delivered, opened, clicked, bounced, complained, unsubscribed';
COMMENT ON COLUMN email_activity_log.event_data IS 'Additional event metadata in JSON format';

-- ============================================
-- TABLE 5: CSV IMPORT BATCHES
-- Track CSV imports
-- ============================================

CREATE TABLE IF NOT EXISTS csv_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,

  -- Import stats
  total_rows INTEGER,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Processing
  status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_log JSONB DEFAULT '[]',

  -- Mapping
  column_mapping JSONB, -- { csv_col: 'db_field' }
  dedupe_strategy VARCHAR(50) DEFAULT 'skip', -- 'skip', 'update', 'mark_duplicate'

  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

COMMENT ON TABLE csv_import_batches IS 'Tracks CSV import batches and their results';
COMMENT ON COLUMN csv_import_batches.column_mapping IS 'Maps CSV columns to database fields';
COMMENT ON COLUMN csv_import_batches.dedupe_strategy IS 'How to handle duplicates: skip, update, mark_duplicate';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_outbound_contacts_email ON outbound_contacts(email);
CREATE INDEX IF NOT EXISTS idx_outbound_contacts_registered ON outbound_contacts(is_registered, candidate_id);
CREATE INDEX IF NOT EXISTS idx_outbound_contacts_valid ON outbound_contacts(email_valid);
CREATE INDEX IF NOT EXISTS idx_outbound_contacts_unsubscribed ON outbound_contacts(unsubscribed) WHERE unsubscribed = FALSE;
CREATE INDEX IF NOT EXISTS idx_outbound_contacts_tags ON outbound_contacts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact ON campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_activity_log_contact ON email_activity_log(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_activity_log_campaign ON email_activity_log(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_activity_log_event_type ON email_activity_log(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_csv_import_batches_imported_by ON csv_import_batches(imported_by);
CREATE INDEX IF NOT EXISTS idx_csv_import_batches_status ON csv_import_batches(status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp on outbound_contacts
CREATE OR REPLACE FUNCTION update_outbound_contacts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outbound_contacts_timestamp
BEFORE UPDATE ON outbound_contacts
FOR EACH ROW
EXECUTE FUNCTION update_outbound_contacts_timestamp();

-- Auto-update updated_at timestamp on email_campaigns
CREATE OR REPLACE FUNCTION update_email_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_campaigns_timestamp
BEFORE UPDATE ON email_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_email_campaigns_timestamp();

-- Sync candidate registrations to outbound_contacts
CREATE OR REPLACE FUNCTION sync_candidate_to_outbound()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO outbound_contacts (
    email, first_name, last_name, phone_number,
    is_registered, candidate_id, source
  )
  VALUES (
    NEW.email, NEW.first_name, NEW.last_name, NEW.phone_number,
    TRUE, NEW.id, 'signup'
  )
  ON CONFLICT (email) DO UPDATE SET
    is_registered = TRUE,
    candidate_id = NEW.id,
    first_name = COALESCE(outbound_contacts.first_name, EXCLUDED.first_name),
    last_name = COALESCE(outbound_contacts.last_name, EXCLUDED.last_name),
    phone_number = COALESCE(outbound_contacts.phone_number, EXCLUDED.phone_number),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_candidate_to_outbound
AFTER INSERT OR UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION sync_candidate_to_outbound();

-- Update campaign stats when recipient status changes
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment sent_count when status changes to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    UPDATE email_campaigns
    SET sent_count = sent_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  -- Increment failed_count when status changes to 'failed'
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    UPDATE email_campaigns
    SET failed_count = failed_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  -- Increment bounced_count when status changes to 'bounced'
  IF NEW.status = 'bounced' AND (OLD.status IS NULL OR OLD.status != 'bounced') THEN
    UPDATE email_campaigns
    SET bounced_count = bounced_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  -- Increment opened_count when opened_at is set
  IF NEW.opened_at IS NOT NULL AND (OLD.opened_at IS NULL) THEN
    UPDATE email_campaigns
    SET opened_count = opened_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  -- Increment clicked_count when clicked_at is set
  IF NEW.clicked_at IS NOT NULL AND (OLD.clicked_at IS NULL) THEN
    UPDATE email_campaigns
    SET clicked_count = clicked_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_stats
AFTER INSERT OR UPDATE ON campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats();

-- Update contact email metrics when activity logged
CREATE OR REPLACE FUNCTION update_contact_email_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update opened count
  IF NEW.event_type = 'opened' THEN
    UPDATE outbound_contacts
    SET emails_opened = emails_opened + 1
    WHERE id = NEW.contact_id;
  END IF;

  -- Update clicked count
  IF NEW.event_type = 'clicked' THEN
    UPDATE outbound_contacts
    SET emails_clicked = emails_clicked + 1
    WHERE id = NEW.contact_id;
  END IF;

  -- Mark email as invalid if hard bounce
  IF NEW.event_type = 'bounced' AND NEW.event_data->>'bounce_type' = 'hard' THEN
    UPDATE outbound_contacts
    SET email_valid = FALSE
    WHERE id = NEW.contact_id;
  END IF;

  -- Handle unsubscribe
  IF NEW.event_type = 'unsubscribed' THEN
    UPDATE outbound_contacts
    SET unsubscribed = TRUE, unsubscribed_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_email_metrics
AFTER INSERT ON email_activity_log
FOR EACH ROW
EXECUTE FUNCTION update_contact_email_metrics();

COMMIT;

-- ============================================
-- END OF MIGRATION
-- ============================================
