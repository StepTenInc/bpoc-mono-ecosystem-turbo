# BPOC Local Test Checklist: Call Types → Recording → Transcription

Use this to verify **Agency Portal → Candidate** call flows store:
- `call_type` (Pre-Screen / Round 1 / Round 2)
- recordings (`video_call_recordings`)
- transcripts (`video_call_transcripts`)

> Important (local testing): Daily webhooks cannot hit `localhost`, so `video_call_participants` may stay empty.  
> That does **not** block recording + transcription tests because we can **manually sync recordings** from Daily.

---

## Prereqs

- **BPOC dev server**: `http://localhost:3001`
- **Env vars set**:
  - `DAILY_API_KEY` (required for rooms + recording sync)
  - `OPENAI_API_KEY` (required for Whisper transcription)
- **You have**:
  - an **Agency API key** (`X-API-Key: ...`)
  - a **real applicationId** that belongs to the agency
  - the candidate can log into BPOC (to accept call + to run sync/transcribe)

---

## Test A: Pre-Screen (Quick Call)

### 1) Create room (Agency Portal)

Call:
- `POST /api/v1/video/rooms`

Body:
- `applicationId`: your app id
- `callType`: `recruiter_prescreen`
- `enableRecording`: `true`
- `enableTranscription`: `true`

Expected:
- response contains `room.id` and `participant.joinUrl`
- database:
  - `video_call_rooms.id == room.id`
  - `video_call_rooms.call_type == recruiter_prescreen`

### 2) Ring candidate (Agency Portal)

Call:
- `POST /api/v1/notifications/call`

Body:
- `roomId`: the `room.id` from step 1
- `candidateId`: candidate UUID
- `recruiterName`: your recruiter name
- `jobTitle`: optional
- `participantJoinUrl`: the `participant.joinUrl` from step 1

Expected:
- creates `video_call_invitations` row:
  - `status == pending`
  - `call_type == recruiter_prescreen` (**inherits from room**)

### 3) Candidate answers (BPOC UI)

Expected:
- candidate sees incoming call and can join

### 4) Make sure recording exists in Daily

During the call, the host should start cloud recording in Daily UI (or use your existing in-app record controls if present).

### 5) End call

Expected:
- `video_call_rooms.status` becomes `ended` (may take a moment depending on how host ends)

### 6) Sync recording into BPOC DB (Candidate side)

Because webhooks can’t reach localhost, do manual sync:
- call `POST /api/video/sync-recordings` with candidate logged in
- body: `{ "roomId": "<room.id>" }`

Expected DB:
- `video_call_recordings` row exists with:
  - `room_id == room.id`
  - `status == ready` (or `processing` then later `ready`)
  - `download_url` populated once ready

### 7) Transcribe (Candidate side)

Call:
- `POST /api/video/transcribe`
- body: `{ "roomId": "<room.id>" }`

Expected DB:
- `video_call_transcripts` row exists with:
  - `room_id == room.id`
  - `status == completed`
  - `summary` and `key_points` populated

### 8) Verify in UI (Recruiter/Admin)

Open:
- Recruiter: `/recruiter/applications/<applicationId>`
- Admin: `/admin/applications/<applicationId>`

Expected:
- “Call Artifacts” panel shows the room, recording, and transcript.

---

## Test B: Recruiter Round 1 (Quick Call)

Repeat Test A but set:
- `callType`: `recruiter_round_1`

Key asserts:
- `video_call_rooms.call_type == recruiter_round_1`
- `video_call_invitations.call_type == recruiter_round_1`

---

## Test C: Recruiter Round 2 (Quick Call)

Repeat Test A but set:
- `callType`: `recruiter_round_2`

Key asserts:
- `video_call_rooms.call_type == recruiter_round_2`
- `video_call_invitations.call_type == recruiter_round_2`

---

## What “good” looks like in Supabase tables

- **`video_call_rooms`**
  - 3 rows (one per call)
  - correct `call_type` values
  - `application_id` set

- **`video_call_invitations`**
  - 3 rows
  - `status` goes `pending → accepted`
  - correct `call_type`

- **`video_call_recordings`**
  - at least 1 per call (depending on how many recordings were started)
  - `download_url` populated once ready

- **`video_call_transcripts`**
  - at least 1 per recording you transcribed
  - `status == completed`
  - `summary` and `key_points` populated

---

## Common gotchas (local)

- **No recordings show up**:
  - Host didn’t start cloud recording in Daily UI
  - Recording still processing → re-run sync after 1–2 minutes

- **Transcription fails with URL expired**:
  - Re-run `POST /api/video/transcribe` (it will fetch a fresh Daily download link)

- **Whisper fails due to size**:
  - Daily recording may be too large (>25MB). Use shorter calls for testing.


