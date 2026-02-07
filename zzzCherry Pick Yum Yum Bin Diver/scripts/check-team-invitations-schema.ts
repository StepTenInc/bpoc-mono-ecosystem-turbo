/**
 * Check team_invitations table schema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking team_invitations table schema...\n');

  // Try to get the schema by querying with all possible fields
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Column names:', Object.keys(data[0]));
      console.log('\nSample row:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No rows found in table. Let me try to insert a test row to see which fields are valid...');

      // Try a minimal insert to see what fields are required
      const testData = {
        invitee_email: 'test@example.com',
        agency_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        inviter_id: '00000000-0000-0000-0000-000000000000',
        role: 'recruiter',
        status: 'pending',
      };

      const { error: insertError } = await supabase
        .from('team_invitations')
        .insert(testData);

      if (insertError) {
        console.log('\n❌ Insert error (this helps us understand required fields):');
        console.log(JSON.stringify(insertError, null, 2));
      }
    }
  }
}

checkSchema().catch(console.error);
