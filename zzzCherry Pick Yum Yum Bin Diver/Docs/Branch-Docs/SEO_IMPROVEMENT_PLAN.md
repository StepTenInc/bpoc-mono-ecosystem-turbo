# SEO Improvement Plan for BPOC Insights

**Created:** January 30, 2026
**Status:** Planning
**Priority Focus:** High-impact, low-effort improvements first

---

## Current SEO Score Card

| Feature | Status | Impact |
|---------|--------|--------|
| Meta Title & Description | Implemented | High |
| Open Graph Tags | Implemented | Medium |
| Twitter Cards | Implemented | Medium |
| Canonical URLs | Implemented | High |
| Article Schema (JSON-LD) | Partial | High |
| Collection Page Schema | Implemented | Medium |
| FAQ Schema | Missing | High |
| Breadcrumb Schema | Missing | Medium |
| Sitemap.xml | Needs Verification | Critical |
| robots.txt | Needs Verification | Critical |

---

## Priority 1: Critical (Do First)

### 1.1 Verify/Create Dynamic Sitemap
**Impact:** Critical | **Effort:** Low | **Timeline:** 1 day

Search engines need a sitemap to discover all your content efficiently.

**Check if exists:**
```
/sitemap.xml
/app/sitemap.ts (Next.js dynamic sitemap)
```

**Implementation needed:**
```typescript
// src/app/sitemap.ts
export default async function sitemap() {
  const posts = await getAllPosts();
  const silos = await getAllSilos();

  return [
    { url: 'https://www.bpoc.io/insights', lastModified: new Date() },
    ...silos.map(silo => ({
      url: `https://www.bpoc.io/insights/${silo.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...posts.map(post => ({
      url: `https://www.bpoc.io/insights/${post.silo_slug}/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
```

---

### 1.2 Verify/Create robots.txt
**Impact:** Critical | **Effort:** Low | **Timeline:** 30 mins

**Check if exists:** `/public/robots.txt`

**Recommended content:**
```
User-agent: *
Allow: /

Sitemap: https://www.bpoc.io/sitemap.xml

# Block admin routes from indexing
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
```

---

### 1.3 Add JSON-LD Schema to Silo Article Pages
**Impact:** High | **Effort:** Medium | **Timeline:** 2-3 hours

Currently, articles under silo routes (`/insights/bpo-salary-compensation/[slug]`) don't have JSON-LD schema. Only the legacy `/insights/[slug]` route has it.

**Files to update:**
- `src/app/insights/components/SiloArticleClient.tsx`
- Or add to each `[slug]/page.tsx` in silo folders

**Schema to add:**
```typescript
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.description,
  image: post.hero_url,
  datePublished: post.published_at,
  dateModified: post.updated_at,
  author: {
    '@type': 'Person',
    name: post.author || 'Ate Yna',
    url: 'https://www.bpoc.io/about/ate-yna'
  },
  publisher: {
    '@type': 'Organization',
    name: 'BPOC.IO',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.bpoc.io/logo.png'
    }
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': canonicalUrl
  },
  articleSection: siloName,
  wordCount: post.word_count,
  keywords: post.keywords?.join(', ')
};
```

---

## Priority 2: High Impact (Do This Week)

### 2.1 FAQ Schema for Article FAQ Sections
**Impact:** High | **Effort:** Medium | **Timeline:** 3-4 hours

Articles have FAQ sections that should be marked up with `FAQPage` schema. This enables FAQ rich snippets in Google search results.

**Implementation:**
```typescript
// Generate FAQ schema from article content
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: post.faq?.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
};
```

**Where to add:**
- Parse FAQ section from article content OR
- Store FAQ as structured data in database (recommended)
- Add to `SiloArticleClient.tsx` or page component

**Database change needed:**
```sql
ALTER TABLE insights_posts ADD COLUMN faq JSONB DEFAULT '[]';
-- Format: [{"question": "...", "answer": "..."}]
```

---

### 2.2 Breadcrumb Schema
**Impact:** Medium-High | **Effort:** Low | **Timeline:** 1-2 hours

Helps Google understand site hierarchy and can show breadcrumbs in search results.

**Implementation:**
```typescript
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.bpoc.io'
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Insights',
      item: 'https://www.bpoc.io/insights'
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: siloName,
      item: `https://www.bpoc.io/insights/${siloSlug}`
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: post.title,
      item: canonicalUrl
    }
  ]
};
```

---

### 2.3 Update Canonical URLs to Production Domain
**Impact:** High | **Effort:** Low | **Timeline:** 1 hour

Some pages still reference `bpoc-stepten.vercel.app` instead of `www.bpoc.io`.

**Files to check:**
- `src/app/insights/page.tsx` (lines 44, 61, 74, 75, 81, 87)
- All silo `page.tsx` files

**Find and replace:**
```
bpoc-stepten.vercel.app → www.bpoc.io
```

---

## Priority 3: Medium Impact (Do This Month)

### 3.1 How-To Schema for Tutorial Articles
**Impact:** Medium | **Effort:** Medium | **Timeline:** 4-5 hours

For step-by-step guides, add `HowTo` schema to enable rich snippets.

**Implementation:**
```typescript
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: post.title,
  description: post.description,
  image: post.hero_url,
  totalTime: 'PT15M', // Reading time
  step: post.steps?.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.title,
    text: step.content,
    image: step.image
  }))
};
```

**Use for articles in:**
- Interview Tips silo
- Training & Certifications silo
- Employment Guide silo

---

### 3.2 Organization Schema on Main Pages
**Impact:** Medium | **Effort:** Low | **Timeline:** 1 hour

Add organization schema to help Google understand the brand.

```typescript
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BPOC.IO',
  url: 'https://www.bpoc.io',
  logo: 'https://www.bpoc.io/logo.png',
  description: 'BPO career platform connecting Filipino professionals with global opportunities',
  sameAs: [
    'https://www.facebook.com/bpocio',
    'https://www.linkedin.com/company/bpocio',
    'https://twitter.com/bpocio'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@bpoc.io'
  }
};
```

---

### 3.3 Silo Landing Page Schema
**Impact:** Medium | **Effort:** Medium | **Timeline:** 2-3 hours

Add proper schema for silo landing pages (e.g., `/insights/bpo-salary-compensation`).

```typescript
const siloSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: silo.name,
  description: silo.description,
  url: `https://www.bpoc.io/insights/${silo.slug}`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'BPOC.IO',
    url: 'https://www.bpoc.io'
  },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: articles.length,
    itemListElement: articles.map((article, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.bpoc.io/insights/${silo.slug}/${article.slug}`
    }))
  }
};
```

---

## Priority 4: Nice to Have (Backlog)

### 4.1 Video Schema for Video Articles
**Impact:** Medium | **Effort:** Medium

For articles with video heroes, add `VideoObject` schema.

```typescript
const videoSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: post.title,
  description: post.description,
  thumbnailUrl: post.hero_url,
  uploadDate: post.published_at,
  contentUrl: post.video_url,
  embedUrl: post.video_url
};
```

---

### 4.2 Author Pages with Person Schema
**Impact:** Low-Medium | **Effort:** High

Create dedicated author pages with proper `Person` schema.

---

### 4.3 Reading Progress & Time Tracking
**Impact:** Low | **Effort:** Medium

Add `timeRequired` to Article schema based on word count.

```typescript
timeRequired: `PT${Math.ceil(wordCount / 200)}M` // ~200 words per minute
```

---

### 4.4 Review/Rating Schema (If Applicable)
**Impact:** Medium | **Effort:** High

For company review articles in `bpo-company-reviews` silo.

---

## Implementation Checklist

### Week 1 (Critical)
- [ ] Verify/create `sitemap.xml`
- [ ] Verify/create `robots.txt`
- [ ] Add Article JSON-LD to silo article pages
- [ ] Fix canonical URLs to use production domain

### Week 2 (High Impact)
- [ ] Add FAQ schema to articles
- [ ] Add Breadcrumb schema
- [ ] Store FAQ data in database

### Week 3-4 (Medium Impact)
- [ ] Add HowTo schema for tutorial articles
- [ ] Add Organization schema
- [ ] Add Silo landing page schema

### Backlog
- [ ] Video schema
- [ ] Author pages
- [ ] Review schema

---

## Quick Wins Summary

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Fix canonical URLs | High | 30 min | Do now |
| Verify sitemap.xml | Critical | 1 hour | Do now |
| Verify robots.txt | Critical | 30 min | Do now |
| Article schema in silo pages | High | 2 hours | Do now |
| Breadcrumb schema | Medium | 1 hour | This week |
| FAQ schema | High | 3 hours | This week |

---

## Resources

- [Google Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool)
- [Schema.org Article](https://schema.org/Article)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data)

---

## Notes

1. **Test all schema changes** using Google's Rich Results Test before deploying
2. **Monitor Search Console** after implementing changes to catch errors
3. **Don't over-optimize** - only add schema that's genuinely relevant
4. **Keep content quality high** - schema helps discovery but content drives engagement
