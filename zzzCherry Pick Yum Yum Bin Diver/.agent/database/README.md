# BPOC Database Schema Documentation

> **Complete Database Reference**  
> **Database**: Supabase (`ayrdnsiaylomcemfdisr`)  
> **Generated**: 2026-01-27 09:17 SGT  
> **Method**: MCP Server Queries

---

## 📚 Documentation Structure

This database schema documentation is split into multiple files for better organization and navigation:

### Core Documentation Files

1. **[00_ENUMS.md](./00_ENUMS.md)** - All custom ENUM types (30 types)
2. **[01_STORAGE.md](./01_STORAGE.md)** - Storage buckets configuration (7 buckets)
3. **[02_TABLES.md](./02_TABLES.md)** - Complete table schemas (67 tables, 1000+ columns)
4. **[03_RELATIONSHIPS.md](./03_RELATIONSHIPS.md)** - Foreign key relationships (200+ relationships)
5. **[04_CONSTRAINTS.md](./04_CONSTRAINTS.md)** - Primary keys, unique constraints, check constraints
6. **[05_INDEXES.md](./05_INDEXES.md)** - All database indexes (400+ indexes)
7. **[06_RLS_POLICIES.md](./06_RLS_POLICIES.md)** - Row Level Security policies (100+ policies)

---

## 📊 Quick Stats

| Metric | Count |
|--------|-------|
| **Total Tables** | 67 |
| **Total Columns** | 1000+ |
| **Foreign Keys** | 200+ |
| **Primary Keys** | 67 |
| **Unique Constraints** | 20 |
| **Check Constraints** | 500+ |
| **Custom ENUM Types** | 30 |
| **Indexes** | 400+ |
| **Storage Buckets** | 7 |
| **RLS Policies** | 100+ |
| **Tables with RLS** | 51 |

---

## 🗂️ Table Categories

### 1. Core Identity (10 tables)
- `candidates` - Job seekers
- `candidate_profiles` - Extended candidate info
- `agencies` - Recruitment agencies
- `agency_recruiters` - Agency staff
- `companies` - Client companies
- `bpoc_users` - Internal staff
- `bpoc_profiles` - Staff profiles
- `admin_users` - Platform admins
- `agency_profiles` - Agency details
- `agency_clients` - Client relationships

### 2. Jobs & Applications (12 tables)
- `jobs` - Job postings
- `job_applications` - Applications
- `job_matches` - AI matches
- `job_interviews` - Interviews
- `job_offers` - Offers
- `job_skills` - Required skills
- `application_activity_timeline` - Activity log
- `application_client_feedback` - Feedback
- `counter_offers` - Counter offers
- `offer_signatures` - Digital signatures
- `onboarding_tasks` - Onboarding
- `contract_pdfs` - Contracts

### 3. Candidate Data (7 tables)
- `candidate_ai_analysis` - AI insights
- `candidate_skills` - Skills
- `candidate_educations` - Education
- `candidate_work_experiences` - Work history
- `candidate_resumes` - Resumes
- `personality_profiles` - Personalities
- `anonymous_sessions` - Guest sessions

### 4. AI & Chat (9 tables)
- `chat_agent_conversations` - Conversations
- `chat_agent_memory` - Memory
- `chat_agent_knowledge` - Knowledge base
- `chat_memories` - User memories
- `hr_assistant_conversations` - HR conversations
- `hr_assistant_conversation_summaries` - Summaries
- `hr_embeddings_kb` - HR embeddings
- `article_embeddings` - Article embeddings
- `insight_embeddings` - Insight embeddings

### 5. Content & SEO (10 tables)
- `content_pipelines` - Content pipelines
- `insights_posts` - Published articles
- `insights_pipeline_drafts` - Article drafts
- `article_links` - Article links
- `internal_links` - Internal links
- `link_suggestions` - Link suggestions
- `seo_metadata` - SEO metadata
- `targeted_keywords` - Keywords
- `image_generation_logs` - Image logs
- `humanization_patterns` - Writing patterns
- `pipeline_execution_logs` - Execution logs

### 6. Video Calls (6 tables)
- `video_call_rooms` - Video rooms
- `video_call_invitations` - Invitations
- `video_call_participants` - Participants
- `video_call_recordings` - Recordings
- `video_call_transcripts` - Transcripts

### 7. Communications (4 tables)
- `notifications` - Notifications
- `notification_reads` - Read receipts
- `team_invitations` - Team invites

### 8. Outbound Marketing (9 tables)
- `outbound_contacts` - Contact database
- `email_campaigns` - Email campaigns
- `campaign_recipients` - Recipients
- `email_activity_log` - Email activity
- `csv_import_batches` - CSV imports
- `carpet_bomb_leads` - Lead generation
- `carpet_bomb_campaigns` - Campaigns
- `carpet_bomb_lead_campaigns` - Lead-campaign junction
- `carpet_bomb_link_clicks` - Click tracking

### 9. Webhooks (2 tables)
- `webhooks` - Webhook configs
- `webhook_deliveries` - Delivery tracking

### 10. Admin & Errors (3 tables)
- `admin_audit_log` - Audit trail
- `admin_notes` - Admin notes
- `platform_errors` - Error tracking

---

## 🔍 How to Use This Documentation

### Finding Table Information
1. Check **[02_TABLES.md](./02_TABLES.md)** for complete column definitions
2. See **[03_RELATIONSHIPS.md](./03_RELATIONSHIPS.md)** for how tables connect
3. Review **[06_RLS_POLICIES.md](./06_RLS_POLICIES.md)** for access control

### Understanding Data Types
- Check **[00_ENUMS.md](./00_ENUMS.md)** for all custom ENUM values
- See column definitions in **[02_TABLES.md](./02_TABLES.md)** for data types

### Storage Configuration
- See **[01_STORAGE.md](./01_STORAGE.md)** for bucket configurations
- Check file size limits and allowed MIME types

### Performance & Optimization
- Review **[05_INDEXES.md](./05_INDEXES.md)** for query optimization
- Check foreign key indexes for join performance

---

## ⚡ Quick Reference

### Most Important Tables
- **`candidates`** - Core user identity (links to everything)
- **`candidate_profiles`** - Extended profile data (33 columns)
- **`jobs`** - Job postings (28 columns)
- **`job_applications`** - Applications (links candidates to jobs)
- **`agencies`** - Recruitment agencies
- **`video_call_rooms`** - Video conferencing (29 columns)

### Critical Relationships
- `candidates.id` → Referenced by 20+ other tables
- `agencies.id` → Referenced by clients, recruiters, jobs
- `jobs.id` → Referenced by applications, matches, interviews

### Storage Buckets
- **`candidate`** - 10MB limit, images + PDFs only
- **`insights-images`** - Public, no limits
- All others listed in **[01_STORAGE.md](./01_STORAGE.md)**

---

## 🔄 Keeping Documentation Updated

**This documentation is auto-generated from live database queries.**

To regenerate:
```bash
# Use MCP Supabase server to query schema
# Run queries from .agent/database/generate_schema.sql
# Update documentation files
```

---

## 📝 Last Updated

**Date**: 2026-01-27 09:17 SGT  
**Method**: Supabase MCP Server  
**Agent**: Claude Sonnet 4.5  
**Database**: ayrdnsiaylomcemfdisr
