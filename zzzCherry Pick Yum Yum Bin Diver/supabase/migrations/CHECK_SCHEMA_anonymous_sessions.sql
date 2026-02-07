-- Query to check current anonymous_sessions table schema
-- Run this first to see what columns exist

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'anonymous_sessions'
ORDER BY ordinal_position;

-- Also check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'anonymous_sessions'
  AND schemaname = 'public';

-- Check RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'anonymous_sessions'
  AND schemaname = 'public';
