# BPOC Admin App Audit

> **Generated:** 2025-02-08
> **Focus:** Insights "No Hands" Content Pipeline

---

## Executive Summary

The BPOC Admin app contains a sophisticated **9-stage AI content pipeline** that can operate fully autonomously ("no hands"). The system uses:
- **Perplexity + Serper** for research
- **Claude Opus 4** for planning and writing
- **Grok** for humanization (AI detection bypass)
- **Claude Sonnet 4** for SEO optimization
- **GPT-4o** for meta generation
- **Google Veo 3.1 + Imagen 4** for video/image generation

The pipeline is triggered via a cron job that runs every 30 minutes, processing items from a production queue.

---

## 🎯 INSIGHTS "NO HANDS" PIPELINE (PRIORITY)

### Flow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INSIGHTS PRODUCTION QUEUE                         │
│  (insights_production_queue table with priority-based processing)    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CRON: /api/cron/insights-engine                   │
│  Runs every 30 minutes. Checks queue, triggers processing if idle.  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│           /api/admin/insights/production-queue/process               │
│  Picks highest-priority queued item, builds brief, calls pipeline    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│           /api/admin/insights/pipeline/orchestrate                   │
│              MASTER ORCHESTRATOR - Runs all 9 stages                 │
└─────────────────────────────────────────────────────────────────────┘
```

### The 9 Pipeline Stages

| Stage | Name | Model | File | Description |
|-------|------|-------|------|-------------|
| 1 | Brief | - | External (Wispr) | Voice-to-text brief recording |
| 2 | **Research** | Perplexity Sonar Pro + Serper | `pipeline/research/route.ts` | Dual-stage research: unique angles + competitor analysis |
| 3 | **Plan** | Claude Opus 4 | `pipeline/generate-plan/route.ts` | Keyword strategy, structure, word count targets |
| 4 | **Write** | Claude Sonnet 4 | `pipeline/write-article/route.ts` | Full article as "Ate Yna" personality (SSE streaming) |
| 5 | **Humanize** | Grok 3 Fast | `pipeline/humanize/route.ts` | AI detection bypass, 92%+ human score target |
| 6 | **SEO** | Claude Sonnet 4 | `pipeline/seo-optimize/route.ts` | RankMath optimization, internal linking |
| 7 | **Meta** | GPT-4o | `pipeline/generate-meta/route.ts` | Meta tags, Open Graph, Schema markup |
| 8 | **Finalize** | - | `pipeline/finalize/route.ts` | Quality checks, publish to `insights_posts` |
| 9 | **Media** | Google Veo 3.1 + Imagen 4 | `pipeline/generate-media/route.ts` | Hero video + 3 section images |

### Key Files Location

```
Old Monolith: ~/Desktop/bpoc-cherry-pick-backup/src/app/api/
├── cron/
│   └── insights-engine/route.ts          # Cron trigger (every 30 min)
└── admin/insights/
    ├── pipeline/
    │   ├── orchestrate/route.ts          # MASTER ORCHESTRATOR
    │   ├── research/route.ts             # Stage 2
    │   ├── generate-plan/route.ts        # Stage 3
    │   ├── write-article/route.ts        # Stage 4 (SSE streaming)
    │   ├── humanize/route.ts             # Stage 5
    │   ├── seo-optimize/route.ts         # Stage 6
    │   ├── generate-meta/route.ts        # Stage 7
    │   ├── finalize/route.ts             # Stage 8
    │   ├── generate-media/route.ts       # Stage 9
    │   ├── run/route.ts                  # Alternative orchestrator
    │   ├── ideas/route.ts                # Topic idea generation
    │   ├── list/route.ts                 # List pipelines
    │   ├── stats/route.ts                # Pipeline stats
    │   ├── cleanup/route.ts              # Cleanup stale pipelines
    │   ├── save-draft/route.ts           # Save progress
    │   ├── get-draft/route.ts            # Get draft
    │   ├── publish/route.ts              # Publish article
    │   ├── scan-links/route.ts           # Validate links
    │   ├── voice-personality/route.ts    # Ate Yna personality
    │   ├── improve-topic/route.ts        # Topic improvement
    │   ├── fix-brief/route.ts            # Fix brief issues
    │   ├── create-draft/route.ts         # Create draft post
    │   └── list-drafts/route.ts          # List drafts
    ├── production-queue/
    │   ├── route.ts                      # Queue CRUD operations
    │   └── process/route.ts              # NO HANDS ENGINE
    ├── silos/                            # Silo management
    ├── publish/route.ts                  # Manual publish
    ├── research/route.ts                 # Standalone research
    └── ... (15+ more routes)
```

---

## 📊 Database Tables Used

| Table | Purpose |
|-------|---------|
| `insights_production_queue` | Queue for automated article processing |
| `content_pipelines` | Pipeline state tracking (stages 1-9) |
| `insights_posts` | Published articles |
| `insights_silos` | Content silos (salary, career, jobs, etc.) |
| `article_embeddings` | Vector embeddings for semantic search |
| `targeted_keywords` | Keyword tracking per article |
| `seo_metadata` | Schema markup, meta tags |
| `article_links` | Internal link relationships |
| `humanization_patterns` | AI detection patterns learned |
| `personality_profiles` | Ate Yna personality config |

---

## 🔄 Automation Flow Details

### 1. Queue Population

Articles are added to `insights_production_queue` with:
```sql
{
  id, title, slug,
  silo_id, silo_name,
  level (PILLAR | SUPPORTING),
  target_keywords,
  content_summary,
  priority (1-10),
  status ('queued'),
  cluster_name
}
```

### 2. Cron Trigger

`/api/cron/insights-engine` runs every 30 minutes:
- Checks for queued items
- Checks if any are in progress
- If queued > 0 AND in_progress = 0 → triggers `/api/admin/insights/production-queue/process`

### 3. Processing Logic

`production-queue/process` does:
1. Picks highest priority `queued` item
2. Builds a brief from queue item data
3. Calls orchestrator with `autoPublish: true, forcePublish: true`
4. Updates queue status through stages: `research → idea → writing → humanizing → seo → media → publishing → published`
5. **AUTO-LOOPS**: After each article, checks for more queued items and triggers itself

### 4. Orchestrator Flow

`pipeline/orchestrate` runs all stages sequentially:
1. Creates `content_pipelines` entry
2. Runs research → plan → write → humanize → SEO → meta → finalize
3. Returns article data
4. Queue process then generates media (async-safe)
5. Marks queue item as `published`

---

## 📂 ALL ADMIN API ROUTES

### Root Admin Routes (33 folders)

| Folder | Routes | Purpose |
|--------|--------|---------|
| `agencies/` | CRUD + reassign-recruiter, remove-recruiter | Agency management |
| `analytics/` | funnel, overview, time-series, top-performers | Platform analytics |
| `applications/` | list, [id] | Application management |
| `audit-log/` | list | Audit trail |
| `billing/` | revenue | Billing data |
| `candidates/` | list, [id] | Candidate management |
| `carpet-bomb/` | import, leads, stats, test-send, track-visit | Email marketing |
| `check-status/` | health check | System status |
| `clients/` | list | Client management |
| `content-pipeline/` | create, delete, get, list, publish, update | Legacy pipeline |
| `counter-offers/` | list | Counter offer management |
| `dashboard/` | stats | Dashboard metrics |
| `errors/` | analyze, log, update | Error tracking |
| `export/` | revenue, users | Data export |
| `generate-matches/` | AI matching | Job-candidate matching |
| **`insights/`** | **18 routes** | **Content pipeline (PRIORITY)** |
| `interviews/` | list | Interview management |
| `jobs/` | batch, create | Job posting management |
| `login/` | auth | Admin login |
| `matches/` | stats | Match statistics |
| `notes/` | CRUD, [id] | Notes system |
| `notifications/` | batch, broadcast | Notification system |
| `offers/` | list | Offer management |
| `onboarding/` | list, [id], pending | Onboarding flows |
| `outbound/` | analytics, campaigns, contacts | Outbound marketing |
| `recruiters/` | [id], authorization-tree, bulk-verify | Recruiter management |
| `settings/` | organization | Platform settings |
| `signup/` | registration | Admin signup |
| `silos/` | CRUD, [id] | Silo management |
| `users/` | list, [id] | User management |
| `verify/` | verification | Verification system |

### Insights Routes (Detailed)

```
/api/admin/insights/
├── analyze/                    # Article analysis
├── generate-alt-text/          # AI alt text for images
├── generate-image/             # Legacy image gen
├── generate-image-gemini/      # Gemini image gen
├── generate-video/             # Legacy video gen
├── link-health/                # Link validation
├── links/                      # Link management
├── pipeline/                   # 22 sub-routes (see above)
├── production-queue/           # 2 sub-routes
│   ├── route.ts               # Queue CRUD
│   └── process/route.ts       # NO HANDS ENGINE
├── publish/                    # Manual publish
├── research/                   # Standalone research
├── save-alt-text/              # Save alt text
├── save-hero-media/            # Save hero media
├── scan-links/                 # Link scanner
├── update/                     # Update article
├── upload-image/               # Image upload
└── upload-video/               # Video upload
```

---

## 🖥️ NEW MONOREPO UI STATUS

### Admin App Structure (~/Desktop/bpoc-mono/apps/admin/src/app/)

| Path | Status | Notes |
|------|--------|-------|
| `/agencies/` | ✅ Present | Agency management |
| `/analytics/` | ✅ Present | Analytics dashboard |
| `/applications/` | ✅ Present | Application management |
| `/audit-log/` | ✅ Present | Audit log viewer |
| `/billing/` | ✅ Present | Billing management |
| `/candidates/` | ✅ Present | Candidate management |
| `/clients/` | ✅ Present | Client management |
| `/counter-offers/` | ✅ Present | Counter offers |
| `/errors/` | ✅ Present | Error dashboard |
| `/hr-assistant/` | ✅ Present | HR assistant |
| **`/insights/`** | ✅ Present | **Content pipeline UI** |
| `/insights/[id]/` | ✅ Present | Article detail |
| `/insights/create/` | ✅ Present | **Full creation wizard** |
| `/insights/create/components/` | ✅ Present | 11 component files |
| `/insights/prompts/` | ✅ Present | Prompt management |
| `/insights/silos/` | ✅ Present | Silo management |
| `/insights-new/` | ✅ Present | New insights version |
| `/interviews/` | ✅ Present | Interview management |
| `/jobs/` | ✅ Present | Job management |
| `/login/` | ✅ Present | Login page |
| `/notifications/` | ✅ Present | Notification center |
| `/offers/` | ✅ Present | Offer management |
| `/onboarding/` | ✅ Present | Onboarding |
| `/outbound/` | ✅ Present | Outbound marketing |
| `/outbound/analytics/` | ✅ Present | Outbound analytics |
| `/outbound/campaigns/` | ✅ Present | Campaign management |
| `/outbound/contacts/` | ✅ Present | Contact management |
| `/outbound/import/` | ✅ Present | Contact import |
| `/recruiters/` | ✅ Present | Recruiter management |
| `/settings/` | ✅ Present | Settings |
| `/settings/seo/` | ✅ Present | SEO settings |
| `/signup/` | ✅ Present | Signup page |
| `/users/` | ✅ Present | User management |

### Missing from Monorepo

- `/dashboard/` - Main dashboard stats (needs copy)
- `/carpet-bomb/` - Legacy email marketing (may be deprecated)
- `/matches/` - Match statistics (needs copy)

---

## 🔧 WHAT NEEDS TO BE COPIED

### Priority 1: Pipeline API Routes

```bash
# Copy entire insights pipeline directory
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/api/admin/insights/* \
      ~/Desktop/bpoc-mono/apps/admin/src/app/api/admin/insights/

# Copy cron jobs
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/api/cron/* \
      ~/Desktop/bpoc-mono/apps/admin/src/app/api/cron/
```

### Priority 2: Supporting Libraries

```bash
# Key libraries needed
~/Desktop/bpoc-cherry-pick-backup/src/lib/
├── error-logger.ts              # Error logging
├── parse-ai-json.ts             # AI JSON parsing
└── veo-service.ts               # Google Veo video
```

### Priority 3: Missing UI Routes

```bash
# Dashboard
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/(admin)/dashboard/* \
      ~/Desktop/bpoc-mono/apps/admin/src/app/dashboard/

# Matches (if needed)
cp -r ~/Desktop/bpoc-cherry-pick-backup/src/app/api/admin/matches/* \
      ~/Desktop/bpoc-mono/apps/admin/src/app/api/admin/matches/
```

---

## 💡 "NO HANDS" IMPROVEMENT IDEAS

### Current Automation Level: ~80%

The pipeline is already highly automated. Human intervention is only needed for:
1. Adding topics to the queue
2. Reviewing published content (optional)
3. Monitoring for failures

### Proposed Improvements

#### 1. **Auto-Queue from Search Trends** (HIGH VALUE)
```
Current: Manual topic queue population
Proposed: Daily cron that:
  - Queries Google Trends API for Philippine BPO topics
  - Queries Serper for "related searches"
  - Uses GPT-4o to select high-opportunity topics
  - Auto-adds to queue with priority scoring
```

Implementation:
```typescript
// /api/cron/insights-topic-discovery/route.ts
1. Query Google Trends for rising BPO/career topics
2. Query Serper for PAA (People Also Ask) questions
3. Score by: search volume, competition, silo fit
4. Filter: exclude duplicate/similar to existing articles
5. Auto-insert to insights_production_queue with priority
```

#### 2. **Auto-Publish Quality Gate** (MEDIUM VALUE)
```
Current: forcePublish=true (bypasses quality checks)
Proposed: Quality threshold auto-publish:
  - RankMath ≥ 85 → auto-publish
  - RankMath 70-84 → queue for review
  - RankMath < 70 → auto-retry with different parameters
```

#### 3. **Auto-Generate Images Without Review** (ALREADY DONE)
The current pipeline already generates images without human review. The media generation happens after publish and updates the article automatically.

#### 4. **Recruiter Verification Automation** (SEPARATE SYSTEM)
This is outside the insights pipeline but could benefit from automation:
```
Current: Manual recruiter verification
Proposed:
  - AI analyze LinkedIn profile
  - Cross-reference with company database
  - Auto-approve if confidence > 90%
  - Flag for human review if 70-90%
  - Auto-reject if < 70%
```

#### 5. **Content Refresh Automation** (HIGH VALUE)
```
Current: No automatic content refresh
Proposed: Monthly cron that:
  - Finds articles older than 6 months
  - Checks if still ranking well (via Search Console API)
  - If ranking dropped: re-run research + regenerate sections
  - Auto-update without full rewrite
```

#### 6. **Smart Internal Linking** (MEDIUM VALUE)
```
Current: Internal links suggested during SEO stage
Proposed: Post-publish pass that:
  - Finds all existing articles that should link TO the new article
  - Suggests anchor text and placement
  - Optionally: auto-insert links into older articles
```

#### 7. **A/B Title Testing** (LOW VALUE - Nice to Have)
```
Proposed:
  - Generate 3 title variants during planning
  - Create title experiment in analytics
  - After 2 weeks, auto-select winner
  - Update article title
```

---

## 🔐 Environment Variables Required

```env
# AI Models
CLAUDE_API_KEY=
OPENAI_API_KEY=
GROK_API_KEY=
PERPLEXITY_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Search
SERPER_API_KEY=

# Database
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
VERCEL_URL=
```

---

## 📊 Database Schema for Queue

```sql
CREATE TABLE insights_production_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  silo_id UUID REFERENCES insights_silos(id),
  silo_name TEXT,
  level TEXT CHECK (level IN ('PILLAR', 'SUPPORTING')),
  target_keywords TEXT,
  content_summary TEXT,
  cluster_name TEXT,
  priority INTEGER DEFAULT 5,
  status TEXT CHECK (status IN (
    'queued', 'research', 'idea', 'writing', 'humanizing', 
    'seo', 'media', 'publishing', 'published', 'failed', 'paused'
  )),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  insight_id UUID REFERENCES insights_posts(id),
  pipeline_id UUID REFERENCES content_pipelines(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ✅ Audit Complete

The BPOC Admin insights pipeline is:
- **Fully functional** in the old monolith
- **UI present** in the new monorepo
- **API routes need copying** to the new monorepo
- **Automation is at ~80%** - can be improved with topic discovery and content refresh

### Next Steps

1. Copy all `/api/admin/insights/` routes to monorepo
2. Copy cron jobs to monorepo
3. Copy supporting libraries (`lib/error-logger.ts`, `lib/parse-ai-json.ts`, `lib/veo-service.ts`)
4. Verify environment variables are set
5. Test pipeline end-to-end
6. Implement topic discovery automation (optional but high value)
