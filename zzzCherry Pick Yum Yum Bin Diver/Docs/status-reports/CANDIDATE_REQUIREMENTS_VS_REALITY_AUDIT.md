# Candidate Requirements vs. Reality Audit
**Date:** January 5, 2026
**Requirements Source:** `Docs/002_CANDIDATE_FUNCTIONAL_FLOW_REQUIREMENTS.md`
**Audit Status:** Complete

---

## Executive Summary

**Overall Completion:** 46% Complete | 28% Partial | 26% Missing

**Critical Finding:** The candidate UI has strong foundations for core features (applications, interviews, video calls), but has **significant gaps** in onboarding, counter offers, and notification infrastructure.

### Key Strengths ✅
- Application tracking and status management
- Video call infrastructure (Daily.co integration)
- Interview scheduling and joining
- Offer viewing and basic acceptance/rejection
- Call recordings and transcripts infrastructure

### Critical Gaps 🔴
1. **Notifications table missing from Prisma schema** (APIs reference non-existent table)
2. **Onboarding system completely absent** (0% implementation)
3. **Counter offer functionality missing** (blocking negotiation flow)
4. **Application submission API missing** (can view but not create)

---

## Feature-by-Feature Breakdown

### 1. APPLICATION FLOW FEATURES

#### ✅ Application Viewing & Status Tracking (COMPLETE)
**Status:** Fully implemented
- Database: `job_applications` table with all required status states
  - `submitted`, `under_review`, `shortlisted`, `interview_scheduled`, `interviewed`, `offer_pending`, `offer_sent`, `offer_accepted`, `hired`, `rejected`, `withdrawn`
- API: `/api/candidate/applications` (GET) - Works
- UI: `/src/app/(candidate)/candidate/applications/page.tsx` - Works
- Component: `CandidateApplicationCard.tsx` - Shows full application details
- Component: `ApplicationPipelineTracker.tsx` - Visual progress bar

**What Works:**
- Candidates can view all their applications
- Status progression displays correctly
- Pipeline tracker shows current stage
- Timeline events visible

#### ❌ Application Submission (MISSING)
**Status:** Not implemented
- API: `/api/candidate/applications` (POST) - **Does not exist**
- Requirements specify: Candidates should be able to apply to jobs via API
- Missing: Job application form submission endpoint

**Impact:** High - Candidates cannot apply to jobs programmatically

#### ⚠️ Application Withdrawal (ARCHIVED)
**Status:** Exists but archived
- API: `/src/app/api/_ARCHIVED/applications/[id]/withdraw/route.ts`
- This endpoint was moved to archive (likely during cleanup)
- Requirements specify: `/api/v1/candidate/applications/:id/withdraw`

**Impact:** Medium - Candidates cannot withdraw applications

---

### 2. NOTIFICATION SYSTEM

#### 🔴 **CRITICAL: Notifications Table Missing from Schema**
**Status:** Major infrastructure gap

**The Problem:**
- API endpoints exist and reference `notifications` table:
  - `/api/notifications/route.ts` (GET, POST)
  - `/api/candidate/notifications/route.ts`
  - `/api/notifications/[id]/route.ts` (PATCH, DELETE)
  - `/api/notifications/read-all/route.ts`
- **BUT** `notifications` table **DOES NOT EXIST** in `prisma/schema.prisma`
- No migrations found for creating this table
- APIs will fail at runtime when trying to query non-existent table

**Evidence:**
```typescript
// From /api/notifications/route.ts
const notifications = await prisma.notifications.findMany({
  where: filters,
  orderBy: { created_at: 'desc' },
  take: limit,
});
// ❌ This will fail - table doesn't exist
```

**Impact:** **CRITICAL** - All notification features will crash

**Fix Required:**
1. Add `notifications` table to Prisma schema
2. Create migration
3. Deploy to production

#### ✅ Real-Time Call Notifications (COMPLETE)
**Status:** Fully working
- Component: `/src/components/candidate/incoming-call-modal.tsx`
- Listens to: `video_call_invitations` table via Supabase real-time
- Features: Answer/Decline buttons, joins video call
- Mounted in: Candidate layout (line 186)

**What Works:**
- Real-time notification appears when recruiter calls
- Beautiful animated modal
- Candidate can answer or decline
- Integrates with video call system

#### ⚠️ Notification Center UI (PARTIAL)
**Status:** Backend exists, UI incomplete
- API: `/api/candidate/notifications` - Works (if table existed)
- Missing: Notification bell icon in header/sidebar
- Missing: Notification dropdown/panel component
- Missing: Unread badge indicator

**Impact:** Medium - Candidates can't see notification history

#### ⚠️ Push Notifications (INFRASTRUCTURE ONLY)
**Status:** Backend ready, implementation missing
- Notification API can create notifications
- Missing: Browser push notification service worker
- Missing: Push subscription management

**Impact:** Low - In-app notifications work

#### ⚠️ Toast/Banner Notifications (PARTIAL)
**Status:** Hook exists, not system-wide
- Hook: `/src/hooks/use-toast.ts` exists
- Used in: Some pages for success messages
- Missing: Automatic toast for all notification types

**Impact:** Low - UX enhancement

#### ❌ Badge Updates on Navigation (MISSING UI)
**Status:** API exists, UI component missing
- API returns `unreadCount`
- Missing: Badge component on navigation items

**Impact:** Low - UX enhancement

---

### 3. OFFER MANAGEMENT

#### ✅ View Offer Details (COMPLETE)
**Status:** Fully implemented
- API: `/api/candidate/offers` (GET)
- UI: `/src/app/(candidate)/candidate/offers/page.tsx`
- Database: `job_offers` table exists

**Data Displayed:**
- Salary (amount, currency, type: hourly/monthly/yearly)
- Benefits array
- Start date
- Additional terms
- Offer status
- Expiration date

#### ✅ Accept Offer (COMPLETE)
**Status:** Fully implemented
- API: `/api/candidate/offers` (PATCH with `action: 'accept'`)
- Updates: `offer.status` → `accepted`
- Updates: `application.status` → `hired`
- UI: Accept button on offer card

#### ✅ Decline Offer (COMPLETE)
**Status:** Fully implemented
- API: `/api/candidate/offers` (PATCH with `action: 'reject'`)
- Updates: `offer.status` → `rejected`
- Optional: Decline reason
- UI: Decline button on offer card

#### ❌ Counter Offer Functionality (MISSING)
**Status:** Not implemented

**Requirements Specify:**
- Endpoint: `/api/v1/candidate/offers/:id/counter`
- Data: `{ requested_salary: decimal, requested_currency: string, candidate_message: text }`
- Process: Offer status → `negotiating`
- Loop: Employer can accept, reject, or counter back

**Missing:**
- No counter offer API endpoint
- No counter offer UI component
- No `counter_offers` table in schema
- No negotiation history tracking

**Impact:** **HIGH** - Blocks salary negotiation flow (critical for Filipino market)

#### ❌ Counter Offer Negotiation Loop (MISSING)
**Status:** Not implemented
- No back-and-forth negotiation system
- No counter offer history
- No employer response handling

**Impact:** High - Cannot negotiate offers

---

### 4. INTERVIEW FLOW

#### ✅ View Scheduled Interviews (COMPLETE)
**Status:** Fully implemented
- API: `/api/candidate/interviews` (GET)
- UI: `/src/app/(candidate)/candidate/interviews/page.tsx`
- Database: `job_interviews` table with all status states

**What Candidates See:**
- Interview type (screening, technical, final)
- Scheduled date/time
- Duration
- Company name
- Job title
- Meeting link
- Status badge

#### ✅ Interview Status Tracking (COMPLETE)
**Status:** Fully implemented
- Database: `InterviewStatus` enum includes:
  - `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`, `rescheduled`
- UI: Status badges displayed
- Timeline: Events tracked in `application_activity_timeline`

#### ✅ Join Interview Functionality (COMPLETE)
**Status:** Fully implemented
- UI: "Join Meeting" button on interview card
- Integration: Opens video call modal
- Token: Generates fresh Daily.co participant token
- Timing: Join button active ~15 minutes before

**What Works:**
- Candidate clicks join
- Video call modal opens
- Daily.co room loads
- Candidate enters interview

#### ⚠️ Interview Reminders (INFRASTRUCTURE ONLY)
**Status:** Backend ready, automation missing

**Requirements Specify:**
- 24 hours before: "Interview tomorrow"
- 1 hour before: "Interview in 1 hour"
- 15 minutes before: "Interview starting soon" + Join button active

**Missing:**
- No cron job or scheduler
- No automated reminder generation
- Notification system exists but not triggered automatically

**Impact:** Medium - Candidates might miss interviews

**Fix Required:**
- Implement scheduled job (Vercel Cron, node-cron, or external scheduler)
- Create reminder generation logic
- Trigger notifications at specified intervals

---

### 5. ONBOARDING SYSTEM

#### ❌ Onboarding Task Management (MISSING ENTIRELY)
**Status:** 0% implemented

**Requirements Specify:**
- Table: `onboarding_tasks`
- Endpoint: `/api/v1/candidate/onboarding/tasks` (GET, POST)
- UI: Onboarding checklist page
- Features: Task status, progress tracking, due dates

**Missing:**
- No `onboarding_tasks` table in schema
- No onboarding API endpoints
- No onboarding UI components
- No task types implementation

**Impact:** **CRITICAL** - Cannot track hired → started flow

#### ❌ Document Upload Functionality (MISSING)
**Status:** Not implemented
- Requirements: Upload documents for onboarding tasks
- Missing: File upload API for onboarding
- Missing: Document storage/retrieval

**Impact:** Critical - Cannot collect onboarding documents

#### ❌ E-Signature Capability (MISSING)
**Status:** Not implemented
- Requirements: E-sign documents electronically
- Missing: E-signature integration (DocuSign, HelloSign, etc.)
- Missing: Signature storage/verification

**Impact:** Critical - Cannot sign employment contracts

#### ❌ Form Fill Tasks (MISSING)
**Status:** Not implemented
- Requirements: Complete form fields as onboarding tasks
- Missing: Dynamic form system
- Missing: Form data storage

**Impact:** High - Cannot collect onboarding information

#### ❌ Acknowledgment Tasks (MISSING)
**Status:** Not implemented
- Requirements: Read and confirm acknowledgment
- Missing: Acknowledgment tracking
- Missing: Compliance verification

**Impact:** Medium - Cannot track policy acknowledgments

#### ❌ Progress Tracking (MISSING)
**Status:** Not implemented
- Requirements: Overall progress (e.g., "4 of 7 tasks complete")
- Missing: Progress calculation
- Missing: Progress display UI

**Impact:** Medium - Poor UX during onboarding

---

### 6. CALL RECORDINGS & TRANSCRIPTS

#### ✅ Call Recording Infrastructure (COMPLETE)
**Status:** Database and API exist
- Database: `video_call_recordings` table
- Fields: `recording_url`, `download_url`, `duration_seconds`, `status`, `recording_id`
- API: `/api/v1/video/recordings/[recordingId]/route.ts`
- Webhook: Daily.co webhook handles recording events

**What Works:**
- Recordings are captured via Daily.co
- Stored in database
- Accessible via API

#### ✅ Call Transcript Infrastructure (COMPLETE)
**Status:** Database and API exist
- Database: `video_call_transcripts` table
- Fields: `full_text`, `summary`, `key_points`, `word_count`, `segments` (JSONB)
- API: `/api/v1/video/transcripts/[transcriptId]/route.ts`

**What Works:**
- Transcripts generated via Daily.co
- Stored in database
- Accessible via API

#### ⚠️ Visibility Controls (UNCLEAR)
**Status:** Infrastructure exists, implementation unclear

**Requirements Specify:**
- Fields: `recording_shared_with_candidate`, `transcript_shared_with_candidate`
- Logic: Only show if shared by agency/client

**Current State:**
- Schema doesn't explicitly show `shared_with_candidate` boolean fields
- Unclear if visibility control is implemented in API
- Missing candidate UI to view recordings/transcripts

**Impact:** Medium - Candidates might see everything or nothing

**Fix Required:**
- Add explicit visibility fields to schema
- Implement access control in API
- Create UI for candidates to access shared recordings

---

### 7. APPLICATION HISTORY & TIMELINE

#### ✅ Timeline Events (COMPLETE)
**Status:** Fully implemented
- Database: `application_activity_timeline` table
- Fields: `action_type`, `description`, `metadata` (JSONB), `performed_by_type`
- Linked to: `job_applications`

**What Works:**
- All application events tracked
- Timeline displays in application card
- Shows who performed action and when

**Event Types Supported:**
- `applied`, `reviewed`, `shortlisted`, `interview_scheduled`, `interview_completed`, `offer_sent`, `offer_accepted`, `hired`, `rejected`, `withdrawn`

#### ✅ Application Card with Full History (COMPLETE)
**Status:** Fully implemented
- Component: `/src/components/candidate/CandidateApplicationCard.tsx`
- Component: `/src/components/candidate/ApplicationPipelineTracker.tsx`

**What Candidate Sees:**
- Job title, company, work arrangement
- Current status with visual pipeline
- Expandable details section
- Stage explanations ("What This Means", "What's Next")
- Action buttons (contextual to status)

#### ✅ Call/Interview History (COMPLETE VIA API)
**Status:** Backend complete, UI integration needed
- API: Interviews API returns full history
- Database: `job_interviews` linked to applications
- UI: Interview list shows scheduled/completed interviews

**What Works:**
- All interviews tracked
- Status updates recorded
- Accessible via API

#### ⚠️ Rejection Feedback Display (PARTIAL)
**Status:** Data exists, display incomplete

**Requirements Specify:**
- Field: `rejection_reason` (optional - agency controls visibility)
- Field: `is_feedback_visible` (boolean)
- UI: Show rejection feedback if agency chooses to share

**Current State:**
- Database: `job_applications.rejection_reason` field exists
- UI: Applications page doesn't explicitly display rejection feedback
- Missing: Feedback visibility toggle implementation
- Missing: "Why I wasn't selected" section in application card

**Impact:** Medium - Candidates can't learn from rejections

**Fix Required:**
- Add rejection feedback display to application card
- Respect `is_feedback_visible` flag
- Show generic message if feedback not shared

---

### 8. REQUIRED API ENDPOINTS

#### Summary Table

| Endpoint | Required | Exists | Location | Status |
|----------|----------|--------|----------|--------|
| **Applications** |
| `GET /api/v1/candidate/applications` | ✅ | ✅ | `/api/candidate/applications` | Working |
| `POST /api/v1/candidate/applications` | ✅ | ❌ | - | **MISSING** |
| `POST /api/v1/candidate/applications/:id/withdraw` | ✅ | ⚠️ | `/api/_ARCHIVED/applications/[id]/withdraw` | Archived |
| **Offers** |
| `GET /api/v1/candidate/offers/:id` | ✅ | ✅ | `/api/candidate/offers` | Working |
| `POST /api/v1/candidate/offers/:id/accept` | ✅ | ✅ | Via PATCH action | Working |
| `POST /api/v1/candidate/offers/:id/decline` | ✅ | ✅ | Via PATCH action | Working |
| `POST /api/v1/candidate/offers/:id/counter` | ✅ | ❌ | - | **MISSING** |
| **Interviews** |
| `GET /api/v1/candidate/interviews` | ✅ | ✅ | `/api/candidate/interviews` | Working |
| `GET /api/v1/candidate/interviews/:id/join` | ✅ | ⚠️ | Partial | Needs token endpoint |
| **Calls** |
| `GET /api/v1/candidate/calls` | ✅ | ⚠️ | Partial | Via video rooms API |
| `GET /api/v1/candidate/calls/:id/recording` | ✅ | ✅ | `/api/v1/video/recordings/[recordingId]` | Working |
| `GET /api/v1/candidate/calls/:id/transcript` | ✅ | ✅ | `/api/v1/video/transcripts/[transcriptId]` | Working |
| **Notifications** |
| `GET /api/v1/candidate/notifications` | ✅ | ✅ | `/api/candidate/notifications` | **Table Missing** |
| `POST /api/v1/candidate/notifications/:id/read` | ✅ | ✅ | `/api/notifications/[id]` | **Table Missing** |
| `POST /api/v1/candidate/notifications/read-all` | ✅ | ✅ | `/api/notifications/read-all` | **Table Missing** |
| **Onboarding** |
| `GET /api/v1/candidate/onboarding/tasks` | ✅ | ❌ | - | **MISSING** |
| `POST /api/v1/candidate/onboarding/tasks/:id` | ✅ | ❌ | - | **MISSING** |

**API Coverage:** 65%
**Critical Gaps:** Onboarding endpoints (100% missing), Counter offer endpoint, Application submission

---

### 9. DATABASE TABLES

#### Summary Table

| Table | Required | Exists | Completeness | Notes |
|-------|----------|--------|--------------|-------|
| `job_applications` | ✅ | ✅ | **100%** | All status states exist |
| `job_offers` | ✅ | ✅ | **75%** | Missing counter offer fields |
| `job_interviews` | ✅ | ✅ | **100%** | All interview states exist |
| `video_call_rooms` | ✅ | ✅ | **100%** | Complete |
| `video_call_invitations` | ✅ | ✅ | **100%** | Complete |
| `video_call_recordings` | ✅ | ✅ | **90%** | Missing visibility control |
| `video_call_transcripts` | ✅ | ✅ | **90%** | Missing visibility control |
| `application_activity_timeline` | ✅ | ✅ | **100%** | Complete |
| `notifications` | ✅ | ❌ | **0%** | **CRITICAL: Table missing** |
| `onboarding_tasks` | ✅ | ❌ | **0%** | **Missing entirely** |
| `counter_offers` | ✅ | ❌ | **0%** | **Missing entirely** |

**Database Coverage:** 73%
**Critical Gaps:** `notifications`, `onboarding_tasks`, `counter_offers`

---

## CRITICAL ISSUES REQUIRING IMMEDIATE ACTION

### 🔴 Priority 1: Notifications Table Missing

**Problem:**
- API endpoints exist and query `prisma.notifications`
- Table does not exist in schema
- Will cause 500 errors at runtime

**Impact:** All notification features broken

**Fix:**
1. Add to `prisma/schema.prisma`:
```prisma
model notifications {
  id              String    @id @default(uuid())
  user_id         String
  type            String
  title           String
  message         String
  action_url      String?
  action_label    String?
  related_id      String?
  related_type    String?
  is_read         Boolean   @default(false)
  is_urgent       Boolean   @default(false)
  created_at      DateTime  @default(now())
  expires_at      DateTime?
  metadata        Json?

  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([is_read])
  @@index([created_at])
}
```

2. Generate migration: `npx prisma migrate dev --name add_notifications_table`
3. Deploy to production

---

### 🔴 Priority 2: Onboarding System Completely Missing

**Problem:**
- Critical for `hired` → `started` flow
- Cannot track Day 1 readiness
- Cannot collect employment documents

**Impact:** Cannot complete hiring process

**Fix:**
1. Create `onboarding_tasks` table
2. Build onboarding API endpoints
3. Create onboarding UI components
4. Implement document upload
5. Add e-signature integration (later phase)

**Estimated Effort:** 2-3 weeks full implementation

---

### 🔴 Priority 3: Counter Offer Functionality Missing

**Problem:**
- Critical for Filipino market (salary negotiation common)
- Blocks negotiation loop
- Poor candidate experience

**Impact:** Candidates cannot negotiate offers

**Fix:**
1. Add counter offer fields to `job_offers` or create `counter_offers` table
2. Build `/api/candidate/offers/:id/counter` endpoint
3. Add counter offer UI to offers page
4. Implement negotiation history

**Estimated Effort:** 1 week

---

## NON-CRITICAL IMPROVEMENTS

### 🟠 Priority 4: Application Submission API
- Add POST endpoint for job applications
- Enable programmatic job applications

### 🟠 Priority 5: Restore Application Withdrawal
- Move withdraw endpoint from archive to active
- Enable candidates to withdraw applications

### 🟠 Priority 6: Interview Reminders
- Implement cron job for automated reminders
- Send notifications at 24h, 1h, 15min intervals

### 🟡 Priority 7: Notification Center UI
- Build notification bell component
- Add notification dropdown panel
- Display unread count badge

### 🟡 Priority 8: Recording/Transcript Visibility
- Add `shared_with_candidate` fields
- Implement access control
- Build candidate UI to view recordings

### 🟡 Priority 9: Rejection Feedback Display
- Show rejection feedback in application card
- Respect visibility settings
- Improve candidate learning experience

---

## FEATURE COMPLETION STATISTICS

### By Category

| Category | Complete | Partial | Missing | Score |
|----------|----------|---------|---------|-------|
| Application Flow | 1 | 1 | 1 | 50% |
| Notification System | 1 | 4 | 2 | 43% |
| Offer Management | 3 | 0 | 2 | 60% |
| Interview Flow | 3 | 1 | 0 | 87% |
| Onboarding System | 0 | 0 | 6 | 0% |
| Call Recordings | 2 | 1 | 0 | 83% |
| Application History | 3 | 1 | 0 | 87% |

**Overall Platform Score:** 58% Complete

---

## RECOMMENDATIONS

### Immediate Actions (This Week)

1. **Fix Notifications Table**
   - Add schema definition
   - Generate migration
   - Deploy to production
   - **Blocks:** All notification features

2. **Add Counter Offer Endpoint**
   - Create API endpoint
   - Build UI component
   - Test negotiation flow
   - **Blocks:** Salary negotiation

### Short-Term (Next 2-4 Weeks)

3. **Build Onboarding System MVP**
   - Create database schema
   - Build task management API
   - Create basic UI
   - Add document upload (no e-sign yet)

4. **Restore Application APIs**
   - Un-archive withdraw endpoint
   - Add application submission endpoint
   - Test full application flow

5. **Add Interview Reminders**
   - Implement Vercel Cron job
   - Create reminder generation logic
   - Test notification delivery

### Long-Term (1-2 Months)

6. **Complete Notification Center**
   - Build bell icon component
   - Add notification dropdown
   - Implement push notifications

7. **Add Recording Access UI**
   - Implement visibility controls
   - Build recording player component
   - Add transcript viewer

8. **Enhanced Rejection Feedback**
   - Add feedback display
   - Implement visibility rules
   - Improve candidate experience

---

## CONCLUSION

**Current State:** BPOC has strong foundations for core hiring features (applications, interviews, video calls) but has critical gaps in notifications, onboarding, and offer negotiation.

**Biggest Risk:** The notifications table not existing in the schema will cause runtime errors. This must be fixed immediately.

**Biggest Opportunity:** Adding counter offer functionality would significantly improve candidate experience in the Filipino market where salary negotiation is expected.

**Path Forward:**
1. Fix notifications table (1 day)
2. Add counter offer functionality (1 week)
3. Build onboarding system MVP (2-3 weeks)
4. Restore missing application endpoints (2-3 days)
5. Add interview reminders (3-4 days)

**Estimated Time to Full Requirements Compliance:** 6-8 weeks

---

**Last Updated:** January 5, 2026
**Audit Completed By:** Claude Code
**Status:** Ready for prioritization and implementation
