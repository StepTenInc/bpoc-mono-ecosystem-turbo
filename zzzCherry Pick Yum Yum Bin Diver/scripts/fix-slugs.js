const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSlugs() {
  console.log('🐌 Starting Slug Fix...');

  // 1. Fetch all posts with '2026' in the slug
  const { data: posts, error } = await supabase
    .from('insights_posts')
    .select('id, slug, title')
    .ilike('slug', '%2026%');

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log(`Found ${posts.length} posts with '2026' in slug.`);

  for (const post of posts) {
    const newSlug = post.slug.replace(/-2026/g, '').replace(/2026-/g, '').replace(/2026/g, '');
    
    if (newSlug === post.slug) continue;

    console.log(`Renaming: ${post.slug} -> ${newSlug}`);

    // Update Post Slug
    const { error: updateError } = await supabase
      .from('insights_posts')
      .update({ slug: newSlug })
      .eq('id', post.id);

    if (updateError) {
      console.error(`❌ Error updating post ${post.id}:`, updateError);
      continue;
    }

    // Update Canonical URL in SEO Metadata
    const { data: seoData } = await supabase
      .from('seo_metadata')
      .select('canonical_url')
      .eq('post_id', post.id)
      .single();

    if (seoData && seoData.canonical_url) {
      const newCanonical = seoData.canonical_url.replace(post.slug, newSlug);
      await supabase
        .from('seo_metadata')
        .update({ canonical_url: newCanonical })
        .eq('post_id', post.id);
      console.log(`   Updated canonical: ${newCanonical}`);
    }
  }

  console.log('✅ Slug fix completed.');
}

fixSlugs();

