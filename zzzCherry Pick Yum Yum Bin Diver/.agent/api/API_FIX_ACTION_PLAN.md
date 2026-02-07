# BPOC API Fix Action Plan

> **Prioritized implementation plan for API improvements**
> 
> Based on: API_AUDIT_REPORT.md  
> Date: January 15, 2026

---

## PHASE 1: CRITICAL FIXES (Week 1)

### 1.1 Create Field Transformation Layer

**Priority**: 🔴 CRITICAL  
**Effort**: 4-6 hours  
**Impact**: HIGH - Fixes all field naming inconsistencies

**Tasks**:

1. **Create transformation utility** (`src/lib/api/transform.ts`)

```typescript
/**
 * Converts snake_case keys to camelCase recursively
 */
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * Converts camelCase keys to snake_case recursively
 */
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = toSnakeCase(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * Standardized API response wrapper
 */
export function apiResponse(data: any, options?: {
  status?: number;
  headers?: Record<string, string>;
}) {
  return NextResponse.json(
    toCamelCase(data),
    { 
      status: options?.status || 200,
      headers: options?.headers 
    }
  );
}
```

2. **Update all v1 API routes** to use transformation

```typescript
// BEFORE:
return withCors(NextResponse.json({
  application: {
    released_to_client: true,
    released_at: now,
    released_by: recruiterId
  }
}));

// AFTER:
return withCors(apiResponse({
  application: {
    released_to_client: true,  // Will be transformed to releasedToClient
    released_at: now,          // Will be transformed to releasedAt
    released_by: recruiterId   // Will be transformed to releasedBy
  }
}));
```

3. **Update endpoints**:
   - `/api/v1/applications/[id]/release/route.ts` ✅
   - `/api/v1/applications/[id]/route.ts` ✅
   - `/api/v1/applications/route.ts` ✅
   - `/api/v1/jobs/[id]/route.ts` ✅
   - `/api/v1/candidates/route.ts` ✅
   - `/api/v1/offers/route.ts` ✅
   - All other v1 endpoints

4. **Test transformations**
   - Write unit tests for `toCamelCase` and `toSnakeCase`
   - Test with sample database responses
   - Verify nested objects and arrays work

---

### 1.2 Update API Bible Documentation

**Priority**: 🔴 CRITICAL  
**Effort**: 2-3 hours  
**Impact**: HIGH - Prevents integration confusion

**Tasks**:

1. **Update ALL response examples** to use camelCase
2. **Remove undocumented endpoints**:
   - Remove `POST /api/v1/candidates` (doesn't exist)
   - Remove `PUT /api/v1/candidates/:id` (doesn't exist)
   - Remove `GET /api/v1/candidates/:id/resume` (doesn't exist)

3. **Add documented but missing endpoint**:
   - Add `POST /api/v1/applications` to Section 6

4. **Update field examples**:

```markdown
### Response Format

All API responses use **camelCase** for field names:

```json
{
  "applicationId": "uuid",
  "candidateId": "uuid",
  "releasedToClient": true,
  "releasedAt": "2025-01-15T10:00:00Z",
  "releasedBy": "recruiter-uuid"
}
```

Database uses snake_case internally, but all API responses are automatically transformed to camelCase.
```

5. **Add conversion table** to appendix:

| Database Field | API Response Field |
|---------------|-------------------|
| `released_to_client` | `releasedToClient` |
| `released_at` | `releasedAt` |
| `released_by` | `releasedBy` |
| `first_name` | `firstName` |
| `last_name` | `lastName` |
| `agency_client_id` | `agencyClientId` |
| `job_id` | `jobId` |
| `candidate_id` | `candidateId` |

---

### 1.3 Fix TypeScript Errors in get-or-create

**Priority**: 🔴 CRITICAL  
**Effort**: 30 minutes  
**Impact**: MEDIUM - Fixes LSP errors

**File**: `/api/v1/clients/get-or-create/route.ts`

**Error**: Lines 84-85

```typescript
// BEFORE (line 66-88):
const matchedClient = (existingClients || []).find((c: any) => {
  const companyName = c.companies?.name?.toLowerCase();
  // ...
});

if (matchedClient) {
  return withCors(NextResponse.json({
    clientId: matchedClient.id,
    companyId: matchedClient.companies?.id,  // ❌ TypeScript error
    name: matchedClient.companies?.name,     // ❌ TypeScript error
    created: false,
  }));
}

// AFTER:
const matchedClient = (existingClients || []).find((c: any) => {
  const companyName = c.companies?.name?.toLowerCase();
  // ...
});

if (matchedClient) {
  const company = matchedClient.companies as { id: string; name: string; email: string } | null;
  return withCors(NextResponse.json({
    clientId: matchedClient.id,
    companyId: company?.id || null,  // ✅ Fixed
    name: company?.name || null,     // ✅ Fixed
    created: false,
  }));
}
```

---

## PHASE 2: MEDIUM PRIORITY (Week 2)

### 2.1 Implement Missing Candidate Endpoints

**Priority**: 🟡 MEDIUM  
**Effort**: 4-6 hours  
**Impact**: MEDIUM - Enables full candidate management

**Create**: `/api/v1/candidates/route.ts`

```typescript
// POST /api/v1/candidates
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(apiResponse({ error: auth.error }, { status: auth.status }));
  }

  const body = await request.json();
  const { email, firstName, lastName, phone, location, skills, resumeUrl } = body;

  // Validation
  if (!email || !firstName || !lastName) {
    return withCors(apiResponse({ 
      error: 'Missing required fields',
      required: ['email', 'firstName', 'lastName']
    }, { status: 400 }));
  }

  // Check for existing candidate
  const { data: existing } = await supabaseAdmin
    .from('candidates')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return withCors(apiResponse({
      error: 'Candidate already exists',
      candidateId: existing.id,
      email: existing.email
    }, { status: 409 }));
  }

  // Create candidate
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
      created_by_agency_id: auth.agencyId
    })
    .select()
    .single();

  if (error || !candidate) {
    return withCors(apiResponse({ 
      error: 'Failed to create candidate',
      details: error?.message 
    }, { status: 500 }));
  }

  // Create profile if location provided
  if (location) {
    await supabaseAdmin.from('candidate_profiles').insert({
      candidate_id: candidate.id,
      location
    });
  }

  // Create skills if provided
  if (skills && Array.isArray(skills)) {
    const skillInserts = skills.map((skill: string) => ({
      candidate_id: candidate.id,
      name: skill
    }));
    await supabaseAdmin.from('candidate_skills').insert(skillInserts);
  }

  return withCors(apiResponse({
    candidateId: candidate.id,
    email: candidate.email,
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    created: true,
    message: 'Candidate created successfully'
  }, { status: 201 }));
}
```

**Create**: `/api/v1/candidates/[id]/route.ts`

```typescript
// PUT /api/v1/candidates/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(apiResponse({ error: auth.error }, { status: auth.status }));
  }

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, phone, location, skills } = body;

  // Verify candidate exists
  const { data: candidate } = await supabaseAdmin
    .from('candidates')
    .select('id')
    .eq('id', id)
    .single();

  if (!candidate) {
    return withCors(apiResponse({ error: 'Candidate not found' }, { status: 404 }));
  }

  // Update candidate basic info
  const updates: any = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin
      .from('candidates')
      .update(updates)
      .eq('id', id);
  }

  // Update profile location
  if (location !== undefined) {
    await supabaseAdmin
      .from('candidate_profiles')
      .upsert({
        candidate_id: id,
        location
      });
  }

  // Update skills (replace all)
  if (skills && Array.isArray(skills)) {
    // Delete existing skills
    await supabaseAdmin
      .from('candidate_skills')
      .delete()
      .eq('candidate_id', id);
    
    // Insert new skills
    if (skills.length > 0) {
      const skillInserts = skills.map((skill: string) => ({
        candidate_id: id,
        name: skill
      }));
      await supabaseAdmin.from('candidate_skills').insert(skillInserts);
    }
  }

  return withCors(apiResponse({
    candidateId: id,
    updated: true,
    message: 'Candidate updated successfully'
  }));
}
```

---

### 2.2 Add Rate Limiting

**Priority**: 🟡 MEDIUM  
**Effort**: 4-8 hours  
**Impact**: MEDIUM - Prevents API abuse

**Create**: `/src/lib/api/rateLimit.ts`

```typescript
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  free: { windowMs: 60000, maxRequests: 60 },      // 60 req/min
  pro: { windowMs: 60000, maxRequests: 300 },      // 300 req/min
  enterprise: { windowMs: 60000, maxRequests: 1000 } // 1000 req/min
};

// In-memory store (use Redis in production)
const requests = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  apiKey: string,
  tier: string
): Promise<{ allowed: boolean; limit: number; remaining: number; resetAt: number }> {
  const config = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const now = Date.now();
  
  const current = requests.get(apiKey);
  
  if (!current || current.resetAt < now) {
    // New window
    requests.set(apiKey, {
      count: 1,
      resetAt: now + config.windowMs
    });
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs
    };
  }
  
  // Existing window
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: current.resetAt
    };
  }
  
  current.count++;
  requests.set(apiKey, current);
  
  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - current.count,
    resetAt: current.resetAt
  };
}

export function rateLimitHeaders(rateLimit: {
  limit: number;
  remaining: number;
  resetAt: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimit.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(rateLimit.resetAt / 1000).toString()
  };
}
```

**Update**: `/api/v1/auth.ts`

```typescript
export async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  
  if (!apiKey) {
    return { error: 'Missing API key', status: 401 };
  }

  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('id, name, api_enabled, api_tier')
    .eq('api_key', apiKey)
    .single();

  if (!agency) {
    return { error: 'Invalid API key', status: 401 };
  }

  if (!agency.api_enabled) {
    return { error: 'API access disabled', status: 403 };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(apiKey, agency.api_tier || 'free');
  
  if (!rateLimit.allowed) {
    return { 
      error: 'Rate limit exceeded', 
      status: 429,
      headers: rateLimitHeaders(rateLimit)
    };
  }

  return { 
    agency, 
    agencyId: agency.id,
    rateLimit 
  };
}
```

---

### 2.3 Standardize Error Responses

**Priority**: 🟡 MEDIUM  
**Effort**: 2-4 hours  
**Impact**: MEDIUM - Better developer experience

**Create**: `/src/lib/api/errors.ts`

```typescript
export class ApiError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.field && { field: this.field }),
      ...(this.details && { details: this.details })
    };
  }
}

export const ApiErrors = {
  // Authentication
  MISSING_API_KEY: () => new ApiError('Missing API key', 'MISSING_API_KEY', 401),
  INVALID_API_KEY: () => new ApiError('Invalid API key', 'INVALID_API_KEY', 401),
  API_DISABLED: () => new ApiError('API access disabled', 'API_DISABLED', 403),
  RATE_LIMIT_EXCEEDED: () => new ApiError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429),
  
  // Validation
  MISSING_FIELD: (field: string) => new ApiError(`Missing required field: ${field}`, 'MISSING_FIELD', 400, field),
  INVALID_FIELD: (field: string, reason?: string) => new ApiError(
    `Invalid ${field}${reason ? `: ${reason}` : ''}`, 
    'INVALID_FIELD', 
    400, 
    field
  ),
  
  // Resources
  NOT_FOUND: (resource: string) => new ApiError(`${resource} not found`, 'NOT_FOUND', 404),
  ALREADY_EXISTS: (resource: string) => new ApiError(`${resource} already exists`, 'ALREADY_EXISTS', 409),
  
  // Tier restrictions
  TIER_REQUIRED: (feature: string, tier: string) => new ApiError(
    `${feature} requires ${tier} plan`,
    'TIER_REQUIRED',
    403,
    undefined,
    { requiredTier: tier }
  ),
  
  // Generic
  INTERNAL_ERROR: (details?: string) => new ApiError(
    'Internal server error',
    'INTERNAL_ERROR',
    500,
    undefined,
    details
  )
};
```

**Usage**:

```typescript
// BEFORE:
if (!apiKey) {
  return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
}

// AFTER:
if (!apiKey) {
  throw ApiErrors.MISSING_API_KEY();
}

// Catch and format:
try {
  // ... logic
} catch (error) {
  if (error instanceof ApiError) {
    return apiResponse(error.toJSON(), { status: error.status });
  }
  throw error;
}
```

---

## PHASE 3: LOW PRIORITY (Week 3-4)

### 3.1 Generate OpenAPI Specification

**Priority**: 🟢 LOW  
**Effort**: 8-12 hours  
**Impact**: LOW - Nice to have

Use `swagger-jsdoc` to generate OpenAPI spec from JSDoc comments.

---

### 3.2 Add Request ID Tracing

**Priority**: 🟢 LOW  
**Effort**: 2-4 hours  
**Impact**: LOW - Better debugging

Add unique request IDs to all API responses and logs.

---

### 3.3 Create SDK for Agencies

**Priority**: 🟢 LOW  
**Effort**: 16-24 hours  
**Impact**: LOW - Better DX for agencies

Create official TypeScript/JavaScript SDK.

---

## TESTING CHECKLIST

After each phase, test:

- [ ] All v1 endpoints return camelCase
- [ ] API Bible examples match actual responses
- [ ] Recruiter Gate works correctly
- [ ] Rate limiting enforces limits
- [ ] Error responses are consistent
- [ ] Field transformations preserve data types
- [ ] Nested objects/arrays transform correctly

---

## ROLLOUT PLAN

### Week 1: Phase 1 (Critical)
- Day 1-2: Transformation layer
- Day 3: Update all endpoints
- Day 4: Update API Bible
- Day 5: Testing

### Week 2: Phase 2 (Medium)
- Day 1-2: Candidate endpoints
- Day 3-4: Rate limiting
- Day 5: Error standardization

### Week 3-4: Phase 3 (Low)
- OpenAPI spec
- Request tracing
- SDK development

---

**Document Owner**: BPOC Development Team  
**Last Updated**: January 15, 2026  
**Status**: Ready for Implementation
