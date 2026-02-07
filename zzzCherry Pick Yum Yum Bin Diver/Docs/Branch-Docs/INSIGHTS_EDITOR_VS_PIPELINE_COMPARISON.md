# Insights Manager Editor vs AI Content Pipeline - Field Comparison

**Created:** January 30, 2026
**Purpose:** Compare fields, functions, and database columns between the two content creation systems

---

## Overview

| Aspect | Insights Manager Editor | AI Content Pipeline |
|--------|------------------------|---------------------|
| **Location** | `/admin/insights/[id]` | `/admin/insights/create` |
| **Component** | `InsightsEditor.tsx` | `create/page.tsx` + Stage components |
| **Approach** | Manual editing | 8-stage AI wizard |
| **Primary Use** | Edit existing articles, manual creation | AI-assisted content generation |
| **Database Tables** | `insights_posts`, `seo_metadata` | `insights_posts`, `seo_metadata`, `content_pipelines` |

---

## Field-by-Field Comparison

### 1. Basic Article Information

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Title** | `formData.title` | `state.plan?.title` / `state.meta?.metaTitle` | `insights_posts.title` | Editor: manual input; Pipeline: generated from plan |
| **Slug** | `formData.slug` | `state.meta?.canonicalSlug` | `insights_posts.slug` | Editor: auto-generated from title; Pipeline: from meta stage |
| **Description** | `formData.description` | `state.meta?.metaDescription` | `insights_posts.description` | Editor: manual or AI-generated; Pipeline: from meta stage |
| **Category** | `formData.category` | `state.selectedSilo` | `insights_posts.category` | Editor: dropdown; Pipeline: silo selection in Stage 1 |

### 2. Content Fields

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Full Content** | `combineContent()` | `state.seoArticle` / `state.humanizedArticle` | `insights_posts.content` | Both combine parts for final content |
| **Content Part 1** | `formData.content_part1` | `state.contentSections[0]` | `insights_posts.content_part1` | Introduction section |
| **Content Part 2** | `formData.content_part2` | `state.contentSections[1]` | `insights_posts.content_part2` | Main body section |
| **Content Part 3** | `formData.content_part3` | `state.contentSections[2]` | `insights_posts.content_part3` | Conclusion section |

### 3. Hero Media

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Hero Type** | `formData.hero_type` | `state.heroType` | `insights_posts.hero_type` | 'image' or 'video' |
| **Hero URL (Image)** | `formData.hero_url` | `uploadedImages.hero` | `insights_posts.hero_url` | Primary hero image |
| **Video URL** | `formData.video_url` | `state.videoUrl` | `insights_posts.video_url` | Hero video if video type |

### 4. Body Images & Alt Text

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Section 1 Image** | `formData.content_image0` | `uploadedImages.section1` | `insights_posts.content_image0` | After intro |
| **Section 1 Alt** | `formData.section1_image_alt` | `sectionAltTexts[0]` | `insights_posts.section1_image_alt` | SEO alt text |
| **Section 2 Image** | `formData.content_image1` | `uploadedImages.section2` | `insights_posts.content_image1` | After main body |
| **Section 2 Alt** | `formData.section2_image_alt` | `sectionAltTexts[1]` | `insights_posts.section2_image_alt` | SEO alt text |
| **Section 3 Image** | `formData.content_image2` | `uploadedImages.section3` | `insights_posts.content_image2` | After conclusion |
| **Section 3 Alt** | `formData.section3_image_alt` | `sectionAltTexts[2]` | `insights_posts.section3_image_alt` | SEO alt text |

### 5. Author & Meta Information

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Author** | `formData.author` | Hardcoded: 'Ate Yna' | `insights_posts.author` | Pipeline always uses Ate Yna |
| **Author Slug** | `formData.author_slug` | Hardcoded: 'ate-yna' | `insights_posts.author_slug` | Pipeline always uses ate-yna |
| **Read Time** | `formData.read_time` | Calculated from word count | `insights_posts.read_time` | Editor: manual; Pipeline: auto |
| **Icon Name** | `formData.icon_name` | N/A | `insights_posts.icon_name` | Editor only |
| **Color** | `formData.color` | N/A | `insights_posts.color` | Editor only |
| **BG Color** | `formData.bg_color` | N/A | `insights_posts.bg_color` | Editor only |

### 6. Publishing Status

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Is Published** | `formData.is_published` | `!isDraft` | `insights_posts.is_published` | Boolean flag |
| **Published At** | Auto-set on publish | Auto-set on publish | `insights_posts.published_at` | Timestamp |
| **Pipeline Stage** | N/A | 'draft' / 'published' | `insights_posts.pipeline_stage` | Pipeline tracking |

### 7. Silo & Content Type

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Silo Topic** | N/A (manual category) | `state.selectedSilo` | `insights_posts.silo_topic` | Silo slug |
| **Silo ID** | N/A | `state.selectedSiloId` | `insights_posts.silo_id` | UUID reference |
| **Is Pillar** | N/A | `state.isPillar` | `insights_posts.is_pillar` | Boolean flag |
| **Content Type** | N/A | 'pillar' / 'supporting' | `insights_posts.content_type` | Article type |

### 8. SEO Metadata (seo_metadata table)

| Field | Editor | Pipeline | Database Column | Notes |
|-------|--------|----------|-----------------|-------|
| **Meta Title** | `seoData.meta_title` | `state.meta?.metaTitle` | `seo_metadata.meta_title` | SEO title |
| **Meta Description** | `seoData.meta_description` | `state.meta?.metaDescription` | `seo_metadata.meta_description` | SEO description |
| **Keywords** | `seoData.keywords` (comma-separated) | `state.meta?.focusKeyword` + arrays | `seo_metadata.keywords` | Array |
| **Canonical URL** | `seoData.canonical_url` | `state.meta?.canonicalUrl` | `seo_metadata.canonical_url` | Full URL |
| **Focus Keyword** | `seoData.focus_keyword` | `state.meta?.focusKeyword` | `seo_metadata.focus_keyword` | Primary keyword |
| **Secondary Keywords** | `seoData.secondary_keywords` | `state.meta?.secondaryKeywords` | `seo_metadata.secondary_keywords` | Array |
| **Schema Markup** | `seoData.schema_markup` | `state.meta?.schema` | `seo_metadata.schema_markup` | JSON-LD with templates |

---

## Function Comparison by Purpose

### Content Generation/Editing

| Purpose | Editor Function | Pipeline Stage/Function |
|---------|-----------------|------------------------|
| **AI Content Improvement** | `handleAiImprove()` | Stage 5: `humanizeArticle()` |
| **Generate Full Article** | `handleAiGenerateFull()` | Stage 4: `WriteStage` API call |
| **Improve Single Section** | `handleImproveSingleSection(1\|2\|3)` | N/A (full article generation) |
| **Generate Description** | `handleGenerateDescription()` | Stage 7: `generateMeta()` |
| **Split Content** | `splitContentIntoParts()` | `splitContentIntoSections()` |
| **Combine Content** | `combineContent()` | Direct concatenation |

### SEO Functions

| Purpose | Editor Function | Pipeline Stage/Function |
|---------|-----------------|------------------------|
| **Link Suggestions** | `handleLinkSuggestions()` | Stage 6: `seoOptimize()` (auto-added) |
| **Apply Link** | `applyLink(suggestion)` | Auto in SEO stage |
| **SEO Optimization** | N/A (manual) | Stage 6: `SeoStage.seoOptimize()` |
| **Generate Meta Tags** | Manual input | Stage 7: `MetaStage.generateMeta()` |

### Media Functions

| Purpose | Editor Function | Pipeline Stage/Function |
|---------|-----------------|------------------------|
| **Generate Hero Image** | `handleGenerateHeroImage()` | Stage 8: `handleGenerateHeroVideo/Image()` |
| **Upload Hero** | File input + state update | Stage 8: `handleUploadHeroVideo/Image()` |
| **Generate Section Images** | `handleGenerateBodyImage(position)` | Stage 8: `handleGenerateSectionImage(index)` |
| **Upload Section Images** | File input + state update | Stage 8: `handleUploadSectionImage(e, index)` |
| **Generate Alt Text** | `handleGenerateAltText(section)` | Stage 8: `generateAltTextWithAI(index)` |
| **Save Alt Text** | Part of card save | Stage 8: `saveAltTextToDatabase(index)` |

### Save/Publish Functions

| Purpose | Editor Function | Pipeline Stage/Function |
|---------|-----------------|------------------------|
| **Save All** | `handleSave()` | N/A (per-stage saves) |
| **Save Per Card** | `saveCard(cardType, fields)` | `savePipelineProgress()` per stage |
| **Save Basic Info** | `saveBasicInfo()` | Auto in Brief stage |
| **Save Content** | `saveContent()` | Auto in Write/Humanize/SEO stages |
| **Save Hero Media** | `saveHeroMedia()` | Auto in Publish stage |
| **Save Body Images** | `saveBodyImages()` | Auto in Publish stage |
| **Save Meta** | `saveMeta()` | Auto in Meta stage |
| **Publish** | Toggle `is_published` + save | `publishArticle(isDraft)` |

---

## AI Models Used

| Stage/Function | Editor | Pipeline |
|----------------|--------|----------|
| **Brief Fix/Improve** | N/A | GPT-4o |
| **Idea Generation** | N/A | GPT-4o |
| **Research** | N/A | Perplexity AI + GPT-4o synthesis |
| **Plan Generation** | N/A | Claude claude-sonnet-4-20250514 |
| **Article Writing** | Claude claude-sonnet-4-20250514 | Claude claude-sonnet-4-20250514 |
| **Humanization** | N/A | Grok-4-1-fast |
| **SEO Optimization** | N/A | Claude claude-sonnet-4-20250514 |
| **Meta Generation** | N/A | GPT-4o |
| **Image Generation** | Google Imagen 4 (with Fast fallback) | Google Imagen 4 (with Fast fallback) |
| **Video Generation** | Google Veo 3.1 | Google Veo 3.1 |
| **Alt Text Generation** | GPT-4o | GPT-4o |

> **Note:** Both Editor and Pipeline now share the same API endpoints for media generation, ensuring consistent AI agent usage across both systems.

---

## Database Schema Comparison

### insights_posts table

```sql
-- Fields used by BOTH systems
title VARCHAR
slug VARCHAR UNIQUE
description TEXT
content TEXT
content_part1 TEXT
content_part2 TEXT
content_part3 TEXT
hero_type VARCHAR ('image' | 'video')
hero_url TEXT
video_url TEXT
content_image0 TEXT
content_image1 TEXT
content_image2 TEXT
section1_image_alt TEXT
section2_image_alt TEXT
section3_image_alt TEXT
author VARCHAR
author_slug VARCHAR
category VARCHAR
is_published BOOLEAN
published_at TIMESTAMP
updated_at TIMESTAMP
created_at TIMESTAMP

-- Fields used primarily by EDITOR
icon_name VARCHAR
color VARCHAR
bg_color VARCHAR
read_time VARCHAR
applied_links JSONB

-- Fields used primarily by PIPELINE
silo_id UUID REFERENCES insights_silos(id)
silo_topic VARCHAR
silo VARCHAR
is_pillar BOOLEAN
content_type VARCHAR ('pillar' | 'supporting')
pipeline_stage VARCHAR
humanization_score INTEGER
generation_metadata JSONB
cover_image TEXT
cover_image_alt TEXT
og_image TEXT
og_title TEXT
og_description TEXT
meta_description TEXT
canonical_url TEXT
```

### seo_metadata table

```sql
post_id UUID REFERENCES insights_posts(id) UNIQUE
meta_title VARCHAR
meta_description TEXT
keywords TEXT[]
canonical_url TEXT
focus_keyword VARCHAR       -- Pipeline only
secondary_keywords TEXT[]   -- Pipeline only
schema_markup JSONB         -- Pipeline only
```

### content_pipelines table (Pipeline only)

```sql
id UUID PRIMARY KEY
insight_id UUID REFERENCES insights_posts(id)
current_stage INTEGER
brief TEXT
silo VARCHAR
selected_idea JSONB
research_data JSONB
plan JSONB
article TEXT
humanized_article TEXT
human_score INTEGER
seo_article TEXT
seo_stats JSONB
meta_data JSONB
images JSONB
video_url TEXT
hero_type VARCHAR
content_sections TEXT[]
ai_logs JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Key Differences Summary

### 1. Workflow
- **Editor**: Free-form editing, save anytime, individual card saves
- **Pipeline**: Linear 8-stage process, must complete each stage

### 2. Content Quality
- **Editor**: Manual quality control, optional AI assistance, humanization score display
- **Pipeline**: Automatic humanization (85%+ human score), automatic SEO optimization

### 3. Silo Support
- **Editor**: Full silo support with dropdown selector, pillar toggle
- **Pipeline**: Full silo support with `silo_id`, `silo_topic`, `is_pillar`

### 4. SEO
- **Editor**: Full OG fields, meta fields, humanization score display
- **Pipeline**: Full SEO optimization with internal/external links, schema markup

### 5. Media
- **Editor**: Manual upload or AI generation (Google Imagen 4)
- **Pipeline**: Integrated media generation in final stage (Google Imagen 4)

### 6. Tracking
- **Editor**: Saves all fields including styling (icon_name, color, bg_color)
- **Pipeline**: Full `generation_metadata` and `content_pipelines` logging, plus styling fields

---

## Implementation Status (Updated January 30, 2026)

### Completed Alignments:

1. **Silo support added to Editor** (DONE)
   - Added `silo_id`, `silo_topic`, `is_pillar`, `content_type` fields to formData
   - Added silo selector dropdown with database fetch
   - Added pillar toggle UI

2. **Open Graph fields added to Editor** (DONE)
   - Added `og_image`, `og_title`, `og_description` fields
   - Added `cover_image`, `cover_image_alt` fields
   - Added UI in SEO tab

3. **Editor save function fixed** (DONE)
   - Now saves all formData fields: author, read_time, icon_name, color, bg_color
   - Now saves silo and OG fields

4. **Pipeline now includes Editor fields** (DONE)
   - Added `iconName`, `color`, `bgColor`, `readTime`, `appliedLinks` to PipelineState
   - Publish route saves these fields with defaults

5. **Humanization score display** (DONE)
   - Editor shows humanization_score in SEO tab when available

6. **SEO metadata fields aligned** (DONE)
   - Added `focus_keyword` field to Editor
   - Added `secondary_keywords` array field to Editor
   - Added `schema_markup` JSON-LD field to Editor with quick templates
   - Editor now saves all seo_metadata fields

7. **Pillar vs Supporting article handling** (DONE)
   - Single Editor with conditional fields based on `is_pillar` status
   - Pillar posts: Slug field disabled, shows read-only URL `/insights/{silo-slug}`
   - Supporting articles: Slug field editable, shows full URL preview
   - Save logic uses silo slug for pillar posts, article slug for supporting
   - Editor links pillar posts to silo (`pillar_post_id`) on publish

### Both Systems Now Share:
- All database fields (silo, OG, styling, meta)
- Same AI agents (Google Imagen 4, GPT-4o for alt text)
- Same 3-part content structure
- Same image position naming

---

## Related Files

**Editor:**
- `src/components/admin/insights/InsightsEditor.tsx`
- `src/app/(admin)/admin/insights/[id]/EditInsightPageClient.tsx`

**Pipeline:**
- `src/app/(admin)/admin/insights/create/page.tsx`
- `src/app/(admin)/admin/insights/create/types.ts`
- `src/app/(admin)/admin/insights/create/components/BriefStage.tsx`
- `src/app/(admin)/admin/insights/create/components/ResearchStage.tsx`
- `src/app/(admin)/admin/insights/create/components/PlanStage.tsx`
- `src/app/(admin)/admin/insights/create/components/WriteStage.tsx`
- `src/app/(admin)/admin/insights/create/components/HumanizeStage.tsx`
- `src/app/(admin)/admin/insights/create/components/SeoStage.tsx`
- `src/app/(admin)/admin/insights/create/components/MetaStage.tsx`
- `src/app/(admin)/admin/insights/create/components/PublishStage.tsx`

**API Routes:**
- `src/app/api/admin/insights/analyze/route.ts` (Editor AI)
- `src/app/api/admin/insights/pipeline/*/route.ts` (Pipeline stages)
