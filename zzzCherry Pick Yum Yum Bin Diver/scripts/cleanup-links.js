const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupLinks() {
  console.log('🧹 Starting Link Cleanup...\n');

  // Get all posts with applied_links
  const { data: posts, error } = await supabase
    .from('insights_posts')
    .select('id, title, slug, content, applied_links');

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  for (const post of posts) {
    if (!post.applied_links || post.applied_links.length === 0) {
      continue;
    }

    console.log(`\n📄 ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Links: ${post.applied_links.length}`);

    const validLinks = [];
    const brokenLinks = [];

    for (const link of post.applied_links) {
      const searchText = link.original_text || link.anchor_text;
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      if (regex.test(post.content)) {
        validLinks.push(link);
        console.log(`   ✅ "${searchText}" → ${link.target_slug}`);
      } else {
        brokenLinks.push(link);
        console.log(`   ❌ "${searchText}" NOT FOUND - will remove`);
      }
    }

    // Update if we found broken links
    if (brokenLinks.length > 0) {
      const { error: updateError } = await supabase
        .from('insights_posts')
        .update({ applied_links: validLinks })
        .eq('id', post.id);

      if (updateError) {
        console.error(`   Error updating: ${updateError.message}`);
      } else {
        console.log(`   🧹 Removed ${brokenLinks.length} broken links`);
      }
    }
  }

  console.log('\n✅ Cleanup complete!');
}

cleanupLinks();

