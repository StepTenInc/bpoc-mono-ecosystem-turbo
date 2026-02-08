# BPOC Database Schema

**Auto-generated documentation for AI agents**
**Last updated: 2025-02-10**

This document provides a comprehensive overview of all database tables in the BPOC (Best Place for Offshore Candidates) system. Use this as your reference when working with the database.

---

## Table of Contents

1. [User & Authentication](#user--authentication)
2. [Candidates](#candidates)
3. [Jobs & Applications](#jobs--applications)
4. [Agencies & Clients](#agencies--clients)
5. [Recruiters](#recruiters)
6. [Offers & Contracts](#offers--contracts)
7. [Interviews & Video Calls](#interviews--video-calls)
8. [Onboarding](#onboarding)
9. [Notifications](#notifications)
10. [AI & Analytics](#ai--analytics)
11. [Content & Insights](#content--insights)
12. [Admin & Audit](#admin--audit)

---

## User & Authentication

### users
Primary user accounts synced from Supabase Auth. Used for admin/system users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (matches auth.users.id) |
| email | string | User's email (unique) |
| first_name | string | First name |
| last_name | string | Last name |
| full_name | string | Full name (generated) |
| location | string | Display location string |
| location_place_id | string | Google Places ID |
| location_lat | number | Latitude |
| location_lng | number | Longitude |
| location_city | string | City |
| location_province | string | Province/State |
| location_country | string | Country |
| location_barangay | string | Barangay (Philippines-specific) |
| location_region | string | Region |
| avatar_url | string | Profile picture URL |
| phone | string | Phone number |
| bio | string | User bio |
| position | string | Job title/position |
| company | string | Company name |
| admin_level | string | Admin role level |
| completed_data | boolean | Whether profile is complete |
| birthday | string | Date of birth |
| gender | string | Gender |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Last update time |

**Relationships:**
- One-to-one: candidates (user can also be a candidate)
- Has many: notifications

---

### bpoc_users
Legacy user table (deprecated, use `users` or `candidates`).

---

## Candidates

### candidates
Job seekers registered on the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (matches auth.users.id) |
| email | string | Email address (unique) |
| first_name | string | First name |
| last_name | string | Last name |
| full_name | string | Full name (auto-generated) |
| phone | string | Phone number |
| avatar_url | string | Profile picture URL |
| username | string | Unique username for public profile |
| slug | string | URL-friendly slug |
| is_active | boolean | Whether account is active |
| email_verified | boolean | Whether email is verified |
| created_at | timestamp | Registration time |
| updated_at | timestamp | Last update time |

**Relationships:**
- Has one: candidate_profiles
- Has many: candidate_resumes, job_applications, job_matches

**Example Use Cases:**
- User registration and authentication
- Public profile pages (`/c/{slug}`)
- Application tracking

---

### candidate_profiles
Extended profile information for candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| bio | string | About me text |
| headline | string | Professional headline |
| phone | string | Phone number |
| position | string | Current/desired position |
| birthday | date | Date of birth |
| gender | string | Gender (male/female/other) |
| gender_custom | string | Custom gender description |
| location | string | Display location |
| location_lat | number | Latitude |
| location_lng | number | Longitude |
| location_city | string | City |
| location_province | string | Province |
| location_country | string | Country |
| location_barangay | string | Barangay |
| location_region | string | Region |
| work_status | string | Employment status |
| expected_salary_min | number | Minimum expected salary |
| expected_salary_max | number | Maximum expected salary |
| preferred_shift | string | Preferred work shift |
| preferred_work_setup | string | remote/onsite/hybrid |
| current_mood | string | Current mood/status |
| website | string | Personal website |
| linkedin | string | LinkedIn URL |
| github | string | GitHub URL |
| twitter | string | Twitter URL |
| portfolio | string | Portfolio URL |
| facebook | string | Facebook URL |
| cover_photo | string | Cover photo URL |
| profile_completed | boolean | Whether profile is complete |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: candidates (via candidate_id)

---

### candidate_resumes
Candidate resume data (parsed JSON).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| resume_data | jsonb | Parsed resume JSON structure |
| original_filename | string | Original uploaded filename |
| slug | string | Public URL slug |
| title | string | Resume title |
| is_primary | boolean | Is this the primary resume |
| is_public | boolean | Is publicly viewable |
| created_at | timestamp | Upload time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: candidates

**Note:** `resume_data` contains structured data including work experience, education, skills, etc.

---

### candidate_work_experiences / candidate_work_experience
Work history entries for candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| company | string | Company name |
| title | string | Job title |
| start_date | date | Start date |
| end_date | date | End date (null if current) |
| is_current | boolean | Currently employed here |
| description | string | Role description |
| location | string | Work location |
| created_at | timestamp | Creation time |

---

### candidate_educations / candidate_education
Education history for candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| institution | string | School/University name |
| degree | string | Degree type |
| field_of_study | string | Major/Field |
| start_date | date | Start date |
| end_date | date | End date |
| grade | string | GPA/Grade |
| description | string | Additional details |
| created_at | timestamp | Creation time |

---

### candidate_skills
Skills associated with candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| name | string | Skill name |
| proficiency | string | Skill level |
| years_experience | number | Years of experience |
| created_at | timestamp | Creation time |

---

### candidate_truth
AI-generated truth/analysis data for candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| truth_data | jsonb | AI analysis results |
| created_at | timestamp | Generation time |
| updated_at | timestamp | Last update |

---

### candidate_ai_analysis / ai_analysis_results
AI analysis results for candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| analysis_type | string | Type of analysis |
| results | jsonb | Analysis results |
| created_at | timestamp | Analysis time |

---

### disc_personality_stats
DISC personality assessment results.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| dominance | number | D score |
| influence | number | I score |
| steadiness | number | S score |
| conscientiousness | number | C score |
| primary_type | string | Primary DISC type |
| created_at | timestamp | Assessment time |

---

### personality_profiles
Extended personality profile data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| profile_data | jsonb | Full personality profile |
| created_at | timestamp | Creation time |

---

### resumes_extracted
Legacy table for extracted resume data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to users |
| resume_data | jsonb | Extracted resume JSON |
| original_filename | string | Original filename |
| created_at | timestamp | Extraction time |
| updated_at | timestamp | Last update |

---

### resumes_generated
AI-generated/enhanced resumes.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to users |
| original_resume_id | uuid | FK to source resume |
| generated_resume_data | jsonb | Generated resume JSON |
| template_used | string | Template identifier |
| generation_metadata | jsonb | Generation parameters |
| created_at | timestamp | Generation time |
| updated_at | timestamp | Last update |

---

## Jobs & Applications

### jobs
Job postings created by agencies/recruiters.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_client_id | uuid | FK to agency_clients |
| posted_by | uuid | FK to recruiter who posted |
| title | string | Job title |
| slug | string | URL-friendly slug |
| description | text | Full job description |
| requirements | jsonb[] | List of requirements |
| responsibilities | jsonb[] | List of responsibilities |
| benefits | jsonb[] | List of benefits |
| salary_min | number | Minimum salary |
| salary_max | number | Maximum salary |
| salary_type | string | hourly/monthly/yearly |
| currency | string | Currency code (USD, PHP) |
| work_arrangement | string | remote/onsite/hybrid |
| work_type | string | full-time/part-time/contract |
| shift | string | Shift type |
| experience_level | string | entry/mid/senior |
| industry | string | Industry category |
| department | string | Department |
| status | string | active/paused/closed/draft |
| priority | string | Priority level |
| application_deadline | timestamp | Deadline for applications |
| views | number | View count |
| applicants_count | number | Number of applicants |
| source | string | Job source (internal/api/scraped) |
| external_id | string | External system ID |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: agency_clients
- Has many: job_applications, job_matches, job_skills

**Example Use Cases:**
- Job listings page
- Job details page
- Application submission

---

### job_skills
Skills required for jobs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| job_id | uuid | FK to jobs |
| skill_name | string | Skill name |
| is_required | boolean | Whether required |
| proficiency_level | string | Required level |

---

### job_applications
Applications submitted by candidates to jobs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| job_id | uuid | FK to jobs |
| resume_id | uuid | FK to candidate_resumes |
| status | string | submitted/reviewed/shortlisted/interviewing/offered/hired/rejected/withdrawn |
| position | number | Position in pipeline |
| reviewed_by | uuid | FK to recruiter who reviewed |
| reviewed_at | timestamp | Review time |
| recruiter_notes | text | Internal recruiter notes |
| recruiter_prescreen_video_url | string | Pre-screen video URL |
| recruiter_prescreen_transcript | text | Video transcript |
| recruiter_prescreen_rating | number | Pre-screen rating |
| recruiter_prescreen_notes | text | Pre-screen notes |
| recruiter_prescreen_date | timestamp | Pre-screen date |
| recruiter_prescreen_status | string | pending/completed/rejected |
| recruiter_prescreen_screened_by | uuid | Who did pre-screen |
| client_notes | text | Client feedback notes |
| client_rating | number | Client rating |
| rejection_reason | text | Reason for rejection |
| rejected_by | string | client/recruiter |
| rejected_date | timestamp | Rejection date |
| offer_acceptance_date | timestamp | When offer accepted |
| contract_signed | boolean | Whether contract is signed |
| first_day_date | date | Start date |
| started_status | string | hired/started/no_show |
| cover_letter | text | Application cover letter |
| notes | text | General notes |
| applied_at | timestamp | Application submission time |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: candidates, jobs
- Has many: job_offers, job_interviews, onboarding_tasks

**Status Flow:**
submitted → reviewed → shortlisted → interviewing → offered → hired/rejected/withdrawn

---

### application_activity_timeline
Activity log for job applications.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| action_type | string | Type of action |
| performed_by_type | string | candidate/recruiter/client/system |
| performed_by_id | uuid | Who performed action |
| description | text | Activity description |
| metadata | jsonb | Additional data |
| created_at | timestamp | Activity time |

---

### application_client_feedback
Client feedback on applications (separate table).

| Column | Type | Description |
|--------|------|-------------|
| application_id | uuid | PK/FK to job_applications |
| notes | text | Feedback notes |
| rating | number | Rating 1-5 |
| updated_at | timestamp | Last update |

---

### job_matches
AI-generated job matches for candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| job_id | uuid | FK to jobs |
| match_score | number | Match score 0-100 |
| status | string | new/viewed/applied/dismissed |
| viewed_at | timestamp | When candidate viewed |
| created_at | timestamp | Match generation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: candidates, jobs

---

## Agencies & Clients

### agencies
Staffing agencies using the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Agency name |
| slug | string | URL-friendly slug |
| logo_url | string | Logo URL |
| website | string | Agency website |
| description | text | About the agency |
| is_active | boolean | Whether active |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Has many: agency_clients, agency_recruiters

---

### agency_profiles
Extended agency profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| profile_data | jsonb | Extended profile data |
| created_at | timestamp | Creation time |

---

### companies
Company entities (clients of agencies).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Company name |
| industry | string | Industry category |
| website | string | Company website |
| logo_url | string | Logo URL |
| description | text | About the company |
| size | string | Company size range |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Has many: agency_clients (via agency_clients.company_id)

---

### agency_clients
Link between agencies and their client companies.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| company_id | uuid | FK to companies |
| status | string | active/inactive/pending |
| contract_start | date | Contract start date |
| contract_end | date | Contract end date |
| primary_contact_name | string | Main contact person |
| primary_contact_email | string | Contact email |
| created_at | timestamp | Relationship creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: agencies, companies
- Has many: jobs

**Note:** Use `agency_client_id` when creating jobs via API.

---

### agency_recruiters
Recruiters working for agencies.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| user_id | uuid | FK to auth.users |
| first_name | string | First name |
| last_name | string | Last name |
| email | string | Email address |
| role | string | Recruiter role level |
| can_invite_recruiters | boolean | Can invite others |
| is_active | boolean | Whether active |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: agencies
- Has many: jobs (via posted_by)

---

### team_invitations
Pending team invitations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| invitee_email | string | Invitee's email |
| invitee_name | string | Invitee's name |
| role | string | Invited role |
| status | string | pending/accepted/expired |
| expires_at | timestamp | Invitation expiry |
| created_at | timestamp | Invitation time |

---

## Recruiters

### recruiter_availability
Recruiter calendar availability.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| recruiter_id | uuid | FK to agency_recruiters |
| day_of_week | integer | 0-6 (Sunday-Saturday) |
| start_time | time | Available from |
| end_time | time | Available until |
| timezone | string | Timezone |
| is_available | boolean | Whether available |
| created_at | timestamp | Creation time |

---

## Offers & Contracts

### job_offers
Job offers extended to candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| salary_offered | number | Offered salary |
| salary_type | string | hourly/monthly/yearly |
| currency | string | Currency code |
| start_date | date | Proposed start date |
| benefits_offered | jsonb | List of benefits |
| additional_terms | text | Additional terms |
| status | string | draft/sent/viewed/accepted/rejected/expired/countered |
| sent_at | timestamp | When offer was sent |
| viewed_at | timestamp | When candidate viewed |
| responded_at | timestamp | When candidate responded |
| expires_at | timestamp | Offer expiry |
| candidate_response | text | Candidate's response |
| rejection_reason | text | Reason if rejected |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: job_applications
- Has many: counter_offers

---

### counter_offers
Counter-offers from candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| offer_id | uuid | FK to job_offers |
| requested_salary | number | Requested salary |
| requested_currency | string | Currency code |
| candidate_message | text | Candidate's message |
| employer_response | text | Employer's response |
| response_type | string | accepted/rejected/counter |
| status | string | pending/accepted/rejected |
| created_at | timestamp | Counter time |
| responded_at | timestamp | Response time |

---

### employment_contracts
Employment contract records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| offer_id | uuid | FK to job_offers |
| contract_type | string | Contract type |
| start_date | date | Employment start |
| end_date | date | Employment end (if contract) |
| salary | number | Agreed salary |
| currency | string | Currency |
| status | string | draft/pending_signature/active/terminated |
| terms | jsonb | Contract terms |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

---

### contract_pdfs
Generated contract PDF files.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contract_id | uuid | FK to employment_contracts |
| file_url | string | PDF storage URL |
| version | number | Document version |
| created_at | timestamp | Generation time |

---

### offer_signatures
Digital signatures on offers/contracts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| offer_id | uuid | FK to job_offers |
| signer_type | string | candidate/employer |
| signer_id | uuid | Who signed |
| signature_data | text | Signature data |
| ip_address | string | Signer's IP |
| signed_at | timestamp | Signature time |

---

### job_acceptances
Formal job acceptance records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| offer_id | uuid | FK to job_offers |
| candidate_id | uuid | FK to candidates |
| accepted_at | timestamp | Acceptance time |
| metadata | jsonb | Additional data |

---

### placements
Successful placement records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| candidate_id | uuid | FK to candidates |
| job_id | uuid | FK to jobs |
| start_date | date | Start date |
| status | string | active/completed/terminated |
| created_at | timestamp | Placement time |

---

## Interviews & Video Calls

### job_interviews
Interview records for applications.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| interview_type | string | recruiter_prescreen/client_interview/final |
| status | string | scheduled/completed/cancelled/no_show |
| outcome | string | passed/failed/pending |
| scheduled_at | timestamp | Interview time |
| duration_minutes | number | Expected duration |
| meeting_link | string | Video call link |
| interviewer_notes | text | Notes from interviewer |
| candidate_feedback | text | Candidate's feedback |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: job_applications
- Has one: video_call_rooms

---

### interviews
Legacy/alternative interviews table.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| type | string | Interview type |
| scheduled_at | timestamp | Schedule time |
| status | string | Status |
| created_at | timestamp | Creation time |

---

### interview_requests
Interview request records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| requested_by | uuid | Who requested |
| status | string | pending/accepted/declined |
| created_at | timestamp | Request time |

---

### interview_time_proposals
Proposed interview times.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| interview_id | uuid | FK to job_interviews |
| proposed_time | timestamp | Proposed time |
| proposed_by | string | recruiter/candidate |
| status | string | pending/accepted/declined |
| created_at | timestamp | Proposal time |

---

### time_proposal_responses
Responses to time proposals.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| proposal_id | uuid | FK to interview_time_proposals |
| responded_by | uuid | Who responded |
| response | string | accept/decline/counter |
| created_at | timestamp | Response time |

---

### video_call_rooms
Video call room records (Daily.co integration).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| interview_id | uuid | FK to job_interviews |
| application_id | uuid | FK to job_applications |
| call_type | string | recruiter_prescreen/client_interview |
| daily_room_name | string | Daily.co room name |
| daily_room_url | string | Daily.co room URL |
| status | string | created/in_progress/ended |
| outcome | string | completed/rejected |
| notes | text | Call notes |
| rating | number | Call rating |
| description | text | Room description |
| started_at | timestamp | Call start |
| ended_at | timestamp | Call end |
| created_at | timestamp | Room creation |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: job_interviews, job_applications
- Has many: video_call_recordings, video_call_transcripts

---

### video_call_participants
Participants in video calls.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | FK to video_call_rooms |
| user_id | uuid | Participant's user ID |
| role | string | interviewer/candidate/observer |
| joined_at | timestamp | Join time |
| left_at | timestamp | Leave time |

---

### video_call_invitations
Invitations to join video calls.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | FK to video_call_rooms |
| invitee_email | string | Invitee email |
| status | string | pending/accepted/declined |
| created_at | timestamp | Invitation time |

---

### video_call_recordings / recordings
Video call recordings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | FK to video_call_rooms |
| recording_url | string | Storage URL |
| duration_seconds | number | Recording duration |
| created_at | timestamp | Recording time |

---

### video_call_transcripts
Transcripts of video calls.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | FK to video_call_rooms |
| transcript_text | text | Full transcript |
| language | string | Detected language |
| created_at | timestamp | Transcription time |

---

## Onboarding

### candidate_onboarding
Onboarding process tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| job_application_id | uuid | FK to job_applications |
| status | string | pending/in_progress/completed |
| start_date | date | Expected start date |
| employment_started | boolean | Has employment started |
| employment_start_date | date | Actual start date |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: candidates, job_applications
- Has many: onboarding_tasks

---

### onboarding_tasks
Individual onboarding tasks.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | FK to job_applications |
| task_type | string | document/training/form/video |
| title | string | Task title |
| description | text | Task description |
| is_required | boolean | Whether required |
| due_date | date | Task deadline |
| status | string | pending/submitted/approved/rejected |
| submitted_at | timestamp | When submitted |
| reviewed_at | timestamp | When reviewed |
| reviewer_notes | text | Review feedback |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Relationships:**
- Belongs to: job_applications

---

### onboarding_task_templates
Template tasks for onboarding.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| task_type | string | Task type |
| title | string | Template title |
| description | text | Template description |
| is_required | boolean | Default required |
| created_at | timestamp | Creation time |

---

## Notifications

### notifications
System notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Recipient user ID |
| type | string | Notification type |
| title | string | Notification title |
| message | text | Notification body |
| link | string | Action link |
| metadata | jsonb | Additional data |
| is_read | boolean | Whether read |
| created_at | timestamp | Creation time |

**Relationships:**
- Belongs to: users/candidates

---

### notification_reads
Notification read tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| notification_id | uuid | FK to notifications |
| user_id | uuid | Who read it |
| read_at | timestamp | Read time |

---

## AI & Analytics

### hr_assistant_conversations
AI HR assistant chat logs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who chatted |
| conversation_id | string | Session ID |
| messages | jsonb | Chat messages |
| context | jsonb | Conversation context |
| created_at | timestamp | Session start |
| updated_at | timestamp | Last message time |

---

### chat_agent_conversations
General AI chat agent conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | string | Session identifier |
| messages | jsonb | Message history |
| created_at | timestamp | Creation time |

---

### chat_agent_knowledge
Knowledge base for chat agents.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| content | text | Knowledge content |
| embeddings | vector | Vector embeddings |
| metadata | jsonb | Content metadata |
| created_at | timestamp | Creation time |

---

### chat_agent_memory
Agent memory/context storage.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | string | Session identifier |
| memory_data | jsonb | Memory contents |
| created_at | timestamp | Creation time |

---

## Content & Insights

### insights_silos
Content silos/categories for SEO.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Silo name |
| slug | string | URL slug |
| description | text | Silo description |
| created_at | timestamp | Creation time |

**Relationships:**
- Has many: insights_posts

---

### insights_posts
Blog/insight articles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| silo_id | uuid | FK to insights_silos |
| title | string | Article title |
| slug | string | URL slug |
| content | text | Article content (markdown) |
| category | string | Content category |
| meta_description | string | SEO description |
| status | string | draft/published |
| created_at | timestamp | Creation time |
| published_at | timestamp | Publication time |

---

### insights_pipeline_drafts
Content pipeline draft storage.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| pipeline_id | uuid | Pipeline reference |
| content | jsonb | Draft content |
| status | string | Draft status |
| created_at | timestamp | Creation time |

---

### insights_production_queue
Content production queue.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| content_type | string | Type of content |
| priority | number | Queue priority |
| status | string | Queue status |
| created_at | timestamp | Queue time |

---

### content_pipelines
Content generation pipelines.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Pipeline name |
| config | jsonb | Pipeline configuration |
| status | string | Pipeline status |
| created_at | timestamp | Creation time |

---

### pipeline_execution_logs
Pipeline execution history.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| pipeline_id | uuid | FK to content_pipelines |
| status | string | Execution status |
| output | jsonb | Execution output |
| created_at | timestamp | Execution time |

---

### article_embeddings
Vector embeddings for articles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| article_id | uuid | FK to insights_posts |
| embeddings | vector | Vector embeddings |
| created_at | timestamp | Creation time |

---

### article_links
Internal/external links in articles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| source_article_id | uuid | Source article |
| target_url | string | Link target |
| anchor_text | string | Link text |
| created_at | timestamp | Creation time |

---

### seo_metadata
SEO metadata storage.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| page_path | string | Page path |
| title | string | SEO title |
| description | string | Meta description |
| keywords | string[] | Keywords |
| created_at | timestamp | Creation time |

---

### targeted_keywords
SEO keyword tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| keyword | string | Target keyword |
| volume | number | Search volume |
| difficulty | number | Ranking difficulty |
| created_at | timestamp | Creation time |

---

### humanization_patterns
AI content humanization patterns.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| pattern_type | string | Pattern type |
| pattern_data | jsonb | Pattern configuration |
| created_at | timestamp | Creation time |

---

## Admin & Audit

### audit_log
General audit log.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Who performed action |
| action | string | Action type |
| entity_type | string | Affected entity type |
| entity_id | uuid | Affected entity ID |
| old_values | jsonb | Previous values |
| new_values | jsonb | New values |
| ip_address | string | User's IP |
| created_at | timestamp | Action time |

---

### admin_audit_log
Admin-specific audit log.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| admin_id | uuid | Admin user ID |
| action | string | Admin action |
| details | jsonb | Action details |
| created_at | timestamp | Action time |

---

### admin_notes
Admin notes on entities.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entity_type | string | Entity type |
| entity_id | uuid | Entity ID |
| note | text | Note content |
| created_by | uuid | Admin who created |
| created_at | timestamp | Creation time |

---

### comments
General comments system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entity_type | string | What is being commented on |
| entity_id | uuid | Entity ID |
| user_id | uuid | Commenter |
| content | text | Comment content |
| created_at | timestamp | Comment time |

---

### platform_errors
Error tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| error_type | string | Error type |
| message | string | Error message |
| stack_trace | text | Stack trace |
| user_id | uuid | Affected user |
| metadata | jsonb | Additional context |
| created_at | timestamp | Error time |

---

### api_rate_limits
API rate limiting.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| key | string | Rate limit key |
| requests | number | Request count |
| window_start | timestamp | Window start |
| created_at | timestamp | Creation time |

---

### webhooks
Webhook configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| url | string | Webhook URL |
| events | string[] | Subscribed events |
| secret | string | Signing secret |
| is_active | boolean | Whether active |
| created_at | timestamp | Creation time |

---

### webhook_deliveries
Webhook delivery log.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| webhook_id | uuid | FK to webhooks |
| event_type | string | Event type |
| payload | jsonb | Payload sent |
| status_code | number | HTTP response code |
| response | text | Response body |
| created_at | timestamp | Delivery time |

---

### site_settings
Platform settings.

| Column | Type | Description |
|--------|------|-------------|
| key | string | Setting key (PK) |
| value | jsonb | Setting value |
| updated_at | timestamp | Last update |

---

## Marketing & Outreach

### email_campaigns
Email marketing campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Campaign name |
| subject | string | Email subject |
| content | text | Email content |
| status | string | draft/scheduled/sent |
| created_at | timestamp | Creation time |

---

### campaign_recipients
Campaign recipient list.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| campaign_id | uuid | FK to email_campaigns |
| email | string | Recipient email |
| status | string | pending/sent/bounced |
| created_at | timestamp | Creation time |

---

### email_activity_log
Email delivery tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | string | Recipient email |
| event_type | string | sent/delivered/opened/clicked |
| metadata | jsonb | Event details |
| created_at | timestamp | Event time |

---

### carpet_bomb_campaigns
Mass outreach campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Campaign name |
| status | string | Campaign status |
| created_at | timestamp | Creation time |

---

### carpet_bomb_leads
Leads for outreach campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| campaign_id | uuid | FK to carpet_bomb_campaigns |
| email | string | Lead email |
| status | string | Lead status |
| created_at | timestamp | Creation time |

---

### carpet_bomb_link_clicks
Link click tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| lead_id | uuid | FK to carpet_bomb_leads |
| link | string | Clicked link |
| created_at | timestamp | Click time |

---

### outbound_contacts
Outbound contact records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | string | Contact email |
| name | string | Contact name |
| company | string | Company name |
| status | string | Contact status |
| created_at | timestamp | Creation time |

---

## Access Control

### client_candidate_access_tokens
Tokens for client candidate access.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| candidate_id | uuid | FK to candidates |
| token | string | Access token |
| expires_at | timestamp | Token expiry |
| created_at | timestamp | Creation time |

---

### client_job_access_tokens
Tokens for client job access.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| job_id | uuid | FK to jobs |
| token | string | Access token |
| expires_at | timestamp | Token expiry |
| created_at | timestamp | Creation time |

---

### client_access_log
Client access logging.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| token_id | uuid | Token used |
| action | string | Action performed |
| ip_address | string | Client IP |
| created_at | timestamp | Access time |

---

### anonymous_sessions
Anonymous user sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | string | Session identifier |
| data | jsonb | Session data |
| created_at | timestamp | Session start |
| expires_at | timestamp | Session expiry |

---

### user_profiles
Extended user profile data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to users |
| preferences | jsonb | User preferences |
| created_at | timestamp | Creation time |

---

## Development & Testing

### developer_test_agencies
Test agency data for development.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| agency_id | uuid | FK to agencies |
| test_mode | boolean | Is in test mode |
| created_at | timestamp | Creation time |

---

## Common Patterns

### Status Enums

**Application Status Flow:**
```
submitted → reviewed → shortlisted → interviewing → offered → hired
                                                  ↘ rejected
                                                  ↘ withdrawn
```

**Interview Status:**
- scheduled, completed, cancelled, no_show

**Offer Status:**
- draft, sent, viewed, accepted, rejected, expired, countered

**Onboarding Task Status:**
- pending, submitted, approved, rejected

### Timestamps

All tables include:
- `created_at` - Record creation time (auto-set)
- `updated_at` - Last modification time (auto-updated)

### UUIDs

All primary keys use UUID v4 format. Foreign keys reference these UUIDs.

### JSONB Fields

Used for flexible schema data:
- `resume_data` - Parsed resume structure
- `requirements` - Job requirements array
- `metadata` - Additional contextual data
- `benefits_offered` - Benefits list

---

## Quick Reference: Common Queries

### Get candidate with full profile
```sql
SELECT c.*, cp.*
FROM candidates c
LEFT JOIN candidate_profiles cp ON cp.candidate_id = c.id
WHERE c.id = '{candidate_id}';
```

### Get job with company info
```sql
SELECT j.*, ac.*, co.name as company_name
FROM jobs j
JOIN agency_clients ac ON ac.id = j.agency_client_id
JOIN companies co ON co.id = ac.company_id
WHERE j.id = '{job_id}';
```

### Get application pipeline
```sql
SELECT ja.*, j.title, c.first_name, c.last_name
FROM job_applications ja
JOIN jobs j ON j.id = ja.job_id
JOIN candidates c ON c.id = ja.candidate_id
WHERE j.agency_client_id = '{agency_client_id}'
ORDER BY ja.created_at DESC;
```

---

*This schema documentation is auto-generated. For the latest structure, query the database directly or check the TypeScript types in `/packages/shared/src/`.*
