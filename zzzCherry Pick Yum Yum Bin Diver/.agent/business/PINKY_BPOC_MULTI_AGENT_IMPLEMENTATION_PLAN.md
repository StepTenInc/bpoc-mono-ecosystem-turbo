# BPOC MULTI-AGENT IMPLEMENTATION PLAN
**Generated:** January 31, 2026
**Execution Strategy:** Parallel + Sequential Waves
**Estimated Total Time:** 20-30 hours (critical path) | 80-120 hours (full production)

---

## EXECUTION PHILOSOPHY

This plan organizes work into **3 sequential waves** with **parallel agents within each wave**. Each wave must complete before the next begins to avoid dependency conflicts.

### Wave Structure:
- **WAVE 1 (CRITICAL BLOCKERS):** 5 parallel agents - 8-12 hours
- **WAVE 2 (INTEGRATIONS):** 4 parallel agents - 6-10 hours
- **WAVE 3 (POLISH & FEATURES):** 6 parallel agents - 6-8 hours

**Total Critical Path:** 20-30 hours
**Total with Post-Launch:** 80-120 hours (WAVE 4-5)

---

## WAVE 1: CRITICAL BLOCKERS (PARALLEL)
**Objective:** Fix show-stopping issues preventing end-to-end flow
**Duration:** 8-12 hours
**Dependencies:** None - all agents can run in parallel

### Agent 1.1: DATABASE_SCHEMA_FIXER
**Role:** Database schema corrections and migrations
**Priority:** P0 (CRITICAL)
**Estimated Time:** 2 hours

**Tasks:**
1. Create migration for `onboarding_tasks` table
   - Extract schema from backup `/backups/BPOC_BACKUP_20260121/full_database_dump.sql`
   - Create `/supabase/migrations/20260131_create_onboarding_tasks.sql`
   - Include: id, application_id, task_type, title, description, is_required, due_date, status, attachments, form_data, signature_data
   - Add RLS policies (candidates, recruiters, admins)
   - Create indexes on application_id, status, due_date
   - Test with existing onboarding API endpoints

2. Fix job approval status inconsistency
   - Standardize `approval_status` values in jobs table
   - Update `/src/app/api/recruiter/jobs/create/route.ts` to use `pending_approval` (not `pending_review`)
   - Verify admin dashboard queries match

3. Add missing recruiter verification columns
   - `agencies.nbi_clearance_url` (TEXT)
   - `agencies.birn_number` (VARCHAR 50)
   - `agencies.payment_method_id` (TEXT)
   - `agencies.payment_status` (enum: pending, verified, failed)

4. Create missing interview scheduling tables
   - `interview_time_proposals` table
   - `time_proposal_responses` table

**Files to Modify:**
- `/supabase/migrations/20260131_fix_critical_schema.sql` (CREATE)

**Acceptance Criteria:**
- [ ] onboarding_tasks table created with RLS
- [ ] All existing onboarding APIs work without errors
- [ ] Job approval statuses standardized
- [ ] Admin dashboard shows pending jobs correctly
- [ ] Interview scheduling tables ready for UI

---

### Agent 1.2: SECURITY_PATCHER
**Role:** Fix critical security vulnerabilities
**Priority:** P0 (CRITICAL)
**Estimated Time:** 1 hour

**Tasks:**
1. Remove email/phone from client portal API
   - File: `/src/app/api/client/jobs/[token]/candidates/[id]/route.ts`
   - Lines 175-176: Delete email and phone from response
   - Verify client portal UI doesn't break (should gracefully handle missing fields)

2. Add rate limiting to token validation
   - File: `/src/lib/client-tokens.ts`
   - Add rate limiting wrapper using Upstash or similar
   - Max 100 validation requests per IP per hour

3. Enforce CLIENT_TOKEN_SECRET validation
   - File: `/src/lib/client-tokens.ts`
   - Add startup check: throw error if secret is default value
   - Add to `.env.local.example`

4. Add notes access control
   - File: `/src/app/api/recruiter/applications/status/route.ts`
   - Add optional `is_private` field to recruiter_notes
   - Filter notes by `reviewed_by` if marked private

**Files to Modify:**
- `/src/app/api/client/jobs/[token]/candidates/[id]/route.ts`
- `/src/lib/client-tokens.ts`
- `/src/app/api/recruiter/applications/status/route.ts`

**Acceptance Criteria:**
- [ ] Client portal CANNOT see candidate email/phone
- [ ] Token validation rate-limited
- [ ] Server fails to start if CLIENT_TOKEN_SECRET is default
- [ ] Recruiters can mark notes as private

---

### Agent 1.3: NOTIFICATIONS_ACTIVATOR
**Role:** Activate notification system across all workflows
**Priority:** P0 (CRITICAL)
**Estimated Time:** 4 hours

**Tasks:**
1. Application notifications
   - File: `/src/app/api/jobs/apply/route.ts` (after line 65)
   - Add: Application submission confirmation
   - Type: `application_submitted`

2. Status change notifications
   - File: `/src/app/api/recruiter/applications/status/route.ts` (after line 68)
   - Add: Notification for each status change
   - Types: `application_under_review`, `application_shortlisted`, `application_rejected`

3. Interview notifications
   - File: `/src/app/api/recruiter/applications/[id]/route.ts` (interview scheduling)
   - Add: Interview scheduled notification
   - Type: `interview_scheduled`
   - Include: Date, time, join link

4. Offer notifications (already exist - verify working)
   - Verify: `offer_received`, `offer_accepted`, `offer_rejected`

5. Onboarding notifications
   - File: `/src/app/api/onboarding/initialize/route.ts`
   - Add: Onboarding started notification
   - Type: `onboarding_started`

6. Admin action notifications
   - File: `/src/app/api/admin/jobs/route.ts`
   - Add: Job approval/rejection notifications to recruiter
   - Types: `job_approved`, `job_rejected`

7. Email integration
   - Verify all notification types trigger emails (use existing email service)

**Files to Modify:**
- `/src/app/api/jobs/apply/route.ts`
- `/src/app/api/recruiter/applications/status/route.ts`
- `/src/app/api/recruiter/applications/[id]/route.ts`
- `/src/app/api/onboarding/initialize/route.ts`
- `/src/app/api/admin/jobs/route.ts`

**Acceptance Criteria:**
- [ ] Candidates notified on application submission
- [ ] Candidates notified on every status change
- [ ] All parties notified on interview scheduling
- [ ] Recruiters notified on job approval/rejection
- [ ] Email sent for all critical notifications
- [ ] In-app notification center shows unread count

---

### Agent 1.4: TRANSCRIPTION_PIPELINE_REBUILDER
**Role:** Fix broken transcription system using CloudConvert
**Priority:** P0 (CRITICAL)
**Estimated Time:** 5 hours

**Tasks:**
1. Remove FFmpeg dependency
   - File: `/src/app/api/video/transcribe/route.ts`
   - Delete all FFmpeg-related code (lines 35-82)

2. Integrate CloudConvert
   - Step 1: Submit conversion job
     - POST `/api/cloudconvert` with Daily.co recording URL
     - Format: MP4/WebM → MP3
     - Wait for job completion (poll every 2 seconds, max 60 seconds)

   - Step 2: Download converted file
     - Fetch MP3 from CloudConvert download URL
     - Store temporarily in memory (not disk)

   - Step 3: Send to Whisper
     - Use existing Whisper integration (keep lines 140-220)
     - Pass MP3 buffer instead of local file

   - Step 4: Store transcription
     - Keep existing storage logic (lines 225-280)

3. Add error handling
   - CloudConvert timeout (>90 seconds) → fallback to manual transcription
   - Whisper failure → store error in video_call_transcripts.error_message
   - Daily.co URL expiry → retry with Supabase storage URL if available

4. Update webhook handler
   - File: `/src/app/api/video/webhook/route.ts`
   - Ensure transcription triggered automatically on recording.ready

5. Add manual retry endpoint
   - File: `/src/app/api/video/transcribe/retry/route.ts` (CREATE)
   - Allow admins to manually retry failed transcriptions
   - Fetch from Supabase storage if Daily URL expired

**Files to Modify:**
- `/src/app/api/video/transcribe/route.ts` (MAJOR REWRITE)
- `/src/app/api/video/webhook/route.ts` (VERIFY)
- `/src/app/api/video/transcribe/retry/route.ts` (CREATE)

**Acceptance Criteria:**
- [ ] Transcription works without FFmpeg
- [ ] CloudConvert converts Daily.co recordings to MP3
- [ ] Whisper transcribes audio successfully
- [ ] Transcriptions stored in database with summary
- [ ] Failed transcriptions can be manually retried
- [ ] Error messages logged for debugging

---

### Agent 1.5: INTERVIEW_SCHEDULER_UI_BUILDER
**Role:** Build interview scheduling and time negotiation system
**Priority:** P0 (CRITICAL)
**Estimated Time:** 12 hours

**Tasks:**
1. Create interview scheduling modal (Recruiter)
   - File: `/src/components/recruiter/InterviewSchedulerModal.tsx` (CREATE)
   - Features:
     - Calendar date picker (react-day-picker or similar)
     - Time slot picker (15-min intervals, 8am-8pm)
     - Interview type dropdown (pre-screen, round 1, round 2, final)
     - Participant selection (candidate + optional client)
     - Duration selector (30/60/90 minutes)
     - Multiple time proposal slots (up to 3 alternatives)
     - Notes field
   - Validation:
     - At least 1 time slot
     - All slots in future (>2 hours from now)
     - No overlapping with existing interviews

2. Create time proposal API
   - File: `/src/app/api/recruiter/interviews/propose/route.ts` (CREATE)
   - POST endpoint:
     - Validate recruiter permissions
     - Create interview record (status: pending_scheduling)
     - Create time_proposal record with multiple slots
     - Send notification to candidate (and client if applicable)
     - Return proposal ID

3. Create candidate time response UI
   - File: `/src/components/candidate/InterviewTimeResponseModal.tsx` (CREATE)
   - Features:
     - Display all proposed time slots
     - Radio buttons to select preferred time
     - "Propose alternative times" option
     - Alternative time picker (if none work)
     - Justification message field

4. Create candidate time response API
   - File: `/src/app/api/candidate/interviews/respond/route.ts` (CREATE)
   - POST endpoint:
     - Validate candidate owns application
     - If accepted: Create Daily.co room, update interview status to scheduled
     - If alternative: Create counter-proposal, notify recruiter
     - Send confirmation notification

5. Integrate into recruiter applications page
   - File: `/src/app/(recruiter)/recruiter/applications/[id]/page.tsx`
   - Add "Schedule Interview" button
   - Opens InterviewSchedulerModal
   - Refresh page on successful schedule

6. Integrate into candidate applications page
   - File: `/src/app/(candidate)/candidate/applications/page.tsx` (CREATE or find)
   - Show pending interview proposals with badge
   - Open InterviewTimeResponseModal on click
   - Show confirmed interviews with join link

7. Three-way interview coordination
   - Support client as third participant
   - Send proposal to client contact email
   - Client responds via token-based link (no login)
   - Create `/client/interviews/[proposalToken]` page

**Files to Create:**
- `/src/components/recruiter/InterviewSchedulerModal.tsx`
- `/src/components/candidate/InterviewTimeResponseModal.tsx`
- `/src/app/api/recruiter/interviews/propose/route.ts`
- `/src/app/api/candidate/interviews/respond/route.ts`
- `/src/app/client/interviews/[proposalToken]/page.tsx`

**Files to Modify:**
- `/src/app/(recruiter)/recruiter/applications/[id]/page.tsx`
- `/src/app/(candidate)/candidate/applications/page.tsx`

**Acceptance Criteria:**
- [ ] Recruiter can propose interview times (1-3 slots)
- [ ] Candidate receives notification with time options
- [ ] Candidate can accept or propose alternatives
- [ ] Daily.co room auto-created on acceptance
- [ ] Three-way interviews support client participation
- [ ] All parties receive email confirmations
- [ ] Scheduled interviews appear in calendars
- [ ] Interview conflicts detected and prevented

---

## WAVE 2: INTEGRATIONS (PARALLEL)
**Objective:** Complete missing integrations and fix workflow gaps
**Duration:** 6-10 hours
**Dependencies:** Requires WAVE 1 completion (database schema, notifications active)

### Agent 2.1: TIMELINE_LOGGER
**Role:** Ensure all workflow events are logged to application timeline
**Priority:** P1 (HIGH)
**Estimated Time:** 2 hours

**Tasks:**
1. Add timeline logging to status changes
   - File: `/src/app/api/recruiter/applications/status/route.ts`
   - After line 68, add `logApplicationActivity()` call
   - Log: status change, recruiter ID, timestamp

2. Add timeline logging to notes
   - Same file, when notes are added without status change
   - Log: "Note added by [Recruiter]"

3. Add timeline logging to interviews
   - File: `/src/app/api/recruiter/interviews/propose/route.ts`
   - Log: "Interview scheduled" with date/time

4. Add timeline logging to offers
   - Verify existing: offer sent, accepted, rejected, countered

5. Add timeline logging to onboarding
   - File: `/src/app/api/onboarding/[step]/route.ts` (each step)
   - Log: "Section completed: [Personal Info]"

6. Display enhancements
   - File: `/src/components/shared/application/ActivityTimeline.tsx`
   - Add icons for each event type
   - Color-code by action type (green=progress, red=rejection, blue=info)

**Files to Modify:**
- `/src/app/api/recruiter/applications/status/route.ts`
- `/src/app/api/recruiter/interviews/propose/route.ts`
- `/src/app/api/onboarding/*/route.ts`
- `/src/components/shared/application/ActivityTimeline.tsx`

**Acceptance Criteria:**
- [ ] Every status change logged
- [ ] Every note addition logged
- [ ] Every interview scheduling logged
- [ ] Timeline shows complete application history
- [ ] Timeline visually polished with icons/colors

---

### Agent 2.2: PHILIPPINES_COMPLIANCE_ENFORCER
**Role:** Add missing Philippines compliance requirements
**Priority:** P1 (HIGH)
**Estimated Time:** 3 hours

**Tasks:**
1. Add NBI Clearance to recruiter verification
   - File: `/src/app/(recruiter)/recruiter/signup/documents/page.tsx`
   - Add NBI clearance upload field (same as DTI/SEC)
   - Validation: PDF/JPG/PNG, max 5MB

   - File: `/src/app/api/recruiter/documents/upload/route.ts`
   - Add NBI clearance handling
   - Store to: `agency-documents/{agencyId}/nbi/{timestamp}.pdf`
   - Update: `agencies.nbi_clearance_url`

2. Add BIRN number field
   - File: `/src/app/(recruiter)/recruiter/signup/documents/page.tsx`
   - Add BIRN number input field (12-digit validation)
   - Format: XXX-XXX-XXX-XXX

   - File: `/src/app/api/recruiter/documents/upload/route.ts`
   - Update: `agencies.birn_number`

3. Update admin verification
   - File: `/src/app/(admin)/admin/recruiters/[id]/page.tsx`
   - Display NBI clearance document
   - Display BIRN number
   - Add verification checkboxes for both

4. Add onboarding NBI clearance
   - File: `/src/components/onboarding/steps/Step5Medical.tsx`
   - Add NBI clearance upload (alongside medical)
   - Update: `candidate_onboarding.nbi_clearance_url`

**Files to Modify:**
- `/src/app/(recruiter)/recruiter/signup/documents/page.tsx`
- `/src/app/api/recruiter/documents/upload/route.ts`
- `/src/app/(admin)/admin/recruiters/[id]/page.tsx`
- `/src/components/onboarding/steps/Step5Medical.tsx`
- Schema migration (WAVE 1 already added columns)

**Acceptance Criteria:**
- [ ] Recruiters can upload NBI clearance
- [ ] BIRN number validated and stored
- [ ] Admin verifies both documents
- [ ] Candidates upload NBI during onboarding
- [ ] Philippines compliance checklist 100% complete

---

### Agent 2.3: OFFER_EXPIRATION_AUTOMATOR
**Role:** Implement automatic offer expiration and reminders
**Priority:** P1 (HIGH)
**Estimated Time:** 3 hours

**Tasks:**
1. Create cron job endpoint
   - File: `/src/app/api/cron/expire-offers/route.ts` (CREATE)
   - Query: `job_offers` WHERE `expires_at < NOW() AND status IN ('sent', 'viewed')`
   - Update: `status='expired'`
   - Log: "Offer expired automatically"
   - Send notification: `offer_expired` to candidate

2. Create expiration reminder endpoint
   - File: `/src/app/api/cron/remind-expiring-offers/route.ts` (CREATE)
   - Query: `job_offers` WHERE `expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`
   - Filter: `expiry_reminder_sent = false`
   - Send notification: `offer_expiring` to candidate
   - Update: `expiry_reminder_sent = true`

3. Set up Vercel cron jobs
   - File: `/vercel.json`
   - Add: `{ "path": "/api/cron/expire-offers", "schedule": "0 * * * *" }` (hourly)
   - Add: `{ "path": "/api/cron/remind-expiring-offers", "schedule": "0 8 * * *" }` (daily 8am)

4. Add manual expiration button
   - File: `/src/app/(recruiter)/recruiter/offers/page.tsx`
   - Add "Withdraw Offer" button for sent offers
   - Calls: `/api/recruiter/offers/[id]/withdraw`
   - Updates: `status='withdrawn'`, logs reason

**Files to Create:**
- `/src/app/api/cron/expire-offers/route.ts`
- `/src/app/api/cron/remind-expiring-offers/route.ts`
- `/src/app/api/recruiter/offers/[id]/withdraw/route.ts`

**Files to Modify:**
- `/vercel.json`
- `/src/app/(recruiter)/recruiter/offers/page.tsx`

**Acceptance Criteria:**
- [ ] Offers auto-expire after deadline
- [ ] Candidates receive reminder 24 hours before expiry
- [ ] Recruiters can manually withdraw offers
- [ ] All expiration events logged to timeline

---

### Agent 2.4: ADMIN_UI_POLISHER
**Role:** Complete missing admin UI features
**Priority:** P1 (HIGH)
**Estimated Time:** 2 hours

**Tasks:**
1. Add job rejection reason form
   - File: `/src/app/(admin)/admin/jobs/page.tsx`
   - Current: Reject button exists (line ~320)
   - Add: Modal with textarea for rejection reason
   - Call: PATCH `/api/admin/jobs` with reason

2. Display rejection reasons
   - File: `/src/app/(recruiter)/recruiter/jobs/page.tsx`
   - Show rejection reason if job.status === 'rejected'
   - Display in alert box

3. Add document preview modal
   - File: `/src/app/(admin)/admin/recruiters/[id]/page.tsx`
   - Reference: DocumentPreviewModal component (verify exists)
   - Add inline document viewer (PDF.js or iframe)
   - Support: PDF, PNG, JPG

4. Fix status badge inconsistency
   - File: `/src/app/(admin)/admin/jobs/page.tsx`
   - Display both `status` AND `approval_status`
   - Badge: "Pending Approval" when `approval_status='pending_approval'`

**Files to Modify:**
- `/src/app/(admin)/admin/jobs/page.tsx`
- `/src/app/(recruiter)/recruiter/jobs/page.tsx`
- `/src/app/(admin)/admin/recruiters/[id]/page.tsx`

**Acceptance Criteria:**
- [ ] Admin can enter rejection reason when rejecting jobs
- [ ] Recruiters see rejection feedback
- [ ] Admin can preview uploaded documents inline
- [ ] Approval status badges accurate

---

## WAVE 3: POLISH & FEATURES (PARALLEL)
**Objective:** Enhance UX and add missing workflow features
**Duration:** 6-8 hours
**Dependencies:** Requires WAVE 1-2 completion

### Agent 3.1: ONBOARDING_AUTOMATION
**Role:** Automate onboarding triggers and add missing features
**Priority:** P2 (MEDIUM)
**Estimated Time:** 3 hours

**Tasks:**
1. Auto-trigger onboarding on offer acceptance
   - File: `/src/app/api/candidate/offers/route.ts` (PATCH endpoint)
   - After offer accepted (line ~80), call `/api/onboarding/initialize`
   - Pass: candidate_id, application_id, job details

2. Add "Day One Confirmation" button
   - File: `/src/app/(candidate)/candidate/onboarding/page.tsx`
   - Add button: "I've completed my first day"
   - Call: `/api/candidate/onboarding/confirm-start` (CREATE)
   - Update: `candidate_onboarding.employment_started = true`, `employment_start_date = NOW()`
   - Send notification to recruiter: "Candidate started employment"

3. Add deadline reminders
   - File: `/src/app/api/cron/remind-onboarding-deadlines/route.ts` (CREATE)
   - Query: Onboarding records WHERE `start_date - NOW() < 3 days` AND `is_complete = false`
   - Send notification: "Onboarding due in 3 days"
   - Cron: Daily at 9am

4. Generate contract PDFs
   - File: `/src/app/api/onboarding/generate-contract/route.ts`
   - After HTML generation, convert to PDF using Puppeteer or wkhtmltopdf
   - Store: Supabase Storage at `contracts/{candidateId}/{timestamp}.pdf`
   - Update: `employment_contracts.contract_pdf_url`
   - Generate SHA-256 hash for verification

**Files to Create:**
- `/src/app/api/candidate/onboarding/confirm-start/route.ts`
- `/src/app/api/cron/remind-onboarding-deadlines/route.ts`

**Files to Modify:**
- `/src/app/api/candidate/offers/route.ts`
- `/src/app/(candidate)/candidate/onboarding/page.tsx`
- `/src/app/api/onboarding/generate-contract/route.ts`
- `/vercel.json` (add cron)

**Acceptance Criteria:**
- [ ] Onboarding auto-starts after offer acceptance
- [ ] Candidates can confirm first day of employment
- [ ] Deadline reminders sent 3 days before start date
- [ ] Contract PDFs generated and stored with hash

---

### Agent 3.2: CLIENT_PORTAL_ENHANCER
**Role:** Complete client portal features
**Priority:** P2 (MEDIUM)
**Estimated Time:** 2 hours

**Tasks:**
1. Display pre-screen notes (if shared)
   - File: `/src/app/api/client/jobs/[token]/candidates/[id]/route.ts`
   - Fetch: `video_call_rooms` WHERE `share_with_client = true`
   - Include: pre-screen notes, recording URL

   - File: `/src/app/client/jobs/[token]/candidates/[id]/page.tsx`
   - Display: "Pre-Screen Notes" section
   - Show: Notes, date, duration

2. Add interview recording playback
   - File: Same as above
   - Add: Video player component (react-player or video.js)
   - Source: Recording URL from Supabase Storage
   - Controls: Play/pause, volume, fullscreen

3. Add interview transcript display
   - Show full transcription text
   - Display key points (AI-generated summary)
   - Searchable/copyable

4. Add interview request button
   - File: `/src/app/client/jobs/[token]/candidates/[id]/page.tsx`
   - Add: "Request Interview" button
   - Opens modal: Propose 2-3 time slots
   - Call: `/api/client/interviews/request` (CREATE)
   - Sends notification to recruiter

**Files to Create:**
- `/src/app/api/client/interviews/request/route.ts`

**Files to Modify:**
- `/src/app/api/client/jobs/[token]/candidates/[id]/route.ts`
- `/src/app/client/jobs/[token]/candidates/[id]/page.tsx`

**Acceptance Criteria:**
- [ ] Client sees pre-screen notes if shared
- [ ] Client can watch interview recordings
- [ ] Client can read transcriptions
- [ ] Client can request interview with time proposals
- [ ] Recruiter notified of interview requests

---

### Agent 3.3: MATCHING_ALGORITHM_ENHANCER
**Role:** Improve job matching algorithm
**Priority:** P2 (MEDIUM)
**Estimated Time:** 3 hours

**Tasks:**
1. Add shift preference matching
   - File: `/src/lib/matching/scoring-engine.ts`
   - Add: `calculateShiftCompatibility()` function
   - Logic:
     - Perfect match (same shift): 100%
     - Flexible candidate + any job: 90%
     - Day candidate + night job: 30%
     - Night candidate + day job: 50%
   - Weight: 5% of overall score

2. Add missing skills identification
   - File: `/src/lib/matching/match-service.ts`
   - After match calculation, extract: `job.skills - candidate.skills`
   - Store in: `job_matches.missing_skills` (JSONB array)

   - File: `/src/app/(candidate)/candidate/jobs/page.tsx`
   - Display: "You're missing: [Skill 1], [Skill 2]"
   - Suggestion: "Learn these skills to improve your match"

3. Add location matching
   - File: `/src/lib/matching/scoring-engine.ts`
   - Add: `calculateLocationCompatibility()` function
   - Logic:
     - Same city: 100%
     - Same region: 80%
     - Remote job + any location: 90%
     - Different city + onsite: 40%
   - Weight: 5% of overall score

4. Display match score in applications list
   - File: `/src/app/(recruiter)/recruiter/applications/page.tsx`
   - Fetch: `job_matches.overall_score` for each application
   - Display: Badge "85% match" alongside AI score

5. Add tests
   - File: `/src/lib/matching/__tests__/scoring-engine.test.ts` (CREATE)
   - Test cases:
     - Skills matching (partial, full, none)
     - Salary compatibility (overlap, gap, mismatch)
     - Experience level (perfect, overqualified, underqualified)
     - Shift preferences (all combinations)
     - Location matching (same city, different city, remote)

**Files to Create:**
- `/src/lib/matching/__tests__/scoring-engine.test.ts`

**Files to Modify:**
- `/src/lib/matching/scoring-engine.ts`
- `/src/lib/matching/match-service.ts`
- `/src/app/(candidate)/candidate/jobs/page.tsx`
- `/src/app/(recruiter)/recruiter/applications/page.tsx`
- Schema migration (add missing_skills JSONB column)

**Acceptance Criteria:**
- [ ] Shift preferences factored into match score
- [ ] Missing skills displayed to candidates
- [ ] Location compatibility calculated
- [ ] Match scores shown in recruiter applications list
- [ ] 20+ unit tests passing

---

### Agent 3.4: E2E_TESTING_ENGINEER
**Role:** Write end-to-end tests for critical workflows
**Priority:** P2 (MEDIUM)
**Estimated Time:** 4 hours

**Tasks:**
1. Application submission flow test
   - File: `/tests/e2e/application-flow.spec.ts` (CREATE)
   - Test:
     - Candidate logs in
     - Browses jobs
     - Applies to job
     - Receives notification
     - Application appears in recruiter dashboard
     - Recruiter updates status
     - Candidate receives status notification

2. Interview scheduling flow test
   - File: `/tests/e2e/interview-flow.spec.ts` (CREATE)
   - Test:
     - Recruiter proposes interview times
     - Candidate receives notification
     - Candidate accepts time
     - Daily.co room created
     - All parties receive join links

3. Offer negotiation flow test
   - File: `/tests/e2e/offer-flow.spec.ts` (CREATE)
   - Test:
     - Recruiter sends offer
     - Candidate receives notification
     - Candidate counters offer
     - Recruiter receives notification
     - Recruiter accepts counter
     - Candidate receives acceptance
     - Contract generated

4. Onboarding flow test
   - File: `/tests/e2e/onboarding-flow.spec.ts` (CREATE)
   - Test:
     - Candidate accepts offer
     - Onboarding auto-triggered
     - Candidate completes all 8 steps
     - Documents uploaded
     - Contract signed
     - Admin approves
     - Candidate marks employment started

**Files to Create:**
- `/tests/e2e/application-flow.spec.ts`
- `/tests/e2e/interview-flow.spec.ts`
- `/tests/e2e/offer-flow.spec.ts`
- `/tests/e2e/onboarding-flow.spec.ts`

**Test Framework:** Playwright or Cypress

**Acceptance Criteria:**
- [ ] 4 E2E test suites created
- [ ] All tests passing on local dev
- [ ] CI/CD integration configured
- [ ] Test coverage >70% of critical paths

---

### Agent 3.5: CANDIDATE_UX_IMPROVER
**Role:** Enhance candidate-facing UI/UX
**Priority:** P2 (MEDIUM)
**Estimated Time:** 2 hours

**Tasks:**
1. Create notification center
   - File: `/src/app/(candidate)/candidate/notifications/page.tsx` (CREATE)
   - Display: All notifications with read/unread status
   - Filter: All, Unread, Applications, Interviews, Offers
   - Mark as read on click

2. Add notification badge
   - File: `/src/components/shared/layout/CandidateNav.tsx`
   - Add: Badge with unread count
   - Fetch: `notifications` WHERE `is_read = false`
   - Real-time update (polling every 30s)

3. Improve applications page
   - File: `/src/app/(candidate)/candidate/applications/page.tsx` (verify exists or CREATE)
   - Display: All applications with status badges
   - Sort by: Most recent, Status, Match score
   - Show: Timeline, interviewer notes (if shared), next steps

4. Add interview preparation page
   - File: `/src/app/(candidate)/candidate/interviews/[id]/prep/page.tsx` (CREATE)
   - Show: Company info, job details, interview tips
   - Checklist: Resume ready, quiet space, internet tested
   - Join button (disabled until 5 min before)

**Files to Create:**
- `/src/app/(candidate)/candidate/notifications/page.tsx`
- `/src/app/(candidate)/candidate/applications/page.tsx`
- `/src/app/(candidate)/candidate/interviews/[id]/prep/page.tsx`

**Files to Modify:**
- `/src/components/shared/layout/CandidateNav.tsx`

**Acceptance Criteria:**
- [ ] Notification center with unread badge
- [ ] Applications page shows complete status
- [ ] Interview prep page with checklist
- [ ] Candidate UX score >8/10 (user testing)

---

### Agent 3.6: ANALYTICS_DASHBOARD_BUILDER
**Role:** Build admin analytics dashboard
**Priority:** P2 (MEDIUM)
**Estimated Time:** 4 hours

**Tasks:**
1. Create analytics overview page
   - File: `/src/app/(admin)/admin/analytics/page.tsx` (CREATE)
   - Metrics cards:
     - Total candidates
     - Total applications (this month)
     - Total jobs posted (this month)
     - Total placements (hired)
     - Success rate (hired / applications)
     - Avg time to hire (days)

2. Funnel visualization
   - Applications → Shortlisted → Interviewed → Offered → Hired
   - Show counts and conversion rates at each stage
   - Filter by date range, agency, job

3. Top performing metrics
   - Top 10 jobs by applications
   - Top 10 jobs by placements
   - Top 10 recruiters by placements
   - Top 10 agencies by activity

4. Time-series charts
   - Applications over time (line chart)
   - Placements over time (line chart)
   - Filter by: 7 days, 30 days, 90 days, all time

5. Create analytics API endpoints
   - File: `/src/app/api/admin/analytics/overview/route.ts` (CREATE)
   - File: `/src/app/api/admin/analytics/funnel/route.ts` (CREATE)
   - File: `/src/app/api/admin/analytics/top-performers/route.ts` (CREATE)
   - File: `/src/app/api/admin/analytics/time-series/route.ts` (CREATE)

6. Add export functionality
   - Export as CSV: Applications, Placements, Recruiter stats
   - Button: "Export to CSV"
   - Generate on server, download file

**Files to Create:**
- `/src/app/(admin)/admin/analytics/page.tsx`
- `/src/app/api/admin/analytics/overview/route.ts`
- `/src/app/api/admin/analytics/funnel/route.ts`
- `/src/app/api/admin/analytics/top-performers/route.ts`
- `/src/app/api/admin/analytics/time-series/route.ts`

**Charting Library:** Recharts or Chart.js

**Acceptance Criteria:**
- [ ] Analytics dashboard with 4 sections
- [ ] Funnel shows conversion rates
- [ ] Time-series charts with date filters
- [ ] CSV export working
- [ ] Dashboard loads in <2 seconds

---

## WAVE 4: POST-LAUNCH (OPTIONAL)
**Objective:** Payment integration and advanced features
**Duration:** 30-40 hours
**Dependencies:** MVP launched successfully

### Agent 4.1: STRIPE_PAYMENT_INTEGRATOR
**Priority:** P3 (NICE-TO-HAVE)
**Estimated Time:** 16 hours

**Tasks:**
1. Stripe Connect for recruiters
2. Subscription tiers (Free, Pro, Enterprise)
3. Per-placement billing option
4. Payment method management
5. Invoice generation
6. Webhook handling for payment events

---

### Agent 4.2: E_SIGNATURE_INTEGRATOR
**Priority:** P3 (NICE-TO-HAVE)
**Estimated Time:** 12 hours

**Tasks:**
1. Integrate DocuSign or HelloSign
2. Replace canvas signature with legal e-signature
3. Add employer signature flow
4. Certificate generation
5. Compliance documentation

---

### Agent 4.3: DOCUMENT_VERIFICATION_AI
**Priority:** P3 (NICE-TO-HAVE)
**Estimated Time:** 8 hours

**Tasks:**
1. OCR for ID documents
2. Automatic data extraction
3. Forgery detection
4. ID format validation
5. Auto-approve/reject based on confidence

---

## EXECUTION STRATEGY

### Parallelization Rules:
1. **Within Waves:** All agents run in parallel
2. **Between Waves:** Sequential (must complete Wave N before Wave N+1)
3. **Agent Dependencies:** None within same wave

### Resource Allocation:
- **Wave 1:** 5 agents × 2-12 hours = 10-60 agent-hours (can run simultaneously on 5 threads)
- **Wave 2:** 4 agents × 2-3 hours = 8-12 agent-hours
- **Wave 3:** 6 agents × 2-4 hours = 12-24 agent-hours
- **Total Critical Path:** 30-96 agent-hours (parallelized to 20-30 real hours)

### Suggested Execution Order:
```
DAY 1 (8-10 hours):
  Launch Wave 1 (all 5 agents in parallel)
  - DATABASE_SCHEMA_FIXER (2h)
  - SECURITY_PATCHER (1h)
  - NOTIFICATIONS_ACTIVATOR (4h)
  - TRANSCRIPTION_PIPELINE_REBUILDER (5h)
  - INTERVIEW_SCHEDULER_UI_BUILDER (12h) ← Longest, starts first

DAY 2 (6-8 hours):
  Launch Wave 2 (all 4 agents in parallel)
  - TIMELINE_LOGGER (2h)
  - PHILIPPINES_COMPLIANCE_ENFORCER (3h)
  - OFFER_EXPIRATION_AUTOMATOR (3h)
  - ADMIN_UI_POLISHER (2h)

DAY 3 (6-8 hours):
  Launch Wave 3 (all 6 agents in parallel)
  - ONBOARDING_AUTOMATION (3h)
  - CLIENT_PORTAL_ENHANCER (2h)
  - MATCHING_ALGORITHM_ENHANCER (3h)
  - E2E_TESTING_ENGINEER (4h)
  - CANDIDATE_UX_IMPROVER (2h)
  - ANALYTICS_DASHBOARD_BUILDER (4h)

DAY 4 (4 hours):
  - Integration testing
  - Bug fixes
  - Deployment preparation
```

---

## MONITORING & VERIFICATION

### After Wave 1:
- [ ] All 5 critical blockers resolved
- [ ] Can create application → interview → offer → onboarding end-to-end
- [ ] Notifications firing for all events
- [ ] Client portal secure (no contact details)
- [ ] Database migrations applied successfully

### After Wave 2:
- [ ] Complete application timeline
- [ ] Philippines compliance 100%
- [ ] Offers expire automatically
- [ ] Admin UI polished

### After Wave 3:
- [ ] Onboarding auto-triggered
- [ ] Client portal feature-complete
- [ ] Match algorithm improved
- [ ] E2E tests passing
- [ ] Analytics dashboard live

---

## ROLLBACK STRATEGY

If any agent fails critically:
1. **Isolate:** Mark agent as failed, don't block other agents
2. **Rollback:** Use git to revert changes from failed agent only
3. **Debug:** Run agent in isolation with verbose logging
4. **Retry:** Fix issue and re-run agent independently
5. **Report:** Document failure in agent execution log

---

## SUCCESS METRICS

### Wave 1 Success Criteria:
- **Database:** All migrations applied without errors
- **Security:** Client portal exploit patched
- **Notifications:** >90% delivery rate
- **Transcription:** >95% success rate
- **Scheduling:** Can schedule interview in <30 seconds

### Wave 2 Success Criteria:
- **Timeline:** 100% of events logged
- **Compliance:** All documents collected
- **Expiration:** Offers auto-expire on time
- **Admin:** Rejection flow complete

### Wave 3 Success Criteria:
- **Onboarding:** >80% auto-trigger success
- **Client:** Feature parity with requirements
- **Matching:** Score accuracy >85%
- **Testing:** >70% code coverage
- **UX:** User satisfaction >8/10

---

## FINAL DELIVERABLES

### After WAVE 1-3 Complete:
1. **Codebase:** All changes merged to main branch
2. **Database:** All migrations applied to production
3. **Tests:** E2E test suite passing
4. **Documentation:** API docs updated
5. **Deployment:** Staging environment tested
6. **Sign-off:** Ready for production launch

---

**Plan Created by:** Claude Code (Sonnet 4.5)
**Execution Model:** Multi-agent parallel processing
**Estimated ROI:** 20-30 hours → Full platform functionality
**Next Step:** User approval to begin Wave 1
