# Clark's BPOC API Integration Guide

## 🎯 The Setup

```
┌─────────────────────────────────────────────────────────────┐
│                     Stephen (Middle)                         │
│                   Watching both screens                      │
├─────────────────────────┬───────────────────────────────────┤
│   Pinky (Left Screen)   │     Clark (Right Screen)          │
│   Test Platform         │     ShoreAgents Platform          │
│   localhost:3001        │     ShoreAgents.com               │
│   See results live      │     Makes API calls               │
└─────────────────────────┴───────────────────────────────────┘
```

## 🚀 What We're Building

ShoreAgents.com/ai → BPOC API → Full recruitment flow

**The Flow:**
1. Client signs up on ShoreAgents.ai (lead gen) OR ShoreAgents.com (direct)
2. ShoreAgents creates client in BPOC via API
3. Client posts jobs via ShoreAgents UI → BPOC API
4. Candidates apply → BPOC handles applications
5. Interviews scheduled → BPOC video integration
6. Offers sent → BPOC contract management
7. Placement completed → Everyone gets paid

## 🔑 Getting Started

### 1. Get Your API Key

```bash
# Pinky's test recruiter portal:
http://localhost:3001/settings/api

# Production (when ready):
https://bpoc.io/recruiter/settings/api
```

### 2. Base URL

```
# Pinky's test server:
http://localhost:3001/api/v1

# Production:
https://bpoc.io/api/v1
```

### 3. Authentication

Every request needs the API key header:
```
X-API-Key: bpoc_xxxxxxxxxxxx
```

## 📡 The API Flow

### Step 1: Create/Get Client

When a new client signs up on ShoreAgents:

```javascript
// POST /api/v1/clients/get-or-create
const response = await fetch('http://localhost:3001/api/v1/clients/get-or-create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    name: 'Acme Corp',
    email: 'hr@acmecorp.com',
    // Optional:
    phone: '+1234567890',
    website: 'https://acmecorp.com',
    industry: 'Technology'
  })
});

// Response:
{
  "clientId": "uuid-here",
  "created": true,  // false if already existed
  "client": { ... }
}
```

### Step 2: Create Job

```javascript
// POST /api/v1/jobs/create
const job = await fetch('http://localhost:3001/api/v1/jobs/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    clientId: 'client-uuid',
    title: 'Customer Service Representative',
    description: 'Handle customer inquiries...',
    requirements: ['English proficient', '1+ year experience'],
    salaryMin: 25000,
    salaryMax: 35000,
    currency: 'PHP',
    employmentType: 'full_time',  // full_time, part_time, contract
    workSetup: 'remote',         // office, remote, hybrid
    shift: 'night',              // day, night, both
    location: 'Philippines'
  })
});
```

### Step 3: List Applications

```javascript
// GET /api/v1/applications?jobId=xxx&status=submitted
const applications = await fetch(
  'http://localhost:3001/api/v1/applications?jobId=job-uuid',
  {
    headers: { 'X-API-Key': 'your_api_key' }
  }
);
```

### Step 4: Schedule Interview

```javascript
// POST /api/v1/video/rooms
const interview = await fetch('http://localhost:3001/api/v1/video/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    applicationId: 'application-uuid',
    scheduledAt: '2024-02-15T14:00:00Z',
    duration: 30  // minutes
  })
});
```

### Step 5: Create Offer

```javascript
// POST /api/v1/offers
const offer = await fetch('http://localhost:3001/api/v1/offers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    applicationId: 'application-uuid',
    salary: 30000,
    currency: 'PHP',
    startDate: '2024-03-01',
    benefits: ['HMO', '13th month', 'Performance bonus'],
    expiresAt: '2024-02-20T23:59:59Z'
  })
});
```

## 🔔 Webhooks

Set up webhooks to get notified when things happen:

```javascript
// POST /api/v1/webhooks (internal endpoint for setup)
// Or use the UI: http://localhost:3001/settings/api?tab=webhooks
```

**Events you'll receive:**
- `application.received` - New application submitted
- `application.shortlisted` - Application moved to shortlist
- `interview.scheduled` - Interview booked
- `interview.completed` - Interview finished
- `offer.sent` - Offer sent to candidate
- `offer.accepted` - Candidate accepted!
- `offer.declined` - Candidate said no
- `placement.completed` - They started work

**Webhook payload example:**
```json
{
  "event": "application.received",
  "timestamp": "2024-02-10T10:30:00Z",
  "data": {
    "applicationId": "uuid",
    "candidateId": "uuid",
    "jobId": "uuid",
    "clientId": "uuid"
  }
}
```

**Verify webhook signatures:**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expected}`;
}
```

## 🧪 Testing the Integration

### On Pinky's Machine (Test Platform)

Pinky is running the BPOC recruiter at `localhost:3001`. You can:
1. See jobs appear in real-time
2. Watch applications come through
3. Monitor the pipeline
4. Check offers/placements

### From Clark's Machine (ShoreAgents)

1. Hit the API endpoints above
2. Watch Pinky's screen for results
3. Check the response for success/errors

### Test Sequence

1. **Create a test client** → See it appear in Pinky's Clients tab
2. **Post a job** → See it in Pinky's Jobs list
3. **Trigger a test webhook** → Check Pinky's logs
4. **Create an offer** → See it in Pinky's Offers

## 📊 API Tester

Use the built-in tester to verify endpoints work:
```
http://localhost:3001/settings/api?tab=test
```

Click "Test Now" on any endpoint → See green ✅ = working

## 🏷️ New Client vs Existing Client

From BPOC's perspective, we don't care if they came from:
- ShoreAgents.ai (lead gen)
- ShoreAgents.com (direct signup)

**Optional:** Pass a `source` field when creating clients:
```javascript
{
  name: 'Acme Corp',
  email: 'hr@acme.com',
  metadata: {
    source: 'shoreagents_ai',  // or 'shoreagents_com'
    leadScore: 85,
    campaign: 'feb_2024'
  }
}
```

This shows up in BPOC's admin panel so you can track origins.

## 🛠️ Troubleshooting

**401 Unauthorized**
- Check API key is correct
- Check header is `X-API-Key` (case-sensitive)

**403 Forbidden**
- Endpoint requires higher tier (Pro/Enterprise)
- Check your agency's plan

**404 Not Found**
- Check the ID exists
- Check the entity belongs to your agency

**429 Too Many Requests**
- Rate limited - wait and retry
- Check `X-RateLimit-*` headers

## 📞 Questions?

Ping Pinky in the group chat. I can see both screens and help debug in real-time.

---

**Let's make this smooth as fuck.** 🚀
