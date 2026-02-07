# Application Card Architecture

> 📋 **Complete Design Document for BPOC Application Card System**

## Overview

The Application Card is BPOC's source of truth for each application, tracking everything from initial submission through hiring and Day 1 start. This document explains the architecture and data structure decisions.

---

## Design Principles

1. **Multiple Related Entities**: Use separate tables (like `job_interviews`, `job_offers`)
2. **Single Values**: Keep simple fields on `job_applications` for one-per-application data
3. **Flexible Metadata**: Use JSONB for extensible data
4. **Activity Tracking**: Separate timeline table for all events

---

## Data Structure

### 1. Application Core (`job_applications`)

**Single-value fields** (one per application):

```sql
-- Core status
status                      TEXT
position                    INTEGER
reviewed_by                 UUID
reviewed_at                 TIMESTAMPTZ
recruiter_notes             TEXT

-- Client feedback (single client per application)
client_notes                TEXT
client_rating               INTEGER (1-5)
client_tags                 TEXT[]  -- Array of tags

-- Rejection (one rejection per application)
rejection_reason            TEXT
rejected_by                 TEXT ('client' | 'recruiter')
rejected_date               TIMESTAMPTZ

-- Hired/Started (one outcome per application)
offer_acceptance_date      TIMESTAMPTZ
contract_signed             BOOLEAN
first_day_date              DATE
started_status              TEXT ('hired' | 'started' | 'no_show')
```

**Why TEXT vs JSONB?**
- `client_notes`: TEXT - Can be long, but single value
- `client_tags`: TEXT[] - Array type is perfect for tags
- `rejection_reason`: TEXT - Single value, can be long
- All other fields: Simple types (INTEGER, BOOLEAN, DATE, TEXT)

---

### 2. Pre-Screens (`video_call_rooms`)

**Multiple pre-screens per application** - Use existing `video_call_rooms` table:

```sql
-- Link to application
application_id              UUID

-- Call type identifies it as a pre-screen
call_type                   TEXT ('recruiter_prescreen')

-- Pre-screen data
rating                      INTEGER (1-5)
notes                       TEXT
status                      TEXT ('created' | 'waiting' | 'active' | 'ended')
started_at                  TIMESTAMPTZ
ended_at                    TIMESTAMPTZ
duration_seconds            INTEGER

-- Related data (via relations)
recordings                  video_call_recordings[]  -- Multiple recordings
transcripts                 video_call_transcripts[]  -- Multiple transcripts
```

**Why use `video_call_rooms`?**
- ✅ Already exists and supports multiple calls per application
- ✅ Has `application_id` foreign key
- ✅ Has `call_type` field (includes `recruiter_prescreen`)
- ✅ Links to `video_call_recordings` (videos)
- ✅ Links to `video_call_transcripts` (transcripts)
- ✅ Has `rating` and `notes` fields
- ✅ Tracks `host_user_id` (screened_by)

**Query Example:**
```sql
-- Get all pre-screens for an application
SELECT vcr.*, 
       array_agg(DISTINCT vcr_rec.recording_url) as recording_urls,
       array_agg(DISTINCT vct.full_text) as transcripts
FROM video_call_rooms vcr
LEFT JOIN video_call_recordings vcr_rec ON vcr_rec.room_id = vcr.id
LEFT JOIN video_call_transcripts vct ON vct.room_id = vcr.id
WHERE vcr.application_id = 'app-uuid'
  AND vcr.call_type = 'recruiter_prescreen'
GROUP BY vcr.id;
```

---

### 3. Interviews (`job_interviews`)

**Multiple interviews per application** - Already exists:

```sql
application_id              UUID
interview_type             TEXT ('recruiter_prescreen' | 'recruiter_round_1' | 'client_round_1' | ...)
scheduled_at               TIMESTAMPTZ
status                     TEXT
outcome                    TEXT
rating                     INTEGER
interviewer_notes          TEXT
```

**Note**: `job_interviews` can also have `interview_type = 'recruiter_prescreen'`, but `video_call_rooms` is preferred for pre-screens because it includes video/transcript support.

---

### 4. Offers (`job_offers`)

**Multiple offers per application** - Already exists:

```sql
application_id              UUID
salary_offered              DECIMAL
status                      TEXT ('draft' | 'sent' | 'accepted' | 'rejected')
candidate_response          TEXT
rejection_reason            TEXT  -- Offer decline reason
```

---

### 5. Activity Timeline (`application_activity_timeline`)

**Multiple events per application** - New table:

```sql
application_id              UUID
action_type                 TEXT ('applied' | 'prescreen_completed' | 'rejected' | ...)
performed_by_type            TEXT ('candidate' | 'recruiter' | 'client' | 'system')
performed_by_id             UUID
description                 TEXT
metadata                    JSONB  -- Flexible: can store video_call_room_id, interview_id, etc.
created_at                  TIMESTAMPTZ
```

**Why JSONB for metadata?**
- Can store references: `video_call_room_id`, `interview_id`, `offer_id`
- Can store state changes: `old_status`, `new_status`
- Can store additional data: `rating`, `tags`, etc.
- Extensible without schema changes

---

## API Design

### Get Application Card

```http
GET /api/v1/applications/:id/card
```

**Response includes:**
```json
{
  "application": {
    // Core fields from job_applications
    "id": "...",
    "status": "shortlisted",
    "client_notes": "...",
    "client_rating": 5,
    "client_tags": ["excellent", "fast-track"],
    
    // Related data (multiple per application)
    "prescreens": [
      {
        "id": "video-room-uuid",
        "rating": 4,
        "notes": "...",
        "recordings": [...],
        "transcripts": [...],
        "created_at": "..."
      }
    ],
    "interviews": [...],
    "offers": [...],
    "timeline": [...]
  }
}
```

---

## Data Flow Examples

### Example 1: Multiple Pre-Screens

1. **First Pre-Screen**:
   - Create `video_call_rooms` with `call_type = 'recruiter_prescreen'`
   - Link to `application_id`
   - After call: Update with `rating = 3`, `notes = "Needs improvement"`
   - Trigger logs activity: `prescreen_rejected`

2. **Second Pre-Screen** (candidate improved):
   - Create another `video_call_rooms` with same `application_id`
   - After call: Update with `rating = 5`, `notes = "Excellent!"`
   - Trigger logs activity: `prescreen_completed`

3. **Query**:
   ```sql
   SELECT * FROM video_call_rooms 
   WHERE application_id = 'app-uuid' 
     AND call_type = 'recruiter_prescreen'
   ORDER BY created_at DESC;
   ```

### Example 2: Client Feedback

- Single client per application
- Update `job_applications.client_notes`, `client_rating`, `client_tags`
- Trigger logs activity: `client_reviewed`

### Example 3: Rejection

- Single rejection per application
- Update `job_applications.status = 'rejected'`, `rejected_by`, `rejection_reason`
- Trigger logs activity: `rejected`

---

## Migration Strategy

1. **Run the FIXED migration** (`20251219_add_application_card_fields_FIXED.sql`)
2. **If old migration was applied**, run cleanup:
   ```sql
   ALTER TABLE job_applications
     DROP COLUMN IF EXISTS recruiter_prescreen_video_url,
     DROP COLUMN IF EXISTS recruiter_prescreen_transcript,
     DROP COLUMN IF EXISTS recruiter_prescreen_rating,
     DROP COLUMN IF EXISTS recruiter_prescreen_notes,
     DROP COLUMN IF EXISTS recruiter_prescreen_date,
     DROP COLUMN IF EXISTS recruiter_prescreen_status,
     DROP COLUMN IF EXISTS recruiter_prescreen_screened_by;
   ```

---

## Summary

| Data Type | Storage | Multiple? | Why |
|-----------|---------|-----------|-----|
| Pre-screens | `video_call_rooms` | ✅ Yes | Multiple calls, videos, transcripts |
| Client feedback | `job_applications` | ❌ No | Single client per application |
| Rejection | `job_applications` | ❌ No | One rejection per application |
| Hired/Started | `job_applications` | ❌ No | One outcome per application |
| Interviews | `job_interviews` | ✅ Yes | Multiple interviews |
| Offers | `job_offers` | ✅ Yes | Multiple offers |
| Activity Timeline | `application_activity_timeline` | ✅ Yes | Multiple events |

**Key Insight**: Use existing tables (`video_call_rooms`, `job_interviews`, `job_offers`) for multiple entities, and simple fields on `job_applications` for single values.



