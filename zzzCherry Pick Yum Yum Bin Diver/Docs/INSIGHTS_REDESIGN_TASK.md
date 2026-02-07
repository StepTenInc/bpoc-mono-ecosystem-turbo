# 🎨 Insights Page Redesign Task

**For:** Emmon  
**From:** Stephen (via Pinky)  
**Priority:** High  
**Scope:** Styling & UX improvements only — NO breaking changes to data/functionality

---

## TL;DR

Make the Insights page sexy, mobile-friendly, and modern without breaking anything. Focus on layout, animations, and UX — the content is already there.

---

## 🎯 The Vision

Transform the Insights page from a basic blog listing into something that feels premium, interactive, and mobile-native. Think Medium meets Airbnb — clean, gesture-friendly, and content-first.

---

## 📋 Specific Changes Required

### 1. Hero Section
- [ ] Add Hero Video at the top (we have the `hero-videos` bucket)
- [ ] Move **Explore Categories** ABOVE the hero video
- [ ] Categories should be a **horizontal scroll/swipe carousel**
  - Single row, not two lines
  - Sexy pill buttons or cards
  - Swipe left/right on mobile
  - Mouse drag on desktop
  - Subtle animation on hover/select

### 2. Category Buttons
**Current:** Two rows of text links  
**New:** Horizontal scrolling chips/pills

```
Ideas for styling:
- Gradient backgrounds on active state
- Subtle shadow/glow on hover
- Icons next to category names
- Smooth scroll snap behavior
```

### 3. Content Display (Most Important!)
- [ ] **Show content SOONER** — reduce scroll distance to first article
- [ ] Remove redundant sections (we have categories twice basically)
- [ ] Articles should be the hero, not buried

### 4. Article Cards
**Current:** Basic grid  
**New:** Rich cards with more info

Add to each card:
- [ ] Read time estimate (e.g., "5 min read")
- [ ] Category tag/badge
- [ ] Author avatar (if available)
- [ ] Publish date in friendly format ("2 days ago")
- [ ] Subtle hover animation (lift/shadow)

**Layout options:**
- Masonry grid (Pinterest style)
- Or clean 3-column grid with equal heights
- Mobile: Single column, full-width cards

### 5. Pagination
**Current:** "All Articles (53)" with no pagination  
**New:** Proper pagination

Options (pick one):
1. **Load More button** — click to append more articles
2. **Infinite scroll** — auto-load as user scrolls
3. **Traditional pagination** — Page 1, 2, 3... (boring but functional)
4. **"Show X per page" dropdown** — user chooses 9/18/36

**SEO Requirements:**
- Each paginated page needs unique meta title
- Each paginated page needs unique meta description
- Proper canonical URLs
- Example: `/insights?page=2` with title "Industry Insights - Page 2 | BPOC"

### 6. Individual Article Pages (Silos)
Each category/article page needs:
- [ ] Improved typography
- [ ] Better reading experience
- [ ] Related articles at bottom
- [ ] Share buttons
- [ ] Back to category navigation

---

## 📱 Mobile-First Ideas

Make it feel native on phones:

### Gesture Support
```javascript
// Swipe gestures to implement:
- Swipe left/right on category carousel
- Pull-to-refresh (optional)
- Swipe between articles (optional, like Stories)
```

### Touch Optimizations
- Large tap targets (min 44x44px)
- Thumb-friendly navigation
- Bottom sheet for filters (not dropdowns)
- Haptic feedback on interactions (if possible)

### Animations
```css
/* Smooth, subtle, performant */
- Card entrance animations (stagger fade-in)
- Skeleton loading states
- Smooth scroll behavior
- Parallax on hero (subtle!)
- Category pills slide in on load
```

---

## 🎨 Design Inspiration

Tell your AI to look at:
- **Medium.com** — clean reading experience
- **Airbnb Experiences** — card design, horizontal scroll
- **Apple Newsroom** — typography, whitespace
- **Notion blogs** — simple but elegant
- **Stripe blog** — modern, professional

---

## ⚠️ What NOT to Change

- Don't touch the API/data layer
- Don't change URL structures (SEO risk)
- Don't remove any existing functionality
- Don't change the CMS/admin side
- Keep all existing content intact

---

## 🛠️ Technical Notes

- Use existing Tailwind classes where possible
- Keep bundle size in check (no huge animation libraries)
- Test on mobile FIRST, then desktop
- Use CSS scroll-snap for carousels (native, performant)
- Lazy load images below the fold

---

## 📝 Suggested Prompt for Your AI

> "I need to redesign a blog/insights listing page. Current state: basic grid of articles with categories. Goal: Make it feel like a premium publication — Medium meets Airbnb. 
>
> Requirements:
> 1. Horizontal scrolling category pills at top
> 2. Hero video section
> 3. Rich article cards with read time, author, date
> 4. Mobile-first with swipe gestures
> 5. Pagination (load more or infinite scroll)
> 6. Subtle animations (card hover, entrance effects)
> 7. Keep existing functionality, just restyle
>
> Use Tailwind CSS. Make it sexy but performant."

---

## ✅ Definition of Done

- [ ] Categories are horizontal scroll carousel
- [ ] Hero video displays properly
- [ ] Article cards show read time + date + category
- [ ] Pagination works with proper meta tags
- [ ] Looks great on mobile (test on real phone!)
- [ ] Animations are smooth, not janky
- [ ] No console errors
- [ ] Lighthouse score doesn't tank

---

---

## 🔄 UPDATE: Dynamic Content Strategy

### The Problem
As we get more content, having all dynamic content at the top becomes overwhelming. Need a smarter approach.

### Recommended Approach
**Show only popular/recommended content in the silo itself, then "View All" link**

```
SILO PAGE STRUCTURE:
┌─────────────────────────────────┐
│  Hero / Category Header         │
├─────────────────────────────────┤
│  Featured Articles (3-4 max)    │  ← Popular/recommended only
│  "View All [Category]" button   │  ← Links to full listing
├─────────────────────────────────┤
│  Main Article Content           │
├─────────────────────────────────┤
│  Related Articles (3-4)         │
└─────────────────────────────────┘
```

### Options Considered (for reference):
1. ❌ Dynamic content at bottom — gets buried
2. ❌ Dynamic content in article — don't want to mess with articles
3. ❌ Sidebar content — can work but cluttered
4. ✅ **Recommendations + "View All"** — cleanest approach

---

## 📄 Inner Article Page Fixes

### Layout
- [ ] Fix padding/margins (too tight or too loose?)
- [ ] Ensure all images display correctly
- [ ] Make sidebar **sticky** on scroll
- [ ] Responsive image sizing

### "View Other Articles" Section
- [ ] Decide how many to show (3? 4? 6?)
- [ ] Should be related/same category
- [ ] Clean card design matching outer page

### Sticky Sidebar
```css
/* Example sticky implementation */
.article-sidebar {
  position: sticky;
  top: 80px; /* below header */
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
```

Contents:
- Table of contents (if long article)
- Related articles
- Share buttons
- Author info

---

**Questions?** Ping Stephen or Pinky.

*Let's make this shit look sick! 🔥*
