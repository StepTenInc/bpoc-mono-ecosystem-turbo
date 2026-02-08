# BPOC Recruiter App Audit

**Generated:** 2025-02-08  
**Purpose:** Audit recruiter app for monorepo migration

---

## 📊 Executive Summary

| Category | Old Backup | New Monorepo | Status |
|----------|-----------|--------------|--------|
| UI Pages | 25 directories | 34 directories | ✅ All migrated + client portal |
| Recruiter API Routes | 55 routes | 0 routes | ⚠️ **NEED TO COPY** |
| Client API Routes | 14 routes | 0 routes | ⚠️ **NEED TO COPY** |
| v1 (Enterprise) API | 41 routes | 0 routes | ⚠️ **NEED TO COPY** |
| Client Portal UI | 7 directories | 13 directories | ✅ Merged into recruiter |

---

## 1. 📂 API Routes - Complete List

### 1.1 Recruiter API (`/api/recruiter/`) - 55 Routes

**LOCATION:** `~/Desktop/bpoc-cherry-pick-backup/src/app/api/recruiter/`  
**STATUS:** ⚠️ **NEEDS TO BE COPIED TO NEW MONOREPO**

```
📁 agency/
   └── route.ts                    # GET/PUT agency settings

📁 api-key/
   ├── route.ts                    # GET/POST API key management
   └── toggle/route.ts             # POST toggle API enabled

📁 applications/
   ├── route.ts                    # GET/POST applications list
   ├── status/route.ts             # GET application status stats
   └── [id]/
       ├── route.ts                # GET/PATCH single application
       ├── client-feedback/route.ts # POST client feedback
       ├── hired/route.ts          # POST mark as hired
       ├── reject/route.ts         # POST reject application
       ├── release/route.ts        # POST release to client
       └── send-back/route.ts      # POST send back from client

📁 clients/
   ├── route.ts                    # GET/POST clients list
   └── [id]/route.ts               # GET/PATCH/DELETE single client

📁 dashboard/
   └── stats/route.ts              # GET dashboard statistics

📁 documents/
   ├── scan/route.ts               # POST scan document (OCR)
   ├── upload/route.ts             # POST upload document
   └── upload-v2/route.ts          # POST upload v2 (improved)

📁 interviews/
   ├── route.ts                    # GET/POST interviews list
   ├── propose/route.ts            # POST propose interview times
   └── [id]/
       └── respond/route.ts        # POST respond to interview

📁 invitations/
   └── job/route.ts                # POST invite candidate to job

📁 jobs/
   ├── route.ts                    # GET/POST jobs list
   ├── create/route.ts             # POST create job
   ├── generate/route.ts           # POST AI generate job description
   └── [id]/
       ├── route.ts                # GET/PATCH/DELETE single job
       ├── approve/route.ts        # POST approve job (for moderation)
       └── matches/route.ts        # GET AI matches for job

📁 notifications/
   └── route.ts                    # GET notifications list

📁 offers/
   ├── route.ts                    # GET/POST offers list
   └── [id]/
       ├── withdraw/route.ts       # POST withdraw offer
       └── counter/
           ├── route.ts            # GET/POST counter offers
           ├── accept/route.ts     # POST accept counter
           └── reject/route.ts     # POST reject counter

📁 onboarding/
   ├── route.ts                    # GET/POST onboarding list
   ├── from-template/route.ts      # POST create from template
   ├── templates/route.ts          # GET/POST onboarding templates
   ├── tasks/
   │   ├── route.ts                # GET/POST tasks
   │   └── [taskId]/route.ts       # PATCH/DELETE single task
   └── [applicationId]/
       └── complete/route.ts       # POST complete onboarding

📁 pipeline/
   └── route.ts                    # GET pipeline kanban data

📁 placements/
   └── route.ts                    # GET placements list

📁 profile/
   └── route.ts                    # GET/PUT recruiter profile

📁 rejection-templates/
   └── route.ts                    # GET/POST rejection templates

📁 send-contract/
   └── route.ts                    # POST send contract to candidate

📁 signup/
   └── route.ts                    # POST recruiter signup

📁 talent/
   ├── route.ts                    # GET talent pool search
   └── [id]/route.ts               # GET single talent profile

📁 team/
   ├── route.ts                    # GET team members
   ├── invite/route.ts             # POST invite team member
   └── accept/route.ts             # POST accept team invite

📁 verify/
   └── route.ts                    # POST verify recruiter email

📁 video/
   └── recordings/
       └── [id]/
           └── delete/route.ts     # DELETE recording

📁 webhooks/
   ├── route.ts                    # GET/POST webhooks
   └── [id]/
       ├── route.ts                # GET/PATCH/DELETE single webhook
       └── test/route.ts           # POST test webhook
```

### 1.2 Client Portal API (`/api/client/`) - 14 Routes

**LOCATION:** `~/Desktop/bpoc-cherry-pick-backup/src/app/api/client/`  
**STATUS:** ⚠️ **NEEDS TO BE COPIED**

```
📁 counter-offers/
   └── [id]/
       └── respond/route.ts        # POST respond to counter offer

📁 feedback/
   └── route.ts                    # POST submit feedback

📁 interviews/
   ├── request/route.ts            # POST request interview
   └── [id]/
       ├── cancel/route.ts         # POST cancel interview
       └── reschedule/route.ts     # POST reschedule interview

📁 jobs/
   └── [token]/
       ├── route.ts                # GET job details via token
       ├── candidates/
       │   └── [id]/
       │       ├── route.ts        # GET candidate details
       │       └── decision/route.ts # POST hiring decision
       └── interviews/
           └── [id]/route.ts       # GET/PATCH interview details

📁 offers/
   ├── route.ts                    # GET/POST offers
   └── [id]/
       └── withdraw/route.ts       # POST withdraw offer

📁 onboarding/
   ├── start/route.ts              # POST start onboarding
   └── [id]/
       ├── route.ts                # GET onboarding status
       └── confirm-start/route.ts  # POST confirm start date
```

### 1.3 Enterprise API (`/api/v1/`) - 41 Routes

**LOCATION:** `~/Desktop/bpoc-cherry-pick-backup/src/app/api/v1/`  
**STATUS:** ⚠️ **NEEDS TO BE COPIED**

```
📄 auth.ts                         # API key authentication
📄 cors.ts                         # CORS configuration
📄 validation.ts                   # Input validation

📁 applications/
   ├── route.ts                    # GET/POST applications
   ├── invite/route.ts             # POST invite to apply
   └── [id]/
       ├── route.ts                # GET/PATCH application
       ├── release/route.ts        # POST release to client
       ├── send-back/route.ts      # POST send back
       └── card/
           ├── route.ts            # GET application card
           ├── prescreen/route.ts  # POST/GET prescreen
           ├── reject/route.ts     # POST reject
           ├── client-feedback/route.ts
           ├── hired/route.ts
           └── timeline/route.ts

📁 candidates/
   ├── route.ts                    # GET candidates (talent pool)
   └── [id]/
       ├── route.ts                # GET single candidate
       └── complete/route.ts       # GET complete candidate data

📁 clients/
   ├── route.ts                    # GET/POST clients
   └── get-or-create/route.ts      # POST get or create client

📁 embed/
   └── jobs/route.ts               # GET public job embed (no auth)

📁 interviews/
   ├── route.ts                    # GET/POST/PATCH interviews
   └── availability/route.ts       # GET availability slots

📁 jobs/
   ├── route.ts                    # GET jobs
   ├── create/route.ts             # POST create job
   └── [id]/
       ├── route.ts                # GET/PATCH job
       └── approve/route.ts        # POST approve job

📁 notifications/
   └── call/route.ts               # POST push notification

📁 offers/
   ├── route.ts                    # GET/POST offers
   └── [offerId]/
       ├── sign/route.ts           # POST sign offer
       └── counter/
           ├── route.ts            # GET/POST counter
           ├── accept/route.ts     # POST accept
           └── reject/route.ts     # POST reject

📁 onboarding/
   ├── route.ts                    # GET/POST onboarding
   └── [id]/route.ts               # GET/PATCH single

📁 video/
   ├── rooms/
   │   ├── route.ts                # GET/POST video rooms
   │   └── [roomId]/route.ts       # GET/PATCH/DELETE room
   ├── recordings/
   │   ├── route.ts                # GET recordings
   │   └── [recordingId]/route.ts  # GET/POST recording
   ├── transcripts/
   │   └── [transcriptId]/route.ts # GET transcript
   └── invitations/
       └── [id]/
           ├── accept/route.ts     # POST accept
           └── decline/route.ts    # POST decline
```

### 1.4 Related APIs (Shared)

These APIs are used by recruiters but may be shared with other apps:

```
📁 /api/candidates/
   ├── route.ts                    # Candidate CRUD
   ├── ai-analysis/                # AI resume analysis
   ├── resume/                     # Resume processing
   └── [id]/route.ts

📁 /api/video/
   ├── rooms/route.ts              # Video call rooms
   ├── recordings/route.ts
   ├── transcribe/route.ts
   ├── sync-recordings/route.ts
   ├── webhook/route.ts
   └── webhooks/route.ts

📁 /api/contracts/
   ├── route.ts
   └── [applicationId]/
       ├── route.ts
       ├── pdf/route.ts
       └── sign/route.ts

📁 /api/notifications/
   ├── route.ts
   ├── [id]/route.ts
   ├── [id]/read/route.ts
   └── read-all/route.ts

📁 /api/offers/
   ├── route.ts
   └── [offerId]/
       └── sign/route.ts
```

---

## 2. 🖥️ UI Pages Comparison

### 2.1 Recruiter UI Pages

| Page | Old Location | New Location | Status |
|------|-------------|--------------|--------|
| Dashboard | `(recruiter)/recruiter/page.tsx` | `/page.tsx` | ✅ |
| Jobs List | `(recruiter)/recruiter/jobs/page.tsx` | `/jobs/page.tsx` | ✅ |
| Job Detail | `(recruiter)/recruiter/jobs/[id]/page.tsx` | `/jobs/[id]/page.tsx` | ✅ |
| Job Edit | `(recruiter)/recruiter/jobs/[id]/edit/page.tsx` | `/jobs/[id]/edit/page.tsx` | ✅ |
| Job Create | `(recruiter)/recruiter/jobs/create/page.tsx` | `/jobs/create/page.tsx` | ✅ |
| Applications | `(recruiter)/recruiter/applications/page.tsx` | `/applications/page.tsx` | ✅ |
| Application Detail | `(recruiter)/recruiter/applications/[id]/page.tsx` | `/applications/[id]/page.tsx` | ✅ |
| Pipeline | `(recruiter)/recruiter/pipeline/page.tsx` | `/pipeline/page.tsx` | ✅ |
| Talent | `(recruiter)/recruiter/talent/page.tsx` | `/talent/page.tsx` | ✅ |
| Talent Profile | `(recruiter)/recruiter/talent/[id]/page.tsx` | `/talent/[id]/page.tsx` | ✅ |
| Interviews | `(recruiter)/recruiter/interviews/page.tsx` | `/interviews/page.tsx` | ✅ |
| Recordings | `(recruiter)/recruiter/interviews/recordings/page.tsx` | `/interviews/recordings/page.tsx` | ✅ |
| Offers | `(recruiter)/recruiter/offers/page.tsx` | `/offers/page.tsx` | ✅ |
| Onboarding | `(recruiter)/recruiter/onboarding/page.tsx` | `/onboarding/page.tsx` | ✅ |
| Clients | `(recruiter)/recruiter/clients/page.tsx` | `/clients/page.tsx` | ✅ |
| Client Detail | `(recruiter)/recruiter/clients/[id]/page.tsx` | `/clients/[id]/page.tsx` | ✅ |
| Team | `(recruiter)/recruiter/team/page.tsx` | `/team/page.tsx` | ✅ |
| API Keys | `(recruiter)/recruiter/api/page.tsx` | `/api/page.tsx` | ✅ |
| Profile | `(recruiter)/recruiter/profile/page.tsx` | `/profile/page.tsx` | ✅ |
| Settings | `(recruiter)/recruiter/settings/page.tsx` | `/settings/page.tsx` | ✅ |
| Agency | `(recruiter)/recruiter/agency/page.tsx` | `/agency/page.tsx` | ✅ |
| Placements | `(recruiter)/recruiter/placements/page.tsx` | `/placements/page.tsx` | ✅ |
| Contracts | `(recruiter)/recruiter/contracts/[applicationId]/page.tsx` | `/contracts/[applicationId]/page.tsx` | ✅ |
| Notifications | `(recruiter)/recruiter/notifications/page.tsx` | `/notifications/page.tsx` | ✅ |
| HR Assistant | `(recruiter)/recruiter/hr-assistant/page.tsx` | `/hr-assistant/page.tsx` | ✅ |
| Login | `(recruiter)/recruiter/login/page.tsx` | `/login/page.tsx` | ✅ |
| Signup | `(recruiter)/recruiter/signup/page.tsx` | `/signup/page.tsx` | ✅ |
| Demo | `(recruiter)/recruiter/demo/page.tsx` | `/demo/page.tsx` | ✅ |

### 2.2 Client Portal UI (Merged into Recruiter)

| Page | Old Location | New Location | Status |
|------|-------------|--------------|--------|
| Job View | `/client/jobs/[token]/page.tsx` | `/client/jobs/[token]/page.tsx` | ✅ |
| Candidates | `/client/jobs/[token]/candidates/page.tsx` | `/client/jobs/[token]/candidates/page.tsx` | ✅ |
| Candidate Detail | `/client/jobs/[token]/candidates/[id]/page.tsx` | `/client/jobs/[token]/candidates/[id]/page.tsx` | ✅ |
| Interviews | `/client/jobs/[token]/interviews/page.tsx` | `/client/jobs/[token]/interviews/page.tsx` | ✅ |
| Interview Detail | `/client/jobs/[token]/interviews/[id]/page.tsx` | `/client/jobs/[token]/interviews/[id]/page.tsx` | ✅ |

---

## 3. 📋 Migration Checklist

### Phase 1: Copy API Routes (PRIORITY)

```bash
# Copy recruiter API routes
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/api/recruiter \
      ~/Desktop/bpoc-mono/apps/recruiter/src/app/api/

# Copy client API routes
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/api/client \
      ~/Desktop/bpoc-mono/apps/recruiter/src/app/api/

# Copy v1 (enterprise) API routes
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/api/v1 \
      ~/Desktop/bpoc-mono/apps/recruiter/src/app/api/
```

### Phase 2: Update Imports

After copying, update all imports to use the monorepo package structure:
- `@/lib/*` → `@bpoc/shared/lib/*` or `@bpoc/recruiter/lib/*`
- `@/components/*` → Check if shared or app-specific

### Phase 3: Verify Shared Dependencies

APIs that need to be in `packages/shared` or `packages/api-core`:
- Database clients
- Auth helpers
- Supabase clients
- Common utilities

---

## 4. 💡 "No Hands" Improvement Ideas

### 4.1 Auto-Match Candidates to Jobs

**Current:** Recruiter manually searches talent pool for each job.  
**Improvement:**
```
When a new job is created:
1. AI scans all active candidates in the talent pool
2. Generates match scores based on:
   - Skills match
   - Experience level
   - Location/timezone
   - Salary expectations
3. Auto-creates "Suggested Matches" list
4. Sends recruiter notification: "12 candidates match this job"
```

**Implementation:**
- Add cron job or queue worker
- Run matching when job status → "active"
- Store matches in `job_matches` table
- Add "Auto-Matches" tab on job detail page

### 4.2 Auto-Schedule Interviews Based on Availability

**Current:** Manual back-and-forth to find available times.  
**Improvement:**
```
1. Candidate submits availability during application
2. Client sets preferred interview times in settings
3. System automatically proposes 3 matching slots
4. First-available scheduling with one-click confirm
5. Auto-sync with Google/Outlook calendars
```

**Implementation:**
- Add availability picker component
- Create `availability_slots` table
- Build matching algorithm
- Integrate calendar APIs

### 4.3 AI Screening Summaries

**Current:** Recruiter manually reviews resumes and video interviews.  
**Improvement:**
```
After video interview completes:
1. Auto-transcribe recording (already exists)
2. Generate AI summary with:
   - Key skills mentioned
   - Red flags detected
   - Communication score
   - Culture fit assessment
3. Auto-populate prescreen form
4. Suggest pass/fail with confidence score
```

**Implementation:**
- Extend transcription pipeline
- Add GPT-4 analysis stage
- Create `ai_assessments` table
- Add summary card to application detail

### 4.4 Automated Pipeline Nudges

**Current:** Candidates sit in stages with no movement.  
**Improvement:**
```
Smart nudges based on stage dwell time:
- 3 days in "Submitted" → "Review pending applications?"
- 5 days in "Interview Scheduled" → "Interview coming up tomorrow"
- 7 days post-interview → "Decision needed on [candidate]"
- Offer sent, no response in 48h → Auto-send reminder
- 30 days inactive job → "Pause this job?"
```

**Implementation:**
- Add cron job for pipeline health checks
- Create `pipeline_nudges` table
- Send push/email notifications
- Add "Smart Actions" dashboard widget

### 4.5 One-Click Offer Generation

**Current:** Manual offer creation with salary negotiation.  
**Improvement:**
```
1. Based on job salary range + candidate experience
2. AI suggests optimal offer amount
3. Auto-generates offer letter from template
4. Includes benefits package based on role
5. One-click send with e-signature
```

### 4.6 Client Self-Service Portal Enhancements

**Current:** Clients view candidates via shared links.  
**Improvement:**
```
1. Client login portal (not just token links)
2. Real-time interview scheduling
3. Direct chat with candidates (moderated)
4. Bulk candidate actions
5. Analytics dashboard for hiring progress
```

### 4.7 Smart Re-engagement

**Current:** Past candidates are forgotten.  
**Improvement:**
```
When new job matches past candidate:
1. Check if candidate is still available
2. Auto-send "New opportunity" notification
3. One-click re-apply from previous application
4. Show recruiter: "This candidate was shortlisted for similar role in Oct 2024"
```

---

## 5. 🔧 Technical Debt Notes

1. **API Organization:** Consider moving recruiter-specific APIs under `/api/(recruiter)/` route group in monorepo
2. **Auth Consolidation:** Multiple auth helpers exist - consolidate into single package
3. **Component Duplication:** Some components exist in both old/new - dedupe into shared package
4. **Type Definitions:** Many API routes lack TypeScript types - add Zod schemas

---

## 6. 📌 Next Steps

1. ✅ **Done:** UI pages successfully migrated
2. ⏳ **TODO:** Copy API routes (`/api/recruiter/`, `/api/client/`, `/api/v1/`)
3. ⏳ **TODO:** Update import paths after copying
4. ⏳ **TODO:** Verify all API dependencies are in shared packages
5. ⏳ **TODO:** Test all API endpoints in monorepo context
6. ⏳ **TODO:** Implement "no hands" improvements (prioritize auto-match)

---

*Generated by Pinky for BPOC Monorepo Migration*
