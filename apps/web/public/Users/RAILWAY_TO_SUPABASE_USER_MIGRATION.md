# Railway → Supabase User Data Migration Guide

## Overview

This guide documents the migration of user data from the Railway PostgreSQL database to the new Supabase database structure.

**Migration Date:** December 2025  
**Total Railway Users:** 57  
**Matched for Migration:** 41  

---

## Schema Mapping

### User Tables

| Railway Table | Supabase Table | Notes |
|---------------|----------------|-------|
| `users` | `candidates` | Core user identity |
| `user_work_status` | `candidate_profiles` | Merged with profile |
| `privacy_settings` | `candidate_profiles.privacy_settings` | JSON field |

### Assessment Tables

| Railway Table | Supabase Table | Notes |
|---------------|----------------|-------|
| `disc_personality_sessions` | `candidate_disc_assessments` | Session data |
| `disc_personality_stats` | *Not migrated* | Calculated from sessions |
| `typing_hero_sessions` | `candidate_typing_assessments` | Session data |
| `typing_hero_stats` | *Not migrated* | Calculated from sessions |

### Resume Tables

| Railway Table | Supabase Table | Notes |
|---------------|----------------|-------|
| `resumes_extracted` | `candidate_resumes.extracted_data` | JSON field |
| `resumes_generated` | `candidate_resumes.generated_data` | JSON field |
| `saved_resumes` | `candidate_resumes` | Primary resume table |

### Analysis Tables

| Railway Table | Supabase Table | Notes |
|---------------|----------------|-------|
| `ai_analysis_results` | `candidate_ai_analysis` | Direct mapping |

### Resume-Derived Normalized Tables (NEW)

| Source | Supabase Table | Notes |
|--------|----------------|-------|
| `saved_resumes.resume_data.skills` | `candidate_skills` | Extracted from resume JSON |
| `saved_resumes.resume_data.education` | `candidate_educations` | Extracted from resume JSON |
| `saved_resumes.resume_data.experience` | `candidate_work_experiences` | Extracted from resume JSON |

### Tables NOT Migrated

| Railway Table | Reason |
|---------------|--------|
| `user_leaderboard_scores` | Will be recalculated |
| `applications` | Different job system |
| `job_match_results` | Will be recalculated |
| `agencies` | Separate migration |
| `members` | Different structure |

---

## Field Mappings

### candidates (from users)

```
Railway users                    → Supabase candidates
─────────────────────────────────────────────────────
id                               → id (same UUID)
email                            → email
first_name                       → first_name
last_name                        → last_name
full_name                        → full_name
phone                            → phone
avatar_url                       → avatar_url
username                         → username
slug                             → slug
created_at                       → created_at
updated_at                       → updated_at
                                 → is_active (default: true)
                                 → email_verified (default: true)
```

### candidate_profiles (from users + user_work_status)

```
Railway                          → Supabase candidate_profiles
─────────────────────────────────────────────────────
users.id                         → candidate_id (FK)
users.bio                        → bio
users.position                   → position
users.birthday                   → birthday
users.gender                     → gender (mapped enum)
users.gender_custom              → gender_custom
users.location*                  → location* (all fields)

user_work_status.work_status     → work_status (mapped enum)
user_work_status.current_*       → current_employer, current_position, current_salary
user_work_status.expected_salary → expected_salary_min, expected_salary_max (parsed)
user_work_status.notice_period   → notice_period_days
user_work_status.preferred_shift → preferred_shift (mapped enum)
user_work_status.work_setup      → preferred_work_setup (mapped enum)
user_work_status.current_mood    → current_mood
user_work_status.completed_data  → profile_completed
```

### candidate_disc_assessments (from disc_personality_sessions)

```
Railway disc_personality_sessions → Supabase candidate_disc_assessments
─────────────────────────────────────────────────────
user_id                          → candidate_id
session_status                   → session_status (mapped enum)
started_at                       → started_at
finished_at                      → finished_at
duration_seconds                 → duration_seconds
total_questions                  → total_questions
d_score                          → d_score
i_score                          → i_score
s_score                          → s_score
c_score                          → c_score
primary_type                     → primary_type
secondary_type                   → secondary_type
confidence_score                 → confidence_score
consistency_index                → consistency_index
cultural_alignment               → cultural_alignment
ai_assessment                    → ai_assessment
ai_bpo_roles                     → ai_bpo_roles
core_responses                   → core_responses
personalized_responses           → personalized_responses
response_patterns                → response_patterns
user_position                    → user_position
user_location                    → user_location
user_experience                  → user_experience
                                 → xp_earned (default: 0)
```

### candidate_typing_assessments (from typing_hero_sessions)

```
Railway typing_hero_sessions     → Supabase candidate_typing_assessments
─────────────────────────────────────────────────────
user_id                          → candidate_id
session_status                   → session_status
difficulty_level                 → difficulty_level
elapsed_time                     → elapsed_time
score                            → score
wpm                              → wpm
overall_accuracy                 → overall_accuracy
longest_streak                   → longest_streak
correct_words                    → correct_words
wrong_words                      → wrong_words
words_correct                    → words_correct (JSON)
words_incorrect                  → words_incorrect (JSON)
ai_analysis                      → ai_analysis
```

### candidate_resumes (from saved_resumes + extracted + generated)

```
Railway                          → Supabase candidate_resumes
─────────────────────────────────────────────────────
saved_resumes.user_id            → candidate_id
saved_resumes.resume_slug        → slug
saved_resumes.resume_title       → title
saved_resumes.resume_data        → resume_data
saved_resumes.template_used      → template_used
saved_resumes.is_public          → is_public
saved_resumes.view_count         → view_count
resumes_extracted.resume_data    → extracted_data
resumes_generated.generated_data → generated_data
resumes_extracted.original_fn    → original_filename
resumes_generated.generation_*   → generation_metadata
```

### candidate_ai_analysis (from ai_analysis_results)

```
Railway ai_analysis_results      → Supabase candidate_ai_analysis
─────────────────────────────────────────────────────
user_id                          → candidate_id
session_id                       → session_id
overall_score                    → overall_score
ats_compatibility_score          → ats_compatibility_score
content_quality_score            → content_quality_score
professional_presentation_score  → professional_presentation_score
skills_alignment_score           → skills_alignment_score
key_strengths                    → key_strengths
strengths_analysis               → strengths_analysis
improvements                     → improvements
recommendations                  → recommendations
section_analysis                 → section_analysis
improved_summary                 → improved_summary
salary_analysis                  → salary_analysis
career_path                      → career_path
candidate_profile                → candidate_profile_snapshot
skills_snapshot                  → skills_snapshot
experience_snapshot              → experience_snapshot
education_snapshot               → education_snapshot
analysis_metadata                → analysis_metadata
portfolio_links                  → portfolio_links
files_analyzed                   → files_analyzed
```

### candidate_skills (from resume_data.skills)

```
Resume JSON                      → Supabase candidate_skills
─────────────────────────────────────────────────────
(parent user_id)                 → candidate_id
skills[n] (string)               → name
(auto-categorized)               → category
                                 → proficiency_level (null)
                                 → years_experience (null)
(index < 5)                      → is_primary
                                 → verified (default: false)
                                 → verified_at (null)
resume.created_at                → created_at
resume.updated_at                → updated_at
```

### candidate_educations (from resume_data.education)

```
Resume JSON education            → Supabase candidate_educations
─────────────────────────────────────────────────────
(parent user_id)                 → candidate_id
education.institution            → institution
education.degree                 → degree
education.degree (parsed)        → field_of_study
                                 → start_date (null - rarely provided)
education.graduation_date        → end_date (parsed to date)
                                 → is_current (false)
education.gpa                    → grade
honors + achievements + courses  → description (combined)
resume.created_at                → created_at
resume.updated_at                → updated_at
```

### candidate_work_experiences (from resume_data.experience)

```
Resume JSON experience           → Supabase candidate_work_experiences
─────────────────────────────────────────────────────
(parent user_id)                 → candidate_id
experience.company               → company_name
experience.position              → job_title
experience.location              → location
experience.duration (parsed)     → start_date
experience.duration (parsed)     → end_date
(duration ends with "Present")   → is_current
experience.description           → description
experience.key_responsibilities  → responsibilities (JSON array)
experience.achievements          → achievements (JSON array)
resume.created_at                → created_at
resume.updated_at                → updated_at
```

---

## Enum Mappings

### WorkStatus

```
Railway                    → Supabase
───────────────────────────────────────
employed                   → employed
unemployed-looking-for-work → unemployed
freelancer                 → freelancer
part-time                  → part_time
student                    → student
on-leave                   → unemployed
retired                    → unemployed
career-break               → unemployed
transitioning              → unemployed
remote-worker              → employed
```

### Shift

```
Railway → Supabase
────────────────────
day     → day
night   → night
both    → both
```

### WorkSetup

```
Railway              → Supabase
─────────────────────────────────
Work From Office     → office
Work From Home       → remote
Hybrid               → hybrid
Any                  → any
```

### Gender

```
Railway            → Supabase
───────────────────────────────
male               → male
female             → female
other              → other
prefer-not-to-say  → prefer_not_to_say
```

### SessionStatus

```
Railway      → Supabase
────────────────────────
completed    → completed
in_progress  → in_progress
started      → started
abandoned    → abandoned
```

---

## Migration Process

### Prerequisites

1. Ensure Supabase auth users exist (matched by email + ID)
2. Have `matched-users-for-migration.json` generated
3. Verify environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Step 1: Dry Run

```bash
node scripts/migrate-railway-to-supabase.js
```

This previews all operations without making changes.

### Step 2: Single User Test

```bash
node scripts/migrate-railway-to-supabase.js --execute --user=<UUID>
```

Test with one user first.

### Step 3: Full Migration

```bash
node scripts/migrate-railway-to-supabase.js --execute
```

Migrates all 41 matched users.

---

## Migration Order

The script migrates data in this order to respect foreign key constraints:

| # | Supabase Table | Railway Source | Notes |
|---|----------------|----------------|-------|
| 1 | `candidates` | `users` | Core user record (uses auth.users ID) |
| 2 | `candidate_profiles` | `users` + `user_work_status` | Profile + work status merged |
| 3 | `candidate_disc_assessments` | `disc_personality_sessions` | DISC session history |
| 4 | `candidate_typing_assessments` | `typing_hero_sessions` | Typing test history |
| 5 | `candidate_resumes` | `saved_resumes` + `resumes_extracted` + `resumes_generated` | Resume documents |
| 6 | `candidate_ai_analysis` | `ai_analysis_results` | AI analysis results |
| 7 | `candidate_skills` | `saved_resumes.resume_data.skills` | Extracted from resume JSON |
| 8 | `candidate_educations` | `saved_resumes.resume_data.education` | Extracted from resume JSON |
| 9 | `candidate_work_experiences` | `saved_resumes.resume_data.experience` | Extracted from resume JSON |

---

## Data Validation

### Pre-Migration Checks

- [x] 41 users have matching IDs in Supabase auth
- [x] 0 users have ID mismatches
- [x] All required fields have valid mappings

### Post-Migration Verification

After migration, verify:

```sql
-- Count migrated candidates
SELECT COUNT(*) FROM candidates;

-- Count profiles
SELECT COUNT(*) FROM candidate_profiles;

-- Count assessments
SELECT COUNT(*) FROM candidate_disc_assessments;
SELECT COUNT(*) FROM candidate_typing_assessments;

-- Count resumes
SELECT COUNT(*) FROM candidate_resumes;

-- Count AI analysis
SELECT COUNT(*) FROM candidate_ai_analysis;
```

## Rollback

If migration needs to be reverted:

```sql
-- Delete migrated data (in reverse order)
DELETE FROM candidate_ai_analysis WHERE candidate_id IN (SELECT id FROM candidates);
DELETE FROM candidate_resumes WHERE candidate_id IN (SELECT id FROM candidates);
DELETE FROM candidate_typing_assessments WHERE candidate_id IN (SELECT id FROM candidates);
DELETE FROM candidate_disc_assessments WHERE candidate_id IN (SELECT id FROM candidates);
DELETE FROM candidate_profiles WHERE candidate_id IN (SELECT id FROM candidates);
DELETE FROM candidates;
```

⚠️ **Warning:** This deletes all candidate data. Only use if full rollback is needed.

---

## Files

| File | Purpose |
|------|---------|
| `scripts/migrate-railway-to-supabase.js` | Migration script |
| `matched-users-for-migration.json` | Migration source data |
| `migration-results-*.json` | Migration execution results |

---

## Support

For issues with migration:
1. Check migration results JSON for specific errors
2. Verify Supabase RLS policies allow service role access
3. Check foreign key constraints in target tables

---

*Generated by Shadow's Migration System v1.0* 🕳️

