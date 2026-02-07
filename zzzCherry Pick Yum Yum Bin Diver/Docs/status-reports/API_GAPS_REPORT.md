# API Gaps Report (Docs + Product + Implementation)

Last updated: 2026-01-08

This report flags gaps and inconsistencies found while consolidating the API docs into `BPOC_API_BIBLE.md`.

---

## A) Missing / Unclear Documentation (requested checklist)

### Rate limits
- **Status**: ❌ Not implemented/documented for `/api/v1/**` (no rate limit headers observed in code).
- **Recommendation**: define tier-based limits + standard headers (e.g. `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`).

### Sandbox/test environment
- **Status**: ❌ Not defined.
- **Recommendation**: publish a sandbox base URL + separate keys + fixture data strategy.

### API versioning policy
- **Status**: ⚠️ `/api/v1` exists, but no published deprecation policy/changelog.
- **Recommendation**: publish deprecation window + changelog file.

### Webhook signature verification (outbound)
- **Status**: ❌ No webhook registration/delivery in v1.
- **Note**: Internal Daily webhook verification exists at `/api/video/webhook` (not v1).

### Pagination
- **Status**: ✅ Offset/limit exists across most list endpoints.
- **Gap**: No unified statement of max limits and sorting semantics across endpoints.

### Idempotency keys
- **Status**: ❌ Not implemented.
- **Recommendation**: support `Idempotency-Key` for POST endpoints (jobs/create, offers, interviews, releases).

### Data retention policies
- **Status**: ❌ Not defined.

### GDPR/compliance info
- **Status**: ❌ Not defined (export/delete request flows not documented).

### SLA/uptime guarantees
- **Status**: ❌ Not defined.

### OpenAPI/Swagger spec
- **Status**: ❌ Not present.

### SDK availability
- **Status**: ❌ No official SDK.

### Changelog/version history
- **Status**: ❌ No maintained changelog file for v1 changes.

---

## B) Documentation inconsistencies found (fixed where possible)

### 1) Status naming
- Older docs referenced `reviewed`. DB canonical value is `under_review`.
- v1 API supports aliases, but docs must use canonical values.

### 2) Client feedback tags
- Older docs referenced `tags/client_tags`.
- System now supports **notes + rating only**.

### 3) Recruiter gate sharing model
- Older docs referenced `share_prescreen_video/share_prescreen_notes`.
- System now uses **per-call** sharing flags on `video_call_rooms`:
  - `share_with_client`, `share_with_candidate`

---

## C) Undocumented endpoints (public vs internal)

### Public (v1)
- v1 endpoints are under `src/app/api/v1/**` and are indexed in:
  - `Docs/BPOC_API_REFERENCE.md`
  - `BPOC_API_BIBLE.md`

### Internal (not part of v1 contract)
Examples:
- `/api/video/webhook` (Daily inbound webhooks)
- `/api/video/transcribe` (internal transcription orchestrator)

**Action**: clarify in docs what is public contract vs internal-only.

---

## D) Implementation gaps (product/engineering)

### 1) Webhook system for agencies (BPOC → agency portal)
- No v1 webhook registration/delivery.
- Critical for reducing polling and improving portal UX.

### 2) API key management
- Single API key per agency today; no scopes, rotation, or multi-key support.

### 3) Rate limiting
- Not implemented at v1 layer (needs a defined policy).

### 4) Sandbox / staging
- No formal sandbox environment.

### 5) Idempotency
- Needed for safe retries on POST endpoints.

---

## E) Suggested additions (high ROI)

1. Publish `CHANGELOG.md` for `/api/v1`
2. Add OpenAPI spec generation (even if partial)
3. Add Postman collection export
4. Add webhook registration + signature verification docs
5. Add explicit data retention + deletion policy


