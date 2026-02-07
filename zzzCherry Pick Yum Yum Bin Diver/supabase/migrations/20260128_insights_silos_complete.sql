-- =====================================================
-- INSIGHTS SILOS - Complete Schema
-- =====================================================
-- Run this file to set up the complete dynamic silos
-- system with pillar post support
-- =====================================================

-- =====================================================
-- PART 1: CREATE INSIGHTS_SILOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS insights_silos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  -- AI Prompt Configuration (for content pipeline)
  context TEXT,                    -- e.g., "salary negotiations, pay scales, compensation packages"
  voice TEXT,                      -- Writing voice/tone
  subreddits TEXT,                 -- e.g., "r/jobs, r/careeradvice, r/Philippines"
  platforms TEXT,                  -- e.g., "LinkedIn salary posts, Glassdoor discussions"

  -- Visual/Branding
  icon VARCHAR(50),                -- Icon name (e.g., "DollarSign", "Briefcase")
  color VARCHAR(20),               -- Hex color (e.g., "#10B981")
  hero_image TEXT,                 -- Hero image URL for silo page

  -- SEO for Silo Page
  seo_title VARCHAR(70),           -- SEO title for silo landing page
  seo_description VARCHAR(160),    -- Meta description for silo page
  seo_keywords TEXT,               -- Keywords for silo page

  -- Pillar Post Reference (added in Part 2)
  pillar_post_id UUID,             -- Reference to the main pillar content

  -- Status & Ordering
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_insights_silos_slug ON insights_silos(slug);
CREATE INDEX IF NOT EXISTS idx_insights_silos_active ON insights_silos(is_active);
CREATE INDEX IF NOT EXISTS idx_insights_silos_sort ON insights_silos(sort_order);

-- =====================================================
-- PART 2: ADD COLUMNS TO INSIGHTS_POSTS
-- =====================================================

-- Add silo_id column to insights_posts (links article to silo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insights_posts' AND column_name = 'silo_id'
  ) THEN
    ALTER TABLE insights_posts ADD COLUMN silo_id UUID REFERENCES insights_silos(id);
  END IF;
END $$;

-- Add is_pillar column to insights_posts (marks pillar content)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insights_posts' AND column_name = 'is_pillar'
  ) THEN
    ALTER TABLE insights_posts ADD COLUMN is_pillar BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_insights_posts_silo ON insights_posts(silo_id);
CREATE INDEX IF NOT EXISTS idx_insights_posts_is_pillar ON insights_posts(is_pillar);

-- Add foreign key for pillar_post_id (after insights_posts columns exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'insights_silos_pillar_post_id_fkey'
  ) THEN
    ALTER TABLE insights_silos
    ADD CONSTRAINT insights_silos_pillar_post_id_fkey
    FOREIGN KEY (pillar_post_id) REFERENCES insights_posts(id);
  END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN insights_posts.silo_id IS 'Reference to the content silo this article belongs to';
COMMENT ON COLUMN insights_posts.is_pillar IS 'True if this post is a pillar/hub page for a silo';
COMMENT ON COLUMN insights_silos.pillar_post_id IS 'Reference to the pillar post that provides long-form content for this silo page';

-- =====================================================
-- PART 3: TRIGGERS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_insights_silos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_insights_silos_updated_at ON insights_silos;
CREATE TRIGGER set_insights_silos_updated_at
  BEFORE UPDATE ON insights_silos
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_silos_updated_at();

-- =====================================================
-- PART 4: SEED DATA - Initial 8 Silos
-- =====================================================

INSERT INTO insights_silos (slug, name, description, context, subreddits, platforms, icon, color, seo_title, seo_description, sort_order)
VALUES
  (
    'salary',
    'Salary & Compensation',
    'Everything you need to know about BPO salaries, pay scales, and compensation packages in the Philippines.',
    'salary negotiations, pay scales, compensation packages, benefits, bonuses, incentives',
    'r/jobs, r/careeradvice, r/personalfinance, r/Philippines',
    'LinkedIn salary posts, Glassdoor discussions, PayScale forums',
    'DollarSign',
    '#10B981',
    'BPO Salary & Compensation Guide | ShoreAgents',
    'Comprehensive guides on BPO salaries, pay scales, and compensation packages in the Philippines. Learn about salary negotiations and benefits.',
    1
  ),
  (
    'career',
    'Career Growth',
    'Guides and tips for advancing your BPO career, from promotions to leadership development.',
    'promotions, leadership development, career advancement, professional growth, skill development',
    'r/careerguidance, r/jobs, r/LifeProTips, r/Philippines',
    'LinkedIn career posts, Medium career articles, professional forums',
    'TrendingUp',
    '#3B82F6',
    'BPO Career Growth & Advancement | ShoreAgents',
    'Expert advice on growing your BPO career. Learn about promotions, leadership development, and professional advancement strategies.',
    2
  ),
  (
    'jobs',
    'BPO Jobs',
    'Latest job opportunities, hiring trends, and employment insights in the Philippine BPO industry.',
    'job openings, hiring trends, employment opportunities, job market, remote work',
    'r/jobs, r/forhire, r/Philippines, r/phcareers',
    'LinkedIn job posts, Indeed discussions, JobStreet forums',
    'Briefcase',
    '#8B5CF6',
    'BPO Jobs & Opportunities | ShoreAgents',
    'Find the latest BPO job opportunities in the Philippines. Hiring trends, job market insights, and career opportunities.',
    3
  ),
  (
    'interview',
    'Interview Tips',
    'Prepare for your BPO interviews with expert tips, common questions, and proven techniques.',
    'interview preparation, common questions, interview techniques, hiring process, behavioral interviews',
    'r/jobs, r/interviews, r/careeradvice, r/Philippines',
    'LinkedIn interview tips, Glassdoor interview reviews, career blogs',
    'MessageSquare',
    '#F59E0B',
    'BPO Interview Tips & Preparation | ShoreAgents',
    'Ace your BPO interviews with expert preparation tips, common questions and answers, and proven interview techniques.',
    4
  ),
  (
    'employment-guide',
    'Employment Guide',
    'Essential information about Philippine labor laws, employee rights, and workplace policies.',
    'labor laws, employee rights, DOLE regulations, workplace policies, employment contracts',
    'r/legaladvice, r/Philippines, r/antiwork, r/jobs',
    'DOLE official resources, legal forums, HR professional groups',
    'FileText',
    '#EF4444',
    'Philippine Employment Guide | ShoreAgents',
    'Understanding Philippine labor laws, employee rights, DOLE regulations, and workplace policies for BPO workers.',
    5
  ),
  (
    'companies',
    'Company Reviews',
    'Honest reviews and insights about BPO companies in the Philippines - culture, benefits, and work environment.',
    'company culture, employer reviews, workplace environment, company ratings, best employers',
    'r/jobs, r/Philippines, r/cscareerquestions, r/antiwork',
    'Glassdoor reviews, LinkedIn company pages, Indeed reviews',
    'Building2',
    '#06B6D4',
    'BPO Company Reviews Philippines | ShoreAgents',
    'Honest reviews and insights about BPO companies in the Philippines. Learn about company culture, benefits, and work environment.',
    6
  ),
  (
    'training',
    'Training & Certifications',
    'Boost your skills with training programs and certifications relevant to the BPO industry.',
    'professional development, certifications, training programs, skill building, online courses',
    'r/learnprogramming, r/ITCareerQuestions, r/certifications, r/Philippines',
    'LinkedIn Learning discussions, Coursera forums, professional certification groups',
    'GraduationCap',
    '#EC4899',
    'BPO Training & Certifications | ShoreAgents',
    'Discover training programs and certifications to boost your BPO career. Professional development resources and skill building guides.',
    7
  ),
  (
    'worklife',
    'Work-Life Balance',
    'Tips and strategies for maintaining a healthy work-life balance in the demanding BPO industry.',
    'stress management, work schedules, mental health, workplace wellness, burnout prevention',
    'r/antiwork, r/workreform, r/mentalhealth, r/Philippines',
    'LinkedIn wellness posts, Medium work-life articles, health forums',
    'Heart',
    '#14B8A6',
    'BPO Work-Life Balance Tips | ShoreAgents',
    'Maintain a healthy work-life balance in the BPO industry. Tips for stress management, mental health, and workplace wellness.',
    8
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  context = EXCLUDED.context,
  subreddits = EXCLUDED.subreddits,
  platforms = EXCLUDED.platforms,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =====================================================
-- PART 5: MIGRATE EXISTING POSTS TO SILOS
-- =====================================================

UPDATE insights_posts ip
SET silo_id = s.id
FROM insights_silos s
WHERE ip.silo_id IS NULL
  AND (
    LOWER(ip.category) LIKE '%salary%' AND s.slug = 'salary'
    OR LOWER(ip.category) LIKE '%career%' AND s.slug = 'career'
    OR LOWER(ip.category) LIKE '%job%' AND s.slug = 'jobs'
    OR LOWER(ip.category) LIKE '%interview%' AND s.slug = 'interview'
    OR LOWER(ip.category) LIKE '%employment%' AND s.slug = 'employment-guide'
    OR LOWER(ip.category) LIKE '%compan%' AND s.slug = 'companies'
    OR LOWER(ip.category) LIKE '%training%' AND s.slug = 'training'
    OR LOWER(ip.category) LIKE '%certification%' AND s.slug = 'training'
    OR LOWER(ip.category) LIKE '%work%life%' AND s.slug = 'worklife'
    OR LOWER(ip.category) LIKE '%balance%' AND s.slug = 'worklife'
  );

-- =====================================================
-- PART 6: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE insights_silos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access to silos" ON insights_silos;
CREATE POLICY "Allow public read access to silos"
  ON insights_silos FOR SELECT
  USING (true);

-- Allow authenticated users full access
DROP POLICY IF EXISTS "Allow authenticated users to manage silos" ON insights_silos;
CREATE POLICY "Allow authenticated users to manage silos"
  ON insights_silos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- PART 7: GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON insights_silos TO anon;
GRANT ALL ON insights_silos TO authenticated;
GRANT ALL ON insights_silos TO service_role;

-- =====================================================
-- DONE! Your silo system is now ready.
-- =====================================================
--
-- What was created:
-- 1. insights_silos table with all fields
-- 2. silo_id column in insights_posts (links articles to silos)
-- 3. is_pillar column in insights_posts (marks pillar content)
-- 4. pillar_post_id column in insights_silos (links to pillar article)
-- 5. 8 seed silos with SEO content
-- 6. Automatic migration of existing posts to silos
-- 7. RLS policies for security
--
-- Next steps:
-- 1. Create pillar posts for each silo using the content pipeline
-- 2. Mark them as "Pillar Post" when creating
-- 3. They will automatically link to the silo
-- =====================================================
