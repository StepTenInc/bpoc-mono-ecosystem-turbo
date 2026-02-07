-- Quick check queries for admin verification flow

-- 1. Check if super admin exists
SELECT 
  id, email, first_name, last_name, role, is_super_admin, is_active
FROM admins
WHERE is_super_admin = true;

-- 2. Check pending recruiters (need verification)
SELECT 
  ar.id,
  ar.email,
  ar.first_name || ' ' || ar.last_name as name,
  ar.verification_status,
  a.name as agency_name,
  a.tin_number,
  a.dti_certificate_url IS NOT NULL as has_dti,
  a.business_permit_url IS NOT NULL as has_permit,
  a.sec_registration_url IS NOT NULL as has_sec
FROM agency_recruiters ar
LEFT JOIN agencies a ON ar.agency_id = a.id
WHERE ar.verification_status IN ('pending_admin_review', 'pending_documents')
ORDER BY ar.created_at DESC;

-- 3. Check agency documents status
SELECT 
  id,
  name,
  tin_number,
  dti_certificate_url IS NOT NULL as has_dti,
  business_permit_url IS NOT NULL as has_permit,
  sec_registration_url IS NOT NULL as has_sec,
  documents_verified,
  documents_verified_at
FROM agencies
WHERE documents_verified = false
  AND tin_number IS NOT NULL;

-- 4. Check team invitations (authorization head flow)
SELECT 
  ti.invited_email,
  ti.role,
  ti.invite_token,
  ti.status,
  ti.requires_documents,
  a.name as agency_name
FROM team_invitations ti
LEFT JOIN agencies a ON ti.agency_id = a.id
WHERE ti.status = 'pending'
ORDER BY ti.created_at DESC;

-- 5. Recently verified recruiters
SELECT 
  ar.email,
  ar.first_name || ' ' || ar.last_name as name,
  ar.verification_status,
  ar.verified_at,
  a.name as agency_name
FROM agency_recruiters ar
LEFT JOIN agencies a ON ar.agency_id = a.id
WHERE ar.verification_status = 'verified'
ORDER BY ar.verified_at DESC
LIMIT 10;
