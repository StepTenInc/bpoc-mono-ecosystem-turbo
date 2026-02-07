# BPOC API v1 - Complete Integration Guide

**Base URL:** `https://www.bpoc.io/api/v1`
**Version:** 1.0
**Last Updated:** January 5, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Common Patterns](#common-patterns)
4. [Endpoints](#endpoints)
   - [Jobs](#jobs-api)
   - [Applications](#applications-api)
   - [Candidates](#candidates-api)
   - [Clients](#clients-api)
   - [Interviews](#interviews-api)
   - [Notifications](#notifications-api)
   - [Video Calls](#video-calls-api)
5. [Webhooks](#webhooks)
6. [Best Practices](#best-practices)

---

## Authentication

### API Key Authentication

All v1 endpoints require authentication via API key (except public endpoints).

**Header:**
```
X-API-Key: your_api_key_here
```

**Example:**
```bash
curl -X GET https://www.bpoc.io/api/v1/jobs \
  -H "X-API-Key: bpoc_abc123xyz..."
```

### Getting Your API Key

Contact BPOC support to obtain your agency API key.

---

## Error Handling

### Standard Error Response Format

All errors follow this consistent format:

```json
{
  "error": "Error category",
  "message": "Detailed error message",
  "field": "fieldName" // (optional) which field caused the error
}
```

### HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| **200** | Success | Request completed successfully |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Validation error, invalid input |
| **401** | Unauthorized | Missing or invalid API key |
| **403** | Forbidden | API access disabled or tier restriction |
| **404** | Not Found | Resource doesn't exist |
| **500** | Server Error | Internal server error (should be rare) |

### Common Validation Errors

#### Invalid UUID Format
```json
{
  "error": "Validation error",
  "message": "Invalid candidateId format. Expected UUID (e.g., 092fd214-03c5-435d-9156-4a533d950cc3)",
  "field": "candidateId"
}
```

#### Missing Required Fields
```json
{
  "error": "Validation error",
  "message": "Missing required fields: roomId, candidateId",
  "field": "roomId"
}
```

#### Resource Not Found
```json
{
  "error": "Candidate not found",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Common Patterns

### UUID Format

All IDs use UUID v4 format:
```
092fd214-03c5-435d-9156-4a533d950cc3
```

**Validation:** `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

### Date Format

All dates are in ISO 8601 format:
```
2026-01-05T14:30:00.000Z
```

### Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` - Number of results (default: 20, max: 100)
- `offset` - Number of results to skip (default: 0)

**Example:**
```
GET /api/v1/jobs?limit=50&offset=100
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 100,
    "hasMore": false
  }
}
```

---

## Endpoints

## Jobs API

### 1. Create Job

**POST** `/api/v1/jobs/create`

Create a new job listing.

**Tier Required:** Pro or Enterprise

**Request Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key
```

**Request Body:**
```json
{
  "title": "Senior Full Stack Developer",
  "description": "We're looking for an experienced full stack developer...",
  "requirements": [
    "5+ years of experience",
    "React and Node.js expertise",
    "TypeScript proficiency"
  ],
  "responsibilities": [
    "Build and maintain web applications",
    "Lead technical projects",
    "Mentor junior developers"
  ],
  "benefits": [
    "Competitive salary",
    "Remote work",
    "Health insurance"
  ],
  "salaryMin": 80000,
  "salaryMax": 120000,
  "currency": "USD",
  "workArrangement": "remote",
  "workType": "full_time",
  "experienceLevel": "senior_level",
  "shift": "day",
  "clientId": "client-uuid-here",
  "skills": ["React", "Node.js", "TypeScript", "PostgreSQL"]
}
```

**Required Fields:**
- `title` (string, 1-200 chars)
- `description` (string, 10-10000 chars)

**Optional Fields:**
- `requirements` (array of strings)
- `responsibilities` (array of strings)
- `benefits` (array of strings)
- `salaryMin` (number)
- `salaryMax` (number)
- `currency` (string, default: "PHP")
- `workArrangement` (enum: "remote" | "onsite" | "hybrid", default: "remote")
- `workType` (enum: "full_time" | "part_time" | "contract", default: "full_time")
- `experienceLevel` (enum: "entry_level" | "mid_level" | "senior_level")
- `shift` (enum: "day" | "night" | "flexible", default: "day")
- `clientId` (UUID, defaults to your first client)
- `skills` (array of strings)

**Success Response (201):**
```json
{
  "success": true,
  "job": {
    "id": "job-uuid-here",
    "title": "Senior Full Stack Developer",
    "slug": "senior-full-stack-developer-abc123",
    "status": "active",
    "createdAt": "2026-01-05T14:30:00.000Z"
  },
  "message": "Job created successfully"
}
```

**Error Responses:**

403 - Free Tier Restriction:
```json
{
  "error": "Creating jobs via API requires Pro plan",
  "upgrade": "Upgrade to Pro to create jobs via API"
}
```

400 - Missing Required Fields:
```json
{
  "error": "Validation error",
  "message": "Missing required fields: title, description"
}
```

400 - No Clients:
```json
{
  "error": "No clients found. Create a client first before posting jobs."
}
```

**Example cURL:**
```bash
curl -X POST https://www.bpoc.io/api/v1/jobs/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_your_key" \
  -d '{
    "title": "Senior Full Stack Developer",
    "description": "We are looking for...",
    "salaryMin": 80000,
    "salaryMax": 120000,
    "workArrangement": "remote",
    "skills": ["React", "Node.js"]
  }'
```

---

### 2. List Jobs

**GET** `/api/v1/jobs`

List all jobs for your agency.

**Query Parameters:**
- `limit` (number, default: 20, max: 100)
- `offset` (number, default: 0)
- `status` (enum: "active" | "closed" | "draft")
- `clientId` (UUID)

**Success Response (200):**
```json
{
  "jobs": [
    {
      "id": "job-uuid",
      "title": "Senior Full Stack Developer",
      "slug": "senior-full-stack-developer-abc123",
      "description": "...",
      "status": "active",
      "salary_min": 80000,
      "salary_max": 120000,
      "currency": "USD",
      "work_arrangement": "remote",
      "work_type": "full_time",
      "experience_level": "senior_level",
      "created_at": "2026-01-05T14:30:00.000Z",
      "client": {
        "id": "client-uuid",
        "name": "ShoreAgents Inc."
      },
      "skills": ["React", "Node.js", "TypeScript"],
      "applications_count": 15
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Example:**
```bash
curl -X GET "https://www.bpoc.io/api/v1/jobs?status=active&limit=50" \
  -H "X-API-Key: bpoc_your_key"
```

---

### 3. Get Single Job

**GET** `/api/v1/jobs/[id]`

Get detailed information about a specific job.

**Success Response (200):**
```json
{
  "job": {
    "id": "job-uuid",
    "title": "Senior Full Stack Developer",
    "slug": "senior-full-stack-developer-abc123",
    "description": "Full job description here...",
    "requirements": ["5+ years experience", "..."],
    "responsibilities": ["Build applications", "..."],
    "benefits": ["Remote work", "..."],
    "salary_min": 80000,
    "salary_max": 120000,
    "currency": "USD",
    "work_arrangement": "remote",
    "work_type": "full_time",
    "experience_level": "senior_level",
    "status": "active",
    "created_at": "2026-01-05T14:30:00.000Z",
    "client": {
      "id": "client-uuid",
      "name": "ShoreAgents Inc.",
      "agency_id": "agency-uuid"
    },
    "skills": [
      { "name": "React", "is_required": true },
      { "name": "Node.js", "is_required": true }
    ],
    "applications_count": 15,
    "recent_applications": [...]
  }
}
```

**404 Response:**
```json
{
  "error": "Job not found",
  "id": "job-uuid"
}
```

---

## Applications API

### 4. Submit Application

**POST** `/api/v1/applications`

Submit a candidate application to a job.

**Request Body:**
```json
{
  "jobId": "job-uuid",
  "candidateId": "candidate-uuid",
  "coverLetter": "I am very interested in this position...",
  "resumeUrl": "https://storage.com/resume.pdf",
  "source": "shoreagents"
}
```

**Required Fields:**
- `jobId` (UUID)
- `candidateId` (UUID)

**Optional Fields:**
- `coverLetter` (string, max 5000 chars)
- `resumeUrl` (valid URL)
- `source` (string, for tracking)

**Success Response (201):**
```json
{
  "success": true,
  "application": {
    "id": "application-uuid",
    "job_id": "job-uuid",
    "candidate_id": "candidate-uuid",
    "status": "submitted",
    "created_at": "2026-01-05T14:30:00.000Z"
  },
  "message": "Application submitted successfully"
}
```

**Validation Errors:**

Invalid UUID:
```json
{
  "error": "Validation error",
  "message": "Invalid jobId format. Expected UUID",
  "field": "jobId"
}
```

Job Not Found:
```json
{
  "error": "Job not found",
  "id": "job-uuid"
}
```

Candidate Not Found:
```json
{
  "error": "Candidate not found",
  "id": "candidate-uuid"
}
```

Duplicate Application:
```json
{
  "error": "Candidate has already applied to this job"
}
```

**Example:**
```bash
curl -X POST https://www.bpoc.io/api/v1/applications \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_your_key" \
  -d '{
    "jobId": "092fd214-03c5-435d-9156-4a533d950cc3",
    "candidateId": "550e8400-e29b-41d4-a716-446655440000",
    "coverLetter": "I am excited about...",
    "source": "shoreagents"
  }'
```

---

### 5. Get Application Card

**GET** `/api/v1/applications/[id]/card`

Get comprehensive application details including timeline, prescreens, interviews, and offers.

**Success Response (200):**
```json
{
  "application": {
    "id": "application-uuid",
    "job_id": "job-uuid",
    "candidate_id": "candidate-uuid",
    "status": "interview_scheduled",
    "created_at": "2026-01-05T14:30:00.000Z",
    "updated_at": "2026-01-06T10:00:00.000Z",

    "job": {
      "id": "job-uuid",
      "title": "Senior Developer",
      "agency_client_id": "client-uuid"
    },

    "candidate": {
      "id": "candidate-uuid",
      "email": "candidate@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },

    "prescreens": [
      {
        "id": "room-uuid",
        "call_type": "recruiter_prescreen",
        "status": "ended",
        "rating": 4,
        "notes": "Great communication skills",
        "duration_seconds": 1800,
        "started_at": "2026-01-06T09:00:00.000Z",
        "ended_at": "2026-01-06T09:30:00.000Z",
        "recordings": [
          {
            "id": "recording-uuid",
            "recording_url": "https://...",
            "duration_seconds": 1800,
            "status": "ready"
          }
        ],
        "transcripts": [
          {
            "id": "transcript-uuid",
            "status": "ready",
            "full_text": "..."
          }
        ]
      }
    ],

    "interviews": [
      {
        "id": "interview-uuid",
        "scheduled_at": "2026-01-07T14:00:00.000Z",
        "type": "technical",
        "status": "scheduled",
        "interviewer_name": "Jane Smith"
      }
    ],

    "offers": [
      {
        "id": "offer-uuid",
        "salary": 100000,
        "status": "pending",
        "expires_at": "2026-01-14T23:59:59.000Z"
      }
    ],

    "timeline": [
      {
        "id": "timeline-uuid",
        "action_type": "application_submitted",
        "performed_by_type": "candidate",
        "description": "Application submitted",
        "created_at": "2026-01-05T14:30:00.000Z"
      },
      {
        "id": "timeline-uuid-2",
        "action_type": "prescreen_completed",
        "performed_by_type": "recruiter",
        "description": "Pre-screen interview completed",
        "created_at": "2026-01-06T09:30:00.000Z"
      }
    ]
  }
}
```

**404 Response:**
```json
{
  "error": "Application not found",
  "id": "application-uuid"
}
```

---

### 6. Update Application - Add Client Feedback

**POST** `/api/v1/applications/[id]/card/client-feedback`

Add client feedback to an application after prescreen.

**Request Body:**
```json
{
  "clientFeedback": "Great candidate, strong technical skills",
  "clientRating": 5
}
```

**Required Fields:**
- `clientFeedback` (string, 10-5000 chars)
- `clientRating` (number, 1-5)

**Success Response (200):**
```json
{
  "success": true,
  "application": {
    "id": "application-uuid",
    "client_feedback": "Great candidate...",
    "client_rating": 5,
    "updated_at": "2026-01-06T10:00:00.000Z"
  }
}
```

---

### 7. Update Application - Mark as Hired

**POST** `/api/v1/applications/[id]/card/hired`

Mark an application as hired.

**Request Body:**
```json
{
  "startDate": "2026-02-01",
  "salary": 100000,
  "notes": "Starts February 1st"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "application": {
    "id": "application-uuid",
    "status": "hired",
    "hired_date": "2026-02-01",
    "updated_at": "2026-01-06T10:00:00.000Z"
  }
}
```

---

### 8. Update Application - Reject

**POST** `/api/v1/applications/[id]/card/reject`

Reject an application.

**Request Body:**
```json
{
  "rejectionReason": "Not a good fit for the role",
  "rejectionType": "skills_mismatch"
}
```

**Optional Fields:**
- `rejectionReason` (string)
- `rejectionType` (enum: "skills_mismatch" | "experience" | "culture_fit" | "other")

**Success Response (200):**
```json
{
  "success": true,
  "application": {
    "id": "application-uuid",
    "status": "rejected",
    "rejection_reason": "Not a good fit...",
    "updated_at": "2026-01-06T10:00:00.000Z"
  }
}
```

---

## Clients API

### 9. Get or Create Client

**POST** `/api/v1/clients/get-or-create`

Get existing client or create new one (idempotent).

**Request Body:**
```json
{
  "name": "ShoreAgents Inc.",
  "email": "contact@shoreagents.com",
  "phone": "+1-555-0100"
}
```

**Required Fields:**
- `name` (string, 2-200 chars)
- `email` (valid email format)

**Success Response (200 or 201):**
```json
{
  "client": {
    "id": "client-uuid",
    "name": "ShoreAgents Inc.",
    "email": "contact@shoreagents.com",
    "phone": "+1-555-0100",
    "agency_id": "your-agency-uuid",
    "created_at": "2026-01-05T14:30:00.000Z"
  },
  "created": true
}
```

If client already exists, `created` will be `false`.

**Validation Errors:**

Invalid Email:
```json
{
  "error": "Validation error",
  "message": "Invalid email format. Expected valid email address",
  "field": "email"
}
```

---

## Candidates API

### 10. Create Candidate

**POST** `/api/v1/candidates`

Create a new candidate profile.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0123",
  "resumeUrl": "https://storage.com/resume.pdf",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "skills": ["React", "Node.js", "TypeScript"],
  "experience_years": 5,
  "location": "New York, NY"
}
```

**Required Fields:**
- `email` (valid email)
- `firstName` (string, 1-100 chars)
- `lastName` (string, 1-100 chars)

**Success Response (201):**
```json
{
  "success": true,
  "candidate": {
    "id": "candidate-uuid",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2026-01-05T14:30:00.000Z"
  }
}
```

---

## Notifications API

### 11. Send Video Call Notification

**POST** `/api/v1/notifications/call`

Notify a candidate of an incoming video call.

**Request Body:**
```json
{
  "roomId": "room-uuid",
  "candidateId": "candidate-uuid",
  "participantJoinUrl": "https://shoreagents.daily.co/room-name?t=token",
  "recruiterName": "Jane Smith",
  "jobTitle": "Senior Developer"
}
```

**Required Fields:**
- `roomId` (UUID)
- `candidateId` (UUID)
- `participantJoinUrl` (valid URL)

**Optional Fields:**
- `recruiterName` (string)
- `jobTitle` (string)

**Success Response (200):**
```json
{
  "success": true,
  "invitation": {
    "id": "invitation-uuid",
    "status": "pending",
    "notificationSent": true
  },
  "message": "Candidate notified successfully"
}
```

**What Happens:**
1. Email notification sent to candidate
2. Invitation record created in database
3. Room record created (if doesn't exist)

**Validation Errors:**

Invalid UUID:
```json
{
  "error": "Validation error",
  "message": "Invalid candidateId format. Expected UUID (e.g., 092fd214-03c5-435d-9156-4a533d950cc3)",
  "field": "candidateId"
}
```

Invalid URL:
```json
{
  "error": "Validation error",
  "message": "Invalid participantJoinUrl format. Expected valid URL",
  "field": "participantJoinUrl"
}
```

Missing Fields:
```json
{
  "error": "Validation error",
  "message": "Missing required fields: roomId, candidateId, participantJoinUrl",
  "field": "roomId"
}
```

Candidate Not Found:
```json
{
  "error": "Candidate not found",
  "id": "candidate-uuid"
}
```

**Example:**
```bash
curl -X POST https://www.bpoc.io/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "092fd214-03c5-435d-9156-4a533d950cc3",
    "candidateId": "550e8400-e29b-41d4-a716-446655440000",
    "participantJoinUrl": "https://shoreagents.daily.co/test-room?t=abc123",
    "recruiterName": "Jane Smith",
    "jobTitle": "Senior Developer"
  }'
```

---

## Video Calls API

### 12. Create Video Room

**POST** `/api/v1/video/rooms`

Create a new video call room.

**Request Body:**
```json
{
  "applicationId": "application-uuid",
  "callType": "recruiter_prescreen",
  "callTitle": "Pre-Screen: Senior Developer",
  "hostUserId": "recruiter-uuid",
  "participantUserId": "candidate-uuid",
  "enableRecording": true,
  "enableTranscription": true
}
```

**Success Response (201):**
```json
{
  "room": {
    "id": "room-uuid",
    "daily_room_name": "unique-room-name",
    "daily_room_url": "https://bpoc.daily.co/unique-room-name",
    "host_join_url": "https://bpoc.daily.co/unique-room-name?t=host_token",
    "participant_join_url": "https://bpoc.daily.co/unique-room-name?t=participant_token",
    "status": "created",
    "call_type": "recruiter_prescreen",
    "enable_recording": true,
    "enable_transcription": true,
    "created_at": "2026-01-05T14:30:00.000Z"
  }
}
```

---

### 13. Get Room Details

**GET** `/api/v1/video/rooms/[roomId]`

Get details about a video room.

**Success Response (200):**
```json
{
  "room": {
    "id": "room-uuid",
    "daily_room_name": "unique-room-name",
    "status": "active",
    "started_at": "2026-01-05T15:00:00.000Z",
    "participants": [
      {
        "id": "participant-uuid",
        "user_id": "candidate-uuid",
        "name": "John Doe",
        "role": "candidate",
        "status": "joined",
        "joined_at": "2026-01-05T15:00:00.000Z"
      }
    ],
    "recordings": [
      {
        "id": "recording-uuid",
        "status": "processing",
        "duration_seconds": null
      }
    ]
  }
}
```

---

### 14. Get Recording

**GET** `/api/v1/video/recordings/[recordingId]`

Get recording details and download URL.

**Success Response (200):**
```json
{
  "recording": {
    "id": "recording-uuid",
    "room_id": "room-uuid",
    "recording_url": "https://storage.com/recording.mp4",
    "download_url": "https://storage.com/recording.mp4?token=...",
    "duration_seconds": 1800,
    "status": "ready",
    "processed_at": "2026-01-05T15:35:00.000Z",
    "storage_provider": "supabase",
    "transcripts": [
      {
        "id": "transcript-uuid",
        "status": "ready"
      }
    ]
  }
}
```

---

### 15. Get Transcript

**GET** `/api/v1/video/transcripts/[transcriptId]`

Get full transcript of a video call.

**Success Response (200):**
```json
{
  "transcript": {
    "id": "transcript-uuid",
    "room_id": "room-uuid",
    "recording_id": "recording-uuid",
    "full_text": "Full transcript here...",
    "word_count": 1500,
    "status": "ready",
    "processed_at": "2026-01-05T15:40:00.000Z",
    "ai_summary": "The candidate demonstrated strong..."
  }
}
```

---

## Interviews API

### 16. Schedule Interview

**POST** `/api/v1/interviews`

Schedule a formal interview for an application.

**Request Body:**
```json
{
  "applicationId": "application-uuid",
  "scheduledAt": "2026-01-10T14:00:00.000Z",
  "type": "technical",
  "interviewerName": "Jane Smith",
  "interviewerEmail": "jane@company.com",
  "notes": "Technical round focusing on React"
}
```

**Required Fields:**
- `applicationId` (UUID)
- `scheduledAt` (ISO 8601 date)
- `type` (enum: "technical" | "behavioral" | "culture_fit" | "final")

**Success Response (201):**
```json
{
  "success": true,
  "interview": {
    "id": "interview-uuid",
    "application_id": "application-uuid",
    "scheduled_at": "2026-01-10T14:00:00.000Z",
    "type": "technical",
    "status": "scheduled",
    "created_at": "2026-01-05T14:30:00.000Z"
  }
}
```

---

## Offers API

### 17. Create Offer

**POST** `/api/v1/offers`

Send a job offer to a candidate.

**Request Body:**
```json
{
  "applicationId": "application-uuid",
  "salary": 100000,
  "currency": "USD",
  "startDate": "2026-02-01",
  "expiresAt": "2026-01-15T23:59:59.000Z",
  "benefits": ["Health insurance", "401k", "Remote work"],
  "notes": "Looking forward to you joining the team!"
}
```

**Required Fields:**
- `applicationId` (UUID)
- `salary` (number)
- `expiresAt` (ISO 8601 date)

**Success Response (201):**
```json
{
  "success": true,
  "offer": {
    "id": "offer-uuid",
    "application_id": "application-uuid",
    "salary": 100000,
    "currency": "USD",
    "status": "pending",
    "expires_at": "2026-01-15T23:59:59.000Z",
    "created_at": "2026-01-05T14:30:00.000Z"
  }
}
```

---

## Webhooks

### Daily.co Video Webhooks

BPOC automatically processes Daily.co webhooks for:
- Recording ready
- Meeting started/ended
- Participant joined/left

**Webhook Endpoint:** `https://www.bpoc.io/api/video/webhook`

**Events Processed:**
- `recording.started`
- `recording.ready-to-download`
- `recording.error`
- `meeting.started`
- `meeting.ended`
- `participant.joined`
- `participant.left`

---

## Best Practices

### 1. Always Validate UUIDs

Before sending requests, validate UUID format:

```javascript
function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

if (!isValidUUID(candidateId)) {
  throw new Error('Invalid candidate ID format');
}
```

### 2. Handle Errors Gracefully

```javascript
try {
  const response = await fetch('https://www.bpoc.io/api/v1/notifications/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle specific error
    console.error(`API Error: ${data.message}`);
    return;
  }

  // Success
  console.log('Notification sent:', data);
} catch (error) {
  console.error('Network error:', error);
}
```

### 3. Use Idempotency

For create operations, use idempotent endpoints where available:
- `/api/v1/clients/get-or-create` - Won't create duplicates
- Include unique identifiers in payloads

### 4. Implement Retry Logic

```javascript
async function retryableRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
  }
}
```

### 5. Log All API Interactions

```javascript
const apiClient = {
  async post(endpoint, data) {
    console.log(`[API] POST ${endpoint}`, { data });

    const response = await fetch(`https://www.bpoc.io/api/v1${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    console.log(`[API] Response ${endpoint}`, {
      status: response.status,
      data: result
    });

    return { response, data: result };
  }
};
```

### 6. Rate Limiting Considerations

Currently no rate limiting enforced, but plan for:
- Max 100 requests per minute per API key
- Implement client-side throttling
- Use batch operations where available

---

## Quick Reference

### Common UUID Examples

```
Job ID:         092fd214-03c5-435d-9156-4a533d950cc3
Candidate ID:   550e8400-e29b-41d4-a716-446655440000
Application ID: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Room ID:        9b2d4f3a-8c5e-4d7b-a6f1-e3c8d9b2a1f0
```

### Status Values

**Application Status:**
- `submitted` - Initial state
- `screening` - Under review
- `interview_scheduled` - Interview set
- `interview_completed` - Interview done
- `offer_extended` - Offer sent
- `hired` - Accepted offer
- `rejected` - Not selected

**Video Room Status:**
- `created` - Room created
- `waiting` - Waiting for participants
- `active` - Call in progress
- `ended` - Call completed

**Recording Status:**
- `processing` - Being processed
- `ready` - Available for download
- `failed` - Processing failed

---

## Support

**Issues or Questions?**
- GitHub: https://github.com/StepTen2024/bpoc-stepten/issues
- Email: support@bpoc.io

**API Status:**
- Status Page: https://status.bpoc.io

---

**Last Updated:** January 5, 2026
**API Version:** 1.0
**Documentation Version:** 1.0.0
