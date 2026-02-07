# BPOC Documentation

Welcome to the BPOC platform documentation. Choose your path below:

---

## 📖 Documentation Index

### 🚀 **START HERE: BPOC API Bible**

**[BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)** - **4,332 lines - 100% Complete**

The single source of truth for integrating with BPOC. Includes:
- **5-minute quick start** - Get up and running immediately
- **35 endpoints fully documented** - Request/response schemas, cURL examples
- **10 complete data models** - TypeScript interfaces
- **5 workflow diagrams** - Mermaid diagrams for complete flows
- **Production-ready code** - TypeScript, Python, cURL clients
- **Error handling & troubleshooting** - 6 common errors with solutions
- **GDPR compliance & data policies** - Data retention, export, deletion
- **3 appendices** - Quick reference card, endpoint index, DB schema

**👉 [Quick Start Guide](./README_API_BIBLE.md)** | **[API Reference](./BPOC_API_REFERENCE.md)**

---

## 📚 Supporting Documentation

### API Reference & Patterns

- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)**  
  Code snippets, common patterns, quick lookup (points to API Bible)

- **[BPOC_API_REFERENCE.md](./BPOC_API_REFERENCE.md)**  
  Canonical endpoint list (35 endpoints organized by category)

### Technical & Planning

- **[API_MISSING_FEATURES_AUDIT.md](./API_MISSING_FEATURES_AUDIT.md)**  
  Gap analysis, what's missing, implementation priorities, database changes

- **[API_DOCUMENTATION_SUMMARY.md](./API_DOCUMENTATION_SUMMARY.md)**  
  Executive summary of what's built, what works, what's missing

### System Architecture

- **[VIDEO_INTERVIEW_SYSTEM.md](./VIDEO_INTERVIEW_SYSTEM.md)**  
  Technical details on video infrastructure, Daily.co integration, database schema

- **[AI_INSIGHTS_SYSTEM_ARCHITECTURE.md](./AI_INSIGHTS_SYSTEM_ARCHITECTURE.md)**  
  AI-powered insights system architecture and implementation

### Testing & Operations

- **[ADMIN_USER_TESTING.md](./ADMIN_USER_TESTING.md)**  
  Test scenarios and workflows for admin panel functionality

### Legacy Documentation

- **[OLD_API_DOCS_CLEANUP_PLAN.md](./OLD_API_DOCS_CLEANUP_PLAN.md)**  
  Analysis of archived API docs (9 files moved to `_CLEANUP_ARCHIVE/old-api-docs/`)

**Note:** All legacy API docs have been superseded by [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)

---

```
┌──────────────────────────────────────────────────────────────┐
│                    WHAT YOU CAN BUILD                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  🏢 ADMIN PORTAL                                             │
│     • Manage multiple clients                                │
│     • Team management & permissions                          │
│     • Analytics & reporting                                  │
│     • Talent pool access (Enterprise)                        │
│                                                               │
│  👥 CLIENT PORTALS                                           │
│     • Job posting interface                                  │
│     • Application review                                     │
│     • Video interviews (BPOC-hosted)                         │
│     • Offer management                                       │
│     • Candidate assessments                                  │
│                                                               │
│  📹 VIDEO INFRASTRUCTURE                                     │
│     • No setup required - BPOC hosts everything              │
│     • Screening, technical, client intro calls               │
│     • Cloud recording                                        │
│     • AI transcription (Enterprise)                          │
│                                                               │
│  🎯 COMPLETE WORKFLOW                                        │
│     Job Post → Applications → Interviews → Offers → Hire     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**📖 Read:** [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)

---

## 📚 Additional Documentation

### For Developers

- **[BPOC API Bible](./BPOC_API_BIBLE.md)**  
  Complete API documentation (4,332 lines) - single source of truth

- **[API Quick Reference](./API_QUICK_REFERENCE.md)**  
  Code snippets, common patterns, quick lookup

- **[API Reference](./BPOC_API_REFERENCE.md)**  
  Canonical endpoint list (35 endpoints)

### For Administrators

- **[Admin User Testing Guide](./ADMIN_USER_TESTING.md)**  
  Test scenarios and workflows for admin panel functionality

### System Architecture & Technical

- **[API Missing Features Audit](./API_MISSING_FEATURES_AUDIT.md)**  
  Comprehensive audit of what's missing from the API and implementation priorities

- **[Video Interview System](./VIDEO_INTERVIEW_SYSTEM.md)**  
  Technical details on BPOC's video infrastructure, database schema, and Daily.co integration

- **[AI Insights System](./AI_INSIGHTS_SYSTEM_ARCHITECTURE.md)**  
  Architecture and implementation of the AI-powered insights system

### Legacy Guides

- **[OLD_API_DOCS_CLEANUP_PLAN.md](./OLD_API_DOCS_CLEANUP_PLAN.md)**  
  Documentation cleanup analysis (9 legacy docs archived)

**Note:** Legacy API docs have been superseded by [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)

---

## 🔑 Quick Access

### Get Your API Key
1. Log into BPOC Recruiter Dashboard
2. Navigate to **Settings → API Keys** or `/recruiter/api`
3. Click **"Generate API Key"** (owner/admin only)
4. Copy and store securely

### Base URL
```
https://bpoc.io/api/v1
```

### Authentication Header
```
X-API-Key: your-api-key-here
```

---

## 💡 Integration Examples

### Example 1: Client Posts a Job

```typescript
// 1. Link your client to BPOC (do this once)
const client = await bpocApi('/clients/get-or-create', {
  method: 'POST',
  body: JSON.stringify({
    name: "Acme Corp",
    email: "hr@acme.com"
  })
});

// Store client.clientId in your database

// 2. Create job on behalf of client
const job = await bpocApi('/jobs/create', {
  method: 'POST',
  body: JSON.stringify({
    clientId: client.clientId,
    title: "Virtual Assistant",
    description: "Looking for an experienced VA...",
    salaryMin: 30000,
    salaryMax: 45000,
    workArrangement: "remote"
  })
});

// Job is now live on BPOC platform
// Applications will come through the API
```

### Example 2: Client Conducts Video Interview

```typescript
// 1. Create video room for interview
const room = await bpocApi('/video/rooms', {
  method: 'POST',
  body: JSON.stringify({
    applicationId: "app-uuid",
    callType: "screening",
    scheduledFor: "2025-01-20T10:00:00Z"
  })
});

// 2. Send join links
// Client joins via: room.host.joinUrl
// Candidate joins via: room.participant.joinUrl

// 3. After interview, update outcome
await bpocApi(`/video/rooms/${room.room.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    status: "ended",
    outcome: "successful",
    notes: "Great candidate!"
  })
});

// Recording is automatically saved and accessible via API
```

### Example 3: Send Job Offer

```typescript
// Client sends offer through your portal
const offer = await bpocApi('/offers', {
  method: 'POST',
  body: JSON.stringify({
    applicationId: "app-uuid",
    salary: 42000,
    currency: "PHP",
    startDate: "2025-02-01",
    benefits: ["HMO", "13th month", "WFH"],
    message: "We're pleased to offer you..."
  })
});

// Candidate receives offer via BPOC platform
// Accept/decline status tracked automatically
```

---

## 🎯 API Capabilities by Tier

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| View jobs & applications | ✅ | ✅ | ✅ |
| Create jobs via API | ❌ | ✅ | ✅ |
| Video interviews | ❌ | ✅ | ✅ |
| Interview scheduling | ❌ | ✅ | ✅ |
| Cloud recording | ❌ | ✅ | ✅ |
| Talent pool access | ❌ | ❌ | ✅ |
| AI transcription | ❌ | ❌ | ✅ |
| Offer management | ❌ | ❌ | ✅ |
| Webhooks | ❌ | ❌ | ✅ |
| Custom integrations | ❌ | ❌ | ✅ |

---

## 📞 Support

- **Email:** support@bpoc.io
- **API Dashboard:** `/recruiter/api` on BPOC platform
- **Developer Portal:** `/developer/docs`
- **Status Page:** status.bpoc.io

---

## 🚦 Getting Started Checklist

Setting up your integration? Follow this checklist:

- [ ] **Read** the [BPOC API Bible](./BPOC_API_BIBLE.md) (start with Section 1-2)
- [ ] **Quick Start** - Follow the [5-minute guide](./BPOC_API_BIBLE.md#13-quick-start-5-minutes)
- [ ] **Generate** your API key from `/recruiter/api`
- [ ] **Store** API key securely in environment variables
- [ ] **Create** API client utility (see [Section 12](./BPOC_API_BIBLE.md#12-code-examples))
- [ ] **Test** connection with `/clients` endpoint
- [ ] **Link** your first client with `/clients/get-or-create`
- [ ] **Create** a test job with `/jobs/create`
- [ ] **Test** video call creation with `/video/rooms`
- [ ] **Implement** error handling and retries (see [Section 10](./BPOC_API_BIBLE.md#10-error-handling))
- [ ] **Review** GDPR compliance (see [Section 14](./BPOC_API_BIBLE.md#14-compliance--data))
- [ ] **Go live** with your integration!

---

## 📋 All Available Endpoints

### Clients
- `GET /clients` - List clients
- `POST /clients/get-or-create` - Link client

### Jobs
- `GET /jobs` - List jobs
- `GET /jobs/:id` - Get job details
- `POST /jobs/create` - Create job (Pro+)
- `PATCH /jobs/:id` - Update job

### Applications
- `GET /applications` - List applications
- `GET /applications/:id` - Get application details
- `POST /applications` - Submit application
- `PATCH /applications/:id` - Update status

### Interviews
- `GET /interviews` - List interviews (Pro+)
- `POST /interviews` - Schedule interview
- `PATCH /interviews` - Update outcome

### Video (Pro+)
- `GET /video/rooms` - List video rooms
- `POST /video/rooms` - Create video room
- `GET /video/rooms/:id` - Get room + fresh tokens
- `PATCH /video/rooms/:id` - Update outcome
- `DELETE /video/rooms/:id` - Delete room
- `GET /video/recordings` - List recordings
- `GET /video/recordings/:id` - Get recording + download link
- `POST /video/recordings/:id` - Trigger transcription (Enterprise)
- `GET /video/transcripts/:id` - Get transcript (Enterprise)

### Offers (Enterprise)
- `GET /offers` - List offers
- `POST /offers` - Send offer

### Talent Pool (Enterprise)
- `GET /candidates` - Search candidates

### Embed (Public)
- `GET /embed/jobs?agency=slug` - Embeddable job widget

---

**Ready to build? Start with the [BPOC API Bible](./BPOC_API_BIBLE.md)** 🚀







