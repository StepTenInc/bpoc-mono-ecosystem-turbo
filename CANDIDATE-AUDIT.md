# BPOC Candidate App - Migration Audit

**Date:** 2025-02-08  
**Audited By:** Pinky (Subagent)  
**Old Monolith:** `~/Desktop/bpoc-cherry-pick-backup/`  
**New Monorepo:** `~/Desktop/bpoc-mono/apps/candidate/`

---

## 📋 Executive Summary

The candidate app migration is **PARTIALLY COMPLETE**. Core pages (dashboard, profile, resume, applications, jobs) exist in the new app, but **6 critical features are missing**:
- Interviews management
- Offers/counter-offers
- Onboarding flow
- HR Assistant (AI chat)
- Contracts viewing
- Placement (Day 1 confirmation)

---

## 🔌 API Routes Inventory

### Candidate-Specific APIs (`/api/candidate/`)

| Route | Method | Purpose | Priority |
|-------|--------|---------|----------|
| `/api/candidate/dashboard` | GET | Dashboard data aggregation | ✅ Used |
| `/api/candidate/applications` | GET | List candidate's applications | ✅ Used |
| `/api/candidate/applications/[id]` | GET | Application details | ✅ Used |
| `/api/candidate/applications/[id]/accept-invite` | POST | Accept recruiter invitation | 🔴 Critical |
| `/api/candidate/applications/[id]/decline-invite` | POST | Decline invitation | 🔴 Critical |
| `/api/candidate/applications/[id]/withdraw` | POST | Withdraw application | 🔴 Critical |
| `/api/candidate/matches` | GET | AI job matches | ✅ Used |
| `/api/candidate/matches/generate` | POST | Trigger match generation | ⚠️ Medium |
| `/api/candidate/matches/refresh` | POST | Refresh matches | ⚠️ Medium |
| `/api/candidate/offers` | GET | List offers | 🔴 Missing |
| `/api/candidate/offers/[id]/accept` | POST | Accept offer | 🔴 Missing |
| `/api/candidate/offers/[id]/counter` | POST | Submit counter-offer | 🔴 Missing |
| `/api/candidate/offers/counter` | POST | Counter offer flow | 🔴 Missing |
| `/api/candidate/interviews` | GET | List interviews | 🔴 Missing |
| `/api/candidate/interviews/respond` | POST | Accept/reject interview times | 🔴 Missing |
| `/api/candidate/interviews/proposals` | GET | Proposed interview times | 🔴 Missing |
| `/api/candidate/notifications` | GET | Candidate notifications | ✅ Used |
| `/api/candidate/onboarding/tasks` | GET | Onboarding checklist | 🔴 Missing |
| `/api/candidate/onboarding/tasks/[id]` | PATCH | Complete task | 🔴 Missing |
| `/api/candidate/onboarding/confirm-start` | POST | Confirm start date | 🔴 Missing |
| `/api/candidate/placement` | GET | Placement details | 🔴 Missing |
| `/api/candidate/placement/confirm-day-one` | POST | Day 1 confirmation | 🔴 Missing |

### Shared APIs (Candidates Use These)

#### User Profile & Resume (`/api/user/`)
| Route | Purpose |
|-------|---------|
| `/api/user/profile` | Get/update user profile |
| `/api/user/ai-analysis` | Get AI resume analysis |
| `/api/user/resume-status` | Check resume completion |
| `/api/user/resume-for-build` | Get data for resume builder |
| `/api/user/extracted-resume` | Get parsed resume data |
| `/api/user/saved-resumes` | List saved resume versions |
| `/api/user/job-matches-count` | Dashboard badge count |
| `/api/user/disc-stats` | DISC personality stats |
| `/api/user/work-status` | Work availability |
| `/api/user/sync` | Sync profile data |
| `/api/user/check-username` | Username availability |
| `/api/user/claim-anon-resume` | Claim anonymous resume |

#### Resume Processing (`/api/candidates/`)
| Route | Purpose |
|-------|---------|
| `/api/candidates/[id]` | Get/update candidate |
| `/api/candidates/[id]/profile` | Update profile |
| `/api/candidates/resume/process` | Upload & parse resume |
| `/api/candidates/resume/save` | Save resume edits |
| `/api/candidates/resume/save-extracted` | Save parsed data |
| `/api/candidates/resume/save-generated` | Save AI-generated resume |
| `/api/candidates/resume/save-final` | Final save |
| `/api/candidates/ai-analysis/analyze` | Run AI analysis |
| `/api/candidates/ai-analysis/save` | Save analysis results |

#### Jobs (`/api/jobs/`)
| Route | Purpose |
|-------|---------|
| `/api/jobs/public` | Browse public jobs |
| `/api/jobs/public/[id]` | Job details |
| `/api/jobs/combined` | Jobs with match data |
| `/api/jobs/combined/[id]` | Combined job detail |
| `/api/jobs/apply` | Submit application |

#### Notifications (`/api/notifications/`)
| Route | Purpose |
|-------|---------|
| `/api/notifications` | List notifications |
| `/api/notifications/[id]` | Mark as read/delete |
| `/api/notifications/[id]/read` | Mark single as read |
| `/api/notifications/read-all` | Mark all read |

#### HR Assistant (`/api/hr-assistant/`)
| Route | Purpose |
|-------|---------|
| `/api/hr-assistant/ask` | AI chat query |
| `/api/hr-assistant/search` | Search knowledge base |
| `/api/hr-assistant/history` | Chat history |
| `/api/hr-assistant/article/[articleNumber]` | Get article content |

#### Onboarding (`/api/onboarding/`)
| Route | Purpose |
|-------|---------|
| `/api/onboarding` | Get onboarding status |
| `/api/onboarding/initialize` | Start onboarding |
| `/api/onboarding/personal-info` | Personal details |
| `/api/onboarding/education` | Education history |
| `/api/onboarding/emergency-contact` | Emergency contact |
| `/api/onboarding/medical` | Medical info |
| `/api/onboarding/gov-ids` | ID documents |
| `/api/onboarding/data-privacy` | Privacy consent |
| `/api/onboarding/resume` | Resume for onboarding |
| `/api/onboarding/signature` | Digital signature |
| `/api/onboarding/documents/upload` | Document upload |
| `/api/onboarding/generate-contract` | Generate contract |
| `/api/onboarding/sign-contract` | Sign contract |

#### Contracts (`/api/contracts/`)
| Route | Purpose |
|-------|---------|
| `/api/contracts/[applicationId]` | Get contract |
| `/api/contracts/[applicationId]/pdf` | Download PDF |
| `/api/contracts/[applicationId]/sign` | Sign contract |

#### Other Shared APIs
| Route | Purpose |
|-------|---------|
| `/api/save-resume` | Save resume to storage |
| `/api/resume/export-pdf` | Export resume as PDF |
| `/api/upload/resume-photo` | Upload profile photo |
| `/api/marketing/analyze-resume` | Marketing landing analysis |

---

## 📱 UI Pages Status

### ✅ Present in New App
| Page | Path | Status |
|------|------|--------|
| Dashboard | `/(candidate)/dashboard` | ✅ Complete |
| Applications List | `/(candidate)/applications` | ✅ Complete |
| Application Detail | `/(candidate)/applications/[id]` | ✅ Complete |
| Jobs Browse | `/(candidate)/jobs` | ✅ Complete |
| Resume Hub | `/(candidate)/resume` | ✅ Complete |
| Resume Upload | `/(candidate)/resume/upload` | ✅ Complete |
| Resume Builder | `/(candidate)/resume/build` | ✅ Complete |
| Resume Analysis | `/(candidate)/resume/analysis` | ✅ Complete |
| Profile | `/(candidate)/profile` | ✅ Complete |
| Profile Preview | `/(candidate)/profile/preview` | ✅ Complete |
| Notifications | `/(candidate)/notifications` | ✅ Complete |
| Settings | `/(candidate)/settings` | ✅ Complete |

### 🔴 Missing in New App
| Page | Old Path | Priority | Notes |
|------|----------|----------|-------|
| **Interviews** | `/(candidate)/candidate/interviews` | 🔴 CRITICAL | List of scheduled interviews |
| **Interview Detail** | `/(candidate)/candidate/interviews/[id]` | 🔴 CRITICAL | Interview details + respond |
| **Interview Prep** | `/(candidate)/candidate/interviews/[id]/prep` | ⚠️ Medium | AI interview prep |
| **Offers** | `/(candidate)/candidate/offers` | 🔴 CRITICAL | View & respond to offers |
| **Onboarding** | `/(candidate)/candidate/onboarding` | 🔴 CRITICAL | Task checklist |
| **HR Assistant** | `/(candidate)/candidate/hr-assistant` | ⚠️ Medium | AI help chat |
| **Contracts** | `/(candidate)/candidate/contracts` | 🔴 CRITICAL | View contracts |
| **Contract Detail** | `/(candidate)/candidate/contracts/[id]` | 🔴 CRITICAL | Sign contracts |
| **Placement** | `/(candidate)/candidate/placement` | 🔴 CRITICAL | Day 1 confirmation |

---

## 🧩 Components Status

### ✅ Present in New App
| Component | Purpose |
|-----------|---------|
| `CandidateSidebar.tsx` | Navigation sidebar |
| `CandidateApplicationCard.tsx` | Application card |
| `InterviewTimeResponseModal.tsx` | Respond to interview times |
| UI Components (14 files) | button, card, dialog, etc. |

### 🔴 Missing Components (from old app)
| Component | Purpose | Copy Required |
|-----------|---------|---------------|
| `ApplicationPipelineTracker.tsx` | Visual pipeline tracker | ✅ Yes |
| `CounterOfferDialog.tsx` | Counter offer form | ✅ Yes |
| `CounterOfferModal.tsx` | Full counter modal | ✅ Yes |
| `JobDetailsModal.tsx` | Expandable job info | ✅ Yes |
| `MatchInsights.tsx` | AI match breakdown | ⚠️ Optional |
| `MatchScoreBadge.tsx` | Match % badge | ⚠️ Optional |
| `OnboardingTaskModal.tsx` | Task completion | ✅ Yes |

---

## 🚀 What Needs To Be Copied

### Priority 1: Critical Missing Pages
```
Source: ~/Desktop/bpoc-cherry-pick-backup/src/app/(candidate)/candidate/
Target: ~/Desktop/bpoc-mono/apps/candidate/src/app/(candidate)/

1. interviews/               → Copy entire folder
   - page.tsx (20KB)
   - [id]/page.tsx (if exists)
   - [id]/prep/page.tsx

2. offers/page.tsx           → Create offers/ folder, copy

3. onboarding/page.tsx       → Create onboarding/ folder, copy

4. contracts/                → Copy entire folder
   - [id]/page.tsx

5. placement/page.tsx        → Create placement/ folder, copy

6. hr-assistant/page.tsx     → Create hr-assistant/ folder, copy
```

### Priority 2: Missing Components
```
Source: ~/Desktop/bpoc-cherry-pick-backup/src/components/candidate/
Target: ~/Desktop/bpoc-mono/apps/candidate/src/components/candidate/

1. ApplicationPipelineTracker.tsx
2. CounterOfferDialog.tsx
3. CounterOfferModal.tsx
4. JobDetailsModal.tsx
5. OnboardingTaskModal.tsx
```

### Priority 3: API Routes (If Not Using Shared Package)
All `/api/candidate/` routes need to be:
- Either: Copied to the candidate app
- Or: Shared via `@bpoc/api` package (recommended)

---

## 💡 "No Hands" Improvement Ideas

### 1. AI Auto-Fill Profile from Resume
**Current:** User uploads resume → AI extracts → User reviews & saves manually  
**Improved:** Upload resume → AI extracts → **Auto-populates profile fields** → User just confirms

**Implementation:**
```typescript
// After resume parsing, auto-update candidate_profiles
const extracted = await parseResume(file);
await supabase.from('candidate_profiles').upsert({
  candidate_id: userId,
  position: extracted.current_role,
  location: extracted.location,
  skills: extracted.skills,
  auto_filled: true, // Flag for review
});
```

### 2. Proactive Job Match Notifications
**Current:** Candidate manually checks job matches  
**Improved:** System **pushes notifications** when new matching jobs appear

**Implementation:**
- Cron job runs match algorithm on new jobs
- If match score > 80%, create notification
- Optional: Send email digest daily/weekly

### 3. Interview Prep Automation
**Current:** Candidate clicks "Prep" → Sees generic tips  
**Improved:** AI generates **personalized prep** based on:
- The specific job description
- Company research
- Candidate's resume gaps
- Common questions for that role

**Implementation:**
```typescript
// On interview creation, pre-generate prep material
await generateInterviewPrep({
  jobId: interview.job_id,
  candidateId: interview.candidate_id,
  interviewType: interview.type, // behavioral, technical, etc.
});
```

### 4. Smart Application Status Summaries
**Current:** "5 applications" badge  
**Improved:** "2 interviews this week, 1 offer pending response"

**Implementation:**
- Dashboard shows actionable summary
- Highlights time-sensitive items (offers expiring, interviews tomorrow)

### 5. One-Click Interview Scheduling
**Current:** Recruiter proposes times → Candidate accepts one  
**Improved:** **AI checks candidate's calendar** → Auto-suggests best times

**Implementation:**
- Integrate with Google Calendar API
- On interview time proposal, filter by candidate availability
- Pre-select the best option

### 6. Automated Onboarding Document Prep
**Current:** Candidate manually fills each onboarding field  
**Improved:** Pre-fill from resume data + government ID OCR

**Implementation:**
- OCR driver's license → Auto-fill name, DOB, address
- Resume → Work history, education
- Only ask for truly new info (bank details, emergency contact)

### 7. Offer Comparison Tool
**Current:** Candidate sees offer, accepts/counters  
**Improved:** **AI compares offer to market rates** in real-time

**Implementation:**
```typescript
// When offer is viewed, run comparison
const comparison = await compareToMarket({
  role: offer.job.title,
  location: offer.job.location,
  salary: offer.salary,
  benefits: offer.benefits,
});
// Show: "This offer is 15% above market average for Brisbane"
```

### 8. Smart Counter-Offer Suggestions
**Current:** Candidate decides what to counter  
**Improved:** AI suggests what to negotiate based on:
- Market data
- Candidate's unique skills
- Previous negotiation success rates

---

## 📊 Migration Checklist

- [ ] Copy 6 missing page folders to new app
- [ ] Copy 5 missing components
- [ ] Verify API routes accessible (shared or local)
- [ ] Update import paths in copied files
- [ ] Test authentication flow
- [ ] Test each candidate journey:
  - [ ] Dashboard → Jobs → Apply → Interview → Offer → Onboarding
- [ ] Add missing pages to sidebar navigation
- [ ] Run build check for TypeScript errors

---

## 📈 Estimated Effort

| Task | Effort |
|------|--------|
| Copy & fix missing pages | 4-6 hours |
| Copy & wire components | 2-3 hours |
| API route setup | 2-4 hours |
| Testing all flows | 4-6 hours |
| **Total** | **12-19 hours** |

---

*Generated by BPOC Candidate Audit subagent*
