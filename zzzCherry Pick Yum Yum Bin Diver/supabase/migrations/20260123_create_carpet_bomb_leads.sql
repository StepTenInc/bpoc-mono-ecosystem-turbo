-- =====================================================
-- BPOC Carpet Bomb Leads System
-- =====================================================
-- Purpose: Track outbound lead generation campaigns
-- Features: UTM tracking, conversion funnel, duplicate prevention
-- =====================================================

-- 1. Main Leads Table
CREATE TABLE IF NOT EXISTS carpet_bomb_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Info
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(50),

  -- Source Data (from original CSVs)
  city VARCHAR(100),
  current_salary VARCHAR(50),
  expected_salary VARCHAR(50),
  resume_url TEXT,
  profile_picture_url TEXT,
  clickup_url TEXT,
  original_source VARCHAR(50), -- 'ShoreAgents', 'Jobs360', 'ClickUp', etc.

  -- Tracking Fields
  been_contacted BOOLEAN DEFAULT FALSE,
  contact_count INTEGER DEFAULT 0, -- How many emails sent
  last_contacted_at TIMESTAMP WITH TIME ZONE,

  visited_site BOOLEAN DEFAULT FALSE,
  first_visit_at TIMESTAMP WITH TIME ZONE,
  visit_count INTEGER DEFAULT 0,

  signed_up BOOLEAN DEFAULT FALSE,
  signed_up_at TIMESTAMP WITH TIME ZONE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,

  -- UTM Tracking (what brought them to site)
  utm_source VARCHAR(100), -- 'email'
  utm_medium VARCHAR(100), -- 'campaign'
  utm_campaign VARCHAR(100), -- 'migration_wave_1'
  utm_content VARCHAR(100), -- 'cta_button'
  utm_term VARCHAR(100),

  -- Email Engagement
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_emails_clicked INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,

  -- Lifecycle
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN DEFAULT FALSE,

  -- Custom Data
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_carpet_bomb_leads_email ON carpet_bomb_leads(email);
CREATE INDEX IF NOT EXISTS idx_carpet_bomb_leads_signed_up ON carpet_bomb_leads(signed_up);
CREATE INDEX IF NOT EXISTS idx_carpet_bomb_leads_contacted ON carpet_bomb_leads(been_contacted);
CREATE INDEX IF NOT EXISTS idx_carpet_bomb_leads_candidate_id ON carpet_bomb_leads(candidate_id);
CREATE INDEX IF NOT EXISTS idx_carpet_bomb_leads_utm_campaign ON carpet_bomb_leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_carpet_bomb_leads_tags ON carpet_bomb_leads USING GIN(tags);

-- 2. Campaign Relationships Table
CREATE TABLE IF NOT EXISTS carpet_bomb_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'email', -- 'email', 'competition', 'referral'

  -- Campaign Details
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'paused'

  -- Tracking
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0, -- signups

  -- Competition/Prize (if applicable)
  has_prize BOOLEAN DEFAULT FALSE,
  prize_amount DECIMAL(10, 2),
  prize_currency VARCHAR(10) DEFAULT 'PHP',
  winner_lead_id UUID REFERENCES carpet_bomb_leads(id),
  winner_drawn_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lead-Campaign Junction (many-to-many)
CREATE TABLE IF NOT EXISTS carpet_bomb_lead_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES carpet_bomb_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES carpet_bomb_campaigns(id) ON DELETE CASCADE,

  -- Participation
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_opened BOOLEAN DEFAULT FALSE,
  email_clicked BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE, -- signed up

  -- Competition Entry (if applicable)
  entry_number INTEGER, -- Random number for monthly draw

  UNIQUE(lead_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_campaigns_lead ON carpet_bomb_lead_campaigns(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_campaign ON carpet_bomb_lead_campaigns(campaign_id);

-- 4. Link Tracking Table (track every unique link click)
CREATE TABLE IF NOT EXISTS carpet_bomb_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES carpet_bomb_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES carpet_bomb_campaigns(id) ON DELETE SET NULL,

  -- Link Details
  url TEXT NOT NULL,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),

  -- Tracking
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_lead ON carpet_bomb_link_clicks(lead_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_campaign ON carpet_bomb_link_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON carpet_bomb_link_clicks(clicked_at);

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_carpet_bomb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_carpet_bomb_leads_updated
  BEFORE UPDATE ON carpet_bomb_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_carpet_bomb_updated_at();

CREATE TRIGGER trigger_carpet_bomb_campaigns_updated
  BEFORE UPDATE ON carpet_bomb_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_carpet_bomb_updated_at();

-- 6. Sync lead to candidate when they sign up
CREATE OR REPLACE FUNCTION sync_carpet_bomb_to_candidate()
RETURNS TRIGGER AS $$
BEGIN
  -- When a candidate is created with matching email, link them
  UPDATE carpet_bomb_leads
  SET
    signed_up = TRUE,
    signed_up_at = NOW(),
    candidate_id = NEW.id
  WHERE email = NEW.email
    AND signed_up = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_candidate_signup
  AFTER INSERT ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION sync_carpet_bomb_to_candidate();

-- 7. Update candidate_id if lead already exists
CREATE OR REPLACE FUNCTION update_existing_carpet_bomb_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing lead with candidate_id
  IF EXISTS (SELECT 1 FROM carpet_bomb_leads WHERE email = NEW.email) THEN
    UPDATE carpet_bomb_leads
    SET
      signed_up = TRUE,
      signed_up_at = COALESCE(signed_up_at, NOW()),
      candidate_id = NEW.id,
      first_name = COALESCE(first_name, NEW.first_name),
      last_name = COALESCE(last_name, NEW.last_name),
      phone_number = COALESCE(phone_number, NEW.phone_number)
    WHERE email = NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_on_candidate_update
  AFTER UPDATE ON candidates
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION update_existing_carpet_bomb_lead();

COMMENT ON TABLE carpet_bomb_leads IS 'Outbound lead generation database with full lifecycle tracking';
COMMENT ON TABLE carpet_bomb_campaigns IS 'Marketing campaigns (email blasts, competitions, referrals)';
COMMENT ON TABLE carpet_bomb_lead_campaigns IS 'Junction table tracking which leads are in which campaigns';
COMMENT ON TABLE carpet_bomb_link_clicks IS 'Detailed click tracking for attribution';
