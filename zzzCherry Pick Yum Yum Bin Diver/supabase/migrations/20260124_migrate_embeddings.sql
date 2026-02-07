-- ============================================
-- MIGRATE EMBEDDINGS: insight_embeddings → article_embeddings
-- Date: 2026-01-24
-- Purpose: Migrate to new chunked embeddings structure
-- ============================================

-- Step 1: Migrate existing embeddings to new table
-- Old table had no chunking, so we set chunk_index to 0
INSERT INTO article_embeddings (article_id, chunk_index, content, embedding, created_at)
SELECT 
  insight_id as article_id,
  0 as chunk_index,  -- Old system didn't support chunking
  content,
  embedding,
  created_at
FROM insight_embeddings
WHERE insight_id IN (SELECT id FROM insights_posts)  -- Only migrate valid articles
ON CONFLICT (article_id, chunk_index) DO NOTHING;  -- Skip duplicates

-- Step 2: Verify migration was successful
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM insight_embeddings;
  SELECT COUNT(*) INTO new_count FROM article_embeddings;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ EMBEDDINGS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Old table (insight_embeddings): % rows', old_count;
  RAISE NOTICE 'New table (article_embeddings): % rows', new_count;
  RAISE NOTICE '';
  
  IF new_count >= old_count THEN
    RAISE NOTICE '✅ SUCCESS: All data migrated safely';
    RAISE NOTICE '✅ Safe to drop insight_embeddings table';
  ELSE
    RAISE WARNING '⚠️  WARNING: New table has fewer rows!';
    RAISE WARNING '⚠️  Old: %, New: %', old_count, new_count;
    RAISE WARNING '⚠️  DO NOT DROP OLD TABLE - Investigate first!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- Step 3: Drop old table (only if migration successful)
DROP TABLE IF EXISTS insight_embeddings CASCADE;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE '🗑️  insight_embeddings table DROPPED';
  RAISE NOTICE '✅ Migration complete!';
END $$;
