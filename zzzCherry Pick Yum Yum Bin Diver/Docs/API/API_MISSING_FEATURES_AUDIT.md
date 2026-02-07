# BPOC API - Missing Features Audit

**Date:** December 19, 2024  
**Status:** Current API audit and missing functionality for complete agency/client portal integration

---

## ✅ What Currently Works

### API Infrastructure
- ✅ Versioned API at `/api/v1`
- ✅ API key authentication (`X-API-Key` header)
- ✅ CORS support for external integrations
- ✅ Tier-based access control (Free/Pro/Enterprise)

### Core Recruitment Endpoints
- ✅ Client management (`/clients`, `/clients/get-or-create`)
- ✅ Job management (`/jobs`, `/jobs/create`, `/jobs/:id`)
- ✅ Application management (`/applications`, `/applications/:id`)
- ✅ Interview scheduling (`/interviews`)
- ✅ Offer management (`/offers`)
- ✅ Talent pool search (`/candidates` - Enterprise)

### Video Infrastructure
- ✅ Video room creation (`/video/rooms`)
- ✅ Room management (`/video/rooms/:id`)
- ✅ Recording access (`/video/recordings`)
- ✅ Transcript access (`/video/transcripts/:id`)
- ✅ Call type tracking (screening, technical, client_intro, etc.)
- ✅ Multi-party support (host + participant tokens)

---

## ❌ Critical Missing Features

### 1. API Key Management (Priority: HIGH)

**Problem:** Currently one API key per agency, no scoping or granular control

**What's Missing:**
```typescript
// These endpoints don't exist in /api/v1:

// Multiple keys per agency
POST   /api-keys                    // Create new API key with scopes
GET    /api-keys                    // List all keys for agency
DELETE /api-keys/:id                // Revoke key
PATCH  /api-keys/:id                // Update scopes/name

// Key should support:
{
  name: "Production Key",
  scopes: [
    "clients:read",
    "clients:write",
    "jobs:read",
    "jobs:write",
    "applications:read",
    "video:read",
    "video:write"
  ],
  rateLimit: 120, // per minute
  expiresAt: "2026-12-31T23:59:59Z",
  ipWhitelist: ["1.2.3.4", "5.6.7.8"]
}
```

**Why It's Needed:**
- Clients need separate keys with limited scopes
- Production vs staging keys
- Revoke compromised keys without breaking everything
- Audit trail per key

---

### 2. Webhook System (Priority: HIGH)

**Problem:** No webhook infrastructure exists

**What's Missing:**
```typescript
// Webhook registration
POST   /webhooks
GET    /webhooks
DELETE /webhooks/:id
PATCH  /webhooks/:id

// Webhook should support:
{
  url: "https://agency.com/api/webhooks/bpoc",
  events: [
    "application.created",
    "application.status_changed",
    "interview.scheduled",
    "interview.completed",
    "offer.sent",
    "offer.accepted",
    "video.room.ended",
    "video.recording.ready",
    "video.transcript.completed"
  ],
  secret: "whsec_...", // For signature verification
  active: true
}

// Webhook delivery system needs:
- Signature generation (HMAC SHA256)
- Retry logic (3 attempts with backoff)
- Delivery tracking
- Failed webhook monitoring
```

**Why It's Needed:**
- Real-time updates to agency portals
- No need for constant polling
- Better user experience
- Industry standard

---

### 3. Agency Admin Endpoints (Priority: HIGH)

**Problem:** Admin functions only available in internal `/api/recruiter/*` routes, not in public `/api/v1`

**What's Missing:**
```typescript
// Agency management
GET    /api/v1/agency              // Get agency details
PATCH  /api/v1/agency              // Update settings

// Team management
GET    /api/v1/team                // List team members
POST   /api/v1/team/invite         // Invite recruiter
PATCH  /api/v1/team/:id            // Update role/permissions
DELETE /api/v1/team/:id            // Remove member

// Team invitations
GET    /api/v1/team/invitations    // List pending invites
POST   /api/v1/team/invitations/:id/resend
DELETE /api/v1/team/invitations/:id/revoke

// Client management (beyond get-or-create)
PATCH  /api/v1/clients/:id         // Update client info
DELETE /api/v1/clients/:id         // Archive client

// Usage & billing
GET    /api/v1/usage               // API usage stats
GET    /api/v1/billing             // Current plan & limits
```

**Why It's Needed:**
- Agencies need to manage their team via API
- Client management beyond just linking
- Usage monitoring and quota tracking

---

### 4. Video Multi-Party Join Flow (Priority: MEDIUM)

**Problem:** Current system generates tokens in `/video/rooms` POST response. No secure per-participant join flow.

**What's Missing:**
```typescript
// Secure join endpoint
POST /api/v1/video/rooms/:id/join
{
  role: "host" | "participant" | "observer",
  userId?: "user-uuid"
}

// Returns ONLY the token for requesting party
{
  joinUrl: "https://bpoc.daily.co/...?t=TOKEN_FOR_THIS_USER",
  token: "TOKEN_FOR_THIS_USER",
  role: "host"
}

// Participant management
GET    /api/v1/video/rooms/:id/participants
POST   /api/v1/video/rooms/:id/participants  // Add participant
DELETE /api/v1/video/rooms/:id/participants/:userId

// Invitation system
POST   /api/v1/video/invitations
{
  roomId: "room-uuid",
  email: "candidate@example.com",
  role: "participant",
  sendEmail: true
}
```

**Why It's Needed:**
- More secure than exposing all tokens at once
- Support for client interviewers joining
- Invitation tracking (sent/clicked/joined)

---

### 5. Placements Endpoint (Priority: MEDIUM)

**Problem:** Placement tracking only in internal routes, not in API

**What's Missing:**
```typescript
GET    /api/v1/placements
POST   /api/v1/placements
GET    /api/v1/placements/:id
PATCH  /api/v1/placements/:id

// Placement object:
{
  applicationId: "app-uuid",
  clientId: "client-uuid",
  candidateId: "candidate-uuid",
  jobId: "job-uuid",
  startDate: "2025-02-01",
  salary: 42000,
  currency: "PHP",
  status: "active" | "completed" | "terminated",
  notes: "...",
  recruiterId: "recruiter-uuid" // Who closed the deal
}
```

**Why It's Needed:**
- Complete the hiring pipeline
- Track successful placements
- Commission/performance tracking
- Client reports

---

### 6. Transcription Queue System (Priority: MEDIUM)

**Problem:** `POST /api/v1/video/recordings/:id` has a TODO for async job trigger

**What's Missing:**
```typescript
// Current implementation:
// TODO: Trigger async transcription job

// Needs:
- Background job queue (Bull/BullMQ)
- Worker process for Whisper API calls
- Webhook delivery when complete
- Status polling endpoint

GET /api/v1/video/recordings/:id/transcription-status
{
  status: "pending" | "processing" | "completed" | "failed",
  progress: 45, // percentage
  estimatedCompletion: "2025-01-20T10:15:00Z"
}
```

**Why It's Needed:**
- Transcription is slow (minutes per recording)
- Can't block API response
- Need progress updates

---

### 7. Advanced Application Filtering (Priority: LOW)

**Problem:** Limited filtering options on applications

**What's Missing:**
```typescript
GET /api/v1/applications?
  // Current filters
  clientId=xxx
  job_id=xxx
  status=xxx
  
  // Missing filters
  minScore=80              // AI score threshold
  hasResume=true
  skills=Communication,Excel
  experienceYears=3
  appliedAfter=2025-01-01
  appliedBefore=2025-01-31
```

---

### 8. Bulk Operations (Priority: LOW)

**Problem:** No bulk update endpoints

**What's Missing:**
```typescript
// Bulk update application statuses
PATCH /api/v1/applications/bulk
{
  applicationIds: ["app-1", "app-2", "app-3"],
  status: "rejected",
  notes: "Not meeting requirements"
}

// Bulk job status update
PATCH /api/v1/jobs/bulk
{
  jobIds: ["job-1", "job-2"],
  status: "closed"
}
```

---

### 9. Analytics Endpoints (Priority: LOW)

**Problem:** No analytics via API

**What's Missing:**
```typescript
GET /api/v1/analytics/jobs
GET /api/v1/analytics/applications
GET /api/v1/analytics/interviews
GET /api/v1/analytics/clients

// Returns metrics like:
{
  totalApplications: 150,
  applicationsByStatus: {
    submitted: 50,
    shortlisted: 30,
    hired: 10
  },
  avgTimeToHire: "14 days",
  conversionRate: 6.7,
  topPerformingJobs: [...]
}
```

---

### 10. File Upload Endpoints (Priority: LOW)

**Problem:** No API for resume upload, offer letters, etc.

**What's Missing:**
```typescript
// Upload candidate resume
POST /api/v1/applications/:id/resume
Content-Type: multipart/form-data

// Upload offer letter
POST /api/v1/offers/:id/letter
Content-Type: multipart/form-data

// Upload interview attachments
POST /api/v1/interviews/:id/attachments
```

---

## 🔒 Security Enhancements Needed

### 1. API Key Scopes
Currently all keys have full access. Need scope-based permissions:

```typescript
const scopes = [
  'clients:read',
  'clients:write',
  'jobs:read',
  'jobs:write',
  'applications:read',
  'applications:write',
  'interviews:read',
  'interviews:write',
  'video:read',
  'video:write',
  'offers:read',
  'offers:write',
  'candidates:read',
];
```

### 2. Rate Limiting Per Key
Track usage per individual key, not per agency.

### 3. Audit Logging
Log all API calls for security and debugging:

```typescript
{
  apiKeyId: "key-uuid",
  endpoint: "/api/v1/jobs/create",
  method: "POST",
  statusCode: 201,
  ipAddress: "1.2.3.4",
  userAgent: "...",
  timestamp: "2025-01-20T10:00:00Z"
}
```

---

## 📊 Recommended Implementation Priority

### Phase 1 (Critical - Ship ASAP)
1. **Webhook System** - Enable real-time integrations
2. **API Key Management** - Security & scoping
3. **Agency Admin Endpoints** - Team management via API

### Phase 2 (Important - Ship Soon)
4. **Video Multi-Party Join** - Secure client interviewer flow
5. **Placements Endpoint** - Complete the pipeline
6. **Transcription Queue** - Make Enterprise feature production-ready

### Phase 3 (Nice to Have - Ship Later)
7. **Advanced Filtering** - Better search UX
8. **Bulk Operations** - Efficiency
9. **Analytics** - Insights
10. **File Uploads** - Richer data

---

## 📝 Notes for Implementation

### Database Changes Needed
```sql
-- API keys table (new)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  name TEXT,
  key_hash TEXT UNIQUE,
  key_prefix TEXT, -- For display (bpoc_abc...)
  scopes JSONB,
  rate_limit INTEGER DEFAULT 120,
  ip_whitelist JSONB,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks table (new)
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  url TEXT NOT NULL,
  events TEXT[],
  secret TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries (new)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id),
  event_type TEXT,
  payload JSONB,
  status TEXT, -- pending, sent, failed
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placements table (may already exist)
CREATE TABLE placements (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES job_applications(id),
  start_date DATE,
  salary DECIMAL,
  currency TEXT,
  status TEXT,
  notes TEXT,
  recruiter_id UUID REFERENCES agency_recruiters(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage logs (new)
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id),
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to video_call_rooms (if not exists)
ALTER TABLE video_call_rooms ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);
```

---

## 🎯 Success Metrics

When these features are implemented, agencies will be able to:

✅ Build complete white-label recruitment portals  
✅ Receive real-time updates via webhooks  
✅ Manage teams and clients programmatically  
✅ Conduct multi-party video interviews securely  
✅ Track placements and commissions  
✅ Scale integrations with proper security  

---

**For Questions:** Contact dev team or see [COMPLETE_API_INTEGRATION_GUIDE.md](./COMPLETE_API_INTEGRATION_GUIDE.md)








