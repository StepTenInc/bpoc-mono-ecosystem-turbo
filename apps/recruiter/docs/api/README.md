# BPOC Recruiter API v1

Enterprise-grade REST API for integrating with the BPOC recruitment platform.

## Base URL

```
https://recruiter.bpoc.ai/api/v1
```

## Authentication

All API requests require the `X-API-Key` header:

```bash
curl -X GET "https://recruiter.bpoc.ai/api/v1/jobs" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_your_api_key_here"
```

Get your API key from **Settings → API** in your BPOC dashboard.

## Rate Limits

| Tier       | Requests/Hour | Monthly Limit |
|------------|---------------|---------------|
| Free       | 100           | 2,400         |
| Pro        | 1,000         | 24,000        |
| Enterprise | 10,000        | 240,000       |

Rate limit info is returned in response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Input Flexibility

The API accepts both **camelCase** and **snake_case** in request bodies:

```json
// Both are valid:
{ "firstName": "John", "lastName": "Doe" }
{ "first_name": "John", "last_name": "Doe" }
```

## Response Format

All responses use **snake_case** and follow this structure:

**Success:**
```json
{
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "page_size": 50,
    "total_pages": 2
  }
}
```

**Error:**
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid API key |
| `FORBIDDEN` | API access disabled or tier restriction |
| `NOT_FOUND` | Resource does not exist |
| `VALIDATION_ERROR` | Invalid input data |
| `MISSING_REQUIRED_FIELD` | Required field not provided |
| `ALREADY_EXISTS` | Resource already exists (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

# Endpoints

## Candidates

### List Candidates
**Enterprise Only**

```http
GET /api/v1/candidates
```

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name or email |
| skills | string | Comma-separated skills filter |
| hasResume | boolean | Filter by resume presence |
| limit | number | Max 100, default 50 |
| offset | number | Pagination offset |

**Response:**
```json
{
  "candidates": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "headline": "Senior Developer",
      "location": "Manila, PH",
      "experience_years": 5,
      "skills": ["React", "Node.js"],
      "has_resume": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Create Candidate
**Pro+**

```http
POST /api/v1/candidates
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+63 912 345 6789",
  "headline": "Senior Developer",
  "location": "Manila, PH",
  "experience_years": 5,
  "skills": ["React", "Node.js", "TypeScript"],
  "resume_url": "https://example.com/resume.pdf"
}
```

### Get Candidate
**Enterprise Only**

```http
GET /api/v1/candidates/:id
```

### Update Candidate
**Pro+**

```http
PUT /api/v1/candidates/:id
```

---

## Jobs

### List Jobs
**All Tiers**

```http
GET /api/v1/jobs
```

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | `active`, `closed`, `draft`, `all` |
| clientId | string | Filter by client |
| limit | number | Max 100, default 50 |
| offset | number | Pagination offset |

### Create Job
**Pro+**

```http
POST /api/v1/jobs/create
```

**Request Body:**
```json
{
  "client_id": "uuid",
  "title": "Senior React Developer",
  "description": "Full job description...",
  "requirements": ["5+ years React", "Node.js experience"],
  "responsibilities": ["Build features", "Code review"],
  "salary_min": 80000,
  "salary_max": 120000,
  "currency": "PHP",
  "work_arrangement": "hybrid",
  "work_type": "full_time",
  "experience_level": "senior"
}
```

### Get Job
**All Tiers**

```http
GET /api/v1/jobs/:id
```

### Update Job
**Pro+**

```http
PATCH /api/v1/jobs/:id
```

---

## Applications

### Submit Application
**All Tiers**

```http
POST /api/v1/applications
```

**Request Body:**
```json
{
  "job_id": "uuid",
  "candidate": {
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "source": "api"
}
```

### Get Application
**All Tiers**

```http
GET /api/v1/applications/:id
```

### Release to Client
**Pro+**

```http
POST /api/v1/applications/:id/release
```

---

## Interviews

### List Interviews
**Pro+**

```http
GET /api/v1/interviews
```

### Schedule Interview
**Pro+**

```http
POST /api/v1/interviews
```

**Request Body:**
```json
{
  "application_id": "uuid",
  "type": "recruiter_prescreen",
  "scheduledAt": "2024-02-15T10:00:00Z",
  "clientTimezone": "America/New_York",
  "notes": "First round interview",
  "enableVideo": true,
  "enableRecording": true
}
```

Interview Types:
- `recruiter_prescreen`
- `recruiter_round_1`, `recruiter_round_2`, `recruiter_round_3`
- `client_round_1`, `client_round_2`, `client_final`

**Response includes:**
```json
{
  "interview": { ... },
  "hostJoinUrl": "https://daily.co/...",
  "participantJoinUrl": "https://daily.co/...",
  "clientJoinUrl": "https://daily.co/...",
  "videoRoom": {
    "id": "uuid",
    "roomUrl": "https://daily.co/...",
    "recordingEnabled": true
  }
}
```

### Update Interview Outcome
**Pro+**

```http
PATCH /api/v1/interviews
```

**Request Body:**
```json
{
  "interviewId": "uuid",
  "outcome": "passed",
  "rating": 4,
  "feedback": {
    "communication": 4,
    "technicalSkills": 5,
    "cultureFit": 4,
    "overallImpression": "Strong candidate"
  },
  "notes": "Recommend for next round"
}
```

---

## Offers

### List Offers
**Enterprise Only**

```http
GET /api/v1/offers
```

### Create Offer
**Enterprise Only**

```http
POST /api/v1/offers
```

**Request Body:**
```json
{
  "application_id": "uuid",
  "salary": 100000,
  "currency": "PHP",
  "startDate": "2024-03-01",
  "expiresAt": "2024-02-20",
  "benefits": ["Health Insurance", "Stock Options"],
  "message": "We are excited to offer you..."
}
```

### Counter Offer
**Enterprise Only**

```http
POST /api/v1/offers/:id/counter
```

---

## Clients

### List Clients
**All Tiers**

```http
GET /api/v1/clients
```

Returns all clients linked to your agency. Use the `id` field as `client_id` when creating jobs.

---

## Video

### List Rooms
**Pro+**

```http
GET /api/v1/video/rooms
```

### Get Recordings
**Pro+**

```http
GET /api/v1/video/recordings
```

### Get Transcript
**Enterprise Only**

```http
GET /api/v1/video/transcripts/:id
```

---

# Webhooks

BPOC sends webhooks for major events. Configure webhooks in **Settings → API → Webhooks**.

## Events

| Event | Description |
|-------|-------------|
| `application.created` | New application submitted |
| `application.status_changed` | Application status updated |
| `interview.scheduled` | Interview scheduled |
| `interview.completed` | Interview completed with outcome |
| `offer.sent` | Offer sent to candidate |
| `offer.accepted` | Candidate accepted offer |
| `offer.rejected` | Candidate rejected offer |
| `video.recording.ready` | Recording processed and ready |
| `video.transcript.completed` | Transcript generated |
| `placement.created` | Candidate placed |

## Payload Format

```json
{
  "event": "application.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "applicationId": "uuid",
    "jobId": "uuid",
    "candidateId": "uuid",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "jobTitle": "Senior Developer"
  }
}
```

## Signature Verification

All webhooks are signed with HMAC SHA256. The signature is in the `X-Webhook-Signature` header.

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Retry Policy

Failed webhooks are retried with exponential backoff:
1. First retry: 1 minute
2. Second retry: 5 minutes
3. Third retry: 30 minutes

After 3 failed attempts, the delivery is marked as permanently failed.

---

# SDKs & Examples

## JavaScript/Node.js

```javascript
const BPOC = require('@bpoc/api'); // Coming soon

const client = new BPOC({ apiKey: 'bpoc_...' });

// List jobs
const jobs = await client.jobs.list({ status: 'active' });

// Submit application
const app = await client.applications.create({
  jobId: 'uuid',
  candidate: {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

## Python

```python
import requests

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'bpoc_your_api_key'
}

# List jobs
response = requests.get(
    'https://recruiter.bpoc.ai/api/v1/jobs',
    headers=headers
)
jobs = response.json()

# Submit application
response = requests.post(
    'https://recruiter.bpoc.ai/api/v1/applications',
    headers=headers,
    json={
        'job_id': 'uuid',
        'candidate': {
            'email': 'john@example.com',
            'first_name': 'John',
            'last_name': 'Doe'
        }
    }
)
```

---

# Support

- **Documentation:** https://docs.bpoc.ai
- **API Status:** https://status.bpoc.ai
- **Email:** api-support@bpoc.ai
