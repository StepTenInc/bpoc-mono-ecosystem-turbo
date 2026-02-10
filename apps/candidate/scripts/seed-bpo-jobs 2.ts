/**
 * Seed 10 BPO Jobs for Testing Job Matching
 * Run with: npx ts-node scripts/seed-bpo-jobs.ts
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface JobSeed {
  title: string;
  description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  work_arrangement: 'remote' | 'onsite' | 'hybrid';
  shift: 'day' | 'night' | 'both' | 'flexible';
  location_city: string;
  location_region: string;
  location_country: string;
  skills: string[];
}

const bpoJobs: JobSeed[] = [
  {
    title: 'Customer Service Representative - Voice',
    description: 'Handle inbound customer inquiries via phone for a major US telecommunications company. Resolve billing issues, process orders, and provide excellent customer support.',
    requirements: '• At least 6 months call center experience\n• Excellent English communication skills\n• Amenable to shifting schedule\n• High school diploma',
    salary_min: 22000,
    salary_max: 28000,
    currency: 'PHP',
    work_arrangement: 'onsite',
    shift: 'night',
    location_city: 'Makati City',
    location_region: 'Metro Manila',
    location_country: 'Philippines',
    skills: ['Customer Service', 'English Communication', 'Phone Support', 'Problem Solving', 'Zendesk']
  },
  {
    title: 'Technical Support Specialist - IT Helpdesk',
    description: 'Provide Level 1-2 technical support for software and hardware issues. Troubleshoot VPN, email, and desktop problems for enterprise clients.',
    requirements: '• 1+ year IT support experience\n• Knowledge of Windows, Office 365, networking\n• CompTIA A+ preferred\n• Strong analytical skills',
    salary_min: 30000,
    salary_max: 45000,
    currency: 'PHP',
    work_arrangement: 'hybrid',
    shift: 'night',
    location_city: 'BGC, Taguig',
    location_region: 'Metro Manila',
    location_country: 'Philippines',
    skills: ['Technical Support', 'Windows', 'Office 365', 'Troubleshooting', 'Active Directory', 'VPN', 'Ticketing Systems']
  },
  {
    title: 'Virtual Assistant - General Admin',
    description: 'Support busy entrepreneurs with calendar management, email handling, travel booking, and general administrative tasks. Work directly with US-based clients.',
    requirements: '• Excellent written and verbal English\n• Proficient in Google Workspace\n• Strong organizational skills\n• Reliable internet connection for WFH',
    salary_min: 25000,
    salary_max: 35000,
    currency: 'PHP',
    work_arrangement: 'remote',
    shift: 'day',
    location_city: 'Remote',
    location_region: 'Any',
    location_country: 'Philippines',
    skills: ['Virtual Assistance', 'Calendar Management', 'Email Management', 'Google Workspace', 'Microsoft Office', 'Travel Booking', 'Data Entry']
  },
  {
    title: 'Medical Virtual Assistant',
    description: 'Support US healthcare providers with patient scheduling, insurance verification, medical records management, and HIPAA-compliant documentation.',
    requirements: '• 1+ year healthcare/medical experience\n• Knowledge of medical terminology\n• HIPAA training preferred\n• Attention to detail',
    salary_min: 35000,
    salary_max: 50000,
    currency: 'PHP',
    work_arrangement: 'remote',
    shift: 'day',
    location_city: 'Remote',
    location_region: 'Any',
    location_country: 'Philippines',
    skills: ['Medical Terminology', 'HIPAA', 'Patient Scheduling', 'Insurance Verification', 'EMR Systems', 'Healthcare Administration']
  },
  {
    title: 'Real Estate Virtual Assistant',
    description: 'Assist real estate agents with lead management, property listings, CRM updates, and transaction coordination. Experience with Zillow, MLS, or similar platforms a plus.',
    requirements: '• Experience in real estate or related field\n• Excellent communication skills\n• Knowledge of real estate CRM systems\n• Detail-oriented',
    salary_min: 28000,
    salary_max: 40000,
    currency: 'PHP',
    work_arrangement: 'remote',
    shift: 'flexible',
    location_city: 'Remote',
    location_region: 'Any',
    location_country: 'Philippines',
    skills: ['Real Estate', 'CRM', 'Lead Management', 'Property Listings', 'Transaction Coordination', 'Customer Service']
  },
  {
    title: 'Full Stack Web Developer',
    description: 'Build and maintain web applications using React, Node.js, and PostgreSQL. Work in an agile team on client projects for international companies.',
    requirements: '• 2+ years full stack development\n• Proficient in React, Node.js, TypeScript\n• Experience with databases (PostgreSQL, MongoDB)\n• Git version control',
    salary_min: 60000,
    salary_max: 100000,
    currency: 'PHP',
    work_arrangement: 'hybrid',
    shift: 'day',
    location_city: 'Makati City',
    location_region: 'Metro Manila',
    location_country: 'Philippines',
    skills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'PostgreSQL', 'MongoDB', 'Git', 'REST API', 'Next.js']
  },
  {
    title: 'Chat Support Agent - E-commerce',
    description: 'Handle customer inquiries via live chat and email for online retail clients. Process returns, track orders, and resolve customer issues quickly.',
    requirements: '• Excellent written English\n• Fast typing speed (40+ WPM)\n• Customer service experience preferred\n• Comfortable with multi-tasking',
    salary_min: 20000,
    salary_max: 26000,
    currency: 'PHP',
    work_arrangement: 'onsite',
    shift: 'both',
    location_city: 'Cebu City',
    location_region: 'Central Visayas',
    location_country: 'Philippines',
    skills: ['Chat Support', 'Email Support', 'E-commerce', 'Customer Service', 'Typing', 'Zendesk', 'Freshdesk']
  },
  {
    title: 'Quality Assurance Analyst - Contact Center',
    description: 'Monitor and evaluate customer service calls for quality. Provide coaching and feedback to agents. Create QA reports and identify training needs.',
    requirements: '• 2+ years call center experience\n• Previous QA or team lead experience\n• Strong analytical skills\n• Excellent attention to detail',
    salary_min: 35000,
    salary_max: 48000,
    currency: 'PHP',
    work_arrangement: 'hybrid',
    shift: 'night',
    location_city: 'Quezon City',
    location_region: 'Metro Manila',
    location_country: 'Philippines',
    skills: ['Quality Assurance', 'Call Monitoring', 'Coaching', 'Reporting', 'Excel', 'Contact Center Operations']
  },
  {
    title: 'Social Media Manager',
    description: 'Manage social media accounts for multiple brand clients. Create content, schedule posts, engage with followers, and analyze performance metrics.',
    requirements: '• Experience managing business social media\n• Knowledge of Meta Business Suite, Hootsuite\n• Creative writing skills\n• Understanding of analytics',
    salary_min: 30000,
    salary_max: 45000,
    currency: 'PHP',
    work_arrangement: 'remote',
    shift: 'flexible',
    location_city: 'Remote',
    location_region: 'Any',
    location_country: 'Philippines',
    skills: ['Social Media Management', 'Content Creation', 'Facebook', 'Instagram', 'LinkedIn', 'Hootsuite', 'Canva', 'Analytics']
  },
  {
    title: 'Accounts Payable Specialist',
    description: 'Process vendor invoices, manage payment schedules, and reconcile accounts for international clients. Experience with accounting software required.',
    requirements: '• Accounting or Finance degree\n• 1+ year AP experience\n• Proficient in Excel and accounting software\n• Strong attention to detail',
    salary_min: 32000,
    salary_max: 42000,
    currency: 'PHP',
    work_arrangement: 'onsite',
    shift: 'day',
    location_city: 'Clark, Pampanga',
    location_region: 'Central Luzon',
    location_country: 'Philippines',
    skills: ['Accounts Payable', 'QuickBooks', 'Excel', 'Invoice Processing', 'Reconciliation', 'Accounting', 'SAP']
  }
];

// Create a dummy recruiter ID (in production this would be a real recruiter)
const DUMMY_RECRUITER_ID = '00000000-0000-0000-0000-000000000001';
const DUMMY_CLIENT_ID = '00000000-0000-0000-0000-000000000002';

async function seedJobs() {
  console.log('🌱 Seeding 10 BPO jobs...\n');

  for (const jobSeed of bpoJobs) {
    const jobId = uuidv4();

    // Insert job
    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        title: jobSeed.title,
        description: jobSeed.description,
        requirements: jobSeed.requirements,
        salary_min: jobSeed.salary_min,
        salary_max: jobSeed.salary_max,
        currency: jobSeed.currency,
        work_arrangement: jobSeed.work_arrangement,
        shift: jobSeed.shift,
        location_city: jobSeed.location_city,
        location_region: jobSeed.location_region,
        location_country: jobSeed.location_country,
        status: 'active',
        recruiter_id: DUMMY_RECRUITER_ID,
        client_id: DUMMY_CLIENT_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (jobError) {
      console.error(`❌ Error inserting job "${jobSeed.title}":`, jobError.message);
      continue;
    }

    // Insert job skills
    const skillsToInsert = jobSeed.skills.map(skill => ({
      job_id: jobId,
      skill_name: skill,
    }));

    const { error: skillsError } = await supabase
      .from('job_skills')
      .insert(skillsToInsert);

    if (skillsError) {
      console.warn(`⚠️ Error inserting skills for "${jobSeed.title}":`, skillsError.message);
    }

    console.log(`✅ ${jobSeed.title}`);
    console.log(`   💰 ${jobSeed.salary_min.toLocaleString()}-${jobSeed.salary_max.toLocaleString()} ${jobSeed.currency}`);
    console.log(`   📍 ${jobSeed.location_city} | ${jobSeed.work_arrangement} | ${jobSeed.shift} shift`);
    console.log(`   🛠️  ${jobSeed.skills.slice(0, 4).join(', ')}...\n`);
  }

  console.log('✅ Done! 10 BPO jobs seeded.\n');
  console.log('Run job matching with: POST /api/candidate/matches/generate');
}

// Run if executed directly
seedJobs().catch(console.error);
