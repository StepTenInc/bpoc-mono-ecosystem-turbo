# BPOC.IO AI Insights System - Complete Reference Guide

**Created**: January 30, 2026  
**Last Updated**: January 30, 2026  
**Branch Merged**: `emman-insights-updated` → `main`  
**Latest Commit**: `4ff7b2a`

---

## Table of Contents

1. [System Overview](#system-overview)
2. [8-Stage AI Content Pipeline](#8-stage-ai-content-pipeline)
3. [Content Silo Structure](#content-silo-structure)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Key Components](#key-components)
7. [SEO Infrastructure](#seo-infrastructure)
8. [Recent Merge Summary](#recent-merge-summary)
9. [Verification Status](#verification-status)

---

## System Overview

The BPOC.IO Insights system is a full-stack, AI-powered content generation platform designed for SEO-optimized articles targeting Filipino BPO professionals.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15.4.8 (App Router) |
| Database | Supabase (PostgreSQL) |
| AI Models | Claude (Anthropic), Grok (X.AI), DALL-E/Imagen (OpenAI/Google) |
| Research | Serper API (Google search) |
| Styling | TailwindCSS + Framer Motion |
| Deployment | Vercel |

### Key URLs

| Environment | URL |
|-------------|-----|
| Production | https://www.bpoc.io |
| Local Dev | http://localhost:3001 |
| Insights Home | `/insights` |
| Admin Dashboard | `/admin/insights` |
| Article Pipeline | `/admin/insights/create` |

---

## 8-Stage AI Content Pipeline

Located at: `/admin/insights/create`

### Stage Overview

| Stage | Name | AI Model | Purpose |
|-------|------|----------|---------|
| 1 | **Brief** | - | Voice input, silo selection, topic confirmation |
| 2 | **Research** | Serper API | Google search, competitor analysis, link opportunities |
| 3 | **Plan** | Claude | Article structure, outline, FAQs, keyword strategy |
| 4 | **Write** | Claude Opus 4 | Full article in markdown (Ate Yna persona) |
| 5 | **Humanize** | Grok (X.AI) | Bypass AI detection, add personality |
| 6 | **SEO** | Claude Sonnet 4 | Keyword optimization, internal link injection |
| 7 | **Meta** | GPT-4o | Meta tags, schema markup, hero image/video generation |
| 8 | **Publish** | - | Final review and publish to live site |

### Pipeline Files

```
src/app/(admin)/admin/insights/create/
├── page.tsx           # Main pipeline orchestrator
├── types.ts           # PipelineState interface, silo definitions
└── stages/            # Individual stage components
```

### Pipeline State Interface

```typescript
interface PipelineState {
  currentStage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  brief: { topic, silo, voiceInput, confirmedBrief };
  research: { serperResults, perplexityResults, validatedLinks };
  plan: { outline, keywords, structure, faqs };
  article: { markdown, html, metrics };
  humanized: { content, aiDetectionScore };
  seo: { optimizedContent, internalLinks, rankMathScore };
  meta: { title, description, ogImage, schema };
  media: { heroImage, heroVideo, sectionImages };
}
```

---

## Content Silo Structure

### 8 Content Silos

| Silo | Slug | Icon | Color | Description |
|------|------|------|-------|-------------|
| Salary & Compensation | `bpo-salary-compensation` | DollarSign | #10B981 | Pay scales, benefits, negotiations |
| Career Growth | `bpo-career-growth` | TrendingUp | #3B82F6 | Promotions, leadership development |
| BPO Jobs | `bpo-jobs` | Briefcase | #8B5CF6 | Job opportunities, hiring trends |
| Interview Tips | `interview-tips` | MessageSquare | #F59E0B | Interview prep, common questions |
| Company Reviews | `bpo-company-reviews` | Building2 | #EC4899 | BPO company insights |
| Employment Guide | `bpo-employment-guide` | FileText | #14B8A6 | DOLE regulations, labor laws |
| Training | `training-and-certifications` | GraduationCap | #6366F1 | Skills development, certifications |
| Work-Life Balance | `work-life-balance` | Heart | #F43F5E | Remote work, wellness tips |

### Silo Page Structure

Each silo has:
- **Pillar Page**: Hub content at `/insights/{silo-slug}`
- **Supporting Articles**: Long-tail content at `/insights/{silo-slug}/{article-slug}`

### Silo Landing Page Files

```
src/app/insights/
├── bpo-salary-compensation/
│   ├── page.tsx
│   ├── SalarySiloClient.tsx
│   └── [slug]/page.tsx
├── bpo-career-growth/
│   ├── page.tsx
│   ├── CareerSiloClient.tsx
│   └── [slug]/page.tsx
├── bpo-jobs/
├── interview-tips/
├── bpo-company-reviews/
├── bpo-employment-guide/
├── training-and-certifications/
└── work-life-balance/
```

---

## Database Schema

### Core Tables

#### `insights_posts`
```sql
id UUID PRIMARY KEY
title TEXT
slug TEXT UNIQUE
content TEXT
description TEXT
category TEXT
author TEXT DEFAULT 'Ate Yna'
read_time TEXT
is_published BOOLEAN DEFAULT false
published_at TIMESTAMP
hero_url TEXT
hero_video_url TEXT
section_images JSONB
applied_links JSONB
pipeline_stage INTEGER
silo_id UUID REFERENCES insights_silos(id)
is_pillar BOOLEAN DEFAULT false
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `insights_silos`
```sql
id UUID PRIMARY KEY
name TEXT
slug TEXT UNIQUE
description TEXT
context TEXT
icon TEXT
color TEXT
hero_image TEXT
seo_title TEXT
seo_description TEXT
seo_keywords TEXT[]
is_active BOOLEAN DEFAULT true
sort_order INTEGER
pillar_post_id UUID REFERENCES insights_posts(id)
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `seo_metadata`
```sql
id UUID PRIMARY KEY
post_id UUID REFERENCES insights_posts(id)
meta_title TEXT
meta_description TEXT
keywords TEXT[]
canonical_url TEXT
og_image TEXT
schema_data JSONB
created_at TIMESTAMP
```

#### `internal_links`
```sql
id UUID PRIMARY KEY
source_post_id UUID REFERENCES insights_posts(id)
target_post_id UUID REFERENCES insights_posts(id)
anchor_text TEXT
link_type TEXT (related, pillar, cluster)
created_at TIMESTAMP
```

---

## API Routes

### Silo Management

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/silos` | Public - List silos with article counts |
| GET | `/api/silos/[slug]` | Public - Get silo by slug with articles |
| GET | `/api/admin/silos` | Admin - Full silo list |
| POST | `/api/admin/silos` | Admin - Create silo |
| PUT | `/api/admin/silos/[id]` | Admin - Update silo |
| DELETE | `/api/admin/silos/[id]` | Admin - Delete silo |

### Pipeline Routes

| Route | Stage | Description |
|-------|-------|-------------|
| `/api/admin/insights/pipeline/generate-brief` | 1 | Process voice input |
| `/api/admin/insights/pipeline/research` | 2 | Serper + Perplexity research |
| `/api/admin/insights/pipeline/generate-plan` | 3 | Claude plan generation |
| `/api/admin/insights/pipeline/write-article` | 4 | Claude article writing |
| `/api/admin/insights/pipeline/humanize` | 5 | Grok humanization |
| `/api/admin/insights/pipeline/seo-optimize` | 6 | SEO optimization |
| `/api/admin/insights/pipeline/generate-meta` | 7 | Meta tag generation |
| `/api/admin/insights/publish` | 8 | Publish article |

### Image/Video Generation

| Route | Provider |
|-------|----------|
| `/api/admin/insights/generate-image-gemini` | Google Imagen |
| `/api/admin/insights/generate-image-leonardo` | Leonardo AI |
| `/api/admin/insights/generate-image-stability` | Stability AI |
| `/api/admin/insights/generate-image-runway` | Runway |
| `/api/admin/insights/generate-video-leonardo` | Leonardo Motion |
| `/api/admin/insights/generate-video-stability` | Stability AI Video |
| `/api/admin/insights/generate-alt-text` | AI alt text |
| `/api/admin/insights/save-hero-media` | Save hero media |
| `/api/admin/insights/save-alt-text` | Save alt text |

---

## Key Components

### Admin Components

| Component | Path | Purpose |
|-----------|------|---------|
| `InsightsEditor` | `src/components/admin/insights/InsightsEditor.tsx` | Full article editor |
| `SiloVisualization` | `src/components/admin/insights/SiloVisualization.tsx` | ReactFlow silo graph |
| `LinkManager` | `src/components/admin/insights/LinkManager.tsx` | Internal link management |
| `ArticleGenerator` | `src/components/admin/insights/ArticleGenerator.tsx` | Quick article generator |

### Public Components

| Component | Path | Purpose |
|-----------|------|---------|
| `InsightsPageClient` | `src/app/insights/InsightsPageClient.tsx` | Insights listing page |
| `InsightArticleClient` | `src/app/insights/[slug]/InsightArticleClient.tsx` | Article detail page |
| `SiloPageClient` | `src/app/insights/silo/[slug]/SiloPageClient.tsx` | Generic silo page |
| `StickySidebarCTA` | `src/components/insights/StickySidebarCTA.tsx` | Sidebar call-to-action |

### Services

| Service | Path | Purpose |
|---------|------|---------|
| `imagen-service.ts` | `src/lib/imagen-service.ts` | Google Imagen integration |
| `veo-service.ts` | `src/lib/veo-service.ts` | Google Veo video generation |

---

## SEO Infrastructure

### robots.txt

Location: `public/robots.txt`

**AI Crawlers Allowed**:
- GPTBot (ChatGPT/SearchGPT)
- ClaudeBot (Anthropic)
- Google-Extended (Gemini/Bard)
- PerplexityBot
- Copilot (Microsoft)
- CCBot (Common Crawl)

**Blocked Paths**: `/api/`, `/admin/`, `/candidate/`, `/_next/`

### Sitemap

Location: `src/app/sitemap.ts`

Dynamic sitemap including:
- Static pages (home, about, jobs, etc.)
- All insight articles
- Priority levels and change frequencies

### Schema Markup (JSON-LD)

| Page | Schema Type |
|------|-------------|
| `/insights` | CollectionPage + ItemList |
| `/insights/[slug]` | Article |

---

## Recent Merge Summary

### Branch: `emman-insights-updated` → `main`

**Merged**: January 30, 2026  
**Files Changed**: 105  
**Lines Added**: +23,192  
**Lines Removed**: -4,064

### Key Additions

1. **8 New Silo Landing Pages** with dedicated client components
2. **Google Imagen/Veo Integration** for AI image/video generation
3. **Multiple Image Generation APIs** (Gemini, Leonardo, Stability, Runway)
4. **Enhanced InsightsEditor** (+1010 lines)
5. **Upgraded SiloVisualization** with ReactFlow improvements
6. **StickySidebarCTA** component
7. **4 New Database Migrations**

### New Migration Files

```
supabase/migrations/
├── 20260127_add_section_images_to_insights_posts.sql
├── 20260128_add_pillar_posts.sql
├── 20260128_create_insights_silos.sql
└── 20260128_insights_silos_complete.sql
```

---

## Verification Status

### ✅ All Tests Passed (January 30, 2026)

| Component | Status | Notes |
|-----------|--------|-------|
| Public Insights Page | ✅ Pass | Renders category cards + article listings |
| Silo Landing Pages | ✅ Pass | All 8 silos render with professional UI |
| Article Detail Pages | ✅ Pass | Markdown rendering, links, related posts |
| Silo API (Public) | ✅ Pass | Returns 8 silos with article counts |
| Silo API (Admin) | ✅ Pass | Full CRUD functionality |
| Admin Authentication | ✅ Pass | Properly protected routes |
| Database Migrations | ✅ Pass | All tables created and populated |

### Current Article Counts by Silo

| Silo | Articles |
|------|----------|
| Salary & Compensation | 2 |
| Career Growth | 2 |
| BPO Jobs | 1 |
| Interview Tips | 0 |
| Company Reviews | 0 |
| Employment Guide | 0 |
| Training | 0 |
| Work-Life Balance | 0 |

---

## Git History (Recent Commits)

```
4ff7b2a 2026-01-30 10:18 fix: replace all remaining signup page links with modal triggers
f26390d 2026-01-30 10:18 fix: replace signup page links with modal triggers on job pages
bc518eb 2026-01-30 10:15 feat: redesign job detail pages with premium marketing-focused UI
83aa4e7 2026-01-30 09:22 feat: add SEO-optimized public jobs page with schema markup
d1bc477 2026-01-30 09:09 feat: rewrite About page with business-focused AI streamlining narrative
```

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Models
ANTHROPIC_API_KEY=        # Claude
XAI_API_KEY=              # Grok
OPENAI_API_KEY=           # GPT-4o, DALL-E
GOOGLE_AI_API_KEY=        # Gemini/Imagen/Veo

# Image Generation
LEONARDO_API_KEY=
STABILITY_API_KEY=
RUNWAY_API_KEY=

# Research
SERPER_API_KEY=
PERPLEXITY_API_KEY=
```

---

## Next Steps / TODO

1. **SEO Enhancements**
   - Add `llms.txt` for AI discoverability
   - Update sitemap to pull dynamically from Supabase
   - Add `JobPosting` schema to job pages
   - Add `FAQPage` and `BreadcrumbList` schemas

2. **Content**
   - Populate remaining silos with articles
   - Create pillar posts for empty silos

3. **Testing**
   - End-to-end pipeline test
   - Image/video generation verification
   - Link health monitoring

---

*Document generated for agent handoff. All systems verified and operational.*
