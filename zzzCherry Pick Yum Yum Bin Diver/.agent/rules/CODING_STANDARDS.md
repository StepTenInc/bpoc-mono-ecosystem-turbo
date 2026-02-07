# BPOC Coding Standards

> **Code style and best practices for BPOC development**
> 
> Last Updated: January 15, 2026

---

## GENERAL PRINCIPLES

1. **Write for humans first** - Code is read more than written
2. **Be consistent** - Follow established patterns
3. **Keep it simple** - Avoid unnecessary complexity
4. **Document the why** - Explain intentions, not obvious actions
5. **Test your changes** - Always test before pushing

---

## TYPESCRIPT

### Type Safety

```typescript
// ✅ Good - Explicit typing
interface CandidateProfile {
  id: string
  fullName: string
  email: string
  experienceYears: number
}

function getCandidate(id: string): Promise<CandidateProfile> {
  // ...
}

// ❌ Bad - Using 'any'
function getCandidate(id: any): any {
  // ...
}
```

### Avoid `any`

```typescript
// ✅ Good - Use proper types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ❌ Bad - Using 'any'
interface ApiResponse {
  success: boolean
  data?: any
  error?: string
}
```

### Use Type Guards

```typescript
// ✅ Good - Type guard
function isCandidate(user: any): user is Candidate {
  return user && typeof user.id === 'string' && 'applications' in user
}

if (isCandidate(user)) {
  // TypeScript knows user is Candidate here
  console.log(user.applications)
}
```

---

## NAMING CONVENTIONS

### Files and Folders

```
✅ Good:
- CandidateSidebar.tsx (Components: PascalCase)
- fetchApplications.ts (Functions: camelCase)
- candidate-utils.ts (Utilities: kebab-case)
- useAuth.ts (Hooks: camelCase with 'use' prefix)

❌ Bad:
- candidatesidebar.tsx
- Fetch_Applications.ts
- CandidateUtils.ts
```

### Variables and Functions

```typescript
// ✅ Good
const candidateId = '123'
function fetchCandidateProfile() { }
const MAX_FILE_SIZE = 10 * 1024 * 1024 // Constants: UPPER_SNAKE_CASE

// ❌ Bad
const CandidateID = '123'
function FetchCandidateProfile() { }
const maxFileSize = 10 * 1024 * 1024
```

### Database Fields

```typescript
// Database uses snake_case
const application = {
  released_to_client: true,  // ✅ Good - matches database
  released_at: new Date(),
  released_by: recruiterId
}

// API/Frontend uses camelCase
const apiResponse = {
  releasedToClient: true,  // ✅ Good - API format
  releasedAt: new Date(),
  releasedBy: recruiterId
}
```

---

## COMPONENTS

### Functional Components

```typescript
// ✅ Good - Functional component with TypeScript
interface CandidateCardProps {
  candidate: Candidate
  onSelect: (id: string) => void
}

export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  return (
    <div onClick={() => onSelect(candidate.id)}>
      <h3>{candidate.fullName}</h3>
      <p>{candidate.headline}</p>
    </div>
  )
}

// ❌ Bad - Class component
export class CandidateCard extends React.Component {
  // ...
}
```

### Props Interface

```typescript
// ✅ Good - Props interface defined separately
interface SidebarProps {
  profile: CandidateProfile
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export function Sidebar({ profile, mobileOpen, setMobileOpen }: SidebarProps) {
  // ...
}

// ❌ Bad - Inline props
export function Sidebar({ profile, mobileOpen, setMobileOpen }: {
  profile: any
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}) {
  // ...
}
```

---

## API ROUTES

### Standard Response Format

```typescript
// ✅ Good - Standard format
export async function GET(request: Request) {
  try {
    const data = await fetchData()
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data' 
      },
      { status: 500 }
    )
  }
}
```

### Error Handling

```typescript
// ✅ Good - Proper error handling
try {
  const result = await dangerousOperation()
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('Operation failed:', error)
  
  // User-friendly error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred'
    
  return NextResponse.json(
    { success: false, error: errorMessage },
    { status: 500 }
  )
}

// ❌ Bad - No error handling
const result = await dangerousOperation()
return NextResponse.json({ data: result })
```

---

## DATABASE ACCESS

### Use Proper Client

```typescript
// ✅ Good - Use Supabase client with RLS
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data, error } = await supabase
  .from('job_applications')
  .select('*')
  .eq('candidate_id', candidateId)

// ✅ Good - Use database abstraction layer for complex queries
import { getApplicationsByCandidate } from '@/lib/db/applications'

const applications = await getApplicationsByCandidate(candidateId)

// ❌ Bad - Direct SQL without RLS
const { data } = await supabase
  .rpc('execute_sql', { query: 'SELECT * FROM job_applications' })
```

### Respect The Recruiter Gate

```typescript
// ✅ Good - Check released_to_client
const { data } = await supabase
  .from('job_applications')
  .select('*')
  .eq('job_id', jobId)
  .eq('released_to_client', true)  // Only show released apps to client

// ❌ Bad - Ignoring the gate
const { data } = await supabase
  .from('job_applications')
  .select('*')
  .eq('job_id', jobId)  // Client sees ALL applications
```

---

## COMMENTS

### When to Comment

```typescript
// ✅ Good - Explain WHY
// The Recruiter Gate prevents clients from seeing applications
// until a recruiter has reviewed and approved them
if (!application.released_to_client && userRole === 'client') {
  return null
}

// ❌ Bad - Explain WHAT (obvious from code)
// Check if released to client is false and user role is client
if (!application.released_to_client && userRole === 'client') {
  return null
}
```

### Complex Logic

```typescript
// ✅ Good - Explain complex logic
// Calculate days until offer expires, accounting for weekends
// Business rule: Offers are only valid on business days
const businessDays = calculateBusinessDaysUntil(offer.expires_at)
if (businessDays <= 0) {
  offer.status = 'expired'
}

// ❌ Bad - No explanation for complex logic
const businessDays = calculateBusinessDaysUntil(offer.expires_at)
if (businessDays <= 0) {
  offer.status = 'expired'
}
```

---

## FILE ORGANIZATION

### Group by Feature

```
✅ Good:
src/
├── app/
│   ├── candidate/
│   │   ├── profile/
│   │   ├── applications/
│   │   └── jobs/
│   └── recruiter/
│       ├── applications/
│       ├── talent/
│       └── pipeline/
├── components/
│   ├── candidate/
│   │   ├── CandidateSidebar.tsx
│   │   └── ProfileCard.tsx
│   └── recruiter/
│       ├── RecruiterSidebar.tsx
│       └── ApplicationCard.tsx

❌ Bad:
src/
├── components/
│   ├── sidebars/
│   │   ├── CandidateSidebar.tsx
│   │   └── RecruiterSidebar.tsx
│   └── cards/
│       ├── ProfileCard.tsx
│       └── ApplicationCard.tsx
```

---

## REACT HOOKS

### Custom Hooks

```typescript
// ✅ Good - Custom hook
export function useApplications(candidateId: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications(candidateId)
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [candidateId])

  return { applications, loading, error }
}

// Usage
const { applications, loading, error } = useApplications(candidateId)
```

### Dependency Arrays

```typescript
// ✅ Good - All dependencies included
useEffect(() => {
  if (userId && jobId) {
    fetchApplication(userId, jobId)
  }
}, [userId, jobId])

// ❌ Bad - Missing dependencies
useEffect(() => {
  if (userId && jobId) {
    fetchApplication(userId, jobId)
  }
}, []) // Missing userId and jobId
```

---

## SECURITY

### Always Check Permissions

```typescript
// ✅ Good - Check user role
export async function GET(request: Request) {
  const user = await getUser(request)
  
  if (user.role !== 'recruiter' && user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }
  
  // Proceed with operation
}

// ❌ Bad - No permission check
export async function GET(request: Request) {
  // Directly return data without checking permissions
  const data = await fetchData()
  return NextResponse.json({ data })
}
```

### Never Expose Sensitive Data

```typescript
// ✅ Good - Sanitize data
const candidateForClient = {
  id: candidate.id,
  fullName: candidate.fullName,
  headline: candidate.headline,
  experienceYears: candidate.experienceYears
  // Do NOT include email, phone for unreleased applications
}

// ❌ Bad - Exposing sensitive data
return candidate  // Includes email, phone, etc.
```

---

## PERFORMANCE

### Avoid Unnecessary Re-renders

```typescript
// ✅ Good - Memoize expensive computations
const sortedApplications = useMemo(() => {
  return applications.sort((a, b) => 
    new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
  )
}, [applications])

// ❌ Bad - Compute on every render
const sortedApplications = applications.sort((a, b) => 
  new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
)
```

### Use Callbacks

```typescript
// ✅ Good - Memoize callback
const handleClick = useCallback((id: string) => {
  selectApplication(id)
}, [selectApplication])

// ❌ Bad - New function on every render
const handleClick = (id: string) => {
  selectApplication(id)
}
```

---

## TESTING

### Test Checklist

Before pushing code:

- [ ] Tested with appropriate user role
- [ ] Tested error states
- [ ] Tested loading states
- [ ] Checked browser console for errors
- [ ] Verified database updates
- [ ] Tested on mobile viewport
- [ ] Verified permissions/access control

### Manual Testing

```typescript
// Always test with real data
// Use test accounts from .agent/TESTING_PROTOCOLS.md

// Test Recruiter Gate:
// 1. Create application (should be unreleased)
// 2. Login as client - should NOT see application
// 3. Login as recruiter - release application
// 4. Login as client - should NOW see application
```

---

## GIT COMMITS

### Commit Messages

```bash
✅ Good:
feat: Add video call sharing controls
fix: Recruiter gate not enforcing on client view
refactor: Extract application card logic to hooks
docs: Update API documentation for offers endpoint

❌ Bad:
update stuff
fix bug
changes
wip
```

### Commit Structure

```bash
# Format:
<type>: <subject>

# Types:
feat     - New feature
fix      - Bug fix
refactor - Code refactoring
docs     - Documentation
style    - Code style (formatting, etc.)
test     - Adding tests
chore    - Maintenance (deps, config, etc.)
```

---

## COMMON PATTERNS

### API Response

```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

### Loading States

```typescript
interface LoadingState<T> {
  data: T | null
  loading: boolean
  error: string | null
}
```

### Form Handling

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    email: '',
    password: ''
  }
})
```

---

## DON'TS

### Never Do This

```typescript
// ❌ Never use 'any' without good reason
function processData(data: any) { }

// ❌ Never ignore errors silently
try {
  await operation()
} catch (error) {
  // Silent failure
}

// ❌ Never hardcode sensitive data
const API_KEY = 'sk-1234567890'  // Use environment variables!

// ❌ Never bypass security checks
if (isDevelopment) {
  // Skip auth check
}

// ❌ Never expose internal implementation details
// in error messages shown to users
catch (error) {
  throw new Error(`Database query failed: ${error.sqlMessage}`)
}
```

---

**Last Updated**: January 15, 2026  
**Maintained By**: BPOC Development Team
