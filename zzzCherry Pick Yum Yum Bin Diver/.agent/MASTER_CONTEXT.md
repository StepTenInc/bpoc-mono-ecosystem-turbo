# BPOC MASTER CONTEXT

> **The Single Source of Truth for BPOC Platform Development**
> 
> Last Updated: January 15, 2026
> 
> This document contains everything a developer or AI agent needs to understand the BPOC platform architecture, features, workflows, and codebase structure.

---

## TABLE OF CONTENTS

1. [Platform Overview](#platform-overview)
2. [Core Concepts](#core-concepts)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Feature Architecture](#feature-architecture)
5. [Database Schema Overview](#database-schema-overview)
6. [Key Workflows](#key-workflows)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)
9. [Development Guidelines](#development-guidelines)
10. [Testing Strategy](#testing-strategy)
11. [Quick Reference](#quick-reference)

---

## PLATFORM OVERVIEW

### What is BPOC?

**BPOC** is a comprehensive **Business Process Outsourcing Careers Platform** that connects Filipino talent with global BPO opportunities. It serves as the underlying infrastructure for recruitment agencies to manage their entire hiring pipeline.

### Platform Identity

- **Core Product**: Careers platform infrastructure
- **Primary Users**: Recruitment agencies, their clients, and job seekers
- **Key Value**: End-to-end recruitment management from job posting to Day 1
- **Business Model**: Multi-tenant SaaS for recruitment agencies

### Key Capabilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    BPOC PLATFORM CAPABILITIES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏢 AGENCY MANAGEMENT                                           │
│     • Multi-tenant architecture                                 │
│     • Standard & Enterprise tiers                               │
│     • Team management & permissions                             │
│     • API access for whitelabel portals                         │
│                                                                 │
│  👥 TALENT POOL                                                 │
│     • Candidate profiles & resumes                              │
│     • Skills assessment (Typing, DISC personality)              │
│     • AI-powered resume analysis                                │
│     • Advanced search & filtering                               │
│                                                                 │
│  💼 JOB MANAGEMENT                                              │
│     • Job posting & management                                  │
│     • Application tracking                                      │
│     • Automated candidate matching                              │
│     • Pipeline visualization                                    │
│                                                                 │
│  🎥 VIDEO INFRASTRUCTURE                                        │
│     • Daily.co integration                                      │
│     • Pre-screen & interview calls                              │
│     • Recording & transcription                                 │
│     • Real-time call notifications                              │
│                                                                 │
│  📨 OFFER MANAGEMENT                                            │
│     • Digital offer letters                                     │
│     • Counter-offer negotiation                                 │
│     • E-signature integration                                   │
│     • Acceptance tracking                                       │
│                                                                 │
│  📋 ONBOARDING                                                  │
│     • Task management                                           │
│     • Document collection                                       │
│     • E-signature workflows                                     │
│     • Day 1 confirmation                                        │
│                                                                 │
│  ⚖️ LABOR LAW COMPLIANCE                                        │
│     • Philippine Labor Code assistant                           │
│     • DOLE compliance guidance                                  │
│     • HR knowledge base                                         │
│     • AI-powered Q&A                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## CORE CONCEPTS

### 1. Multi-Tenant Architecture

BPOC operates as a multi-tenant platform where each **Agency** has its own isolated environment:

```
BPOC Platform
├── Agency A (ShoreAgents)
│   ├── Recruiters (3 users)
│   ├── Clients (15 companies)
│   ├── Jobs (47 active)
│   └── Applications (2,341)
├── Agency B (RecruitCo)
│   ├── Recruiters (2 users)
│   ├── Clients (8 companies)
│   ├── Jobs (23 active)
│   └── Applications (892)
└── Agency C (TalentHub)
    ├── Recruiters (5 users)
    ├── Clients (32 companies)
    ├── Jobs (68 active)
    └── Applications (4,127)
```

### 2. The Recruiter Gate

**Critical Concept**: Applications are hidden from clients by default.

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE RECRUITER GATE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CANDIDATE APPLIES                                              │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │ released = FALSE │  ← Client CANNOT see                      │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ RECRUITER REVIEW │                                           │
│  │ • Pre-screen call│                                           │
│  │ • Quality check  │                                           │
│  │ • Rating & notes │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ released = TRUE  │  ← Client CAN NOW see                     │
│  └──────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Database Field**: `job_applications.released_to_client` (BOOLEAN)

### 3. Two Paths to Hire

Clients have two ways to find and hire candidates:

#### Path 1: Normal Application Flow (with Recruiter Gate)
```
Job Post → Candidates Apply → Recruiter Pre-screens → Release to Client → 
Client Interview → Offer → Hire
```

#### Path 2: Direct Talent Pool (skip the process)
```
Client Browses Talent Pool → Request Interview → Interview → Offer → Hire
```

### 4. Agency Tiers

| Tier | Access | Key Features |
|------|--------|--------------|
| **Standard** | BPOC platform UI | Basic recruiter dashboard, uses BPOC branding |
| **Enterprise** | Full API + Whitelabel | Build branded portal, API access, full talent pool search |

### 5. Video Call Sharing

**Per-Call Control**: Each video call has independent sharing toggles:

- `video_call_rooms.share_with_client` (BOOLEAN) - When TRUE, client can see ALL artifacts for that specific call
- `video_call_rooms.share_with_candidate` (BOOLEAN) - When TRUE, candidate can see ALL artifacts for that specific call

**Artifacts include**: Recording, Transcript, Notes, Rating

---

## USER ROLES & PERMISSIONS

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      BPOC ADMIN                                 │
│              (Platform Oversight)                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AGENCY                                    │
│        (ShoreAgents, Recruitment Co, etc.)                      │
├─────────────────────────────────────────────────────────────────┤
│          │                                │                     │
│          ▼                                ▼                     │
│    RECRUITER                          CLIENT                    │
│    (Agency Staff)                   (Companies)                 │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CANDIDATE                                   │
│              (Job Seekers / Talent)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Candidate (Job Seeker)

**Dashboard Location**: `/candidate/dashboard`

**Can Do**:
- Create and manage profile
- Upload resume(s)
- Take assessments (Typing, DISC personality)
- Browse and apply to jobs
- Receive and answer video calls
- View application status and timeline
- Accept/decline/counter offers
- Complete onboarding tasks
- Access HR Labor Law Assistant

**Can See**:
- Their own applications and status
- Job listings
- Interview schedules
- Offers and offer history
- Call recordings (if shared)
- Transcripts (if shared)

**Cannot See**:
- Other candidates
- Recruiter internal notes
- Pre-gate application details
- Client discussions

### Recruiter (Agency Staff)

**Dashboard Location**: `/recruiter/dashboard`

**Can Do**:
- Manage clients
- Post jobs on behalf of clients
- View ALL candidates (talent pool)
- Review ALL applications for their agency
- Conduct pre-screen video calls
- Rate and take notes on candidates
- **Control the Recruiter Gate** (release/reject)
- Schedule client interviews
- Send offers
- Manage onboarding tasks

**Can See**:
- All jobs across all their clients
- All applications for their agency
- Full candidate profiles + contact info
- All video call recordings
- All transcripts
- Client feedback
- Performance analytics for their agency

**Cannot See**:
- Other agencies' data
- Platform admin data
- Billing information

### Client (Hiring Company)

**Dashboard Location**: `/client/dashboard` (via Agency Portal)

**Can Do**:
- Post jobs
- Browse **entire talent pool**
- View full candidate profiles
- Request interviews directly (skip normal flow)
- Schedule interviews
- Send offers
- Hire candidates

**Can See**:
- Their own jobs
- Applications **released to them** by recruiters
- Full talent pool (can browse all candidates)
- Interview schedules
- Offers and responses
- Shared call recordings

**Cannot See**:
- Applications not yet released by recruiter
- Other clients' data
- Recruiter internal notes (unless shared)

### Admin (BPOC Internal Team)

**Dashboard Location**: `/admin/dashboard`

**Can Do**:
- View ALL agencies and their data
- View ALL candidates platform-wide
- View ALL jobs, applications, interviews, offers
- Suspend/reactivate agencies or candidates
- Override statuses (rare, exceptional cases)
- Generate platform-wide reports
- Monitor insights and anomalies
- Provide support and intervention

**Can See**:
- Everything across all agencies
- Cross-agency candidate applications
- Platform-wide analytics
- Audit logs
- Performance leaderboards

**Does NOT Typically Do**:
- Day-to-day recruitment operations
- Conduct pre-screens
- Release applications
- Send offers

**Philosophy**: Oversight + Support, NOT Operations

---

## FEATURE ARCHITECTURE

### Candidate Features

Located in: `src/app/candidate/` and `.agent/features/candidate/`

| Feature | Route | Status | Description |
|---------|-------|--------|-------------|
| **Dashboard** | `/candidate/dashboard` | ✅ Live | Overview, stats, recent activity |
| **Profile** | `/candidate/profile` | ✅ Live | Personal info, work history, education |
| **Resume Builder** | `/candidate/resume` | ✅ Live | Upload/manage resumes, AI analysis |
| **Games/Assessments** | `/candidate/games` | ✅ Live | Typing test, DISC personality test |
| **My Assessments** | `/candidate/assessments` | ✅ Live | View completed assessment results |
| **Jobs** | `/candidate/jobs` | ✅ Live | Browse and search jobs |
| **Applications** | `/candidate/applications` | ✅ Live | Track application status and timeline |
| **Interviews** | `/candidate/interviews` | ✅ Live | Scheduled interviews, join video calls |
| **Offers** | `/candidate/offers` | ✅ Live | View, accept, decline, counter offers |
| **My Placement** | `/candidate/placement` | ✅ Live | Onboarding tasks, Day 1 tracking |
| **HR Assistant** | `/candidate/hr-assistant` | ✅ Live | Labor law guidance, DOLE compliance |
| **Notifications** | `/candidate/notifications` | ✅ Live | In-app notifications |
| **Settings** | `/candidate/settings` | ✅ Live | Account preferences |

### Recruiter Features

Located in: `src/app/recruiter/` and `.agent/features/recruiter/`

| Feature | Route | Status | Description |
|---------|-------|--------|-------------|
| **Dashboard** | `/recruiter` | ✅ Live | Overview, stats, pending items |
| **Clients** | `/recruiter/clients` | ✅ Live | Manage client companies |
| **Talent Pool** | `/recruiter/talent` | ✅ Live | Search ALL candidates |
| **Jobs** | `/recruiter/jobs` | ✅ Live | Create and manage jobs |
| **Applications** | `/recruiter/applications` | ✅ Live | Review, pre-screen, release/reject |
| **Pipeline** | `/recruiter/pipeline` | ✅ Live | Kanban view of applications |
| **Interviews** | `/recruiter/interviews` | ✅ Live | Schedule and manage interviews |
| **Recordings** | `/recruiter/interviews/recordings` | ✅ Live | Video call recordings & transcripts |
| **Offers** | `/recruiter/offers` | ✅ Live | Create and track offers |
| **Placements** | `/recruiter/placements` | ✅ Live | Manage hired candidates & onboarding |
| **HR Compliance** | `/recruiter/hr-assistant` | ✅ Live | Labor law compliance assistant |
| **Profile** | `/recruiter/profile` | ✅ Live | Recruiter profile |
| **Agency** | `/recruiter/agency` | ✅ Live | Agency settings |
| **Team** | `/recruiter/team` | ✅ Live | Manage team members |
| **API Keys** | `/recruiter/api` | ✅ Live | Generate API keys (Enterprise) |
| **Settings** | `/recruiter/settings` | ✅ Live | Preferences |

### Admin Features

Located in: `src/app/admin/` and `.agent/features/admin/`

| Feature | Route | Status | Description |
|---------|-------|--------|-------------|
| **Dashboard** | `/admin` | ✅ Live | Platform overview, key metrics |
| **Agencies** | `/admin/agencies` | ✅ Live | Manage all agencies |
| **Clients** | `/admin/clients` | ✅ Live | View all clients platform-wide |
| **Candidates** | `/admin/candidates` | ✅ Live | View all candidates |
| **Jobs** | `/admin/jobs` | ✅ Live | Monitor all jobs |
| **Applications** | `/admin/applications` | ✅ Live | Oversight of all applications |
| **Interviews** | `/admin/interviews` | ✅ Live | Monitor all interviews |
| **Offers** | `/admin/offers` | ✅ Live | Track all offers |
| **Counter Offers** | `/admin/counter-offers` | ✅ Live | Monitor negotiations |
| **Onboarding** | `/admin/onboarding` | ✅ Live | Track onboarding across platform |
| **Leaderboard** | `/admin/leaderboard` | ✅ Live | Agency & recruiter rankings |
| **Insights Manager** | `/admin/insights` | ✅ Live | Platform insights & content management |
| **Analytics** | `/admin/analytics` | ✅ Live | Detailed platform analytics |
| **BPOC Compliance** | `/admin/hr-assistant` | ✅ Live | HR compliance monitoring |
| **Notifications** | `/admin/notifications` | ✅ Live | Platform notifications |
| **Audit Log** | `/admin/audit-log` | ✅ Live | Admin action history |
| **Error Dashboard** | `/admin/errors` | ✅ Live | Platform error monitoring |

---

## DATABASE SCHEMA OVERVIEW

### Core Tables

#### Users & Authentication
- `candidates` - Candidate user accounts
- `candidate_profiles` - Extended candidate profile data
- `agency_recruiters` - Recruiter user accounts
- `agencies` - Agency companies
- `agency_clients` - Client companies linked to agencies

#### Jobs & Applications
- `jobs` - Job postings
- `job_applications` - Candidate applications to jobs
  - **Key field**: `released_to_client` BOOLEAN (Recruiter Gate)
- `application_activity_timeline` - Application status history

#### Video & Interviews
- `video_call_rooms` - Video call rooms (Daily.co)
  - **Key field**: `share_with_client` BOOLEAN (per-call sharing)
  - **Key field**: `share_with_candidate` BOOLEAN (per-call sharing)
- `video_call_recordings` - Call recordings
- `video_call_transcripts` - AI transcripts
- `job_interviews` - Scheduled interviews

#### Offers & Hiring
- `job_offers` - Job offers
- `counter_offers` - Counter offer negotiations
- `placements` - Hired candidates
- `onboarding_tasks` - Post-hire tasks

#### Assessments
- `typing_tests` - Typing test results
- `disc_assessments` - DISC personality results

#### Insights & Content
- `insights_categories` - Content categories
- `insights_items` - Individual content pieces
- `insights_links` - Related links

#### Notifications
- `notifications` - In-app notifications

### Key Relationships

```
agencies
├── agency_recruiters (1:N)
├── agency_clients (1:N)
│   └── jobs (1:N)
│       └── job_applications (1:N)
│           ├── job_interviews (1:N)
│           ├── video_call_rooms (1:N)
│           ├── job_offers (1:N)
│           └── placements (1:1)

candidates
├── job_applications (1:N)
├── typing_tests (1:N)
├── disc_assessments (1:N)
└── resumes (1:N)
```

---

## KEY WORKFLOWS

### 1. Complete Recruitment Flow (Normal Path)

```
1. RECRUITER: Posts job for Client
         ↓
2. CANDIDATE: Applies to job
         ↓
3. APPLICATION CREATED (released_to_client = FALSE)
         ↓
4. RECRUITER: Reviews application
         ↓
5. RECRUITER: Conducts pre-screen call
         ↓
6. RECRUITER: Rates candidate, takes notes
         ↓
7. RECRUITER: Releases to client (released_to_client = TRUE)
         ↓
8. CLIENT: Can now see application
         ↓
9. CLIENT/RECRUITER: Schedules interview
         ↓
10. CLIENT: Conducts interview
         ↓
11. CLIENT/RECRUITER: Sends offer
         ↓
12. CANDIDATE: Accepts offer
         ↓
13. PLACEMENT CREATED
         ↓
14. RECRUITER: Creates onboarding tasks
         ↓
15. CANDIDATE: Completes tasks
         ↓
16. RECRUITER: Confirms Day 1 start
         ↓
17. STATUS: hired → started ✅
```

### 2. Direct Talent Pool Flow (Skip Process)

```
1. CLIENT: Browses talent pool
         ↓
2. CLIENT: Finds candidate profile
         ↓
3. CLIENT: Requests interview (skips application flow)
         ↓
4. INTERVIEW SCHEDULED
         ↓
5. CLIENT: Conducts interview
         ↓
6. CLIENT: Sends offer
         ↓
7. CANDIDATE: Accepts
         ↓
8. HIRED ✅
```

### 3. Video Call Flow (Pre-Screen)

```
1. RECRUITER: Clicks "Call Now" on application
         ↓
2. SYSTEM: Creates video room (Daily.co)
         ↓
3. SYSTEM: Sends real-time notification to candidate
         ↓
4. CANDIDATE: Device rings, sees incoming call modal
         ↓
5. CANDIDATE: Answers call
         ↓
6. VIDEO CALL: Connected via Daily.co
         ↓
7. CALL ENDS
         ↓
8. RECRUITER: Adds rating (1-5), notes, outcome
         ↓
9. SYSTEM: Saves recording (optional)
         ↓
10. SYSTEM: Generates transcript (optional)
         ↓
11. RECRUITER: Can share with client (share_with_client toggle)
```

### 4. Offer Negotiation Flow

```
1. RECRUITER/CLIENT: Sends offer (₱40,000/month)
         ↓
2. CANDIDATE: Views offer
         ↓
3. CANDIDATE: Submits counter offer (₱52,000/month)
         ↓
4. EMPLOYER: Receives counter
         ↓
         ├── Option A: Accept counter → Offer accepted ✅
         ├── Option B: Reject counter → Offer declined ❌
         └── Option C: Send new offer (₱48,000/month) → Back to step 2
```

---

## TECH STACK

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Database Client**: Supabase JS Client
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### Third-Party Services
- **Video Calls**: Daily.co
- **AI/LLM**: OpenAI GPT-4
- **Email**: (TBD)
- **Analytics**: (Built-in custom)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Environment**: Production, Staging

---

## PROJECT STRUCTURE

```
bpoc-stepten/
├── .agent/                          ← AI agent configuration
│   ├── MASTER_CONTEXT.md            ← This file
│   ├── PROJECT_INFO.md              ← Quick project reference
│   ├── DATABASE_SCHEMA.md           ← Full schema reference
│   ├── TESTING_PROTOCOLS.md         ← Testing specifics
│   ├── business/
│   │   └── BPOC_EXPLAINED.md        ← Business documentation
│   ├── features/
│   │   ├── candidate/               ← Candidate feature docs
│   │   ├── recruiter/               ← Recruiter feature docs
│   │   └── admin/                   ← Admin feature docs
│   ├── tracking/
│   │   ├── FEATURE_COMPLETION.md    ← % complete per feature
│   │   ├── KNOWN_BUGS.md            ← Bug registry
│   │   └── TESTING_STATUS.md        ← Test results
│   ├── rules/
│   │   ├── CODING_STANDARDS.md      ← Code style, patterns
│   │   ├── SECURITY_RULES.md        ← Auth, validation rules
│   │   └── PERFORMANCE_RULES.md     ← Optimization guidelines
│   └── workflows/
│       ├── test-feature.workflow
│       ├── deploy-feature.workflow
│       └── debug-api.workflow
│
├── src/
│   ├── app/                         ← Next.js App Router pages
│   │   ├── candidate/               ← Candidate dashboard & features
│   │   ├── recruiter/               ← Recruiter dashboard & features
│   │   ├── admin/                   ← Admin dashboard & features
│   │   ├── client/                  ← Client dashboard (future)
│   │   ├── api/                     ← API routes
│   │   └── (public)/                ← Public pages (landing, auth)
│   │
│   ├── components/                  ← React components
│   │   ├── candidate/               ← Candidate-specific components
│   │   ├── recruiter/               ← Recruiter-specific components
│   │   ├── admin/                   ← Admin-specific components
│   │   └── shared/                  ← Shared components
│   │
│   ├── lib/                         ← Utility libraries
│   │   ├── supabase/                ← Supabase clients
│   │   ├── daily/                   ← Daily.co integration
│   │   ├── openai/                  ← OpenAI integration
│   │   └── utils.ts                 ← Helper functions
│   │
│   ├── contexts/                    ← React contexts
│   │   ├── AuthContext.tsx          ← Authentication state
│   │   └── NotificationContext.tsx  ← Real-time notifications
│   │
│   ├── hooks/                       ← Custom React hooks
│   ├── types/                       ← TypeScript types
│   └── styles/                      ← Global styles
│
├── public/                          ← Static assets
├── Docs/                            ← Original documentation
└── tests/                           ← Test files (future)
```

---

## DEVELOPMENT GUIDELINES

### Coding Standards

1. **TypeScript**: Use strict typing, avoid `any`
2. **Components**: Functional components with hooks
3. **Naming**:
   - Components: PascalCase (`CandidateSidebar.tsx`)
   - Functions: camelCase (`fetchApplications`)
   - Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
   - Database: snake_case (`released_to_client`)
4. **File Structure**: Group by feature, not by type
5. **Comments**: Explain WHY, not WHAT
6. **Error Handling**: Always handle errors gracefully, show user-friendly messages

### API Patterns

```typescript
// Standard API response format
{
  success: boolean
  data?: any
  error?: string
  message?: string
}

// Standard error handling
try {
  const result = await someOperation()
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('Error in operation:', error)
  return NextResponse.json(
    { success: false, error: 'Operation failed' },
    { status: 500 }
  )
}
```

### Database Access

1. **Use Supabase Client**: Always use Row-Level Security (RLS)
2. **Use Database Abstraction Layer**: Use `/src/lib/db/` modules for all queries
3. **Never Expose Sensitive Data**: Check permissions before returning data
4. **Use Transactions**: For multi-step operations

### Security Rules

1. **Authentication**: Check user session on every protected route
2. **Authorization**: Verify user role before allowing actions
3. **Data Isolation**: Candidates see only their data, recruiters see only their agency data
4. **The Recruiter Gate**: Respect `released_to_client` flag
5. **Video Call Sharing**: Respect per-call `share_with_client` and `share_with_candidate` flags

---

## TESTING STRATEGY

### Test Users

Located in: `.agent/TESTING_PROTOCOLS.md` and `Docs/platform-testing/TESTING_CREDENTIALS.md`

- **Candidate**: test candidate accounts with various profile states
- **Recruiter**: test recruiter accounts with different permissions
- **Admin**: test admin account with full access
- **Client**: test client accounts (via agency portal)

### Testing Checklist

Before deploying any feature:

- [ ] Tested with candidate account
- [ ] Tested with recruiter account
- [ ] Tested with admin account
- [ ] Tested on mobile viewport
- [ ] Tested with slow network
- [ ] Tested error states
- [ ] Tested loading states
- [ ] Checked console for errors
- [ ] Verified database updates
- [ ] Verified permissions/access control

### Key Test Scenarios

1. **Application Flow**: Create job → Apply → Pre-screen → Release → Interview → Offer → Hire
2. **Recruiter Gate**: Verify client cannot see unreleased applications
3. **Video Calls**: Test call creation, joining, recording, sharing
4. **Offer Negotiation**: Send offer → Counter → Accept/Decline
5. **Onboarding**: Create tasks → Complete → Confirm Day 1

---

## QUICK REFERENCE

### Common Routes

```
# Candidate
/candidate/dashboard
/candidate/jobs
/candidate/applications
/candidate/applications/[id]
/candidate/offers
/candidate/interviews

# Recruiter
/recruiter
/recruiter/applications
/recruiter/applications/[id]
/recruiter/talent
/recruiter/jobs
/recruiter/pipeline

# Admin
/admin
/admin/agencies
/admin/candidates
/admin/jobs
/admin/applications
```

### Key API Endpoints

```
# Applications
GET  /api/recruiter/applications
GET  /api/recruiter/applications/[id]
POST /api/recruiter/applications/[id]/release
POST /api/recruiter/applications/[id]/reject

# Video
POST /api/video/rooms
GET  /api/video/rooms/[id]
PATCH /api/video/rooms/[id]

# Offers
POST /api/offers
GET  /api/offers/[id]
POST /api/offers/[id]/counter
```

### Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Daily.co
DAILY_API_KEY=
NEXT_PUBLIC_DAILY_DOMAIN=

# OpenAI
OPENAI_API_KEY=
```

### Critical Database Fields

- `job_applications.released_to_client` - Controls Recruiter Gate
- `video_call_rooms.share_with_client` - Controls per-call sharing with client
- `video_call_rooms.share_with_candidate` - Controls per-call sharing with candidate
- `agencies.tier` - Controls API access ("standard" | "enterprise")
- `job_applications.status` - Application lifecycle state

---

## NEXT STEPS

When working with this codebase:

1. **Read the specific feature docs** in `.agent/features/[role]/` for detailed requirements
2. **Check the database schema** in `.agent/DATABASE_SCHEMA.md` for table structures
3. **Review the testing protocols** in `.agent/TESTING_PROTOCOLS.md` before testing
4. **Follow the coding standards** in `.agent/rules/CODING_STANDARDS.md`
5. **Check known bugs** in `.agent/tracking/KNOWN_BUGS.md` before reporting issues

---

**Last Updated**: January 15, 2026  
**Maintained By**: BPOC Development Team  
**Questions?**: Refer to specific feature documentation in `.agent/features/`
