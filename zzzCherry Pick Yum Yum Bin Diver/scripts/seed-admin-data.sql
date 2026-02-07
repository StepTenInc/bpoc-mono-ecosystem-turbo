-- ============================================
-- BPOC ADMIN TEST DATA SEED SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 0. CREATE DEFAULT COMPANY & AGENCY CLIENT FOR JOBS
-- ============================================
INSERT INTO companies (id, name, slug, is_active, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ShoreAgents Clients',
    'shoreagents-clients',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Create agency_client linking ShoreAgents to the company
INSERT INTO agency_clients (id, agency_id, company_id, status, created_at, updated_at)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b582d9a1-1e21-4f33-8cf6-1b24e4ab6c5f', -- ShoreAgents agency_id
    'a0000000-0000-0000-0000-000000000001', -- Company ID
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (agency_id, company_id) DO NOTHING;

-- ============================================
-- 1. CREATE ADMIN USER IN AUTH (do this manually in Supabase Dashboard first)
-- Go to Authentication > Users > Add User
-- Email: admin@bpoc.com
-- Password: BpocAdmin2024!
-- Copy the UUID it creates
-- ============================================

-- Replace this UUID with the actual one from Supabase Auth
-- After creating the auth user, update this variable:
DO $$
DECLARE
    admin_user_id UUID := '0107fb3c-16d6-429a-91c5-ca1b603b18fe'; -- Replace with actual auth.users id
    recruiter_user_id UUID := 'e1ead499-e73f-4de3-8ff5-ae8d62785d7d'; -- Replace with actual auth.users id
    agency_id UUID := 'b582d9a1-1e21-4f33-8cf6-1b24e4ab6c5f';
    agency_profile_id UUID := gen_random_uuid();
    recruiter_id UUID := 'c633682a-c0d9-41d1-877a-3a6d99501d37';
    company1_id UUID := gen_random_uuid();
    company2_id UUID := gen_random_uuid();
    company3_id UUID := gen_random_uuid();
    client1_id UUID := gen_random_uuid();
    client2_id UUID := gen_random_uuid();
    client3_id UUID := gen_random_uuid();
BEGIN

-- ============================================
-- 2. BPOC USERS (Admin Staff)
-- (full_name is auto-generated from first_name + last_name)
-- ============================================
INSERT INTO bpoc_users (id, email, first_name, last_name, phone, avatar_url, role, is_active, created_at, updated_at)
VALUES 
    (admin_user_id, 'admin@bpoc.com', 'BPOC', 'Admin', '+1 555 0100', NULL, 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- ============================================
-- 3. BPOC PROFILES (Admin Profile)
-- ============================================
INSERT INTO bpoc_profiles (id, bpoc_user_id, bio, department, permissions, created_at, updated_at)
VALUES 
    (gen_random_uuid(), admin_user_id, 'BPOC Platform Administrator with full system access.', 'Administration', '["all"]'::jsonb, NOW(), NOW())
ON CONFLICT (bpoc_user_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    department = EXCLUDED.department,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ============================================
-- 4. AGENCIES
-- ============================================
INSERT INTO agencies (id, name, slug, email, phone, logo_url, website, is_active, api_key, api_enabled, created_at, updated_at)
VALUES 
    (agency_id, 'ShoreAgents', 'shoreagents', 'contact@shoreagents.com', '+1 555 0200', NULL, 'https://shoreagents.com', true, NULL, false, NOW(), NOW()),
    (gen_random_uuid(), 'TechRecruit Pro', 'techrecruit-pro', 'hello@techrecruitpro.com', '+1 555 0201', NULL, 'https://techrecruitpro.com', true, NULL, false, NOW(), NOW()),
    (gen_random_uuid(), 'Global Talent Hub', 'global-talent-hub', 'info@globaltalenthub.com', '+1 555 0202', NULL, 'https://globaltalenthub.com', true, NULL, false, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- ============================================
-- 5. AGENCY PROFILES
-- ============================================
INSERT INTO agency_profiles (id, agency_id, description, founded_year, employee_count, address_line1, city, state, country, postal_code, linkedin_url, created_at, updated_at)
VALUES 
    (agency_profile_id, agency_id, 'ShoreAgents is a leading offshore recruitment agency specializing in connecting global talent with innovative companies. We focus on BPO, customer service, and virtual assistant placements.', 2018, '50-100', '123 Business Park Drive', 'Manila', 'Metro Manila', 'Philippines', '1234', 'https://linkedin.com/company/shoreagents', NOW(), NOW())
ON CONFLICT (agency_id) DO UPDATE SET
    description = EXCLUDED.description,
    founded_year = EXCLUDED.founded_year,
    employee_count = EXCLUDED.employee_count,
    updated_at = NOW();

-- ============================================
-- 6. COMPANIES (for agency clients)
-- ============================================
INSERT INTO companies (id, name, slug, email, phone, website, industry, size, is_active, created_at, updated_at)
VALUES 
    (company1_id, 'TechCorp Solutions', 'techcorp-solutions', 'hr@techcorp.com', '+1 555 1001', 'https://techcorp.com', 'Technology', '100-500', true, NOW(), NOW()),
    (company2_id, 'DataFlow Inc', 'dataflow-inc', 'careers@dataflow.io', '+1 555 1002', 'https://dataflow.io', 'Data Analytics', '50-100', true, NOW(), NOW()),
    (company3_id, 'CloudBase Systems', 'cloudbase-systems', 'jobs@cloudbase.com', '+1 555 1003', 'https://cloudbase.com', 'Cloud Services', '200-500', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- ============================================
-- 7. AGENCY RECRUITERS
-- (full_name is auto-generated from first_name + last_name)
-- ============================================
INSERT INTO agency_recruiters (id, user_id, agency_id, email, first_name, last_name, phone, avatar_url, role, is_active, can_post_jobs, can_manage_applications, can_invite_recruiters, can_manage_clients, invited_by, invited_at, joined_at, created_at, updated_at)
VALUES 
    (recruiter_id, recruiter_user_id, agency_id, 'recruiter@shoreagents.com', 'Test', 'Recruiter', '+1 555 0210', NULL, 'recruiter', true, true, true, false, false, NULL, NULL, NOW(), NOW(), NOW()),
    (gen_random_uuid(), gen_random_uuid(), agency_id, 'senior.recruiter@shoreagents.com', 'Sarah', 'Johnson', '+1 555 0211', NULL, 'admin', true, true, true, true, true, NULL, NULL, NOW(), NOW(), NOW()),
    (gen_random_uuid(), gen_random_uuid(), agency_id, 'mike.smith@shoreagents.com', 'Mike', 'Smith', '+1 555 0212', NULL, 'recruiter', true, true, true, false, false, NULL, NULL, NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- ============================================
-- 8. AGENCY CLIENTS
-- ============================================
INSERT INTO agency_clients (id, agency_id, company_id, status, contract_start, contract_end, contract_value, billing_type, primary_contact_name, primary_contact_email, primary_contact_phone, notes, added_by, created_at, updated_at)
VALUES 
    (client1_id, agency_id, company1_id, 'active', '2024-01-01', '2024-12-31', 50000.00, 'monthly', 'John Director', 'john.d@techcorp.com', '+1 555 1101', 'Primary client - 5 hires per month target', recruiter_id, NOW(), NOW()),
    (client2_id, agency_id, company2_id, 'active', '2024-03-01', '2025-02-28', 35000.00, 'per_hire', 'Emma HR', 'emma.hr@dataflow.io', '+1 555 1102', 'Growing startup - scaling team', recruiter_id, NOW(), NOW()),
    (client3_id, agency_id, company3_id, 'prospect', NULL, NULL, NULL, NULL, 'Chris Manager', 'chris.m@cloudbase.com', '+1 555 1103', 'Initial discussions - interested in VA services', recruiter_id, NOW(), NOW())
ON CONFLICT (agency_id, company_id) DO UPDATE SET
    status = EXCLUDED.status,
    contract_start = EXCLUDED.contract_start,
    contract_end = EXCLUDED.contract_end,
    updated_at = NOW();

RAISE NOTICE 'Seed data inserted successfully!';
RAISE NOTICE 'Admin user ID: %', admin_user_id;
RAISE NOTICE 'Agency ID: %', agency_id;

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check BPOC Users
SELECT 'BPOC Users' as table_name, COUNT(*) as count FROM bpoc_users;

-- Check BPOC Profiles  
SELECT 'BPOC Profiles' as table_name, COUNT(*) as count FROM bpoc_profiles;

-- Check Agencies
SELECT 'Agencies' as table_name, COUNT(*) as count FROM agencies;

-- Check Agency Profiles
SELECT 'Agency Profiles' as table_name, COUNT(*) as count FROM agency_profiles;

-- Check Companies
SELECT 'Companies' as table_name, COUNT(*) as count FROM companies;

-- Check Agency Recruiters
SELECT 'Agency Recruiters' as table_name, COUNT(*) as count FROM agency_recruiters;

-- Check Agency Clients
SELECT 'Agency Clients' as table_name, COUNT(*) as count FROM agency_clients;

-- View all agencies with their profiles
SELECT 
    a.id,
    a.name,
    a.slug,
    a.email,
    a.website,
    a.is_active,
    ap.description,
    ap.founded_year,
    ap.city,
    ap.country
FROM agencies a
LEFT JOIN agency_profiles ap ON ap.agency_id = a.id;

-- View recruiters by agency
SELECT 
    ar.full_name,
    ar.email,
    ar.role,
    ar.is_active,
    a.name as agency_name
FROM agency_recruiters ar
JOIN agencies a ON a.id = ar.agency_id
ORDER BY a.name, ar.role;

-- View clients by agency
SELECT 
    c.name as company_name,
    ac.status,
    ac.contract_value,
    ac.primary_contact_name,
    a.name as agency_name
FROM agency_clients ac
JOIN companies c ON c.id = ac.company_id
JOIN agencies a ON a.id = ac.agency_id
ORDER BY a.name, ac.status;

