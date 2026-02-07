# BPOC.IO — Full Project Brief & Migration Plan

> **Last Updated:** 2026-02-08
> **Status:** Monorepo scaffolded, web app homepage live, candidate/recruiter/admin apps pending migration

---

## 1. Project History & Vision

### What BPOC Is
BPOC (BPO Careers) is an AI-powered recruitment platform built for the Philippine BPO industry. It connects Filipino professionals with global BPO opportunities through intelligent job matching, AI resume analysis, and a full-lifecycle recruitment pipeline.

### How It Was Built
BPOC was originally built as a **single monolithic Next.js application** containing everything:
- A public-facing marketing website
- A candidate dashboard with resume builder, job matching, and career tools
- A recruiter dashboard with pipeline management, talent search, and client portals
- An admin command center with analytics, content management, outbound campaigns, and system controls

All of this lived in one `src/app/` directory using Next.js route groups: `(main)`, `(candidate)`, `(recruiter)`, `(admin)`.

### What We're Doing Now
We are **splitting the monolith into 4 independent Next.js apps** inside a Turborepo monorepo. The goal is:
- **Separate deployments** — each app gets its own Vercel project and subdomain
- **Independent scaling** — candidate traffic doesn't impact admin operations
- **Clean codebases** — each team/app owns its own routes and API handlers
- **Shared database** — all apps connect to the same Supabase instance
- **Shared auth** — Supabase Auth works across all apps via cookies/JWT

> [!IMPORTANT]
> We are NOT rewriting anything. We are cherry-picking working code from the old codebase into the new structure. The only things that change are the route paths and API endpoints.

---

## 2. Architecture Overview

### Monorepo Structure

```
bpoc-mono/
├── apps/
│   ├── web/            → www.bpoc.io         (marketing, public pages)
│   ├── candidate/      → candidate.bpoc.io   (candidate dashboard)
│   ├── recruiter/      → recruiter.bpoc.io   (recruiter dashboard)
│   ├── admin/          → admin.bpoc.io       (command center)
│   └── client-portal/  → portal.bpoc.io      (client job viewing)
├── packages/
│   ├── shared/         → Supabase client, types, auth helpers, utils
│   ├── ui/             → Shared UI components (Button, Dialog, etc.)
│   └── typescript-config/ → Shared TS configs
├── turbo.json
├── pnpm-workspace.yaml
└── .env.local
```

### Domain & Deployment Strategy

| App | Domain | Vercel Project | Port (dev) |
|-----|--------|---------------|------------|
| Web (Marketing) | `www.bpoc.io` | `bpoc-web` | 3000 |
| Candidate | `candidate.bpoc.io` | `bpoc-candidate` | 3003 |
| Recruiter | `recruiter.bpoc.io` | `bpoc-recruiter` | 3002 |
| Admin | `admin.bpoc.io` | `bpoc-admin` | 3001 |
| Client Portal | `portal.bpoc.io` | `bpoc-portal` | 3004 |

### Database
- **Supabase** project: `ayrdnsiaylomcemfdisr`
- All apps share the **same Supabase database**
- Real-time subscriptions enabled across all apps
- Row Level Security (RLS) controls data access per user role
- No database migration needed — existing tables stay as-is

### Authentication
- **Supabase Auth** — same auth system across all apps
- Users have `admin_level` in metadata: `user`, `recruiter`, `admin`
- After sign-in on `www.bpoc.io`, users redirect to their subdomain
- Each app validates the session via Supabase SSR cookies

---

## 3. Source Code Locations

### Old Codebase (cherry-pick from here)

| What | Path |
|------|------|
| **Full old app** | `/Users/stepten/Desktop/Dev Projects/Bpoc Ecosystem` |
| **Candidate pages** | `Bpoc Ecosystem/src/app/(candidate)/candidate/` |
| **Recruiter pages** | `Bpoc Ecosystem/src/app/(recruiter)/recruiter/` |
| **Admin pages** | `Bpoc Ecosystem/src/app/(admin)/admin/` |
| **Public/marketing pages** | `Bpoc Ecosystem/src/app/` (root + home, about, jobs, insights, tools, etc.) |
| **API routes** | `Bpoc Ecosystem/src/app/api/` |
| **Components** | `Bpoc Ecosystem/src/components/` |
| **Lib/utilities** | `Bpoc Ecosystem/src/lib/` |
| **Contexts** | `Bpoc Ecosystem/src/contexts/` |
| **Public assets** | `Bpoc Ecosystem/public/` |
| **Environment vars** | `Bpoc Ecosystem/.env.local` |
| **Backup reference** | `/Users/stepten/Desktop/Dev Projects/Bpoc StepTen/` |

### New Monorepo (building into here)

| What | Path |
|------|------|
| **Monorepo root** | `/Users/stepten/Desktop/Dev Projects/bpoc-mono` |
| **Web app (done)** | `bpoc-mono/apps/web/` |
| **Candidate app** | `bpoc-mono/apps/candidate/` |
| **Recruiter app** | `bpoc-mono/apps/recruiter/` |
| **Admin app** | `bpoc-mono/apps/admin/` |
| **Client portal** | `bpoc-mono/apps/client-portal/` |
| **Shared packages** | `bpoc-mono/packages/shared/` |
| **Migration workflow** | `bpoc-mono/.agent/workflows/migrate-routes.md` |

---

## 4. Complete Route Inventory

### 4.1 Web App (Marketing) — `apps/web` — ✅ DONE

**Pages (25+):**
- `/` → Root redirect
- `/home` → Hero, tools showcase, testimonials, stats
- `/about` → Company story, team, mission
- `/how-it-works` → Platform walkthrough for candidates & recruiters
- `/insights` → Blog/articles listing
- `/insights/[slug]` → Individual article
- `/jobs` → Public job board
- `/tools` → Free tools overview
- `/try-resume-builder` → Resume builder landing
- `/talent-search` → Recruiter-facing talent search marketing
- `/resume/[slug]` → Public shareable resume
- `/developer` → API documentation
- `/contact-support` → Support form
- `/auth/callback` → OAuth callback
- `/auth/confirm` → Email confirmation
- `/reset-password` → Password reset
- `/profile/[username]` → Public user profile
- `/privacy-policy`, `/terms-and-conditions`, `/cookie-policy`, `/data-security` → Legal
- `/author/[slug]` → Author bio pages

**API Routes needed:**
- `/api/marketing/stats` — platform statistics for homepage
- `/api/marketing/analyze-resume` — free resume analysis tool
- `/api/live-activity` — live activity feed for social proof
- `/api/jobs/public` + `/api/jobs/public/[id]` — public job listings
- `/api/get-saved-resume/[slug]` — public resume viewing
- `/api/og/resume` — OG image generation for shared resumes

---

### 4.2 Candidate App — `apps/candidate`

**Pages (21):**

| Route | Description | Status |
|-------|-------------|--------|
| `/dashboard` | Main candidate dashboard — stats, recent activity, job matches | Working in old app |
| `/applications` | List of all job applications with status tracking | Working |
| `/applications/[id]` | Detailed application view with timeline | Working |
| `/contracts/[id]` | Contract viewing and digital signing | Working |
| `/hr-assistant` | AI-powered HR chatbot for career advice | Working |
| `/interviews` | Upcoming/past interview schedule | Working |
| `/interviews/[id]/prep` | AI interview preparation assistant | Working |
| `/jobs` | Job search and matching with filters | Working |
| `/notifications` | Real-time notification center | Working |
| `/offers` | Offer management (view, accept, counter) | Working |
| `/onboarding` | Post-hire onboarding tasks and documents | Working |
| `/placement` | Active placement tracking and day-one confirmation | Working |
| `/profile` | Full profile editor (personal, skills, experience, education) | Working |
| `/profile/preview` | Preview profile as recruiter sees it | Working |
| `/resume` | Resume management hub | Working |
| `/resume/analysis` | AI resume analysis and scoring | Working |
| `/resume/build` | Full AI-powered resume builder | Working |
| `/resume/upload` | Resume upload and parsing | Working |
| `/resume-debug/[slug]` | Debug view for resume processing (dev tool) | Working |
| `/settings` | Account settings, preferences, notifications | Working |

**API Routes (28):**

```
/api/candidate/applications          — GET: list, POST: apply
/api/candidate/applications/[id]     — GET: details, PATCH: update
/api/candidate/applications/[id]/accept-invite
/api/candidate/applications/[id]/decline-invite
/api/candidate/applications/[id]/withdraw
/api/candidate/dashboard             — GET: dashboard stats
/api/candidate/interviews            — GET: list interviews
/api/candidate/interviews/proposals  — GET: interview proposals
/api/candidate/interviews/respond    — POST: respond to proposal
/api/candidate/matches/generate      — POST: generate job matches
/api/candidate/matches/refresh       — POST: refresh matches
/api/candidate/matches               — GET: current matches
/api/candidate/notifications         — GET: notifications
/api/candidate/offers                — GET: offers list
/api/candidate/offers/[id]/accept    — POST: accept offer
/api/candidate/offers/[id]/counter   — POST: counter offer
/api/candidate/offers/counter        — POST: submit counter
/api/candidate/onboarding/confirm-start
/api/candidate/onboarding/tasks      — GET/POST: onboarding tasks
/api/candidate/onboarding/tasks/[id] — PATCH: complete task
/api/candidate/placement             — GET: placement status
/api/candidate/placement/confirm-day-one
```

**Shared API routes also needed in candidate app:**
```
/api/candidates/[id]/profile         — GET: full profile data
/api/candidates/[id]                 — PATCH: update candidate
/api/candidates/ai-analysis/analyze  — POST: AI resume analysis
/api/candidates/ai-analysis/save     — POST: save analysis results
/api/candidates/resume/process       — POST: process uploaded resume
/api/candidates/resume/save          — POST: save resume
/api/candidates/resume/save-extracted
/api/candidates/resume/save-final
/api/candidates/resume/save-generated
/api/user/profile                    — GET: user profile
/api/user/sync                       — POST: sync user data
/api/user/check-username             — GET: validate username
/api/user/resume-status              — GET: resume processing status
/api/user/resume-for-build           — GET: resume data for builder
/api/user/saved-resumes              — GET: saved resumes list
/api/user/extracted-resume           — GET: extracted resume data
/api/user/disc-stats                 — GET: DISC assessment
/api/user/typing-stats               — GET: typing test results
/api/user/work-status                — GET: work availability
/api/user/job-matches-count          — GET: match count
/api/user/ai-analysis                — GET: AI analysis data
/api/jobs/combined                   — GET: combined job listings
/api/jobs/combined/[id]              — GET: single job detail
/api/jobs/apply                      — POST: apply to job
/api/contracts/[applicationId]       — GET: contract details
/api/contracts/[applicationId]/sign  — POST: sign contract
/api/contracts/[applicationId]/pdf   — GET: contract PDF
/api/notifications/*                 — Notification CRUD
/api/onboarding/*                    — All onboarding routes
/api/hr-assistant/*                  — HR assistant chatbot
/api/save-resume                     — POST: save resume
/api/resume/export-pdf               — POST: export resume as PDF
/api/upload/resume-photo             — POST: upload resume photo
/api/parse-location                  — POST: parse location string
/api/og/resume                       — GET: OG image for resume
```

**Key Candidate Features:**
- 🎯 **AI Resume Builder** — AI-powered resume creation with templates, ATS optimization
- 📊 **AI Resume Analysis** — Score and improve resume with detailed feedback
- 🤖 **AI Job Matching** — intelligent matching based on skills, experience, preferences
- 💬 **HR Assistant** — AI chatbot for career advice and HR questions
- 📋 **Application Tracking** — full lifecycle from apply to placement
- 🎥 **Interview Prep** — AI-powered interview preparation and scheduling
- 📄 **Digital Contracts** — view and digitally sign employment contracts
- 🚀 **Onboarding** — guided post-hire onboarding with task tracking
- ⌨️ **Typing Speed Test** — BPO-relevant typing assessment with certificates
- 🔔 **Real-time Notifications** — Supabase real-time notification feed

---

### 4.3 Recruiter App — `apps/recruiter`

**Pages (30):**

| Route | Description | Status |
|-------|-------------|--------|
| `/` (root) | Recruiter dashboard — pipeline stats, recent activity | Working |
| `/agency` | Agency management and settings | Working |
| `/api` | API key management page (enterprise) | Working |
| `/applications` | All candidate applications | Working |
| `/applications/[id]` | Detailed application review with actions | Working |
| `/clients` | Client company management | Working |
| `/clients/[id]` | Client detail and job history | Working |
| `/contracts/[applicationId]` | Contract creation and management | Working |
| `/demo` | Platform demo mode | Working |
| `/forgot-password` | Password recovery | Working |
| `/hr-assistant` | AI HR assistant for recruiters | Working |
| `/interviews` | Interview scheduling and management | Working |
| `/interviews/recordings` | Video interview recording review | Working |
| `/jobs` | Job listings management | Working |
| `/jobs/[id]/edit` | Edit existing job posting | Working |
| `/jobs/create` | Create new job posting | Working |
| `/login` | Recruiter-specific login | Working |
| `/notifications` | Notification center | Working |
| `/offers` | Offer management (create, track, counter) | Working |
| `/pipeline` | Visual recruitment pipeline (kanban) | Working |
| `/placements` | Successful placement tracking | Working |
| `/profile` | Recruiter profile editor | Working |
| `/settings` | Account and notification settings | Working |
| `/signup` | Recruiter registration | Working |
| `/signup/awaiting-authorization` | Pending approval screen | Working |
| `/signup/documents` | Document upload during signup | Working |
| `/signup/pending-verification` | Email verification pending | Working |
| `/talent` | Talent search and discovery | Working |
| `/talent/[id]` | Individual candidate profile view | Working |
| `/team` | Team management and invitations | Working |

**API Routes (52):**

```
/api/recruiter/agency               — GET/POST: agency CRUD
/api/recruiter/api-key               — GET/POST: API key management
/api/recruiter/api-key/toggle        — POST: enable/disable API key
/api/recruiter/applications          — GET: list applications
/api/recruiter/applications/[id]     — GET/PATCH: application details
/api/recruiter/applications/[id]/client-feedback
/api/recruiter/applications/[id]/hired
/api/recruiter/applications/[id]/reject
/api/recruiter/applications/[id]/release
/api/recruiter/applications/[id]/send-back
/api/recruiter/applications/status   — GET: application status breakdown
/api/recruiter/clients               — GET/POST: client CRUD
/api/recruiter/clients/[id]          — GET/PATCH/DELETE: client detail
/api/recruiter/dashboard/stats       — GET: dashboard metrics
/api/recruiter/documents/upload      — POST: document upload
/api/recruiter/interviews/propose    — POST: propose interview time
/api/recruiter/interviews            — GET: interview schedule
/api/recruiter/invitations/job       — POST: invite candidate to job
/api/recruiter/jobs                  — GET/POST: job listings
/api/recruiter/jobs/[id]             — GET/PATCH/DELETE: job detail
/api/recruiter/jobs/[id]/approve     — POST: approve job posting
/api/recruiter/jobs/[id]/matches     — GET: AI-matched candidates
/api/recruiter/jobs/create           — POST: create job
/api/recruiter/jobs/generate         — POST: AI job description generation
/api/recruiter/notifications         — GET: notifications
/api/recruiter/offers                — GET/POST: offer management
/api/recruiter/offers/[id]/counter/accept
/api/recruiter/offers/[id]/counter/reject
/api/recruiter/offers/[id]/counter   — POST: counter offer
/api/recruiter/offers/[id]/withdraw  — POST: withdraw offer
/api/recruiter/onboarding/[applicationId]/complete
/api/recruiter/onboarding/from-template
/api/recruiter/onboarding/tasks      — GET/POST: onboarding tasks
/api/recruiter/onboarding/tasks/[taskId]
/api/recruiter/onboarding/templates  — GET/POST: onboarding templates
/api/recruiter/pipeline              — GET: pipeline data
/api/recruiter/placements            — GET: placements
/api/recruiter/profile               — GET/PATCH: recruiter profile
/api/recruiter/rejection-templates   — GET: rejection templates
/api/recruiter/send-contract         — POST: send contract to candidate
/api/recruiter/signup                — POST: recruiter registration
/api/recruiter/talent                — GET: talent search
/api/recruiter/talent/[id]           — GET: candidate detail
/api/recruiter/team                  — GET: team members
/api/recruiter/team/accept           — POST: accept team invite
/api/recruiter/team/invite           — POST: invite team member
/api/recruiter/verify                — POST: email verification
/api/recruiter/video/recordings/[id]/delete
/api/recruiter/webhooks/[id]         — GET/PATCH: webhook config
/api/recruiter/webhooks/[id]/test    — POST: test webhook
/api/recruiter/webhooks              — GET/POST: webhook management
```

**Key Recruiter Features:**
- 📊 **Pipeline Management** — visual kanban-style recruitment pipeline
- 🔍 **Talent Search** — search and filter candidates with AI scoring
- 📝 **Job Creation** — AI-assisted job description generation
- 🤝 **Client Management** — manage client companies and their job orders
- 📋 **Application Review** — review, shortlist, reject, release to client
- 🎥 **Video Interviews** — schedule and review video interviews (Daily.co)
- 💰 **Offer Management** — create offers, handle counter-offers, track acceptance
- 📄 **Contract Management** — generate and send digital contracts
- 🚀 **Onboarding Templates** — create reusable onboarding workflows
- 👥 **Team Management** — invite team members, manage roles
- 🔗 **Enterprise API** — API keys, webhooks for system integration
- 💬 **HR Assistant** — AI chat for recruiter-specific queries

### Recruiter Access Tiers

| Tier | Features |
|------|----------|
| **Standard** | Full platform access — pipeline, talent search, jobs, interviews, offers, contracts, onboarding. All done within BPOC platform. |
| **Enterprise** | Everything in Standard + API key access + webhook integrations + white-label capability. Agency can build their own platform on top of BPOC's backend. |

---

### 4.4 Admin App — `apps/admin`

**Pages (43):**

| Route | Description |
|-------|-------------|
| `/` (root) | Admin command center dashboard |
| `/agencies` | Agency management listing |
| `/agencies/[id]` | Agency detail — suspend, reactivate, webhooks |
| `/analytics` | Platform analytics — funnel, time-series, top performers |
| `/applications` | All applications across platform |
| `/applications/[id]` | Application detail with admin actions |
| `/audit-log` | System audit trail |
| `/billing` | Revenue tracking and billing |
| `/candidates` | All candidates with suspend/reactivate |
| `/candidates/[id]` | Candidate detail with admin actions |
| `/carpet-bomb` | Outbound email marketing tool |
| `/carpet-bomb/test` | Test outbound campaigns |
| `/clients` | Client company management |
| `/counter-offers` | Counter-offer tracking |
| `/errors` | Error log viewer with AI analysis |
| `/hr-assistant` | Admin version of AI HR assistant |
| `/insights` | Content management — articles, SEO |
| `/insights/[id]` | Edit individual article |
| `/insights/create` | Create new article (AI-assisted) |
| `/insights/prompts` | AI prompt management |
| `/insights/silos` | Content silo management for SEO |
| `/insights-new` | New insights creation flow |
| `/interviews` | All interviews across platform |
| `/jobs` | All job postings with moderation |
| `/login` | Admin login |
| `/notifications` | Admin notification center |
| `/offers` | All offers across platform |
| `/onboarding` | Onboarding management |
| `/outbound` | Outbound marketing hub |
| `/outbound/analytics` | Outbound campaign analytics |
| `/outbound/campaigns` | Campaign management |
| `/outbound/campaigns/create` | Create outbound campaign |
| `/outbound/contacts` | Contact list management |
| `/outbound/import` | Import contacts |
| `/recruiters` | Recruiter management |
| `/recruiters/[id]` | Recruiter detail with admin actions |
| `/settings` | Platform settings |
| `/settings/seo` | SEO configuration |
| `/signup` | Admin registration (restricted) |
| `/test-image-gen` | AI image generation testing |
| `/test-recorder` | Video recording testing |
| `/users` | All users management |
| `/users/[id]` | User detail with admin actions |

**API Routes (118+):**

All under `/api/admin/` covering: agencies, analytics, applications, audit-log, billing, candidates, carpet-bomb, check-status, clients, content-pipeline, counter-offers, dashboard, errors, export, generate-matches, insights, interviews, jobs, login, notifications, offers, onboarding, outbound, recruiters, settings, signup, users, video, webhooks.

**Key Admin Features:**
- 📊 **Analytics Dashboard** — funnel metrics, time-series, top performers
- 👥 **User Management** — CRUD for all users, suspend/reactivate
- 🏢 **Agency Management** — approve, suspend, configure agencies
- 📝 **Content Pipeline** — AI article generation, SEO optimization, scheduling
- 📧 **Outbound Marketing** — email campaigns, contact import, analytics
- 🔍 **Error Monitoring** — error logs with AI-powered analysis
- 📋 **Audit Trail** — full system audit log
- 💰 **Billing/Revenue** — revenue tracking, exports
- 🤖 **AI Tools** — image generation (Imagen, Gemini), video generation (Veo)
- 🔗 **Webhook Management** — configure agency webhooks

---

### 4.5 Client Portal — `apps/client-portal`

**Pages (planned):**
- `/jobs/[token]` — View job candidates via secure token link
- `/jobs/[token]/candidates/[id]` — View individual candidate
- `/jobs/[token]/interviews/[id]` — View interview details

**API Routes:**
```
/api/client/jobs/[token]                    — GET: job details for client
/api/client/jobs/[token]/candidates/[id]    — GET: candidate for client
/api/client/interviews/request              — POST: request interview
```

---

## 5. Shared Code & Packages

### `packages/shared` — Business Logic

| File | Purpose | Size |
|------|---------|------|
| `lib/supabase/client.ts` | Browser Supabase client | Core |
| `lib/supabase/server.ts` | Server-side Supabase client | Core |
| `lib/supabase/middleware.ts` | Auth middleware | Core |
| `lib/utils.ts` | Utility functions (massive — 147KB, needs splitting) | Core |
| `lib/ai.ts` | AI provider abstraction (OpenAI, Groq, Gemini) | 16KB |
| `lib/email.ts` | Email service (Resend) | 25KB |
| `lib/storage.ts` | Supabase Storage helpers | 7KB |
| `lib/matching/` | AI job matching algorithms | 5 files |
| `lib/pdf-generator.ts` | PDF generation for resumes/contracts | 14KB |
| `lib/resume-processor.ts` | Resume parsing and processing | 10KB |
| `lib/embeddings.ts` | Vector embeddings for semantic search | 7KB |
| `lib/notifications/` | Notification system | Dir |
| `lib/webhooks/` | Webhook dispatch system | 2 files |
| `lib/outbound/` | Outbound email campaign system | 4 files |
| `lib/daily.ts` | Daily.co video integration | 11KB |
| `lib/error-logger.ts` | Error logging system | 7KB |
| `lib/admin-audit.ts` | Admin audit trail | 6KB |
| `lib/rate-limiter.ts` | API rate limiting | 2KB |
| `lib/user-sync.ts` | User data synchronization | 4KB |
| `lib/database.types.ts` | Supabase generated types | 5KB |
| `contexts/AuthContext.tsx` | Auth context provider | Core |
| `contexts/AdminContext.tsx` | Admin context provider | Core |

### `packages/ui` — Shared Components

| Directory | Contents |
|-----------|----------|
| `components/shared/` | Header, Footer, Sidebar, Toast, LoadingSpinner, etc. |
| `components/ui/` | Button, Dialog, Input, Select, Tabs, Card, Badge, etc. (Radix-based) |
| `components/auth/` | Login forms, signup flows, OAuth buttons |
| `components/chat/` | AI chat interface |
| `components/resume/` | Resume builder components |
| `components/profile/` | Profile editor components |

### App-specific Components (NOT shared)

| Directory | Target App |
|-----------|------------|
| `components/admin/` | `apps/admin` only |
| `components/recruiter/` | `apps/recruiter` only |
| `components/candidate/` | `apps/candidate` only |
| `components/client/` | `apps/client-portal` only |
| `components/onboarding/` | shared between candidate + recruiter |
| `components/insights/` | `apps/admin` + `apps/web` |
| `components/video/` | shared between recruiter + candidate |

---

## 6. Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Monorepo** | Turborepo 2.8 |
| **Package Manager** | pnpm (workspaces) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email, Google OAuth) |
| **Real-time** | Supabase Realtime |
| **Storage** | Supabase Storage |
| **Styling** | Tailwind CSS 3 + custom design system |
| **UI Primitives** | Radix UI (17 components) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **AI** | OpenAI, Groq, Google Gemini |
| **Video** | Daily.co |
| **Email** | Resend |
| **Charts** | Recharts |
| **PDF** | Custom PDF generator |
| **Deployment** | Vercel (per-app) |
| **DNS** | Cloudflare |

---

## 7. Database (Supabase)

**Project ID:** `ayrdnsiaylomcemfdisr`

### Key Tables

| Table | Used By | Purpose |
|-------|---------|---------|
| `candidates` | candidate, recruiter, admin | Candidate profiles and data |
| `jobs` | all apps | Job postings |
| `applications` | candidate, recruiter, admin | Job applications |
| `interviews` | candidate, recruiter | Interview scheduling |
| `offers` | candidate, recruiter, admin | Job offers |
| `contracts` | candidate, recruiter | Employment contracts |
| `onboarding_tasks` | candidate, recruiter | Post-hire onboarding |
| `placements` | candidate, recruiter, admin | Active placements |
| `notifications` | all apps | Real-time notifications |
| `agencies` | recruiter, admin | Recruitment agencies |
| `agency_recruiters` | recruiter, admin | Recruiter-agency mapping |
| `clients` | recruiter, admin | Client companies |
| `resumes` | candidate | Resume data |
| `resume_analyses` | candidate | AI analysis results |
| `job_matches` | candidate | AI-generated matches |
| `articles` | admin, web | Blog/insights content |
| `article_silos` | admin, web | SEO content silos |
| `outbound_campaigns` | admin | Email campaigns |
| `outbound_contacts` | admin | Campaign contacts |
| `error_logs` | admin | System error tracking |
| `audit_log` | admin | Admin audit trail |
| `credentials` | admin | API credentials storage |
| `webhook_configs` | recruiter, admin | Webhook configurations |
| `api_keys` | recruiter | Enterprise API keys |

---

## 8. Migration Plan — Step by Step

### Phase 1: Foundation ✅ COMPLETE
- [x] Scaffold Turborepo monorepo
- [x] Create 5 app directories
- [x] Set up `packages/shared` structure
- [x] Install shared dependencies
- [x] Configure Tailwind design system
- [x] Copy `.env.local`

### Phase 2: Web App (Marketing) ✅ MOSTLY COMPLETE
- [x] Copy all public pages
- [x] Copy shared components, lib, contexts
- [x] Wire up AuthProvider, AdminProvider, ToastProvider
- [x] Homepage renders at `localhost:3000/home`
- [ ] Create marketing-specific API routes (stats, live-activity)
- [ ] Test all public pages render

### Phase 3: Candidate App 🔜 NEXT
1. **Scaffold** — Create `apps/candidate` Next.js project
   - `package.json` with candidate-specific deps
   - `tailwind.config.ts`, `postcss.config.mjs`, `next.config.js`
   - `tsconfig.json` with `@/` path alias
   - `.env.local`
2. **Copy pages** — All 21 pages from `(candidate)/candidate/`
   - Pages go into `apps/candidate/src/app/` (remove the `candidate/` prefix since this is now the root)
   - e.g., old `candidate/dashboard/page.tsx` → new `dashboard/page.tsx`
3. **Copy API routes** — 28 candidate-specific + shared routes
   - From `api/candidate/*` → `apps/candidate/src/app/api/candidate/*`
   - From `api/candidates/*` → `apps/candidate/src/app/api/candidates/*`
   - From `api/user/*` → `apps/candidate/src/app/api/user/*`
   - Shared routes: `jobs`, `contracts`, `notifications`, `onboarding`, `hr-assistant`, `resume`, `upload`
4. **Copy components** — candidate-specific + shared components
5. **Copy lib** — shared utilities, Supabase clients
6. **Copy contexts** — AuthContext, AdminContext
7. **Fix imports** — update any route-group-specific imports
8. **Test boot** — `pnpm dev --filter candidate` on port 3003

### Phase 4: Recruiter App
Same process as Phase 3:
1. Scaffold Next.js project
2. Copy 30 pages (remove `recruiter/` prefix)
3. Copy 52 API routes
4. Copy recruiter-specific components
5. Copy shared lib and contexts
6. Fix imports
7. Test boot on port 3002

### Phase 5: Admin App
Same process:
1. Scaffold Next.js project
2. Copy 43 pages (remove `admin/` prefix)
3. Copy 118+ API routes
4. Copy admin-specific components
5. Copy shared lib and contexts
6. Fix imports
7. Test boot on port 3001

### Phase 6: Client Portal
1. Scaffold minimal Next.js project
2. Copy 3-4 pages
3. Copy client API routes
4. Minimal UI

### Phase 7: Shared Package Extraction
1. Move shared Supabase clients into `packages/shared`
2. Move shared types into `packages/shared`
3. Move shared UI components into `packages/ui`
4. Update imports across all apps to use `@repo/shared` and `@repo/ui`

### Phase 8: Auth Flow & Redirects
1. Configure `www.bpoc.io` sign-in to redirect to correct subdomain
2. Set up Supabase Auth redirect URLs for all domains
3. Test cross-domain session sharing
4. Implement middleware for role-based access in each app

### Phase 9: Deployment
1. Create Vercel project per app
2. Configure custom domains and subdomains
3. Set environment variables per project
4. Set up Turborepo remote caching
5. Configure CI/CD for monorepo builds

---

## 9. What Changes vs What Stays the Same

### STAYS THE SAME ✅
- All existing features and functionality
- Supabase database and schema
- Supabase Auth (email + Google OAuth)
- Supabase Real-time subscriptions
- UI design system (dark theme, glassmorphism, gradients)
- AI integrations (OpenAI, Groq, Gemini)
- Video interview system (Daily.co)
- Email system (Resend)
- All business logic in lib/

### CHANGES ⚠️
- **Route structure** — routes lose their group prefix (`(candidate)/candidate/dashboard` → just `dashboard`)
- **API endpoints** — each app has its own `/api/` directory
- **Layout providers** — each app has its own `layout.tsx` with only the providers it needs
- **Authentication redirects** — sign-in redirects to subdomain instead of internal route
- **Deployment** — 4-5 separate Vercel projects instead of 1
- **Environment** — each app has its own `.env.local` (same values, per-app)
- **Middleware** — each app has its own middleware for role-based access

---

## 10. Testing Checklist

### Per-App Testing

For each app (candidate, recruiter, admin):

- [ ] App boots without errors (`pnpm dev --filter <app>`)
- [ ] All pages compile and render
- [ ] Auth flow works (login/signup/logout)
- [ ] Supabase connection works (data loads from DB)
- [ ] Real-time subscriptions work (notifications update live)
- [ ] All API routes return correct responses
- [ ] File uploads work (resumes, documents, photos)
- [ ] AI features work (resume analysis, job matching, chatbot)
- [ ] No broken imports or missing modules
- [ ] Tailwind styles render correctly
- [ ] Responsive design works on mobile

### Cross-App Testing

- [ ] Candidate applies for job → appears in recruiter pipeline
- [ ] Recruiter sends offer → appears in candidate notifications
- [ ] Admin creates job → visible to candidates and recruiters
- [ ] Admin suspends user → user cannot log in
- [ ] Real-time updates propagate across apps
- [ ] Auth redirect from www → correct subdomain based on role
- [ ] Public resume URLs work from web app

### Deployment Testing

- [ ] Each app deploys to Vercel independently
- [ ] Custom domains resolve correctly
- [ ] HTTPS works on all subdomains
- [ ] Environment variables are set per project
- [ ] Supabase Auth redirect URLs include all domains
- [ ] CORS configured for cross-subdomain API calls (if needed)

---

## 11. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Turborepo** | Fastest monorepo tool for Next.js, great Vercel integration |
| **Separate Next.js apps** (not route groups) | Independent deployment, scaling, and codebase ownership |
| **Same Supabase DB** | No data migration, real-time works across apps, single source of truth |
| **API routes per app** (not shared API server) | Next.js convention, simpler deployment, no CORS issues |
| **Shared packages via workspace** | Code reuse without publishing to npm |
| **Port-per-app in dev** | Can run all apps simultaneously for cross-app testing |

---

## 12. Environment Variables

All apps use the same `.env.local` with these key variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ayrdnsiaylomcemfdisr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
OPENAI_API_KEY=<key>
GROQ_API_KEY=<key>
GOOGLE_AI_API_KEY=<key>
RESEND_API_KEY=<key>
DAILY_API_KEY=<key>
NEXT_PUBLIC_SITE_URL=<per-app-url>
```

> [!WARNING]
> `NEXT_PUBLIC_SITE_URL` must be different per app in production:
> - Web: `https://www.bpoc.io`
> - Candidate: `https://candidate.bpoc.io`
> - Recruiter: `https://recruiter.bpoc.io`
> - Admin: `https://admin.bpoc.io`

---

*This document is the single source of truth for the BPOC monorepo migration. Reference it when building any app or feature.*
