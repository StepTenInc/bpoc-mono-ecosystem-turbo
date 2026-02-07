-- ============================================
-- CONTENT_PIPELINES: Pipeline Tracking Only
-- All article data lives in INSIGHTS_POSTS
-- Connected via: content_pipelines.insight_id → insights_posts.id
-- ============================================

-- Minimal required columns for content_pipelines:
ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS insight_id UUID REFERENCES insights_posts(id) ON DELETE CASCADE;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS plan_approved BOOLEAN DEFAULT false;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS hero_source TEXT; -- 'generate' or 'upload'

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS section_source TEXT; -- 'generate' or 'upload'

-- Pipeline-specific data (not in insights_posts)
ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS brief_transcript TEXT;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS generated_ideas JSONB;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS selected_idea JSONB;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS article_plan JSONB;

ALTER TABLE content_pipelines
ADD COLUMN IF NOT EXISTS ai_logs JSONB DEFAULT '[]'::jsonb;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_content_pipelines_insight_id ON content_pipelines(insight_id);
CREATE INDEX IF NOT EXISTS idx_content_pipelines_status ON content_pipelines(status);

-- ============================================
-- HOW IT WORKS:
-- ============================================
-- content_pipelines stores:
--   ✓ Pipeline state (current_stage, status, plan_approved)
--   ✓ User choices (hero_source, section_source)
--   ✓ Pipeline-specific data (brief, ideas, plan, ai_logs)
--
-- insights_posts stores (via insight_id FK):
--   ✓ Article content (content, content_part1/2/3)
--   ✓ Images (hero_url, video_url, content_image0/1/2)
--   ✓ Meta (title, meta_description, slug)
--   ✓ Research (serper_research, hr_kb_articles)
--   ✓ Everything else about the article
-- ============================================

