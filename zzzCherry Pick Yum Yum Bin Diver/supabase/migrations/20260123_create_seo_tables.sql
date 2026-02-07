-- ============================================
-- AI CONTENT PIPELINE - SEO OPTIMIZATION TABLES
-- Created: 2026-01-23
-- Purpose: Support Stage 6 SEO features
-- ============================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLE: article_embeddings
-- Stores vector embeddings for semantic search
-- ============================================
CREATE TABLE IF NOT EXISTS article_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, chunk_index)
);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_article_embeddings_embedding 
  ON article_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for article lookup
CREATE INDEX IF NOT EXISTS idx_article_embeddings_article_id 
  ON article_embeddings(article_id);

COMMENT ON TABLE article_embeddings IS 'Vector embeddings for semantic article search and internal linking';
COMMENT ON COLUMN article_embeddings.chunk_index IS '0-based index of content chunk within article';
COMMENT ON COLUMN article_embeddings.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';

-- ============================================
-- TABLE: article_links
-- Tracks internal links between articles
-- ============================================
CREATE TABLE IF NOT EXISTS article_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_article_id UUID NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  to_article_id UUID NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('parent', 'child', 'sibling', 'cross-silo')),
  context TEXT, -- Surrounding paragraph for context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_article_id, to_article_id, anchor_text)
);

-- Indexes for link analysis
CREATE INDEX IF NOT EXISTS idx_article_links_from 
  ON article_links(from_article_id);

CREATE INDEX IF NOT EXISTS idx_article_links_to 
  ON article_links(to_article_id);

CREATE INDEX IF NOT EXISTS idx_article_links_type 
  ON article_links(link_type);

COMMENT ON TABLE article_links IS 'Internal linking relationships between articles';
COMMENT ON COLUMN article_links.link_type IS 'Hierarchical relationship: parent (overview), child (deep-dive), sibling (related topic), cross-silo (different category)';
COMMENT ON COLUMN article_links.context IS 'Paragraph where link appears for relevance validation';

-- ============================================
-- TABLE: targeted_keywords
-- Prevents keyword cannibalization
-- ============================================
CREATE TABLE IF NOT EXISTS targeted_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  article_id UUID NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  silo TEXT, -- Content silo/category
  search_volume INTEGER, -- Monthly search volume
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100), -- Keyword difficulty 0-100
  is_primary BOOLEAN DEFAULT false, -- Is this the main target keyword?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for keyword analysis
CREATE INDEX IF NOT EXISTS idx_targeted_keywords_keyword 
  ON targeted_keywords(keyword);

CREATE INDEX IF NOT EXISTS idx_targeted_keywords_article 
  ON targeted_keywords(article_id);

CREATE INDEX IF NOT EXISTS idx_targeted_keywords_silo 
  ON targeted_keywords(silo);

COMMENT ON TABLE targeted_keywords IS 'Tracks keyword usage to prevent cannibalization across articles';
COMMENT ON COLUMN targeted_keywords.is_primary IS 'True if this is the main target keyword (only one per article)';

-- ============================================
-- TABLE: humanization_patterns
-- Stores AI detection patterns for learning
-- ============================================
CREATE TABLE IF NOT EXISTS humanization_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_name TEXT NOT NULL UNIQUE,
  pattern_type TEXT CHECK (pattern_type IN ('structure', 'language', 'tone', 'transition', 'phrasing')),
  frequency INTEGER DEFAULT 1,
  fix_description TEXT NOT NULL,
  example_before TEXT,
  example_after TEXT,
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pattern lookup
CREATE INDEX IF NOT EXISTS idx_humanization_patterns_type 
  ON humanization_patterns(pattern_type);

COMMENT ON TABLE humanization_patterns IS 'Catalog of AI writing patterns and humanization fixes';
COMMENT ON COLUMN humanization_patterns.frequency IS 'Number of times pattern has been detected';

-- ============================================
-- FUNCTION: search_similar_articles
-- Semantic search using vector similarity
-- ============================================
CREATE OR REPLACE FUNCTION search_similar_articles(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  min_similarity FLOAT DEFAULT 0.7,
  exclude_article_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  category TEXT,
  silo TEXT,
  similarity FLOAT,
  word_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (ip.id)
    ip.id,
    ip.title,
    ip.slug,
    ip.category,
    COALESCE(ip.generation_metadata->>'silo', ip.category) AS silo,
    1 - (ae.embedding <=> query_embedding) AS similarity,
    COALESCE((ip.generation_metadata->>'wordCount')::INTEGER, 
             array_length(string_to_array(ip.content, ' '), 1)) AS word_count
  FROM insights_posts ip
  JOIN article_embeddings ae ON ae.article_id = ip.id
  WHERE ip.is_published = true
    AND (exclude_article_id IS NULL OR ip.id != exclude_article_id)
    AND 1 - (ae.embedding <=> query_embedding) >= min_similarity
  ORDER BY ip.id, similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_similar_articles IS 'Find semantically similar articles for internal linking';

-- ============================================
-- FUNCTION: detect_orphan_articles
-- Find articles with no incoming links
-- ============================================
CREATE OR REPLACE FUNCTION detect_orphan_articles()
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  category TEXT,
  created_at TIMESTAMPTZ,
  days_published INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ip.id,
    ip.title,
    ip.slug,
    ip.category,
    ip.created_at,
    EXTRACT(DAY FROM NOW() - ip.created_at)::INTEGER AS days_published
  FROM insights_posts ip
  WHERE ip.is_published = true
    AND NOT EXISTS (
      SELECT 1 FROM article_links al 
      WHERE al.to_article_id = ip.id
    )
  ORDER BY ip.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_orphan_articles IS 'Identify published articles with no incoming internal links';

-- ============================================
-- FUNCTION: check_keyword_cannibalization
-- Detect keyword conflicts across articles
-- ============================================
CREATE OR REPLACE FUNCTION check_keyword_cannibalization(
  target_keywords TEXT[]
)
RETURNS TABLE (
  keyword TEXT,
  article_id UUID,
  article_title TEXT,
  article_slug TEXT,
  is_primary BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tk.keyword,
    tk.article_id,
    ip.title AS article_title,
    ip.slug AS article_slug,
    tk.is_primary,
    tk.created_at
  FROM targeted_keywords tk
  JOIN insights_posts ip ON ip.id = tk.article_id
  WHERE tk.keyword = ANY(target_keywords)
    AND ip.is_published = true
  ORDER BY tk.keyword, tk.is_primary DESC, tk.created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_keyword_cannibalization IS 'Check if keywords are already targeted by other published articles';

-- ============================================
-- FUNCTION: get_article_link_stats
-- Get incoming/outgoing link counts for article
-- ============================================
CREATE OR REPLACE FUNCTION get_article_link_stats(target_article_id UUID)
RETURNS TABLE (
  incoming_links INTEGER,
  outgoing_links INTEGER,
  parent_links INTEGER,
  child_links INTEGER,
  sibling_links INTEGER,
  cross_silo_links INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM article_links WHERE to_article_id = target_article_id)::INTEGER AS incoming_links,
    (SELECT COUNT(*) FROM article_links WHERE from_article_id = target_article_id)::INTEGER AS outgoing_links,
    (SELECT COUNT(*) FROM article_links WHERE from_article_id = target_article_id AND link_type = 'parent')::INTEGER AS parent_links,
    (SELECT COUNT(*) FROM article_links WHERE from_article_id = target_article_id AND link_type = 'child')::INTEGER AS child_links,
    (SELECT COUNT(*) FROM article_links WHERE from_article_id = target_article_id AND link_type = 'sibling')::INTEGER AS sibling_links,
    (SELECT COUNT(*) FROM article_links WHERE from_article_id = target_article_id AND link_type = 'cross-silo')::INTEGER AS cross_silo_links;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_article_link_stats IS 'Get detailed link statistics for an article';

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_article_links_updated_at ON article_links;
CREATE TRIGGER update_article_links_updated_at
  BEFORE UPDATE ON article_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_targeted_keywords_updated_at ON targeted_keywords;
CREATE TRIGGER update_targeted_keywords_updated_at
  BEFORE UPDATE ON targeted_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Update humanization pattern frequency
-- ============================================
CREATE OR REPLACE FUNCTION increment_pattern_frequency()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_humanization_patterns_last_seen ON humanization_patterns;
CREATE TRIGGER update_humanization_patterns_last_seen
  BEFORE UPDATE ON humanization_patterns
  FOR EACH ROW
  WHEN (OLD.frequency < NEW.frequency)
  EXECUTE FUNCTION increment_pattern_frequency();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON article_embeddings TO authenticated;
GRANT ALL ON article_links TO authenticated;
GRANT ALL ON targeted_keywords TO authenticated;
GRANT ALL ON humanization_patterns TO authenticated;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite index for link type analysis per article
CREATE INDEX IF NOT EXISTS idx_article_links_from_type 
  ON article_links(from_article_id, link_type);

-- Index for finding articles by keyword
CREATE INDEX IF NOT EXISTS idx_targeted_keywords_article_primary 
  ON targeted_keywords(article_id, is_primary);

-- Full-text search index for pattern names
CREATE INDEX IF NOT EXISTS idx_humanization_patterns_name_trgm 
  ON humanization_patterns USING gin (pattern_name gin_trgm_ops);

-- ============================================
-- COMPLETE!
-- ============================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE '✅ SEO tables created successfully!';
  RAISE NOTICE '   - article_embeddings';
  RAISE NOTICE '   - article_links';
  RAISE NOTICE '   - targeted_keywords';
  RAISE NOTICE '   - humanization_patterns';
  RAISE NOTICE '   - 4 helper functions';
  RAISE NOTICE '   - 3 triggers';
END $$;
