const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const correctSlugs = {
  'bpo-salary-guide-philippines': 'BPO Salary Philippines 2026: The Real Numbers',
  'how-to-get-promoted-bpo-call-center': 'How to Get Promoted Fast in BPO',
  'bpo-jobs-philippines-guide': 'BPO Jobs Philippines 2026: The Complete Guide',
  'how-to-get-hired-call-center-philippines': 'How to Get Hired in a Call Center',
  'bpo-employee-benefits-rights-philippines': 'BPO Employee Benefits Philippines 2026',
  'best-bpo-companies-philippines': 'Best BPO Companies to Work For Philippines 2026'
};

async function auditAndFixPillars() {
  console.log('🔍 Starting Pillar Audit...');

  // Fetch all posts
  const { data: posts, error } = await supabase
    .from('insights_posts')
    .select('id, slug, title, seo:seo_metadata(id, canonical_url, meta_title)');

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  for (const post of posts) {
    let needsUpdate = false;
    let newSlug = post.slug;

    // 1. Remove Year from Slug (if missed)
    if (newSlug.includes('2026') || newSlug.includes('2025')) {
      newSlug = newSlug.replace(/-2026/g, '').replace(/2026-/g, '').replace(/2026/g, '')
                       .replace(/-2025/g, '').replace(/2025-/g, '').replace(/2025/g, '');
      console.log(`⚠️  Found Year in Slug: ${post.slug} -> ${newSlug}`);
      needsUpdate = true;
    }

    // 2. Standardize Pillar Slugs (Exact Match)
    // Map known variations to the correct clean slug
    if (newSlug.includes('salary') && newSlug !== 'bpo-salary-guide-philippines') newSlug = 'bpo-salary-guide-philippines';
    if (newSlug.includes('hired') && newSlug !== 'how-to-get-hired-call-center-philippines') newSlug = 'how-to-get-hired-call-center-philippines';
    if (newSlug.includes('promoted') && newSlug !== 'how-to-get-promoted-bpo-call-center') newSlug = 'how-to-get-promoted-bpo-call-center';
    if (newSlug.includes('benefits') && newSlug !== 'bpo-employee-benefits-rights-philippines') newSlug = 'bpo-employee-benefits-rights-philippines';
    if (newSlug.includes('companies') && newSlug !== 'best-bpo-companies-philippines') newSlug = 'best-bpo-companies-philippines';
    if (newSlug.includes('jobs') && newSlug !== 'bpo-jobs-philippines-guide') newSlug = 'bpo-jobs-philippines-guide';

    if (newSlug !== post.slug) {
        console.log(`🔧 Correcting Slug: ${post.slug} -> ${newSlug}`);
        needsUpdate = true;
    }

    if (needsUpdate) {
      // Check collision
      const { data: conflict } = await supabase.from('insights_posts').select('id').eq('slug', newSlug).neq('id', post.id).single();
      if (conflict) {
        console.error(`❌ Cannot rename ${post.slug} to ${newSlug} (Conflict exists)`);
        continue;
      }

      // Update Post
      const { error: updateError } = await supabase
        .from('insights_posts')
        .update({ slug: newSlug })
        .eq('id', post.id);

      if (updateError) {
        console.error(`❌ Error updating post ${post.id}:`, updateError);
      } else {
        console.log(`✅ Updated Slug for: ${post.title}`);
        
        // Fix Canonical URL
        if (post.seo) {
            const correctCanonical = `https://www.bpoc.io/insights/${newSlug}`;
            await supabase
                .from('seo_metadata')
                .update({ canonical_url: correctCanonical })
                .eq('id', post.seo.id);
            console.log(`   Updated Canonical: ${correctCanonical}`);
        }
      }
    } else {
        console.log(`👌 Slug OK: ${post.slug}`);
    }
  }
  console.log('🏁 Audit Completed.');
}

auditAndFixPillars();

