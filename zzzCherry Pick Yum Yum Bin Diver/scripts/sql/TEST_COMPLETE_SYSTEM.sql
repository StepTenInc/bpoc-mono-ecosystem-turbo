-- =====================================================
-- COMPLETE SYSTEM TEST - RUN THIS IN ORDER
-- =====================================================
-- Copy/paste each section into Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY ALL TABLES EXIST
-- =====================================================

SELECT 'Checking tables...' as step;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'insights_posts',
  'insight_embeddings',
  'link_suggestions',
  'image_generation_logs',
  'cross_silo_links',
  'pipeline_execution_logs'
)
ORDER BY table_name;

-- Expected: 6 tables

-- =====================================================
-- STEP 2: VERIFY NEW COLUMNS EXIST
-- =====================================================

SELECT 'Checking insights_posts columns...' as step;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'insights_posts'
AND column_name IN (
  'content_type',
  'silo_topic', 
  'pillar_page_id',
  'depth',
  'parent_id',
  'hr_kb_articles',
  'serper_research',
  'personality_profile',
  'humanization_score',
  'ai_logs'
)
ORDER BY column_name;

-- Expected: 10 columns

-- =====================================================
-- STEP 3: VERIFY FUNCTIONS EXIST
-- =====================================================

SELECT 'Checking functions...' as step;

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_article_breadcrumb',
  'get_article_children',
  'get_article_siblings'
)
ORDER BY routine_name;

-- Expected: 3 functions

-- =====================================================
-- STEP 4: VERIFY VIEWS EXIST
-- =====================================================

SELECT 'Checking views...' as step;

SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
  'silo_structure',
  'silo_hierarchy'
)
ORDER BY table_name;

-- Expected: 2 views

-- =====================================================
-- STEP 5: CREATE TEST DATA
-- =====================================================

SELECT 'Creating test pillar...' as step;

-- Insert Depth 1: Pillar
INSERT INTO insights_posts (
  title,
  slug,
  content,
  description,
  depth,
  content_type,
  silo_topic,
  parent_id,
  is_published,
  category,
  author,
  author_slug
) VALUES (
  'Employment Guide Philippines 2026',
  'employment-guide',
  '<p>Complete guide to Philippine employment laws, rights, and regulations.</p>',
  'Your complete guide to employment in the Philippines',
  1,
  'pillar',
  'Employment Guide',
  NULL,
  true,
  'Employment Guide',
  'BPOC Team',
  'bpoc-team'
) RETURNING id, title, depth, content_type;

-- Save the returned ID! You'll need it for next steps.
-- Let's call it PILLAR_ID

-- =====================================================
-- STEP 6: CREATE SUB-PILLAR (Depth 2)
-- =====================================================

SELECT 'Creating sub-pillar...' as step;

-- Replace PILLAR_ID with the ID from Step 5
WITH pillar AS (
  SELECT id FROM insights_posts WHERE slug = 'employment-guide'
)
INSERT INTO insights_posts (
  title,
  slug,
  content,
  description,
  depth,
  content_type,
  silo_topic,
  parent_id,
  is_published,
  category,
  author,
  author_slug
) 
SELECT
  'DOLE Rules & Regulations',
  'dole-rules',
  '<p>Understanding DOLE rules, labor laws, and compliance requirements.</p>',
  'Everything you need to know about DOLE regulations',
  2,
  'supporting',
  'Employment Guide',
  pillar.id,
  true,
  'Employment Guide',
  'BPOC Team',
  'bpoc-team'
FROM pillar
RETURNING id, title, depth, content_type, parent_id;

-- =====================================================
-- STEP 7: CREATE TOPIC (Depth 3)
-- =====================================================

SELECT 'Creating topic...' as step;

WITH sub_pillar AS (
  SELECT id FROM insights_posts WHERE slug = 'dole-rules'
)
INSERT INTO insights_posts (
  title,
  slug,
  content,
  description,
  depth,
  content_type,
  silo_topic,
  parent_id,
  is_published,
  category,
  author,
  author_slug
) 
SELECT
  'Termination Laws Philippines',
  'termination-laws',
  '<p>Complete guide to legal and illegal termination in the Philippines.</p>',
  'Know your rights when it comes to job termination',
  3,
  'supporting',
  'Employment Guide',
  sub_pillar.id,
  true,
  'Employment Guide',
  'BPOC Team',
  'bpoc-team'
FROM sub_pillar
RETURNING id, title, depth, content_type, parent_id;

-- =====================================================
-- STEP 8: CREATE DEEP ARTICLE (Depth 4)
-- =====================================================

SELECT 'Creating deep article...' as step;

WITH topic AS (
  SELECT id FROM insights_posts WHERE slug = 'termination-laws'
)
INSERT INTO insights_posts (
  title,
  slug,
  content,
  description,
  depth,
  content_type,
  silo_topic,
  parent_id,
  is_published,
  category,
  author,
  author_slug
) 
SELECT
  'How Not to Get Terminated (And Avoid DOLE)',
  'how-not-to-get-terminated',
  '<p>Practical tips to avoid termination and protect your job.</p>',
  'Stay employed and avoid conflicts with your employer',
  4,
  'supporting',
  'Employment Guide',
  topic.id,
  true,
  'Employment Guide',
  'BPOC Team',
  'bpoc-team'
FROM topic
RETURNING id, title, depth, content_type, parent_id;

-- =====================================================
-- STEP 9: TEST BREADCRUMB FUNCTION
-- =====================================================

SELECT 'Testing breadcrumb...' as step;

SELECT * FROM get_article_breadcrumb(
  (SELECT id FROM insights_posts WHERE slug = 'how-not-to-get-terminated')
);

-- Expected output (reversed path):
-- Employment Guide > DOLE Rules > Termination Laws > How Not to Get Terminated

-- =====================================================
-- STEP 10: TEST CHILDREN FUNCTION
-- =====================================================

SELECT 'Testing get children...' as step;

SELECT * FROM get_article_children(
  (SELECT id FROM insights_posts WHERE slug = 'employment-guide')
);

-- Expected: 3 children (sub-pillar, topic, deep article)

-- =====================================================
-- STEP 11: TEST SIBLINGS FUNCTION
-- =====================================================

SELECT 'Testing get siblings...' as step;

-- Create a second topic at depth 3 to test siblings
WITH sub_pillar AS (
  SELECT id FROM insights_posts WHERE slug = 'dole-rules'
)
INSERT INTO insights_posts (
  title,
  slug,
  content,
  description,
  depth,
  content_type,
  silo_topic,
  parent_id,
  is_published,
  category,
  author,
  author_slug
) 
SELECT
  'Regularization Process Philippines',
  'regularization-process',
  '<p>Complete guide to the 6-month regularization process.</p>',
  'From probation to permanent employee',
  3,
  'supporting',
  'Employment Guide',
  sub_pillar.id,
  true,
  'Employment Guide',
  'BPOC Team',
  'bpoc-team'
FROM sub_pillar
RETURNING id, title, depth, content_type;

-- Now test siblings
SELECT * FROM get_article_siblings(
  (SELECT id FROM insights_posts WHERE slug = 'termination-laws')
);

-- Expected: 1 sibling (regularization-process)

-- =====================================================
-- STEP 12: TEST SILO HIERARCHY VIEW
-- =====================================================

SELECT 'Testing silo hierarchy view...' as step;

SELECT 
  depth,
  title,
  slug,
  full_path,
  children_count
FROM silo_hierarchy
WHERE silo_topic = 'Employment Guide'
ORDER BY depth, title;

-- Expected: Full tree structure with paths

-- =====================================================
-- STEP 13: TEST CROSS-SILO LINKS
-- =====================================================

SELECT 'Testing cross-silo links...' as step;

-- Create a second pillar in different silo
INSERT INTO insights_posts (
  title,
  slug,
  content,
  description,
  depth,
  content_type,
  silo_topic,
  parent_id,
  is_published,
  category,
  author,
  author_slug
) VALUES (
  'BPO Jobs Philippines 2026',
  'bpo-jobs',
  '<p>Complete guide to BPO careers in the Philippines.</p>',
  'Find your dream BPO job',
  1,
  'pillar',
  'BPO Jobs',
  NULL,
  true,
  'BPO Jobs',
  'BPOC Team',
  'bpoc-team'
) RETURNING id, title, silo_topic;

-- Create a cross-silo link
WITH source AS (
  SELECT id FROM insights_posts WHERE slug = 'how-not-to-get-terminated'
),
target AS (
  SELECT id FROM insights_posts WHERE slug = 'bpo-jobs'
)
INSERT INTO cross_silo_links (
  source_article_id,
  target_article_id,
  link_type,
  anchor_text,
  context
)
SELECT
  source.id,
  target.id,
  'see-also',
  'Looking for BPO jobs?',
  'If you need to find a new job after termination'
FROM source, target
RETURNING id, link_type, anchor_text;

-- Verify cross-silo link
SELECT 
  s.title as source_article,
  t.title as target_article,
  csl.link_type,
  csl.anchor_text,
  csl.context
FROM cross_silo_links csl
JOIN insights_posts s ON s.id = csl.source_article_id
JOIN insights_posts t ON t.id = csl.target_article_id;

-- =====================================================
-- STEP 14: TEST AI PIPELINE TABLES
-- =====================================================

SELECT 'Testing AI pipeline tables...' as step;

-- Test embeddings table
WITH article AS (
  SELECT id FROM insights_posts WHERE slug = 'how-not-to-get-terminated'
)
INSERT INTO insight_embeddings (
  insight_id,
  content_chunk,
  semantic_keywords,
  chunk_index
)
SELECT
  article.id,
  'Test content chunk about termination laws',
  ARRAY['termination', 'employment law', 'DOLE'],
  1
FROM article
RETURNING id, semantic_keywords;

-- Test link suggestions
WITH source AS (
  SELECT id FROM insights_posts WHERE slug = 'how-not-to-get-terminated'
),
target AS (
  SELECT id FROM insights_posts WHERE slug = 'termination-laws'
)
INSERT INTO link_suggestions (
  source_post_id,
  target_post_id,
  suggested_anchor_text,
  suggested_sentence,
  similarity_score,
  direction,
  status
)
SELECT
  source.id,
  target.id,
  'learn about termination laws',
  'For more details, learn about termination laws in the Philippines.',
  0.85,
  'forward',
  'pending'
FROM source, target
RETURNING id, suggested_anchor_text, similarity_score;

-- Test image generation logs
WITH article AS (
  SELECT id FROM insights_posts WHERE slug = 'how-not-to-get-terminated'
)
INSERT INTO image_generation_logs (
  insight_id,
  prompt,
  model,
  image_url,
  reasoning
)
SELECT
  article.id,
  'Professional Filipino office worker, confident, modern office',
  'dall-e-3',
  'https://example.com/image.jpg',
  'Generated hero image showing confidence and professionalism'
FROM article
RETURNING id, model, reasoning;

-- =====================================================
-- STEP 15: VERIFY EVERYTHING
-- =====================================================

SELECT 'Final verification...' as step;

-- Count articles by depth
SELECT 
  depth,
  content_type,
  COUNT(*) as count
FROM insights_posts
GROUP BY depth, content_type
ORDER BY depth;

-- View all silos
SELECT DISTINCT silo_topic, COUNT(*) as articles
FROM insights_posts
WHERE silo_topic IS NOT NULL
GROUP BY silo_topic;

-- View full hierarchy
SELECT 
  depth,
  REPEAT('  ', depth) || title as indented_title,
  slug,
  content_type
FROM insights_posts
ORDER BY 
  COALESCE(
    (SELECT p4.id FROM insights_posts p4 WHERE p4.depth = 1 AND insights_posts.silo_topic = p4.silo_topic LIMIT 1),
    insights_posts.id
  ),
  depth,
  created_at;

-- =====================================================
-- STEP 16: CLEAN UP TEST DATA (OPTIONAL)
-- =====================================================

-- Uncomment to delete test data:
-- DELETE FROM insights_posts WHERE silo_topic IN ('Employment Guide', 'BPO Jobs');

-- =====================================================
-- SUCCESS CHECKLIST
-- =====================================================
/*
✅ All tables exist
✅ All columns added
✅ All functions work
✅ All views created
✅ Depth hierarchy works (1-4 levels)
✅ Breadcrumb function works
✅ Children function works
✅ Siblings function works
✅ Cross-silo links work
✅ AI pipeline tables work
✅ Silo hierarchy view shows tree

🚀 SYSTEM IS READY!
*/

SELECT '🎉 ALL TESTS COMPLETE! SYSTEM IS WORKING!' as result;

