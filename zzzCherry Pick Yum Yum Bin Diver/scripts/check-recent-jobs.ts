/**
 * Check the 6 most recent jobs with company and recruiter info
 * Run: npx tsx scripts/check-recent-jobs.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkRecentJobs() {
  try {
    console.log('🔍 Fetching 6 most recent jobs...\n');

    // Get jobs with company and recruiter info
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        created_at,
        agency_client_id,
        posted_by,
        agency_clients (
          id,
          primary_contact_name,
          primary_contact_email,
          companies (
            id,
            name,
            industry
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    // Fetch recruiter info separately for each job
    const jobsWithRecruiters = await Promise.all(
      (jobs || []).map(async (job: any) => {
        if (job.posted_by) {
          const { data: recruiter } = await supabase
            .from('agency_recruiters')
            .select('id, first_name, last_name, email, user_id')
            .eq('id', job.posted_by)
            .single();

          if (recruiter?.user_id) {
            const { data: user } = await supabase.auth.admin.getUserById(recruiter.user_id);
            return {
              ...job,
              recruiter: {
                ...recruiter,
                user_email: user?.user?.email
              }
            };
          }
          return { ...job, recruiter };
        }
        return { ...job, recruiter: null };
      })
    );

    if (!jobsWithRecruiters || jobsWithRecruiters.length === 0) {
      console.log('📭 No jobs found');
      return;
    }

    console.log(`📋 Found ${jobsWithRecruiters.length} jobs:\n`);
    console.log('='.repeat(80));

    jobsWithRecruiters.forEach((job: any, index: number) => {
      const company = job.agency_clients?.companies;
      const recruiter = job.recruiter;
      const client = job.agency_clients;

      console.log(`\n${index + 1}. Job: ${job.title}`);
      console.log(`   ID: ${job.id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Posted: ${new Date(job.created_at).toLocaleString()}`);
      
      if (company) {
        console.log(`   � company: ${company.name || 'N/A'}`);
        console.log(`   Industry: ${company.industry || 'N/A'}`);
      } else {
        console.log(`   � company: Not found (client_id: ${job.agency_client_id})`);
      }

      if (client) {
        console.log(`   Contact: ${client.primary_contact_name || 'N/A'} (${client.primary_contact_email || 'N/A'})`);
      }

      if (recruiter) {
        const recruiterName = `${recruiter.first_name || ''} ${recruiter.last_name || ''}`.trim() || 'Unknown';
        const recruiterEmail = recruiter.user_email || recruiter.email || 'N/A';
        console.log(`   👤 Posted by: ${recruiterName}`);
        console.log(`   Recruiter Email: ${recruiterEmail}`);
        console.log(`   Recruiter ID: ${recruiter.id}`);
      } else {
        console.log(`   👤 Posted by: API/System (no recruiter assigned)`);
      }

      console.log('-'.repeat(80));
    });

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRecentJobs();

