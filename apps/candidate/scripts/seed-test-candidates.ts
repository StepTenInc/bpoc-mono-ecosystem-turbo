/**
 * Seed 10 Realistic Filipino Test Candidates
 * Run with: npx ts-node scripts/seed-test-candidates.ts
 * 
 * These candidates are for full pipeline testing:
 * Registration → Profile → Resume → Jobs → Application → Interview → Offer → Onboarding → Placement
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CandidateSeed {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  age: number;
  birthday: string;
  gender: string;
  location_city: string;
  location_province: string;
  location_region: string;
  target_role: string;
  headline: string;
  bio: string;
  experience_years: number;
  skills: string[];
  typing_wpm: number;
  shift_preference: string;
  work_setup: string;
  salary_min: number;
  salary_max: number;
  photo_path: string;
  work_experiences: Array<{
    company_name: string;
    job_title: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
  }>;
  educations: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
  }>;
}

const testCandidates: CandidateSeed[] = [
  {
    email: 'maria.santos@testmail.ph',
    first_name: 'Maria',
    last_name: 'Santos Cruz',
    phone: '+63 917 123 4501',
    age: 24,
    birthday: '2001-03-15',
    gender: 'female',
    location_city: 'Makati City',
    location_province: 'Metro Manila',
    location_region: 'NCR',
    target_role: 'Customer Service Representative',
    headline: 'CSR Specialist | 2 Years BPO Experience | Telco Account',
    bio: 'Passionate customer service professional with 2 years experience at Globe Telecom. I enjoy helping customers resolve their concerns and turning negative experiences into positive ones. Looking for growth opportunities in the BPO industry.',
    experience_years: 2,
    skills: ['Customer Service', 'Zendesk', 'Phone Support', 'English Communication', 'Problem Solving', 'CRM'],
    typing_wpm: 55,
    shift_preference: 'night',
    work_setup: 'onsite',
    salary_min: 25000,
    salary_max: 30000,
    photo_path: 'candidates/maria-santos.png',
    work_experiences: [
      {
        company_name: 'Globe Telecom BPO',
        job_title: 'Customer Service Representative',
        location: 'Makati City',
        start_date: '2024-02-01',
        end_date: null,
        is_current: true,
        description: 'Handle inbound calls for Globe subscribers. Resolve billing inquiries, service issues, and product upgrades. Consistently meet 95%+ CSAT scores.'
      }
    ],
    educations: [
      {
        institution: 'De La Salle University',
        degree: 'Bachelor of Science',
        field_of_study: 'Psychology',
        start_date: '2019-06-01',
        end_date: '2023-05-30'
      }
    ]
  },
  {
    email: 'juan.reyes@testmail.ph',
    first_name: 'Juan Carlos',
    last_name: 'Reyes',
    phone: '+63 918 234 5602',
    age: 28,
    birthday: '1997-07-22',
    gender: 'male',
    location_city: 'BGC, Taguig',
    location_province: 'Metro Manila',
    location_region: 'NCR',
    target_role: 'Technical Support Specialist',
    headline: 'IT Support Engineer | CompTIA A+ Certified | 3 Years Experience',
    bio: 'Tech-savvy IT professional with strong troubleshooting skills. I have worked on enterprise helpdesk supporting 500+ users. Passionate about solving technical problems and helping people work more efficiently with technology.',
    experience_years: 3,
    skills: ['Technical Support', 'Windows', 'Office 365', 'Active Directory', 'VPN', 'Networking', 'Troubleshooting', 'JIRA'],
    typing_wpm: 62,
    shift_preference: 'flexible',
    work_setup: 'hybrid',
    salary_min: 40000,
    salary_max: 50000,
    photo_path: 'candidates/juan-reyes.png',
    work_experiences: [
      {
        company_name: 'Accenture Philippines',
        job_title: 'IT Support Analyst',
        location: 'BGC, Taguig',
        start_date: '2022-01-15',
        end_date: null,
        is_current: true,
        description: 'Provide Level 1-2 technical support for enterprise clients. Handle 40+ tickets daily. Specialize in O365, VPN, and network troubleshooting.'
      },
      {
        company_name: 'Tech Solutions Inc.',
        job_title: 'Junior IT Support',
        location: 'Ortigas, Pasig',
        start_date: '2020-06-01',
        end_date: '2021-12-30',
        is_current: false,
        description: 'Desktop support for local clients. Hardware and software troubleshooting. User account management.'
      }
    ],
    educations: [
      {
        institution: 'University of Santo Tomas',
        degree: 'Bachelor of Science',
        field_of_study: 'Information Technology',
        start_date: '2015-06-01',
        end_date: '2019-05-30'
      }
    ]
  },
  {
    email: 'ana.garcia@testmail.ph',
    first_name: 'Ana Marie',
    last_name: 'Garcia',
    phone: '+63 919 345 6703',
    age: 26,
    birthday: '1999-11-08',
    gender: 'female',
    location_city: 'Cebu City',
    location_province: 'Cebu',
    location_region: 'Central Visayas',
    target_role: 'Virtual Assistant',
    headline: 'Virtual Assistant | Admin Expert | US Client Experience',
    bio: 'Detail-oriented VA with experience supporting US-based entrepreneurs. Expert in calendar management, email handling, and administrative tasks. Known for proactive communication and reliability.',
    experience_years: 1.5,
    skills: ['Virtual Assistance', 'Google Workspace', 'Calendar Management', 'Email Management', 'Travel Booking', 'Canva', 'Data Entry'],
    typing_wpm: 58,
    shift_preference: 'day',
    work_setup: 'remote',
    salary_min: 28000,
    salary_max: 35000,
    photo_path: 'candidates/ana-garcia.png',
    work_experiences: [
      {
        company_name: 'Freelance VA',
        job_title: 'Virtual Assistant',
        location: 'Remote - Cebu',
        start_date: '2024-06-01',
        end_date: null,
        is_current: true,
        description: 'Support 3 US-based clients with admin tasks. Manage calendars, book travel, handle email correspondence. 5-star rating on Upwork.'
      }
    ],
    educations: [
      {
        institution: 'University of San Carlos',
        degree: 'Bachelor of Science',
        field_of_study: 'Business Administration',
        start_date: '2017-06-01',
        end_date: '2021-05-30'
      }
    ]
  },
  {
    email: 'miguel.delacruz@testmail.ph',
    first_name: 'Miguel Angelo',
    last_name: 'Dela Cruz',
    phone: '+63 920 456 7804',
    age: 30,
    birthday: '1995-04-12',
    gender: 'male',
    location_city: 'Quezon City',
    location_province: 'Metro Manila',
    location_region: 'NCR',
    target_role: 'Full Stack Developer',
    headline: 'Senior Full Stack Developer | React + Node.js | 4 Years Experience',
    bio: 'Passionate developer who loves building scalable web applications. Strong background in React, Node.js, and cloud technologies. Open source contributor and tech community volunteer.',
    experience_years: 4,
    skills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'PostgreSQL', 'MongoDB', 'AWS', 'Next.js', 'Git', 'Docker'],
    typing_wpm: 70,
    shift_preference: 'day',
    work_setup: 'hybrid',
    salary_min: 80000,
    salary_max: 100000,
    photo_path: 'candidates/miguel-delacruz.png',
    work_experiences: [
      {
        company_name: 'Pointwest Technologies',
        job_title: 'Senior Software Engineer',
        location: 'Quezon City',
        start_date: '2023-01-01',
        end_date: null,
        is_current: true,
        description: 'Lead development of fintech applications using React and Node.js. Mentor junior developers. Implement CI/CD pipelines.'
      },
      {
        company_name: 'Exist Software Labs',
        job_title: 'Software Developer',
        location: 'Makati City',
        start_date: '2020-06-01',
        end_date: '2022-12-15',
        is_current: false,
        description: 'Developed web applications for US clients. Full stack development with React, Express, and PostgreSQL.'
      }
    ],
    educations: [
      {
        institution: 'Ateneo de Manila University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2013-06-01',
        end_date: '2017-05-30'
      }
    ]
  },
  {
    email: 'patricia.bautista@testmail.ph',
    first_name: 'Patricia Nicole',
    last_name: 'Bautista',
    phone: '+63 921 567 8905',
    age: 25,
    birthday: '2000-09-25',
    gender: 'female',
    location_city: 'Clark',
    location_province: 'Pampanga',
    location_region: 'Central Luzon',
    target_role: 'Accounts Payable Specialist',
    headline: 'CPA | Accounts Payable Specialist | 2 Years Big 4 Experience',
    bio: 'Licensed CPA with strong attention to detail and analytical skills. Experienced in accounts payable, reconciliation, and financial reporting. Looking for opportunities in BPO accounting.',
    experience_years: 2,
    skills: ['Accounts Payable', 'QuickBooks', 'SAP', 'Excel Advanced', 'Invoice Processing', 'Reconciliation', 'Financial Reporting'],
    typing_wpm: 52,
    shift_preference: 'day',
    work_setup: 'onsite',
    salary_min: 35000,
    salary_max: 45000,
    photo_path: 'candidates/patricia-bautista.png',
    work_experiences: [
      {
        company_name: 'KPMG Philippines',
        job_title: 'Audit Associate',
        location: 'Makati City',
        start_date: '2023-01-10',
        end_date: null,
        is_current: true,
        description: 'Perform audit procedures for manufacturing and retail clients. AP and AR reconciliation. Financial statement analysis.'
      }
    ],
    educations: [
      {
        institution: 'Holy Angel University',
        degree: 'Bachelor of Science',
        field_of_study: 'Accountancy',
        start_date: '2018-06-01',
        end_date: '2022-05-30'
      }
    ]
  },
  {
    email: 'rafael.villanueva@testmail.ph',
    first_name: 'Rafael Jose',
    last_name: 'Villanueva',
    phone: '+63 922 678 9006',
    age: 27,
    birthday: '1998-01-30',
    gender: 'male',
    location_city: 'Makati City',
    location_province: 'Metro Manila',
    location_region: 'NCR',
    target_role: 'Quality Assurance Analyst',
    headline: 'QA Team Lead | 3 Years Call Center | Quality Expert',
    bio: 'Results-driven QA professional with experience leading quality teams in BPO. Strong analytical skills and passion for coaching. Committed to driving performance improvements.',
    experience_years: 4,
    skills: ['Quality Assurance', 'Call Monitoring', 'Coaching', 'Excel Advanced', 'CSAT Analysis', 'Reporting', 'Team Leadership'],
    typing_wpm: 60,
    shift_preference: 'night',
    work_setup: 'hybrid',
    salary_min: 40000,
    salary_max: 48000,
    photo_path: 'candidates/rafael-villanueva.png',
    work_experiences: [
      {
        company_name: 'TaskUs',
        job_title: 'Quality Assurance Team Lead',
        location: 'BGC, Taguig',
        start_date: '2024-01-01',
        end_date: null,
        is_current: true,
        description: 'Lead QA team of 8 analysts. Monitor calls and provide feedback. Create weekly quality reports. Train new hires on quality standards.'
      },
      {
        company_name: 'TaskUs',
        job_title: 'Customer Service Representative',
        location: 'BGC, Taguig',
        start_date: '2021-03-01',
        end_date: '2023-12-31',
        is_current: false,
        description: 'Handled customer inquiries for US tech company. Top performer with 98% CSAT. Promoted to QA Team Lead.'
      }
    ],
    educations: [
      {
        institution: 'University of the Philippines Diliman',
        degree: 'Bachelor of Arts',
        field_of_study: 'Communication Arts',
        start_date: '2014-06-01',
        end_date: '2018-05-30'
      }
    ]
  },
  {
    email: 'camille.mendoza@testmail.ph',
    first_name: 'Camille Joy',
    last_name: 'Mendoza',
    phone: '+63 923 789 0107',
    age: 23,
    birthday: '2002-05-18',
    gender: 'female',
    location_city: 'Pasig City',
    location_province: 'Metro Manila',
    location_region: 'NCR',
    target_role: 'Social Media Manager',
    headline: 'Social Media Manager | Content Creator | 2 Years Digital Marketing',
    bio: 'Creative social media enthusiast with a knack for engaging content. Experience managing multiple brand accounts. Skilled in content strategy, community management, and analytics.',
    experience_years: 2,
    skills: ['Social Media Management', 'Content Creation', 'Facebook', 'Instagram', 'LinkedIn', 'Hootsuite', 'Canva', 'Analytics', 'Copywriting'],
    typing_wpm: 65,
    shift_preference: 'flexible',
    work_setup: 'remote',
    salary_min: 32000,
    salary_max: 40000,
    photo_path: 'candidates/camille-mendoza.png',
    work_experiences: [
      {
        company_name: 'Digital Spark Agency',
        job_title: 'Social Media Specialist',
        location: 'Ortigas, Pasig',
        start_date: '2024-01-15',
        end_date: null,
        is_current: true,
        description: 'Manage social media for 5 brand clients. Create content calendars, design graphics, write copy. Grew client following by 150% average.'
      }
    ],
    educations: [
      {
        institution: 'Assumption College',
        degree: 'Bachelor of Science',
        field_of_study: 'Marketing',
        start_date: '2019-06-01',
        end_date: '2023-05-30'
      }
    ]
  },
  {
    email: 'dennis.torres@testmail.ph',
    first_name: 'Dennis Ryan',
    last_name: 'Torres',
    phone: '+63 924 890 1208',
    age: 29,
    birthday: '1996-12-03',
    gender: 'male',
    location_city: 'Davao City',
    location_province: 'Davao del Sur',
    location_region: 'Davao Region',
    target_role: 'Medical Virtual Assistant',
    headline: 'Medical VA | HIPAA Certified | Nursing Background',
    bio: 'Healthcare professional transitioning to VA work. Strong medical terminology knowledge and patient care background. HIPAA certified with experience in US healthcare systems.',
    experience_years: 2,
    skills: ['Medical Terminology', 'HIPAA', 'EMR Systems', 'Insurance Verification', 'Patient Scheduling', 'Healthcare Administration', 'Epic', 'Athenahealth'],
    typing_wpm: 55,
    shift_preference: 'day',
    work_setup: 'remote',
    salary_min: 40000,
    salary_max: 50000,
    photo_path: 'candidates/dennis-torres.png',
    work_experiences: [
      {
        company_name: 'MedServe BPO',
        job_title: 'Medical Billing Specialist',
        location: 'Davao City',
        start_date: '2023-06-01',
        end_date: null,
        is_current: true,
        description: 'Handle medical billing for US healthcare providers. Insurance verification, claims processing, patient scheduling. 99% accuracy rate.'
      },
      {
        company_name: 'Davao Regional Medical Center',
        job_title: 'Staff Nurse',
        location: 'Davao City',
        start_date: '2021-01-01',
        end_date: '2023-05-30',
        is_current: false,
        description: 'Provided patient care in medical-surgical unit. Administered medications, coordinated with physicians, maintained patient records.'
      }
    ],
    educations: [
      {
        institution: 'Ateneo de Davao University',
        degree: 'Bachelor of Science',
        field_of_study: 'Nursing',
        start_date: '2014-06-01',
        end_date: '2018-05-30'
      }
    ]
  },
  {
    email: 'jasmine.fernandez@testmail.ph',
    first_name: 'Jasmine Lyka',
    last_name: 'Fernandez',
    phone: '+63 925 901 2309',
    age: 22,
    birthday: '2003-08-21',
    gender: 'female',
    location_city: 'Iloilo City',
    location_province: 'Iloilo',
    location_region: 'Western Visayas',
    target_role: 'Chat Support Agent',
    headline: 'Chat Support | E-commerce Specialist | Fast Typer 65 WPM',
    bio: 'Fresh but experienced chat support agent with 1 year at Shopee. Love helping customers through chat and email. Fast typer and quick problem solver.',
    experience_years: 1,
    skills: ['Chat Support', 'Email Support', 'Zendesk', 'Freshdesk', 'E-commerce', 'Customer Service', 'Typing 65 WPM'],
    typing_wpm: 65,
    shift_preference: 'flexible',
    work_setup: 'onsite',
    salary_min: 22000,
    salary_max: 26000,
    photo_path: 'candidates/jasmine-fernandez.png',
    work_experiences: [
      {
        company_name: 'Shopee Philippines',
        job_title: 'Customer Service Agent',
        location: 'Iloilo City',
        start_date: '2025-01-10',
        end_date: null,
        is_current: true,
        description: 'Handle chat and email inquiries from Shopee customers. Process refunds, track orders, resolve disputes. 4.8 star rating.'
      }
    ],
    educations: [
      {
        institution: 'University of the Philippines Visayas',
        degree: 'Bachelor of Arts',
        field_of_study: 'Communication',
        start_date: '2020-06-01',
        end_date: '2024-05-30'
      }
    ]
  },
  {
    email: 'carlo.aquino@testmail.ph',
    first_name: 'Carlo James',
    last_name: 'Aquino',
    phone: '+63 926 012 3410',
    age: 31,
    birthday: '1994-10-07',
    gender: 'male',
    location_city: 'Baguio City',
    location_province: 'Benguet',
    location_region: 'Cordillera Administrative Region',
    target_role: 'Real Estate Virtual Assistant',
    headline: 'Real Estate VA | Australian Market Expert | 2 Years Upwork',
    bio: 'Experienced real estate VA specializing in Australian property market. Familiar with PropertyMe, Domain, and Australian real estate practices. Looking for stable long-term position.',
    experience_years: 2,
    skills: ['Real Estate', 'PropertyMe', 'CRM', 'Lead Management', 'Transaction Coordination', 'Australian Real Estate', 'Domain.com.au', 'Zillow'],
    typing_wpm: 58,
    shift_preference: 'flexible',
    work_setup: 'remote',
    salary_min: 35000,
    salary_max: 45000,
    photo_path: 'candidates/carlo-aquino.png',
    work_experiences: [
      {
        company_name: 'Upwork Freelancer',
        job_title: 'Real Estate Virtual Assistant',
        location: 'Remote - Baguio',
        start_date: '2024-02-01',
        end_date: null,
        is_current: true,
        description: 'Support Australian real estate agents with lead management, property listings, and transaction coordination. Top Rated Plus on Upwork.'
      },
      {
        company_name: 'Baguio Realty',
        job_title: 'Property Assistant',
        location: 'Baguio City',
        start_date: '2022-06-01',
        end_date: '2024-01-30',
        is_current: false,
        description: 'Assisted with property listings, client inquiries, and documentation for local real estate office.'
      }
    ],
    educations: [
      {
        institution: 'Baguio Colleges Foundation',
        degree: 'Bachelor of Science',
        field_of_study: 'Real Estate Management',
        start_date: '2012-06-01',
        end_date: '2016-05-30'
      }
    ]
  }
];

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function uploadAvatar(candidateId: string, photoPath: string): Promise<string | null> {
  // Skip avatar upload for now - just return null
  // Avatars can be uploaded separately via UI or a separate script
  console.log(`  [Skip avatar - will upload later]`);
  return null;
  
  // Original code:
  // const fullPath = path.join(__dirname, '../../test-data', photoPath);
  // if (!fs.existsSync(fullPath)) {
  //   console.warn(`⚠️ Photo not found: ${fullPath}`);
  //   return null;
  // }
  // const fileBuffer = fs.readFileSync(fullPath);
  // etc.
}

async function seedCandidates() {
  console.log('🌱 Seeding 10 Filipino Test Candidates...\n');

  for (const candidateSeed of testCandidates) {
    const candidateId = uuidv4();
    const authUserId = uuidv4(); // Simulated auth user id

    try {
      // 1. Upload avatar
      console.log(`📸 Uploading avatar for ${candidateSeed.first_name}...`);
      const avatarUrl = await uploadAvatar(candidateId, candidateSeed.photo_path);

      // 2. Create candidate (full_name is generated column)
      const { error: candidateError } = await supabase
        .from('candidates')
        .insert({
          id: candidateId,
          email: candidateSeed.email,
          first_name: candidateSeed.first_name,
          last_name: candidateSeed.last_name,
          avatar_url: avatarUrl,
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (candidateError) {
        console.error(`❌ Error creating candidate ${candidateSeed.first_name}:`, candidateError.message);
        continue;
      }

      // 3. Create candidate profile
      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .insert({
          id: uuidv4(),
          candidate_id: candidateId,
          phone: candidateSeed.phone,
          headline: candidateSeed.headline,
          bio: candidateSeed.bio,
          birthday: candidateSeed.birthday,
          gender: candidateSeed.gender,
          location_city: candidateSeed.location_city,
          location_province: candidateSeed.location_province,
          location_region: candidateSeed.location_region,
          location_country: 'Philippines',
          preferred_shift: candidateSeed.shift_preference,
          preferred_work_setup: candidateSeed.work_setup,
          expected_salary_min: candidateSeed.salary_min,
          expected_salary_max: candidateSeed.salary_max,
          work_status: 'actively_looking',
          profile_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn(`⚠️ Error creating profile for ${candidateSeed.first_name}:`, profileError.message);
      }

      // 4. Create skills
      for (const skill of candidateSeed.skills) {
        await supabase
          .from('candidate_skills')
          .insert({
            id: uuidv4(),
            candidate_id: candidateId,
            name: skill,
            category: 'general',
            proficiency_level: 'intermediate',
            is_primary: candidateSeed.skills.indexOf(skill) < 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      // 5. Create work experiences
      for (const exp of candidateSeed.work_experiences) {
        await supabase
          .from('candidate_work_experiences')
          .insert({
            id: uuidv4(),
            candidate_id: candidateId,
            company_name: exp.company_name,
            job_title: exp.job_title,
            location: exp.location,
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            description: exp.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      // 6. Create educations
      for (const edu of candidateSeed.educations) {
        await supabase
          .from('candidate_educations')
          .insert({
            id: uuidv4(),
            candidate_id: candidateId,
            institution: edu.institution,
            degree: edu.degree,
            field_of_study: edu.field_of_study,
            start_date: edu.start_date,
            end_date: edu.end_date,
            is_current: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      console.log(`✅ ${candidateSeed.first_name} ${candidateSeed.last_name}`);
      console.log(`   📧 ${candidateSeed.email}`);
      console.log(`   💼 ${candidateSeed.target_role}`);
      console.log(`   💰 ₱${candidateSeed.salary_min.toLocaleString()}-${candidateSeed.salary_max.toLocaleString()}`);
      console.log(`   📍 ${candidateSeed.location_city}\n`);

    } catch (err) {
      console.error(`❌ Unexpected error for ${candidateSeed.first_name}:`, err);
    }
  }

  console.log('✅ Done! 10 Filipino test candidates seeded.\n');
  console.log('Candidates ready for testing at each pipeline stage:');
  console.log('  Registration ✓ → Profile ✓ → Resume → Jobs → Application → Interview → Offer → Onboarding → Placement');
}

// Run if executed directly
seedCandidates().catch(console.error);
