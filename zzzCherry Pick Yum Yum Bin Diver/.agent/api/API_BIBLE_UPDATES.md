# API Bible Updates - January 2026

## Critical Changes Implemented

### 1. Field Naming Standardization (BREAKING CHANGE)

**All API responses now use consistent camelCase formatting**

Previously, field names were inconsistent (mixing snake_case and camelCase). As of this update:

- **API Input**: Accepts BOTH camelCase AND snake_case
- **API Output**: ALWAYS returns camelCase
- **Database**: Uses snake_case (internal only)

#### Migration Guide for Existing Integrations

**Before:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-01"
}
```

**After:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-01"
}
```

**Your code needs to:**
1. Update response parsers to expect camelCase fields
2. Optionally update your requests to use camelCase (snake_case still accepted)

### 2. New Endpoints Added

#### POST /api/v1/candidates
Create a new candidate directly in the talent pool.

**Request:**
```bash
curl -X POST "https://bpoc.io/api/v1/candidates" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+63 912 345 6789",
    "headline": "Virtual Assistant",
    "location": "Manila, Philippines",
    "experienceYears": 3,
    "skills": ["Customer Support", "Data Entry", "Zendesk"]
  }'
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+63 912 345 6789",
  "avatarUrl": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /api/v1/candidates/:id
Update an existing candidate.

**Request:**
```bash
curl -X PUT "https://bpoc.io/api/v1/candidates/CANDIDATE_ID" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Senior Virtual Assistant",
    "experienceYears": 5,
    "skills": ["Customer Support", "Data Entry", "Zendesk", "Salesforce"]
  }'
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+63 912 345 6789",
  "avatarUrl": null,
  "headline": "Senior Virtual Assistant",
  "location": "Manila, Philippines",
  "experienceYears": 5,
  "bio": null,
  "skills": ["Customer Support", "Data Entry", "Zendesk", "Salesforce"],
  "resumeUrl": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

#### GET /api/v1/candidates/:id
Get details for a specific candidate.

**Request:**
```bash
curl -X GET "https://bpoc.io/api/v1/candidates/CANDIDATE_ID" \
  -H "X-API-Key: YOUR_KEY"
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+63 912 345 6789",
  "avatarUrl": null,
  "headline": "Senior Virtual Assistant",
  "location": "Manila, Philippines",
  "experienceYears": 5,
  "bio": "Experienced VA with strong customer support background...",
  "skills": ["Customer Support", "Data Entry", "Zendesk", "Salesforce"],
  "resumeUrl": "https://storage.bpoc.io/resumes/abc123.pdf",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

### 3. POST /api/v1/applications - NOW DOCUMENTED

This endpoint was functional but undocumented. It creates both candidates and applications in a single call.

**Request:**
```bash
curl -X POST "https://bpoc.io/api/v1/applications" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "JOB_UUID",
    "candidate": {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "source": "api"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "applicationId": "uuid"
}
```

**Notes:**
- If candidate email exists, links to existing candidate
- If new email, creates "shadow" candidate
- Application is NOT released to client by default
- Use `POST /applications/:id/release` to release to client

### 4. Rate Limiting (NEW)

All API requests are now rate limited based on your plan tier.

#### Rate Limits by Tier

| Tier | Requests/Hour | Burst Allowance |
|------|---------------|-----------------|
| Free | 100 | 10 |
| Pro | 1,000 | 50 |
| Enterprise | 10,000 | 200 |

#### Rate Limit Headers

Every API response includes these headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 973
X-RateLimit-Reset: 1705320000
```

- `X-RateLimit-Limit`: Total requests allowed per hour
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

#### Rate Limit Exceeded Response

**Response (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705320000
Retry-After: 120
```

**Best Practices:**
- Monitor `X-RateLimit-Remaining` header
- Implement exponential backoff on 429 responses
- Cache responses where appropriate
- Batch requests when possible

### 5. Consistent Error Codes (NEW)

All error responses now include a machine-readable error code.

**Error Response Format:**
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "additionalInfo"
    }
  }
}
```

#### Standard Error Codes

**Authentication & Authorization:**
- `UNAUTHORIZED` - Missing or invalid API key
- `FORBIDDEN` - Insufficient permissions
- `INVALID_API_KEY` - API key not found

**Validation:**
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_FORMAT` - Field format invalid (e.g., email)

**Resources:**
- `NOT_FOUND` - Resource doesn't exist
- `ALREADY_EXISTS` - Resource already exists (e.g., duplicate email)
- `CONFLICT` - Request conflicts with current state

**Rate Limiting:**
- `RATE_LIMIT_EXCEEDED` - Too many requests

**Server Errors:**
- `INTERNAL_ERROR` - Internal server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service error

**Example Error Handling:**
```javascript
try {
  const response = await fetch('https://bpoc.io/api/v1/candidates', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(candidateData)
  });

  if (!response.ok) {
    const error = await response.json();
    
    switch (error.error.code) {
      case 'ALREADY_EXISTS':
        console.log('Candidate already exists:', error.error.details.candidateId);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        const retryAfter = response.headers.get('Retry-After');
        console.log(`Rate limited. Retry after ${retryAfter} seconds`);
        break;
      case 'VALIDATION_ERROR':
        console.log('Validation failed:', error.error.details);
        break;
      default:
        console.error('API error:', error.error.message);
    }
  }
} catch (e) {
  console.error('Network error:', e);
}
```

### 6. Updated Field Reference

#### Common Fields Across All Endpoints

**Candidate Fields:**
```javascript
{
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string | null,
  avatarUrl: string | null,
  headline: string | null,
  location: string | null,
  experienceYears: number | null,
  bio: string | null,
  skills: string[],
  resumeUrl: string | null,
  isActive: boolean,
  createdAt: string,  // ISO 8601
  updatedAt: string   // ISO 8601
}
```

**Application Fields:**
```javascript
{
  id: string,
  candidateId: string,
  jobId: string,
  status: string,
  releasedToClient: boolean,
  appliedAt: string,       // ISO 8601
  releasedAt: string | null,  // ISO 8601
  candidate: {
    // Candidate object
  }
}
```

**Job Fields:**
```javascript
{
  id: string,
  clientId: string,
  title: string,
  description: string,
  slug: string,
  employmentType: string,
  workLocation: string,
  salaryMin: number | null,
  salaryMax: number | null,
  currency: string,
  experienceLevel: string | null,
  requiredSkills: string[],
  niceToHaveSkills: string[],
  benefits: string[],
  applicationDeadline: string | null,  // ISO 8601
  startDate: string | null,  // ISO 8601
  isActive: boolean,
  createdAt: string,  // ISO 8601
  updatedAt: string   // ISO 8601
}
```

**Client Fields:**
```javascript
{
  id: string,
  companyName: string,
  industry: string | null,
  website: string | null,
  description: string | null,
  logoUrl: string | null,
  contactName: string | null,
  contactEmail: string | null,
  contactPhone: string | null,
  createdAt: string,  // ISO 8601
  updatedAt: string   // ISO 8601
}
```

### 7. Migration Checklist

For agencies with existing integrations:

- [ ] Update all response parsers to handle camelCase fields
- [ ] Update error handling to check for error codes
- [ ] Implement rate limit monitoring
- [ ] Add retry logic for 429 responses
- [ ] Test candidate creation (POST /candidates)
- [ ] Test candidate updates (PUT /candidates/:id)
- [ ] Update documentation for your team
- [ ] Monitor API logs for deprecated field usage
- [ ] Update SDKs if applicable

### 8. Backwards Compatibility

**Input remains flexible:**
- API continues to accept both camelCase and snake_case in request bodies
- No changes required to existing POST/PUT request code

**Output changes required:**
- All responses now use camelCase
- Update your response parsers immediately

**Deprecation timeline:**
- **Current:** Both formats accepted for input
- **June 2026:** snake_case input will be deprecated (warnings logged)
- **September 2026:** snake_case input support removed

### 9. SDK Updates

If you're using an official BPOC SDK, update to the latest version:

**Node.js:**
```bash
npm install @bpoc/sdk@latest
```

**Python:**
```bash
pip install bpoc-sdk --upgrade
```

**PHP:**
```bash
composer update bpoc/sdk
```

All SDKs v2.0+ include:
- camelCase field handling
- Error code constants
- Rate limit helpers
- TypeScript definitions
- Automatic retry logic

### 10. Support & Questions

**Found a bug?** Email api@bpoc.io with:
- Request details (headers, body)
- Response received
- Expected behavior

**Need help migrating?** Book a call: https://calendly.com/bpoc-api-support

**Status page:** https://status.bpoc.io
