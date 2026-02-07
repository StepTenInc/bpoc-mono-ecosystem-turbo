-- =====================================================
-- PILLAR POSTS - Link Silos to Pillar Content
-- =====================================================
-- This migration adds pillar post support to silos
-- so each silo can have rich long-form content
-- =====================================================

-- Add is_pillar column to insights_posts
ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS is_pillar BOOLEAN DEFAULT false;

-- Add pillar_post_id to insights_silos
ALTER TABLE insights_silos
ADD COLUMN IF NOT EXISTS pillar_post_id UUID REFERENCES insights_posts(id);

-- Create index for faster pillar lookups
CREATE INDEX IF NOT EXISTS idx_insights_posts_is_pillar ON insights_posts(is_pillar);

-- Comment for documentation
COMMENT ON COLUMN insights_posts.is_pillar IS 'True if this post is a pillar/hub page for a silo';
COMMENT ON COLUMN insights_silos.pillar_post_id IS 'Reference to the pillar post that provides long-form content for this silo page';
