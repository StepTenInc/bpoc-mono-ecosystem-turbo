# Clean API Routes

**Starting Fresh:** 2024-12-05

All routes use Supabase database via abstraction layer in `/src/lib/db/`

## Structure

```
/api/
├── candidates/          # Candidate management
├── jobs/               # Job postings
├── applications/       # Job applications
├── resumes/           # Resume management
├── assessments/       # DISC, Typing, etc.
└── admin/             # Admin operations
```

## Rules

1. **ALWAYS** use abstraction layer from `/src/lib/db/`
2. **NEVER** use `pool.query()` or direct database access
3. **NEVER** import from `@/lib/database`
4. **ALWAYS** use Supabase via abstraction layer
5. Keep routes simple and focused

## Available Abstraction Layers

- `@/lib/db/candidates` - Candidate CRUD
- `@/lib/db/profiles` - Profile management
- `@/lib/db/resumes` - Resume operations
- `@/lib/db/jobs` - Job operations
- `@/lib/db/applications` - Application management
- `@/lib/db/assessments` - Assessment data
- `@/lib/db/matches` - Job matching

## Example Route

```typescript
import { getCandidateById } from '@/lib/db/candidates'
import { getProfileByCandidate } from '@/lib/db/profiles'

export async function GET(request: NextRequest) {
  const candidate = await getCandidateById(id)
  const profile = await getProfileByCandidate(id)
  return NextResponse.json({ candidate, profile })
}
```



















