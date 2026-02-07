/**
 * Check recent recruiter signups and team invitations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentSignups() {
  console.log('🔍 Checking recent recruiter signups and invitations...\n');

  // Check recent recruiters
  console.log('📋 Recent Recruiters:');
  console.log('─'.repeat(80));
  const { data: recruiters, error: recruitersError } = await supabase
    .from('agency_recruiters')
    .select('id, email, first_name, last_name, role, verification_status, joined_at, agency_id')
    .order('joined_at', { ascending: false })
    .limit(5);

  if (recruitersError) {
    console.error('❌ Error fetching recruiters:', recruitersError);
  } else {
    console.table(recruiters);
  }

  // Check recent team invitations
  console.log('\n📧 Recent Team Invitations:');
  console.log('─'.repeat(80));
  const { data: invitations, error: invitationsError } = await supabase
    .from('team_invitations')
    .select('id, invitee_email, invitee_name, inviter_email, inviter_name, role, status, created_at, requires_documents')
    .order('created_at', { ascending: false })
    .limit(5);

  if (invitationsError) {
    console.error('❌ Error fetching invitations:', invitationsError);
  } else {
    console.table(invitations);
  }

  // Check specific invitation for stephena@shoreagents.com
  console.log('\n🎯 Invitation for stephena@shoreagents.com:');
  console.log('─'.repeat(80));
  const { data: specificInvite, error: specificError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('invitee_email', 'stephena@shoreagents.com')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (specificError) {
    console.error('❌ No invitation found for stephena@shoreagents.com');
  } else {
    console.log('\nInvitation Details:');
    console.log(JSON.stringify(specificInvite, null, 2));
  }
}

checkRecentSignups().catch(console.error);
