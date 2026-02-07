/**
 * Check agency verification documents
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAgencyDocuments() {
  console.log('📄 Checking agency verification documents...\n');

  // Get Stephen's agency
  const { data: recruiter } = await supabase
    .from('agency_recruiters')
    .select('agency_id, email, first_name, last_name')
    .eq('email', 'stephena@shoreagents.com')
    .single();

  if (!recruiter) {
    console.log('❌ Stephen not found');
    return;
  }

  console.log(`✅ Stephen's recruiter account: ${recruiter.first_name} ${recruiter.last_name}`);
  console.log(`   Agency ID: ${recruiter.agency_id}\n`);

  // Get agency with documents
  const { data: agency, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', recruiter.agency_id)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('🏢 Agency Details:');
  console.log('─'.repeat(100));
  console.log(`Name: ${agency.name}`);
  console.log(`TIN: ${agency.tin_number || 'NOT SET'}`);
  console.log(`\n📋 Documents:`);
  console.log(`  DTI Certificate: ${agency.dti_certificate_url ? '✅ UPLOADED' : '❌ MISSING'}`);
  if (agency.dti_certificate_url) console.log(`    URL: ${agency.dti_certificate_url}`);

  console.log(`  Business Permit: ${agency.business_permit_url ? '✅ UPLOADED' : '❌ MISSING'}`);
  if (agency.business_permit_url) console.log(`    URL: ${agency.business_permit_url}`);

  console.log(`  SEC Registration: ${agency.sec_registration_url ? '✅ UPLOADED' : '❌ MISSING'}`);
  if (agency.sec_registration_url) console.log(`    URL: ${agency.sec_registration_url}`);

  console.log(`\n📊 Verification Status:`);
  console.log(`  Documents Uploaded: ${agency.documents_uploaded_at ? '✅ YES' : '❌ NO'}`);
  if (agency.documents_uploaded_at) console.log(`    Uploaded At: ${agency.documents_uploaded_at}`);

  console.log(`  Documents Verified: ${agency.documents_verified ? '✅ YES' : '❌ PENDING'}`);
  if (agency.documents_verified_at) console.log(`    Verified At: ${agency.documents_verified_at}`);
  if (agency.documents_verified_by) console.log(`    Verified By: ${agency.documents_verified_by}`);
}

checkAgencyDocuments();
