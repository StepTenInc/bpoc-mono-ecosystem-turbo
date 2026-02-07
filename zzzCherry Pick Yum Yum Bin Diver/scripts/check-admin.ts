/**
 * Check if admin exists in bpoc_users
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
  console.log('🔍 Checking for admin in bpoc_users table...\n');

  const email = 'platform-admin@bpoc.io';

  // Check bpoc_users table
  const { data: bpocUser, error: bpocError } = await supabase
    .from('bpoc_users')
    .select('*')
    .eq('email', email)
    .single();

  if (bpocError) {
    console.log('❌ Not found in bpoc_users:', bpocError.message);
  } else {
    console.log('✅ Found in bpoc_users:');
    console.table({
      id: bpocUser.id,
      email: bpocUser.email,
      firstName: bpocUser.first_name,
      lastName: bpocUser.last_name,
      role: bpocUser.role,
      isActive: bpocUser.is_active,
    });
    console.log('\n✅ Admin login should work with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: SuperAdmin123!`);
    console.log(`   URL: /admin/login`);
  }

  // Check admins table too
  const { data: adminUser, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();

  if (!adminError && adminUser) {
    console.log('\n✅ Also found in admins table (legacy):');
    console.table({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      isSuperAdmin: adminUser.is_super_admin,
    });
  }
}

checkAdmin().catch(console.error);
