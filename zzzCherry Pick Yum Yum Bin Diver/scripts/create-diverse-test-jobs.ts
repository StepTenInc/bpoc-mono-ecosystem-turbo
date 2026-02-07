/**
 * Create 10 diverse test jobs to verify match scoring
 * Run: npx tsx scripts/create-diverse-test-jobs.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const diverseJobs = [
  {
    title: 'Junior Customer Service Representative',
    description: 'Entry-level position for fresh graduates. Handle customer inquiries via phone and email. No prior experience required, we provide full training.',
    company: 'StartUp BPO Inc',
    agency: 'Direct Hire',
    work_type: 'full_time',
    work_arrangement: 'remote',
    shift: 'night',
    salary_min: 18000,
    salary_max: 22000,
    currency: 'PHP',
    skills: ['Customer Service', 'Communication', 'Email Support'],
    status: 'published',
  },
  {
    title: 'Senior React Developer',
    description: 'Looking for 5+ years experienced React developer to lead our frontend team. Must have deep knowledge of React 18, TypeScript, Next.js, and modern state management.',
    company: 'Tech Innovators Corp',
    agency: 'TechRecruit Philippines',
    work_type: 'full_time',
    work_arrangement: 'hybrid',
    shift: 'day',
    salary_min: 80000,
    salary_max: 120000,
    currency: 'PHP',
    skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'GraphQL', 'Jest'],
    status: 'published',
  },
  {
    title: 'Sales Development Representative',
    description: 'Outbound sales role focused on lead generation. Cold calling, email campaigns, and qualifying leads for our B2B SaaS product.',
    company: 'SalesForce Solutions',
    agency: 'Direct Hire',
    work_type: 'full_time',
    work_arrangement: 'onsite',
    shift: 'day',
    salary_min: 25000,
    salary_max: 35000,
    currency: 'PHP',
    skills: ['Sales', 'Cold Calling', 'Lead Generation', 'CRM', 'B2B Sales'],
    status: 'published',
  },
  {
    title: 'Technical Support Engineer - Python',
    description: 'Provide technical support for our Python-based data platform. Debug customer issues, write documentation, and occasionally contribute code fixes.',
    company: 'DataTech Philippines',
    agency: 'Direct Hire',
    work_type: 'full_time',
    work_arrangement: 'remote',
    shift: 'night',
    salary_min: 45000,
    salary_max: 65000,
    currency: 'PHP',
    skills: ['Python', 'SQL', 'Linux', 'Technical Support', 'Debugging'],
    status: 'published',
  },
  {
    title: 'Operations Manager - Call Center',
    description: 'Manage a team of 50+ agents. 10+ years experience required. Responsible for KPIs, training, scheduling, and quality assurance.',
    company: 'MegaBPO Corporation',
    agency: 'Executive Search Partners',
    work_type: 'full_time',
    work_arrangement: 'onsite',
    shift: 'both',
    salary_min: 90000,
    salary_max: 130000,
    currency: 'PHP',
    skills: ['Team Management', 'Operations', 'KPI Management', 'Training', 'Quality Assurance'],
    status: 'published',
  },
  {
    title: 'Content Moderator (Part-Time)',
    description: 'Review and moderate user-generated content on social media platforms. Part-time, flexible hours. Work from home.',
    company: 'SocialGuard BPO',
    agency: 'Direct Hire',
    work_type: 'part_time',
    work_arrangement: 'remote',
    shift: 'both', // Changed from 'flexible' to valid enum
    salary_min: 15000,
    salary_max: 20000,
    currency: 'PHP',
    skills: ['Content Moderation', 'Social Media', 'Attention to Detail'],
    status: 'published',
  },
  {
    title: 'Mid-Level QA Automation Engineer',
    description: 'Build and maintain automated test suites for web and mobile applications. 3-5 years experience with Selenium, Cypress, or similar frameworks.',
    company: 'QualityFirst Technologies',
    agency: 'Direct Hire',
    work_type: 'full_time',
    work_arrangement: 'hybrid',
    shift: 'day',
    salary_min: 55000,
    salary_max: 75000,
    currency: 'PHP',
    skills: ['QA Automation', 'Selenium', 'Cypress', 'JavaScript', 'API Testing', 'CI/CD'],
    status: 'published',
  },
  {
    title: 'Healthcare Virtual Assistant',
    description: 'Support US-based doctors with scheduling, patient communication, and medical records management. Healthcare background preferred but not required.',
    company: 'MedSupport Virtual',
    agency: 'Direct Hire',
    work_type: 'full_time',
    work_arrangement: 'remote',
    shift: 'night',
    salary_min: 28000,
    salary_max: 38000,
    currency: 'PHP',
    skills: ['Virtual Assistant', 'Scheduling', 'Healthcare', 'Communication', 'EMR Systems'],
    status: 'published',
  },
  {
    title: 'Freelance Graphic Designer',
    description: 'Project-based graphic design work for marketing materials, social media, and websites. Must have portfolio demonstrating Adobe Creative Suite mastery.',
    company: 'Creative Collective PH',
    agency: 'Freelance Network',
    work_type: 'freelance',
    work_arrangement: 'remote',
    shift: 'day', // Changed from 'flexible' to valid enum
    salary_min: 30000,
    salary_max: 50000,
    currency: 'PHP',
    skills: ['Graphic Design', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Branding'],
    status: 'published',
  },
  {
    title: 'Accounting Assistant (Entry Level)',
    description: 'Process invoices, maintain financial records, and assist with month-end closing. Fresh accounting graduates encouraged to apply.',
    company: 'FinancePro Outsourcing',
    agency: 'Direct Hire',
    work_type: 'full_time',
    work_arrangement: 'onsite',
    shift: 'day',
    salary_min: 20000,
    salary_max: 26000,
    currency: 'PHP',
    skills: ['Accounting', 'QuickBooks', 'Excel', 'Data Entry', 'Bookkeeping'],
    status: 'published',
  },
];

async function createDiverseJobs() {
  console.log('🎯 Creating 10 diverse test jobs...\n');

  // Get first available agency_client_id
  const { data: clients } = await supabaseAdmin
    .from('agency_clients')
    .select('id')
    .limit(1)
    .single();

  if (!clients) {
    console.error('❌ No agency_clients found. Cannot create jobs.');
    return;
  }

  const clientId = clients.id;
  console.log(`📋 Using agency_client_id: ${clientId}\n`);

  for (const job of diverseJobs) {
    try {
      // Create job
      const { data: createdJob, error} = await supabaseAdmin
        .from('jobs')
        .insert({
          title: job.title,
          description: job.description,
          work_type: job.work_type,
          work_arrangement: job.work_arrangement,
          shift: job.shift,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          currency: job.currency,
          status: 'active',
          agency_client_id: clientId,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create "${job.title}":`, error.message);
        continue;
      }

      // Insert job skills
      if (job.skills && job.skills.length > 0 && createdJob) {
        const skillInserts = job.skills.map(skillName => ({
          job_id: createdJob.id,
          skill_name: skillName,
        }));

        const { error: skillsError } = await supabaseAdmin
          .from('job_skills')
          .insert(skillInserts);

        if (skillsError) {
          console.error(`   ⚠️  Failed to add skills: ${skillsError.message}`);
        }
      }

      console.log(`✅ Created: ${job.title} (${job.salary_min}-${job.salary_max} PHP, ${job.work_arrangement}, ${job.skills.length} skills)`);

    } catch (err) {
      console.error(`❌ Error creating "${job.title}":`, err);
    }
  }

  console.log('\n✨ Done! Now the matching scores should be VERY different!');
  console.log('\n📊 Score Expectations:');
  console.log('- Customer Service jobs → High match if you have CS skills');
  console.log('- React Developer → Only high if you know React/TypeScript');
  console.log('- Sales roles → Only high if you have sales experience');
  console.log('- Senior roles (80k+) → Only high if you have 5+ years experience');
  console.log('- Remote jobs → Higher match if you prefer remote');
}

createDiverseJobs().catch(console.error);
