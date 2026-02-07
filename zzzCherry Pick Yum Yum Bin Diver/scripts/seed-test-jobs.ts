import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedJobs() {
  console.log('🌱 Seeding test jobs...\n');

  // First, get an agency_client to link jobs to
  const { data: agencyClients } = await supabase
    .from('agency_clients')
    .select('id, agencies(name)')
    .limit(1);

  if (!agencyClients || agencyClients.length === 0) {
    console.error('❌ No agency clients found. Please create an agency first.');
    process.exit(1);
  }

  const agencyClientId = agencyClients[0].id;
  const agencyName = (agencyClients[0].agencies as any)?.name || 'BPOC Agency';

  console.log(`✅ Using agency client: ${agencyClientId}`);
  console.log(`📍 Agency: ${agencyName}\n`);

  const jobs = [
    {
      agency_client_id: agencyClientId,
      title: 'Customer Service Representative - Night Shift',
      slug: 'customer-service-representative-night-shift',
      description: `We are seeking enthusiastic Customer Service Representatives to join our growing team! This is a fantastic opportunity to work with a leading BPO company serving international clients.

As a Customer Service Representative, you will be the first point of contact for our customers, providing exceptional support via phone, email, and chat. You'll handle inquiries, resolve issues, and ensure customer satisfaction while maintaining our high service standards.

This is a full-time, night shift position with comprehensive training provided. We're looking for individuals who are passionate about helping others and thrive in a fast-paced environment.`,
      requirements: [
        'At least 18 years old',
        'High school diploma or equivalent (College level preferred)',
        'Excellent English communication skills (verbal and written)',
        'Basic computer skills and typing proficiency (35 WPM minimum)',
        'Strong problem-solving abilities',
        'Ability to work night shifts (10 PM - 7 AM)',
        'Willing to work onsite in Ortigas, Pasig City',
        'No BPO experience required - we provide full training!'
      ],
      responsibilities: [
        'Handle inbound customer calls and emails professionally',
        'Resolve customer inquiries and complaints efficiently',
        'Process orders, returns, and refunds accurately',
        'Maintain detailed records of customer interactions',
        'Meet daily performance metrics and quality standards',
        'Collaborate with team members to improve customer experience',
        'Participate in ongoing training and development programs',
        'Escalate complex issues to supervisors when necessary'
      ],
      benefits: [
        'HMO coverage with 1 dependent',
        'Night shift differential',
        'Performance bonuses',
        'Paid training program',
        '13th month pay',
        'Government-mandated benefits (SSS, PhilHealth, Pag-IBIG)',
        'Free meals and snacks',
        'Career growth opportunities',
        'Employee referral program',
        'Fun team building activities'
      ],
      work_type: 'full_time',
      work_arrangement: 'onsite',
      shift: 'night',
      experience_level: 'entry_level',
      salary_min: 18000,
      salary_max: 25000,
      currency: 'PHP',
      status: 'active',
      priority: 'high',
      source: 'manual',
      views: Math.floor(Math.random() * 200) + 50,
      applicants_count: Math.floor(Math.random() * 15) + 3
    },
    {
      agency_client_id: agencyClientId,
      title: 'Technical Support Specialist - Work From Home',
      slug: 'technical-support-specialist-work-from-home',
      description: `Join our remote technical support team and help customers solve their technology challenges from the comfort of your home!

We're looking for tech-savvy individuals to provide world-class technical support to our US-based clients. You'll troubleshoot software issues, guide customers through setup processes, and ensure smooth operation of various tech products and services.

This is a 100% remote position with flexible shift options. Perfect for those who love technology and want to help others while enjoying the benefits of working from home.`,
      requirements: [
        'College graduate (IT, Computer Science, or related field preferred)',
        '1-2 years BPO or technical support experience',
        'Strong technical aptitude and troubleshooting skills',
        'Excellent English communication skills',
        'Stable internet connection (25 Mbps minimum)',
        'Quiet home workspace with reliable power backup',
        'Own laptop/desktop (i5 processor, 8GB RAM minimum)',
        'Webcam and noise-canceling headset',
        'Willing to work US hours (night shift Philippines time)'
      ],
      responsibilities: [
        'Provide technical support via phone, email, and chat',
        'Diagnose and resolve software and hardware issues',
        'Guide customers through product setup and configuration',
        'Document technical issues and solutions in ticketing system',
        'Achieve resolution and customer satisfaction targets',
        'Stay updated on product knowledge and technical procedures',
        'Create knowledge base articles for common issues',
        'Participate in team meetings and training sessions'
      ],
      benefits: [
        'Work from home setup',
        'HMO coverage with 2 dependents',
        'Internet and electricity allowance',
        'Performance incentives',
        'Equipment provided (headset, webcam)',
        '13th month pay',
        'Government benefits (SSS, PhilHealth, Pag-IBIG)',
        'Paid time off and sick leave',
        'Training and certification programs',
        'Career advancement opportunities'
      ],
      work_type: 'full_time',
      work_arrangement: 'remote',
      shift: 'night',
      experience_level: 'mid_level',
      salary_min: 30000,
      salary_max: 45000,
      currency: 'PHP',
      status: 'active',
      priority: 'urgent',
      source: 'manual',
      views: Math.floor(Math.random() * 300) + 100,
      applicants_count: Math.floor(Math.random() * 25) + 8
    },
    {
      agency_client_id: agencyClientId,
      title: 'Sales Representative - Day Shift Hybrid',
      slug: 'sales-representative-day-shift-hybrid',
      description: `Kickstart your sales career with a leading BPO company! We're hiring motivated Sales Representatives to join our dynamic team in a hybrid work setup.

As a Sales Representative, you'll connect with potential customers, present our products and services, and close deals. This role offers unlimited earning potential through competitive commissions and bonuses on top of your base salary.

Enjoy the flexibility of hybrid work - 3 days onsite, 2 days work from home. Perfect work-life balance while building your sales career!`,
      requirements: [
        'At least 1 year sales or customer service experience',
        'College level or graduate (any course)',
        'Persuasive communication and negotiation skills',
        'Goal-oriented with strong drive to succeed',
        'Comfortable with target-driven environment',
        'Proficient in MS Office and CRM systems',
        'Willing to work day shift (9 AM - 6 PM)',
        'Hybrid setup: 3 days onsite (BGC, Taguig), 2 days WFH',
        'Sales certification or training is a plus'
      ],
      responsibilities: [
        'Generate leads through outbound calls and emails',
        'Present products and services to potential customers',
        'Understand customer needs and recommend solutions',
        'Close sales and achieve monthly quota targets',
        'Maintain accurate records in CRM system',
        'Follow up with prospects and existing customers',
        'Process orders and coordinate with fulfillment team',
        'Provide post-sale support and upselling opportunities',
        'Attend sales training and strategy sessions'
      ],
      benefits: [
        'Competitive base salary + uncapped commissions',
        'Monthly performance bonuses',
        'HMO coverage (medical and dental)',
        'Hybrid work setup (3 onsite, 2 WFH)',
        'Sales incentive trips and awards',
        '13th month pay + Christmas bonus',
        'Government-mandated benefits',
        'Transportation allowance',
        'Comprehensive sales training',
        'Fast-track promotion opportunities',
        'Team building events and recognition programs'
      ],
      work_type: 'full_time',
      work_arrangement: 'hybrid',
      shift: 'day',
      experience_level: 'mid_level',
      salary_min: 25000,
      salary_max: 35000,
      currency: 'PHP',
      status: 'active',
      priority: 'medium',
      source: 'manual',
      views: Math.floor(Math.random() * 150) + 30,
      applicants_count: Math.floor(Math.random() * 20) + 5
    }
  ];

  // Insert jobs
  for (const job of jobs) {
    console.log(`📝 Creating: ${job.title}...`);

    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select('id, title, slug');

    if (error) {
      console.error(`❌ Error creating "${job.title}":`, error.message);
      continue;
    }

    const jobId = data[0].id;
    console.log(`✅ Created job: ${data[0].title}`);
    console.log(`   ID: ${jobId}`);
    console.log(`   URL: https://www.bpoc.io/jobs/${jobId}`);

    // Add skills for each job
    const skills = job.title.toLowerCase().includes('customer service')
      ? ['Customer Service', 'Communication', 'Problem Solving', 'MS Office', 'Email Support', 'Phone Support']
      : job.title.toLowerCase().includes('technical')
      ? ['Technical Support', 'Troubleshooting', 'Windows OS', 'Software Support', 'Remote Support', 'Ticketing Systems']
      : ['Sales', 'Negotiation', 'CRM', 'Lead Generation', 'Closing', 'Upselling'];

    for (const skillName of skills) {
      await supabase.from('job_skills').insert([{
        job_id: jobId,
        name: skillName,
        is_required: true
      }]);
    }

    console.log(`   Skills: ${skills.join(', ')}`);
    console.log('');
  }

  console.log('✨ Job seeding complete!\n');
  console.log('🌐 Visit: http://localhost:3001/jobs to see your jobs\n');
}

seedJobs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
