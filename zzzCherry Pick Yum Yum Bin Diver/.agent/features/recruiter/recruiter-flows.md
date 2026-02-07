# Recruiter Functional Flow Requirements

> **Actions, States, Notifications & Data Requirements**
> 
> Version: 1.0 | Last Updated: January 5, 2026
> 
> **Scope:** BPOC Standard Recruiter (Full platform access, no API)
> **Note:** Email notifications excluded - will be added later

---

## Table of Contents

1. [Recruiter Role Overview](#recruiter-role-overview)
2. [Module Overview](#module-overview)
3. [Client Management Flow](#client-management-flow)
4. [Talent Pool Flow](#talent-pool-flow)
5. [Job Management Flow](#job-management-flow)
6. [Application Review Flow](#application-review-flow)
7. [The Recruiter Gate](#the-recruiter-gate)
8. [Pre-Screen Call Flow](#pre-screen-call-flow)
9. [Interview Management Flow](#interview-management-flow)
10. [Offer Management Flow](#offer-management-flow)
11. [Placement & Onboarding Flow](#placement--onboarding-flow)
12. [Pipeline View](#pipeline-view)
13. [Recordings Management](#recordings-management)
14. [Notification System](#notification-system)
15. [Data Recruiter Sees](#data-recruiter-sees)
16. [Actions Recruiter Can Take](#actions-recruiter-can-take)
17. [Database Requirements](#database-requirements)
18. [API Endpoints Required](#api-endpoints-required)

---

## Recruiter Role Overview

### What is a Recruiter?

- Employee of an Agency (e.g., ShoreAgents)
- Manages recruitment for multiple Clients
- Acts as gatekeeper between Candidates and Clients
- Has FULL visibility across all agency data

### Recruiter Capabilities

| Capability | Description |
|------------|-------------|
| **Full Talent Access** | Browse ALL candidates in talent pool |
| **Client Management** | Create and manage client companies |
| **Job Management** | Post jobs on behalf of clients |
| **Application Control** | Review, screen, release, reject |
| **Pre-Screen Calls** | Call candidates, record, rate |
| **Interview Scheduling** | Schedule client interviews |
| **Offer Management** | Create and send offers |
| **Placement Tracking** | Track hires through onboarding |

### Recruiter vs Client Access

| Feature | Recruiter | Client |
|---------|-----------|--------|
| See all candidates | ✅ | ✅ (Talent Pool) |
| See all applications | ✅ | ❌ (Only released) |
| Pre-screen candidates | ✅ | ❌ |
| Release to client | ✅ | ❌ |
| Post jobs | ✅ | ✅ |
| Schedule interviews | ✅ | ✅ |
| Send offers | ✅ | ✅ |
| Manage multiple clients | ✅ | ❌ (Own company only) |

---

## Module Overview

### Main Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RECRUITER PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MAIN                                                                       │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  📊 Dashboard      Overview, stats, quick actions, pending items            │
│  🏢 Clients        Manage client companies                                  │
│  👥 Talent Pool    Browse & search ALL candidates                           │
│  💼 Jobs           Create, manage, track job postings                       │
│  📋 Applications   Review applications, pre-screen, release/reject          │
│  📈 Pipeline       Visual kanban view of all applications                   │
│  📅 Interviews     Schedule & manage all interviews                         │
│  🎥 Recordings     View all call recordings & transcripts                   │
│  📨 Offers         Create, send, track offers                               │
│  🏆 Placements     Track successful hires & onboarding                      │
│                                                                             │
│  SETTINGS                                                                   │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  👤 Profile        Recruiter's own profile                                  │
│  🏛️ Agency         Agency settings & branding                               │
│  👥 Team           Manage team members & roles                              │
│  🔑 API Keys       Generate API keys (Enterprise only)                      │
│  ⚙️ Settings       General preferences & notifications                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Relationships

```
                              ┌─────────────┐
                              │   CLIENTS   │
                              └──────┬──────┘
                                     │
                                     │ has many
                                     ▼
                              ┌─────────────┐
                              │    JOBS     │
                              └──────┬──────┘
                                     │
                                     │ has many
                                     ▼
                              ┌─────────────┐
                              │APPLICATIONS │
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │ PRE-SCREENS │          │ INTERVIEWS  │          │   OFFERS    │
    │ (Recruiter) │          │  (Client)   │          │             │
    └─────────────┘          └─────────────┘          └──────┬──────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ PLACEMENTS  │
                              └─────────────┘
```

---

## Client Management Flow

### Create Client

**Trigger:** Recruiter clicks "Add Client"

**Process:**
1. Recruiter enters client details
2. System validates data
3. System creates client record
4. Client linked to recruiter's agency
5. Client appears in client list

**Required Fields:**
```
client {
  name: string (required)
  industry: string (optional)
  website: string (optional)
  contact_name: string (optional)
  contact_email: string (optional)
  contact_phone: string (optional)
  logo: file (optional)
  notes: text (optional)
}
```

**Client Data Structure:**
```
client {
  id: uuid
  agency_id: uuid
  company_id: uuid
  
  // Company Details
  name: string
  industry: string
  website: string
  logo_url: string
  description: text
  
  // Contact
  contact_name: string
  contact_email: string
  contact_phone: string
  
  // Status
  status: "active" | "inactive"
  
  // Stats (computed)
  job_count: integer
  active_job_count: integer
  total_applications: integer
  total_placements: integer
  
  // Timestamps
  created_at: timestamp
  updated_at: timestamp
}
```

### View Client

**Recruiter Sees:**
- Client details (name, industry, contact)
- Active jobs count
- Total applications count
- Placement history
- Recent activity
- Notes

### Edit Client

**Recruiter Can Update:**
- All client details
- Contact information
- Status (active/inactive)
- Notes

### Client Actions

| Action | Description |
|--------|-------------|
| **Create Client** | Add new client company |
| **Edit Client** | Update client details |
| **Deactivate Client** | Mark as inactive |
| **View Jobs** | See all jobs for client |
| **View Applications** | See all applications for client |
| **View Placements** | See all successful hires |
| **Add Note** | Add internal note about client |

---

## Talent Pool Flow

### Browse Talent Pool

**Purpose:** Find candidates directly (not through job applications)

**Recruiter Can:**
1. View all candidates in system
2. Search by name, email, keywords
3. Filter by multiple criteria
4. View full candidate profiles
5. Request interview directly
6. Add notes to candidates
7. Add to shortlist/favorites

### Search & Filters

| Filter | Options |
|--------|---------|
| **Keywords** | Free text search |
| **Skills** | Multi-select skills |
| **Experience** | Years range (0-1, 1-3, 3-5, 5+) |
| **Location** | City, province, country |
| **Work Preference** | Remote, onsite, hybrid |
| **Shift Preference** | Day, night, flexible |
| **Salary Range** | Min-max range |
| **Availability** | Immediate, 2 weeks, 1 month |
| **Has Resume** | Yes/No |
| **Assessment Scores** | Typing WPM, DISC type |
| **Last Active** | Date range |

### Candidate Profile View

**From Talent Pool, Recruiter Sees:**
```
candidate_profile {
  // Basic Info
  id: uuid
  full_name: string
  avatar_url: string
  headline: string
  location: string
  
  // Contact (visible to recruiter)
  email: string
  phone: string
  
  // Professional
  experience_years: decimal
  current_role: string
  current_company: string
  work_status: string
  salary_expectation: object
  notice_period_days: integer
  preferred_shift: string
  preferred_work_setup: string
  
  // Skills
  skills: array [{
    name: string
    proficiency: string
    years: decimal
    is_primary: boolean
  }]
  
  // Work History
  work_experiences: array [{
    role: string
    company: string
    start_date: date
    end_date: date
    is_current: boolean
    description: text
  }]
  
  // Education
  educations: array [{
    degree: string
    institution: string
    field: string
    year: integer
  }]
  
  // Assessments
  assessments: {
    typing: { wpm: integer, accuracy: decimal }
    disc: { type: string, scores: object }
  }
  
  // Resume
  resume: {
    url: string
    uploaded_at: timestamp
  }
  
  // AI Analysis
  ai_analysis: {
    overall_score: integer
    strengths: array
    summary: text
  }
  
  // Activity
  last_active: timestamp
  applications_count: integer
}
```

### Request Interview (Direct from Talent Pool)

**Trigger:** Recruiter clicks "Request Interview" on candidate

**Process:**
1. Recruiter selects client & job (or creates new)
2. System creates application record (if none exists)
3. Recruiter schedules interview directly
4. Candidate receives notification
5. Bypasses normal application flow

**This Flow:**
```
Talent Pool → Find Candidate → Request Interview → Schedule → Interview
                                      │
                                      ▼
                              (Skips pre-screen)
                              (Skips recruiter gate)
```

### Add to Shortlist

**Trigger:** Recruiter clicks "Add to Shortlist"

**Process:**
1. Recruiter selects which shortlist (can have multiple)
2. Candidate added to shortlist
3. Can add notes
4. Shortlist can be shared with clients later

---

## Job Management Flow

### Create Job

**Trigger:** Recruiter clicks "Create Job"

**Process:**
1. Recruiter selects client
2. Recruiter enters job details
3. System validates data
4. System generates slug
5. Job created with status = `draft`
6. Recruiter can publish or save as draft

**Required Fields:**
```
job {
  // Required
  client_id: uuid
  title: string
  description: text
  
  // Optional but recommended
  requirements: array of strings
  responsibilities: array of strings
  benefits: array of strings
  
  // Salary
  salary_min: decimal
  salary_max: decimal
  salary_type: "hourly" | "monthly" | "yearly"
  currency: string (default: "PHP")
  
  // Work Details
  work_arrangement: "remote" | "onsite" | "hybrid"
  work_type: "full_time" | "part_time" | "contract"
  shift: "day" | "night" | "flexible"
  experience_level: "entry_level" | "mid_level" | "senior_level"
  
  // Optional
  skills: array of strings
  application_deadline: date
  priority: "low" | "medium" | "high" | "urgent"
}
```

**Job Data Structure:**
```
job {
  id: uuid
  agency_client_id: uuid
  posted_by: uuid (recruiter)
  
  // Basic
  title: string
  slug: string
  description: text
  
  // Details
  requirements: jsonb array
  responsibilities: jsonb array
  benefits: jsonb array
  
  // Salary
  salary_min: decimal
  salary_max: decimal
  salary_type: string
  currency: string
  
  // Work
  work_arrangement: string
  work_type: string
  shift: string
  experience_level: string
  
  // Classification
  industry: string
  department: string
  
  // Status
  status: "draft" | "active" | "paused" | "closed" | "filled"
  priority: string
  
  // Dates
  application_deadline: date
  
  // Stats
  views: integer
  applicants_count: integer
  
  // Timestamps
  created_at: timestamp
  updated_at: timestamp
}
```

### Job Status Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  draft  │ ──▶ │ active  │ ──▶ │ paused  │ ──▶ │ closed  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                     │               │               │
                     │               │               ▼
                     │               │         ┌─────────┐
                     │               └───────▶ │ filled  │
                     │                         └─────────┘
                     │                               ▲
                     └───────────────────────────────┘
```

### Job Actions

| Action | Description | Status Change |
|--------|-------------|---------------|
| **Create** | Create new job | → `draft` |
| **Publish** | Make job live | → `active` |
| **Pause** | Temporarily hide | → `paused` |
| **Resume** | Reactivate paused job | → `active` |
| **Close** | Stop accepting applications | → `closed` |
| **Mark Filled** | Position filled | → `filled` |
| **Edit** | Update job details | (no change) |
| **Delete** | Remove job (if no applications) | (deleted) |
| **Duplicate** | Copy job to create new | (new draft) |

### View Job Applications

**From Job Detail, Recruiter Sees:**
- All applications for this job
- Grouped by status
- Quick stats (total, new, shortlisted, etc.)
- Filter by status

---

## Application Review Flow

### Application List View

**Recruiter Sees All Applications:**
```
application_list {
  applications: array [{
    id: uuid
    candidate: {
      name: string
      avatar: string
      headline: string
      location: string
    }
    job: {
      title: string
      client_name: string
    }
    status: string
    applied_at: timestamp
    
    // Recruiter-specific
    reviewed_by: string (if under review)
    reviewed_at: timestamp
    has_prescreen: boolean
    prescreen_rating: integer
    released_to_client: boolean
  }]
}
```

### Application Filters

| Filter | Options |
|--------|---------|
| **Client** | Select client |
| **Job** | Select job |
| **Status** | All statuses |
| **Released** | Released / Not released |
| **Pre-screened** | Yes / No |
| **Rating** | 1-5 stars |
| **Date Range** | Applied date |
| **Assigned To** | Recruiter |

### Application Detail View

**Recruiter Sees Full Application:**
```
application_detail {
  // Application Info
  id: uuid
  status: string
  applied_at: timestamp
  
  // Candidate (FULL access)
  candidate: {
    // All candidate profile data
    // Including contact info
  }
  
  // Job
  job: {
    title: string
    client: object
    requirements: array
  }
  
  // Resume
  resume: {
    url: string
    ai_analysis: object
  }
  
  // Pre-screen Data
  prescreens: array [{
    id: uuid
    call_type: string
    scheduled_at: timestamp
    status: string
    rating: integer
    notes: text
    duration_seconds: integer
    recording: object
    transcript: object
  }]
  
  // Recruiter Notes
  recruiter_notes: text
  
  // Gate Status
  released_to_client: boolean
  released_at: timestamp
  released_by: uuid
  // Sharing is per-call (video_call_rooms.share_with_client/share_with_candidate)
  // When TRUE, client/candidate can see ALL artifacts for that call (recording/transcript/notes)
  
  // Client Feedback (if released)
  client_notes: text
  client_rating: integer
  // tags removed (notes + rating only)
  
  // Interviews
  interviews: array
  
  // Offers
  offers: array
  
  // Timeline
  timeline: array of events
}
```

### Application Actions

| Action | Description | Who Can Do |
|--------|-------------|------------|
| **View** | See full application | Recruiter |
| **Add Note** | Add recruiter notes | Recruiter |
| **Schedule Pre-Screen** | Book pre-screen call | Recruiter |
| **Quick Call** | Call candidate now | Recruiter |
| **Update Status** | Change status | Recruiter |
| **Release to Client** | Make visible to client | Recruiter |
| **Send Back** | Hide from client again | Recruiter/Client |
| **Reject** | Reject application | Recruiter |
| **Schedule Interview** | Book client interview | Recruiter |

---

## The Recruiter Gate

### Purpose

The Recruiter Gate controls which applications clients can see. By default, all applications are hidden from clients until a recruiter releases them.

### Gate Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          THE RECRUITER GATE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        CANDIDATE APPLIES                                    │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────┐                                      │
│                    │   APPLICATION   │                                      │
│                    │    CREATED      │                                      │
│                    │                 │                                      │
│                    │ released = FALSE│                                      │
│                    └────────┬────────┘                                      │
│                             │                                              │
│          ┌──────────────────┴──────────────────┐                           │
│          │          RECRUITER REVIEW           │                           │
│          │  ┌────────────────────────────────┐ │                           │
│          │  │  • View application            │ │                           │
│          │  │  • Review candidate profile    │ │                           │
│          │  │  • Conduct pre-screen call     │ │                           │
│          │  │  • Rate candidate (1-5)        │ │                           │
│          │  │  • Add notes                   │ │                           │
│          │  └────────────────────────────────┘ │                           │
│          └──────────────────┬──────────────────┘                           │
│                             │                                              │
│               ┌─────────────┴─────────────┐                                │
│               │                           │                                │
│               ▼                           ▼                                │
│      ┌─────────────────┐         ┌─────────────────┐                       │
│      │     REJECT      │         │    RELEASE      │                       │
│      │                 │         │   TO CLIENT     │                       │
│      │ • Add reason    │         │                 │                       │
│      │ • Notify cand.  │         │ • Set released  │                       │
│      └─────────────────┘         │   = TRUE        │                       │
│                                  │ • Choose what   │                       │
│                                  │   to share:     │                       │
│                                  │   □ Video       │                       │
│                                  │   □ Notes       │                       │
│                                  └────────┬────────┘                       │
│                                           │                                │
│                                           ▼                                │
│                                  ┌─────────────────┐                       │
│                                  │  CLIENT CAN     │                       │
│                                  │  NOW SEE        │                       │
│                                  │  APPLICATION    │                       │
│                                  └─────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Release to Client

**Trigger:** Recruiter clicks "Release to Client"

**Process:**
1. Recruiter reviews application (pre-screen optional but recommended)
2. Recruiter clicks "Release to Client"
3. Modal appears with options:
   - Select calls to share (each call: Share with Client toggle, Share with Candidate toggle)
   - Update status? (dropdown)
4. Recruiter confirms
5. System updates `released_to_client = TRUE`
6. Application now visible in client dashboard

**Release Data:**
```
release_action {
  application_id: uuid
  released_by: uuid (recruiter)
  released_at: timestamp
  share_calls_with_client: array of room_ids or [{room_id, share}]
  share_calls_with_candidate: array of room_ids or [{room_id, share}]
  status: string (e.g., "shortlisted")
}
```

### Send Back to Recruiter

**Trigger:** Client clicks "Send Back" OR Recruiter recalls

**Process:**
1. Application hidden from client again
2. `released_to_client = FALSE`
3. Status reverts (e.g., back to `under_review`)
4. Reason logged in timeline

### Gate Fields

```
application_gate_fields {
  released_to_client: boolean (default: FALSE)
  released_at: timestamp
  released_by: uuid
  // sharing is per call (video_call_rooms.share_with_client/share_with_candidate)
}
```

---

## Pre-Screen Call Flow

### Purpose

Pre-screen calls are conducted by recruiters to assess candidates BEFORE releasing to clients. This is the primary quality control mechanism.

### Pre-Screen Types

| Type | Description |
|------|-------------|
| **Quick Call** | Call candidate immediately (no schedule) |
| **Scheduled** | Book a specific time |

### Quick Call Flow

**Trigger:** Recruiter clicks "Call Now" on application

**Process:**
1. System creates video room
2. System sends real-time notification to candidate
3. Candidate's device rings
4. If candidate answers → connected
5. If no answer → missed call logged
6. After call → recruiter adds rating & notes

```
Recruiter clicks "Call Now"
         │
         ▼
   ┌─────────────┐
   │ Create Room │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐        ┌─────────────┐
   │   Notify    │ ─────▶ │  Candidate  │
   │  Candidate  │        │   Ringing   │
   └──────┬──────┘        └──────┬──────┘
          │                      │
          │               ┌──────┴──────┐
          │               │             │
          │               ▼             ▼
          │         ┌─────────┐   ┌─────────┐
          │         │ Answer  │   │ Decline │
          │         └────┬────┘   └────┬────┘
          │              │             │
          ▼              ▼             ▼
   ┌─────────────┐  ┌─────────┐  ┌─────────┐
   │  Recruiter  │  │Connected│  │ Missed  │
   │   Waiting   │  │  Call   │  │  Call   │
   └─────────────┘  └────┬────┘  └─────────┘
                         │
                         ▼
                   ┌─────────┐
                   │Call Ends│
                   └────┬────┘
                        │
                        ▼
                   ┌─────────┐
                   │  Rate   │
                   │ & Notes │
                   └─────────┘
```

### Scheduled Pre-Screen Flow

**Trigger:** Recruiter clicks "Schedule Pre-Screen"

**Process:**
1. Recruiter selects date/time
2. System creates video room (scheduled)
3. System notifies candidate
4. Both parties receive reminders
5. At scheduled time → both join
6. After call → recruiter adds rating & notes

### During Pre-Screen

**Recruiter Can:**
- See candidate video/audio
- Toggle own mic/camera
- Share screen
- View candidate profile (side panel)
- Take notes during call
- End call

**Recruiter Sees:**
- Candidate video feed
- Call duration
- Candidate's application context
- Quick access to candidate profile

### After Pre-Screen

**Recruiter Must:**
1. Rate candidate (1-5 stars)
2. Add notes (what was discussed, assessment)
3. Decide outcome: Pass / Fail / Needs Follow-up

**Pre-Screen Data:**
```
prescreen {
  id: uuid
  application_id: uuid
  room_id: uuid
  
  // Scheduling
  scheduled_at: timestamp
  
  // Call Data
  started_at: timestamp
  ended_at: timestamp
  duration_seconds: integer
  
  // Assessment
  rating: integer (1-5)
  notes: text
  outcome: "passed" | "failed" | "needs_followup"
  
  // Recording
  recording_url: string
  transcript_id: uuid
  
  // Metadata
  conducted_by: uuid (recruiter)
  created_at: timestamp
}
```

### Pre-Screen Outcomes

| Outcome | Description | Next Action |
|---------|-------------|-------------|
| **Passed** | Good candidate | Release to client |
| **Failed** | Not suitable | Reject application |
| **Needs Follow-up** | More info needed | Schedule another call |

---

## Interview Management Flow

### Interview Types (Recruiter Creates)

| Type | Description | Conducted By |
|------|-------------|--------------|
| `recruiter_prescreen` | Initial screening | Recruiter |
| `recruiter_round_1` | Recruiter deep-dive | Recruiter |
| `recruiter_round_2` | Recruiter follow-up | Recruiter |
| `client_round_1` | Client first interview | Client |
| `client_round_2` | Client second interview | Client |
| `client_final` | Client final interview | Client |

### Schedule Interview

**Trigger:** Recruiter clicks "Schedule Interview"

**Process:**
1. Recruiter selects application
2. Recruiter selects interview type
3. Recruiter selects date/time
4. Recruiter enters interviewer details
5. System creates interview + video room
6. System notifies candidate
7. System notifies client (if client interview)

**Interview Data:**
```
interview {
  id: uuid
  application_id: uuid
  
  // Type
  interview_type: string
  
  // Scheduling
  scheduled_at: timestamp (UTC)
  duration_minutes: integer
  
  // Timezone Display
  client_timezone: string
  scheduled_at_client_local: string
  scheduled_at_ph: string
  
  // Location
  location: string
  meeting_link: string
  video_room_id: uuid
  
  // Participants
  interviewer_id: uuid
  interviewer_name: string
  
  // Status
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show" | "rescheduled"
  
  // Outcome (after completion)
  outcome: "passed" | "failed" | "pending_decision" | "needs_followup"
  rating: integer (1-5)
  feedback: jsonb
  notes: text
  
  // Timestamps
  started_at: timestamp
  ended_at: timestamp
  created_at: timestamp
}
```

### Interview Status Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│ scheduled │ ──▶ │ confirmed │ ──▶ │in_progress│
└───────────┘     └───────────┘     └───────────┘
      │                 │                 │
      │                 │                 ▼
      │                 │          ┌───────────┐
      │                 │          │ completed │
      │                 │          └───────────┘
      │                 │
      ▼                 ▼
┌───────────┐     ┌───────────┐
│ cancelled │     │  no_show  │
└───────────┘     └───────────┘
      │
      ▼
┌───────────┐
│rescheduled│
└───────────┘
```

### Interview Actions

| Action | Description | Who |
|--------|-------------|-----|
| **Schedule** | Create interview | Recruiter |
| **Reschedule** | Change date/time | Recruiter |
| **Cancel** | Cancel interview | Recruiter |
| **Join** | Enter video call | Recruiter/Client |
| **Mark No-Show** | Candidate didn't attend | Recruiter/Client |
| **Add Outcome** | Record result | Recruiter/Client |
| **Add Feedback** | Detailed feedback | Recruiter/Client |

### View All Interviews

**Recruiter Sees:**
- All interviews (all clients)
- Filter by: client, status, date, type
- Calendar view option
- List view option
- Quick actions

---

## Offer Management Flow

### Create Offer

**Trigger:** Recruiter clicks "Send Offer" on application

**Process:**
1. Recruiter enters offer details
2. System validates data
3. Offer created with status = `draft` or `sent`
4. Candidate receives notification
5. Recruiter tracks offer status

**Offer Data:**
```
offer {
  id: uuid
  application_id: uuid
  
  // Compensation
  salary_offered: decimal
  salary_type: "hourly" | "monthly" | "yearly"
  currency: string
  
  // Terms
  start_date: date
  benefits_offered: jsonb array
  additional_terms: text
  
  // Status
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "negotiating" | "expired" | "withdrawn"
  
  // Tracking
  sent_at: timestamp
  viewed_at: timestamp
  responded_at: timestamp
  expires_at: timestamp
  
  // Response
  candidate_response: text
  rejection_reason: text
  
  // Counter Offers
  counter_offers: jsonb array [{
    requested_salary: decimal
    candidate_message: text
    submitted_at: timestamp
    response: string
    response_at: timestamp
  }]
  
  // Metadata
  created_by: uuid
  created_at: timestamp
}
```

### Offer Status Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  draft  │ ──▶ │  sent   │ ──▶ │ viewed  │
└─────────┘     └─────────┘     └─────────┘
                     │               │
                     │       ┌───────┴───────┐
                     │       │               │
                     │       ▼               ▼
                     │  ┌─────────┐    ┌───────────┐
                     │  │accepted │    │negotiating│
                     │  └─────────┘    └─────┬─────┘
                     │                       │
                     │       ┌───────────────┤
                     │       │               │
                     │       ▼               ▼
                     │  ┌─────────┐    ┌─────────┐
                     │  │declined │    │new offer│
                     │  └─────────┘    └─────────┘
                     │
                     ▼
                ┌─────────┐
                │ expired │
                └─────────┘
                
                ┌─────────┐
                │withdrawn│ (recruiter can withdraw anytime)
                └─────────┘
```

### Handle Counter Offer

**Trigger:** Candidate submits counter offer

**Recruiter Options:**
1. **Accept Counter** → Offer updated, status = `accepted`
2. **Reject Counter** → Status = `declined` OR send new offer
3. **New Counter** → Send revised offer with new terms

### Offer Actions

| Action | Description |
|--------|-------------|
| **Create Offer** | Draft new offer |
| **Send Offer** | Send to candidate |
| **Withdraw Offer** | Cancel offer |
| **Accept Counter** | Accept candidate's counter |
| **Reject Counter** | Decline counter |
| **Send New Offer** | Revised offer after negotiation |
| **Extend Deadline** | Give more time |

---

## Placement & Onboarding Flow

### What is a Placement?

A Placement is created when a candidate accepts an offer. It tracks the journey from acceptance through onboarding to Day 1 and beyond.

### Placement Status Flow

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ offer_accepted│ ──▶ │  onboarding   │ ──▶ │onboard_complete│
└───────────────┘     └───────────────┘     └───────────────┘
                            │                      │
                            │                      ▼
                            │               ┌───────────────┐
                            │               │    started    │
                            │               └───────────────┘
                            │
                            ▼
                      ┌───────────────┐
                      │   no_show     │
                      └───────────────┘
```

### Placement Data

```
placement {
  id: uuid
  application_id: uuid
  offer_id: uuid
  
  // Status
  status: "onboarding" | "onboard_complete" | "started" | "no_show" | "terminated"
  
  // Key Dates
  offer_accepted_at: timestamp
  start_date: date
  onboarding_completed_at: timestamp
  started_at: timestamp
  
  // Contract
  contract_signed: boolean
  contract_signed_at: timestamp
  
  // Onboarding Tasks
  onboarding_tasks: array [{
    id: uuid
    title: string
    type: string
    is_required: boolean
    due_date: date
    status: "pending" | "submitted" | "approved" | "rejected"
    submitted_at: timestamp
    reviewed_at: timestamp
    reviewer_notes: text
  }]
  
  // Progress
  onboarding_progress: integer (0-100)
  
  // Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

### Onboarding Task Management

**Recruiter Can:**
1. Create onboarding tasks
2. Assign tasks to candidate
3. Set due dates
4. Review submitted tasks
5. Approve or reject tasks
6. Mark onboarding complete

**Task Types:**
| Type | Description |
|------|-------------|
| `document_upload` | Upload file (ID, tax forms, etc.) |
| `form_fill` | Complete a form |
| `e_sign` | Sign document electronically |
| `acknowledgment` | Read and confirm |
| `training` | Complete training module |
| `information` | Read information |

### Mark Onboarding Complete

**Trigger:** All required tasks complete, recruiter confirms

**Process:**
1. Recruiter reviews all submitted tasks
2. Recruiter marks onboarding complete
3. Status → `onboard_complete`
4. Candidate notified: "Ready for Day 1"

### Confirm Day 1

**Trigger:** Candidate's start date arrives

**Recruiter Actions:**
- **Mark Started** → Status = `started` (success!)
- **Mark No-Show** → Status = `no_show` (candidate didn't show)

### Placement Actions

| Action | Description |
|--------|-------------|
| **Create Task** | Add onboarding task |
| **Review Task** | Approve/reject submitted task |
| **Mark Complete** | Complete onboarding |
| **Confirm Started** | Candidate showed up Day 1 |
| **Mark No-Show** | Candidate didn't show |
| **Add Note** | Add placement notes |

---

## Pipeline View

### Purpose

Visual kanban-style view of all applications across stages.

### Pipeline Columns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PIPELINE VIEW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │   NEW   │ │SCREENING│ │SHORTLIST│ │INTERVIEW│ │  OFFER  │ │  HIRED  │   │
│ │   (12)  │ │   (8)   │ │   (5)   │ │   (3)   │ │   (2)   │ │   (1)   │   │
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤   │
│ │         │ │         │ │         │ │         │ │         │ │         │   │
│ │ [Card]  │ │ [Card]  │ │ [Card]  │ │ [Card]  │ │ [Card]  │ │ [Card]  │   │
│ │ [Card]  │ │ [Card]  │ │ [Card]  │ │ [Card]  │ │ [Card]  │ │         │   │
│ │ [Card]  │ │ [Card]  │ │ [Card]  │ │ [Card]  │ │         │ │         │   │
│ │ [Card]  │ │ [Card]  │ │ [Card]  │ │         │ │         │ │         │   │
│ │  ...    │ │  ...    │ │ [Card]  │ │         │ │         │ │         │   │
│ │         │ │         │ │         │ │         │ │         │ │         │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Card

Each card shows:
```
pipeline_card {
  candidate_name: string
  candidate_avatar: string
  job_title: string
  client_name: string
  applied_at: timestamp
  days_in_stage: integer
  has_prescreen: boolean
  prescreen_rating: integer
  next_action: string (e.g., "Schedule Interview")
}
```

### Pipeline Actions

| Action | Description |
|--------|-------------|
| **Drag & Drop** | Move card between columns |
| **Click Card** | Open application detail |
| **Filter** | Filter by client, job, recruiter |
| **Sort** | Sort within columns |

---

## Recordings Management

### View All Recordings

**Recruiter Can See:**
- All recordings from their agency
- Filter by: client, job, candidate, date, type
- Search by candidate name

### Recording Data

```
recording {
  id: uuid
  room_id: uuid
  application_id: uuid
  
  // Video
  playback_url: string
  download_url: string
  duration_seconds: integer
  
  // Context
  call_type: string
  candidate_name: string
  job_title: string
  client_name: string
  conducted_by: string
  
  // Transcript
  has_transcript: boolean
  transcript_id: uuid
  
  // Timestamps
  recorded_at: timestamp
}
```

### Transcript View

**Recruiter Sees:**
```
transcript {
  id: uuid
  recording_id: uuid
  
  full_text: text
  summary: text (AI-generated)
  key_points: array of strings
  
  // Segments (timestamped)
  segments: array [{
    start: decimal
    end: decimal
    speaker: string
    text: string
  }]
}
```

### Recording Actions

| Action | Description |
|--------|-------------|
| **Play** | Watch recording |
| **Download** | Download video file |
| **View Transcript** | Read transcript |
| **Share with Client** | Toggle sharing |
| **Delete** | Remove recording |

---

## Notification System

### Recruiter Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| `new_application` | Candidate applies | 🟢 Normal |
| `application_withdrawn` | Candidate withdraws | 🟢 Normal |
| `prescreen_scheduled` | Pre-screen booked | 🟢 Normal |
| `prescreen_reminder` | Before pre-screen | 🟠 High |
| `prescreen_missed` | Candidate missed call | 🟠 High |
| `interview_scheduled` | Interview booked | 🟢 Normal |
| `interview_reminder` | Before interview | 🟠 High |
| `interview_completed` | Interview done | 🟢 Normal |
| `interview_no_show` | Candidate no-show | 🟠 High |
| `offer_viewed` | Candidate viewed offer | 🟢 Normal |
| `offer_accepted` | Candidate accepted | 🔴 Critical |
| `offer_declined` | Candidate declined | 🟠 High |
| `counter_received` | Counter offer received | 🟠 High |
| `offer_expiring` | Offer near expiry | 🟠 High |
| `task_submitted` | Onboarding task submitted | 🟢 Normal |
| `onboarding_complete` | All tasks done | 🟢 Normal |
| `day1_reminder` | Day before start | 🟠 High |
| `candidate_started` | Candidate started | 🔴 Critical |
| `candidate_no_show` | Didn't show Day 1 | 🔴 Critical |

### Notification Data

```
notification {
  id: uuid
  recruiter_id: uuid
  type: string
  title: string
  message: string
  action_url: string
  related_id: uuid
  related_type: string
  is_read: boolean
  is_urgent: boolean
  created_at: timestamp
}
```

---

## Data Recruiter Sees

### Full Access Data

| Data | Access Level |
|------|--------------|
| **All Candidates** | Full profile + contact info |
| **All Applications** | Full details + internal notes |
| **All Clients** | Full details |
| **All Jobs** | Full details |
| **All Interviews** | Full details |
| **All Recordings** | Full access |
| **All Transcripts** | Full access |
| **All Offers** | Full details |
| **All Placements** | Full details |
| **Team Members** | Basic info |
| **Agency Settings** | Full access |

### Data Hidden from Recruiter

| Hidden Data | Reason |
|-------------|--------|
| Other agencies' data | Multi-tenant isolation |
| Platform admin data | Admin only |
| Billing/financial | Admin only |

---

## Actions Recruiter Can Take

### Complete Action List

| Category | Actions |
|----------|---------|
| **Clients** | Create, Edit, Deactivate, View, Add Note |
| **Talent Pool** | Search, Filter, View Profile, Request Interview, Add to Shortlist |
| **Jobs** | Create, Edit, Publish, Pause, Close, Fill, Delete, Duplicate |
| **Applications** | View, Add Note, Update Status, Schedule Pre-Screen, Quick Call, Release, Reject |
| **Pre-Screens** | Schedule, Call Now, Join, Rate, Add Notes |
| **Interviews** | Schedule, Reschedule, Cancel, Join, Mark No-Show, Add Outcome |
| **Offers** | Create, Send, Withdraw, Accept Counter, Reject Counter, Extend |
| **Placements** | Create Task, Review Task, Mark Complete, Confirm Started, Mark No-Show |
| **Recordings** | View, Download, Share, Delete |
| **Settings** | Update Profile, Manage Team, Configure Agency |

---

## Database Requirements

### Tables Recruiter Interacts With

| Table | Access |
|-------|--------|
| `agency_clients` | Full CRUD |
| `companies` | Read + Create |
| `jobs` | Full CRUD |
| `job_applications` | Full CRUD |
| `job_interviews` | Full CRUD |
| `job_offers` | Full CRUD |
| `video_call_rooms` | Full CRUD |
| `video_call_recordings` | Read + Delete |
| `video_call_transcripts` | Read |
| `candidates` | Read |
| `candidate_profiles` | Read |
| `placements` | Full CRUD |
| `onboarding_tasks` | Full CRUD |
| `notifications` | Read + Update |
| `application_activity_timeline` | Read + Create |
| `agency_recruiters` | Read (own) + Update (own) |
| `agencies` | Read + Update (settings) |

---

## API Endpoints Required

### Recruiter-Facing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| **Clients** | | |
| `/recruiter/clients` | GET | List clients |
| `/recruiter/clients` | POST | Create client |
| `/recruiter/clients/:id` | GET | Get client |
| `/recruiter/clients/:id` | PATCH | Update client |
| **Talent Pool** | | |
| `/recruiter/candidates` | GET | Search candidates |
| `/recruiter/candidates/:id` | GET | Get candidate profile |
| `/recruiter/candidates/:id/request-interview` | POST | Request interview |
| **Jobs** | | |
| `/recruiter/jobs` | GET | List jobs |
| `/recruiter/jobs` | POST | Create job |
| `/recruiter/jobs/:id` | GET | Get job |
| `/recruiter/jobs/:id` | PATCH | Update job |
| `/recruiter/jobs/:id` | DELETE | Delete job |
| **Applications** | | |
| `/recruiter/applications` | GET | List applications |
| `/recruiter/applications/:id` | GET | Get application |
| `/recruiter/applications/:id` | PATCH | Update application |
| `/recruiter/applications/:id/release` | POST | Release to client |
| `/recruiter/applications/:id/reject` | POST | Reject application |
| `/recruiter/applications/:id/prescreen` | POST | Schedule pre-screen |
| `/recruiter/applications/:id/quick-call` | POST | Start quick call |
| **Interviews** | | |
| `/recruiter/interviews` | GET | List interviews |
| `/recruiter/interviews` | POST | Schedule interview |
| `/recruiter/interviews/:id` | PATCH | Update interview |
| `/recruiter/interviews/:id/cancel` | POST | Cancel interview |
| **Offers** | | |
| `/recruiter/offers` | GET | List offers |
| `/recruiter/offers` | POST | Create offer |
| `/recruiter/offers/:id` | GET | Get offer |
| `/recruiter/offers/:id` | PATCH | Update offer |
| `/recruiter/offers/:id/withdraw` | POST | Withdraw offer |
| **Placements** | | |
| `/recruiter/placements` | GET | List placements |
| `/recruiter/placements/:id` | GET | Get placement |
| `/recruiter/placements/:id/tasks` | GET | List tasks |
| `/recruiter/placements/:id/tasks` | POST | Create task |
| `/recruiter/placements/:id/tasks/:taskId` | PATCH | Review task |
| `/recruiter/placements/:id/complete` | POST | Mark complete |
| `/recruiter/placements/:id/started` | POST | Confirm started |
| `/recruiter/placements/:id/no-show` | POST | Mark no-show |
| **Recordings** | | |
| `/recruiter/recordings` | GET | List recordings |
| `/recruiter/recordings/:id` | GET | Get recording |
| `/recruiter/recordings/:id/transcript` | GET | Get transcript |
| **Notifications** | | |
| `/recruiter/notifications` | GET | List notifications |
| `/recruiter/notifications/:id/read` | POST | Mark read |
| **Video** | | |
| `/recruiter/video/rooms` | POST | Create room |
| `/recruiter/video/rooms/:id/join` | GET | Get join URL |

---

## Summary

### Recruiter Can DO:

1. ✅ Create and manage clients
2. ✅ Browse entire talent pool
3. ✅ Search and filter candidates
4. ✅ Request interviews directly from talent pool
5. ✅ Create and manage jobs
6. ✅ Review all applications
7. ✅ Conduct pre-screen calls (quick or scheduled)
8. ✅ Rate and add notes to candidates
9. ✅ Release applications to clients (THE GATE)
10. ✅ Reject applications with feedback
11. ✅ Schedule client interviews
12. ✅ Create and send offers
13. ✅ Handle counter offers
14. ✅ Manage onboarding tasks
15. ✅ Confirm Day 1 started
16. ✅ View all recordings and transcripts
17. ✅ Manage team members
18. ✅ Configure agency settings

### Recruiter Can SEE:

1. ✅ All candidates (full profiles + contact)
2. ✅ All clients
3. ✅ All jobs
4. ✅ All applications (including unreleased)
5. ✅ All internal notes
6. ✅ All pre-screen data
7. ✅ All interviews
8. ✅ All offers
9. ✅ All placements
10. ✅ All recordings
11. ✅ All transcripts
12. ✅ Team members
13. ✅ Agency analytics

### Recruiter CANNOT See:

1. ❌ Other agencies' data
2. ❌ Platform-level admin data
3. ❌ Billing information (unless admin)

---

*End of Recruiter Functional Flow Requirements*
