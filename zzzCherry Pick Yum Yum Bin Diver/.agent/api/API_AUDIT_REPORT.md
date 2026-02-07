# BPOC API Audit Report

> **Comprehensive API Audit for Whitelabel Agency Integration**
> 
> Date: January 15, 2026  
> Auditor: AI API Expert  
> Focus: Agency portal integration, field naming consistency, Recruiter Gate enforcement

---

## EXECUTIVE SUMMARY

### Overall API Health: ⚠️ **GOOD with Issues**

The BPOC API is **functional and well-structured** for whitelabel agency integration, but there are **critical inconsistencies** between:
- Documentation vs Implementation
- Database naming (snake_case) vs API responses (mixed case)
- Missing candidate-related endpoints documented in API Bible

### Critical Findings

🔴 **CRITICAL**:
1. **Field Naming Inconsistency**: API responses mix snake_case and camelCase
2. **Missing Candidate Endpoints**: Documented but not implemented
3. **Recruiter Gate Variable Naming**: Inconsistent between documentation and code

🟡 **MEDIUM**:
1. **POST /api/v1/applications** route exists but not in API Bible
2. **Candidate creation through API** needs better documentation
3. **Error handling** could be more consistent

🟢 **GOOD**:
1. **Authentication**: Solid API key validation
2. **CORS**: Properly implemented
3. **Recruiter Gate Logic**: Correctly enforced
4. **Tier-based Access**: Working correctly

---

## DETAILED FINDINGS

### 1. FIELD NAMING CONSISTENCY ISSUES

#### Problem: Mixed Case in API Responses

**Database** uses `snake_case`:
- `released_to_client`
- `first_name`
- `last_name`
- `agency_client_id`

**API Responses** inconsistently return mix of:
- Some endpoints: snake_case (matches database)
- Some endpoints: camelCase (JavaScript convention)
- Documentation: Shows camelCase

**Example from `/api/v1/clients/get-or-create`**:
```typescript
// ✅ Returns camelCase (GOOD)
return NextResponse.json({
  clientId: newClient.id,    // ✅ camelCase
  companyId: newCompany.id,  // ✅ camelCase
  created: true              // ✅ camelCase
});
```

**Example from `/api/v1/applications/[id]/release`**:
```typescript
// ❌ Returns snake_case (INCONSISTENT with docs)
return NextResponse.json({
  application: {
    released_to_client: true,  // ❌ snake_case
    released_at: now,          // ❌ snake_case
    released_by: userId        // ❌ snake_case
  }
});
```

#### Recommendation: **Standardize ALL API responses to camelCase**

**WHY**: External agencies are using JavaScript/TypeScript. camelCase is the standard.

**SOLUTION**: Create a transformation layer for ALL API responses.

```typescript
// Create: src/lib/api/transform.ts
export function toApiFormat(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toApiFormat);
  }
  
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toApiFormat(value);
    }
    return result;
  }
  
  return obj;
}

// Use in all API routes:
return NextResponse.json(toApiFormat({
  application: updated  // Will transform all fields to camelCase
}));
```

---

### 2. MISSING CANDIDATE ENDPOINTS

#### Problem: Documented but Not Implemented

**API Bible documents** (Section 6.11):
- `POST /api/v1/candidates` - Create candidate
- `PUT /api/v1/candidates/:id` - Update candidate
- `GET /api/v1/candidates/:id/resume` - Get candidate resume

**REALITY**: These endpoints **DO NOT EXIST** in codebase.

**What EXISTS**:
- ✅ `GET /api/v1/candidates` - Search talent pool (Enterprise)
- ✅ `GET /api/v1/candidates/:id/complete` - Get complete profile (Enterprise)
- ❌ `POST /api/v1/candidates` - **MISSING**
- ❌ `PUT /api/v1/candidates/:id` - **MISSING**
- ❌ `GET /api/v1/candidates/:id/resume` - **MISSING**

#### Current Candidate Creation Flow

**There IS a workaround** in `/api/v1/applications` route:

```typescript
// From /api/v1/applications route.ts (line 34-68)
// Creates "shadow" candidate when application submitted via API
const { data: newCandidate } = await supabaseAdmin
  .from('candidates')
  .insert({
    email: candidate.email,
    first_name: candidate.firstName,
    last_name: candidate.lastName,
    role: 'candidate',
    status: 'active'
  })
  .select('id')
  .single();
```

**PROBLEM**: This is undocumented and creates incomplete candidate records.

#### Recommendation: **Implement Missing Candidate Endpoints OR Update Documentation**

**OPTION 1: Implement the endpoints** (Recommended)

Create `/api/v1/candidates/route.ts`:

```typescript
// POST /api/v1/candidates
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  const body = await request.json();
  const { email, firstName, lastName, phone, location, skills } = body;

  if (!email || !firstName || !lastName) {
    return withCors(NextResponse.json({ 
      error: 'Missing required fields: email, firstName, lastName' 
    }, { status: 400 }));
  }

  // Check if candidate already exists
  const { data: existing } = await supabaseAdmin
    .from('candidates')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return withCors(NextResponse.json({
      error: 'Candidate with this email already exists',
      candidateId: existing.id
    }, { status: 409 }));
  }

  // Create candidate WITHOUT user_id (shadow candidate)
  // They can claim account later when they sign up
  const { data: candidate, error } = await supabaseAdmin
    .from('candidates')
    .insert({
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role: 'candidate',
      status: 'active',
      created_via: 'api',
      created_by_agency: auth.agencyId
    })
    .select()
    .single();

  if (error || !candidate) {
    console.error('Failed to create candidate:', error);
    return withCors(NextResponse.json({ 
      error: 'Failed to create candidate',
      details: error?.message 
    }, { status: 500 }));
  }

  // Create candidate profile if additional data provided
  if (location || skills) {
    await supabaseAdmin.from('candidate_profiles').insert({
      candidate_id: candidate.id,
      location: location || null,
      // ... other profile fields
    });
  }

  // Create skills if provided
  if (skills && skills.length > 0) {
    const skillInserts = skills.map((skill: string) => ({
      candidate_id: candidate.id,
      name: skill,
    }));
    await supabaseAdmin.from('candidate_skills').insert(skillInserts);
  }

  return withCors(NextResponse.json({
    candidateId: candidate.id,
    email: candidate.email,
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    created: true,
    message: 'Candidate created successfully'
  }, { status: 201 }));
}
```

**OPTION 2: Update documentation** to remove these endpoints and explain the workflow.

---

### 3. RECRUITER GATE - VARIABLE NAMING

#### Issue: Inconsistent Field Names in Documentation

**API Bible uses** (Section 6.6):
```json
{
  "releasedToClient": true,
  "releasedAt": "2025-01-15T10:00:00Z",
  "releasedBy": "recruiter-uuid"
}
```

**Actual API returns** (from `/api/v1/applications/[id]/release`):
```json
{
  "application": {
    "released_to_client": true,
    "released_at": "2025-01-15T10:00:00Z",
    "released_by": "recruiter-uuid"
  }
}
```

**Database schema** (Supabase):
```sql
CREATE TABLE job_applications (
  released_to_client BOOLEAN DEFAULT false,
  released_at        TIMESTAMPTZ,
  released_by        UUID
);
```

#### Recommendation: **Use camelCase in all API responses**

Transform database responses before sending to API consumers.

---

### 4. APPLICATION SUBMISSION ENDPOINT

#### Issue: Undocumented but Functional

**Route exists**: `/api/v1/applications` (POST)
**API Bible**: Does NOT document this endpoint
**Purpose**: Allow external systems to submit applications

**Current implementation**:
```typescript
// POST /api/v1/applications
// - Creates candidate if doesn't exist
// - Creates application
// - Sets released_to_client = false (Recruiter Gate)
```

#### Recommendation: **Add to API Bible**

**Add to Section 6 - API Reference**:

```markdown
### 6.4 Submit Application

**POST** `/api/v1/applications`

Submit a candidate application to a job.

**Tier**: Free+

**Request Body**:
```json
{
  "jobId": "uuid",
  "candidate": {
    "email": "candidate@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "source": "api" // optional
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "applicationId": "uuid"
}
```

**Note**: If candidate doesn't exist, a shadow candidate record is created. The application will have `releasedToClient: false` until a recruiter releases it.
```

---

### 5. JOB CREATION - FIELD NORMALIZATION

#### Status: ✅ **EXCELLENT**

The `/api/v1/jobs/create` endpoint has **excellent** enum normalization:

```typescript
// Handles multiple formats and normalizes to database enums
function normalizeExperienceLevel(value: string) {
  const mapping = {
    'entry': 'entry_level',
    'entrylevel': 'entry_level',
    'junior': 'entry_level',
    'mid': 'mid_level',
    // ... etc
  };
  return mapping[normalized] || null;
}
```

**This is a PATTERN to follow** for all other endpoints!

#### Recommendation: **Extract to shared utility**

```typescript
// Create: src/lib/api/normalize.ts
export const EnumNormalizers = {
  experienceLevel: (value: string) => { /* ... */ },
  workType: (value: string) => { /* ... */ },
  workArrangement: (value: string) => { /* ... */ },
  shift: (value: string) => { /* ... */ },
  applicationStatus: (value: string) => { /* ... */ },
  // ... etc
};
```

Use in all endpoints that accept enum values.

---

### 6. VIDEO CALL SHARING - CORRECT IMPLEMENTATION

#### Status: ✅ **CORRECT**

The `/api/v1/applications/[id]/release` endpoint **correctly** implements per-call sharing:

```typescript
// Line 74-98: Update video_call_rooms.share_with_client
// Line 100-124: Update video_call_rooms.share_with_candidate
// Also updates transcripts and recordings sharing flags
```

**This matches the documented architecture** ✅

---

### 7. API KEY AUTHENTICATION

#### Status: ✅ **SOLID**

```typescript
// /api/v1/auth.ts
export async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  
  // Lookup agency by API key
  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('id, name, api_enabled')
    .eq('api_key', apiKey)
    .single();
  
  // Check api_enabled flag
  if (!agency.api_enabled) {
    return { error: 'API access is disabled' };
  }
  
  return { agency, agencyId: agency.id };
}
```

**GOOD**:
- ✅ Checks both `X-API-Key` and `x-api-key` headers
- ✅ Validates against database
- ✅ Checks `api_enabled` flag
- ✅ Returns agency context for filtering

**RECOMMENDATION**: Add rate limiting (currently not implemented).

---

### 8. CORS IMPLEMENTATION

#### Status: ✅ **PROPER**

All v1 endpoints use:
```typescript
import { handleCorsOptions, withCors } from '../../cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  // ... logic
  return withCors(NextResponse.json({ data }));
}
```

**GOOD**: Consistent CORS handling across all endpoints.

---

## PRIORITY FIXES

### 🔴 CRITICAL (Fix Immediately)

1. **Standardize API Response Format**
   - Create transformation layer
   - Convert ALL responses to camelCase
   - Update affected endpoints:
     - `/api/v1/applications/[id]/release`
     - `/api/v1/applications/[id]`
     - `/api/v1/jobs/[id]`
     - `/api/v1/candidates`

2. **Document or Implement Candidate Endpoints**
   - Either implement `POST /api/v1/candidates`
   - OR remove from API Bible and document the application-based flow

3. **Update API Bible Field Names**
   - Ensure ALL examples use camelCase
   - Match actual API responses

### 🟡 MEDIUM (Fix Soon)

1. **Add Rate Limiting**
   - Implement per-key rate limits
   - Add rate limit headers
   - Document limits in API Bible

2. **Improve Error Responses**
   - Standardize error format:
     ```json
     {
       "error": "Error message",
       "code": "ERROR_CODE",
       "field": "field_name" // for validation errors
     }
     ```

3. **Add Request Validation Library**
   - Use Zod for consistent validation
   - Provide better validation error messages

### 🟢 LOW (Nice to Have)

1. **Add OpenAPI/Swagger Spec**
   - Generate from code
   - Auto-update documentation

2. **Add API Versioning Headers**
   - `X-API-Version: 1`
   - Prepare for v2 migration path

3. **Add Request ID Tracing**
   - Generate unique request IDs
   - Include in responses and logs
   - Help with debugging

---

## AGENCY INTEGRATION CHECKLIST

For agencies integrating with BPOC API:

### ✅ What Works Well

1. **Client Onboarding**
   - `POST /api/v1/clients/get-or-create` - ✅ Works perfectly
   - Returns `clientId` to store
   - Idempotent (safe to call multiple times)

2. **Job Management**
   - `POST /api/v1/jobs/create` - ✅ Excellent enum handling
   - `GET /api/v1/jobs` - ✅ Proper filtering
   - `PATCH /api/v1/jobs/:id` - ✅ Updates work

3. **Recruiter Gate**
   - Correctly enforced by default
   - `POST /api/v1/applications/:id/release` - ✅ Works correctly
   - Per-call sharing controls - ✅ Implemented correctly

4. **Authentication**
   - API key validation - ✅ Solid
   - Agency isolation - ✅ Enforced

### ⚠️ Workarounds Needed

1. **Field Names**
   - **EXPECT snake_case** in some responses
   - **Transform to camelCase** in your code
   - Don't rely on documentation case - check actual responses

2. **Candidate Creation**
   - **Don't use** `POST /api/v1/candidates` (doesn't exist)
   - **Instead**: Submit application, candidate created automatically
   - Store returned `candidateId` from application response

3. **Error Handling**
   - Error formats vary between endpoints
   - Always check both `error` and `details` fields
   - Some endpoints return `message`, others return `error`

---

## RECOMMENDED API WRAPPER

For agencies, create a wrapper that handles BPOC inconsistencies:

```typescript
// bpoc-api-client.ts
export class BpocApiClient {
  constructor(private apiKey: string, private baseUrl: string) {}

  // Normalize ALL responses to camelCase
  private normalizeResponse(data: any): any {
    // Convert snake_case to camelCase recursively
    return toApiFormat(data);
  }

  // Standardize error handling
  private handleError(response: any): never {
    const error = response.error || response.message || 'Unknown error';
    const code = response.code || 'UNKNOWN';
    throw new BpocApiError(error, code, response);
  }

  async createClient(data: ClientData) {
    const response = await fetch(`${this.baseUrl}/api/v1/clients/get-or-create`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const json = await response.json();
    if (!response.ok) this.handleError(json);
    
    return this.normalizeResponse(json); // Always camelCase
  }

  async createJob(clientId: string, data: JobData) {
    // Similar pattern...
  }

  async releaseApplication(applicationId: string, recruiterId: string) {
    // Handles snake_case -> camelCase conversion
  }
}
```

---

## TESTING RECOMMENDATIONS

### API Testing Checklist

1. **Test Client Onboarding**
   ```bash
   # Create client
   curl -X POST "https://bpoc.io/api/v1/clients/get-or-create" \
     -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Corp", "email": "test@example.com"}'
   
   # Should return: {"clientId": "...", "created": true}
   ```

2. **Test Job Creation**
   ```bash
   curl -X POST "https://bpoc.io/api/v1/jobs/create" \
     -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": "...",
       "title": "Test Job",
       "description": "Test description",
       "salaryMin": 30000,
       "salaryMax": 45000
     }'
   ```

3. **Test Application Submission**
   ```bash
   curl -X POST "https://bpoc.io/api/v1/applications" \
     -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "jobId": "...",
       "candidate": {
         "email": "candidate@test.com",
         "firstName": "John",
         "lastName": "Doe"
       }
     }'
   ```

4. **Test Recruiter Gate Release**
   ```bash
   curl -X POST "https://bpoc.io/api/v1/applications/APP_ID/release" \
     -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "released_by": "RECRUITER_UUID",
       "status": "shortlisted"
     }'
   ```

---

## CONCLUSION

### Summary

The BPOC API is **functionally solid** and ready for production use, but needs **consistency improvements** in:

1. **Field naming** (snake_case vs camelCase)
2. **Documentation accuracy** (remove missing endpoints or implement them)
3. **Error response formats** (standardize structure)

### Immediate Action Items

1. ✅ **Create field transformation layer** (2-4 hours)
2. ✅ **Update API Bible** to match actual responses (1-2 hours)
3. ✅ **Implement or remove candidate endpoints** from docs (4-6 hours or 1 hour)
4. ✅ **Add integration test suite** (4-8 hours)
5. ✅ **Create API client SDK** for agencies (8-16 hours)

### Long-term Recommendations

1. **API v2**: Start fresh with consistent naming, proper versioning
2. **OpenAPI Spec**: Generate from code, keep in sync
3. **Rate Limiting**: Prevent abuse, ensure fair usage
4. **Webhooks**: Notify agencies of events (application submitted, etc.)
5. **Sandbox Environment**: Let agencies test without affecting production

---

**Report Prepared By**: AI API Expert  
**Date**: January 15, 2026  
**Status**: Ready for Review  
**Next Steps**: Prioritize fixes, implement transformation layer

---

## APPENDIX: COMPLETE ENDPOINT AUDIT

| Endpoint | Documented | Implemented | Field Format | Recruiter Gate | Notes |
|----------|-----------|-------------|--------------|----------------|-------|
| `POST /clients/get-or-create` | ✅ | ✅ | ✅ camelCase | N/A | Perfect |
| `GET /clients` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `POST /jobs/create` | ✅ | ✅ | ✅ camelCase | N/A | Excellent |
| `GET /jobs` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `GET /jobs/:id` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `PATCH /jobs/:id` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `POST /applications` | ❌ | ✅ | ⚠️ snake_case | ✅ Enforced | Add to docs |
| `GET /applications` | ✅ | ✅ | ⚠️ Mixed | ✅ Enforced | Check format |
| `GET /applications/:id` | ✅ | ✅ | ⚠️ snake_case | ✅ Enforced | Fix format |
| `POST /applications/:id/release` | ✅ | ✅ | ❌ snake_case | ✅ Correct | Fix format |
| `POST /applications/:id/send-back` | ✅ | ✅ | ⚠️ Mixed | ✅ Correct | Check format |
| `GET /candidates` | ✅ | ✅ | ✅ camelCase | N/A | Enterprise only |
| `GET /candidates/:id/complete` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `POST /candidates` | ✅ | ❌ | N/A | N/A | Implement or remove |
| `PUT /candidates/:id` | ✅ | ❌ | N/A | N/A | Implement or remove |
| `GET /video/rooms` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `POST /video/rooms` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `GET /offers` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |
| `POST /offers` | ✅ | ✅ | ⚠️ Mixed | N/A | Check format |

**Legend**:
- ✅ Good
- ⚠️ Needs attention
- ❌ Critical issue
- N/A Not applicable

