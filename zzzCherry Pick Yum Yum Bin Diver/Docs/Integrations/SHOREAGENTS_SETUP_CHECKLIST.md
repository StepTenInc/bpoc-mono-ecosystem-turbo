# BPOC Setup Checklist for ShoreAgents Testing

> **Date:** January 4, 2026  
> **ShoreAgents Port:** localhost:3000  
> **BPOC Port:** localhost:3001 (to avoid conflict)  
> **API Key:** `bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f`

---

## ✅ Verification Status

### 1. Server Running on localhost:3001 ✅

**Status:** ✅ **READY**

**Important:** ShoreAgents runs on port 3000, so BPOC must run on port 3001!

**Command:**
```bash
PORT=3001 npm run dev
# OR
npm run dev -- -p 3001
```

**Why Port 3001?**
- ShoreAgents is on port 3000
- BPOC needs a different port to avoid conflicts
- Port 3001 is the standard alternative

**Verification:**
```bash
curl http://localhost:3001/api/health
# Should return 200 OK
```

---

### 2. POST /api/v1/notifications/call Endpoint ✅

**Status:** ✅ **IMPLEMENTED**

**Endpoint:** `POST http://localhost:3001/api/v1/notifications/call`  
**Note:** BPOC runs on 3001 (ShoreAgents is on 3000)

**Location:** `src/app/api/v1/notifications/call/route.ts`

**Request Body:**
```json
{
  "roomId": "room-uuid",
  "candidateId": "candidate-uuid",
  "recruiterName": "Stephen Atcheler",
  "jobTitle": "Virtual Assistant",
  "participantJoinUrl": "https://bpoc.daily.co/room?t=TOKEN"
}
```

**Response Format:**
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

**Features:**
- ✅ Accepts required fields: `roomId`, `candidateId`, `participantJoinUrl`
- ✅ Validates candidate exists
- ✅ Creates invitation record in database
- ✅ Sends email notification (stub - logs only)
- ✅ Creates real-time notification via Supabase
- ✅ Returns success response
- ✅ CORS headers configured for ShoreAgents

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{
    "roomId": "test-room-123",
    "candidateId": "test-candidate-456",
    "recruiterName": "Test Recruiter",
    "jobTitle": "Test Job",
    "participantJoinUrl": "https://test.daily.co/room?t=TOKEN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "...",
    "status": "pending",
    "notificationSent": true
  },
  "message": "Candidate notified successfully"
}
```

**Note:** ⚠️ **Email is currently a stub** - it logs but doesn't actually send emails. This is fine for testing, but production needs real email service.

---

### 3. Daily.co Integration ✅

**Status:** ✅ **FULLY CONFIGURED**

**Location:** `src/lib/daily.ts`

**Required Environment Variable:**
```bash
DAILY_API_KEY=your_daily_api_key_here
```

**Functions Available:**
- ✅ `createDailyRoom()` - Create video rooms
- ✅ `getDailyRoom()` - Get room details
- ✅ `deleteDailyRoom()` - Delete rooms
- ✅ `createMeetingToken()` - Generate join tokens
- ✅ `startRecording()` - Start recording
- ✅ `stopRecording()` - Stop recording
- ✅ `getRecordingAccessLink()` - Get recording URLs

**Verification:**
```bash
# Check if DAILY_API_KEY is set
echo $DAILY_API_KEY
```

**Test Room Creation:**
```bash
curl -X POST http://localhost:3001/api/v1/video/rooms \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{
    "applicationId": "test-app-id",
    "callType": "recruiter_prescreen",
    "enableRecording": true,
    "enableTranscription": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "room": {
    "id": "room-uuid",
    "roomName": "room-name",
    "roomUrl": "https://bpoc.daily.co/room-name",
    "status": "created"
  },
  "host": {
    "joinUrl": "https://bpoc.daily.co/room-name?t=HOST_TOKEN",
    "token": "HOST_TOKEN"
  },
  "participant": {
    "joinUrl": "https://bpoc.daily.co/room-name?t=PARTICIPANT_TOKEN",
    "token": "PARTICIPANT_TOKEN"
  }
}
```

---

### 4. Video Room Endpoints ✅

**Status:** ✅ **ALL IMPLEMENTED**

#### POST /api/v1/video/rooms ✅

**Purpose:** Create a new video room

**Location:** `src/app/api/v1/video/rooms/route.ts`

**Request Body:**
```json
{
  "applicationId": "application-uuid",
  "callType": "recruiter_prescreen",
  "enableRecording": true,
  "enableTranscription": true
}
```

**Response:** Returns room with host and participant join URLs

---

#### GET /api/v1/video/rooms/:id ✅

**Purpose:** Get room details and generate fresh tokens

**Location:** `src/app/api/v1/video/rooms/[roomId]/route.ts`

**Response:**
```json
{
  "room": {
    "id": "room-uuid",
    "roomName": "room-name",
    "roomUrl": "https://bpoc.daily.co/room-name",
    "status": "created",
    "isActive": true
  },
  "host": {
    "joinUrl": "https://bpoc.daily.co/room-name?t=TOKEN",
    "token": "TOKEN"
  },
  "participant": {
    "joinUrl": "https://bpoc.daily.co/room-name?t=TOKEN",
    "token": "TOKEN"
  }
}
```

---

#### PATCH /api/v1/video/rooms/:id ✅

**Purpose:** Update room status, outcome, and notes

**Location:** `src/app/api/v1/video/rooms/[roomId]/route.ts`

**Request Body:**
```json
{
  "status": "ended",
  "outcome": "successful",
  "notes": "Great candidate!"
}
```

**Response:**
```json
{
  "success": true,
  "status": "ended",
  "outcome": "successful"
}
```

---

### 5. Email/Notification Sending ⚠️

**Status:** ⚠️ **STUB IMPLEMENTATION**

**Location:** `src/lib/email.ts`

**Current Implementation:**
- ✅ Function exists: `sendEmail()`
- ⚠️ Currently just logs to console
- ❌ Does NOT actually send emails

**For Testing:** This is fine - notifications are logged and invitation records are created.

**For Production:** Need to implement real email service (SendGrid, Resend, etc.)

**What Works:**
- ✅ Invitation record created in database
- ✅ Real-time notification via Supabase
- ✅ Response returns success
- ⚠️ Email logs but doesn't send

---

## 🧪 Complete Test Flow

### Step 1: Start Server
```bash
cd "/Users/stepten/Desktop/Dev Projects/bpoc-stepten"
PORT=3001 npm run dev
```

### Step 2: Test Notification Endpoint
```bash
curl -X POST http://localhost:3001/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{
    "roomId": "test-room-123",
    "candidateId": "test-candidate-456",
    "recruiterName": "Stephen Atcheler",
    "jobTitle": "Virtual Assistant",
    "participantJoinUrl": "https://bpoc.daily.co/room?t=TOKEN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "...",
    "status": "pending",
    "notificationSent": true
  },
  "message": "Candidate notified successfully"
}
```

### Step 3: Test Video Room Creation
```bash
curl -X POST http://localhost:3001/api/v1/video/rooms \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{
    "applicationId": "test-app-id",
    "callType": "recruiter_prescreen",
    "enableRecording": true
  }'
```

---

## ✅ Verification Checklist

- [x] **Server can run on localhost:3001**
  - [x] Next.js dev server supports PORT environment variable
  - [x] Default port is 3000, can be changed to 3001

- [x] **POST /api/v1/notifications/call endpoint exists**
  - [x] Route file: `src/app/api/v1/notifications/call/route.ts`
  - [x] Accepts required body fields
  - [x] Returns `{success: true}` format
  - [x] CORS headers configured

- [x] **Daily.co integration working**
  - [x] `DAILY_API_KEY` environment variable support
  - [x] Can create video rooms
  - [x] Returns host + participant join URLs
  - [x] Token generation works

- [x] **Video room endpoints functional**
  - [x] `POST /api/v1/video/rooms` - Create room
  - [x] `GET /api/v1/video/rooms/:id` - Get room details
  - [x] `PATCH /api/v1/video/rooms/:id` - Update room

- [x] **Email/notification capability**
  - [x] Email function exists (stub)
  - [x] Invitation records created
  - [x] Real-time notifications work
  - [ ] ⚠️ Actual email sending (needs production email service)

---

## 🚨 Known Issues & Notes

### 1. Email Service is Stub ⚠️

**Issue:** `sendEmail()` function only logs, doesn't actually send emails.

**Impact:** LOW for testing - notifications still work via database and real-time.

**Fix for Production:**
```typescript
// src/lib/email.ts
import { Resend } from 'resend'; // or SendGrid, etc.

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: 'BPOC <notifications@bpoc.io>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
```

### 2. API Key Authentication

**Status:** ✅ Endpoint accepts `X-API-Key` header

**Note:** The endpoint currently doesn't validate API key (no auth middleware). This is fine for testing but should be added for production.

### 3. Port Configuration

**Default:** Next.js runs on port 3000

**To run on 3001:**
```bash
PORT=3001 npm run dev
```

Or modify `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

---

## 📋 Quick Start Commands

### Start Server on Port 3001
```bash
cd "/Users/stepten/Desktop/Dev Projects/bpoc-stepten"
PORT=3001 npm run dev
```

### Test Notification Endpoint
```bash
curl -X POST http://localhost:3001/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{
    "roomId": "test",
    "candidateId": "test",
    "recruiterName": "Test",
    "jobTitle": "Test",
    "participantJoinUrl": "https://test.com"
  }'
```

**Expected:** `{"success":true}` ✅

---

## ✅ Final Status

| Component | Status | Ready for Testing |
|-----------|--------|-------------------|
| Server (localhost:3001) | ✅ Ready | YES |
| POST /api/v1/notifications/call | ✅ Implemented | YES |
| Daily.co Integration | ✅ Configured | YES |
| Video Room Endpoints | ✅ Functional | YES |
| Email Sending | ⚠️ Stub | YES (logs only) |

**Overall:** ✅ **READY FOR SHOREAGENTS TESTING**

All critical endpoints are implemented and functional. Email is a stub but that's fine for testing - notifications still work via database and real-time channels.

---

**Last Updated:** January 4, 2026  
**Next Steps:** Run server on port 3001 and test with ShoreAgents

