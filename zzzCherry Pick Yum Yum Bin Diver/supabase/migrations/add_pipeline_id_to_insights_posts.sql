-- Add pipeline_id column to insights_posts table to link articles with their content pipeline
ALTER TABLE insights_posts 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES content_pipelines(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_insights_posts_pipeline_id ON insights_posts(pipeline_id);

-- Add comment to document the column
COMMENT ON COLUMN insights_posts.pipeline_id IS 'Links this article to its content creation pipeline for tracking the full creation process';
