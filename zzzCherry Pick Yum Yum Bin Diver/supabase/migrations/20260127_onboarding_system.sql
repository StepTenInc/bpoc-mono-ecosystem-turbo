-- =====================================================
-- BPOC Onboarding System - Database Migration
-- Phase 1: Comprehensive Philippines 201 File System
-- Generated: January 27, 2026
-- =====================================================

-- Drop existing tables if replacing (Option A)
DROP TABLE IF EXISTS employment_contracts CASCADE;
DROP TABLE IF EXISTS candidate_onboarding CASCADE;

-- =====================================================
-- Table 1: candidate_onboarding
-- Main onboarding record with Philippines 201 file data
-- =====================================================

CREATE TABLE candidate_onboarding (
  -- Primary Keys & References
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT, -- Male, Female, Non-Binary, Prefer not to say
  civil_status TEXT, -- Single, Married, Widowed, Separated
  date_of_birth DATE NOT NULL,
  contact_no TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT, -- Full address for contract
  
  -- Government IDs (Philippines Required for 201 File)
  sss TEXT, -- Social Security System (XX-XXXXXXX-X)
  tin TEXT, -- Tax Identification Number (XXX-XXX-XXX-XXX)
  philhealth_no TEXT, -- PhilHealth No (XX-XXXXXXXXX-X)
  pagibig_no TEXT, -- Pag-IBIG No (XXXX-XXXX-XXXX)
  
  -- Document URLs (Stored in Supabase Storage)
  sss_doc_url TEXT,
  tin_doc_url TEXT,
  philhealth_doc_url TEXT,
  pagibig_doc_url TEXT,
  valid_id_url TEXT,
  
  -- Education
  education_level TEXT, -- High School, College, Bachelor's, Master's, Doctorate
  education_doc_url TEXT, -- Diploma/Transcript
  
  -- Medical Clearance
  medical_cert_url TEXT,
  medical_notes TEXT,
  
  -- Data Privacy Consent (Philippines DPA 2012 compliance)
  accepts_data_privacy BOOLEAN DEFAULT FALSE,
  data_privacy_signed_at TIMESTAMPTZ,
  
  -- Resume
  resume_url TEXT,
  
  -- Digital Signature
  signature_url TEXT, -- Base64 or Supabase Storage URL
  signature_date TIMESTAMPTZ,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  
  -- Section Status Tracking (8 sections)
  personal_info_status TEXT DEFAULT 'PENDING', -- PENDING, SUBMITTED, APPROVED, REJECTED
  gov_id_status TEXT DEFAULT 'PENDING',
  education_status TEXT DEFAULT 'PENDING',
  medical_status TEXT DEFAULT 'PENDING',
  data_privacy_status TEXT DEFAULT 'PENDING',
  resume_status TEXT DEFAULT 'PENDING',
  signature_status TEXT DEFAULT 'PENDING',
  emergency_contact_status TEXT DEFAULT 'PENDING',
  
  -- Section Feedback (For rejections)
  personal_info_feedback TEXT,
  gov_id_feedback TEXT,
  education_feedback TEXT,
  medical_feedback TEXT,
  data_privacy_feedback TEXT,
  resume_feedback TEXT,
  signature_feedback TEXT,
  emergency_contact_feedback TEXT,
  
  -- Overall Progress
  completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  is_complete BOOLEAN DEFAULT FALSE,
  
  -- Contract Data
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  contract_pdf_url TEXT,
  
  -- Job Details (For Contract Generation)
  position TEXT,
  contact_type TEXT, -- FULL_TIME, PART_TIME, PROJECT_BASED
  assigned_client TEXT,
  start_date DATE,
  work_schedule TEXT, -- e.g., "Mon-Fri 9AM-6PM"
  basic_salary DECIMAL(10, 2),
  de_minimis DECIMAL(10, 2), -- Tax-exempt benefits
  total_monthly_gross DECIMAL(10, 2),
  hmo_offer TEXT, -- Health insurance details
  paid_leave TEXT, -- Leave policy
  probationary_period TEXT, -- e.g., "6 months"
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for candidate_onboarding
CREATE INDEX idx_candidate_onboarding_candidate_id ON candidate_onboarding(candidate_id);
CREATE INDEX idx_candidate_onboarding_application_id ON candidate_onboarding(job_application_id);
CREATE INDEX idx_candidate_onboarding_is_complete ON candidate_onboarding(is_complete);
CREATE INDEX idx_candidate_onboarding_completion_percent ON candidate_onboarding(completion_percent);
CREATE INDEX idx_candidate_onboarding_created_at ON candidate_onboarding(created_at DESC);

-- Unique constraint: One onboarding per job application
CREATE UNIQUE INDEX idx_candidate_onboarding_unique_application ON candidate_onboarding(job_application_id);

-- =====================================================
-- Table 2: employment_contracts
-- Generated Philippines labor law-compliant contracts
-- =====================================================

CREATE TABLE employment_contracts (
  -- Primary Keys & References
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_onboarding_id UUID NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  
  -- Contract Content
  contract_html TEXT NOT NULL, -- Full contract HTML for preview
  contract_pdf_url TEXT, -- Signed PDF in Supabase Storage
  
  -- Employee Details
  employee_name TEXT NOT NULL,
  employee_address TEXT NOT NULL,
  
  -- Job Details
  position TEXT NOT NULL,
  contact_type TEXT NOT NULL, -- FULL_TIME, PART_TIME, PROJECT_BASED
  assigned_client TEXT,
  start_date DATE NOT NULL,
  work_schedule TEXT,
  
  -- Compensation
  basic_salary DECIMAL(10, 2) NOT NULL,
  de_minimis DECIMAL(10, 2), -- Tax-exempt benefits
  total_monthly_gross DECIMAL(10, 2) NOT NULL,
  hmo_offer TEXT,
  paid_leave TEXT,
  probationary_period TEXT,
  
  -- Signature Tracking
  signed_at TIMESTAMPTZ,
  signed_by_candidate BOOLEAN DEFAULT FALSE,
  signed_by_employer BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for employment_contracts
CREATE INDEX idx_employment_contracts_onboarding_id ON employment_contracts(candidate_onboarding_id);
CREATE INDEX idx_employment_contracts_signed_at ON employment_contracts(signed_at DESC);
CREATE INDEX idx_employment_contracts_created_at ON employment_contracts(created_at DESC);

-- =====================================================
-- Updated Trigger: Auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidate_onboarding_updated_at
  BEFORE UPDATE ON candidate_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE candidate_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;

-- candidate_onboarding RLS Policies

-- Candidates can view/update their own onboarding
CREATE POLICY "Candidates can view own onboarding"
  ON candidate_onboarding
  FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update own onboarding"
  ON candidate_onboarding
  FOR UPDATE
  USING (auth.uid() = candidate_id);

-- Recruiters can view onboarding for their agency's jobs
CREATE POLICY "Recruiters can view agency onboarding"
  ON candidate_onboarding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN agency_clients ac ON j.agency_client_id = ac.id
      JOIN agency_recruiters ar ON ar.agency_id = ac.agency_id
      WHERE ja.id = candidate_onboarding.job_application_id
        AND ar.user_id = auth.uid()
    )
  );

-- Recruiters can update onboarding (approve/reject sections)
CREATE POLICY "Recruiters can update agency onboarding"
  ON candidate_onboarding
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN agency_clients ac ON j.agency_client_id = ac.id
      JOIN agency_recruiters ar ON ar.agency_id = ac.agency_id
      WHERE ja.id = candidate_onboarding.job_application_id
        AND ar.user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to onboarding"
  ON candidate_onboarding
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role bypass"
  ON candidate_onboarding
  FOR ALL
  USING (auth.role() = 'service_role');

-- employment_contracts RLS Policies

-- Candidates can view their own contracts
CREATE POLICY "Candidates can view own contracts"
  ON employment_contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM candidate_onboarding co
      WHERE co.id = employment_contracts.candidate_onboarding_id
        AND co.candidate_id = auth.uid()
    )
  );

-- Recruiters can view contracts for their agency
CREATE POLICY "Recruiters can view agency contracts"
  ON employment_contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM candidate_onboarding co
      JOIN job_applications ja ON ja.id = co.job_application_id
      JOIN jobs j ON ja.job_id = j.id
      JOIN agency_clients ac ON j.agency_client_id = ac.id
      JOIN agency_recruiters ar ON ar.agency_id = ac.agency_id
      WHERE co.id = employment_contracts.candidate_onboarding_id
        AND ar.user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to contracts"
  ON employment_contracts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass contracts"
  ON employment_contracts
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE candidate_onboarding IS 'Main onboarding table for Philippines 201 file creation after job acceptance';
COMMENT ON COLUMN candidate_onboarding.sss IS 'Philippines Social Security System number (XX-XXXXXXX-X format)';
COMMENT ON COLUMN candidate_onboarding.tin IS 'Philippines Tax Identification Number (XXX-XXX-XXX-XXX format)';
COMMENT ON COLUMN candidate_onboarding.philhealth_no IS 'Philippines Health Insurance number (XX-XXXXXXXXX-X format)';
COMMENT ON COLUMN candidate_onboarding.pagibig_no IS 'Philippines Home Development Mutual Fund number (XXXX-XXXX-XXXX format)';
COMMENT ON COLUMN candidate_onboarding.completion_percent IS 'Progress percentage (0-100), calculated as: (approved sections / 8) * 100';
COMMENT ON COLUMN candidate_onboarding.is_complete IS 'True only when all 8 sections approved AND contract signed';

COMMENT ON TABLE employment_contracts IS 'Generated Philippines labor law-compliant employment contracts';
COMMENT ON COLUMN employment_contracts.contract_html IS 'Full HTML contract for preview with all Philippines labor law sections';
COMMENT ON COLUMN employment_contracts.de_minimis IS 'Tax-exempt benefits per Philippines BIR regulations';
