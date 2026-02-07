-- =====================================================
-- SITE SETTINGS TABLE
-- Global settings for SEO, organization schema, and site-wide configuration
-- Created: 2026-01-30
-- =====================================================

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);

-- Add RLS policies (admin-only access)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Admin users can read all settings
CREATE POLICY "Admin users can read site settings"
  ON site_settings
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
  );

-- Admin users can update settings
CREATE POLICY "Admin users can update site settings"
  ON site_settings
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
  );

-- Admin users can insert settings
CREATE POLICY "Admin users can insert site settings"
  ON site_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
  );

-- Public read access for certain keys (organization schema, etc.)
CREATE POLICY "Public can read organization schema"
  ON site_settings
  FOR SELECT
  USING (setting_key IN ('organization_schema', 'website_schema'));

-- Insert default organization schema
INSERT INTO site_settings (setting_key, setting_value, description) VALUES (
  'organization_schema',
  '{
    "name": "BPOC Careers",
    "legalName": "BPOC.IO",
    "url": "https://www.bpoc.io",
    "logo": "https://www.bpoc.io/icon.svg",
    "description": "AI-powered BPO recruitment platform connecting Filipino professionals with global opportunities",
    "telephone": "+63-xxx-xxx-xxxx",
    "email": "hello@bpoc.io",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PH",
      "addressRegion": "Metro Manila",
      "addressLocality": "Philippines"
    },
    "sameAs": [
      "https://www.linkedin.com/company/bpoc-careers",
      "https://www.facebook.com/BPOCCareers",
      "https://twitter.com/BPOCCareers"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+63-xxx-xxx-xxxx",
      "contactType": "Customer Service",
      "areaServed": ["PH", "US", "CA", "AU", "GB"],
      "availableLanguage": ["English", "Tagalog"]
    }
  }'::jsonb,
  'Organization schema markup for SEO (schema.org/Organization)'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert website schema
INSERT INTO site_settings (setting_key, setting_value, description) VALUES (
  'website_schema',
  '{
    "url": "https://www.bpoc.io",
    "name": "BPOC Careers",
    "description": "BPO careers and outsourcing insights",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.bpoc.io/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }'::jsonb,
  'Website schema markup for SEO (schema.org/WebSite)'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_timestamp();

-- Grant permissions
GRANT SELECT ON site_settings TO anon, authenticated;
GRANT ALL ON site_settings TO service_role;

COMMENT ON TABLE site_settings IS 'Global site settings for SEO, organization schema, and configuration';
COMMENT ON COLUMN site_settings.setting_key IS 'Unique identifier for the setting (e.g., organization_schema)';
COMMENT ON COLUMN site_settings.setting_value IS 'JSONB value for flexible data storage';
COMMENT ON COLUMN site_settings.description IS 'Human-readable description of what this setting controls';
