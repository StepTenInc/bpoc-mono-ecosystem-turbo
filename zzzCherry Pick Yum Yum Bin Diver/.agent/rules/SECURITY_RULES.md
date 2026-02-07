# BPOC Security Rules

> **Security guidelines and best practices**
> 
> Last Updated: January 15, 2026

---

## CRITICAL SECURITY RULES

### 1. The Recruiter Gate MUST Be Enforced

**Rule**: Clients can ONLY see applications where `released_to_client = TRUE`

```typescript
// ✅ Correct - Check released flag
const applications = await supabase
  .from('job_applications')
  .select('*')
  .eq('released_to_client', true)  // ← REQUIRED for client access

// ❌ SECURITY VIOLATION
const applications = await supabase
  .from('job_applications')
  .select('*')
  // Missing released_to_client check - EXPOSES UNRELEASED APPS!
```

### 2. Video Call Sharing MUST Be Respected

**Rule**: Only show call artifacts if sharing is enabled

```typescript
// ✅ Correct - Check share flags
if (room.share_with_client && userRole === 'client') {
  return { recording, transcript, notes }
}

// ❌ SECURITY VIOLATION
// Showing recording to client without checking share_with_client flag
return { recording, transcript, notes }
```

### 3. Multi-Tenant Isolation MUST Be Maintained

**Rule**: Users can ONLY see data from their agency

```typescript
// ✅ Correct - Filter by agency using Supabase RLS
const { data: applications } = await supabase
  .from('job_applications')
  .select(`
    *,
    job:jobs!inner(
      *,
      agency_client:agency_clients!inner(agency_id)
    )
  `)
  .eq('job.agency_client.agency_id', recruiter.agencyId) // ← REQUIRED

// ❌ SECURITY VIOLATION
const { data: applications } = await supabase
  .from('job_applications')
  .select('*')
// Missing agency filter - EXPOSES OTHER AGENCIES' DATA!
```

---

## AUTHENTICATION

### Always Verify Session

```typescript
// ✅ Correct
export async function GET(request: Request) {
  const user = await getUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Proceed with operation
}
```

### Use Supabase Auth

```typescript
// ✅ Correct - Server-side auth
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// ✅ Correct - Client-side auth
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

const { user } = useAuth()
```

---

## AUTHORIZATION

### Role-Based Access Control

```typescript
// Define role hierarchy
const ROLE_PERMISSIONS = {
  candidate: ['view_own_applications', 'apply_to_jobs'],
  recruiter: ['view_agency_data', 'manage_applications', 'release_to_client'],
  admin: ['view_all_data', 'manage_agencies', 'override_status']
}

// ✅ Correct - Check permissions
function hasPermission(user: User, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.role]
  return rolePermissions?.includes(permission) || false
}

if (!hasPermission(user, 'manage_applications')) {
  return new Response('Forbidden', { status: 403 })
}
```

---

## DATA ACCESS RULES

### Candidate Data Access

**Candidates can ONLY see**:
- Their own profile
- Their own applications
- Public job listings
- Recordings/transcripts if `share_with_candidate = TRUE`

```typescript
// ✅ Correct
const applications = await supabase
  .from('job_applications')
  .select('*')
  .eq('candidate_id', candidateId)  // ← Only their applications

// ❌ SECURITY VIOLATION
const applications = await supabase
  .from('job_applications')
  .select('*')
  // Missing candidate_id filter!
```

### Recruiter Data Access

**Recruiters can see**:
- All data within their agency
- All candidates (talent pool)
- Full candidate contact information

```typescript
// ✅ Correct - Agency isolation using Supabase RLS
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    *,
    agency_client:agency_clients!inner(agency_id)
  `)
  .eq('agency_client.agency_id', recruiter.agencyId) // ← Only their agency

// ❌ SECURITY VIOLATION
const { data: jobs } = await supabase
  .from('jobs')
  .select('*')
// Missing agency filter!
```

### Client Data Access

**Clients can see**:
- Their own jobs
- Applications WHERE `released_to_client = TRUE`
- All candidates in talent pool
- Recordings WHERE `share_with_client = TRUE`

```typescript
// ✅ Correct - Multiple filters
const applications = await supabase
  .from('job_applications')
  .select('*')
  .eq('job.client_id', clientId)
  .eq('released_to_client', true)  // ← CRITICAL

// ❌ SECURITY VIOLATION
const applications = await supabase
  .from('job_applications')
  .select('*')
  .eq('job.client_id', clientId)
  // Missing released_to_client check!
```

---

## INPUT VALIDATION

### Always Validate Input

```typescript
// ✅ Correct - Use Zod for validation
import { z } from 'zod'

const applicationSchema = z.object({
  jobId: z.string().uuid(),
  resumeId: z.string().uuid().optional(),
  coverNote: z.string().max(2000).optional()
})

const validatedData = applicationSchema.parse(requestData)
```

### Sanitize User Input

```typescript
// ✅ Correct - Sanitize HTML
import DOMPurify from 'isomorphic-dompurify'

const cleanDescription = DOMPurify.sanitize(userInput)
```

---

## FILE UPLOADS

### Validate File Type and Size

```typescript
// ✅ Correct
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

if (file.size > MAX_FILE_SIZE) {
  return { error: 'File too large' }
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return { error: 'Invalid file type' }
}
```

### Use Secure File Storage

```typescript
// ✅ Correct - Use Supabase Storage
const { data, error } = await supabase.storage
  .from('resumes')
  .upload(`${userId}/${filename}`, file)

// Set proper access control
await supabase.storage
  .from('resumes')
  .updateBucket({
    public: false  // ← Private by default
  })
```

---

## ENVIRONMENT VARIABLES

### Never Commit Secrets

```typescript
// ✅ Correct - Use environment variables
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ❌ SECURITY VIOLATION - Hardcoded secret
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Client vs Server Variables

```typescript
// Client-side (public) - Use NEXT_PUBLIC_ prefix
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// Server-side (secret) - No prefix
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
```

---

## API SECURITY

### Rate Limiting

```typescript
// Implement rate limiting for sensitive endpoints
// Use middleware or edge functions
```

### CORS Configuration

```typescript
// ✅ Correct - Specific origin
const allowedOrigins = ['https://bpoc.io', 'https://app.bpoc.io']

if (!allowedOrigins.includes(request.headers.get('origin'))) {
  return new Response('Forbidden', { status: 403 })
}

// ❌ SECURITY VIOLATION - Wildcard CORS
res.setHeader('Access-Control-Allow-Origin', '*')
```

---

## SQL INJECTION PREVENTION

### Use Parameterized Queries

```typescript
// ✅ Correct - Parameterized
const { data } = await supabase
  .from('candidates')
  .select('*')
  .eq('email', userEmail)  // ← Safe, parameterized

// ❌ SECURITY VIOLATION - String interpolation
const { data } = await supabase
  .rpc('execute_sql', {
    query: `SELECT * FROM candidates WHERE email = '${userEmail}'`
  })  // ← SQL injection risk!
```

---

## SESSION MANAGEMENT

### Secure Session Handling

```typescript
// ✅ Correct - Use Supabase session
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  redirect('/login')
}

// Refresh session periodically
await supabase.auth.refreshSession()
```

### Logout Properly

```typescript
// ✅ Correct - Clear session
await supabase.auth.signOut()
// Clear local state
setUser(null)
// Redirect to login
router.push('/login')
```

---

## ERROR HANDLING

### Don't Expose Internal Details

```typescript
// ✅ Correct - Generic user message
catch (error) {
  console.error('Internal error:', error)  // Log internally
  return NextResponse.json(
    { error: 'An unexpected error occurred' },  // Generic message
    { status: 500 }
  )
}

// ❌ SECURITY VIOLATION - Exposing internals
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },  // Exposes internals!
    { status: 500 }
  )
}
```

---

## SECURITY CHECKLIST

Before deploying:

- [ ] All API routes check authentication
- [ ] All API routes check authorization
- [ ] Recruiter Gate is enforced for client access
- [ ] Video call sharing flags are respected
- [ ] Multi-tenant isolation is maintained
- [ ] Input validation is implemented
- [ ] File uploads are validated and sanitized
- [ ] Environment variables are used for secrets
- [ ] Error messages don't expose internals
- [ ] SQL injection prevention is in place
- [ ] XSS prevention is implemented
- [ ] CSRF protection is enabled
- [ ] Rate limiting is configured
- [ ] CORS is properly configured

---

**Last Updated**: January 15, 2026  
**Maintained By**: BPOC Development Team
