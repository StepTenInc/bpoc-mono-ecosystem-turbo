-- Create super admin user
-- Run this manually in Supabase SQL editor

-- First, create the auth user (you'll need to do this via Supabase dashboard or auth.admin API)
-- Email: platform-admin@bpoc.io
-- Password: [set securely]

-- Then insert admin record
-- Replace 'USER_ID_HERE' with the actual user_id from auth.users after creating the account

INSERT INTO admins (
  user_id,
  email,
  first_name,
  last_name,
  role,
  department,
  is_super_admin,
  is_active
) VALUES (
  'USER_ID_HERE', -- Replace with actual user_id from auth.users
  'platform-admin@bpoc.io',
  'Platform',
  'Administrator',
  'super_user',
  'Management',
  true,
  true
);
