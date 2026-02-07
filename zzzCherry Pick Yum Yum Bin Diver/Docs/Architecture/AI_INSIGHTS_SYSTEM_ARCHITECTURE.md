# 🚀 AI-Powered Insights/Blog Admin System - Complete Architecture Guide

> **Purpose:** This document provides a complete blueprint for building an AI-powered content management system with automated article generation, SEO optimization, and internal linking strategy.
>
> **Original Implementation:** BPOC.IO Admin Insights (`/admin/insights`)
>
> **Reusable For:** ShoreAgents or any content-driven platform

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Required API Keys](#required-api-keys--env-variables)
4. [Database Schema](#database-schema)
5. [File Structure](#file-structure)
6. [API Routes Breakdown](#api-routes-breakdown)
7. [Key Components](#key-components)
8. [Content Generation Flow](#content-generation-flow)
9. [Content Silo Strategy](#content-silo-strategy)
10. [Customization Guide](#customization-guide-for-new-projects)
11. [Cost Estimates](#api-costs-estimate)
12. [Feature Recap](#feature-recap)

---

## Overview

This is a **full-stack AI content generation platform** featuring:

| Feature | Description |
|---------|-------------|
| 🤖 Multi-AI Generation | Claude for content, Grok for humanization |
| 🔍 Real-time Research | Google search via Serper API for stats & sources |
| 🎨 AI Hero Images | DALL-E 3 with permanent Supabase storage |
| 📊 SEO Monitoring | Health scores, orphan page detection |
| 🕸️ Silo Visualization | ReactFlow graph of content clusters |
| 🔗 Smart Linking | Auto-suggested internal links with tracking |

---

## Tech Stack & Dependencies

### Core Dependencies (package.json)

```json
{
  "dependencies": {
    // ═══════════════════════════════════════════
    // AI SERVICES
    // ═══════════════════════════════════════════
    "@anthropic-ai/sdk": "^0.60.0",    // Claude AI for content generation
    "openai": "^5.10.2",                // DALL-E 3 for hero images
    
    // ═══════════════════════════════════════════
    // DATABASE & STORAGE
    // ═══════════════════════════════════════════
    "@supabase/supabase-js": "^2.86.0", // Supabase client (DB + Storage)
    
    // ═══════════════════════════════════════════
    // UI FRAMEWORK
    // ═══════════════════════════════════════════
    "next": "15.4.8",                   // Next.js 15 (App Router)
    "react": "19.1.0",
    "tailwindcss": "^3.4.17",
    
    // ═══════════════════════════════════════════
    // UI COMPONENTS (Radix UI + shadcn/ui pattern)
    // ═══════════════════════════════════════════
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "lucide-react": "^0.525.0",         // Icons
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    
    // ═══════════════════════════════════════════
    // VISUALIZATION
    // ═══════════════════════════════════════════
    "reactflow": "^11.11.4",            // Content silo graph visualization
    
    // ═══════════════════════════════════════════
    // CONTENT RENDERING
    // ═══════════════════════════════════════════
    "react-markdown": "^10.1.0",        // Markdown rendering
    "rehype-raw": "^7.0.0",             // HTML in markdown
    "remark-gfm": "^4.0.1",             // GitHub Flavored Markdown
    
    // ═══════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════
    "date-fns": "^4.1.0",               // Date formatting
    "sonner": "^2.0.7"                  // Toast notifications
  }
}
```

### Install Command

```bash
npm install @anthropic-ai/sdk openai @supabase/supabase-js reactflow react-markdown rehype-raw remark-gfm date-fns lucide-react
```

---

## Required API Keys & ENV Variables

Create a `.env.local` file with:

```env
# ═══════════════════════════════════════════════════════════════
# SUPABASE (Database + Storage)
# Get from: https://supabase.com/dashboard/project/[project]/settings/api
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # For admin operations (bypasses RLS)

# ═══════════════════════════════════════════════════════════════
# AI SERVICES
# ═══════════════════════════════════════════════════════════════

# Claude API (Content Generation)
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (DALL-E 3 Hero Images)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Grok API (Content Humanization - bypasses AI detection)
# Get from: https://console.x.ai/
GROK_API_KEY=xai-...

# ═══════════════════════════════════════════════════════════════
# SEARCH/RESEARCH
# ═══════════════════════════════════════════════════════════════

# Serper API (Google Search for research)
# Get from: https://serper.dev/
SERPER_API_KEY=...
```

### API Key Sources

| Service | Purpose | Get Key From |
|---------|---------|--------------|
| **Supabase** | Database, Auth, Storage | [supabase.com](https://supabase.com) |
| **Anthropic Claude** | Article generation | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | DALL-E 3 images | [platform.openai.com](https://platform.openai.com) |
| **Grok (X.AI)** | Content humanization | [console.x.ai](https://console.x.ai) |
| **Serper** | Google search API | [serper.dev](https://serper.dev) |

---

## Database Schema

### Supabase PostgreSQL Tables

Run these migrations in your Supabase SQL Editor:

### 1. Main Posts Table (`insights_posts`)

```sql
-- ═══════════════════════════════════════════════════════════════
-- INSIGHTS POSTS TABLE
-- Main content storage for all articles
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS insights_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  author_slug TEXT NOT NULL,
  read_time TEXT,
  
  -- Visuals
  icon_name TEXT,
  color TEXT,
  bg_color TEXT,
  hero_type TEXT DEFAULT 'image',
  hero_url TEXT,
  
  -- Applied internal links (JSONB for flexibility)
  applied_links JSONB DEFAULT '[]',
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_insights_slug ON insights_posts(slug);
CREATE INDEX IF NOT EXISTS idx_insights_category ON insights_posts(category);
CREATE INDEX IF NOT EXISTS idx_insights_published ON insights_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_insights_created ON insights_posts(created_at DESC);
```

### 2. SEO Metadata Table (`seo_metadata`)

```sql
-- ═══════════════════════════════════════════════════════════════
-- SEO METADATA TABLE
-- Stores SEO-specific data for each post
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID UNIQUE NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT,
  og_image TEXT,
  
  -- Schema.org Markup for rich snippets
  schema_type TEXT DEFAULT 'Article',
  schema_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Internal Links Table (`internal_links`)

```sql
-- ═══════════════════════════════════════════════════════════════
-- INTERNAL LINKS TABLE
-- Tracks internal link relationships for SEO health monitoring
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES insights_posts(id) ON DELETE CASCADE,
  
  anchor_text TEXT,
  type TEXT DEFAULT 'related',  -- 'related', 'pillar', 'cluster'
  
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source_post_id, target_post_id)
);

CREATE INDEX IF NOT EXISTS idx_links_source ON internal_links(source_post_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON internal_links(target_post_id);
```

### 4. Image Storage Bucket (Supabase Storage)

```sql
-- ═══════════════════════════════════════════════════════════════
-- INSIGHTS IMAGES STORAGE BUCKET
-- For AI-generated hero images and article media
-- ═══════════════════════════════════════════════════════════════

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'insights_images',
  'insights_images',
  true,  -- Public bucket for blog images
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ═══════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Public read access (for displaying images on website)
DROP POLICY IF EXISTS "Public read access for insights images" ON storage.objects;
CREATE POLICY "Public read access for insights images"
ON storage.objects FOR SELECT
USING (bucket_id = 'insights_images');

-- Service role full access (for API uploads)
DROP POLICY IF EXISTS "Service role full access for insights images" ON storage.objects;
CREATE POLICY "Service role full access for insights images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'insights_images'
  AND auth.role() = 'service_role'
);

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated upload for insights images" ON storage.objects;
CREATE POLICY "Authenticated upload for insights images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'insights_images'
  AND auth.role() = 'authenticated'
);

-- ═══════════════════════════════════════════════════════════════
-- FOLDER STRUCTURE IN BUCKET:
-- insights_images/
--   ├── heroes/          <- AI-generated hero images
--   │   └── {slug}-{timestamp}.webp
--   ├── content/         <- In-article images  
--   │   └── {post-id}/{filename}
--   └── og/              <- Open Graph images
--       └── {slug}-og.png
-- ═══════════════════════════════════════════════════════════════
```

---

## File Structure

```
src/
├── app/
│   │
│   │  ┌─────────────────────────────────────────────────────────┐
│   │  │ ADMIN ROUTES (Protected)                                │
│   │  └─────────────────────────────────────────────────────────┘
│   ├── (admin)/admin/insights/
│   │   ├── page.tsx                    # Main admin dashboard with tabs
│   │   ├── create/page.tsx             # Create new post (optional)
│   │   └── [id]/
│   │       ├── page.tsx                # Edit existing post
│   │       └── EditInsightPageClient.tsx
│   │
│   │  ┌─────────────────────────────────────────────────────────┐
│   │  │ API ROUTES                                              │
│   │  └─────────────────────────────────────────────────────────┘
│   ├── api/admin/insights/
│   │   ├── ideas/route.ts              # GET smart ideas per silo
│   │   ├── generate/route.ts           # POST full article generation
│   │   ├── refine-direction/route.ts   # POST refine outline/brief
│   │   ├── humanize/route.ts           # POST Grok humanization
│   │   ├── research/route.ts           # POST outbound link research
│   │   ├── analyze/route.ts            # POST content SEO analysis
│   │   ├── generate-image/route.ts     # POST DALL-E hero images
│   │   ├── publish/route.ts            # POST publish/unpublish/delete
│   │   └── links/route.ts              # POST/GET internal link management
│   │
│   │  ┌─────────────────────────────────────────────────────────┐
│   │  │ PUBLIC ROUTES                                           │
│   │  └─────────────────────────────────────────────────────────┘
│   └── insights/
│       ├── page.tsx                    # Public listing page (SSR)
│       ├── InsightsPageClient.tsx      # Client component for listing
│       └── [slug]/
│           ├── page.tsx                # Public article page (SSR + SEO)
│           └── InsightArticleClient.tsx
│
│  ┌─────────────────────────────────────────────────────────────┐
│  │ COMPONENTS                                                  │
│  └─────────────────────────────────────────────────────────────┘
├── components/
│   ├── admin/insights/
│   │   ├── ArticleGenerator.tsx        # Main AI generator UI (~1200 lines)
│   │   ├── SEODashboard.tsx            # SEO health monitoring
│   │   ├── SiloVisualization.tsx       # ReactFlow graph
│   │   ├── OutboundResearch.tsx        # Link research tool
│   │   ├── InsightsEditor.tsx          # Markdown editor (optional)
│   │   └── LinkManager.tsx             # Internal link manager
│   │
│   └── insights/
│       ├── AuthorBio.tsx               # Author card component
│       ├── SignUpCTA.tsx               # Call-to-action component
│       └── ResumeBuilderCTA.tsx        # Product CTA component
│
│  ┌─────────────────────────────────────────────────────────────┐
│  │ UTILITIES                                                   │
│  └─────────────────────────────────────────────────────────────┘
└── lib/
    ├── supabase.ts                     # Supabase client initialization
    └── utils.ts                        # Includes slugify() helper
```

---

## API Routes Breakdown

### 1. `/api/admin/insights/ideas` - Smart Idea Generation

**Purpose:** Generates article ideas based on content silos with full briefs, angles, and detailed outlines.

**Method:** `POST`

**Request Body:**
```typescript
{
  siloId: "salary" | "career" | "jobs" | "interview" | "benefits" | "companies"
}
```

**Response:**
```typescript
{
  ideas: [
    {
      title: "BPO Salary Negotiation Script (Philippines)",
      target: "bpo salary negotiation philippines",  // Primary keyword
      secondary: ["call center salary negotiation", "how to ask for raise bpo"],
      brief: "Most agents just accept the first offer—and leave ₱5k-10k/month on the table...",
      ateYnaAngle: "Ate Yna shares her own negotiation story...",
      outline: [
        "H2: Why Most BPO Agents Leave Money on the Table",
        "H3: The 'grateful to be hired' trap",
        "H2: When to Negotiate (The 3 Golden Windows)",
        // ... more H2/H3 items
      ],
      risk: "low" | "medium" | "high",  // Cannibalization risk
      stats: [{ title, url, snippet }],   // From Serper API
      links: [{ title, slug, type }],     // Suggested internal links
      semanticKeywords: ["salary", "Philippines", "2025"]
    }
  ]
}
```

**Key Features:**
- Pre-defined content silos with keyword clusters
- Checks existing articles for keyword cannibalization
- Real research via Serper API for statistics
- Detailed H2/H3 outlines for each idea
- Suggested internal links to pillar pages

---

### 2. `/api/admin/insights/generate` - Full Article Generation

**Purpose:** Generates complete SEO-optimized articles using Claude + Serper research.

**Method:** `POST`

**Request Body:**
```typescript
{
  silo: { id: string, name: string, slug: string },
  targetKeyword: "bpo salary guide philippines",
  secondaryKeywords: ["call center pay", "bpo compensation"],
  topic: "Full brief with outline...",
  existingArticles: [{ title, slug }],
  suggestedLinks: [{ title, slug, anchorText }],
  outlineHints: ["H2: Section 1", "H2: Section 2"],
  semanticKeywords: ["Philippines", "2025", "BPO"]
}
```

**Response:**
```typescript
{
  title: "SEO-Optimized Title with Keyword",
  slug: "url-friendly-slug",
  metaDescription: "150-160 character description with keyword",
  content: "# Full Markdown Article\n\nWith internal links...",
  research: {
    statsFound: 5,
    sourcesFound: 3,
    questionsFound: 4,
    sources: [{ domain, title, url }],
    questions: ["What is...", "How to..."]  // People Also Ask
  }
}
```

**Key Features:**
- Real-time Google research via Serper for:
  - Statistics and data
  - Authority sources (.gov, .edu, .org)
  - "People Also Ask" questions
- Persona-based writing (customizable voice)
- Automatic internal link injection
- SEO-optimized structure with FAQ section

---

### 3. `/api/admin/insights/refine-direction` - AI Direction Refinement

**Purpose:** Refines article direction (title, brief, outline) using Claude.

**Method:** `POST`

**Request Body:**
```typescript
{
  title: "Current title",
  targetKeyword: "main keyword",
  secondaryKeywords: ["kw1", "kw2"],
  currentBrief: "Current brief text...",
  currentAngle: "Current persona angle...",
  currentOutline: ["H2: Section 1", "H3: Subsection"],
  siloId: "salary"
}
```

**Response:**
```typescript
{
  title: "Improved headline",
  brief: "Enhanced 2-3 paragraph brief...",
  angle: "Refined persona angle...",
  outline: ["H2: Better Section", "H3: New Subsection", ...]
}
```

---

### 4. `/api/admin/insights/humanize` - Grok AI Humanization

**Purpose:** Rewrites AI content to pass AI detection and add personality.

**Method:** `POST`

**Uses:** Grok API (X.AI) - `grok-4-1-fast-non-reasoning` model

**Request Body:**
```typescript
{
  content: "Original AI-generated content...",
  title: "Article title"
}
```

**Response:**
```typescript
{
  content: "Humanized content with personality...",
  humanized: true,
  model: "grok"
}
```

**Humanization Features:**
- Adds personal anecdotes and stories
- Mixes in colloquial expressions (Taglish for PH market)
- Varies sentence length dramatically
- Removes AI-typical phrases
- Adds rhetorical questions and opinions

---

### 5. `/api/admin/insights/generate-image` - DALL-E Hero Images

**Purpose:** Generates hero images and stores permanently in Supabase Storage.

**Method:** `POST`

**Request Body:**
```typescript
{
  prompt: "optional custom prompt",
  title: "Article title for context",
  slug: "article-slug",
  style: "professional" | "illustration" | "cinematic" | "tech" | "warm"
}
```

**Response:**
```typescript
{
  success: true,
  imageUrl: "https://[supabase-url]/storage/v1/object/public/insights_images/heroes/slug-123.webp",
  permanent: true,
  fileName: "heroes/slug-123.webp",
  revisedPrompt: "DALL-E's interpreted prompt..."
}
```

**Style Options:**
| Style | Description |
|-------|-------------|
| `professional` | Clean, corporate, modern office aesthetic |
| `illustration` | Flat vector art, vibrant colors |
| `cinematic` | Dramatic lighting, shallow depth of field |
| `tech` | Futuristic, neon, cyberpunk-inspired |
| `warm` | Friendly, natural lighting, approachable |

---

### 6. `/api/admin/insights/research` - Outbound Link Research

**Purpose:** Finds authority sources and backlink opportunities.

**Method:** `POST`

**Request Body:**
```typescript
{
  content: "Article content to analyze...",
  type: "outbound"
}
```

**Response:**
```typescript
{
  outbound: [
    {
      domain: "dole.gov.ph",
      type: "gov",
      url: "https://...",
      title: "DOLE Labor Statistics 2024",
      snippet: "According to the latest data...",
      reason: "Government employment data"
    }
  ],
  backlinks: [
    {
      siteName: "Career Blog Philippines",
      siteType: "guest_post",
      url: "https://...",
      domain: "careerblog.ph",
      outreachAngle: "Guest posting opportunity"
    }
  ],
  powered_by: "serper"  // or "manual" if no API key
}
```

---

### 7. `/api/admin/insights/publish` - Content Management

**Purpose:** Publish, unpublish, or delete posts.

**Method:** `POST`

**Request Body:**
```typescript
{
  id: "post-uuid",
  action: "publish" | "unpublish" | "delete"
}
```

**Response:**
```typescript
{
  success: true,
  message: "\"Article Title\" is now LIVE!",
  post: { /* updated post data */ }
}
```

---

### 8. `/api/admin/insights/links` - Internal Link Management

**Purpose:** Add or remove tracked internal links.

**Method:** `POST`

**Request Body:**
```typescript
{
  action: "add" | "remove",
  postId: "source-post-uuid",
  link: {  // for "add"
    target_id: "target-post-uuid",
    anchor_text: "BPO salary guide"
  },
  linkIndex: 0  // for "remove"
}
```

**Method:** `GET`

**Query:** `?slug=target-slug`

**Returns:** Target post info for linking.

---

## Key Components

### ArticleGenerator.tsx - The Heart of the System

**Location:** `src/components/admin/insights/ArticleGenerator.tsx`

**Size:** ~1,200 lines

**4-Step Workflow:**

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: PICK IDEA                                              │
├────────────────────────────────────────────────────────────────┤
│ • Select content silo (category)                               │
│ • Click "Get Ideas" → Fetches AI-suggested ideas               │
│ • Each idea shows: title, brief, angle, outline, risk level    │
│ • Click idea card to proceed                                   │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: SHAPE DIRECTION                                        │
├────────────────────────────────────────────────────────────────┤
│ • Edit title, target keyword, secondary keywords               │
│ • Edit article brief (what it covers)                          │
│ • Edit persona angle (voice/stories)                           │
│ • Edit H2/H3 outline (add/remove/reorder)                      │
│ • Optional: Click "Regenerate Direction" for AI refinement     │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: CHECK & GENERATE                                       │
├────────────────────────────────────────────────────────────────┤
│ • Shows cannibalization warnings (keyword overlap)             │
│ • Shows suggested internal links                               │
│ • Click "Generate Article" → Full AI generation with research  │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 4: REVIEW & SAVE                                          │
├────────────────────────────────────────────────────────────────┤
│ • Edit generated title, slug, meta description                 │
│ • Generate hero image (DALL-E 3)                               │
│ • Edit markdown content                                        │
│ • Optional: "Humanize with Grok" for AI detection bypass       │
│ • Click "Save as Draft" → Stores to Supabase                   │
└────────────────────────────────────────────────────────────────┘
```

---

### SEODashboard.tsx - Health Monitoring

**Location:** `src/components/admin/insights/SEODashboard.tsx`

**Features:**

| Metric | Description |
|--------|-------------|
| Total Posts | Count of all articles |
| Published | Live articles |
| Internal Links | Total link count |
| Avg Links/Post | Link density metric |
| Orphan Pages | Pages with no inbound links (bad for SEO) |
| Health Score | 0-100 score per article |

**Health Score Calculation:**
- Starts at 100
- -30 for orphan page (no inbound links)
- -20 for no outbound links
- -10 for too many outbound links (>10)
- -10 for unpublished status

---

### SiloVisualization.tsx - Content Graph

**Location:** `src/components/admin/insights/SiloVisualization.tsx`

**Uses:** ReactFlow library

**Visualizes:**
- **Purple nodes:** Pillar pages (hub content)
- **Cyan nodes:** Cluster articles (supporting content)
- **Animated edges:** Internal link connections
- **Hover tooltips:** Full title, slug, inbound/outbound counts

**Node Types:**
```typescript
const pillarSlugs = [
  'bpo-salary-guide-philippines',
  'how-to-get-promoted-bpo-call-center',
  'bpo-jobs-philippines-guide',
  // ... define your pillar pages
];
```

---

### OutboundResearch.tsx - Link Research Tool

**Location:** `src/components/admin/insights/OutboundResearch.tsx`

**Features:**
- Select existing article or paste custom content
- Finds .gov, .edu, .org authority sources to cite
- Finds backlink opportunities (guest posts, forums)
- Direct links to visit sources or search Google

---

## Content Generation Flow

```
┌─────────────────┐
│  Select Silo    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Fetch Ideas    │◄── Serper API (real stats from Google)
│  POST /ideas    │◄── Existing articles check (cannibalization)
└────────┬────────┘
         ▼
┌─────────────────┐
│ Shape Direction │◄── Claude AI refines brief/outline
│ (user editable) │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Generate Full   │◄── Claude Sonnet 4 (main generation)
│ Article         │◄── Serper (stats, authority sources, PAA)
│ POST /generate  │◄── Internal links auto-injected
└────────┬────────┘
         ▼
┌─────────────────┐
│ Humanize (opt)  │◄── Grok API (X.AI)
│ POST /humanize  │    Bypasses AI detection
└────────┬────────┘
         ▼
┌─────────────────┐
│ Generate Image  │◄── DALL-E 3 (OpenAI)
│ POST /gen-image │◄── Stored permanently in Supabase Storage
└────────┬────────┘
         ▼
┌─────────────────┐
│ Save as Draft   │──► Supabase DB (insights_posts + seo_metadata)
│ or Publish      │
└─────────────────┘
```

---

## Content Silo Strategy

### What Are Content Silos?

A **content silo** is a group of related articles organized around a **pillar page** (comprehensive hub) with **cluster articles** (detailed subtopics) that all link back to the pillar.

```
                    ┌─────────────────┐
                    │  PILLAR PAGE    │
                    │  (Main Guide)   │
                    └────────┬────────┘
         ┌──────────────┬────┴────┬──────────────┐
         ▼              ▼         ▼              ▼
    ┌─────────┐   ┌─────────┐ ┌─────────┐  ┌─────────┐
    │ Cluster │   │ Cluster │ │ Cluster │  │ Cluster │
    │ Article │   │ Article │ │ Article │  │ Article │
    └─────────┘   └─────────┘ └─────────┘  └─────────┘
```

### Define Your Silos in Code

```typescript
// In ArticleGenerator.tsx or a shared config file

const SILOS = [
  { 
    id: 'salary', 
    name: '💰 Salary & Compensation', 
    slug: 'salary-guide-philippines',  // Pillar page slug
    keywords: ['salary', 'pay', 'compensation', 'raise', 'allowances'] 
  },
  { 
    id: 'career', 
    name: '📈 Career Growth', 
    slug: 'career-growth-guide',
    keywords: ['promotion', 'career path', 'team leader', 'manager'] 
  },
  { 
    id: 'hiring', 
    name: '🎯 Hiring & Recruitment', 
    slug: 'hiring-guide',
    keywords: ['hiring', 'recruitment', 'staffing', 'outsourcing'] 
  },
  // Add more silos as needed
];
```

### Example for ShoreAgents

```typescript
const SHOREAGENTS_SILOS = [
  { 
    id: 'offshore-staffing', 
    name: '🌏 Offshore Staffing Guides', 
    slug: 'offshore-staffing-guide',
    keywords: ['offshore staffing', 'remote teams', 'virtual employees'] 
  },
  { 
    id: 'hiring', 
    name: '🎯 Hiring Best Practices', 
    slug: 'hiring-offshore-employees',
    keywords: ['hiring', 'recruitment', 'interview', 'onboarding'] 
  },
  { 
    id: 'cost', 
    name: '💰 Cost & ROI', 
    slug: 'offshore-staffing-costs',
    keywords: ['cost savings', 'roi', 'pricing', 'budget'] 
  },
  { 
    id: 'industries', 
    name: '🏢 Industry Solutions', 
    slug: 'industry-staffing-solutions',
    keywords: ['real estate', 'ecommerce', 'healthcare', 'finance'] 
  },
  { 
    id: 'success', 
    name: '⭐ Success Stories', 
    slug: 'client-success-stories',
    keywords: ['case study', 'testimonial', 'results', 'roi'] 
  },
];
```

---

## Customization Guide for New Projects

### Step 1: Setup Infrastructure

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Run all SQL migrations (see [Database Schema](#database-schema))

2. **Get API Keys**
   - Anthropic Claude
   - OpenAI
   - Grok (X.AI)
   - Serper

3. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Fill in all API keys

### Step 2: Define Your Content Silos

Edit the `SILOS` constant to match your business:

```typescript
const SILOS = [
  { id: 'unique-id', name: 'Display Name', slug: 'pillar-slug', keywords: [...] },
  // ...
];
```

### Step 3: Customize the Persona

In `/api/admin/insights/generate/route.ts`, replace the persona:

```typescript
const prompt = `
You are "[YOUR EXPERT PERSONA]" - [description of expertise and personality].

YOUR WRITING STYLE:
- [Define voice characteristics]
- [Define language style]
- [Define formatting preferences]

ANTI-AI DETECTION TECHNIQUES:
- [Specific techniques for your audience]
`;
```

### Step 4: Adjust Research Queries

In `/api/admin/insights/ideas/route.ts`:

- Update `baseIdeas` object with ideas for each silo
- Adjust Serper search queries for your industry
- Modify outline templates

### Step 5: Update UI Branding

- Update color classes in Tailwind
- Replace logos and icons
- Update category badges

---

## API Costs Estimate

### Monthly Cost Breakdown (50 articles/month)

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| **Claude Sonnet 4** | ~50 generations + refinements | $15-30 |
| **Grok** | ~50 humanizations | $5-10 |
| **DALL-E 3** | ~50 images (1792x1024) | $10-20 |
| **Serper** | ~200 searches | $50 |
| **Supabase** | Free tier or Pro ($25) | $0-25 |
| **Vercel** | Hosting (free tier) | $0 |
| **TOTAL** | | **~$80-135/mo** |

### Cost Optimization Tips

1. **Cache Serper results** - Store research for similar keywords
2. **Use Claude Haiku** for simpler tasks (analyze, suggest_links)
3. **Generate images selectively** - Not every post needs AI images
4. **Batch humanization** - Only humanize final drafts

---

## Feature Recap

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ AI Article Generation | Complete | Claude-powered, persona-based writing |
| ✅ Real Research | Complete | Serper API for live Google data |
| ✅ Humanization | Complete | Grok to bypass AI detection |
| ✅ Hero Images | Complete | DALL-E 3 with Supabase storage |
| ✅ SEO Optimization | Complete | Keywords, meta, schema markup |
| ✅ Internal Linking | Complete | Auto-suggestions, link tracking |
| ✅ Content Silos | Complete | Visual graph, health scores |
| ✅ Cannibalization | Complete | Keyword overlap detection |
| ✅ Publish Workflow | Complete | Draft → Review → Publish |
| ✅ Public Pages | Complete | SSR with JSON-LD schema |

---

## Related Documentation

- [BPOC API Integration Guide](./BPOC_API_INTEGRATION_GUIDE.md)
- [Style Guide](./Branding/STYLE_GUIDE.md)
- [2026 BPO Content Strategy](./Strategy/2026_BPO_Content_Authority_Strategy.md)

---

## Support

For questions about this architecture:
1. Review the source code in `src/app/api/admin/insights/`
2. Check component implementations in `src/components/admin/insights/`
3. Reference the Supabase dashboard for database queries

---

*Last Updated: December 2024*
*Version: 1.0*








