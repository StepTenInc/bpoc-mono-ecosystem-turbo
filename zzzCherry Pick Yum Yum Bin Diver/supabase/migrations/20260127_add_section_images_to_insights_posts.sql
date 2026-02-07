-- ============================================================================
-- Migration: Add Section Image Alt Texts to insights_posts
-- Date: 2026-01-27
-- Description: Adds columns for section image alt texts for SEO
-- ============================================================================

-- Add alt text columns for each section image
ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS section1_image_alt TEXT;

ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS section2_image_alt TEXT;

ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS section3_image_alt TEXT;

-- Add cover_image_alt for the hero/cover image alt text
ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS cover_image_alt TEXT;

-- Add hero_video_url for video hero support
ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS hero_video_url TEXT;

-- Add hero_type to distinguish between image and video heroes
ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS hero_type TEXT DEFAULT 'image' CHECK (hero_type IN ('image', 'video'));

-- Add silo/category field if not exists
ALTER TABLE insights_posts
ADD COLUMN IF NOT EXISTS silo TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN insights_posts.section1_image_alt IS 'Alt text for section 1 image (SEO)';
COMMENT ON COLUMN insights_posts.section2_image_alt IS 'Alt text for section 2 image (SEO)';
COMMENT ON COLUMN insights_posts.section3_image_alt IS 'Alt text for section 3 image (SEO)';
COMMENT ON COLUMN insights_posts.cover_image_alt IS 'Alt text for the cover/hero image (SEO)';
COMMENT ON COLUMN insights_posts.hero_video_url IS 'URL of hero video if hero_type is video';
COMMENT ON COLUMN insights_posts.hero_type IS 'Type of hero media: image or video';
