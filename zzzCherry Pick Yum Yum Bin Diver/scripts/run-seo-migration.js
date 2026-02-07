#!/usr/bin/env node

/**
 * Apply SEO tables migration to Supabase
 * 
 * Creates:
 * - article_embeddings (vector search)
 * - article_links (internal linking)
 * - targeted_keywords (cannibalization prevention)
 * - humanization_patterns (AI learning)
 * - Helper functions and triggers
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Running SEO tables migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260123_create_seo_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split into statements (PostgreSQL allows multiple statements)
    // But we'll execute as one for atomicity
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, we'll need to use the Supabase SQL editor
      console.log('⚠️  Cannot execute via RPC. Please run this migration manually:');
      console.log('\n1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of:');
      console.log(`   ${migrationPath}`);
      console.log('4. Click "Run"\n');
      
      // Print first 500 chars of SQL as preview
      console.log('📄 Migration Preview:');
      console.log('─'.repeat(80));
      console.log(sql.substring(0, 500) + '...\n');
      
      return;
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Created tables:');
    console.log('  ✓ article_embeddings');
    console.log('  ✓ article_links');
    console.log('  ✓ targeted_keywords');
    console.log('  ✓ humanization_patterns\n');
    console.log('Created functions:');
    console.log('  ✓ search_similar_articles()');
    console.log('  ✓ detect_orphan_articles()');
    console.log('  ✓ check_keyword_cannibalization()');
    console.log('  ✓ get_article_link_stats()');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Manual migration instructions:');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Run the SQL file at:');
    console.log(`   supabase/migrations/20260123_create_seo_tables.sql`);
    process.exit(1);
  }
}

runMigration();
