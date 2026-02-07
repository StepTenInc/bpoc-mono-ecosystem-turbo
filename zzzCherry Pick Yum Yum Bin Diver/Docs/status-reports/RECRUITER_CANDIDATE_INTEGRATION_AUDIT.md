# Recruiter ↔ Candidate Integration Audit

**Date:** January 5, 2026
**Purpose:** Ensure recruiter side can fully interact with new candidate features
**Status:** Integration Needed

---

## Executive Summary

We built complete candidate-facing features (applications, counter offers, onboarding, notifications). Now we need to ensure the recruiter side can properly manage and respond to these features.

### Integration Status

| Feature | Candidate Side | Recruiter Side | Status |
|---------|---------------|----------------|--------|
| **Applications** | ✅ Submit, Withdraw | ✅ View, Review, Update Status | ✅ INTEGRATED |
| **Offers** | ✅ View, Accept, Decline | ✅ Create, Send | ✅ INTEGRATED |
| **Counter Offers** | ✅ Submit, View History | ❌ **MISSING** | ⚠️ NEEDS WORK |
| **Onboarding Tasks** | ✅ View, Complete | ❌ **MISSING** | ⚠️ NEEDS WORK |
| **Notifications** | ✅ Receive, Read | ⚠️ Partial | ⚠️ NEEDS WORK |

---

## What EXISTS on Recruiter Side

### ✅ Already Working

**1. Applications Management**
- **API:** `GET /api/recruiter/applications` - List all applications with detailed candidate info
- **API:** `POST /api/recruiter/applications` - Schedule interview for application
- **API:** `PATCH /api/recruiter/applications/status` - Update application status
- **API:** `POST /api/recruiter/applications/[id]/reject` - Reject application
- **API:** `POST /api/recruiter/applications/[id]/hired` - Mark as hired
- **UI:** `/recruiter/applications` - Full applications dashboard with filters, search, bulk actions

**2. Offers Management**
- **API:** `GET /api/recruiter/offers` - List all offers for agency
- **API:** `POST /api/recruiter/offers` - Create and send new offer
- **File:** `src/app/api/recruiter/offers/route.ts`

**3. Jobs, Clients, Talent**
- ✅ Complete job creation and management
- ✅ Client management
- ✅ Talent pool browsing
- ✅ Video call integration

---

## What's MISSING (Critical Gaps)

### ❌ 1. Counter Offer Management

**Problem:** Candidates can submit counter offers, but recruiters have NO way to respond.

**What's Missing:**
- **API:** `GET /api/recruiter/offers/[id]/counter` - View counter offers for an offer
- **API:** `POST /api/recruiter/offers/[id]/counter/accept` - Accept candidate's counter offer
- **API:** `POST /api/recruiter/offers/[id]/counter/reject` - Reject candidate's counter offer
- **API:** `POST /api/recruiter/offers/[id]/counter/respond` - Send new counter back to candidate
- **UI:** Counter offer notification and management interface

**Impact:** Candidates submit counter offers that go into a black hole. No negotiation loop can complete.

**Requirements (from Recruiter Doc):**
```
Offer Management Flow:
- Handle Counter Offer
  - Recruiter Options:
    1. Accept Counter → Offer updated, status = 'accepted'
    2. Reject Counter → Status = 'declined' OR send new offer
    3. New Counter → Send revised offer with new terms
```

---

### ❌ 2. Onboarding Task Creation

**Problem:** Candidates can complete onboarding tasks, but recruiters have NO way to create them.

**What's Missing:**
- **API:** `GET /api/recruiter/placements` - List all placements (hired candidates)
- **API:** `GET /api/recruiter/placements/[id]` - Get placement details with tasks
- **API:** `POST /api/recruiter/placements/[id]/tasks` - Create onboarding task for candidate
- **API:** `GET /api/recruiter/placements/[id]/tasks` - List tasks for placement
- **UI:** Onboarding task creation interface

**Impact:** No way to assign onboarding tasks to newly hired candidates.

**Requirements (from Recruiter Doc):**
```
Onboarding Task Management:
- Recruiter Can:
  1. Create onboarding tasks
  2. Assign tasks to candidate
  3. Set due dates
  4. Review submitted tasks
  5. Approve or reject tasks
  6. Mark onboarding complete

Task Types:
- document_upload, form_fill, e_sign, acknowledgment, training, information
```

---

### ❌ 3. Onboarding Task Review

**Problem:** Candidates submit tasks, but recruiters can't review/approve them.

**What's Missing:**
- **API:** `PATCH /api/recruiter/placements/[id]/tasks/[taskId]` - Review and approve/reject task
- **API:** `POST /api/recruiter/placements/[id]/complete` - Mark all onboarding complete
- **API:** `POST /api/recruiter/placements/[id]/started` - Confirm candidate started Day 1
- **API:** `POST /api/recruiter/placements/[id]/no-show` - Mark candidate no-show
- **UI:** Task review interface with approve/reject buttons

**Impact:** Submitted tasks sit in "submitted" status forever. No way to complete onboarding flow.

**Requirements:**
```
- Review submitted tasks
- Approve or reject with feedback
- If rejected: candidate sees feedback, can resubmit
- If approved: task marked complete, progress updates
```

---

### ⚠️ 4. Notification Sending (Partial)

**Problem:** Notification table exists, but no recruiter-side APIs to send notifications to candidates.

**What Exists:**
- ✅ `notifications` table with proper schema
- ✅ Candidate can receive and read notifications
- ✅ Some notifications sent automatically (application received, etc.)

**What's Missing:**
- **API:** `POST /api/recruiter/notifications` - Send custom notification to candidate
- Auto-send notifications for:
  - Counter offer accepted/rejected/countered
  - Onboarding task assigned
  - Onboarding task approved/rejected
  - Onboarding complete
  - Day 1 reminder

**Impact:** Many notification types from requirements can't be sent.

---

## Required APIs to Build

### Priority 1: Counter Offer Management

```typescript
// 1. View counter offers for an offer
GET /api/recruiter/offers/[id]/counter
Response: {
  counterOffers: [{
    id: "uuid",
    requestedSalary: 55000,
    requestedCurrency: "PHP",
    candidateMessage: "...",
    status: "pending" | "accepted" | "rejected" | "countered",
    createdAt: "timestamp"
  }]
}

// 2. Accept counter offer
POST /api/recruiter/offers/[id]/counter/accept
Body: {
  counterOfferId: "uuid",
  employerMessage?: "string"  // Optional response message
}
Actions:
- Update counter_offer.status = 'accepted'
- Update job_offer.salary_offered = counter_offer.requested_salary
- Update job_offer.status = 'accepted'
- Send notification to candidate
Response: { success: true }

// 3. Reject counter offer
POST /api/recruiter/offers/[id]/counter/reject
Body: {
  counterOfferId: "uuid",
  employerMessage?: "string",  // Reason for rejection
  sendNewOffer?: boolean       // If true, expect revised offer data
  revisedSalary?: number       // If sending new counter
}
Actions:
- Update counter_offer.status = 'rejected'
- Update counter_offer.employer_response_message = employerMessage
- If sendNewOffer: create new counter_offer with employer's revised amount
- Send notification to candidate
Response: { success: true }
```

### Priority 2: Onboarding Task Management

```typescript
// 1. Create onboarding task
POST /api/recruiter/onboarding/tasks
Body: {
  applicationId: "uuid",
  taskType: "document_upload" | "form_fill" | "e_sign" | "acknowledgment" | "training" | "information",
  title: "string",
  description?: "string",
  isRequired: boolean,
  dueDate?: "date"
}
Actions:
- Create onboarding_tasks record
- Send notification to candidate
Response: {
  success: true,
  task: { id, title, taskType, status: "pending" }
}

// 2. List onboarding tasks for application
GET /api/recruiter/onboarding/tasks?applicationId=[id]
Response: {
  tasks: [{
    id, title, taskType, status, submittedAt, dueDate, isRequired
  }],
  progress: {
    total, completed, pending, overdue, percentage
  }
}

// 3. Review/approve task submission
PATCH /api/recruiter/onboarding/tasks/[taskId]
Body: {
  status: "approved" | "rejected",
  reviewerNotes?: "string"  // Required if rejected
}
Actions:
- Update onboarding_tasks.status
- Update onboarding_tasks.reviewed_at
- Update onboarding_tasks.reviewer_notes
- Send notification to candidate
Response: { success: true }

// 4. Mark onboarding complete
POST /api/recruiter/onboarding/[applicationId]/complete
Actions:
- Verify all required tasks are approved
- Update application status or create placement record
- Send notification to candidate
Response: { success: true }
```

### Priority 3: Notifications

```typescript
// Send custom notification
POST /api/recruiter/notifications
Body: {
  candidateId: "uuid",
  type: "string",
  title: "string",
  message: "string",
  actionUrl?: "string",
  actionLabel?: "string",
  isUrgent?: boolean
}
Actions:
- Create notification record
- Optional: Send push notification (future)
Response: { success: true }
```

---

## Database Schema Updates Needed

### ❌ None Required!

All necessary database tables already exist:
- ✅ `counter_offers` - Ready for recruiter responses
- ✅ `onboarding_tasks` - Ready for recruiter creation
- ✅ `notifications` - Ready for sending

### Fields to Verify

**counter_offers table:**
```sql
- employer_response_salary: DECIMAL  -- For counter-counter offers
- employer_response_message: TEXT    -- Recruiter's response
- responded_at: TIMESTAMP            -- When recruiter responded
```
✅ These fields exist in our migration

**onboarding_tasks table:**
```sql
- reviewer_notes: TEXT        -- Feedback when rejected
- reviewed_at: TIMESTAMP      -- When reviewed
- reviewed_by: UUID           -- Who reviewed (optional)
```
✅ These fields exist in our migration

---

## UI Components Needed

### 1. Counter Offer Management UI

**Location:** `/recruiter/offers/[id]` or inline in offers page

**Features:**
- Show counter offer notification badge
- Display candidate's requested salary vs original
- Show percentage increase
- Show candidate's justification message
- Action buttons: Accept, Reject, Counter Back
- Counter back dialog with revised salary input

**Design Pattern:**
```tsx
{hasCounterOffer && (
  <Card className="border-orange-500/30 bg-orange-500/5">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Badge className="bg-orange-500/20 text-orange-400">
            Counter Offer Received
          </Badge>
          <p className="text-white font-semibold mt-2">
            Candidate requests: PHP {counterOffer.requestedSalary.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">
            Original offer: PHP {originalSalary.toLocaleString()}
            <span className="text-orange-400 ml-2">
              (+{percentageIncrease}%)
            </span>
          </p>
        </div>
      </div>

      {counterOffer.candidateMessage && (
        <div className="p-3 rounded-lg bg-white/5 mb-3">
          <p className="text-sm text-gray-300">{counterOffer.candidateMessage}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => handleAcceptCounter(counterOffer.id)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Accept Counter
        </Button>
        <Button
          onClick={() => openCounterBackDialog()}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Send New Counter
        </Button>
        <Button
          variant="outline"
          onClick={() => handleRejectCounter(counterOffer.id)}
          className="border-red-500/30 text-red-400"
        >
          Decline
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

### 2. Onboarding Task Creation UI

**Location:** `/recruiter/placements` or `/recruiter/applications/[id]` after hire

**Features:**
- List existing tasks with status
- "Add Task" button
- Task creation modal with form
- Task type selector
- Due date picker
- Required checkbox

**Design Pattern:**
```tsx
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-white font-semibold">Onboarding Tasks</h3>
      <Button onClick={() => setShowCreateTask(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </div>

    {/* Progress bar */}
    <Progress value={progress.percentage} className="mb-4" />

    {/* Task list */}
    {tasks.map(task => (
      <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg mb-2">
        <div>
          <p className="text-white">{task.title}</p>
          <p className="text-sm text-gray-400">{task.taskType}</p>
        </div>
        <Badge>{task.status}</Badge>
      </div>
    ))}
  </CardContent>
</Card>
```

### 3. Task Review UI

**Location:** `/recruiter/onboarding` or inline in placements

**Features:**
- View submitted task details
- Show attachments/form data
- Approve button
- Reject button with feedback textarea
- Timeline of submissions

**Design Pattern:**
```tsx
{task.status === 'submitted' && (
  <Card className="border-cyan-500/30">
    <CardContent className="p-4">
      <h4 className="text-white font-medium mb-2">
        {task.title} - Submitted for Review
      </h4>

      {/* Show submission data */}
      {task.attachments && (
        <div className="mb-3">
          <p className="text-sm text-gray-400 mb-1">Uploaded Files:</p>
          {task.attachments.map(file => (
            <a key={file.url} href={file.url} className="text-cyan-400 hover:text-cyan-300 text-sm">
              {file.fileName}
            </a>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => handleApproveTask(task.id)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button
          onClick={() => openRejectDialog(task.id)}
          className="bg-red-600 hover:bg-red-700"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject & Request Changes
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Implementation Plan

### Phase 1: Counter Offer APIs (2-3 hours)
1. Create `/api/recruiter/offers/[id]/counter/route.ts` (GET)
2. Create `/api/recruiter/offers/[id]/counter/accept/route.ts` (POST)
3. Create `/api/recruiter/offers/[id]/counter/reject/route.ts` (POST)
4. Test with existing candidate counter offer submissions

### Phase 2: Onboarding APIs (3-4 hours)
1. Create `/api/recruiter/onboarding/tasks/route.ts` (POST for create)
2. Create `/api/recruiter/onboarding/tasks/[taskId]/route.ts` (PATCH for review)
3. Create `/api/recruiter/onboarding/[applicationId]/complete/route.ts` (POST)
4. Test full onboarding flow end-to-end

### Phase 3: UI Components (4-5 hours)
1. Add counter offer management to `/recruiter/offers/page.tsx`
2. Create onboarding task creation dialog
3. Create task review interface
4. Add notifications to recruiter layout header

### Phase 4: Notifications Integration (2 hours)
1. Add auto-notifications for counter offer responses
2. Add auto-notifications for onboarding task events
3. Test notification delivery

---

## Testing Checklist

### Counter Offers
- [ ] Candidate submits counter offer
- [ ] Recruiter sees counter offer notification
- [ ] Recruiter can view counter offer details
- [ ] Recruiter can accept counter (updates offer salary)
- [ ] Recruiter can reject counter (with message)
- [ ] Recruiter can send new counter back
- [ ] Candidate receives notification of response
- [ ] Full negotiation loop works (back and forth)

### Onboarding
- [ ] Recruiter can create task for hired candidate
- [ ] Candidate receives notification of new task
- [ ] Candidate can view and complete task
- [ ] Recruiter receives notification of submission
- [ ] Recruiter can approve task
- [ ] Recruiter can reject task with feedback
- [ ] Candidate sees feedback and can resubmit
- [ ] Progress percentage calculates correctly
- [ ] All required tasks can be completed
- [ ] Recruiter can mark onboarding complete

### Notifications
- [ ] Counter offer accepted notification sent
- [ ] Counter offer rejected notification sent
- [ ] Task assigned notification sent
- [ ] Task approved notification sent
- [ ] Task rejected notification sent
- [ ] Onboarding complete notification sent

---

## Success Criteria

### 100% Integration Achieved When:

1. ✅ Recruiter can respond to every candidate counter offer
2. ✅ Recruiter can create onboarding tasks for hired candidates
3. ✅ Recruiter can review and approve/reject task submissions
4. ✅ Complete onboarding workflow works end-to-end
5. ✅ All notifications flow correctly in both directions
6. ✅ No manual database updates required
7. ✅ No features in black hole (candidate does something, recruiter can't respond)

---

## Current Status: ⚠️ 60% Integrated

**Working:**
- ✅ Applications flow (submit → review → status update → hire)
- ✅ Offers flow (create → send → view)
- ✅ Basic notifications

**Broken:**
- ❌ Counter offer negotiation loop
- ❌ Onboarding task management
- ❌ Onboarding task review

**Next Steps:**
1. Build counter offer management APIs
2. Build onboarding management APIs
3. Add UI components for both
4. Test end-to-end flows
5. Deploy to production

---

**Last Updated:** January 5, 2026
**Status:** Ready to implement
**ETA:** 10-12 hours of work for 100% integration
