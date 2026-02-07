# Merge Guide: `emman-insights-updated` → `main`

**Branch:** `emman-insights-updated`
**Target:** `main`
**Date:** January 30, 2026
**Total Files Changed:** 99 files
**Lines Added:** ~20,526
**Lines Removed:** ~3,235

---

## Pre-Merge Checklist

- [ ] All changes tested locally
- [ ] No console errors in browser
- [ ] Pillar article creation flow works
- [ ] Supporting article creation flow works
- [ ] Insights page loads correctly with silos
- [ ] Article pages render with proper styling
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

### Database Migrations Required
Before merging, these SQL migrations must be applied to production:

```
supabase/migrations/20260127_add_section_images_to_insights_posts.sql
supabase/migrations/20260128_add_pillar_posts.sql
supabase/migrations/20260128_create_insights_silos.sql
supabase/migrations/20260128_insights_silos_complete.sql
```

**Run in order:**
```bash
# Connect to Supabase and run each migration
supabase db push
# OR run manually via Supabase dashboard SQL editor
```

### Environment Variables Required
Ensure these are set in production:

```env
# Google AI (Imagen & Veo)
GOOGLE_GENERATIVE_AI_API_KEY=your_key

# Runway (fallback for video)
RUNWAY_API_KEY=your_key

# Optional: Additional image providers
STABILITY_API_KEY=your_key
LEONARDO_API_KEY=your_key
```

---

## Step 1: Ensure Your Branch is Up to Date

First, make sure your local branch has all the latest changes and that `main` is up to date.

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Switch back to your feature branch
git checkout emman-insights-updated

# Rebase your branch onto latest main (recommended)
git rebase main
```

**If you prefer merge instead of rebase:**
```bash
git checkout emman-insights-updated
git merge main
```

---

## Step 2: Resolve Any Conflicts

If conflicts occur during rebase/merge, resolve them:

```bash
# Check which files have conflicts
git status

# After resolving conflicts in each file:
git add <resolved-file>

# Continue rebase
git rebase --continue

# OR if merging:
git commit
```

### Likely Conflict Areas

Based on the changes, potential conflict files:
- `src/app/insights/InsightsPageClient.tsx` (major redesign)
- `src/app/api/admin/insights/pipeline/*` (API routes)
- `src/app/(admin)/admin/insights/create/components/*` (pipeline stages)

---

## Step 3: Push Your Updated Branch

```bash
# Push the rebased/updated branch
git push origin emman-insights-updated --force-with-lease
```

> **Note:** Use `--force-with-lease` instead of `--force` for safety - it will fail if someone else pushed to the branch.

---

## Step 4: Create Pull Request (if not already created)

### Via GitHub CLI:
```bash
gh pr create --title "Insights Pipeline: Pillar/Supporting Article System & UI Enhancements" --body "See docs/branch-docs/ for details"
```

### Via GitHub Web:
1. Go to your repository on GitHub
2. Click "Compare & pull request" for `emman-insights-updated`
3. Fill in PR details using info from `BRANCH_CHANGES_emman-insights-updated.md`
4. Request reviewers

### Suggested PR Description:

```markdown
## Summary
- Implement pillar vs supporting article word count system
- Add dynamic silo routing with pillar post support
- Integrate Google Imagen 4 and Veo for media generation
- Enhance pipeline stages with redo/compare functionality
- Redesign Insights page with silo cards and loading states
- Add SiloArticleClient for themed article rendering
- Add section image alt text for SEO

## Key Changes
| Feature | Description |
|---------|-------------|
| Pillar Articles | 3000-4000 word targets for hub content |
| Supporting Articles | 1800-2200 word targets for subtopics |
| Silo System | Dynamic routing with /insights/silo/[slug] |
| AI Media | Google Imagen 4 + Veo for images/videos |
| Plan Editing | Inline editing of sections, FAQs, titles |
| Insights Page | New silo cards with loading animations |
| Article Rendering | Silo-themed markdown with section images |

## Testing Checklist
- [ ] Create pillar article (verify 3000-4000 word target)
- [ ] Create supporting article (verify 1800-2200 word target)
- [ ] Test plan editing (add/remove sections, FAQs)
- [ ] Verify Insights page navigation and loading states
- [ ] Check article rendering with content_part1/2/3 and images
- [ ] Test image generation in Stage 8
- [ ] Test video generation in Stage 8
```

---

## Step 5: Merge the Pull Request

### Option A: Squash and Merge (Recommended)
Combines all commits into one clean commit on main.

```bash
# Via GitHub CLI
gh pr merge --squash --delete-branch
```

**Or via GitHub Web:** Click "Squash and merge" button

### Option B: Merge Commit
Preserves all individual commits.

```bash
gh pr merge --merge --delete-branch
```

### Option C: Rebase and Merge
Replays commits on top of main.

```bash
gh pr merge --rebase --delete-branch
```

---

## Step 6: Post-Merge Cleanup

```bash
# Switch to main and pull the merged changes
git checkout main
git pull origin main

# Delete local feature branch
git branch -d emman-insights-updated

# Prune remote tracking branches
git fetch --prune
```

---

## Step 7: Deploy Verification

After merging, verify in the deployed environment:

### Admin Panel (`/admin/insights/create`)
- [ ] Create new article
- [ ] Verify pillar/supporting badge shows correct word count
- [ ] Test plan editing functionality
- [ ] Confirm word count validation colors work
- [ ] Test image generation (Imagen 4)
- [ ] Test video generation (Veo)

### Admin Silos (`/admin/insights/silos`)
- [ ] Page loads correctly
- [ ] Can create new silo
- [ ] Can edit existing silo
- [ ] Can delete silo

### Insights Page (`/insights`)
- [ ] Verify silo cards display correctly
- [ ] Test navigation loading animations
- [ ] Check article cards render properly
- [ ] Test category filter pills

### Article Pages (`/insights/[silo]/[slug]`)
- [ ] Verify content sections render
- [ ] Check images appear between sections
- [ ] Confirm silo theming applied
- [ ] Test share buttons and sidebar

---

## Major Changes Summary

### 1. Insights Silo System (NEW)
- **Admin Silos Management:** `/admin/insights/silos`
- **Dynamic Silo Pages:** `/insights/[silo-slug]`
- **Pillar Post Support:** Each silo can have a pillar article
- **API Routes:**
  - `GET/POST /api/admin/silos`
  - `GET/PUT/DELETE /api/admin/silos/[id]`
  - `GET /api/silos` (public)
  - `GET /api/silos/[slug]` (public)

### 2. AI Media Generation (Google APIs)
- **Google Imagen 4** for image generation (primary)
- **Google Veo** for video generation (primary)
- **Runway** as fallback for both
- New service files:
  - `src/lib/imagen-service.ts`
  - `src/lib/veo-service.ts`

### 3. Pipeline Stage Improvements
All 8 stages enhanced with:
- Redo/Compare functionality
- Better error handling
- Progress indicators
- Auto-save on blur (meta title, description)

### 4. SEO Enhancements
- Section image alt text generation & saving
- Canonical slug editing in Stage 7
- Schema markup generation
- Focus keyword tracking

---

## Files Deleted (Consolidated into Dynamic Routing)

These static silo pages were deleted and replaced by dynamic `/insights/silo/[slug]`:

```
src/app/insights/career/CareerSiloClient.tsx
src/app/insights/career/[slug]/page.tsx
src/app/insights/career/page.tsx
src/app/insights/companies/CompaniesSiloClient.tsx
src/app/insights/companies/[slug]/page.tsx
src/app/insights/companies/page.tsx
src/app/insights/employment-guide/...
src/app/insights/interview/...
src/app/insights/jobs/...
src/app/insights/salary/...
src/app/insights/training/...
src/app/insights/worklife/...
```

**Replaced by:**
```
src/app/insights/silo/[slug]/page.tsx
src/app/insights/silo/[slug]/SiloPageClient.tsx
src/app/insights/components/SiloArticleClient.tsx
src/app/insights/components/PillarArticlePage.tsx
```

---

## New Silo Slugs

Update your database with the new SEO-friendly slugs:

| Old Slug | New Slug |
|----------|----------|
| career | bpo-career-growth |
| companies | bpo-company-reviews |
| employment-guide | bpo-employment-guide |
| jobs | bpo-jobs |
| salary | bpo-salary-compensation |
| interview | interview-tips |
| training | training-and-certifications |
| worklife | work-life-balance |

See `Docs/Branch-Docs/UPDATE_SILO_SLUGS.sql` for the migration script.

---

## Files Changed Summary

| Category | Files | Description |
|----------|-------|-------------|
| Pipeline Stages | 8 files | BriefStage, PlanStage, ResearchStage, WriteStage, HumanizeStage, SeoStage, MetaStage, PublishStage |
| API Routes | 20+ files | Pipeline endpoints, silo endpoints, media generation |
| Insights UI | 5 files | InsightsPageClient, SiloPageClient, PillarArticlePage |
| Admin UI | 3 files | Insights page, Silos page, test-image-gen |
| Services | 2 files | imagen-service.ts, veo-service.ts |
| Migrations | 4 files | Database schema updates |
| **Total** | **99 files** | **+20,526 / -3,235 lines** |

---

## Rollback Procedure

If critical issues are discovered after merge:

```bash
# Find the commit hash before the merge
git log --oneline -10

# Revert the merge commit (use -m 1 for merge commits)
git revert -m 1 <merge-commit-hash>

# Push the revert
git push origin main
```

**For immediate rollback via GitHub:**
1. Go to the merged PR
2. Click "Revert" button
3. Merge the revert PR

---

## Quick Commands Reference

### Full Merge Workflow
```bash
# Update branches
git checkout main && git pull origin main
git checkout emman-insights-updated
git rebase main
git push origin emman-insights-updated --force-with-lease

# After PR approval - merge via GitHub or:
gh pr merge --squash --delete-branch

# Cleanup
git checkout main && git pull origin main
git branch -d emman-insights-updated
```

### One-liner (after PR is approved)
```bash
gh pr merge --squash --delete-branch && git checkout main && git pull
```

---

## Commit History (This Branch)

```
3c85601 Check Branch-Docs Folder on Docs Folder
1b6726b Add insights silos for career and companies
46e4698 Enhance silo selection and pipeline article flow
2251860 Will continue fixing Stage 5 : Humanize tomorrow
6488873 Made Google API as the agent for image and video generation
a9df893 BRANCH_CHANGES and MERGE_GUIDE inside MERGE_GUIDE folder
285d298 Add comparison and redo flows for Plan, SEO, and Meta stages
31154df Update PlanStage.tsx
1c777af Add version comparison and redo for pipeline stages
5dcc6a2 Redesign BriefStage with BPOC styling and AI suggestions
```

---

## Known Issues / Notes

1. **Canonical Slug:** Only saves at publish time, not on blur (by design)
2. **Focus Keyword:** Only saves at publish time, not on blur (by design)
3. **Video Generation:** May take 1-3 minutes with Veo/Runway
4. **Image Generation:** Uses Imagen 4 with Fast fallback

---

## Related Documentation

- `BRANCH_CHANGES_emman-insights-updated.md` - Detailed changelog with all features and fixes
- `UPDATE_SILO_SLUGS.sql` - SQL script for updating silo slugs
- `SEO_IMPROVEMENT_PLAN.md` - SEO strategy documentation

---

## Support

If you encounter issues during the merge:
1. Check for merge conflicts in the files listed above
2. Run `npm run build` locally to catch TypeScript errors
3. Test the critical flows before pushing

---

## Contact

For questions about this merge:
- **Branch Owner:** Emman
- **Last Updated:** 2026-01-30
