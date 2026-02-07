# Candidate Functional Flow Requirements

> **Actions, States, Notifications & Data Requirements**
> 
> Version: 1.0 | Last Updated: January 5, 2026
> 
> **Scope:** Functional flows only - no UI layout specifics
> **Note:** Email notifications excluded - will be added later

---

## Table of Contents

1. [Candidate States](#candidate-states)
2. [Application Flow](#application-flow)
3. [Notification System](#notification-system)
4. [Real-Time Call Handling](#real-time-call-handling)
5. [Pre-Screen Call Flow](#pre-screen-call-flow)
6. [Client Interview Flow](#client-interview-flow)
7. [Offer Flow](#offer-flow)
8. [Counter Offer Flow](#counter-offer-flow)
9. [Acceptance Flow](#acceptance-flow)
10. [Onboarding Flow](#onboarding-flow)
11. [Rejection & Feedback](#rejection--feedback)
12. [Application History](#application-history)
13. [Data Candidate Needs to See](#data-candidate-needs-to-see)
14. [Actions Candidate Can Take](#actions-candidate-can-take)
15. [Notification Types](#notification-types)
16. [Database Requirements](#database-requirements)
17. [API Endpoints Required](#api-endpoints-required)

---

## Candidate States

### Application Status States

| Status | Description | Next Possible States |
|--------|-------------|---------------------|
| `submitted` | Application received | `under_review`, `rejected` |
| `under_review` | Recruiter is actively reviewing | `shortlisted`, `rejected` |
| `shortlisted` | Passed recruiter gate, visible to client | `interview_scheduled`, `rejected` |
| `interview_scheduled` | Interview booked | `interviewed`, `rejected`, `no_show` |
| `interviewed` | Interview completed | `offer_sent`, `rejected` |
| `offer_sent` | Offer extended to candidate | `offer_accepted`, `offer_declined`, `negotiating` |
| `negotiating` | Counter offer in progress | `offer_accepted`, `offer_declined`, `offer_sent` |
| `offer_accepted` | Candidate accepted offer | `hired` |
| `offer_declined` | Candidate declined offer | (terminal) |
| `hired` | Candidate hired, onboarding | `started`, `no_show` |
| `started` | Day 1 completed | (terminal - success) |
| `rejected` | Not selected | (terminal) |
| `withdrawn` | Candidate withdrew | (terminal) |
| `no_show` | Candidate didn't show up | (terminal) |

### State Flow Diagram

```
                                    ┌──────────────┐
                                    │  withdrawn   │
                                    └──────────────┘
                                           ▲
                                           │ (candidate action)
                                           │
┌───────────┐    ┌───────────┐    ┌───────────────┐    ┌─────────────────┐
│ submitted │ ─▶ │under_review│ ─▶ │  shortlisted  │ ─▶ │interview_scheduled│
└───────────┘    └───────────┘    └───────────────┘    └─────────────────┘
      │                │                  │                     │
      ▼                ▼                  ▼                     ▼
┌───────────┐    ┌───────────┐    ┌───────────────┐    ┌─────────────────┐
│ rejected  │    │ rejected  │    │   rejected    │    │   interviewed   │
└───────────┘    └───────────┘    └───────────────┘    └─────────────────┘
                                                              │
                      ┌───────────────────────────────────────┤
                      │                                       │
                      ▼                                       ▼
               ┌───────────┐                          ┌───────────────┐
               │ rejected  │                          │  offer_sent   │
               └───────────┘                          └───────────────┘
                                                              │
                      ┌───────────────┬───────────────────────┼───────────────┐
                      │               │                       │               │
                      ▼               ▼                       ▼               ▼
               ┌───────────┐  ┌─────────────┐         ┌─────────────┐  ┌───────────┐
               │ declined  │  │ negotiating │ ◀──────▶│offer_accepted│  │  expired  │
               └───────────┘  └─────────────┘         └─────────────┘  └───────────┘
                                                              │
                                                              ▼
                                                       ┌───────────┐
                                                       │   hired   │
                                                       └───────────┘
                                                              │
                                              ┌───────────────┴───────────────┐
                                              │                               │
                                              ▼                               ▼
                                       ┌───────────┐                   ┌───────────┐
                                       │  started  │                   │  no_show  │
                                       └───────────┘                   └───────────┘
```

---

## Application Flow

### Apply to Job

**Trigger:** Candidate clicks apply on a job listing

**Process:**
1. Candidate selects job
2. Candidate chooses resume (if multiple)
3. Candidate adds cover note (optional)
4. Candidate confirms submission
5. System creates application record
6. System sends confirmation notification
7. Application status = `submitted`

**Data Created:**
```
application {
  id: uuid
  candidate_id: uuid
  job_id: uuid
  resume_id: uuid
  cover_note: text (optional)
  status: "submitted"
  applied_at: timestamp
}
```

**Candidate Sees After:**
- Confirmation message
- Application appears in "My Applications"
- Status: Submitted
- "What happens next" information

---

## Notification System

### Notification Channels (In-App Only)

| Channel | Description | Use Case |
|---------|-------------|----------|
| **Notification Center** | Bell icon with badge count | All notifications |
| **Push Notification** | Browser/mobile push | Urgent actions, calls |
| **Real-Time Modal** | Full-screen overlay | Incoming calls only |
| **Toast/Banner** | Temporary in-app message | Confirmations, updates |
| **Badge Updates** | Counter on navigation items | New items count |

### Notification Data Structure

```
notification {
  id: uuid
  candidate_id: uuid
  type: enum (see types below)
  title: string
  message: string
  action_url: string (optional)
  action_label: string (optional)
  related_id: uuid (application_id, offer_id, etc.)
  related_type: string (application, offer, interview, etc.)
  is_read: boolean
  is_urgent: boolean
  created_at: timestamp
  expires_at: timestamp (optional)
}
```

---

## Real-Time Call Handling

### Incoming Call Flow

**Trigger:** Recruiter or Client initiates call to candidate

**Process:**
1. System sends real-time notification to candidate
2. Candidate's app displays incoming call modal
3. Call rings for 60 seconds (configurable)
4. Candidate can: Answer OR Decline
5. If no response → Missed call notification

**Candidate Actions:**

| Action | Result |
|--------|--------|
| **Answer** | Opens video call interface, connects to room |
| **Decline** | Call rejected, caller notified |
| **No Response** | Missed call after timeout |

**Call Notification Data:**
```
incoming_call {
  room_id: uuid
  caller_name: string
  caller_role: "recruiter" | "client"
  caller_company: string
  caller_avatar: url (optional)
  job_title: string
  call_type: "prescreen" | "interview" | "general"
  join_url: string
  token: string
  expires_at: timestamp
}
```

**States:**
- `ringing` - Call incoming, waiting for answer
- `answered` - Candidate answered, in call
- `declined` - Candidate declined
- `missed` - No answer, timed out
- `ended` - Call completed

### Missed Call Handling

**When:** Candidate doesn't answer within timeout

**Process:**
1. Call ends for caller
2. Candidate receives "Missed Call" notification
3. Notification shows: who called, when, for what job
4. Candidate can view details but cannot call back directly

---

## Pre-Screen Call Flow

### Scheduled Pre-Screen

**Trigger:** Recruiter schedules pre-screen call

**Candidate Experience:**
1. Receives notification: "Pre-screen scheduled"
2. Sees in upcoming events: date, time, job, recruiter
3. Gets reminder notification (1 hour before, 15 min before)
4. Joins call at scheduled time

### Instant/Quick Pre-Screen

**Trigger:** Recruiter calls candidate directly (no schedule)

**Candidate Experience:**
1. Receives real-time incoming call notification
2. Sees: recruiter name, company, job title
3. Answers or declines
4. If answered: enters video call

### During Pre-Screen

**Candidate Can:**
- See video feed
- Toggle microphone
- Toggle camera
- Share screen (if enabled)
- End call

**Candidate Sees:**
- Recruiter video/audio
- Call duration
- Job/application context

### After Pre-Screen

**Candidate Sees:**
- Call marked as completed in timeline
- Status may update (if recruiter updates)
- Recording available (if enabled and shared)
- Transcript available (if enabled and shared)

**Possible Outcomes:**
- Passed → Status moves to `shortlisted`
- Failed → Status moves to `rejected` with feedback

---

## Client Interview Flow

### Interview Scheduled

**Trigger:** Interview scheduled (by recruiter or client)

**Candidate Receives:**
- Notification: "Interview Scheduled"
- Details: date, time, company, interviewer name, job title
- Interview type: Round 1, Round 2, Final, etc.

**Data Candidate Sees:**
```
interview {
  id: uuid
  application_id: uuid
  job_title: string
  company_name: string
  interview_type: string
  scheduled_at: timestamp
  duration_minutes: integer
  interviewer_name: string (optional)
  interviewer_role: string (optional)
  join_url: string (available close to time)
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
}
```

### Interview Reminders

| Timing | Notification |
|--------|--------------|
| 24 hours before | "Interview tomorrow" |
| 1 hour before | "Interview in 1 hour" |
| 15 minutes before | "Interview starting soon" + Join button active |

### Join Interview

**Trigger:** Candidate clicks "Join" (available ~15 min before)

**Process:**
1. System generates fresh join token
2. Candidate enters video call room
3. Waits in waiting room (if enabled)
4. Host admits candidate
5. Interview begins

### After Interview

**Candidate Sees:**
- Interview marked as completed
- Status may update based on outcome
- Recording available (if shared)
- Transcript available (if shared)
- Feedback (if provided and shared)

---

## Offer Flow

### Offer Received

**Trigger:** Client/Recruiter sends offer

**Candidate Receives:**
- Notification: "Offer Received!"
- Offer details available to view

**Offer Data Candidate Sees:**
```
offer {
  id: uuid
  application_id: uuid
  job_title: string
  company_name: string
  
  // Compensation
  salary_offered: decimal
  salary_currency: string (e.g., "PHP")
  salary_type: "hourly" | "monthly" | "yearly"
  
  // Benefits
  benefits: array of strings
  
  // Terms
  start_date: date
  additional_terms: text (optional)
  
  // Status
  status: "sent" | "viewed" | "accepted" | "declined" | "negotiating" | "expired" | "withdrawn"
  expires_at: timestamp
  
  // Timestamps
  sent_at: timestamp
  viewed_at: timestamp
  responded_at: timestamp
}
```

### Offer Actions

**Candidate Can:**

| Action | Description | Result |
|--------|-------------|--------|
| **View** | Opens offer details | `status` → `viewed` |
| **Accept** | Accepts offer as-is | `status` → `accepted` |
| **Decline** | Rejects offer | `status` → `declined` |
| **Counter** | Proposes different terms | `status` → `negotiating` |

---

## Counter Offer Flow

### Submit Counter Offer

**Trigger:** Candidate clicks "Counter" on offer

**Process:**
1. Candidate enters desired salary (in PHP or original currency)
2. Candidate adds message/reason (optional)
3. Candidate submits counter
4. Offer status → `negotiating`
5. Employer receives notification

**Counter Data:**
```
counter_offer {
  offer_id: uuid
  requested_salary: decimal
  requested_currency: string
  candidate_message: text (optional)
  submitted_at: timestamp
}
```

### Counter Response Handling

**Possible Responses from Employer:**

| Response | Candidate Sees | Next Status |
|----------|----------------|-------------|
| **Accept Counter** | "Counter offer accepted!" | `accepted` |
| **Reject Counter** | "Counter offer declined" | `declined` or original offer |
| **New Counter** | Updated offer with new terms | `sent` (new offer) |

### Counter Negotiation Loop

```
Candidate                              Employer
    │                                      │
    │  ─── Counter: ₱52,000 ──────────▶   │
    │                                      │
    │  ◀── Response: Meet at ₱48,000 ───  │
    │                                      │
    │  ─── Accept ₱48,000 ────────────▶   │
    │                                      │
    │  ◀── Offer Accepted ────────────    │
    │                                      │
```

---

## Acceptance Flow

### Accept Offer

**Trigger:** Candidate clicks "Accept"

**Process:**
1. Candidate reviews offer details
2. Candidate confirms acceptance
3. System updates offer status → `accepted`
4. System updates application status → `hired`
5. Candidate receives confirmation
6. Onboarding tasks become available

**Acceptance Confirmation:**
- Congratulations message
- Summary of accepted terms (salary, start date)
- Next steps (onboarding)
- Onboarding checklist appears

### Decline Offer

**Trigger:** Candidate clicks "Decline"

**Process:**
1. Candidate selects reason (optional dropdown)
2. Candidate adds message (optional)
3. Candidate confirms decline
4. System updates offer status → `declined`
5. Application may close or remain for other opportunities

**Decline Reasons (optional):**
- Accepted another offer
- Salary too low
- Not the right fit
- Personal reasons
- Other

---

## Onboarding Flow

### Onboarding Activation

**Trigger:** Candidate accepts offer, status → `hired`

**Process:**
1. Agency creates/assigns onboarding tasks
2. Candidate sees onboarding checklist
3. Candidate completes tasks
4. Agency reviews/approves submissions
5. Agency marks onboarding complete

### Onboarding Task Types

| Task Type | Candidate Action | Data Required |
|-----------|------------------|---------------|
| **Document Upload** | Upload file | File (PDF, image) |
| **Form Fill** | Complete form fields | Form data |
| **E-Sign** | Sign document electronically | Signature |
| **Acknowledgment** | Read and confirm | Checkbox |
| **Training** | Complete training module | Completion status |
| **Information** | Read information | View confirmation |

### Onboarding Task Data

```
onboarding_task {
  id: uuid
  application_id: uuid
  title: string
  description: text
  task_type: enum
  is_required: boolean
  due_date: date (optional)
  status: "pending" | "submitted" | "approved" | "rejected" | "overdue"
  submitted_at: timestamp
  reviewed_at: timestamp
  reviewer_notes: text (optional)
  attachments: array (for uploads)
}
```

### Onboarding Status

**Candidate Sees:**
- Overall progress (e.g., "4 of 7 tasks complete")
- Individual task status
- Due dates
- Rejection reasons (if task rejected)
- Start date countdown

### Onboarding Complete

**Trigger:** Agency marks all required tasks complete

**Candidate Sees:**
- "Onboarding Complete" status
- "Ready for Day 1" message
- Start date reminder
- Any final instructions

---

## Day 1 & Started Status

### Day 1 Tracking

**Trigger:** Candidate's start date arrives

**Possible Outcomes:**

| Outcome | Who Marks | Result Status |
|---------|-----------|---------------|
| **Showed Up** | Agency marks | `started` |
| **No Show** | Agency marks | `no_show` |

### Started Status

**When:** Agency confirms candidate started

**Candidate Sees:**
- Status: Started
- Congratulations message
- May transition to employee portal/features

### No Show Status

**When:** Candidate doesn't show on Day 1

**Process:**
1. Agency marks as no-show
2. Application status → `no_show`
3. Candidate may receive notification
4. Records kept for history

---

## Rejection & Feedback

### Rejection Points

Candidate can be rejected at any stage:

| Stage | Rejected By | Notification |
|-------|-------------|--------------|
| After review | Recruiter | "Application Update" |
| After pre-screen | Recruiter | "Application Update" |
| After shortlist | Client | "Application Update" |
| After interview | Client | "Application Update" |
| After offer (rare) | Client | "Offer Withdrawn" |

### Rejection Data Candidate Sees

```
rejection {
  application_id: uuid
  rejected_at: timestamp
  rejected_by_type: "recruiter" | "client"
  rejection_stage: string (where in pipeline)
  reason: string (optional - may not be shared)
  feedback: text (optional - may not be shared)
  is_feedback_visible: boolean
}
```

### Feedback Visibility

**Agency Controls:**
- Whether to show rejection reason
- Whether to show detailed feedback
- What feedback is appropriate to share

**Candidate May See:**
- Generic message only
- Reason category (e.g., "Experience level mismatch")
- Detailed feedback (if agency chooses to share)

### Rejection View

**Candidate Sees:**
- Application status: "Not Selected"
- Stage where rejected
- Feedback (if provided and visible)
- Link to similar jobs (optional)
- Option to apply to other jobs

---

## Application History

### What Candidate Sees Per Application

**Application Card:**
```
application_view {
  // Basic Info
  id: uuid
  job_title: string
  company_name: string
  applied_at: timestamp
  status: string
  
  // Timeline
  timeline: array of events [
    {
      event_type: string
      description: string
      timestamp: datetime
      metadata: object (optional)
    }
  ]
  
  // Calls/Interviews
  calls: array [
    {
      id: uuid
      type: "prescreen" | "interview"
      call_type: string (round 1, etc.)
      with_name: string
      with_company: string
      scheduled_at: timestamp
      duration_seconds: integer
      status: string
      recording_available: boolean
      recording_url: string (if available)
      transcript_available: boolean
      transcript_text: text (if available)
    }
  ]
  
  // Offer (if exists)
  offer: object (see offer structure above)
  
  // Rejection (if rejected)
  rejection: object (see rejection structure above)
  
  // Onboarding (if hired)
  onboarding: {
    status: string
    progress_percent: integer
    tasks: array of tasks
  }
}
```

### Timeline Events

| Event Type | Description |
|------------|-------------|
| `applied` | Application submitted |
| `under_review` | Application under review |
| `prescreen_scheduled` | Pre-screen call scheduled |
| `prescreen_completed` | Pre-screen call completed |
| `prescreen_passed` | Passed pre-screen |
| `prescreen_failed` | Failed pre-screen |
| `shortlisted` | Released to client |
| `interview_scheduled` | Interview scheduled |
| `interview_completed` | Interview completed |
| `interview_passed` | Passed interview |
| `interview_failed` | Failed interview |
| `offer_sent` | Offer received |
| `offer_viewed` | Offer viewed |
| `counter_submitted` | Counter offer sent |
| `counter_response` | Counter response received |
| `offer_accepted` | Offer accepted |
| `offer_declined` | Offer declined |
| `hired` | Marked as hired |
| `onboarding_started` | Onboarding began |
| `onboarding_completed` | Onboarding finished |
| `started` | Day 1 completed |
| `rejected` | Application rejected |
| `withdrawn` | Candidate withdrew |

### Call Recordings Access

**Candidate Can Access:**
- Recordings of calls they participated in
- Only if recording was enabled
- Only if agency/client chooses to share

**Recording Data:**
```
recording {
  id: uuid
  call_id: uuid
  playback_url: string
  duration_seconds: integer
  recorded_at: timestamp
}
```

### Transcript Access

**Candidate Can Access:**
- Transcripts of calls they participated in
- Only if transcription was enabled
- Only if agency/client chooses to share

**Transcript Data:**
```
transcript {
  id: uuid
  call_id: uuid
  full_text: text
  summary: text (AI-generated, if available)
  key_points: array of strings (if available)
  word_count: integer
}
```

---

## Data Candidate Needs to See

### Summary: All Visible Data

| Category | Data Points |
|----------|-------------|
| **Profile** | Own profile, resume, skills, assessments |
| **Jobs** | Job listings, search, filters, saved jobs |
| **Applications** | All applications with full history |
| **Interviews** | Scheduled, completed, recordings, transcripts |
| **Offers** | Active offers, offer history, counter history |
| **Onboarding** | Tasks, progress, due dates, status |
| **Notifications** | All notifications, read/unread status |
| **Call History** | All video calls participated in |

### Data NOT Visible to Candidate

| Hidden Data | Reason |
|-------------|--------|
| Recruiter internal notes | Internal use only |
| Other candidates' applications | Privacy |
| Client internal discussions | Privacy |
| Pre-screen notes (unless shared) | Agency control |
| Detailed rejection reasons (unless shared) | Agency control |
| Salary of other candidates | Confidential |
| Internal ratings/scores | Internal use only |

---

## Actions Candidate Can Take

### Complete Action List

| Action | Where | Trigger |
|--------|-------|---------|
| **Apply to Job** | Job listing | Click apply |
| **Withdraw Application** | Application detail | Click withdraw |
| **Answer Call** | Incoming call modal | Click answer |
| **Decline Call** | Incoming call modal | Click decline |
| **Join Scheduled Call** | Application/Interview detail | Click join |
| **View Offer** | Notification/Application | Click view |
| **Accept Offer** | Offer detail | Click accept |
| **Decline Offer** | Offer detail | Click decline |
| **Counter Offer** | Offer detail | Click counter, enter amount |
| **Complete Onboarding Task** | Onboarding checklist | Complete task |
| **Upload Document** | Onboarding task | Upload file |
| **Sign Document** | Onboarding task | E-sign |
| **Watch Recording** | Call history | Click play |
| **Read Transcript** | Call history | Click view |
| **Mark Notification Read** | Notification center | Click/view |

---

## Notification Types

### Complete Notification Type List

| Type | Trigger | Priority | Title Template |
|------|---------|----------|----------------|
| `incoming_call` | Real-time call | 🔴 Critical | "Incoming Call" |
| `missed_call` | Call not answered | 🟠 High | "Missed Call" |
| `application_submitted` | After apply | 🟢 Normal | "Application Submitted" |
| `application_reviewed` | Recruiter reviews | 🟢 Normal | "Application Reviewed" |
| `application_shortlisted` | Passed gate | 🟢 Normal | "You've Been Shortlisted!" |
| `prescreen_scheduled` | Pre-screen booked | 🟠 High | "Pre-Screen Scheduled" |
| `prescreen_reminder` | Before pre-screen | 🟠 High | "Pre-Screen Starting Soon" |
| `prescreen_completed` | After pre-screen | 🟢 Normal | "Pre-Screen Completed" |
| `interview_scheduled` | Interview booked | 🟠 High | "Interview Scheduled" |
| `interview_reminder` | Before interview | 🔴 Critical | "Interview Starting Soon" |
| `interview_completed` | After interview | 🟢 Normal | "Interview Completed" |
| `offer_received` | Offer sent | 🔴 Critical | "Offer Received!" |
| `offer_expiring` | Offer near expiry | 🔴 Critical | "Offer Expires Soon" |
| `counter_response` | Employer responds | 🟠 High | "Counter Offer Response" |
| `offer_accepted_confirm` | After accepting | 🟢 Normal | "Offer Accepted" |
| `hired` | Marked as hired | 🟢 Normal | "Congratulations!" |
| `onboarding_task` | New task assigned | 🟠 High | "New Onboarding Task" |
| `onboarding_task_approved` | Task approved | 🟢 Normal | "Task Approved" |
| `onboarding_task_rejected` | Task needs redo | 🟠 High | "Task Needs Attention" |
| `onboarding_complete` | All tasks done | 🟢 Normal | "Onboarding Complete!" |
| `day1_reminder` | Day before start | 🟠 High | "Starting Tomorrow!" |
| `started_confirm` | Marked as started | 🟢 Normal | "Welcome to the Team!" |
| `rejected` | Application rejected | 🟢 Normal | "Application Update" |
| `offer_withdrawn` | Offer cancelled | 🟠 High | "Offer Update" |

### Priority Levels

| Priority | Description | Display |
|----------|-------------|---------|
| 🔴 Critical | Requires immediate action | Modal + Push + Sound |
| 🟠 High | Important, timely action | Push + Badge |
| 🟢 Normal | Informational | Badge only |

---

## Database Requirements

### Tables Candidate Interacts With

| Table | Candidate Access |
|-------|------------------|
| `candidates` | Own record (read/write) |
| `candidate_profiles` | Own profile (read/write) |
| `job_applications` | Own applications (read) |
| `jobs` | All active jobs (read) |
| `job_offers` | Own offers (read, respond) |
| `job_interviews` | Own interviews (read) |
| `video_call_rooms` | Own calls (read, join) |
| `video_call_recordings` | Own recordings (read, if shared) |
| `video_call_transcripts` | Own transcripts (read, if shared) |
| `notifications` | Own notifications (read/write) |
| `onboarding_tasks` | Own tasks (read, complete) |
| `application_activity_timeline` | Own timeline (read) |

### Key Fields for Candidate Visibility

**job_applications:**
- `candidate_id` - Filter to own
- `status` - Current status
- `released_to_client` - (hidden from candidate, internal)

**video_call_rooms:**
- `participant_user_id` - Filter to own
- `share_with_candidate` - When TRUE, candidate can see ALL artifacts for that call (recording/transcript/notes)

**video_call_recordings:**
- `shared_with_candidate` - Mirrors room sharing (best-effort), used for filtering artifact visibility

**video_call_transcripts:**
- `shared_with_candidate` - Mirrors room sharing (best-effort), used for filtering artifact visibility

**job_offers:**
- `application_id` → `candidate_id` - Filter to own

---

## API Endpoints Required

### Candidate-Facing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/candidate/applications` | GET | List own applications |
| `/api/v1/candidate/applications/:id` | GET | Get application detail |
| `/api/v1/candidate/applications` | POST | Submit application |
| `/api/v1/candidate/applications/:id/withdraw` | POST | Withdraw application |
| `/api/v1/candidate/offers/:id` | GET | Get offer details |
| `/api/v1/candidate/offers/:id/accept` | POST | Accept offer |
| `/api/v1/candidate/offers/:id/decline` | POST | Decline offer |
| `/api/v1/candidate/offers/:id/counter` | POST | Submit counter offer |
| `/api/v1/candidate/interviews` | GET | List own interviews |
| `/api/v1/candidate/interviews/:id/join` | GET | Get join URL + token |
| `/api/v1/candidate/calls` | GET | List own video calls |
| `/api/v1/candidate/calls/:id/recording` | GET | Get recording URL |
| `/api/v1/candidate/calls/:id/transcript` | GET | Get transcript |
| `/api/v1/candidate/notifications` | GET | List notifications |
| `/api/v1/candidate/notifications/:id/read` | POST | Mark as read |
| `/api/v1/candidate/notifications/read-all` | POST | Mark all read |
| `/api/v1/candidate/onboarding/tasks` | GET | List onboarding tasks |
| `/api/v1/candidate/onboarding/tasks/:id` | POST | Submit task |

### Real-Time Endpoints (WebSocket/SSE)

| Channel | Purpose |
|---------|---------|
| `candidate:{id}:notifications` | Push notifications |
| `candidate:{id}:calls` | Incoming call alerts |
| `call:{room_id}` | Call status updates |

---

## Summary

### Candidate Can DO:

1. ✅ Apply to jobs
2. ✅ Withdraw applications
3. ✅ Answer/decline incoming calls
4. ✅ Join scheduled calls
5. ✅ View offers
6. ✅ Accept offers
7. ✅ Decline offers
8. ✅ Submit counter offers (in PHP)
9. ✅ Complete onboarding tasks
10. ✅ Upload documents
11. ✅ E-sign documents
12. ✅ Watch call recordings (if shared)
13. ✅ Read transcripts (if shared)
14. ✅ View application history & timeline
15. ✅ See rejection feedback (if shared)

### Candidate Can SEE:

1. ✅ All their applications
2. ✅ Application status & timeline
3. ✅ Scheduled interviews
4. ✅ Upcoming events
5. ✅ Offers with full details
6. ✅ Counter offer history
7. ✅ Onboarding tasks & progress
8. ✅ Call history
9. ✅ Recordings (if shared)
10. ✅ Transcripts (if shared)
11. ✅ Rejection feedback (if shared)
12. ✅ Notifications (all types)

### Candidate CANNOT See:

1. ❌ Other candidates
2. ❌ Internal recruiter notes
3. ❌ Internal ratings/scores
4. ❌ Client discussions
5. ❌ Pre-release application status details
6. ❌ Why they weren't shortlisted (unless shared)

---

*End of Candidate Functional Flow Requirements*
