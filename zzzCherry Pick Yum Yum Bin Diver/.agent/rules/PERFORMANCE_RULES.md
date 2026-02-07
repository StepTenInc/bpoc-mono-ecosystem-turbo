# BPOC Performance Rules

> **Performance optimization guidelines**
> 
> Last Updated: January 15, 2026

---

## DATABASE QUERIES

### Use Indexes

Ensure queries use proper indexes:

```sql
-- ✅ Good - Uses index
SELECT * FROM job_applications 
WHERE candidate_id = '123'  -- idx_applications_candidate

-- ✅ Good - Uses composite index
SELECT * FROM job_applications 
WHERE job_id = '456' AND status = 'shortlisted'
```

### Avoid N+1 Queries

```typescript
// ✅ Good - Single query with joins using Supabase
const { data: applications } = await supabase
  .from('job_applications')
  .select(`
    *,
    candidate:candidates(*),
    job:jobs(*, client:clients(*))
  `)

// ❌ Bad - N+1 queries
const { data: applications } = await supabase
  .from('job_applications')
  .select('*')
  
for (const app of applications) {
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', app.candidate_id)
    .single()
  // This creates N additional queries!
}
```

### Limit Results

```typescript
// ✅ Good - Paginate
const applications = await supabase
  .from('job_applications')
  .select('*')
  .range(0, 19)  // First 20 results

// ❌ Bad - Fetch everything
const applications = await supabase
  .from('job_applications')
  .select('*')
  // Could return thousands of rows!
```

---

## REACT PERFORMANCE

### Memoization

```typescript
// ✅ Good - Memoize expensive computations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.score - b.score)
}, [data])

// ✅ Good - Memoize callbacks
const handleClick = useCallback((id: string) => {
  selectItem(id)
}, [selectItem])
```

### Avoid Unnecessary Re-renders

```typescript
// ✅ Good - React.memo for pure components
export const CandidateCard = React.memo(({ candidate }: Props) => {
  return <div>{candidate.name}</div>
})

// ✅ Good - Split components
// Instead of one large component, split into smaller ones
// that only re-render when their props change
```

---

## API RESPONSES

### Only Return Needed Data

```typescript
// ✅ Good - Select specific fields
const { data } = await supabase
  .from('candidates')
  .select('id, full_name, headline, experience_years')

// ❌ Bad - Return everything
const { data } = await supabase
  .from('candidates')
  .select('*')  // Returns ALL columns including large JSONB fields
```

### Use Compression

```typescript
// API routes automatically use gzip compression in production
// Ensure large responses are compressed
```

---

## IMAGES AND FILES

### Optimize Images

- Use Next.js Image component
- Serve appropriate sizes
- Use modern formats (WebP)

```typescript
// ✅ Good - Optimized image
import Image from 'next/image'

<Image 
  src={candidate.avatar} 
  width={100} 
  height={100}
  alt={candidate.name}
/>
```

### Lazy Load

```typescript
// ✅ Good - Lazy load components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />
})
```

---

## MONITORING

### Key Metrics

Monitor these metrics:

- Page load time (target: < 2s)
- API response time (target: < 500ms)
- Time to First Byte (TTFB)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

---

**Last Updated**: January 15, 2026  
**Maintained By**: BPOC Development Team
