-- ============================================
-- UPDATE SILO SLUGS
-- Run this BEFORE deploying the directory changes
-- ============================================

-- Start transaction for safety
BEGIN;

-- Update salary -> bpo-salary-compensation
UPDATE insights_silos
SET slug = 'bpo-salary-compensation',
    updated_at = NOW()
WHERE slug = 'salary';

-- Update career -> bpo-career-growth
UPDATE insights_silos
SET slug = 'bpo-career-growth',
    updated_at = NOW()
WHERE slug = 'career';

-- Update jobs -> bpo-jobs
UPDATE insights_silos
SET slug = 'bpo-jobs',
    updated_at = NOW()
WHERE slug = 'jobs';

-- Update interview -> interview-tips
UPDATE insights_silos
SET slug = 'interview-tips',
    updated_at = NOW()
WHERE slug = 'interview';

-- Update employment-guide -> bpo-employment-guide
UPDATE insights_silos
SET slug = 'bpo-employment-guide',
    updated_at = NOW()
WHERE slug = 'employment-guide';

-- Update companies -> bpo-company-reviews
UPDATE insights_silos
SET slug = 'bpo-company-reviews',
    updated_at = NOW()
WHERE slug = 'companies';

-- Update training -> training-and-certifications
UPDATE insights_silos
SET slug = 'training-and-certifications',
    updated_at = NOW()
WHERE slug = 'training';

-- Update worklife -> work-life-balance
UPDATE insights_silos
SET slug = 'work-life-balance',
    updated_at = NOW()
WHERE slug = 'worklife';

-- ============================================
-- Also update silo_topic in insights_posts
-- (if articles reference silos by slug string)
-- ============================================

UPDATE insights_posts SET silo_topic = 'bpo-salary-compensation' WHERE silo_topic = 'salary';
UPDATE insights_posts SET silo_topic = 'bpo-career-growth' WHERE silo_topic = 'career';
UPDATE insights_posts SET silo_topic = 'bpo-jobs' WHERE silo_topic = 'jobs';
UPDATE insights_posts SET silo_topic = 'interview-tips' WHERE silo_topic = 'interview';
UPDATE insights_posts SET silo_topic = 'bpo-employment-guide' WHERE silo_topic = 'employment-guide';
UPDATE insights_posts SET silo_topic = 'bpo-company-reviews' WHERE silo_topic = 'companies';
UPDATE insights_posts SET silo_topic = 'training-and-certifications' WHERE silo_topic = 'training';
UPDATE insights_posts SET silo_topic = 'work-life-balance' WHERE silo_topic = 'worklife';

-- ============================================
-- Verify the changes before committing
-- ============================================

SELECT id, name, slug, updated_at
FROM insights_silos
ORDER BY slug;

-- If everything looks correct, commit:
COMMIT;

-- If something went wrong, rollback:
-- ROLLBACK;


-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
/*
BEGIN;

UPDATE insights_silos SET slug = 'salary' WHERE slug = 'bpo-salary-compensation';
UPDATE insights_silos SET slug = 'career' WHERE slug = 'bpo-career-growth';
UPDATE insights_silos SET slug = 'jobs' WHERE slug = 'bpo-jobs';
UPDATE insights_silos SET slug = 'interview' WHERE slug = 'interview-tips';
UPDATE insights_silos SET slug = 'employment-guide' WHERE slug = 'bpo-employment-guide';
UPDATE insights_silos SET slug = 'companies' WHERE slug = 'bpo-company-reviews';
UPDATE insights_silos SET slug = 'training' WHERE slug = 'training-and-certifications';
UPDATE insights_silos SET slug = 'worklife' WHERE slug = 'work-life-balance';

UPDATE insights_posts SET silo_topic = 'salary' WHERE silo_topic = 'bpo-salary-compensation';
UPDATE insights_posts SET silo_topic = 'career' WHERE silo_topic = 'bpo-career-growth';
UPDATE insights_posts SET silo_topic = 'jobs' WHERE silo_topic = 'bpo-jobs';
UPDATE insights_posts SET silo_topic = 'interview' WHERE silo_topic = 'interview-tips';
UPDATE insights_posts SET silo_topic = 'employment-guide' WHERE silo_topic = 'bpo-employment-guide';
UPDATE insights_posts SET silo_topic = 'companies' WHERE silo_topic = 'bpo-company-reviews';
UPDATE insights_posts SET silo_topic = 'training' WHERE silo_topic = 'training-and-certifications';
UPDATE insights_posts SET silo_topic = 'worklife' WHERE silo_topic = 'work-life-balance';

COMMIT;
*/
