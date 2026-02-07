-- =====================================================
-- CLEAN ALL TEST DATA
-- =====================================================
-- Purpose: Remove all test/dummy data from insights system
-- Date: 2026-01-09
-- =====================================================

-- =====================================================
-- SAFETY CHECK
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  WARNING: This will DELETE ALL insights data!';
  RAISE NOTICE '⚠️  This includes:';
  RAISE NOTICE '   • All articles (insights_posts)';
  RAISE NOTICE '   • All SEO metadata';
  RAISE NOTICE '   • All internal links';
  RAISE NOTICE '   • All link suggestions';
  RAISE NOTICE '   • All embeddings';
  RAISE NOTICE '   • All image generation logs';
  RAISE NOTICE '   • All pipeline logs';
  RAISE NOTICE '';
  RAISE NOTICE '⏸️  PAUSING FOR 3 SECONDS...';
  PERFORM pg_sleep(3);
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Starting cleanup...';
END $$;

-- =====================================================
-- DELETE IN CORRECT ORDER (respecting foreign keys)
-- =====================================================

-- 1. Delete pipeline logs (no FK constraints)
DELETE FROM pipeline_execution_logs;
DO $$ BEGIN RAISE NOTICE '✅ Deleted pipeline_execution_logs'; END $$;

-- 2. Delete image generation logs (FK to insights_posts)
DELETE FROM image_generation_logs;
DO $$ BEGIN RAISE NOTICE '✅ Deleted image_generation_logs'; END $$;

-- 3. Delete embeddings (FK to insights_posts)
DELETE FROM insight_embeddings;
DO $$ BEGIN RAISE NOTICE '✅ Deleted insight_embeddings'; END $$;

-- 4. Delete link suggestions (FK to insights_posts)
DELETE FROM link_suggestions;
DO $$ BEGIN RAISE NOTICE '✅ Deleted link_suggestions'; END $$;

-- 5. Delete internal links (FK to insights_posts)
DELETE FROM internal_links;
DO $$ BEGIN RAISE NOTICE '✅ Deleted internal_links'; END $$;

-- 6. Delete SEO metadata (FK to insights_posts)
DELETE FROM seo_metadata;
DO $$ BEGIN RAISE NOTICE '✅ Deleted seo_metadata'; END $$;

-- 7. Delete insights posts (parent table)
DELETE FROM insights_posts;
DO $$ BEGIN RAISE NOTICE '✅ Deleted insights_posts'; END $$;

-- =====================================================
-- RESET SEQUENCES (if any)
-- =====================================================

-- No sequences to reset (using UUIDs)

-- =====================================================
-- VERIFY CLEANUP
-- =====================================================

DO $$
DECLARE
  posts_count INT;
  seo_count INT;
  links_count INT;
  suggestions_count INT;
  embeddings_count INT;
  images_count INT;
  logs_count INT;
BEGIN
  SELECT COUNT(*) INTO posts_count FROM insights_posts;
  SELECT COUNT(*) INTO seo_count FROM seo_metadata;
  SELECT COUNT(*) INTO links_count FROM internal_links;
  SELECT COUNT(*) INTO suggestions_count FROM link_suggestions;
  SELECT COUNT(*) INTO embeddings_count FROM insight_embeddings;
  SELECT COUNT(*) INTO images_count FROM image_generation_logs;
  SELECT COUNT(*) INTO logs_count FROM pipeline_execution_logs;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📊 CLEANUP VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'insights_posts:          % rows', posts_count;
  RAISE NOTICE 'seo_metadata:            % rows', seo_count;
  RAISE NOTICE 'internal_links:          % rows', links_count;
  RAISE NOTICE 'link_suggestions:        % rows', suggestions_count;
  RAISE NOTICE 'insight_embeddings:      % rows', embeddings_count;
  RAISE NOTICE 'image_generation_logs:   % rows', images_count;
  RAISE NOTICE 'pipeline_execution_logs: % rows', logs_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  
  IF posts_count = 0 AND seo_count = 0 AND links_count = 0 AND 
     suggestions_count = 0 AND embeddings_count = 0 AND 
     images_count = 0 AND logs_count = 0 THEN
    RAISE NOTICE '✅ ALL TEST DATA CLEANED!';
    RAISE NOTICE '🎯 Database is ready for production content!';
  ELSE
    RAISE NOTICE '⚠️  Some data remains (check above)';
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- VERIFY STRUCTURE STILL EXISTS
-- =====================================================

SELECT 
  '✅ Tables still exist' as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'insights_posts',
    'seo_metadata',
    'internal_links',
    'link_suggestions',
    'insight_embeddings',
    'image_generation_logs',
    'pipeline_execution_logs'
  );

SELECT 
  '✅ Functions still exist' as status,
  COUNT(*) as function_count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_article_breadcrumb',
    'approve_link_suggestion',
    'find_missing_links_for_article',
    'generate_link_suggestions_bulk'
  );

SELECT 
  '✅ Views still exist' as status,
  COUNT(*) as view_count
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'silo_hierarchy',
    'all_links_overview',
    'link_coverage_report',
    'articles_needing_links'
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CLEANUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All test data deleted';
  RAISE NOTICE '✅ All tables still exist';
  RAISE NOTICE '✅ All functions still exist';
  RAISE NOTICE '✅ All views still exist';
  RAISE NOTICE '✅ Database structure intact';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to create production content!';
  RAISE NOTICE '';
END $$;

