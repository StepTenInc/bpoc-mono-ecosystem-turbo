# BPOC WEB (Marketing/Public) App Audit

**Date:** February 8, 2026  
**Auditor:** Pinky (AI Agent)  
**Purpose:** Audit the WEB app migration from monolith to monorepo

---

## 📍 Overview

The WEB app is the **public-facing marketing site** for BPOC.IO. It serves:
- Marketing landing pages (home, about, how-it-works)
- Public job board
- Insights/blog content (SEO silos)
- Free tools (resume builder, typing test, salary calculator)
- Legal pages
- Auth callback handling

---

## 🔌 API Routes Needed for Public Site

### ✅ Critical Public APIs (Must Have)

| Route | Purpose | Status in New Web App |
|-------|---------|----------------------|
| `/api/marketing/stats` | Homepage stats (candidates, jobs, placements) | ❌ **MISSING** |
| `/api/marketing/analyze-resume` | Free resume analyzer for marketing funnel | ❌ **MISSING** |
| `/api/jobs/public` | List active jobs (no auth required) | ❌ **MISSING** |
| `/api/jobs/public/[id]` | Single job details (no auth required) | ❌ **MISSING** |
| `/api/jobs/apply` | Job application (requires auth) | ❌ **MISSING** |
| `/api/live-activity` | Live activity feed for homepage | ❌ **MISSING** |
| `/api/silos` | List active silos for insights | ❌ **MISSING** |
| `/api/silos/[slug]` | Get silo with articles | ❌ **MISSING** |
| `/api/get-saved-resume/[slug]` | Fetch public resume for viewing | ❌ **MISSING** |
| `/api/og/resume` | OG image generation for resume shares | ❌ **MISSING** |
| `/api/public/users/exists` | Check if email exists (signup flow) | ❌ **MISSING** |
| `/api/anon/session` | Upsert anonymous session data | ❌ **MISSING** |
| `/api/anon/claim` | Claim anonymous session after signup | ❌ **MISSING** |
| `/api/anon/claim-all` | Claim all sessions for email | ❌ **MISSING** |
| `/api/save-resume` | Save resume (anon or authenticated) | ❌ **MISSING** |
| `/api/parse-location` | Parse location string | ❌ **MISSING** |
| `/auth/callback` | OAuth callback handler | ✅ **EXISTS** |

### 📋 Secondary Public APIs (Nice to Have)

| Route | Purpose | Notes |
|-------|---------|-------|
| `/api/jobs/combined` | Combined job list with processing | Used by some components |
| `/api/jobs/combined/[id]` | Combined job detail | Used by some components |
| `/api/v1/embed/jobs` | Embeddable jobs widget | For external sites |

---

## 📄 Page Inventory

### ✅ Pages Present in New Web App

| Page | Path | Status |
|------|------|--------|
| Home (redirect) | `/` | ✅ Works - redirects to /home |
| Home | `/home` | ✅ Complete |
| About | `/about` | ✅ Complete |
| How It Works | `/how-it-works` | ✅ Complete |
| Contact/Support | `/contact-support` | ✅ Complete |
| Jobs Board | `/jobs` | ✅ Complete |
| Job Detail | `/jobs/[id]` | ✅ Complete |
| Job Matching | `/jobs/job-matching` | ✅ Complete |
| Interview Prep | `/jobs/interview-prep` | ✅ Complete |
| Insights Hub | `/insights` | ✅ Complete |
| Insights Article | `/insights/[slug]` | ✅ Complete |
| Insights Silo | `/insights/silo/[slug]` | ✅ Complete |
| BPO Career Growth | `/insights/bpo-career-growth` | ✅ Complete |
| BPO Company Reviews | `/insights/bpo-company-reviews` | ✅ Complete |
| BPO Employment Guide | `/insights/bpo-employment-guide` | ✅ Complete |
| BPO Jobs | `/insights/bpo-jobs` | ✅ Complete |
| BPO Salary Compensation | `/insights/bpo-salary-compensation` | ✅ Complete |
| Interview Tips | `/insights/interview-tips` | ✅ Complete |
| Training & Certifications | `/insights/training-and-certifications` | ✅ Complete |
| Work-Life Balance | `/insights/work-life-balance` | ✅ Complete |
| Tools Hub | `/tools` | ✅ Complete |
| Typing Test | `/tools/typing-test` | ✅ Complete (NEW - not in old backup!) |
| Salary Calculator | `/tools/salary-calculator` | ✅ Complete |
| Email Signature | `/tools/email-signature` | ✅ Complete |
| LinkedIn Optimizer | `/tools/linkedin-optimizer` | ✅ Complete |
| Skills Gap Analysis | `/tools/skills-gap` | ✅ Complete |
| Resume Builder | `/try-resume-builder` | ✅ Complete |
| Public Resume | `/resume/[slug]` | ✅ Complete |
| Talent Search | `/talent-search` | ✅ Complete |
| Author Page | `/author/[slug]` | ✅ Complete |
| Profile Page | `/profile/[slug]` | ✅ Complete |
| Developer Docs | `/developer/docs` | ✅ Complete |
| Auth Callback | `/auth/callback` | ✅ Complete |
| Reset Password | `/reset-password` | ✅ Complete |
| Privacy Policy | `/privacy-policy` | ✅ Complete |
| Terms & Conditions | `/terms-and-conditions` | ✅ Complete |
| Cookie Policy | `/cookie-policy` | ✅ Complete |
| Data Security | `/data-security` | ✅ Complete |

### ⚠️ Pages in Old Backup but NOT in New Web App

| Page | Path | Notes |
|------|------|-------|
| None! | - | All pages have been migrated |

### 🆕 Pages in New Web App but NOT in Old Backup

| Page | Path | Notes |
|------|------|-------|
| Typing Test | `/tools/typing-test` | **NEW** tool added! |

---

## 🧩 Components Inventory

### Shared Components (in `/src/components/shared/`)
- ✅ `ui/` - Full UI component library (button, card, badge, etc.)
- ✅ `layout/` - Header, Footer components
- ✅ `auth/` - Auth components
- ✅ `application/` - Application flow components
- ✅ `sections/` - Page sections
- ✅ `offer/` - Offer components
- ✅ `debug/` - Debug tools
- ✅ `NotificationBell.tsx` - Notifications
- ✅ `ApplicationPathBadge.tsx` - Application status
- ✅ `ClientOnly.tsx` - Client-side rendering helper

### Insights Components (in `/src/components/insights/`)
- ✅ `AuthorBio.tsx`
- ✅ `ResumeBuilderCTA.tsx`
- ✅ `SignUpCTA.tsx`
- ✅ `StickySidebarCTA.tsx`

### Domain Components (in `/src/components/`)
- ✅ `admin/` - Admin components
- ✅ `candidate/` - Candidate components
- ✅ `chat/` - Chat components
- ✅ `client/` - Client components
- ✅ `hr/` - HR components
- ✅ `onboarding/` - Onboarding components
- ✅ `profile/` - Profile components
- ✅ `recruiter/` - Recruiter components
- ✅ `resume/` - Resume components
- ✅ `video/` - Video call components

---

## 🔍 SEO Audit

### ✅ What's Good

1. **Sitemap Generation** - Dynamic sitemap exists in old backup (`sitemap.ts`)
   - Fetches insights articles from Supabase
   - Fetches active jobs
   - Fetches silo pillar pages
   - Revalidates every hour

2. **Metadata** - Rich metadata in layout.tsx:
   - OpenGraph tags
   - Twitter cards
   - Schema.org Organization markup
   - Robots directives

3. **Silo Structure** - Full silo architecture for insights:
   - 8 category silos with dedicated pages
   - Pillar posts per silo
   - Internal linking structure

### ❌ What's Missing

1. **Sitemap in New App** - ❌ sitemap.ts not found in new web app
   - Need to migrate from old backup

2. **OG Image Generation** - ❌ `/api/og/resume` not migrated
   - Generates dynamic OG images for resume shares
   - Important for social sharing virality

3. **Structured Data** - ⚠️ Limited structured data
   - Only Organization schema in layout
   - Should add:
     - Job Posting schema for `/jobs/[id]`
     - Article schema for `/insights/[slug]`
     - FAQPage schema for relevant pages

4. **Canonical URLs** - Not audited, need to verify

---

## 🚨 Critical Missing Items

### 1. API Routes (Highest Priority)

The web app has **NO API routes** except auth/callback. All these need to be either:
- **Option A:** Migrate routes into the web app
- **Option B:** Create a shared API app in the monorepo
- **Option C:** Use packages for shared logic

**Recommended:** Create `/apps/api/` or add routes to web app directly.

### 2. Sitemap (High Priority)

```
Location: ~/Desktop/bpoc-cherry-pick-backup/src/app/sitemap.ts
Action: Copy to ~/Desktop/bpoc-mono/apps/web/src/app/sitemap.ts
```

### 3. OG Image Route (Medium Priority)

```
Location: ~/Desktop/bpoc-cherry-pick-backup/src/app/api/og/resume/route.tsx
Action: Migrate to web app
```

---

## 📦 Dependencies

The web app uses these contexts (need to verify packages):
- `AuthContext` - Authentication state
- `AdminContext` - Admin state
- `ToastProvider` - Toast notifications

Lib dependencies to verify:
- `@/lib/supabase` - Supabase client
- `@/lib/supabase/admin` - Supabase admin client
- `@/lib/notifications/service` - Notification service

---

## 🎯 Action Items

### Immediate (Before Launch)

1. [ ] **Add API routes** - Either in web app or shared API
   - `/api/marketing/stats`
   - `/api/marketing/analyze-resume`
   - `/api/jobs/public`
   - `/api/jobs/public/[id]`
   - `/api/live-activity`
   - `/api/silos`
   - `/api/silos/[slug]`
   - `/api/get-saved-resume/[slug]`
   - `/api/save-resume`
   - `/api/anon/*` routes

2. [ ] **Migrate sitemap.ts**
3. [ ] **Test all pages** - Verify they work without API routes

### Short-term (Post-Launch)

4. [ ] **Add OG image generation** - `/api/og/resume`
5. [ ] **Add Job Posting schema** - Structured data for jobs
6. [ ] **Add Article schema** - Structured data for insights
7. [ ] **Verify canonical URLs** - Check for duplicate content

### Nice-to-Have

8. [ ] Add breadcrumb schema
9. [ ] Add FAQ schema to relevant pages
10. [ ] Add aggregate review schema (if applicable)

---

## 📊 Summary

| Category | Status |
|----------|--------|
| **Pages** | ✅ 100% Complete |
| **Components** | ✅ 100% Complete |
| **API Routes** | ❌ 0% (only auth/callback exists) |
| **SEO Basics** | ⚠️ Metadata good, sitemap missing |
| **Structured Data** | ⚠️ Minimal - needs expansion |
| **OG Images** | ❌ Not migrated |

**Overall Migration Status:** 60% Complete (UI done, APIs needed)
