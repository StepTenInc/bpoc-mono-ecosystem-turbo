# 🧪 BPOC Master Testing Strategy: The "God Mode" Protocol
**Version 1.0 (January 2026)**

This document is the **Single Source of Truth** for the BPOC Testing Infrastructure (Antigravity). It details the Testing Pyramid, the complete Recruitment Flow modules, the Test Harness architecture, and all required documentation references.

---

## 1. The Infrastructure (Where Everything Lives)

We have built a **Playwright-based Test Harness** ("Antigravity") that automates 80% of the setup work.

### 📂 File Structure
| Component | Path | Description |
|-----------|------|-------------|
| **The Brain (Config)** | `playwright.config.ts` | Handles video recording, screenshots, base URLs, and timeouts. |
| **The Credentials** | `.env.test.local` | Stores REAL test accounts (Admin, Recruiter, Candidate). **DO NOT COMMIT.** |
| **The Harness** | `tests/fixtures/harness.ts` | **The Secret Weapon.** Contains `loginAsAdmin`, `loginAsRecruiter`, etc. |
| **The Tests** | `tests/e2e/antigravity_god_mode.spec.ts` | The actual test scripts using the harness. |
| **Documentation** | `tests/README.md` | Quick start guide for running tests. |
| **Credential Template** | `TESTING_CREDENTIALS_TEMPLATE.md` | Template for team members to set up their `.env`. |

---

## 2. The Testing Pyramid Strategy

We follow a strict pyramid to ensure speed and reliability.

```
      / \
     /   \      E2E (Antigravity God Mode) - 10%
    /_____\     (Full Flows: Job → Hire)
   /       \
  /_________\   Integration - 20%
 /           \  (API Contracts, Database State)
/_____________\ Unit - 70% (Functions, Components)
```

### 🔹 Layer 1: E2E (Antigravity)
**Goal:** Verify complete user journeys across multiple roles.
**Tool:** Playwright + Harness
**Current Status:** ✅ Setup Complete.
**Key Scenarios:**
1.  Admin Login & Dashboard Check
2.  Recruiter Application Management
3.  Candidate Profile Editing
4.  **MISSING:** Full "Job to Hire" flow (See Section 3).

### 🔹 Layer 2: Integration
**Goal:** Verify API endpoints and Database triggers work.
**Tool:** Playwright API Testing (to be added).

### 🔹 Layer 3: Unit
**Goal:** Verify individual utility functions (e.g., `formatCurrency`, `calculateScore`).
**Tool:** Jest/Vitest (Setup required if not present).

---

## 3. The Complete Recruitment Flow (Module Breakdown)

This is the **Master Map** of every feature Antigravity must test.

### 🟢 STAGE 1: Job Creation (Client/Agency)
*   **Actors:** Agency Admin / Client
*   **Modules:**
    *   `POST /api/jobs` (Job Creation)
    *   Job Posting Form (UI)
    *   Approval Workflow (if Admin approval needed)
*   **Test Check:** Does Job appear on public board?

### 🟡 STAGE 2: Candidate Application
*   **Actors:** Candidate
*   **Modules:**
    *   Job Board (View Job)
    *   Application Wizard (Resume Upload, Questions)
    *   `POST /api/applications`
    *   **Candidate Profile:** Resume parsing & auto-fill.
*   **Test Check:** Is status `submitted`?

### 🟠 STAGE 3: Recruiter Pre-Screening
*   **Actors:** Recruiter
*   **Modules:**
    *   Application Dashboard (Kanban/List)
    *   Review Mode (Resume View, AI Score)
    *   **Action:** Move to `under_review`.
    *   **Action:** Shortlist / Reject.
*   **Test Check:** Does status update?

### 🔴 STAGE 4: Screening Interview (Recruiter)
*   **Actors:** Recruiter & Candidate
*   **Modules:**
    *   **Scheduling:** `POST /api/interviews` (Create room)
    *   **Video Room:** Daily.co Integration.
    *   **Recording:** Start/Stop Recording.
    *   **Transcription:** Auto-transcribe audio.
    *   **Notes:** Recruiter saves notes during call.
*   **Test Check:** Is recording URL saved? Is transcript generated?

### 🟣 STAGE 5: Release to Client (The Gate)
*   **Actors:** Recruiter
*   **Modules:**
    *   "Release to Client" Modal.
    *   **Permission Check:** Check if video call exists (Fix #2).
    *   **Data Selection:** Choose which notes/videos to share.
*   **Test Check:** Can Client see the candidate now?

### 🔵 STAGE 6: Client Interview & Offer
*   **Actors:** Client & Candidate
*   **Modules:**
    *   Client Dashboard (View Released Candidates).
    *   **Final Interview:** Schedule & Conduct.
    *   **Offer:** Create Offer (Salary, Start Date).
    *   **Negotiation:** Candidate Counter-Offer.
*   **Test Check:** Is Offer status `accepted`?

### ⚫ STAGE 7: Hired & Onboarding
*   **Actors:** Admin / Recruiter
*   **Modules:**
    *   Mark as Hired.
    *   Onboarding Checklist Trigger.
*   **Test Check:** Is Candidate status `hired`?

---

## 4. Documentation References (Antigravity Context)

Antigravity uses these documents to understand the "Rules of the Road".

| Document | Location | Purpose |
|----------|----------|---------|
| **Admin Flow Audit** | `ADMIN_RECRUITMENT_FLOW_AUDIT.md` | Defines what Admin CAN and CANNOT do. |
| **API Bible** | `Docs/API/BPOC_API_BIBLE.md` | Official API endpoints reference. |
| **Candidate UI Fixes** | `Docs/status-reports/lovell-candidate-ui-fixes-2.md` | Specific fixes for Candidate Profile & Video. |
| **Recruiter UI Fixes** | `Docs/status-reports/lovell-recruiter-ui-fixes-2.md` | Specific fixes for Release to Client & Timeline. |
| **Flow Definitions** | `Docs/Flows/001_BPOC_PLATFORM_FLOW_DEFINITIONS.md` | High-level flow logic. |
| **Testing Credentials** | `Docs/platform-testing/TESTING_CREDENTIALS.md` | **SOURCE OF TRUTH** for Test Accounts. |

---

## 5. Test Harness Audit (What's Missing?)

### ✅ What We Have
1.  **Hardcoded Logins:** Admin, Recruiter, Candidate fixtures are built and working.
2.  **Environment Config:** `.env.test.local` is set up with real credentials.
3.  **Base Fixtures:** `loginAsAdmin`, `loginAsRecruiter`, `loginAsCandidate`.

### ❌ What Is Missing (CRITICAL)
1.  **Client/Agency Admin Harness:**
    *   We have `loginAsRecruiter`, but we **DO NOT** have `loginAsClient` (ShoreAgents Dashboard).
    *   **ACTION REQUIRED:** We need to add `loginAsClient` to `tests/fixtures/harness.ts` to test the "Client View" of the released candidate.
2.  **Video/Mic Permissions:**
    *   Playwright blocks webcam/mic by default. We need to configure `playwright.config.ts` to "fake" media streams for video call testing.
3.  **Specific Flow Tests:**
    *   We have the *Harness*, but we haven't written the `test('Full Recruitment Flow')` script yet.

---

## 6. Action Plan (Today)

1.  **Update Harness:** Add `loginAsClient` (ShoreAgents).
2.  **Configure Video:** Enable fake device streams in Playwright config.
3.  **Write "The Big Test":** Create `tests/e2e/recruitment_flow.spec.ts` that runs Stages 1-7 sequentially.
4.  **Run & Fix:** Execute on `antigravity-testing` branch.

---

**Generated by Antigravity Protocol**
*Date: January 13, 2026*

