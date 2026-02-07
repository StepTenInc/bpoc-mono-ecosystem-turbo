-- ============================================
-- COMPREHENSIVE TEST DATA FOR MARCO DELGADO
-- Candidate ID: 092fd214-03c5-435d-9156-4a533d950cc3
-- ============================================

-- 1. CANDIDATE PROFILE
INSERT INTO candidate_profiles (
  candidate_id,
  bio,
  position,
  birthday,
  gender,
  location,
  location_city,
  location_province,
  location_country,
  location_region,
  work_status,
  current_employer,
  current_position,
  current_salary,
  expected_salary_min,
  expected_salary_max,
  notice_period_days,
  preferred_shift,
  preferred_work_setup,
  profile_completed,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  '092fd214-03c5-435d-9156-4a533d950cc3',
  'Experienced Virtual Assistant and Customer Support Specialist with 5+ years of expertise in remote work, client communication, and administrative tasks. Passionate about delivering exceptional service and streamlining business operations.',
  'Virtual Assistant / Customer Support Specialist',
  '1995-03-15',
  'male',
  'Makati City, Metro Manila, Philippines',
  'Makati City',
  'Metro Manila',
  'Philippines',
  'NCR',
  'freelancer',
  'Freelance',
  'Virtual Assistant',
  35000.00,
  40000.00,
  60000.00,
  7,
  'day',
  'remote',
  true,
  95,
  NOW(),
  NOW()
)
ON CONFLICT (candidate_id) DO UPDATE SET
  bio = EXCLUDED.bio,
  position = EXCLUDED.position,
  birthday = EXCLUDED.birthday,
  gender = EXCLUDED.gender,
  location = EXCLUDED.location,
  location_city = EXCLUDED.location_city,
  location_province = EXCLUDED.location_province,
  location_country = EXCLUDED.location_country,
  location_region = EXCLUDED.location_region,
  work_status = EXCLUDED.work_status,
  current_employer = EXCLUDED.current_employer,
  current_position = EXCLUDED.current_position,
  current_salary = EXCLUDED.current_salary,
  expected_salary_min = EXCLUDED.expected_salary_min,
  expected_salary_max = EXCLUDED.expected_salary_max,
  notice_period_days = EXCLUDED.notice_period_days,
  preferred_shift = EXCLUDED.preferred_shift,
  preferred_work_setup = EXCLUDED.preferred_work_setup,
  profile_completed = EXCLUDED.profile_completed,
  profile_completion_percentage = EXCLUDED.profile_completion_percentage,
  updated_at = NOW();

-- 2. CANDIDATE SKILLS
DELETE FROM candidate_skills WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_skills (candidate_id, name, category, proficiency_level, years_experience, is_primary, verified) VALUES
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Customer Support', 'Customer Service', 'expert', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Email Management', 'Administrative', 'expert', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Calendar Management', 'Administrative', 'expert', 4.5, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Data Entry', 'Administrative', 'advanced', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Microsoft Excel', 'Software', 'advanced', 4.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Google Workspace', 'Software', 'expert', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Zendesk', 'Software', 'advanced', 3.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Slack', 'Software', 'expert', 4.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Asana', 'Software', 'advanced', 3.5, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Trello', 'Software', 'advanced', 3.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Canva', 'Design', 'intermediate', 2.0, false, false),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Social Media Management', 'Marketing', 'advanced', 3.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Content Writing', 'Writing', 'advanced', 4.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Research', 'Research', 'expert', 5.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'English Communication', 'Language', 'expert', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Tagalog', 'Language', 'expert', 5.0, false, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Time Management', 'Soft Skills', 'expert', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Problem Solving', 'Soft Skills', 'advanced', 5.0, true, true),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Multitasking', 'Soft Skills', 'expert', 5.0, true, true);

-- 3. CANDIDATE EDUCATION
DELETE FROM candidate_educations WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_educations (candidate_id, institution, degree, field_of_study, start_date, end_date, is_current, grade, description) VALUES
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'University of the Philippines', 'Bachelor of Science', 'Business Administration', '2013-06-01', '2017-03-31', false, 'Magna Cum Laude', 'Graduated with honors. Focused on business management, marketing, and organizational behavior. Active member of the Business Administration Society.'),
  ('092fd214-03c5-435d-9156-4a533d950cc3', 'Online Course - Coursera', 'Certificate', 'Customer Service Excellence', '2020-01-15', '2020-03-15', false, '98%', 'Completed comprehensive course on customer service best practices, conflict resolution, and communication strategies.');

-- 4. CANDIDATE WORK EXPERIENCE
DELETE FROM candidate_work_experiences WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_work_experiences (
  candidate_id,
  company_name,
  job_title,
  location,
  start_date,
  end_date,
  is_current,
  description,
  responsibilities,
  achievements
) VALUES
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'Global Tech Solutions Inc.',
    'Senior Virtual Assistant',
    'Remote',
    '2021-06-01',
    NULL,
    true,
    'Providing comprehensive virtual assistance to multiple international clients, managing day-to-day operations, and ensuring seamless communication.',
    '["Managed email inboxes for 5+ executives", "Coordinated schedules and meetings across multiple time zones", "Handled customer inquiries via email and chat", "Created and maintained databases and spreadsheets", "Prepared reports and presentations", "Managed social media accounts", "Processed invoices and expense reports", "Conducted research and compiled data"]'::jsonb,
    '["Reduced email response time by 40%", "Improved customer satisfaction scores from 4.2 to 4.8/5", "Streamlined workflow processes saving 10+ hours per week", "Successfully managed 3 simultaneous client accounts"]'::jsonb
  ),
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'Customer First Support Services',
    'Customer Support Specialist',
    'Makati, Philippines',
    '2019-03-01',
    '2021-05-31',
    false,
    'Delivered exceptional customer support for e-commerce clients, handling inquiries, resolving issues, and maintaining high customer satisfaction.',
    '["Responded to 100+ customer inquiries daily via email and chat", "Resolved customer complaints and issues", "Processed returns and refunds", "Updated customer accounts and order information", "Escalated complex issues to appropriate departments", "Maintained knowledge base articles"]'::jsonb,
    '["Achieved 95% customer satisfaction rating", "Maintained <2 hour average response time", "Reduced ticket resolution time by 25%", "Received Employee of the Month award 3 times"]'::jsonb
  ),
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'Startup Ventures PH',
    'Administrative Assistant',
    'Manila, Philippines',
    '2017-06-01',
    '2019-02-28',
    false,
    'Provided administrative support to startup team, managing office operations and supporting various departments.',
    '["Managed office supplies and inventory", "Handled phone calls and correspondence", "Assisted with event planning and coordination", "Maintained filing systems", "Prepared documents and reports", "Coordinated travel arrangements"]'::jsonb,
    '["Improved office efficiency by implementing new filing system", "Successfully coordinated 10+ company events", "Reduced office supply costs by 15%"]'::jsonb
  );

-- 5. CANDIDATE TYPING ASSESSMENT
DELETE FROM candidate_typing_assessments WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_typing_assessments (
  candidate_id,
  session_status,
  difficulty_level,
  elapsed_time,
  score,
  wpm,
  overall_accuracy,
  longest_streak,
  correct_words,
  wrong_words,
  created_at
) VALUES
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'completed',
    'rockstar',
    60,
    720,
    72,
    98.50,
    45,
    72,
    1,
    NOW() - INTERVAL '2 days'
  ),
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'completed',
    'rockstar',
    60,
    750,
    75,
    99.20,
    50,
    75,
    1,
    NOW() - INTERVAL '1 day'
  ),
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'completed',
    'rockstar',
    60,
    780,
    78,
    98.80,
    55,
    78,
    1,
    NOW()
  );

-- 6. CANDIDATE DISC ASSESSMENT
DELETE FROM candidate_disc_assessments WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_disc_assessments (
  candidate_id,
  session_status,
  started_at,
  finished_at,
  duration_seconds,
  total_questions,
  d_score,
  i_score,
  s_score,
  c_score,
  primary_type,
  secondary_type,
  confidence_score,
  consistency_index,
  cultural_alignment,
  authenticity_score,
  created_at
) VALUES
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'completed',
    NOW() - INTERVAL '5 days' - INTERVAL '15 minutes',
    NOW() - INTERVAL '5 days',
    900,
    30,
    15,
    85,
    70,
    30,
    'I',
    'S',
    92,
    88.50,
    95,
    90,
    NOW() - INTERVAL '5 days'
  );

-- 7. CANDIDATE RESUME
DELETE FROM candidate_resumes WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_resumes (
  candidate_id,
  slug,
  title,
  original_filename,
  file_url,
  is_primary,
  is_public,
  resume_data,
  extracted_data,
  created_at,
  updated_at
) VALUES
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    'marco-delgado-resume-2025',
    'Marco Delgado - Virtual Assistant Resume',
    'Marco_Delgado_Resume_2025.pdf',
    'https://ayrdnsiaylomcemfdisr.supabase.co/storage/v1/object/public/resumes/marco-delgado-resume-2025.pdf',
    true,
    true,
    '{
      "personal_info": {
        "name": "Marco Delgado",
        "email": "marco.delgado.test@gmail.com",
        "phone": "+63 917 555 1234",
        "location": "Makati City, Metro Manila, Philippines"
      },
      "summary": "Experienced Virtual Assistant with 5+ years of expertise in customer support, administrative tasks, and remote work management.",
      "experience": [
        {
          "title": "Senior Virtual Assistant",
          "company": "Global Tech Solutions Inc.",
          "period": "June 2021 - Present",
          "description": "Providing comprehensive virtual assistance to multiple international clients"
        }
      ],
      "education": [
        {
          "degree": "Bachelor of Science in Business Administration",
          "institution": "University of the Philippines",
          "period": "2013 - 2017",
          "honors": "Magna Cum Laude"
        }
      ],
      "skills": ["Customer Support", "Email Management", "Calendar Management", "Microsoft Excel", "Google Workspace"]
    }'::jsonb,
    '{
      "extraction_method": "ai_parser",
      "confidence_score": 0.95,
      "sections_found": ["personal_info", "summary", "experience", "education", "skills"],
      "extracted_at": "2025-01-15T10:30:00Z"
    }'::jsonb,
    NOW() - INTERVAL '30 days',
    NOW()
  );

-- 8. CANDIDATE AI ANALYSIS
DELETE FROM candidate_ai_analysis WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3';

INSERT INTO candidate_ai_analysis (
  candidate_id,
  resume_id,
  session_id,
  overall_score,
  ats_compatibility_score,
  content_quality_score,
  professional_presentation_score,
  skills_alignment_score,
  key_strengths,
  strengths_analysis,
  improvements,
  recommendations,
  section_analysis,
  improved_summary,
  created_at,
  updated_at
) VALUES
  (
    '092fd214-03c5-435d-9156-4a533d950cc3',
    (SELECT id FROM candidate_resumes WHERE candidate_id = '092fd214-03c5-435d-9156-4a533d950cc3' AND is_primary = true LIMIT 1),
    'marco-analysis-' || EXTRACT(EPOCH FROM NOW())::text,
    87,
    85,
    90,
    88,
    86,
    '["Strong customer service background", "Excellent communication skills", "Proven track record in remote work", "Diverse skill set across multiple platforms", "High typing speed and accuracy"]'::jsonb,
    '{
      "experience": "5+ years of relevant experience with clear progression",
      "skills": "Well-rounded skill set covering customer service, administration, and software tools",
      "education": "Strong educational background with honors",
      "achievements": "Quantifiable achievements demonstrate impact"
    }'::jsonb,
    '["Add more specific metrics to achievements", "Include relevant certifications", "Expand on technical skills", "Add portfolio or work samples link"]'::jsonb,
    '["Consider adding industry-specific certifications", "Highlight any specialized training", "Include testimonials or references", "Add LinkedIn profile link"]'::jsonb,
    '{
      "summary": {"score": 9, "feedback": "Clear and compelling summary"},
      "experience": {"score": 8, "feedback": "Well-structured with good detail"},
      "education": {"score": 9, "feedback": "Strong educational credentials"},
      "skills": {"score": 8, "feedback": "Comprehensive skill listing"}
    }'::jsonb,
    'Experienced Virtual Assistant and Customer Support Specialist with 5+ years of proven expertise in remote work environments. Demonstrated excellence in managing multiple client accounts, achieving 95% customer satisfaction ratings, and streamlining operations to save 10+ hours weekly. Strong background in administrative tasks, customer service, and modern productivity tools. Graduated Magna Cum Laude with a Bachelor of Science in Business Administration from the University of the Philippines.',
    NOW(),
    NOW()
  );

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Profile: Complete with bio, location, work preferences
-- ✅ Skills: 20 skills across multiple categories
-- ✅ Education: 2 entries (degree + certificate)
-- ✅ Work Experience: 3 positions (1 current, 2 past)
-- ✅ Typing Assessment: 3 tests (latest: 78 WPM, 98.8% accuracy)
-- ✅ DISC Assessment: IS type (Influence-Steadiness)
-- ✅ Resume: Primary resume with full data
-- ✅ AI Analysis: Complete analysis with 87 overall score
-- ============================================

