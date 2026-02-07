# Complete Job-to-Hire Process: All Tables & Fields

## 📋 Overview

This document maps the **ENTIRE** recruitment process from Job Creation → Application → Interview → Offer → Hire, showing **ALL** database tables and **ALL** fields accessible via the BPOC API.

---

## 🔄 Complete Process Flow

```
1. JOB CREATION (jobs table)
   ↓
2. APPLICATION SUBMISSION (job_applications table)
   ↓
3. PRE-SCREENING (video_call_rooms table)
   ↓
4. INTERVIEWS (job_interviews table)
   ↓
5. OFFERS (job_offers table)
   ↓
6. HIRED/STARTED (job_applications table fields)
   ↓
7. ACTIVITY TIMELINE (application_activity_timeline table)
```

---

## 1️⃣ JOB CREATION

**Table:** `jobs`

**API Endpoints:**
- `GET /api/v1/jobs` - List all jobs
- `GET /api/v1/jobs/:id` - Get single job
- `POST /api/v1/jobs/create` - Create job
- `PATCH /api/v1/jobs/:id` - Update job

**ALL Fields Returned:**

```json
{
  "id": "uuid",
  "agency_client_id": "uuid",           // Client who posted the job
  "posted_by": "uuid",                   // Recruiter who created it
  "title": "string",                     // Job title
  "slug": "string",                      // URL-friendly slug
  "description": "text",                 // Full job description
  "requirements": ["array"],             // JSONB array of requirements
  "responsibilities": ["array"],         // JSONB array of responsibilities
  "benefits": ["array"],                // JSONB array of benefits
  "salary_min": 30000,                  // Minimum salary
  "salary_max": 50000,                  // Maximum salary
  "salary_type": "monthly",              // hourly | monthly | yearly
  "currency": "PHP",                    // Currency code
  "work_arrangement": "remote",          // onsite | remote | hybrid
  "work_type": "full-time",             // full-time | part-time | contract | internship
  "shift": "day",                       // day | night | both
  "experience_level": "mid-level",      // entry-level | mid-level | senior-level
  "industry": "string",                  // Industry classification
  "department": "string",               // Department name
  "status": "active",                   // draft | active | paused | closed | filled
  "priority": "medium",                 // low | medium | high | urgent
  "application_deadline": "2025-12-31", // Deadline date
  "views": 150,                         // View count
  "applicants_count": 25,               // Number of applicants
  "source": "manual",                   // manual | api | import
  "external_id": "string",              // External system ID
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Related Tables:**
- `job_skills` - Skills required for the job
- `agency_clients` - Client information
- `agency_recruiters` - Recruiter who posted

---

## 2️⃣ APPLICATION SUBMISSION

**Table:** `job_applications`

**API Endpoints:**
- `GET /api/v1/applications` - List applications
- `GET /api/v1/applications/:id` - Get single application (ALL fields)
- `GET /api/v1/applications/:id/card` - Get complete application card (ALL fields + related data)
- `POST /api/v1/applications` - Submit application
- `PATCH /api/v1/applications/:id` - Update application status

**ALL Fields Returned:**

```json
{
  "id": "uuid",
  "candidate_id": "uuid",               // Candidate who applied
  "job_id": "uuid",                     // Job applied to
  "resume_id": "uuid",                  // Resume used (if any)
  
  // Core Status
  "status": "submitted",                // submitted | under_review | shortlisted | 
                                        // interview_scheduled | interviewed | 
                                        // offer_pending | offer_sent | offer_accepted | 
                                        // hired | rejected | withdrawn
  "position": 0,                        // Position in queue
  
  // Recruiter Handling
  "reviewed_by": "uuid",                // Recruiter who reviewed
  "reviewed_at": "2025-01-02T00:00:00Z", // When reviewed
  "recruiter_notes": "text",            // Recruiter's notes
  
  // Client Notes & Feedback (Single values - one client per application)
  "client_notes": "text",               // Client's private notes
  "client_rating": 5,                   // 1-5 star rating
  "client_tags": ["excellent", "fast-track"], // Array of tags
  
  // Rejection Data (Single values - one rejection per application)
  "rejection_reason": "text",           // Why rejected
  "rejected_by": "client",               // client | recruiter
  "rejected_date": "2025-01-05T00:00:00Z", // When rejected
  
  // Hired/Started Tracking (Single values - one outcome per application)
  "offer_acceptance_date": "2025-01-10T00:00:00Z", // When offer accepted
  "contract_signed": true,               // Boolean
  "first_day_date": "2025-01-20",       // First day date
  "started_status": "started",          // hired | started | no_show
  
  // Timestamps
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-02T00:00:00Z"
}
```

**Related Data (via `/card` endpoint):**
- `prescreens` - Array of pre-screening calls (from `video_call_rooms`)
- `interviews` - Array of interviews (from `job_interviews`)
- `offers` - Array of offers (from `job_offers`)
- `timeline` - Activity timeline (from `application_activity_timeline`)

---

## 3️⃣ PRE-SCREENING

**Table:** `video_call_rooms` (with `call_type = 'recruiter_prescreen'`)

**API Endpoints:**
- `GET /api/v1/applications/:id/card` - Includes prescreens array
- `POST /api/v1/video/rooms` - Create pre-screen call
- `PATCH /api/v1/video/rooms/:roomId` - Update pre-screen (rating, notes)
- `GET /api/v1/video/rooms` - List all video calls

**ALL Fields Returned:**

```json
{
  "id": "uuid",
  "daily_room_name": "string",          // Daily.co room identifier
  "daily_room_url": "https://...",      // Daily.co room URL
  "daily_room_token": "string",         // Access token
  
  // Participants
  "host_user_id": "uuid",               // Recruiter conducting pre-screen
  "participant_user_id": "uuid",        // Candidate
  "host_name": "string",
  "participant_name": "string",
  "participant_email": "string",
  
  // Context
  "agency_id": "uuid",
  "job_id": "uuid",
  "application_id": "uuid",              // Links to application
  "interview_id": "uuid",
  
  // Call Details
  "call_type": "recruiter_prescreen",   // Must be 'recruiter_prescreen'
  "call_mode": "video",                 // video | phone | audio_only
  "title": "string",
  "description": "text",
  
  // Post-Call Data
  "notes": "text",                      // Recruiter's notes
  "rating": 4,                          // 1-5 star rating
  
  // Status & Timing
  "status": "ended",                    // created | waiting | active | ended | failed
  "created_at": "2025-01-03T09:45:00Z",
  "started_at": "2025-01-03T10:00:00Z",
  "ended_at": "2025-01-03T10:30:00Z",
  "duration_seconds": 1800,
  
  // Settings
  "enable_recording": true,
  "enable_transcription": true,
  
  // Related Data (included in response)
  "recordings": [
    {
      "id": "uuid",
      "recording_url": "https://...",
      "download_url": "https://...",
      "duration_seconds": 1800,
      "status": "ready",
      "created_at": "2025-01-03T10:30:00Z"
    }
  ],
  "transcripts": [
    {
      "id": "uuid",
      "full_text": "Full transcript...",
      "status": "completed",
      "created_at": "2025-01-03T10:35:00Z"
    }
  ]
}
```

**Note:** Multiple pre-screens per application are supported. Each pre-screen is a separate `video_call_rooms` record.

---

## 4️⃣ INTERVIEWS

**Table:** `job_interviews`

**API Endpoints:**
- `GET /api/v1/interviews` - List all interviews (ALL fields)
- `GET /api/v1/applications/:id/card` - Includes interviews array
- `POST /api/v1/interviews` - Schedule interview
- `PATCH /api/v1/interviews` - Update interview outcome/rating/feedback

**ALL Fields Returned:**

```json
{
  "id": "uuid",
  "application_id": "uuid",             // Links to application
  
  // Interview Type
  "interview_type": "recruiter_round_1", // RECRUITER: recruiter_prescreen | 
                                          // recruiter_round_1 | recruiter_round_2 | 
                                          // recruiter_round_3 | recruiter_offer | 
                                          // recruiter_general
                                          // CLIENT: client_round_1 | client_round_2 | 
                                          // client_final | client_general
  
  // Scheduling (UTC is source of truth)
  "scheduled_at": "2025-01-05T14:00:00Z", // UTC timestamp
  "duration_minutes": 60,
  
  // Timezone Support (for display)
  "client_timezone": "America/New_York",  // Client's timezone
  "scheduled_at_client_local": "Jan 5, 9:00 AM (New York)", // Formatted client time
  "scheduled_at_ph": "Jan 5, 10:00 PM (PHT)", // Formatted PH time
  
  // Location & Meeting
  "location": "string",                   // Physical location or "Video Call"
  "meeting_link": "https://...",         // Video call link
  
  // Participants
  "interviewer_id": "uuid",              // Recruiter or client interviewer
  "interviewer_notes": "text",           // Interviewer's notes
  
  // Status & Outcome
  "status": "completed",                 // scheduled | confirmed | in_progress | 
                                         // completed | cancelled | no_show | rescheduled
  "outcome": "passed",                   // passed | failed | pending_decision | needs_followup
  
  // Feedback & Rating
  "feedback": {                          // JSONB structured feedback
    "communication": 4,
    "technicalSkills": 5,
    "cultureFit": 4,
    "overallImpression": "Strong candidate",
    "strengths": ["Great communicator"],
    "areasForImprovement": ["Time management"]
  },
  "rating": 4,                           // 1-5 star rating
  
  // Timing
  "started_at": "2025-01-05T14:00:00Z",
  "ended_at": "2025-01-05T15:00:00Z",
  
  // Timestamps
  "created_at": "2025-01-04T00:00:00Z",
  "updated_at": "2025-01-05T15:00:00Z"
}
```

**Note:** Multiple interviews per application are supported. Each interview is a separate `job_interviews` record.

---

## 5️⃣ OFFERS

**Table:** `job_offers`

**API Endpoints:**
- `GET /api/v1/offers` - List all offers (ALL fields)
- `GET /api/v1/applications/:id/card` - Includes offers array
- `POST /api/v1/offers` - Send offer

**ALL Fields Returned:**

```json
{
  "id": "uuid",
  "application_id": "uuid",             // Links to application
  
  // Offer Details
  "salary_offered": 45000.00,           // DECIMAL(12,2)
  "salary_type": "monthly",             // hourly | monthly | yearly
  "currency": "PHP",
  "start_date": "2025-01-20",           // Proposed start date
  
  // Benefits & Terms
  "benefits_offered": [                 // JSONB array
    "Health Insurance",
    "13th Month Pay",
    "Paid Time Off"
  ],
  "additional_terms": "text",           // Additional offer terms/message
  
  // Status
  "status": "accepted",                 // draft | sent | viewed | accepted | 
                                        // rejected | negotiating | expired | withdrawn
  
  // Tracking
  "sent_at": "2025-01-08T00:00:00Z",   // When offer was sent
  "viewed_at": "2025-01-08T12:00:00Z", // When candidate viewed
  "responded_at": "2025-01-09T00:00:00Z", // When candidate responded
  "expires_at": "2025-01-15T00:00:00Z", // Offer expiration
  
  // Response
  "candidate_response": "text",         // Candidate's response message
  "rejection_reason": "text",           // If rejected, why
  
  // Who Created
  "created_by": "uuid",                 // Recruiter who created offer
  
  // Timestamps
  "created_at": "2025-01-08T00:00:00Z",
  "updated_at": "2025-01-09T00:00:00Z"
}
```

**Note:** Multiple offers per application are supported (e.g., revised offers after negotiation).

---

## 6️⃣ HIRED/STARTED TRACKING

**Table:** `job_applications` (fields updated when hired)

**API Endpoints:**
- `GET /api/v1/applications/:id` - Returns all fields including hired/started data
- `GET /api/v1/applications/:id/card` - Returns all fields
- `PATCH /api/v1/applications/:id/card/hired` - Update hired/started status

**ALL Fields:**

```json
{
  // ... all other application fields ...
  
  // Hired/Started Tracking
  "offer_acceptance_date": "2025-01-10T00:00:00Z", // When candidate accepted offer
  "contract_signed": true,               // Boolean - contract signed?
  "first_day_date": "2025-01-20",       // First day of work (DATE)
  "started_status": "started",            // hired | started | no_show
  
  // Status also updates
  "status": "hired"                       // Automatically set to "hired" when started_status is set
}
```

**Status Flow:**
- `offer_accepted` → Candidate accepts offer
- `hired` → Contract signed, ready to start
- `started` → First day completed
- `no_show` → Candidate didn't show up

---

## 7️⃣ ACTIVITY TIMELINE

**Table:** `application_activity_timeline`

**API Endpoints:**
- `GET /api/v1/applications/:id/card` - Includes timeline array
- `POST /api/v1/applications/:id/card/timeline` - Log activity

**ALL Fields:**

```json
{
  "id": "uuid",
  "application_id": "uuid",             // Links to application
  
  // Action Details
  "action_type": "prescreen_completed", // applied | status_changed | prescreen_completed | 
                                        // prescreen_rejected | client_reviewed | 
                                        // interview_scheduled | interview_completed | 
                                        // interview_cancelled | offer_sent | offer_accepted | 
                                        // offer_declined | rejected | hired | started | 
                                        // no_show | note_added | rating_added | tag_added | other
  
  // Who Performed Action
  "performed_by_type": "recruiter",     // candidate | recruiter | client | system
  "performed_by_id": "uuid",            // ID of recruiter/candidate (or NULL for system/client)
  
  // Description
  "description": "Recruiter pre-screening completed (Rating: 4)",
  
  // Metadata (JSONB - flexible)
  "metadata": {
    "video_call_room_id": "uuid",
    "rating": 4,
    "has_notes": true,
    "duration_seconds": 1800,
    "old_status": "submitted",
    "new_status": "shortlisted"
  },
  
  // Timestamp
  "created_at": "2025-01-03T10:30:00Z"
}
```

**Note:** Timeline automatically logs major events (status changes, pre-screens, interviews, offers). You can also manually log custom events.

---

## 🔗 Complete Data Flow Example

### Step 1: Job Created
```json
GET /api/v1/jobs/:jobId
{
  "id": "job-123",
  "title": "Virtual Assistant",
  "status": "active",
  // ... ALL 20+ fields
}
```

### Step 2: Candidate Applies
```json
POST /api/v1/applications
{
  "jobId": "job-123",
  "candidate": { ... }
}

GET /api/v1/applications/:appId
{
  "id": "app-456",
  "job_id": "job-123",
  "candidate_id": "cand-789",
  "status": "submitted",
  // ... ALL 20+ fields
}
```

### Step 3: Pre-Screen Conducted
```json
POST /api/v1/video/rooms
{
  "applicationId": "app-456",
  "callType": "recruiter_prescreen"
}

PATCH /api/v1/video/rooms/:roomId
{
  "rating": 4,
  "notes": "Strong candidate"
}

GET /api/v1/applications/:appId/card
{
  "prescreens": [
    {
      "id": "room-111",
      "rating": 4,
      "notes": "Strong candidate",
      "recordings": [...],
      "transcripts": [...]
      // ... ALL fields
    }
  ]
}
```

### Step 4: Interview Scheduled
```json
POST /api/v1/interviews
{
  "applicationId": "app-456",
  "type": "client_round_1",
  "scheduledAt": "2025-01-10T14:00:00Z",
  "clientTimezone": "America/New_York"
}

GET /api/v1/interviews
{
  "interviews": [
    {
      "id": "int-222",
      "application_id": "app-456",
      "interview_type": "client_round_1",
      "scheduled_at": "2025-01-10T14:00:00Z",
      "scheduled_at_client_local": "Jan 10, 9:00 AM (New York)",
      "scheduled_at_ph": "Jan 10, 10:00 PM (PHT)",
      // ... ALL fields
    }
  ]
}
```

### Step 5: Offer Sent
```json
POST /api/v1/offers
{
  "applicationId": "app-456",
  "salary": 45000,
  "currency": "PHP",
  "startDate": "2025-01-20"
}

GET /api/v1/offers
{
  "offers": [
    {
      "id": "offer-333",
      "application_id": "app-456",
      "salary_offered": 45000.00,
      "status": "sent",
      "sent_at": "2025-01-08T00:00:00Z",
      // ... ALL fields
    }
  ]
}
```

### Step 6: Hired & Started
```json
PATCH /api/v1/applications/:appId/card/hired
{
  "offer_acceptance_date": "2025-01-10T00:00:00Z",
  "contract_signed": true,
  "first_day_date": "2025-01-20",
  "started_status": "started"
}

GET /api/v1/applications/:appId
{
  "status": "hired",
  "offer_acceptance_date": "2025-01-10T00:00:00Z",
  "contract_signed": true,
  "first_day_date": "2025-01-20",
  "started_status": "started",
  // ... ALL fields
}
```

### Step 7: Complete Timeline
```json
GET /api/v1/applications/:appId/card
{
  "timeline": [
    {
      "action_type": "applied",
      "description": "Candidate applied",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "action_type": "prescreen_completed",
      "description": "Recruiter pre-screening completed (Rating: 4)",
      "metadata": { "rating": 4 },
      "created_at": "2025-01-03T10:30:00Z"
    },
    {
      "action_type": "interview_scheduled",
      "description": "Client interview scheduled",
      "created_at": "2025-01-04T00:00:00Z"
    },
    {
      "action_type": "offer_sent",
      "description": "Offer sent to candidate",
      "created_at": "2025-01-08T00:00:00Z"
    },
    {
      "action_type": "offer_accepted",
      "description": "Candidate accepted offer",
      "created_at": "2025-01-10T00:00:00Z"
    },
    {
      "action_type": "hired",
      "description": "Candidate hired",
      "created_at": "2025-01-10T00:00:00Z"
    },
    {
      "action_type": "started",
      "description": "Candidate started work",
      "created_at": "2025-01-20T00:00:00Z"
    }
  ]
}
```

---

## 📊 Complete Field Summary

### Jobs Table (20+ fields)
✅ ALL fields accessible via `GET /api/v1/jobs` and `GET /api/v1/jobs/:id`

### Applications Table (20+ fields)
✅ ALL fields accessible via `GET /api/v1/applications/:id` and `GET /api/v1/applications/:id/card`

### Pre-Screens (video_call_rooms table, 20+ fields)
✅ ALL fields accessible via `GET /api/v1/applications/:id/card` (prescreens array)

### Interviews Table (15+ fields)
✅ ALL fields accessible via `GET /api/v1/interviews` and `GET /api/v1/applications/:id/card`

### Offers Table (15+ fields)
✅ ALL fields accessible via `GET /api/v1/offers` and `GET /api/v1/applications/:id/card`

### Activity Timeline Table (5+ fields)
✅ ALL fields accessible via `GET /api/v1/applications/:id/card` (timeline array)

---

## ✅ Verification Checklist

- [x] Jobs table - ALL fields returned
- [x] Applications table - ALL fields returned
- [x] Pre-screens (video_call_rooms) - ALL fields returned
- [x] Interviews table - ALL fields returned
- [x] Offers table - ALL fields returned
- [x] Activity timeline - ALL fields returned
- [x] Hired/Started tracking - ALL fields returned
- [x] Related data (recordings, transcripts) - ALL fields returned

---

## 🎯 Key Takeaways

1. **Every field is accessible** - No fields are hidden or filtered
2. **Complete data via `/card` endpoint** - Get everything in one call
3. **Multiple records supported** - Pre-screens, interviews, offers can have multiple entries
4. **Full audit trail** - Activity timeline tracks everything
5. **Timezone support** - Interviews show times in both client and PH timezones
6. **Rich metadata** - JSONB fields allow flexible data storage

---

**Last Updated:** 2025-01-01
**Status:** ✅ ALL ENDPOINTS RETURN ALL FIELDS



