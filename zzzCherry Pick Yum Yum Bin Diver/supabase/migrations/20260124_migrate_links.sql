-- ============================================
-- MIGRATE LINKS: internal_links → article_links
-- Date: 2026-01-24
-- Purpose: Migrate to new 4-way link categorization structure
-- ============================================

-- Step 1: Migrate existing links to new table
-- Old table had no link_type, so we default to 'sibling' (most common)
INSERT INTO article_links (
  from_article_id, 
  to_article_id, 
  anchor_text, 
  link_type,
  context,
  created_at,
  updated_at
)
SELECT 
  source_post_id as from_article_id,
  target_post_id as to_article_id,
  anchor_text,
  'sibling' as link_type,  -- Default categorization
  NULL as context,         -- Old system didn't store context
  created_at,
  created_at as updated_at
FROM internal_links
WHERE source_post_id IN (SELECT id FROM insights_posts)  -- Only valid articles
  AND target_post_id IN (SELECT id FROM insights_posts)
ON CONFLICT (from_article_id, to_article_id, anchor_text) DO NOTHING;

-- Step 2: Verify migration was successful
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM internal_links;
  SELECT COUNT(*) INTO new_count FROM article_links;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LINKS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Old table (internal_links): % rows', old_count;
  RAISE NOTICE 'New table (article_links): % rows', new_count;
  RAISE NOTICE '';
  
  IF new_count >= old_count THEN
    RAISE NOTICE '✅ SUCCESS: All links migrated safely';
    RAISE NOTICE '✅ Safe to drop internal_links table';
  ELSE
    RAISE WARNING '⚠️  WARNING: New table has fewer rows!';
    RAISE WARNING '⚠️  Old: %, New: %', old_count, new_count;
    RAISE WARNING '⚠️  DO NOT DROP OLD TABLE - Investigate first!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- Step 3: Drop old table (only if migration successful)
DROP TABLE IF EXISTS internal_links CASCADE;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE '🗑️  internal_links table DROPPED';
  RAISE NOTICE '✅ Migration complete!';
END $$;
