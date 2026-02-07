# BPOC Database Schema Reference

> **Live Database Documentation**
>
> **Source**: Supabase Database (`ayrdnsiaylomcemfdisr`)
> **Last Updated**: 2026-01-22 (Insights pipeline upgrade + game tables removed)
> **Status**: **LIVE & AUTOMATICALLY UPDATED**

---

## 📖 How to Use
This document is a **living reference** of the production database schema.
**DO NOT** manually edit this file if you are unsure.
**AGENTS**: When applying SQL migrations, you **MUST** update this file to reflect changes.

---

## 🏗️ Schema Overview

### 1. Administration & Security
| Table | Description |
|-------|-------------|
| `admin_audit_log` | Security and compliance audit trail. |
| `admin_notes` | Internal notes on entities. |
| `admin_users` | Platform administrators. |
| `platform_errors` | Application error logs. |

### 2. Core Users & Profiles
| Table | Description |
|-------|-------------|
| `candidates` | Primary identity table for job seekers. |
| `candidate_profiles` | Extended profile details (skills, preferences). |
| `bpoc_users` | Internal BPOC staff users. |
| `bpoc_profiles` | Profiles for BPOC staff. |
| `agencies` | Recruitment agencies on the platform. |
| `agency_recruiters` | User accounts for agency staff. |
| `agency_profiles` | Detailed agency information. |
| `agency_clients` | Client companies managed by agencies. |
| `team_invitations` | Invitations to join agencies/teams. |
| `companies` | Client company entities. |
| `company_profiles` | Extended company details. |

### 3. Jobs, Applications, & Hiring
| Table | Description |
|-------|-------------|
| `jobs` | Job postings and requisitions. |
| `job_applications` | Applications linking Candidates to Jobs. |
| `job_matches` | AI-matched candidate suggestions. |
| `application_activity_timeline` | Timeline of application events. |
| `application_client_feedback` | Client feedback on candidates. |
| `job_interviews` | Scheduled interviews. |
| `job_offers` | Formal offers extended to candidates. |
| `counter_offers` | Candidate counter-proposals. |
| `offer_signatures` | Digital signatures on offers. |
| `onboarding_tasks` | Required tasks for new hires. |
| `contract_pdfs` | Generated contract documents. |

### 4. Candidate Data & Analysis
| Table | Description |
|-------|-------------|
| `candidate_ai_analysis` | AI-generated candidate insights. |
| `candidate_skills` | Skill proficiency tracking. |
| `candidate_educations` | Educational history. |
| `candidate_work_experiences` | Professional history. |
| `candidate_resumes` | Uploaded resume files. |
| `job_skills` | Skills required for jobs. |
| `personality_profiles` | Detailed personality breakdowns. |

### 5. AI Agents & Knowledge
| Table | Description |
|-------|-------------|
| `chat_agent_conversations` | Main conversation threads. |
| `chat_agent_memory` | Long-term memory storage. |
| `chat_agent_knowledge` | Knowledge base entries. |
| `chat_memories` | User specific memories. |
| `hr_assistant_conversations` | HR bot interactions. |
| `hr_assistant_conversation_summaries` | Summarized HR threads. |
| `hr_embeddings_kb` | Vector embeddings for HR knowledge. |

### 6. Content & SEO Engine
| Table | Description |
|-------|-------------|
| `content_pipelines` | SEO article generation flows. |
| `pipeline_execution_logs` | Logs for content generation steps. |
| `insights_pipeline_drafts` | Drafts of generated insights. |
| `insights_posts` | Published insight articles. |
| `insight_embeddings` | Vector store for insight content. |
| `internal_links` | Internal linking structure. |
| `link_suggestions` | SEO link recommendations. |
| `seo_metadata` | SEO tags and meta information. |
| `image_generation_logs` | Logs of AI image generation. |

### 7. Communication & Video
| Table | Description |
|-------|-------------|
| `video_call_rooms` | Daily.co video room management. |
| `video_call_invitations` | Sent invites for calls. |
| `video_call_participants` | Who joined which call. |
| `video_call_recordings` | Recordings of video calls. |
| `video_call_transcripts` | AI transcripts of calls. |
| `notifications` | User notifications system. |
| `notification_reads` | Read receipts for notifications. |

### 8. Infrastructure
| Table | Description |
|-------|-------------|
| `webhooks` | Outgoing webhook configuration. |
| `webhook_deliveries` | Delivery logs for webhooks. |
| `anonymous_sessions` | Tracking for non-logged-in users. |

---

## 📊 Complete Table Definitions

*(Columns are listed in order: Name | Type | Nullable | Default)*

### `admin_audit_log`
| `id` | uuid | NO | gen_random_uuid() |
| `admin_id` | uuid | NO | |
| `admin_name` | text | NO | |
| `admin_email` | text | YES | |
| `action` | text | NO | |
| `entity_type` | text | NO | |
| `entity_id` | uuid | NO | |
| `entity_name` | text | YES | |
| `details` | jsonb | YES | |
| `reason` | text | YES | |
| `created_at` | timestamptz | NO | now() |

### `admin_notes`
| `id` | uuid | NO | gen_random_uuid() |
| `admin_id` | uuid | NO | |
| `entity_type` | text | NO | |
| `entity_id` | uuid | NO | |
| `note` | text | NO | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `admin_users`
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | |
| `role` | text | NO | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `agencies`
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO | |
| `slug` | text | NO | |
| `logo_url` | text | YES | |
| `website` | text | YES | |
| `is_verified` | boolean | NO | false |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `agency_clients`
| `id` | uuid | NO | gen_random_uuid() |
| `agency_id` | uuid | NO | |
| `company_id` | uuid | NO | |
| `status` | text | NO | 'active' |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `agency_profiles`
| `id` | uuid | NO | gen_random_uuid() |
| `agency_id` | uuid | NO | |
| `description` | text | YES | |
| `industries` | ARRAY | YES | |
| `size` | text | YES | |
| `founded_year` | integer | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `agency_recruiters`
| `id` | uuid | NO | gen_random_uuid() |
| `agency_id` | uuid | NO | |
| `user_id` | uuid | NO | |
| `role` | text | NO | |
| `is_active` | boolean | NO | true |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `anonymous_sessions`
| `id` | uuid | NO | gen_random_uuid() |
| `session_id` | text | NO | |
| `created_at` | timestamptz | NO | now() |
| `last_seen_at` | timestamptz | NO | now() |
| `metadata` | jsonb | YES | |

### `application_activity_timeline`
| `id` | uuid | NO | gen_random_uuid() |
| `application_id` | uuid | NO | |
| `activity_type` | text | NO | |
| `description` | text | NO | |
| `metadata` | jsonb | YES | |
| `created_by` | uuid | YES | |
| `created_at` | timestamptz | NO | now() |

### `application_client_feedback`
| `id` | uuid | NO | gen_random_uuid() |
| `application_id` | uuid | NO | |
| `client_user_id` | uuid | NO | |
| `rating` | integer | YES | |
| `feedback` | text | YES | |
| `created_at` | timestamptz | NO | now() |

### `bpoc_profiles`
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | |
| `info` | jsonb | YES | |
| `created_at` | timestamptz | NO | now() |

### `bpoc_users`
| `id` | uuid | NO | gen_random_uuid() |
| `email` | text | NO | |
| `role` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `candidate_ai_analysis`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `summary` | text | YES | |
| `strengths` | ARRAY | YES | |
| `weaknesses` | ARRAY | YES | |
| `recommendations` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `candidate_educations`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `institution` | text | NO | |
| `degree` | text | NO | |
| `field_of_study` | text | YES | |
| `start_date` | date | YES | |
| `end_date` | date | YES | |
| `is_current` | boolean | NO | false |
| `created_at` | timestamptz | NO | now() |

### `candidate_profiles`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `headline` | text | YES | |
| `bio` | text | YES | |
| `location` | text | YES | |
| `phone` | text | YES | |
| `website` | text | YES | |
| `linkedin` | text | YES | |
| `github` | text | YES | |
| `twitter` | text | YES | |
| `portfolio` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `candidate_resumes`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `file_url` | text | NO | |
| `file_name` | text | NO | |
| `is_parsed` | boolean | NO | false |
| `parsed_data` | jsonb | YES | |
| `created_at` | timestamptz | NO | now() |

### `candidate_skills`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `skill` | text | NO | |
| `level` | text | YES | |
| `years_experience` | integer | YES | |
| `created_at` | timestamptz | NO | now() |

### `candidate_work_experiences`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `company` | text | NO | |
| `position` | text | NO | |
| `description` | text | YES | |
| `start_date` | date | YES | |
| `end_date` | date | YES | |
| `is_current` | boolean | NO | false |
| `created_at` | timestamptz | NO | now() |

### `candidates`
| `id` | uuid | NO | |
| `email` | text | YES | |
| `first_name` | text | YES | |
| `last_name` | text | YES | |
| `full_name` | text | YES | ((first_name || ' '::text) || last_name) |
| `phone` | text | YES | |
| `avatar_url` | text | YES | |
| `username` | text | YES | |
| `slug` | text | YES | |
| `is_active` | boolean | YES | true |
| `email_verified` | boolean | YES | false |
| `created_at` | timestamptz | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamptz | YES | CURRENT_TIMESTAMP |
| `suspended` | boolean | YES | false |
| `suspended_at` | timestamptz | YES | |
| `suspended_by` | uuid | YES | |
| `suspended_reason` | text | YES | |

### `chat_agent_conversations`
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | |
| `agent_id` | text | NO | |
| `title` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `chat_agent_knowledge`
| `id` | uuid | NO | gen_random_uuid() |
| `agent_id` | text | NO | |
| `topic` | text | NO | |
| `content` | text | NO | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `chat_agent_memory`
| `id` | uuid | NO | gen_random_uuid() |
| `conversation_id` | uuid | NO | |
| `role` | text | NO | |
| `content` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `chat_memories`
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | YES | |
| `memory` | text | NO | |
| `type` | text | YES | 'general' |
| `metadata` | jsonb | YES | |
| `created_at` | timestamptz | YES | now() |

### `companies`
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO | |
| `industry` | text | YES | |
| `website` | text | YES | |
| `logo_url` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `company_profiles`
| `id` | uuid | NO | gen_random_uuid() |
| `company_id` | uuid | NO | |
| `description` | text | YES | |
| `size` | text | YES | |
| `locations` | ARRAY | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `content_pipelines`
| `id` | uuid | NO | gen_random_uuid() |
| `topic` | text | NO | |
| `status` | text | NO | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `contract_pdfs`
| `id` | uuid | NO | gen_random_uuid() |
| `contract_id` | uuid | NO | |
| `pdf_url` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `counter_offers`
| `id` | uuid | NO | gen_random_uuid() |
| `offer_id` | uuid | NO | |
| `candidate_id` | uuid | NO | |
| `amount` | numeric | NO | |
| `currency` | text | NO | |
| `notes` | text | YES | |
| `status` | text | NO | 'pending' |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `hr_assistant_conversation_summaries`
| `id` | uuid | NO | gen_random_uuid() |
| `conversation_id` | uuid | NO | |
| `summary` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `hr_assistant_conversations`
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | |
| `title` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `hr_embeddings_kb`
| `id` | bigint | NO | nextval('hr_embeddings_kb_id_seq'::regclass) |
| `content` | text | YES | |
| `metadata` | jsonb | YES | |
| `embedding` | USER-DEFINED | YES | |

### `image_generation_logs`
| `id` | uuid | NO | gen_random_uuid() |
| `prompt` | text | NO | |
| `image_url` | text | YES | |
| `model` | text | YES | |
| `created_at` | timestamptz | NO | now() |

### `insight_embeddings`
| `id` | bigint | NO | nextval('insight_embeddings_id_seq'::regclass) |
| `content` | text | YES | |
| `metadata` | jsonb | YES | |
| `embedding` | USER-DEFINED | YES | |

### `insights_pipeline_drafts`
| `id` | uuid | NO | gen_random_uuid() |
| `pipeline_id` | uuid | NO | |
| `content` | jsonb | NO | |
| `step` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `insights_posts`
| `id` | uuid | NO | gen_random_uuid() |
| `title` | text | NO | |
| `slug` | text | NO | |
| `content` | text | NO | |
| `excerpt` | text | YES | |
| `cover_image` | text | YES | |
| `cover_image_alt` | text | YES | |
| `hero_video_url` | text | YES | |
| `hero_type` | text | YES | 'image' |
| `section1_image_alt` | text | YES | |
| `section2_image_alt` | text | YES | |
| `section3_image_alt` | text | YES | |
| `silo` | text | YES | |
| `published_at` | timestamptz | YES | |
| `pipeline_id` | uuid | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `internal_links`
| `id` | uuid | NO | gen_random_uuid() |
| `source_url` | text | NO | |
| `target_url` | text | NO | |
| `anchor_text` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `job_applications`
| `id` | uuid | NO | gen_random_uuid() |
| `job_id` | uuid | NO | |
| `candidate_id` | uuid | NO | |
| `status` | text | NO | 'applied' |
| `cover_letter` | text | YES | |
| `resume_id` | uuid | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `job_interviews`
| `id` | uuid | NO | gen_random_uuid() |
| `application_id` | uuid | NO | |
| `interviewer_id` | uuid | NO | |
| `scheduled_at` | timestamptz | NO | |
| `duration_minutes` | integer | YES | 30 |
| `status` | text | NO | 'scheduled' |
| `meeting_link` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `job_matches`
| `id` | uuid | NO | gen_random_uuid() |
| `job_id` | uuid | NO | |
| `candidate_id` | uuid | NO | |
| `match_score` | numeric | NO | |
| `reasons` | jsonb | YES | |
| `created_at` | timestamptz | NO | now() |

### `job_offers`
| `id` | uuid | NO | gen_random_uuid() |
| `application_id` | uuid | NO | |
| `salary` | numeric | NO | |
| `currency` | text | NO | |
| `start_date` | date | YES | |
| `status` | text | NO | 'draft' |
| `created_by` | uuid | NO | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `job_skills`
| `id` | uuid | NO | gen_random_uuid() |
| `job_id` | uuid | NO | |
| `skill` | text | NO | |
| `level` | text | YES | |
| `is_required` | boolean | NO | true |
| `created_at` | timestamptz | NO | now() |

### `jobs`
| `id` | uuid | NO | gen_random_uuid() |
| `title` | text | NO | |
| `slug` | text | NO | |
| `agency_client_id` | uuid | NO | |
| `description` | text | NO | |
| `requirements` | text | YES | |
| `salary_min` | numeric | YES | |
| `salary_max` | numeric | YES | |
| `currency` | text | YES | |
| `location` | text | YES | |
| `type` | text | YES | |
| `status` | text | NO | 'draft' |
| `created_by` | uuid | NO | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `link_suggestions`
| `id` | uuid | NO | gen_random_uuid() |
| `url` | text | NO | |
| `suggestions` | jsonb | NO | |
| `created_at` | timestamptz | NO | now() |

### `notification_reads`
| `id` | uuid | NO | gen_random_uuid() |
| `notification_id` | uuid | NO | |
| `user_id` | uuid | NO | |
| `read_at` | timestamptz | NO | now() |

### `notifications`
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | |
| `type` | text | NO | |
| `title` | text | NO | |
| `message` | text | NO | |
| `data` | jsonb | YES | |
| `is_read` | boolean | NO | false |
| `created_at` | timestamptz | NO | now() |

### `offer_signatures`
| `id` | uuid | NO | gen_random_uuid() |
| `offer_id` | uuid | NO | |
| `user_id` | uuid | NO | |
| `signature_data` | text | NO | |
| `ip_address` | text | YES | |
| `signed_at` | timestamptz | NO | now() |

### `onboarding_tasks`
| `id` | uuid | NO | gen_random_uuid() |
| `offer_id` | uuid | NO | |
| `title` | text | NO | |
| `description` | text | YES | |
| `is_completed` | boolean | NO | false |
| `due_date` | date | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `personality_profiles`
| `id` | uuid | NO | gen_random_uuid() |
| `candidate_id` | uuid | NO | |
| `traits` | jsonb | YES | |
| `analysis` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `pipeline_execution_logs`
| `id` | uuid | NO | gen_random_uuid() |
| `pipeline_id` | uuid | NO | |
| `step` | text | NO | |
| `status` | text | NO | |
| `message` | text | YES | |
| `created_at` | timestamptz | NO | now() |

### `platform_errors`
| `id` | uuid | NO | gen_random_uuid() |
| `code` | text | NO | |
| `message` | text | NO | |
| `stack_trace` | text | YES | |
| `context` | jsonb | YES | |
| `created_at` | timestamptz | NO | now() |

### `seo_metadata`
| `id` | uuid | NO | gen_random_uuid() |
| `url` | text | NO | |
| `title` | text | YES | |
| `description` | text | YES | |
| `keywords` | ARRAY | YES | |
| `og_image` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `team_invitations`
| `id` | uuid | NO | gen_random_uuid() |
| `agency_id` | uuid | NO | |
| `email` | text | NO | |
| `role` | text | NO | |
| `token` | text | NO | |
| `expires_at` | timestamptz | NO | |
| `created_at` | timestamptz | NO | now() |

### `video_call_invitations`
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO | |
| `email` | text | NO | |
| `token` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `video_call_participants`
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO | |
| `user_id` | uuid | YES | |
| `name` | text | YES | |
| `joined_at` | timestamptz | NO | now() |
| `left_at` | timestamptz | YES | |

### `video_call_recordings`
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO | |
| `daily_recording_id` | text | YES | |
| `url` | text | YES | |
| `duration` | integer | YES | |
| `created_at` | timestamptz | NO | now() |

### `video_call_rooms`
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO | |
| `url` | text | NO | |
| `created_by` | uuid | NO | |
| `status` | text | NO | 'scheduled' |
| `scheduled_at` | timestamptz | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

### `video_call_transcripts`
| `id` | uuid | NO | gen_random_uuid() |
| `recording_id` | uuid | NO | |
| `content` | text | NO | |
| `created_at` | timestamptz | NO | now() |

### `webhook_deliveries`
| `id` | uuid | NO | gen_random_uuid() |
| `webhook_id` | uuid | NO | |
| `event_type` | text | NO | |
| `payload` | jsonb | NO | |
| `status` | text | NO | 'pending' |
| `attempts` | integer | NO | 0 |
| `max_attempts` | integer | NO | 3 |
| `response_code` | integer | YES | |
| `response_body` | text | YES | |
| `error_message` | text | YES | |
| `created_at` | timestamptz | NO | now() |
| `last_attempt_at` | timestamptz | YES | |
| `next_retry_at` | timestamptz | YES | |
| `delivered_at` | timestamptz | YES | |

### `webhooks`
| `id` | uuid | NO | gen_random_uuid() |
| `agency_id` | uuid | NO | |
| `url` | text | NO | |
| `events` | ARRAY | NO | '{}'::text[] |
| `description` | text | YES | |
| `secret` | text | NO | |
| `is_active` | boolean | NO | true |
| `created_by` | uuid | YES | |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |
| `last_triggered_at` | timestamptz | YES | |

---
*Maintained by Agent Rules.*
