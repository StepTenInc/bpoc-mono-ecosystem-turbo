-- =====================================================
-- PRISMA ↔ SUPABASE SYNC VERIFICATION
-- =====================================================
-- Run this to verify everything is in sync
-- =====================================================

\timing on

-- =====================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 1: VERIFY ALL TABLES EXIST
═══════════════════════════════════════════════════════
' as "";

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'insights_posts',
      'seo_metadata',
      'internal_links',
      'link_suggestions',
      'insight_embeddings',
      'image_generation_logs',
      'personality_profiles',
      'pipeline_execution_logs'
    ) THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'insights_posts',
    'seo_metadata',
    'internal_links',
    'link_suggestions',
    'insight_embeddings',
    'image_generation_logs',
    'personality_profiles',
    'pipeline_execution_logs'
  )
ORDER BY table_name;

-- =====================================================
-- 2. CHECK insights_posts COLUMNS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 2: VERIFY insights_posts COLUMNS
═══════════════════════════════════════════════════════
' as "";

WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'id', 'slug', 'title', 'description', 'content', 'category', 
    'author', 'author_slug', 'read_time',
    'content_part1', 'content_part2', 'content_part3',
    'content_image0', 'content_image1', 'content_image2',
    'icon_name', 'color', 'bg_color', 'hero_type', 'hero_url', 'video_url',
    'content_type', 'silo_topic', 'pillar_page_id', 'depth', 'parent_id',
    'hr_kb_articles', 'serper_research', 'personality_profile', 
    'humanization_score', 'ai_logs', 'pipeline_stage', 'generation_metadata',
    'is_published', 'published_at', 'created_at', 'updated_at'
  ]) as column_name
),
actual_columns AS (
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'insights_posts'
)
SELECT 
  ec.column_name,
  COALESCE(ac.data_type, 'MISSING') as data_type,
  CASE 
    WHEN ac.column_name IS NOT NULL THEN '✅'
    ELSE '❌ MISSING'
  END as status
FROM expected_columns ec
LEFT JOIN actual_columns ac ON ec.column_name = ac.column_name
ORDER BY ec.column_name;

-- =====================================================
-- 3. CHECK internal_links COLUMNS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 3: VERIFY internal_links COLUMNS
═══════════════════════════════════════════════════════
' as "";

WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'id', 'source_post_id', 'target_post_id', 'anchor_text', 'type',
    'is_cross_silo', 'context', 'auto_generated', 'created_at'
  ]) as column_name
),
actual_columns AS (
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'internal_links'
)
SELECT 
  ec.column_name,
  COALESCE(ac.data_type, 'MISSING') as data_type,
  CASE 
    WHEN ac.column_name IS NOT NULL THEN '✅'
    ELSE '❌ MISSING'
  END as status
FROM expected_columns ec
LEFT JOIN actual_columns ac ON ec.column_name = ac.column_name
ORDER BY ec.column_name;

-- =====================================================
-- 4. CHECK INDEXES
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 4: VERIFY INDEXES
═══════════════════════════════════════════════════════
' as "";

SELECT 
  tablename,
  indexname,
  '✅' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'insights_posts',
    'internal_links',
    'link_suggestions',
    'insight_embeddings',
    'image_generation_logs'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CHECK FUNCTIONS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 5: VERIFY FUNCTIONS
═══════════════════════════════════════════════════════
' as "";

SELECT 
  routine_name,
  routine_type,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_article_breadcrumb',
    'get_article_children',
    'get_article_siblings',
    'approve_link_suggestion',
    'get_post_outbound_links',
    'get_post_inbound_links',
    'find_missing_links_for_article',
    'scan_all_articles_for_missing_links',
    'generate_link_suggestions_for_article',
    'generate_link_suggestions_bulk'
  )
ORDER BY routine_name;

-- =====================================================
-- 6. CHECK VIEWS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 6: VERIFY VIEWS
═══════════════════════════════════════════════════════
' as "";

SELECT 
  table_name,
  '✅' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'silo_structure',
    'silo_hierarchy',
    'all_links_overview',
    'link_coverage_report',
    'articles_needing_links'
  )
ORDER BY table_name;

-- =====================================================
-- 7. CHECK CONSTRAINTS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 7: VERIFY CONSTRAINTS
═══════════════════════════════════════════════════════
' as "";

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  '✅' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'insights_posts',
    'internal_links',
    'link_suggestions'
  )
  AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- =====================================================
-- 8. TEST BASIC QUERIES
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 8: TEST BASIC QUERIES
═══════════════════════════════════════════════════════
' as "";

-- Test insights_posts query with new columns
SELECT 
  COUNT(*) as total_articles,
  COUNT(*) FILTER (WHERE is_published) as published_articles,
  COUNT(*) FILTER (WHERE content_type = 'pillar') as pillar_articles,
  COUNT(*) FILTER (WHERE content_type = 'supporting') as supporting_articles,
  COUNT(DISTINCT silo_topic) as unique_silos,
  '✅' as status
FROM insights_posts;

-- Test internal_links with new columns
SELECT 
  COUNT(*) as total_links,
  COUNT(*) FILTER (WHERE is_cross_silo = true) as cross_silo_links,
  COUNT(*) FILTER (WHERE auto_generated = true) as ai_generated_links,
  '✅' as status
FROM internal_links;

-- Test link_suggestions
SELECT 
  COUNT(*) as total_suggestions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_suggestions,
  COUNT(*) FILTER (WHERE status = 'applied') as applied_suggestions,
  '✅' as status
FROM link_suggestions;

-- =====================================================
-- 9. VERIFY FOREIGN KEYS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ STEP 9: VERIFY FOREIGN KEY RELATIONSHIPS
═══════════════════════════════════════════════════════
' as "";

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'seo_metadata',
    'internal_links',
    'link_suggestions',
    'insight_embeddings',
    'image_generation_logs'
  )
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 10. FINAL SUMMARY
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
📊 FINAL SYNC STATUS
═══════════════════════════════════════════════════════
' as "";

WITH sync_check AS (
  SELECT 
    '1. Tables' as category,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('insights_posts', 'seo_metadata', 'internal_links', 
                        'link_suggestions', 'insight_embeddings', 
                        'image_generation_logs', 'personality_profiles', 
                        'pipeline_execution_logs')) as found,
    8 as expected
  
  UNION ALL
  
  SELECT 
    '2. insights_posts columns',
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'insights_posts' 
     AND column_name IN ('content_type', 'silo_topic', 'depth', 'parent_id', 
                         'hr_kb_articles', 'ai_logs', 'pipeline_stage')),
    7
  
  UNION ALL
  
  SELECT 
    '3. internal_links enhancements',
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'internal_links' 
     AND column_name IN ('is_cross_silo', 'context', 'auto_generated')),
    3
  
  UNION ALL
  
  SELECT 
    '4. Functions',
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' 
     AND routine_name IN ('get_article_breadcrumb', 'approve_link_suggestion', 
                          'find_missing_links_for_article', 
                          'generate_link_suggestions_bulk')),
    10
  
  UNION ALL
  
  SELECT 
    '5. Views',
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND table_name IN ('silo_hierarchy', 'all_links_overview', 
                        'link_coverage_report', 'articles_needing_links')),
    5
)
SELECT 
  category,
  found,
  expected,
  CASE 
    WHEN found = expected THEN '✅ SYNCED'
    ELSE '❌ MISSING ' || (expected - found)::text || ' items'
  END as status
FROM sync_check
ORDER BY category;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ SYNC VERIFICATION COMPLETE!
═══════════════════════════════════════════════════════

If all checks show ✅, your Prisma and Supabase are 100% in sync!

If you see any ❌, run the missing migration:
  1. 20260109_delete_all_insights.sql
  2. 20260109_add_silo_structure.sql
  3. 20260109_ai_content_pipeline_fixed.sql
  4. 20260109_multi_level_hierarchy.sql
  5. 20260109_consolidate_link_system.sql
  6. 20260109_smart_link_scanner.sql

Then run: # Prisma no longer used - use Supabase directly
═══════════════════════════════════════════════════════
' as "";

\timing off

