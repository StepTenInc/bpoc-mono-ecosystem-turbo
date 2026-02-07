# Database Structure Recommendation: JSON vs Structured Tables

## The Question
Should we populate `candidate_skills`, `candidate_work_experiences`, and `candidate_educations` from `candidate_ai_analysis`, or just store everything in JSON?

## Answer: **Hybrid Approach** (Best of Both Worlds)

### ✅ **Use Separate Tables When:**
1. **Job Matching** - Matching `job_skills` to `candidate_skills`
2. **Search/Filtering** - "Find candidates with Python + 3+ years experience"
3. **Analytics** - "Most common skills", "Average years of experience"
4. **Structured Updates** - Candidate manually adds/edits a skill

### ✅ **Use JSON Snapshots When:**
1. **Historical Record** - What the AI analyzed at a specific point in time
2. **Full Context** - Complete resume data with all details
3. **Resume Display** - Showing the full resume to users
4. **Simplicity** - Don't need complex queries

## Recommended Approach

### 1. **Store in Both Places**

```typescript
// After AI analysis completes:
// 1. Save full snapshot to candidate_ai_analysis (JSON)
await saveAIAnalysis({
  candidate_id: userId,
  skills_snapshot: extractedSkills,      // Full JSON
  experience_snapshot: extractedExp,     // Full JSON
  education_snapshot: extractedEdu,       // Full JSON
  // ... other analysis data
})

// 2. Sync structured data to separate tables (for queries)
await syncAllFromAnalysis(userId, {
  skills_snapshot: extractedSkills,
  experience_snapshot: extractedExp,
  education_snapshot: extractedEdu,
})
```

### 2. **When to Sync**

**Option A: Always Sync** (Recommended if you have job matching)
- Sync immediately after AI analysis
- Keeps tables always up-to-date
- Use for: Job matching, search, analytics

**Option B: Lazy Sync** (If you don't need it yet)
- Only sync when needed (e.g., when job matching runs)
- Saves writes if you're not using the features yet
- Can add later when you need it

**Option C: Skip Sync** (If you don't need structured queries)
- Just use JSON snapshots
- Simpler code, less maintenance
- Can add sync later if needed

## Implementation

I've created `src/lib/db/candidates/sync-from-analysis.ts` with utility functions:

```typescript
import { syncAllFromAnalysis } from '@/lib/db/candidates/sync-from-analysis'

// After saving AI analysis:
await syncAllFromAnalysis(candidateId, {
  skills_snapshot: analysisData.skills_snapshot,
  experience_snapshot: analysisData.experience_snapshot,
  education_snapshot: analysisData.education_snapshot,
})
```

## Decision Matrix

| Feature Needed | Use Separate Tables? |
|---------------|---------------------|
| Job matching by skills | ✅ YES |
| Search candidates by skills | ✅ YES |
| Filter candidates by experience | ✅ YES |
| Analytics/reporting | ✅ YES |
| Just display resume | ❌ NO (JSON is fine) |
| Historical record | ❌ NO (JSON is fine) |

## My Recommendation

**Start with JSON-only** (simpler), then **add sync when you need job matching**.

The tables are already set up, so you can:
1. ✅ Use JSON snapshots for now (simpler)
2. ✅ Add sync function when you build job matching
3. ✅ Keep both - JSON for display, tables for queries

This gives you flexibility without over-engineering upfront.


