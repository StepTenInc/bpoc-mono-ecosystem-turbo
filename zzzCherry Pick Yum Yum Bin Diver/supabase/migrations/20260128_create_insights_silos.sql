-- =====================================================
-- INSIGHTS SILOS - Dynamic Silo/Category Management
-- =====================================================
-- This migration creates the insights_silos table for
-- dynamic silo management and links it to insights_posts
-- =====================================================

-- Create insights_silos table
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

  -- Status & Ordering
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_insights_silos_slug ON insights_silos(slug);
CREATE INDEX IF NOT EXISTS idx_insights_silos_active ON insights_silos(is_active);
CREATE INDEX IF NOT EXISTS idx_insights_silos_sort ON insights_silos(sort_order);

-- Add silo_id column to insights_posts (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insights_posts' AND column_name = 'silo_id'
  ) THEN
    ALTER TABLE insights_posts ADD COLUMN silo_id UUID REFERENCES insights_silos(id);
  END IF;
END $$;

-- Create index on insights_posts.silo_id
CREATE INDEX IF NOT EXISTS idx_insights_posts_silo ON insights_posts(silo_id);

-- Create updated_at trigger function (if not exists)
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
-- SEED DATA: Initial 8 Silos
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
-- MIGRATION: Update existing posts to link to silos
-- =====================================================
-- This updates posts that have category matching silo names

UPDATE insights_posts ip
SET silo_id = s.id
FROM insights_silos s
WHERE ip.silo_id IS NULL
  AND (
    -- Match by category field
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

-- Enable RLS
ALTER TABLE insights_silos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow read for everyone, write for authenticated)
CREATE POLICY "Allow public read access to silos"
  ON insights_silos FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage silos"
  ON insights_silos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON insights_silos TO anon;
GRANT ALL ON insights_silos TO authenticated;
GRANT ALL ON insights_silos TO service_role;
