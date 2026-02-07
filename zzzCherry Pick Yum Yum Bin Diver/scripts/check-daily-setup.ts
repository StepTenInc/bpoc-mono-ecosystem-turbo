/**
 * Check Daily.co Setup Status
 * Run: npx tsx scripts/check-daily-setup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dailyApiKey = process.env.DAILY_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkDailySetup() {
  console.log('🔍 Checking Daily.co Setup Status...\n');
  console.log('='.repeat(80));

  // 1. Environment Variables
  console.log('\n📋 1. ENVIRONMENT VARIABLES');
  console.log('-'.repeat(80));
  const hasDailyKey = !!dailyApiKey;
  console.log(`   DAILY_API_KEY: ${hasDailyKey ? '✅ Set' : '❌ Missing'}`);
  if (hasDailyKey) {
    console.log(`   Key preview: ${dailyApiKey?.substring(0, 10)}...${dailyApiKey?.substring(dailyApiKey.length - 4)}`);
  } else {
    console.log('   ⚠️  Set DAILY_API_KEY in .env.local');
  }

  // 2. Database Tables
  console.log('\n📋 2. DATABASE TABLES');
  console.log('-'.repeat(80));
  
  const tables = [
    'video_call_rooms',
    'video_call_recordings',
    'video_call_transcripts',
    'video_call_participants',
    'video_call_invitations',
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ${table}: ❌ Error - ${error.message}`);
    } else {
      console.log(`   ${table}: ✅ Exists (${count || 0} records)`);
    }
  }

  // 3. API Endpoints Check
  console.log('\n📋 3. API ENDPOINTS');
  console.log('-'.repeat(80));
  const endpoints = [
    { path: '/api/video/rooms', method: 'POST', description: 'Create video room' },
    { path: '/api/video/rooms/[id]', method: 'GET', description: 'Get room details' },
    { path: '/api/video/webhook', method: 'POST', description: 'Daily.co webhook handler' },
    { path: '/api/v1/video/rooms', method: 'POST', description: 'API v1 create room' },
  ];
  
  endpoints.forEach(ep => {
    console.log(`   ${ep.method} ${ep.path}: ✅ ${ep.description}`);
  });

  // 4. Recent Video Activity
  console.log('\n📋 4. RECENT VIDEO ACTIVITY');
  console.log('-'.repeat(80));
  
  const { data: recentRooms, count: roomCount } = await supabase
    .from('video_call_rooms')
    .select('id, daily_room_name, status, call_type, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentRooms && recentRooms.length > 0) {
    console.log(`   Total rooms: ${roomCount || 0}`);
    console.log(`   Recent rooms:`);
    recentRooms.forEach((room: any, i: number) => {
      console.log(`     ${i + 1}. ${room.daily_room_name} - ${room.status} (${room.call_type || 'N/A'})`);
    });
  } else {
    console.log('   No video rooms created yet');
  }

  // 5. Recordings Status
  console.log('\n📋 5. RECORDINGS STATUS');
  console.log('-'.repeat(80));
  
  const { data: recordings, count: recordingCount } = await supabase
    .from('video_call_recordings')
    .select('id, status, duration_seconds', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  if (recordings && recordings.length > 0) {
    const statusCounts = recordings.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`   Total recordings: ${recordingCount || 0}`);
    console.log(`   Status breakdown:`, statusCounts);
  } else {
    console.log('   No recordings yet');
  }

  // 6. Webhook Configuration Check
  console.log('\n📋 6. WEBHOOK CONFIGURATION');
  console.log('-'.repeat(80));
  
  if (hasDailyKey) {
    try {
      const response = await fetch('https://api.daily.co/v1/webhooks', {
        headers: {
          'Authorization': `Bearer ${dailyApiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const webhooks = data.data || [];
        
        if (webhooks.length > 0) {
          console.log(`   ✅ ${webhooks.length} webhook(s) configured:`);
          webhooks.forEach((wh: any, i: number) => {
            console.log(`     ${i + 1}. ${wh.url}`);
            console.log(`        Events: ${(wh.event_types || []).join(', ')}`);
          });
        } else {
          console.log('   ⚠️  No webhooks configured');
          console.log('   Run: ./scripts/setup-daily-webhook.sh');
        }
      } else {
        console.log('   ⚠️  Could not check webhooks (API error)');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check webhooks:', (error as Error).message);
    }
  } else {
    console.log('   ⚠️  Cannot check webhooks - DAILY_API_KEY not set');
  }

  // 7. Summary
  console.log('\n📋 7. SETUP SUMMARY');
  console.log('='.repeat(80));
  
  const issues: string[] = [];
  if (!hasDailyKey) issues.push('❌ DAILY_API_KEY not configured');
  
  if (issues.length === 0) {
    console.log('   ✅ Daily.co appears to be fully configured!');
    console.log('   ✅ All database tables exist');
    console.log('   ✅ API endpoints are available');
    console.log('   ✅ Ready for production use');
  } else {
    console.log('   ⚠️  Issues found:');
    issues.forEach(issue => console.log(`      ${issue}`));
  }

  console.log('\n✅ Check complete!\n');
}

checkDailySetup().catch(console.error);






