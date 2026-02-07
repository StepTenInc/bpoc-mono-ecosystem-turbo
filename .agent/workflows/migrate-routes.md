---
description: Migrate BPOC Ecosystem routes into monorepo apps
---

# BPOC Monorepo Migration Workflow

## Context

The existing monolith lives at `/Users/stepten/Desktop/Dev Projects/Bpoc Ecosystem`.
The new Turborepo monorepo is at `/Users/stepten/Desktop/Dev Projects/bpoc-mono`.

The old codebase uses Next.js route groups: `(admin)`, `(recruiter)`, `(candidate)`, `(main)`.
Each route group maps to a separate Next.js app in the monorepo.

## Important Rules

1. Each app is an **independent Next.js project** — it has its own `src/app/api/` routes
2. All apps share `packages/shared` for business logic (Supabase client, types, utils)
3. All apps share `packages/ui` for shared UI components
4. Page imports use `@/` which maps to `./src/`
5. Copy `.env.local` into each app's root directory
6. Each app needs its own `tailwind.config.ts`, `postcss.config.mjs`, `next.config.js`

## Source → Target Mapping

### OLD: `src/app/(candidate)/candidate/*` → NEW: `apps/candidate/src/app/`

// turbo
Copy all directories from `Bpoc Ecosystem/src/app/(candidate)/candidate/` into `bpoc-mono/apps/candidate/src/app/`:

**Pages (21):**
- `dashboard/` → `/` (root dashboard)
- `applications/` + `applications/[id]/`
- `contracts/[id]/`
- `hr-assistant/`
- `interviews/` + `interviews/[id]/prep/`
- `jobs/`
- `notifications/`
- `offers/`
- `onboarding/`
- `placement/`
- `profile/` + `profile/preview/`
- `resume/` + `resume/analysis/` + `resume/build/` + `resume/upload/`
- `settings/`

**API Routes — copy from `src/app/api/candidate/` into `apps/candidate/src/app/api/`:**
- `applications/` (CRUD + accept-invite, decline-invite, withdraw)
- `dashboard/`
- `interviews/` (proposals, respond)
- `matches/` (generate, refresh)
- `notifications/`
- `offers/` (accept, counter)
- `onboarding/` (confirm-start, tasks)
- `placement/` (confirm-day-one)

**Also copy these shared API routes into `apps/candidate/src/app/api/`:**
- `candidates/` (profile, resume processing, AI analysis)
- `jobs/public/` + `jobs/combined/` (job browsing)
- `onboarding/*` (all onboarding routes)
- `contracts/*` (contract viewing/signing)
- `notifications/*`
- `user/profile`, `user/sync`
- `parse-location/`
- `og/resume/`
- `hr-assistant/*` (if candidate has HR assistant)

---

### OLD: `src/app/(recruiter)/recruiter/*` → NEW: `apps/recruiter/src/app/`

// turbo
Copy all directories from `Bpoc Ecosystem/src/app/(recruiter)/recruiter/` into `bpoc-mono/apps/recruiter/src/app/`:

**Pages (30):**
- `page.tsx` → root dashboard
- `agency/`
- `api/` (API key management page)
- `applications/` + `applications/[id]/`
- `clients/` + `clients/[id]/`
- `contracts/[applicationId]/`
- `demo/`
- `forgot-password/`
- `hr-assistant/`
- `interviews/` + `interviews/recordings/`
- `jobs/` + `jobs/[id]/edit/` + `jobs/create/`
- `login/`, `signup/` (+ awaiting-authorization, documents, pending-verification)
- `notifications/`
- `offers/`
- `pipeline/`
- `placements/`
- `profile/`
- `settings/`
- `talent/` + `talent/[id]/`
- `team/`

**API Routes — copy from `src/app/api/recruiter/` into `apps/recruiter/src/app/api/`:**
- `agency/`
- `api-key/` + `api-key/toggle/`
- `dashboard/stats/`
- `documents/upload/`
- `interviews/` (propose)
- `invitations/job/`
- `jobs/` (CRUD + approve, matches, applications, stats, suggestions)
- `login/`, `signup/`, `verify-email/`
- `notifications/`
- `offers/` (create, counter)
- `pipeline/`
- `placements/`
- `profile/`
- `settings/`
- `talent/` (search, AI analysis)
- `team/`

**Also copy these shared API routes:**
- `applications/` (release-to-client)
- `candidates/[id]/` (profile, route)
- `contracts/*`
- `notifications/*`
- `user/profile`, `user/sync`
- `jobs/combined/`
- `hr-assistant/*`

---

### OLD: `src/app/(admin)/admin/*` → NEW: `apps/admin/src/app/`

// turbo
Copy all directories from `Bpoc Ecosystem/src/app/(admin)/admin/` into `bpoc-mono/apps/admin/src/app/`:

**Pages (43):**
- `page.tsx` → root dashboard
- `agencies/` + `agencies/[id]/`
- `analytics/`
- `applications/` + `applications/[id]/`
- `audit-log/`
- `billing/`
- `candidates/` + `candidates/[id]/`
- `carpet-bomb/test/`
- `clients/`
- `counter-offers/`
- `errors/`
- `hr-assistant/`
- `insights/` + `insights/[id]/` + `insights/create/` + `insights/prompts/` + `insights/silos/`
- `insights-new/`
- `interviews/`
- `jobs/`
- `login/`, `signup/`
- `notifications/`
- `offers/`
- `onboarding/`
- `outbound/` (analytics, campaigns/create, contacts, import)
- `recruiters/` + `recruiters/[id]/`
- `settings/` + `settings/seo/`
- `test-image-gen/`, `test-recorder/`
- `users/` + `users/[id]/`

**Also copy `developer/api-simulator/` page.**

**API Routes — copy ALL `src/app/api/admin/` routes into `apps/admin/src/app/api/`** (50+ routes covering agencies, analytics, applications, audit-log, billing, candidates, carpet-bomb, clients, content-pipeline, counter-offers, dashboard, errors, export, generate-matches, insights, interviews, jobs, notifications, offers, onboarding, outbound, recruiters, settings, users)

---

### OLD: public pages → NEW: `apps/web/src/app/` (ALREADY DONE)

The web app is already set up with 25+ pages. Just needs API routes:
- `marketing/stats/`, `marketing/analyze-resume/`
- `live-activity/`
- `jobs/public/`, `jobs/combined/`
- `get-saved-resume/[slug]/`
- `og/resume/`

---

## Shared Dependencies for Each App

Each new app needs these in its `package.json`:

```bash
pnpm add --filter <app> @supabase/supabase-js @supabase/ssr framer-motion lucide-react class-variance-authority clsx tailwind-merge date-fns
pnpm add --filter <app> @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-visually-hidden
```

## Shared Files to Copy Into Each App

Each app needs these from the old `src/`:
- `components/shared/` → `src/components/shared/`
- `lib/supabase/` → `src/lib/supabase/`
- `lib/utils.ts` → `src/lib/utils.ts`
- `contexts/AuthContext.tsx` → `src/contexts/AuthContext.tsx`
- `contexts/AdminContext.tsx` → `src/contexts/AdminContext.tsx`

## Config Files for Each App

Each app needs:
1. `tailwind.config.ts` — copy from `apps/web/tailwind.config.ts`
2. `postcss.config.mjs` — copy from `apps/web/postcss.config.mjs`
3. `next.config.js` — copy from `apps/web/next.config.js`
4. `tsconfig.json` — needs `@/` path alias to `./src/`
5. `.env.local` — copy from `bpoc-mono/.env.local`

## Dev Server Ports

| App | Port |
|-----|------|
| web | 3000 |
| admin | 3001 |
| recruiter | 3002 |
| candidate | 3003 |
| client-portal | 3004 |

Update each app's `package.json` dev script: `"dev": "next dev --port <PORT>"`

## Execution Order

1. Set up candidate app (copy pages + API routes + deps)
2. Set up recruiter app (copy pages + API routes + deps)
3. Set up admin app (copy pages + API routes + deps)
4. Fix import paths (change `@/components/admin/` etc. to match new structure)
5. Verify each app boots with `pnpm dev --filter <app>`
