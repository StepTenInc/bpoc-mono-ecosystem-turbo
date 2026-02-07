# Merge Guide: `emman-insights-updated` → `main`

**Branch:** `emman-insights-updated`
**Target:** `main`
**Date:** January 30, 2026

---

## Pre-Merge Checklist

- [ ] All changes tested locally
- [ ] No console errors in browser
- [ ] Pillar article creation flow works
- [ ] Supporting article creation flow works
- [ ] Insights page loads correctly with silos
- [ ] Article pages render with proper styling

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
- Add inline plan editing in Stage 3
- Redesign Insights page with silo cards and loading states
- Add SiloArticleClient for themed article rendering
- Improve word count validation and feedback

## Key Changes
| Feature | Description |
|---------|-------------|
| Pillar Articles | 3000-4000 word targets for hub content |
| Supporting Articles | 1800-2200 word targets for subtopics |
| Plan Editing | Inline editing of sections, FAQs, titles |
| Insights Page | New silo cards with loading animations |
| Article Rendering | Silo-themed markdown with section images |

## Testing Checklist
- [ ] Create pillar article (verify 3000-4000 word target)
- [ ] Create supporting article (verify 1800-2200 word target)
- [ ] Test plan editing (add/remove sections, FAQs)
- [ ] Verify Insights page navigation and loading states
- [ ] Check article rendering with content_part1/2/3 and images
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

## Files Changed Summary

| Category | Files | Lines Changed |
|----------|-------|---------------|
| Pipeline Stages | 3 files | +473 |
| API Routes | 3 files | +105 |
| Insights UI | 2 files | +826 |
| Silo Clients | 8 files | +546 |
| Components | 2 files | +787 |
| **New File** | `SiloArticleClient.tsx` | +652 |
| **Total** | **18 files** | **+2,608 / -943** |

---

## Related Documentation

- `BRANCH_CHANGES_emman-insights-updated.md` - Detailed changelog with all features and fixes

---

## Support

If you encounter issues during the merge:
1. Check for merge conflicts in the files listed above
2. Run `npm run build` locally to catch TypeScript errors
3. Test the critical flows before pushing
