# BPOC API Audit: Offers & Counter Offers

**Date:** 2026-01-08
**Purpose:** Identify missing endpoints for offer and counter-offer functionality in the v1 API

---

## Executive Summary

**Key Findings:**
1. **v1 API has BASIC offer endpoints** (GET, POST) and now has **counter-offer endpoints**
2. **Internal APIs** (`/api/candidate/offers` and `/api/recruiter/offers`) have FULL counter-offer functionality
3. **Status:** Counter-offer negotiation workflow is now available in the public v1 API (Enterprise only)
4. **Impact:** External integrations (ShoreAgents, etc.) can manage counter offers via API

---

## 1. Existing v1 API Endpoints (Complete List)

### Offers (Basic - INCOMPLETE)
- **GET** `/api/v1/offers` - List job offers
- **POST** `/api/v1/offers` - Create a new offer

### Counter Offers (Enterprise - NEW)
- **GET** `/api/v1/offers/:offerId/counter` - List counter offers for an offer
- **POST** `/api/v1/offers/:offerId/counter/accept` - Accept a counter offer
- **POST** `/api/v1/offers/:offerId/counter/reject` - Reject a counter offer (optionally send revised counter)

### Applications
- **GET** `/api/v1/applications` - List applications
- **POST** `/api/v1/applications` - Create application (candidate applies)
- **GET** `/api/v1/applications/:id` - Get application details
- **PATCH** `/api/v1/applications/:id` - Update application status
- **POST** `/api/v1/applications/:id/release` - Release candidate to client
- **POST** `/api/v1/applications/:id/send-back` - Send back for revision
- **POST** `/api/v1/applications/invite` - Invite candidate to apply

### Application Card (Lifecycle Management)
- **GET** `/api/v1/applications/:id/card` - Get complete application lifecycle data
- **GET** `/api/v1/applications/:id/card/timeline` - Get activity timeline
- **POST** `/api/v1/applications/:id/card/timeline` - Add timeline event
- **PATCH** `/api/v1/applications/:id/card/client-feedback` - Update client feedback
- **PATCH** `/api/v1/applications/:id/card/hired` - Mark as hired/started
- **PATCH** `/api/v1/applications/:id/card/prescreen` - Update prescreen results
- **POST** `/api/v1/applications/:id/card/reject` - Reject application

### Interviews
- **GET** `/api/v1/interviews` - List interviews
- **POST** `/api/v1/interviews` - Schedule interview
- **PATCH** `/api/v1/interviews` - Update interview outcome

### Video Calls
- **GET** `/api/v1/video/rooms` - List video rooms
- **POST** `/api/v1/video/rooms` - Create video room
- **GET** `/api/v1/video/rooms/:roomId` - Get room details
- **PATCH** `/api/v1/video/rooms/:roomId` - Update room status
- **DELETE** `/api/v1/video/rooms/:roomId` - Delete room
- **POST** `/api/v1/video/invitations/:id/accept` - Accept invitation
- **POST** `/api/v1/video/invitations/:id/decline` - Decline invitation

### Video Recordings & Transcripts
- **GET** `/api/v1/video/recordings` - List recordings
- **GET** `/api/v1/video/recordings/:recordingId` - Get recording details
- **POST** `/api/v1/video/recordings/:recordingId` - Trigger transcription
- **GET** `/api/v1/video/transcripts/:transcriptId` - Get transcript

### Jobs
- **GET** `/api/v1/jobs` - List jobs
- **POST** `/api/v1/jobs/create` - Create job
- **GET** `/api/v1/jobs/:id` - Get job details
- **PATCH** `/api/v1/jobs/:id` - Update job
- **GET** `/api/v1/embed/jobs` - Get embeddable jobs (public)

### Clients
- **GET** `/api/v1/clients` - List clients
- **POST** `/api/v1/clients/get-or-create` - Get or create client

### Candidates
- **GET** `/api/v1/candidates` - List candidates
- **GET** `/api/v1/candidates/:id/complete` - Get complete candidate profile

### Notifications
- **POST** `/api/v1/notifications/call` - Send call notification

---

## 2. Internal Offer/Counter-Offer Endpoints (NOT in v1)

### Candidate Offers (`/api/candidate/offers`)
- **GET** `/api/candidate/offers` - Get candidate's offers (with counter offers)
- **PATCH** `/api/candidate/offers` - Accept/reject an offer
- **POST** `/api/candidate/offers/:id/counter` - Submit counter offer
- **GET** `/api/candidate/offers/:id/counter` - Get counter offer history
- **POST** `/api/candidate/offers/counter` - Alternative counter offer endpoint

### Recruiter Offers (`/api/recruiter/offers`)
- **GET** `/api/recruiter/offers` - Get agency's offers
- **POST** `/api/recruiter/offers` - Create offer
- **GET** `/api/recruiter/offers/:id/counter` - View counter offers
- **POST** `/api/recruiter/offers/:id/counter/accept` - Accept counter offer
- **POST** `/api/recruiter/offers/:id/counter/reject` - Reject counter (optionally send new counter)

---

## 3. Missing v1 API Endpoints (CRITICAL GAPS)

### Offer Management (Missing)
- **GET** `/api/v1/offers/:id` - Get single offer details
- **PATCH** `/api/v1/offers/:id` - Update offer (status, salary, terms)
- **DELETE** `/api/v1/offers/:id` - Withdraw offer

### Counter Offer Workflow (COMPLETELY MISSING)
- **POST** `/api/v1/offers/:id/counter` - Submit counter offer (candidate side)
- **GET** `/api/v1/offers/:id/counter` - Get counter offer history
- **GET** `/api/v1/offers/:id/counter/:counterId` - Get specific counter offer
- **POST** `/api/v1/offers/:id/counter/:counterId/accept` - Accept counter offer (employer side)
- **POST** `/api/v1/offers/:id/counter/:counterId/reject` - Reject counter offer
- **POST** `/api/v1/offers/:id/counter/:counterId/revise` - Send revised counter offer (employer -> candidate)

### Offer Actions (Missing)
- **POST** `/api/v1/offers/:id/accept` - Accept offer (candidate)
- **POST** `/api/v1/offers/:id/reject` - Reject offer (candidate)
- **POST** `/api/v1/offers/:id/withdraw` - Withdraw offer (employer)
- **POST** `/api/v1/offers/:id/extend` - Extend offer expiration

---

## 4. Documentation vs Reality

### What's Documented in API_QUICK_REFERENCE.md

**Offers Section:**
```typescript
// Send Offer
const offer = await bpocApi('/offers', {
  method: 'POST',
  body: JSON.stringify({
    applicationId: appId,
    salary: 42000,
    currency: "PHP",
    startDate: "2025-02-01",
    benefits: ["HMO", "13th month"]
  })
});
```

**What's Missing from Documentation:**
- How to list offers (GET /offers is implemented but not documented)
- How to get a single offer
- How to update an offer
- **ENTIRE counter-offer workflow**
- How candidate accepts/rejects offers
- How employer responds to counters
- Offer status management

---

## 5. Counter-Offer Workflow Analysis

### Current Internal Implementation (NOT exposed via v1)

**Database Schema (inferred from code):**
```typescript
// job_offers table
{
  id: string;
  application_id: string;
  salary_offered: number;
  currency: string;
  salary_type: 'monthly' | 'annual' | 'hourly';
  start_date: string;
  benefits_offered: string[];
  additional_terms: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'negotiating' | 'expired' | 'withdrawn';
  sent_at: string;
  viewed_at: string;
  responded_at: string;
  expires_at: string;
  candidate_response: string;
  rejection_reason: string;
  created_by: string;
}

// counter_offers table
{
  id: string;
  offer_id: string;
  requested_salary: number;
  requested_currency: string;
  candidate_message: string;
  employer_response_message: string;
  employer_response_salary: number;
  response_type: 'accepted' | 'rejected' | 'counter';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at: string;
}
```

### Workflow States

**Offer Lifecycle:**
1. `draft` → Offer being prepared
2. `sent` → Offer sent to candidate (triggers notification)
3. `viewed` → Candidate opened/viewed offer
4. `negotiating` → Counter offer submitted (or employer sent revised offer)
5. `accepted` → Candidate accepted (or counter accepted by employer)
6. `rejected` → Candidate rejected (or counter rejected by employer)
7. `expired` → Offer expired before response
8. `withdrawn` → Employer withdrew offer

**Counter Offer Lifecycle:**
1. Candidate submits counter → `counter_offers.status = 'pending'`, `job_offers.status = 'negotiating'`
2. Employer accepts counter → `counter_offers.status = 'accepted'`, `job_offers.status = 'accepted'`, `job_offers.salary_offered` updated
3. Employer rejects counter → `counter_offers.status = 'rejected'`, `job_offers.status = 'sent'` (reverted)
4. Employer sends new counter → New `counter_offers` row created with `employer_response_salary`

---

## 6. Recommendations

### Priority 1: CRITICAL (Blocking ShoreAgents Integration)

**Add Counter-Offer Endpoints to v1:**
```typescript
// Candidate-side
POST   /api/v1/offers/:id/counter           // Submit counter offer
GET    /api/v1/offers/:id/counter           // List counter history
POST   /api/v1/offers/:id/accept            // Accept offer
POST   /api/v1/offers/:id/reject            // Reject offer

// Employer-side
GET    /api/v1/offers/:id                   // Get offer details
PATCH  /api/v1/offers/:id                   // Update offer
POST   /api/v1/offers/:id/counter/accept    // Accept counter
POST   /api/v1/offers/:id/counter/reject    // Reject counter (with optional new counter)
POST   /api/v1/offers/:id/withdraw          // Withdraw offer
```

### Priority 2: HIGH (Improve Developer Experience)

**Enhance Existing Endpoints:**
- Add `?include=counters` to `GET /api/v1/offers` to include counter history
- Add `?include=offers` to `GET /api/v1/applications/:id` to include offer data
- Return offer data in `POST /api/v1/offers` response (already done)

**Add to Documentation:**
- Complete offer workflow examples
- Counter-offer negotiation flow
- Status transitions and valid states
- Webhook events for offer/counter updates

### Priority 3: MEDIUM (Nice to Have)

**Advanced Features:**
- `POST /api/v1/offers/:id/extend` - Extend offer expiration
- `GET /api/v1/offers/:id/history` - Full audit trail
- Bulk operations for offers
- Offer templates

---

## 7. API Design Proposal

### GET /api/v1/offers/:id

**Response:**
```json
{
  "offer": {
    "id": "offer_123",
    "applicationId": "app_456",
    "jobTitle": "Virtual Assistant",
    "candidate": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "salaryOffered": 42000,
    "currency": "PHP",
    "salaryType": "monthly",
    "startDate": "2025-02-01",
    "benefits": ["HMO", "13th month pay"],
    "additionalTerms": "Remote work allowed",
    "status": "negotiating",
    "sentAt": "2025-01-15T10:00:00Z",
    "viewedAt": "2025-01-15T14:30:00Z",
    "respondedAt": "2025-01-16T09:00:00Z",
    "expiresAt": "2025-01-30T23:59:59Z",
    "createdAt": "2025-01-15T09:00:00Z"
  },
  "counterOffers": [
    {
      "id": "counter_789",
      "requestedSalary": 48000,
      "requestedCurrency": "PHP",
      "candidateMessage": "I was hoping for a higher salary based on my experience",
      "status": "pending",
      "createdAt": "2025-01-16T09:00:00Z"
    }
  ]
}
```

### POST /api/v1/offers/:id/counter

**Request:**
```json
{
  "requestedSalary": 48000,
  "requestedCurrency": "PHP",
  "candidateMessage": "I was hoping for a higher salary based on my experience"
}
```

**Response:**
```json
{
  "success": true,
  "counterOffer": {
    "id": "counter_789",
    "offerId": "offer_123",
    "requestedSalary": 48000,
    "requestedCurrency": "PHP",
    "candidateMessage": "I was hoping for a higher salary based on my experience",
    "status": "pending",
    "createdAt": "2025-01-16T09:00:00Z"
  },
  "message": "Counter offer submitted successfully. The employer will be notified."
}
```

### POST /api/v1/offers/:id/counter/accept

**Request:**
```json
{
  "counterOfferId": "counter_789",
  "employerMessage": "We're happy to accept your counter offer. Welcome to the team!"
}
```

**Response:**
```json
{
  "success": true,
  "offer": {
    "id": "offer_123",
    "salaryOffered": 48000,
    "status": "accepted",
    "respondedAt": "2025-01-17T10:00:00Z"
  },
  "application": {
    "id": "app_456",
    "status": "hired"
  },
  "message": "Counter offer accepted. Candidate has been notified."
}
```

### POST /api/v1/offers/:id/counter/reject

**Request:**
```json
{
  "counterOfferId": "counter_789",
  "employerMessage": "We can't go that high, but we can offer 45000 PHP",
  "sendNewCounter": true,
  "revisedSalary": 45000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Counter offer sent to candidate",
  "counterOffer": {
    "id": "counter_890",
    "offerId": "offer_123",
    "requestedSalary": 45000,
    "employerMessage": "We can't go that high, but we can offer 45000 PHP",
    "status": "pending",
    "createdAt": "2025-01-17T11:00:00Z"
  }
}
```

---

## 8. Migration Path

### Phase 1: Expose Existing Internal Endpoints to v1
1. Copy `/api/recruiter/offers/:id/counter/*` logic to `/api/v1/offers/:id/counter/*`
2. Copy `/api/candidate/offers/:id/counter` logic to `/api/v1/offers/:id/counter`
3. Add proper API key validation and tier gating (Enterprise plan required)
4. Add CORS support

### Phase 2: Add Missing Offer Management
1. Add `GET /api/v1/offers/:id`
2. Add `PATCH /api/v1/offers/:id`
3. Add `POST /api/v1/offers/:id/accept`
4. Add `POST /api/v1/offers/:id/reject`
5. Add `POST /api/v1/offers/:id/withdraw`

### Phase 3: Documentation & Testing
1. Update `API_QUICK_REFERENCE.md` with complete offer workflow
2. Update `COMPLETE_API_INTEGRATION_GUIDE.md` with counter-offer examples
3. Add to testing checklist
4. Create Postman collection for offer/counter workflows

### Phase 4: Webhooks (Optional)
1. Add webhook events:
   - `offer.sent`
   - `offer.viewed`
   - `offer.accepted`
   - `offer.rejected`
   - `offer.counter.submitted`
   - `offer.counter.accepted`
   - `offer.counter.rejected`

---

## 9. Security Considerations

### Authentication & Authorization
- **Candidate endpoints**: Require Bearer token (candidate must own the application)
- **Employer endpoints**: Require API key (agency must own the job)
- **Counter-offer access**: Verify offer belongs to authenticated user/agency

### Rate Limiting
- Counter-offer endpoints: Max 10 requests per offer per hour (prevent spam negotiations)
- Offer creation: Max 50 offers per day per agency

### Validation
- Salary amounts: Must be positive, reasonable (configurable max)
- Counter-offer messages: Max 500 characters
- Expiration dates: Must be in future, max 90 days out

---

## 10. Next Steps

### Immediate Actions
1. **Create v1 counter-offer endpoints** (copy internal logic, add API key auth)
2. **Update API documentation** with complete offer/counter workflow
3. **Add to API testing suite**

### Short Term (1-2 weeks)
4. **Add missing offer management endpoints** (GET, PATCH, withdraw)
5. **Create Postman collection** for ShoreAgents testing
6. **Update API_MISSING_FEATURES_AUDIT.md** when complete

### Long Term (1+ month)
7. **Implement offer webhooks** for real-time updates
8. **Add offer analytics endpoints** (acceptance rate, avg negotiation time, etc.)
9. **Create offer template system** for faster offer creation

---

## Appendix: Code References

### Existing Internal Implementations
- **Candidate offers**: `/src/app/api/candidate/offers/route.ts`
- **Candidate counter**: `/src/app/api/candidate/offers/[id]/counter/route.ts`
- **Candidate counter (alt)**: `/src/app/api/candidate/offers/counter/route.ts`
- **Recruiter offers**: `/src/app/api/recruiter/offers/route.ts`
- **Recruiter counter view**: `/src/app/api/recruiter/offers/[id]/counter/route.ts`
- **Recruiter counter accept**: `/src/app/api/recruiter/offers/[id]/counter/accept/route.ts`
- **Recruiter counter reject**: `/src/app/api/recruiter/offers/[id]/counter/reject/route.ts`

### v1 Implementation
- **v1 offers**: `/src/app/api/v1/offers/route.ts` (GET, POST only)

---

**END OF AUDIT**
