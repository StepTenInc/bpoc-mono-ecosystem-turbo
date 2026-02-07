/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Build matched Railway users for migration
 * =======================================
 *
 * Reads:
 *   - public/Users/user-data.json (Railway export)
 *
 * Queries:
 *   - Supabase Auth users (service role) to match by email AND require id match
 *
 * Writes:
 *   - public/Users/matched-users-for-migration.json
 *
 * Required env:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   node public/Users/build-matched-users-for-migration.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load env from repo root (.env.local preferred, fallback to .env)
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = fs.existsSync(envLocalPath) ? envLocalPath : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS_DATA_PATH = path.join(__dirname, 'user-data.json');
const OUTPUT_PATH = path.join(__dirname, 'matched-users-for-migration.json');

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function listAllAuthUsers() {
  const all = [];
  const perPage = 1000;
  let page = 1;

  // supabase-js admin list is paginated
  // https://supabase.com/docs/reference/javascript/auth-admin-listusers
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth.admin.listUsers(page=${page}): ${error.message}`);

    const users = data?.users || [];
    all.push(...users);

    if (users.length < perPage) break;
    page += 1;
  }

  return all;
}

async function main() {
  console.log('\n🔎 Building matched-users-for-migration.json');
  console.log('   Rule: match by email AND require auth.id === railway.id\n');

  if (!fs.existsSync(USERS_DATA_PATH)) {
    console.error('❌ Missing Railway export:', USERS_DATA_PATH);
    process.exit(1);
  }

  const railwayExport = JSON.parse(fs.readFileSync(USERS_DATA_PATH, 'utf-8'));
  const railwayUsers = railwayExport?.users || [];

  console.log(`   Railway users in export: ${railwayUsers.length}`);
  console.log('   Fetching Supabase Auth users...');

  const authUsers = await listAllAuthUsers();
  console.log(`   Supabase auth users fetched: ${authUsers.length}\n`);

  // Build email -> auth user map (first seen wins). Track duplicates for debugging.
  const authByEmail = new Map();
  const duplicateAuthEmails = new Map(); // email -> count

  for (const u of authUsers) {
    const email = normalizeEmail(u.email);
    if (!email) continue;

    if (authByEmail.has(email)) {
      duplicateAuthEmails.set(email, (duplicateAuthEmails.get(email) || 1) + 1);
      continue;
    }
    authByEmail.set(email, u);
  }

  const matchedUsers = [];
  const missing_in_auth = [];
  const id_mismatch = [];
  const email_mismatch = []; // reserved for future, kept for parity with guide

  for (const railwayUser of railwayUsers) {
    const profile = railwayUser?.personal_profile;
    const railwayId = profile?.id;
    const railwayEmail = normalizeEmail(profile?.email);

    if (!railwayId || !railwayEmail) {
      missing_in_auth.push({
        railway_id: railwayId || null,
        railway_email: profile?.email || null,
        reason: 'missing id or email in railway export'
      });
      continue;
    }

    const authUser = authByEmail.get(railwayEmail);
    if (!authUser) {
      missing_in_auth.push({
        railway_id: railwayId,
        railway_email: profile.email,
        reason: 'no auth user with matching email'
      });
      continue;
    }

    if (authUser.id !== railwayId) {
      id_mismatch.push({
        railway_id: railwayId,
        railway_email: profile.email,
        auth_id: authUser.id,
        auth_email: authUser.email
      });
      continue;
    }

    matchedUsers.push(railwayUser);
  }

  const output = {
    generated_at: new Date().toISOString(),
    match_rule: 'email_and_id',
    counts: {
      railway_total: railwayUsers.length,
      auth_total: authUsers.length,
      matched: matchedUsers.length,
      missing_in_auth: missing_in_auth.length,
      id_mismatch: id_mismatch.length,
      email_mismatch: email_mismatch.length,
      duplicate_auth_emails: Array.from(duplicateAuthEmails.keys()).length
    },
    users: matchedUsers,
    missing_in_auth,
    id_mismatch,
    email_mismatch,
    duplicate_auth_emails: Array.from(duplicateAuthEmails.entries()).map(([email, extraCount]) => ({
      email,
      occurrences: extraCount + 1
    }))
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log('✅ Wrote:', OUTPUT_PATH);
  console.log('   Matched users:', matchedUsers.length);
  console.log('   Missing in auth:', missing_in_auth.length);
  console.log('   ID mismatches:', id_mismatch.length);
  if (output.counts.duplicate_auth_emails > 0) {
    console.log('   ⚠️ Duplicate auth emails:', output.counts.duplicate_auth_emails);
  }
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ Failed to build match file:', err.message);
  process.exit(1);
});

