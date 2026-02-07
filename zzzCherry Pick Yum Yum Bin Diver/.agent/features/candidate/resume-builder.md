# 📋 RESUME BUILDER SYSTEM DOCUMENTATION

> ⚠️ **READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES TO THE RESUME BUILDER**
> 
> This system has been thoroughly audited and documented. If you pull this commit and start changing things without reading this, you WILL break something. Don't be that person.

---

## 🎯 Overview

The BPOC Resume Builder is a 3-step AI-powered resume creation system that:
1. **Extracts** data from uploaded resumes (PDF, DOC, DOCX, Images)
2. **Analyzes** with Claude AI for improvements and scoring
3. **Builds** a customizable, shareable resume

**Live URL:** `https://bpoc.io/candidate/resume`

---

## ✅ CURRENT STATUS: FULLY WORKING

| Component | Status | Last Verified |
|-----------|--------|---------------|
| Upload & Extract | ✅ WORKING | Dec 18, 2024 |
| AI Analysis | ✅ WORKING | Dec 18, 2024 |
| Resume Builder | ✅ WORKING | Dec 18, 2024 |
| Save to Database | ✅ WORKING | Dec 18, 2024 |
| Public Resume View | ✅ WORKING | Dec 18, 2024 |
| PDF Export | ✅ WORKING | Dec 18, 2024 |
| Social Sharing | ✅ WORKING | Dec 18, 2024 |

---

## 📂 File Structure

```
src/app/(candidate)/candidate/resume/
├── page.tsx                    # Overview/status page
├── upload/page.tsx             # Step 1: Upload & Extract
├── analysis/page.tsx           # Step 2: AI Analysis
└── build/page.tsx              # Step 3: Build & Customize (2500+ lines)

src/app/api/candidates/
├── resume/
│   ├── save-extracted/route.ts  # Save extracted data
│   ├── save-generated/route.ts  # Save built resume
│   ├── save-final/route.ts      # (Unused - kept for reference)
│   └── process/route.ts         # Process uploaded file
├── ai-analysis/
│   ├── analyze/route.ts         # Run Claude AI analysis
│   └── save/route.ts            # Save analysis results

src/app/api/user/
├── resume-status/route.ts       # Check user's progress
├── resume-for-build/route.ts    # Get data for build page
└── extracted-resume/route.ts    # Get extracted data

src/app/api/get-saved-resume/[slug]/route.ts  # PUBLIC resume viewing

src/app/resume/[slug]/page.tsx   # Public resume display page

src/lib/
├── utils.ts                     # Contains processResumeFile() - 4000+ lines
└── db/candidates/
    └── sync-from-analysis.ts    # Syncs to structured tables
```

---

## 🗄️ Database Tables Used

All tables are in **Supabase** (NOT Railway - that's deprecated).

### Primary Tables

| Table | Purpose | When Populated |
|-------|---------|----------------|
| `candidate_resumes` | Main resume storage | Step 1 (upload) + Step 3 (build) |
| `candidate_ai_analysis` | AI analysis results & scores | Step 2 (analysis) |

### Structured Data Tables (Auto-synced from AI Analysis)

| Table | Purpose | When Populated |
|-------|---------|----------------|
| `candidate_skills` | Skills extracted from resume | Step 2 (via syncAllFromAnalysis) |
| `candidate_educations` | Education history | Step 2 (via syncAllFromAnalysis) |
| `candidate_work_experiences` | Work history | Step 2 (via syncAllFromAnalysis) |

### Table Schema Reference

```sql
-- candidate_resumes
CREATE TABLE candidate_resumes (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  resume_data JSONB NOT NULL,        -- Extracted data from Step 1
  generated_data JSONB,              -- Built/customized data from Step 3
  template_used TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- candidate_ai_analysis
CREATE TABLE candidate_ai_analysis (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id),
  session_id TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  ats_compatibility_score INTEGER,
  content_quality_score INTEGER,
  professional_presentation_score INTEGER,
  key_strengths JSONB,
  improvements JSONB,
  recommendations JSONB,
  improved_summary TEXT,
  skills_snapshot JSONB,
  experience_snapshot JSONB,
  education_snapshot JSONB,
  -- ... more fields
);
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RESUME BUILDER FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: UPLOAD (/candidate/resume/upload)                                  │
│  ─────────────────────────────────────────                                  │
│  User uploads file (PDF/DOC/DOCX/Image)                                     │
│       │                                                                     │
│       ▼                                                                     │
│  processResumeFile() in src/lib/utils.ts                                    │
│       │                                                                     │
│       ├── CloudConvert API → Convert to JPEG                                │
│       ├── GPT Vision OCR → Extract text from images                         │
│       ├── Create organized DOCX                                             │
│       └── Convert to structured JSON                                        │
│       │                                                                     │
│       ▼                                                                     │
│  Signed In User:                                                            │
│       └── POST /api/candidates/resume/save-extracted                        │
│           └── Saves to: candidate_resumes.resume_data                       │
│                                                                             │
│  Guest User:                                                                │
│       └── localStorage: anon_extracted_resume                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 2: AI ANALYSIS (/candidate/resume/analysis)                           │
│  ────────────────────────────────────────────────                           │
│  Load extracted data from DB or localStorage                                │
│       │                                                                     │
│       ▼                                                                     │
│  POST /api/candidates/ai-analysis/analyze                                   │
│       │                                                                     │
│       ├── Claude AI (claude-sonnet-4-20250514) analyzes resume              │
│       ├── Generates scores (overall, ATS, content, presentation)            │
│       ├── Identifies strengths & improvements                               │
│       └── Creates improved summary                                          │
│       │                                                                     │
│       ▼                                                                     │
│  Saves to: candidate_ai_analysis table                                      │
│       │                                                                     │
│       ▼                                                                     │
│  syncAllFromAnalysis() runs automatically:                                  │
│       ├── candidate_skills (upsert from skills_snapshot)                    │
│       ├── candidate_educations (upsert from education_snapshot)             │
│       └── candidate_work_experiences (upsert from experience_snapshot)      │
│       │                                                                     │
│       ▼                                                                     │
│  localStorage updated:                                                      │
│       ├── bpoc_generated_resume (improved resume data)                      │
│       ├── bpoc_ai_analysis (analysis results)                               │
│       └── bpoc_extracted_data (original extracted data)                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 3: BUILD (/candidate/resume/build)                                    │
│  ────────────────────────────────────────                                   │
│  Load data from localStorage first, then API fallback                       │
│       │                                                                     │
│       ▼                                                                     │
│  User customizes:                                                           │
│       ├── Edit content (name, summary, experience, etc.)                    │
│       ├── Select template (Modern/Executive/Creative/Minimal)               │
│       ├── Choose color scheme or custom colors                              │
│       ├── Upload/crop profile photo                                         │
│       └── AI-assist improvements                                            │
│       │                                                                     │
│       ▼                                                                     │
│  Save button → POST /api/candidates/resume/save-generated                   │
│       │                                                                     │
│       ├── Uploads photo to Supabase storage (if data URL)                   │
│       └── Saves to: candidate_resumes.generated_data                        │
│       │                                                                     │
│       ▼                                                                     │
│  Returns: { slug: "abc123-1234567890" }                                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PUBLIC VIEW (/resume/[slug])                                               │
│  ────────────────────────────                                               │
│  GET /api/get-saved-resume/[slug]                                           │
│       │                                                                     │
│       ├── Fetches from candidate_resumes (by slug)                          │
│       ├── Joins with candidates table for user info                         │
│       ├── Joins with candidate_profiles for location/position               │
│       ├── Increments view_count (non-blocking)                              │
│       └── Returns: generated_data || resume_data                            │
│       │                                                                     │
│       ▼                                                                     │
│  Renders beautiful resume with:                                             │
│       ├── Header with photo & contact info                                  │
│       ├── Professional summary                                              │
│       ├── Work experience with achievements                                 │
│       ├── Education                                                         │
│       ├── Skills (technical, soft, languages)                               │
│       ├── Certifications & Projects                                         │
│       └── Social sharing (Facebook, LinkedIn, Copy Link)                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 API Keys Required

| Service | Env Variable | Purpose |
|---------|--------------|---------|
| OpenAI | `OPENAI_API_KEY` | GPT Vision OCR for text extraction |
| CloudConvert | `CLOUDCONVERT_API_KEY` | File conversion (PDF/DOC → JPEG) |
| Anthropic | `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` | AI analysis with Claude |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database & storage |

---

## 📦 localStorage Keys Used

| Key | Purpose | Set In |
|-----|---------|--------|
| `anon_session_id` | Guest session tracking | upload/page.tsx |
| `anon_extracted_resume` | Guest extracted data | upload/page.tsx |
| `bpoc_processed_resumes` | Backup extracted data | upload/page.tsx |
| `bpoc_generated_resume` | Working resume data for build | analysis/page.tsx |
| `bpoc_ai_analysis` | AI analysis results | analysis/page.tsx |
| `bpoc_extracted_data` | Original extracted data reference | analysis/page.tsx |

---

## 🐛 Known Issues & Considerations

### 1. Guest Data Migration
**Status:** Not implemented
**Issue:** When a guest user signs up, their localStorage data is NOT automatically migrated to the database.
**Workaround:** Guest users must re-upload their resume after signing up.
**Future Fix:** Add a hook to migrate localStorage → database on signup.

### 2. Large Build Page
**Status:** Works but large
**Issue:** `build/page.tsx` is 2500+ lines with complex template logic.
**Consideration:** Could be refactored into smaller components, but it works.

### 3. Unused save-final Route
**Status:** Not critical
**Issue:** `/api/candidates/resume/save-final/route.ts` exists but is never called.
**Note:** `save-generated` handles the same functionality. Can be removed or kept for future use.

---

## ✅ Recent Fixes (Dec 18, 2024)

### Critical Fix: Public Resume API Migration
**Commit:** `62ea79d`
**Issue:** `/api/get-saved-resume/[slug]` was using old Railway database connection
**Fix:** Migrated to use `supabaseAdmin` with correct table joins
```diff
- import pool from '@/lib/database'
+ import { supabaseAdmin } from '@/lib/supabase/admin'

- LEFT JOIN users u ON cr.candidate_id = u.id
+ // Now queries candidates + candidate_profiles tables
```

---

## 🧪 Testing Checklist

Before deploying changes to the resume builder, verify:

- [ ] Upload page accepts PDF, DOC, DOCX, and images
- [ ] Extraction shows progress and console logs
- [ ] AI Analysis runs and shows scores
- [ ] Build page loads resume data
- [ ] Template switching works
- [ ] Color customization works
- [ ] Photo upload/crop works
- [ ] Save button works (check network tab)
- [ ] Public resume URL works: `/resume/[slug]`
- [ ] PDF export works
- [ ] Facebook/LinkedIn sharing works

---

## 🚫 DO NOT

1. **DO NOT** change the database connection from Supabase back to Railway
2. **DO NOT** modify `processResumeFile()` without understanding the full pipeline
3. **DO NOT** remove the sync functions without updating dependent features
4. **DO NOT** change table names/schemas without updating all related APIs
5. **DO NOT** skip testing the public resume view after changes

---

## 📞 Support

If something breaks:
1. Check the browser console for errors
2. Check the Vercel function logs
3. Check Supabase logs for database errors
4. Verify all environment variables are set
5. Read this documentation again

---

**Last Updated:** December 18, 2024
**Audited By:** Claude AI Assistant
**Status:** ✅ Fully Operational







