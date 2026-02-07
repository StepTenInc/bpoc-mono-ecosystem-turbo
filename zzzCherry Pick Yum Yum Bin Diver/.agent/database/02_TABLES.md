# Table Schemas - Quick Reference

> **67 Tables - Quick Schema Reference**  
> **Generated**: 2026-01-27 09:22 SGT

---

## ⚡ Quick Access

**For COMPLETE detailed schemas with all column definitions**, use:
```bash
# Supabase MCP Server
mcp_supabase-mcp-server_list_tables(project_id="ayrdnsiaylomcemfdisr", schemas=["public"])
```

This will return formatted output with ALL columns, types, defaults, and constraints.

---

## Table Summary (67 Tables)

**Key**: PK = Primary Key, FK = Foreign Key Count, RLS = Row Level Security

| Table | Columns | PK | FKs | RLS | Description |
|-------|---------|----|----|-----|-------------|
| `candidates` | 16 | id | 0 | ✅ | Core candidate identity |
| `candidate_profiles` | 33 | id | 1 | ✅ | Extended profile data |
| `candidate_resumes` | 16 | id | 1 | ✅ | Resume files |
| `candidate_skills` | 11 | id | 1 | ✅ | Candidate skills |
| `candidate_educations` | 12 | id | 1 | ✅ | Education history |
| `candidate_work_experiences` | 13 | id | 1 | ✅ | Work history |
| `candidate_ai_analysis` | 26 | id | 1 | ✅ | AI-generated insights |
| `jobs` | 28 | id | 1 | ✅ | Job postings |
| `job_applications` | 21 | id | 3 | ✅ | Applications |
| `job_matches` | 12 | id | 2 | ✅ | AI matches |
| `job_interviews` | 20 | id | 1 | ✅ | Interviews |
| `job_offers` | 18 | id | 2 | ✅ | Job offers |
| `job_skills` | 6 | id | 1 | ✅ | Job skill requirements |
| `agencies` | 23 | id | 0 | ✅ | Recruitment agencies |
| `agency_recruiters` | 23 | id | 2 | ✅ | Agency staff |
| `agency_profiles` | 18 | id | 1 | ✅ | Agency details |
| `agency_clients` | 15 | id | 3 | ✅ | Agency clients |
| `companies` | 7 | id | 0 | ✅ | Companies |
| `company_profiles` | 6 | id | 1 | ✅ | Company details |
| `video_call_rooms` | 29 | id | 1 | ✅ | Video rooms |
| `video_call_participants` | 17 | id | 1 | ✅ | Call participants |
| `video_call_recordings` | 18 | id | 1 | ✅ | Recordings |
| `video_call_transcripts` | 21 | id | 2 | ✅ | Transcripts |
| `video_call_invitations` | 19 | id | 1 | ✅ | Invitations |
| `carpet_bomb_leads` | 39 | id | 1 | ✅ | Lead generation |
| `carpet_bomb_campaigns` | 18 | id | 1 | ✅ | Marketing campaigns |
| `carpet_bomb_lead_campaigns` | 10 | id | 2 | ✅ | Lead-campaign junction |
| `carpet_bomb_link_clicks` | 13 | id | 2 | ✅ | Click tracking |
| `email_campaigns` | 24 | id | 1 | ❌ | Email campaigns |
| `campaign_recipients` | 16 | id | 2 | ❌ | Email recipients |
| `outbound_contacts` | 24 | id | 1 | ❌ | Contact database |
| `insights_posts` | 40 | id | 1 | ✅ | Blog posts |
| `chat_agent_conversations` | 21 | id | 3 | ✅ | Chat conversations |
| `notifications` | 18 | id | 1 | ✅ | Notifications |
| `webhooks` | 11 | id | 2 | ✅ | Webhook configs |
| `platform_errors` | 31 | id | 0 | ✅ | Error tracking |
| ... | ... | ... | ... | ... | 31 more tables |

**Total**: 67 tables, 1000+ columns

---

## Most Important Tables

### `candidates` (16 columns)
Core identity table for job seekers. Links to 20+ other tables.

**Columns**: id, email, first_name, last_name, full_name (generated), avatar_url, username, slug, is_active, email_verified, created_at, updated_at, suspended, suspended_at, suspended_by, suspended_reason

**Referenced By**: candidate_profiles, candidate_resumes, candidate_skills, job_applications, etc.

---

### `candidate_profiles` (33 columns)
Extended profile data including preferences, location, salary expectations.

**Key Fields**: bio, headline, phone, position, birthday, gender, location (with lat/lng/city/province/country), work_status, preferred_shift, preferred_work_setup, expected_salary_min/max, social links (linkedin, github, twitter, portfolio, facebook, website), cover_photo

---

### `jobs` (28 columns)
Job postings and requisitions.

**Key Fields**: title, slug, agency_client_id, description, requirements, salary_min/max, currency, location, type, status, work_type, work_arrangement, experience_level, shift, setup

---

### `job_applications` (21 columns)
Links candidates to jobs with application tracking.

**Key Fields**: job_id, candidate_id, status (ApplicationStatus ENUM), cover_letter, resume_id, submitted_at, viewed_at, shortlisted_at, interview_scheduled_at, offer_sent_at, hired_at, rejected_at

---

## For Complete Schemas

Use the **Supabase MCP list_tables** tool which provides:
- ✅ All column names and types
- ✅ Nullable/NOT NULL constraints
- ✅ Default values
- ✅ Foreign key relationships
- ✅ Generated columns
- ✅ Check constraints
- ✅ Comments

This reference provides a quick overview. For full DDL and all column details, query via MCP.
