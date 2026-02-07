# Flow Gap Audit (Docs vs Current Implementation)

Last updated: 2026-01-08

This audit compares our implemented system against the proposed end-to-end flows in:
- `Docs/001_BPOC_PLATFORM_FLOW_DEFINITIONS.md`
- `Docs/002_CANDIDATE_FUNCTIONAL_FLOW_REQUIREMENTS.md`
- `Docs/003_RECRUITER_FUNCTIONAL_FLOW_REQUIREMENTS.md`

## Scope / Principle
- **`job_applications` is the hub**; calls/interviews/recordings/transcripts/offers/onboarding hang off it.
- **Recruiter Gate** applies only to Normal Application Flow.
- **Sharing is per call** via `video_call_rooms.share_with_client` and `video_call_rooms.share_with_candidate`.

---

## What’s already strong (end-to-end or close)
- **Recruiter application hub page**: unified view of application, calls, recordings, transcripts, release/share toggles.
- **Client-hosted interviews**: agency-host fallback allows any recruiter in the agency to host/manage when `host_user_id == agency_id`.
- **Recording + transcription for recruiter + client calls**: backend APIs were extended to include agency-hosted rooms.
- **Invited status flow (recruiter → candidate)**: invite create + accept/decline + notifications (direct + broadcast support).
- **Offers + counter offers**: candidate + recruiter flows exist (APIs + UI surfaces are present in repo).
- **Onboarding tasks + placements**: recruiter APIs and UI exist; candidate onboarding endpoints exist.
- **Notifications (candidate/recruiter/admin)**: unified bell + pages + broadcast reads are in place.

---

## High-risk gaps (things that will break trust in production)

### 1) Real-time call handling + reminders (Docs call this out heavily)
**Docs expectation**: incoming call modal, 60s ring timeout, missed call notifications, interview reminders (24h/1h/15m), day1 reminders.

**Current state** (likely):
- Joining works (tokenized join urls), but **the real-time delivery + timed reminders** look incomplete or not centralized.
- No clear scheduler/worker shown for reminders (cron/queue).

**Risk**: candidates miss calls, “I never got notified”, inconsistent UX between pre-screen vs client interview.

**Needed**:
- Decide on mechanism: Vercel Cron + DB scheduled jobs; or Supabase scheduled functions; or external queue.
- Implement consistent notification creation for reminders and missed-call outcomes.

### 2) Participant tracking (multi-join + external joiners)
**Docs expectation**: track attendance, roles (recruiter/client/candidate), and support external participants.

**Current state**:
- `video_call_participants` has `UNIQUE(room_id, user_id)`; this supports 3 auth’d participants (candidate + recruiter + client).
- **External joiners (no `user_id`)** need a second uniqueness key (suggested: `(room_id, email)` where `user_id IS NULL`).

**Risk**: external participants overwrite each other or are not recorded; “who attended?” cannot be trusted.

**Needed**:
- Add unique partial index for externals.
- Upsert logic for external participants by `(room_id, email)` and update `joined_at/left_at/duration_seconds`.
- Decide if we also track Daily “peerId” for non-auth joiners.

### 3) Client feedback should be per call (product intent)
**Docs + your direction**: feedback belongs to the interview/call, not the overall application.

**Current state**:
- We moved application-level feedback to `application_client_feedback` and removed tags.
- **Still not per-call** yet.

**Risk**: client gives Round-2 feedback but it overwrites “application feedback” and loses context.

**Needed**:
- Create a per-call feedback table (e.g. `video_call_feedback`) keyed by `room_id`.
- Migrate/retain legacy `application_client_feedback` only as an optional “overall summary” (or deprecate fully).

---

## Medium gaps (important, but not fire drills)

### 4) Status vocabulary mismatch across UI + APIs + Docs
**Docs formerly used** `reviewed`; DB uses `under_review`.
We’ve started normalizing, but we should ensure:
- every UI dropdown uses the **DB enum values**
- v1 API continues accepting aliases but *returns canonical values*

### 5) “Two paths to hire” needs explicit UI signposting
Docs are clear: Normal Flow vs Direct Talent Pool.
We should ensure:
- client/recruiter UI clearly indicates when an interview is “direct” vs “from released application”
- analytics and timeline events differ appropriately

### 6) Analytics: what’s real vs placeholder
Recruiter dashboard contains some real stats, some placeholders.
Needed:
- mark “coming soon” explicitly for placeholder metrics
- align dashboard widgets with agreed KPIs in docs

---

## Lower gaps / polish

### 7) Admin role boundary (product decision)
`001` suggests admin can “do” many actions; you’ve been pushing **oversight-only**.
We should codify:
- admin: view everything, add internal notes, broadcast, manage entities
- admin: no recruit/hire actions (except emergency override with audit trail)

### 8) Consistency of call UI
Docs imply clean Daily experience; our iframe wrapper still exists.
Decide:
- short-term: Daily native UI everywhere for reliability
- later: custom wrapper UI after features are stable

---

## “Haven’t thought about” questions (we should decide explicitly)

### Identity / joining rules
- **Client identity**: do we require client auth always, or allow “tokenized guest link” join with email?
- **External joiners**: do we allow any guest with link, or require allowlist (domain/email)?
- **Name truth**: what’s the canonical source for display name for each role (user_profiles vs companies vs candidates)?

### Recording + transcript governance
- Who can delete recordings? recruiter only? admin only?
- Retention policy (30/90/180 days) and GDPR-ish deletion requests.
- When a call is shared with candidate/client, should we also share summaries/key points automatically?

### Sharing rules
- If a call’s `share_with_client` is toggled off after being on, do we:
  - hide artifacts immediately (UI + API), and
  - revoke join urls/tokens, and
  - prevent existing downloaded links?

### Timeline / audit
- Should every “share toggle” create an audit event in `application_activity_timeline`?
- Do we need a separate timeline for call-specific events (started/ended/recording-ready/transcribed)?

### Multi-interview edge cases
- Reschedules: do we reuse the same room or create a new room per schedule change?
- No-show definitions: who marks it, and when does system auto-mark it?

---

## Suggested Priority Order (next sprint)
1. **External participant uniqueness + upsert** (trust + attendance tracking)
2. **Reminder system + missed-call outcomes** (trust + candidate experience)
3. **Per-call client feedback model** (product correctness)
4. **Status normalization + alias handling audit** (consistency)
5. **Admin role boundaries + emergency override audit logging** (governance)


