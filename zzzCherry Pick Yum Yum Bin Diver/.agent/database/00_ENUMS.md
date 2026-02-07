# Custom ENUM Types

> **All Custom PostgreSQL ENUM Types**  
> **Generated**: 2026-01-27 09:17 SGT  
> **Total Types**: 30

---

## Complete ENUM Type Reference

### Application & Job Management

#### `ApplicationStatus`
**Usage**: Status of job applications

```sql
CREATE TYPE "ApplicationStatus" AS ENUM (
  'submitted',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'offer_pending',
  'offer_sent',
  'offer_accepted',
  'hired',
  'rejected',
  'withdrawn',
  'invited'
);
```

**Used in**: `job_applications.status`

---

#### `JobStatus`
**Usage**: Current status of job posting

```sql
CREATE TYPE "JobStatus" AS ENUM (
  'draft',
  'active',
  'paused',
  'closed',
  'filled'
);
```

**Used in**: `jobs.status`

---

#### `JobSource`
**Usage**: How job was created

```sql
CREATE TYPE "JobSource" AS ENUM (
  'manual',
  'api',
  'import'
);
```

**Used in**: `jobs.source`

---

#### `MatchStatus`
**Usage**: Status of AI job matches

```sql
CREATE TYPE "MatchStatus" AS ENUM (
  'pending',
  'viewed',
  'interested',
  'not_interested',
  'applied'
);
```

**Used in**: `job_matches.status`

---

### Interview Management

#### `InterviewStatus`
**Usage**: Current state of interview

```sql
CREATE TYPE "InterviewStatus" AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);
```

**Used in**: `job_interviews.status`

---

#### `InterviewOutcome`
**Usage**: Result of interview

```sql
CREATE TYPE "InterviewOutcome" AS ENUM (
  'passed',
  'failed',
  'pending_decision',
  'needs_followup'
);
```

**Used in**: `job_interviews.outcome`

---

#### `interview_type_v2`
**Usage**: Type of interview round

```sql
CREATE TYPE "interview_type_v2" AS ENUM (
  'recruiter_prescreen',
  'recruiter_round_1',
  'recruiter_round_2',
  'recruiter_round_3',
  'recruiter_offer',
  'recruiter_general',
  'client_round_1',
  'client_round_2',
  'client_final',
  'client_general'
);
```

**Used in**: `job_interviews.interview_type`

---

### Offer Management

#### `OfferStatus`
**Usage**: Status of job offer

```sql
CREATE TYPE "OfferStatus" AS ENUM (
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'negotiating',
  'expired',
  'withdrawn'
);
```

**Used in**: `job_offers.status`

---

### Onboarding

#### `OnboardingStatus`
**Usage**: Onboarding task status

```sql
CREATE TYPE "OnboardingStatus" AS ENUM (
  'pending',
  'submitted',
  'approved',
  'rejected',
  'overdue'
);
```

**Used in**: `onboarding_tasks.status`

---

#### `OnboardingTaskType`
**Usage**: Type of onboarding task

```sql
CREATE TYPE "OnboardingTaskType" AS ENUM (
  'document_upload',
  'form_fill',
  'e_sign',
  'acknowledgment',
  'training',
  'information'
);
```

**Used in**: `onboarding_tasks.task_type`

---

### Work & Employment

#### `WorkType`
**Usage**: Employment type

```sql
CREATE TYPE "WorkType" AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'internship'
);
```

**Used in**: `jobs.work_type`

---

#### `WorkArrangement`
**Usage**: Work location arrangement

```sql
CREATE TYPE "WorkArrangement" AS ENUM (
  'onsite',
  'remote',
  'hybrid'
);
```

**Used in**: `jobs.work_arrangement`

---

#### `WorkSetup`
**Usage**: Preferred work setup

```sql
CREATE TYPE "WorkSetup" AS ENUM (
  'office',
  'remote',
  'hybrid',
  'any'
);
```

**Used in**: `candidate_profiles.preferred_work_setup`

---

#### `WorkStatus`
**Usage**: Current employment status

```sql
CREATE TYPE "WorkStatus" AS ENUM (
  'employed',
  'unemployed',
  'freelancer',
  'part_time',
  'student'
);
```

**Used in**: `candidate_profiles.work_status`

---

#### `Shift`
**Usage**: Work shift preference

```sql
CREATE TYPE "Shift" AS ENUM (
  'day',
  'night',
  'both'
);
```

**Used in**: `candidate_profiles.preferred_shift`

---

#### `SalaryType`
**Usage**: Salary payment frequency

```sql
CREATE TYPE "SalaryType" AS ENUM (
  'hourly',
  'monthly',
  'yearly'
);
```

**Used in**: `jobs.salary_type`

---

#### `ExperienceLevel`
**Usage**: Required experience level

```sql
CREATE TYPE "ExperienceLevel" AS ENUM (
  'entry_level',
  'mid_level',
  'senior_level'
);
```

**Used in**: `jobs.experience_level`

---

### Organization & Access

#### `ClientStatus`
**Usage**: Client relationship status

```sql
CREATE TYPE "ClientStatus" AS ENUM (
  'active',
  'inactive',
  'prospect',
  'churned'
);
```

**Used in**: `agency_clients.status`

---

#### `BillingType`
**Usage**: Agency billing model

```sql
CREATE TYPE "BillingType" AS ENUM (
  'per_hire',
  'retainer',
  'project'
);
```

**Used in**: `agencies.billing_type`

---

#### `CompanySize`
**Usage**: Company employee count

```sql
CREATE TYPE "CompanySize" AS ENUM (
  'size_1_10',
  'size_11_50',
  'size_51_200',
  'size_201_500',
  'size_501_1000',
  'size_1000_plus'
);
```

**Used in**: `companies.size`

---

#### `RecruiterRole`
**Usage**: Role within agency

```sql
CREATE TYPE "RecruiterRole" AS ENUM (
  'owner',
  'admin',
  'recruiter',
  'viewer'
);
```

**Used in**: `agency_recruiters.role`

---

#### `UserRole`
**Usage**: Platform admin role

```sql
CREATE TYPE "UserRole" AS ENUM (
  'super_admin',
  'admin',
  'support'
);
```

**Used in**: `admin_users.role`, `bpoc_users.role`

---

### Candidate Profile

#### `Gender`
**Usage**: Gender selection (legacy)

```sql
CREATE TYPE "Gender" AS ENUM (
  'male',
  'female',
  'other',
  'prefer_not_to_say'
);
```

**Used in**: Various tables (legacy)

---

#### `gender_type`
**Usage**: Gender selection (current)

```sql
CREATE TYPE "gender_type" AS ENUM (
  'male',
  'female',
  'non_binary',
  'prefer_not_to_say',
  'other'
);
```

**Used in**: `candidate_profiles.gender`

---

#### `SkillProficiency`
**Usage**: Skill level

```sql
CREATE TYPE "SkillProficiency" AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);
```

**Used in**: `candidate_skills.proficiency_level`

---

### System & Errors

#### `Priority`
**Usage**: General priority level

```sql
CREATE TYPE "Priority" AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);
```

**Used in**: Various tables

---

#### `error_severity`
**Usage**: Error severity classification

```sql
CREATE TYPE "error_severity" AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'info'
);
```

**Used in**: `platform_errors.severity`

---

#### `error_category`
**Usage**: Error category classification

```sql
CREATE TYPE "error_category" AS ENUM (
  'api',
  'database',
  'auth',
  'ui',
  'validation',
  'external_service',
  'rate_limit',
  'permission',
  'unknown'
);
```

**Used in**: `platform_errors.category`

---

#### `error_status`
**Usage**: Error resolution status

```sql
CREATE TYPE "error_status" AS ENUM (
  'new',
  'analyzing',
  'diagnosed',
  'in_progress',
  'resolved',
  'wont_fix'
);
```

**Used in**: `platform_errors.status`

---

#### `SessionStatus`
**Usage**: Session state

```sql
CREATE TYPE "SessionStatus" AS ENUM (
  'started',
  'in_progress',
  'completed',
  'abandoned'
);
```

**Used in**: `anonymous_sessions.status`

---

## Summary

**Total ENUM Types**: 30

**By Category**:
- Application & Job: 4 types
- Interview: 3 types
- Onboarding: 2 types
- Work & Employment: 6 types
- Organization:  4 types
- Candidate: 3 types
- System & Errors: 4 types
- Other: 4 types
