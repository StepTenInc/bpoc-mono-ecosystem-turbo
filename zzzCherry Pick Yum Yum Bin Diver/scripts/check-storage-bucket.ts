/**
 * Check storage bucket and files
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  console.log('🗄️  Checking Supabase Storage...\n');

  // Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError);
    return;
  }

  console.log('📦 Available Buckets:');
  console.table(buckets.map(b => ({
    name: b.name,
    public: b.public,
    id: b.id
  })));

  // Check agency-documents bucket
  const agencyBucket = buckets.find(b => b.id === 'agency-documents');

  if (!agencyBucket) {
    console.log('\n❌ "agency-documents" bucket NOT FOUND!');
    console.log('The migration may not have been run.');
    return;
  }

  console.log(`\n✅ "agency-documents" bucket exists`);
  console.log(`   Public: ${agencyBucket.public}`);
  console.log(`   Created: ${agencyBucket.created_at}`);

  // List files in the bucket
  console.log('\n📁 Files in agency-documents bucket:');
  const { data: files, error: filesError } = await supabase
    .storage
    .from('agency-documents')
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (filesError) {
    console.error('❌ Error listing files:', filesError);
    return;
  }

  if (!files || files.length === 0) {
    console.log('❌ No files found in bucket!');
    return;
  }

  console.log(`Found ${files.length} items:`);
  console.table(files.map(f => ({
    name: f.name,
    size: f.metadata?.size,
    created: f.created_at
  })));

  // Check Stephen's agency folder
  const agencyId = 'b2456346-b49f-4b05-813f-dde0c24da9f4';
  console.log(`\n🔍 Checking files for agency ${agencyId}:`);

  const { data: agencyFiles, error: agencyFilesError } = await supabase
    .storage
    .from('agency-documents')
    .list(agencyId, { limit: 100 });

  if (agencyFilesError) {
    console.error('❌ Error:', agencyFilesError);
  } else if (!agencyFiles || agencyFiles.length === 0) {
    console.log('❌ No files found for this agency!');
  } else {
    console.log(`✅ Found ${agencyFiles.length} items`);
    console.table(agencyFiles);
  }
}

checkStorage();
