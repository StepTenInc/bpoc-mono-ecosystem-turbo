-- Add media tracking columns to content_pipelines table
-- Run this in Supabase SQL Editor

-- Video URL for video hero types
ALTER TABLE content_pipelines 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Track how hero was obtained: 'generate' (AI) or 'upload' (manual)
ALTER TABLE content_pipelines 
ADD COLUMN IF NOT EXISTS hero_source TEXT CHECK (hero_source IN ('generate', 'upload'));

-- Track how section images were obtained: 'generate' (AI) or 'upload' (manual)
ALTER TABLE content_pipelines 
ADD COLUMN IF NOT EXISTS section_source TEXT CHECK (section_source IN ('generate', 'upload'));

-- Legacy column - kept for backward compatibility
ALTER TABLE content_pipelines 
ADD COLUMN IF NOT EXISTS image_source TEXT CHECK (image_source IN ('generate', 'upload'));

-- Add comments for clarity
COMMENT ON COLUMN content_pipelines.video_url IS 'Video URL when hero_type is video';
COMMENT ON COLUMN content_pipelines.hero_source IS 'How hero was added: generate (AI) or upload (manual)';
COMMENT ON COLUMN content_pipelines.section_source IS 'How section images were added: generate (AI) or upload (manual)';
COMMENT ON COLUMN content_pipelines.image_source IS 'Legacy: How images were added: generate (AI) or upload (manual)';


