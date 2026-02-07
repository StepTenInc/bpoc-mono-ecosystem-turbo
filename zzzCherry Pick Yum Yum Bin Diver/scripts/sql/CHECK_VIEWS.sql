-- Quick check: Which views exist?
SELECT table_name 
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%silo%' 
    OR table_name LIKE '%link%' 
    OR table_name LIKE '%article%'
  )
ORDER BY table_name;

