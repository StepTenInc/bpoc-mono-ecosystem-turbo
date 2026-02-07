# ShoreAgents ⇄ BPOC API Update (2026-01-08)

This note is the latest integration update for ShoreAgents. It reflects the current BPOC `/api/v1` behavior and the database-backed “source of truth” model we are now enforcing.

## Summary (what changed)

### 1) Application statuses
- **Canonical DB status** is **`under_review`** (not `reviewed`).
- Our v1 application status API accepts aliases but **will store/return canonical values**.

### 2) Call sharing model (IMPORTANT)
We moved away from legacy “prescreen-only” sharing fields.

- **Per-call sharing is now the source of truth**
  - `video_call_rooms.share_with_client` (boolean)
  - `video_call_rooms.share_with_candidate` (boolean)

When a call is shared, **ALL artifacts for that call** are shareable (recording, transcript, notes).

### 3) Client feedback “tags” removed
Client feedback is now **notes + rating only**.
- `PATCH /applications/:id/card/client-feedback` now supports:
  - `notes?: string`
  - `rating?: number`
- **Do not send** `tags` / `client_tags`.

### 4) Counter-offer workflow is now available via v1 API (Enterprise)
We added the missing v1 endpoints so ShoreAgents can fully support negotiation:
- `GET /offers/:offerId/counter`
- `POST /offers/:offerId/counter/accept`
- `POST /offers/:offerId/counter/reject`

---

## Required changes for ShoreAgents

### A) Update client-feedback payload (remove tags)

**Before (deprecated):**
```json
{ "notes": "…", "rating": 5, "tags": ["excellent"] }
```

**Now (supported):**
```json
{ "notes": "…", "rating": 5 }
```

### B) Use per-call sharing flags (not prescreen-only sharing)
- When reading application card calls, assume each call can be independently shared.
- When releasing an application, supply which rooms to share using the release endpoint payload accepted by BPOC (room-level sharing).

### C) Implement counter offers (Enterprise)

#### List counter offers for an offer
`GET /api/v1/offers/:offerId/counter`

#### Accept a counter offer
`POST /api/v1/offers/:offerId/counter/accept`

```json
{ "counterOfferId": "uuid", "employerMessage": "Accepted." }
```

#### Reject a counter offer (optionally send revised counter)
`POST /api/v1/offers/:offerId/counter/reject`

```json
{
  "counterOfferId": "uuid",
  "employerMessage": "We can’t do that, here’s our best.",
  "sendNewCounter": true,
  "revisedSalary": 48000,
  "revisedCurrency": "PHP"
}
```

---

## Notes / gotchas

### Join links and tokens
For Daily joining in client portals:
- Prefer using the **tokenized join URL** we return for client/candidate joining.
- If you are using Daily callObject, join with:
  - room URL (base) + token passed separately.

### Roles in participants tracking
When we record call participants, roles are normalized to allowed values:
- `host` (recruiter / agency-host)
- `candidate`
- `client`

---

## Where to reference in BPOC docs
- `Docs/API_QUICK_REFERENCE.md`
- `Docs/BPOC_API_DOCUMENTATION_SOURCE_OF_TRUTH.txt`


