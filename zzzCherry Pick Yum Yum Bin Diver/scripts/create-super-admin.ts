/**
 * Script to create super admin user
 * Run with: npm run create-super-admin
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin() {
  console.log('🚀 Creating super admin user...\n');

  const email = 'platform-admin@bpoc.io';
  const password = 'SuperAdmin123!'; // Change this after first login

  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists, checking for admin record...');

        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users.find(u => u.email === email);

        if (!existingUser) {
          console.error('❌ Could not find existing user');
          process.exit(1);
        }

        const userId = existingUser.id;
        console.log(`✓ Found existing user: ${userId}`);

        // Check if admin record exists
        const { data: existingAdmin } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingAdmin) {
          console.log('✓ Admin record already exists');
          console.log('\n🎉 Super admin is already set up!');
          console.log('\nLogin credentials:');
          console.log(`  Email: ${email}`);
          console.log(`  URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin/login`);
          process.exit(0);
        }

        // Create admin record for existing user
        console.log('Step 2: Creating admin record for existing user...');
        const { error: insertError } = await supabase
          .from('admins')
          .insert({
            user_id: userId,
            email,
            first_name: 'Platform',
            last_name: 'Administrator',
            role: 'super_user',
            department: 'Management',
            is_super_admin: true,
            is_active: true,
          });

        if (insertError) throw insertError;

        console.log('✓ Admin record created');
        console.log('\n🎉 Super admin setup complete!');
        console.log('\nLogin credentials:');
        console.log(`  Email: ${email}`);
        console.log(`  URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin/login`);
        process.exit(0);
      } else {
        throw authError;
      }
    }

    const userId = authData.user.id;
    console.log(`✓ Auth user created: ${userId}`);

    // Step 2: Create admin record
    console.log('\nStep 2: Creating admin record...');
    const { data: adminData, error: insertError } = await supabase
      .from('admins')
      .insert({
        user_id: userId,
        email,
        first_name: 'Platform',
        last_name: 'Administrator',
        role: 'super_user',
        department: 'Management',
        is_super_admin: true,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    console.log('✓ Admin record created');

    console.log('\n🎉 Super admin created successfully!');
    console.log('\nLogin credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin/login`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
