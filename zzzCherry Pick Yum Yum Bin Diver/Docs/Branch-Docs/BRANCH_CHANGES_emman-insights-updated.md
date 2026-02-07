# Branch Changes: `emman-insights-updated`

**Last Updated:** January 30, 2026
**Branch Base:** `main`
**Total Changes:** +2,608 / -943 lines across 18 files

---

## Overview

This branch introduces significant enhancements to the Insights pipeline, including a complete **Pillar vs Supporting Article system**, inline plan editing, improved word count validation, and a redesigned Insights page with better navigation UX.

---

## Key Features & Improvements

### 1. Pillar vs Supporting Article System

A new content hierarchy that differentiates between comprehensive pillar posts and focused supporting articles.

| Article Type | Word Count Target | Purpose |
|-------------|-------------------|---------|
| **Pillar** | 3,000 - 4,000 words | Comprehensive silo hub content |
| **Supporting** | 1,800 - 2,200 words | Focused, targeted subtopic articles |

**Files Changed:**
- `src/app/api/admin/insights/pipeline/generate-plan/route.ts`
- `src/app/api/admin/insights/pipeline/write-article/route.ts`
- `src/app/api/admin/insights/pipeline/publish/route.ts`

**Highlights:**
- Dynamic word count ranges passed to AI based on article type
- Plan generation includes `articleType`, `minWordCount`, `maxWordCount` in competitor analysis
- Write prompts adjusted per article type (section lengths, FAQ depth, intro/conclusion word counts)
- Database fields `is_pillar` and `silo_id` properly set on publish
- Pillar posts automatically linked to their silo via `pillar_post_id`

---

### 2. Plan Stage Inline Editing

Users can now **edit generated article plans directly** before approval.

**File:** `src/app/(admin)/admin/insights/create/components/PlanStage.tsx` (+352 lines)

**New Capabilities:**
- Edit article title and meta description
- Add, edit, or remove H2 sections
- Add, edit, or remove H3 subheadings within sections
- Add, edit, or remove FAQ questions
- Save or cancel editing with visual feedback
- Plan changes saved to pipeline progress

**UI Elements Added:**
- Edit button with orange theme
- Inline input fields for all editable content
- Add/Remove buttons for sections and FAQs
- Save/Cancel action buttons

---

### 3. Word Count Validation & Feedback

Real-time word count status indicators in the Write Stage.

**File:** `src/app/(admin)/admin/insights/create/components/WriteStage.tsx` (+74 lines)

**Visual Feedback:**
- **Green** - Word count within target range
- **Yellow** - Below minimum target
- **Orange** - Above maximum target

**Display Format:**
```
Article Written ✓
2,145 words (target: 1800-2200) - Ate Yna voice
```

---

### 4. Insights Page Redesign

Complete overhaul of the main Insights page with improved UX and visual hierarchy.

**File:** `src/app/insights/InsightsPageClient.tsx` (+563 / -355 lines)

**New Architecture:**

#### SiloCard Component
- Dedicated component for browsing topic categories
- Animated hover states with silo-specific colors
- Loading animations with pulsing ring effects
- Click-to-navigate with visual feedback

#### ArticleCard Component
- Redesigned article cards with video/image support
- Smart silo slug resolution from multiple sources
- Loading states with scanning line animations
- Author avatars with Ate Yna image support

#### Layout Changes
- Separated **"Explore Categories"** section for silos
- Separated **"All Articles"** section for content
- Filter pills for category filtering
- Improved newsletter section design

---

### 5. Silo Article Client Component

**New File:** `src/app/insights/components/SiloArticleClient.tsx` (652 lines)

A new component for rendering articles within silo contexts with:
- Silo-themed markdown rendering (colors, icons)
- Support for sectioned content (`content_part1`, `content_part2`, `content_part3`)
- Support for inline images (`content_image0`, `content_image1`, `content_image2`)
- Callout box types: `[TIP]`, `[KEY]`, `[WARNING]`, `[INFO]`, `[SUCCESS]`
- Parallax hero effects
- Video hero support with mute toggle
- Related articles sidebar
- Share buttons (Twitter, LinkedIn, Facebook)

---

### 6. Silo Page Pillar Content Rendering

All silo client pages now properly render pillar post content with images.

**Files Updated:**
- `CareerSiloClient.tsx`
- `CompaniesSiloClient.tsx`
- `EmploymentGuideSiloClient.tsx`
- `InterviewSiloClient.tsx`
- `JobsSiloClient.tsx`
- `SalarySiloClient.tsx`
- `TrainingSiloClient.tsx`
- `WorklifeSiloClient.tsx`

**Improvements:**
- Added silo-themed `MarkdownComponents` for consistent styling
- Support for multi-part content with interleaved images
- Themed borders and accent colors per silo

---

### 7. Pipeline Flow Improvements

**File:** `src/app/(admin)/admin/insights/create/page.tsx`

**Fixes:**
- URL parameter handling for `pillar=true`
- Silo locking when creating pillar posts
- Proper redirect after publishing:
  - Pillar posts → Silo page (`/insights/{silo}`)
  - Supporting posts → Article page (`/insights/{silo}/{slug}`)
- Toast messages indicate pillar vs regular publish

---

### 8. Silo Visualization Enhancements

**File:** `src/components/admin/insights/SiloVisualization.tsx` (+713 lines)

Enhanced visualization for managing silos and their content hierarchy.

---

## Database Schema Changes

The publish route now sets additional fields:

```typescript
{
  content_type: isPillar ? 'pillar' : 'supporting',
  is_pillar: isPillar || false,
  silo_id: siloId || null,
  // ... existing fields
}
```

After publishing a pillar post:
```typescript
await supabase
  .from('insights_silos')
  .update({ pillar_post_id: article.id })
  .eq('id', siloId);
```

---

## Files Summary

| File | Changes | Type |
|------|---------|------|
| `PlanStage.tsx` | +352 | Enhanced |
| `WriteStage.tsx` | +74 | Enhanced |
| `create/page.tsx` | +47 | Fixed |
| `generate-plan/route.ts` | +27 | Enhanced |
| `publish/route.ts` | +24 | Enhanced |
| `write-article/route.ts` | +54 | Enhanced |
| `InsightsPageClient.tsx` | +816 / -355 | Redesigned |
| `CareerSiloClient.tsx` | +72 | Enhanced |
| `CompaniesSiloClient.tsx` | +72 | Enhanced |
| `PillarArticlePage.tsx` | +74 | Enhanced |
| `EmploymentGuideSiloClient.tsx` | +66 | Enhanced |
| `InterviewSiloClient.tsx` | +66 | Enhanced |
| `JobsSiloClient.tsx` | +66 | Enhanced |
| `SalarySiloClient.tsx` | +886 | Enhanced |
| `TrainingSiloClient.tsx` | +66 | Enhanced |
| `WorklifeSiloClient.tsx` | +66 | Enhanced |
| `SiloVisualization.tsx` | +713 | Enhanced |
| **NEW:** `SiloArticleClient.tsx` | +652 | Added |

---

## Testing Recommendations

1. **Pillar Article Creation**
   - Create a pillar post from silo visualization
   - Verify word count target shows 3000-4000
   - Confirm redirect goes to silo page after publish

2. **Supporting Article Creation**
   - Create a supporting article
   - Verify word count target shows 1800-2200
   - Confirm redirect goes to article page after publish

3. **Plan Editing**
   - Generate a plan
   - Click Edit, modify sections/FAQs
   - Save changes and verify persistence

4. **Insights Page Navigation**
   - Click on silo cards, verify loading animations
   - Click on article cards, verify loading animations
   - Test category filter pills

5. **Article Rendering**
   - View articles with `content_part1/2/3` fields
   - Verify images appear between content sections
   - Check silo-themed styling

---

## Breaking Changes

None. All changes are backwards compatible with existing content.

---

## Next Steps

- [ ] Merge to `main` after review
- [ ] Monitor pillar post word counts in production
- [ ] Consider adding word count warnings in WriteStage if significantly off target
