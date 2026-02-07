# Application Card Redesign Summary

## Problem Identified

The initial design had **single fields** for pre-screening data on `job_applications`:
- `recruiter_prescreen_video_url` (single TEXT)
- `recruiter_prescreen_transcript` (single TEXT)
- `recruiter_prescreen_rating` (single INTEGER)
- etc.

**Issue**: This doesn't support **multiple pre-screens** per application (e.g., recruiter does 2-3 calls before deciding).

---

## Solution: Use Existing Tables

### ✅ Pre-Screens → `video_call_rooms`

**Why this works:**
- Already exists and supports multiple calls per application
- Has `application_id` foreign key
- Has `call_type` field (includes `recruiter_prescreen`)
- Links to `video_call_recordings` (multiple videos)
- Links to `video_call_transcripts` (multiple transcripts)
- Has `rating` and `notes` fields
- Tracks `host_user_id` (screened_by)

**Query pre-screens:**
```sql
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

### ✅ Client Feedback → `job_applications` (single values)

**Why TEXT vs JSONB:**
- `client_notes`: TEXT (can be long, but single value)
- `client_rating`: INTEGER (1-5, single value)
- `client_tags`: TEXT[] (array type perfect for tags)

**Why single values:**
- One client per application
- Client provides one set of notes/rating/tags

### ✅ Rejection → `job_applications` (single values)

**Why single values:**
- One rejection per application
- Fields: `rejection_reason` (TEXT), `rejected_by` (TEXT), `rejected_date` (TIMESTAMPTZ)

### ✅ Hired/Started → `job_applications` (single values)

**Why single values:**
- One outcome per application
- Fields: `offer_acceptance_date`, `contract_signed`, `first_day_date`, `started_status`

---

## Files Changed

### 1. Migration File (FIXED)

**File**: `20251219_add_application_card_fields_FIXED.sql`

**Changes:**
- ❌ Removed single pre-screen fields from `job_applications`
- ✅ Added client feedback fields (single values)
- ✅ Added rejection tracking (single values)
- ✅ Added hired/started tracking (single values)
- ✅ Created `application_activity_timeline` table
- ✅ Added trigger to auto-log activities
- ✅ Added trigger to log pre-screens from `video_call_rooms`

### 2. Prisma Schema

**File**: `prisma-supabase/schema.prisma`

**Changes:**
- ❌ Removed pre-screen fields from `job_applications` model
- ✅ Added comment explaining pre-screens use `video_call_rooms`
- ✅ Kept client feedback, rejection, hired/started fields

### 3. Architecture Documentation

**File**: `Docs/APPLICATION_CARD_ARCHITECTURE.md`

**New file** explaining:
- Design principles
- Data structure decisions
- Why TEXT vs JSONB
- Query examples
- Data flow examples

---

## Migration Steps

### Step 1: If Old Migration Was Applied

Run cleanup to remove incorrect fields:

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

### Step 2: Run Fixed Migration

Run: `20251219_add_application_card_fields_FIXED.sql`

### Step 3: Update Code

**Update query functions** to fetch pre-screens from `video_call_rooms`:

```typescript
// Get pre-screens for an application
const { data: prescreens } = await supabaseAdmin
  .from('video_call_rooms')
  .select(`
    *,
    recordings:video_call_recordings(*),
    transcripts:video_call_transcripts(*)
  `)
  .eq('application_id', applicationId)
  .eq('call_type', 'recruiter_prescreen')
  .order('created_at', { ascending: false });
```

**Update API endpoints** to work with `video_call_rooms` for pre-screens.

---

## API Changes Needed

### Update Pre-Screen Endpoint

**Old approach** (single fields):
```typescript
PATCH /applications/:id/card/prescreen
{
  video_url: "...",
  transcript: "...",
  rating: 4
}
```

**New approach** (use video_call_rooms):
```typescript
// Create pre-screen call
POST /api/v1/video/rooms
{
  applicationId: "...",
  callType: "recruiter_prescreen",
  ...
}

// Update pre-screen after call
PATCH /api/v1/video/rooms/:roomId
{
  rating: 4,
  notes: "...",
  status: "ended"
}
```

---

## Summary Table

| Data Type | Storage | Multiple? | Field Type | Why |
|-----------|---------|-----------|------------|-----|
| **Pre-screens** | `video_call_rooms` | ✅ Yes | Separate table | Multiple calls, videos, transcripts |
| **Client notes** | `job_applications` | ❌ No | TEXT | Single value, can be long |
| **Client rating** | `job_applications` | ❌ No | INTEGER | Single value (1-5) |
| **Client tags** | `job_applications` | ❌ No | TEXT[] | Array type perfect for tags |
| **Rejection** | `job_applications` | ❌ No | TEXT | Single rejection per app |
| **Hired/Started** | `job_applications` | ❌ No | Mixed | Single outcome per app |
| **Interviews** | `job_interviews` | ✅ Yes | Separate table | Multiple interviews |
| **Offers** | `job_offers` | ✅ Yes | Separate table | Multiple offers |
| **Activity Timeline** | `application_activity_timeline` | ✅ Yes | Separate table | Multiple events |

---

## Next Steps

1. ✅ Migration file created (FIXED version)
2. ✅ Prisma schema updated
3. ✅ Architecture documentation created
4. ⏳ Update query functions to use `video_call_rooms` for pre-screens
5. ⏳ Update API endpoints
6. ⏳ Update API documentation

---

## Key Insight

**Use existing tables for multiple entities:**
- `video_call_rooms` for pre-screens (already exists!)
- `job_interviews` for interviews (already exists!)
- `job_offers` for offers (already exists!)

**Use simple fields on `job_applications` for single values:**
- Client feedback (one client per app)
- Rejection (one rejection per app)
- Hired/Started (one outcome per app)

**Use JSONB for flexible metadata:**
- Activity timeline metadata
- Interview feedback
- Offer additional terms



