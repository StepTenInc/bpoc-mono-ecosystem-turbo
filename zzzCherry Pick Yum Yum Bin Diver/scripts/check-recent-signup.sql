-- Check recent recruiter signups and invitations

-- Check recent recruiters
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  verification_status,
  joined_at,
  agency_id
FROM agency_recruiters
ORDER BY joined_at DESC
LIMIT 5;

-- Check recent team invitations
SELECT
  id,
  invitee_email,
  invitee_name,
  inviter_email,
  inviter_name,
  agency_id,
  role,
  status,
  created_at,
  invite_token,
  requires_documents
FROM team_invitations
ORDER BY created_at DESC
LIMIT 5;

-- Check if invitation was created for stephena@shoreagents.com
SELECT
  id,
  invitee_email,
  invitee_name,
  inviter_name,
  status,
  created_at
FROM team_invitations
WHERE invitee_email = 'stephena@shoreagents.com'
ORDER BY created_at DESC
LIMIT 1;
