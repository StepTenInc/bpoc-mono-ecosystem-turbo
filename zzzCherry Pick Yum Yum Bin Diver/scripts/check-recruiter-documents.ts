/**
 * Check recruiter verification documents
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDocuments() {
  console.log('📄 Checking recruiter verification documents...\n');

  // Check recruiter_verification_documents table
  const { data: docs, error } = await supabase
    .from('recruiter_verification_documents')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching documents:', error);
  } else if (!docs || docs.length === 0) {
    console.log('❌ No documents found in database');
  } else {
    console.log('📋 Recent Documents:');
    console.log('─'.repeat(100));
    console.table(docs.map(d => ({
      id: d.id.substring(0, 8),
      recruiter_email: d.recruiter_id,
      doc_type: d.document_type,
      status: d.verification_status,
      uploaded: d.uploaded_at,
      file_url: d.file_url ? 'YES' : 'NO'
    })));
  }

  // Check Stephen's specific documents
  console.log('\n🎯 Stephen\'s Documents (stephena@shoreagents.com):');
  console.log('─'.repeat(100));

  // First get Stephen's user ID
  const { data: recruiter } = await supabase
    .from('agency_recruiters')
    .select('user_id, id')
    .eq('email', 'stephena@shoreagents.com')
    .single();

  if (recruiter) {
    const { data: stephenDocs } = await supabase
      .from('recruiter_verification_documents')
      .select('*')
      .eq('recruiter_id', recruiter.user_id);

    if (stephenDocs && stephenDocs.length > 0) {
      console.table(stephenDocs);
    } else {
      console.log('❌ No documents found for Stephen');
    }
  }
}

checkDocuments();
