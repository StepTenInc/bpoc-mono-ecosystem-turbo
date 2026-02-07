# BPOC API Reference - Canonical Endpoint List

**👉 For complete API documentation, see [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)**

---

## 📖 Complete Documentation

The **BPOC API Bible** is the single source of truth for all API integration:

- **[BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)** - 4,332 lines, 100% complete
- **[README_API_BIBLE.md](./README_API_BIBLE.md)** - Quick start guide
- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Code snippets & patterns

---

## 🔗 Quick Access

| What You Need | Where to Find It |
|---------------|------------------|
| **5-Minute Quick Start** | [Section 1.3](./BPOC_API_BIBLE.md#13-quick-start-5-minutes) |
| **All 35 Endpoints** | [Section 6](./BPOC_API_BIBLE.md#6-api-reference) |
| **Complete Endpoint Table** | [Appendix B](./BPOC_API_BIBLE.md#appendix-b-complete-endpoint-index) |
| **Quick Reference Card** | [Appendix A](./BPOC_API_BIBLE.md#appendix-a-quick-reference-card) |
| **Production Code** | [Section 12](./BPOC_API_BIBLE.md#12-code-examples) |
| **Data Models** | [Section 7](./BPOC_API_BIBLE.md#7-data-models) |
| **Status Values** | [Section 8](./BPOC_API_BIBLE.md#8-field-values-reference) |
| **Error Handling** | [Section 10](./BPOC_API_BIBLE.md#10-error-handling) |

---

## 📋 Endpoint Overview (35 Total)

### Clients (2 endpoints)
- `GET /clients` - List clients
- `POST /clients/get-or-create` - Link/create client ⚠️ **Required first!**

### Jobs (4 endpoints)
- `GET /jobs` - List jobs
- `GET /jobs/:id` - Get job details
- `POST /jobs/create` - Create job (Pro+)
- `PATCH /jobs/:id` - Update job

### Applications (6 endpoints)
- `GET /applications` - List applications
- `GET /applications/:id` - Get application
- `PATCH /applications/:id` - Update status
- `POST /applications/:id/release` - Release to client (Recruiter Gate)
- `POST /applications/:id/send-back` - Hide from client
- `POST /applications/invite` - Invite candidate

### Application Card (2 endpoints)
- `GET /applications/:id/card` - Complete lifecycle view
- `PATCH /applications/:id/card/client-feedback` - Update feedback

### Interviews (3 endpoints)
- `GET /interviews` - List interviews (Pro+)
- `POST /interviews` - Schedule interview (Pro+)
- `PATCH /interviews` - Update interview

### Video Rooms (5 endpoints)
- `GET /video/rooms` - List rooms (Pro+)
- `POST /video/rooms` - Create room (Pro+)
- `GET /video/rooms/:roomId` - Get room
- `PATCH /video/rooms/:roomId` - Update room
- `DELETE /video/rooms/:roomId` - Delete room

### Recordings (3 endpoints)
- `GET /video/recordings` - List recordings (Pro+)
- `GET /video/recordings/:recordingId` - Get recording (Pro+)
- `POST /video/recordings/:recordingId` - Trigger transcription (Enterprise)

### Transcripts (1 endpoint)
- `GET /video/transcripts/:transcriptId` - Get transcript (Enterprise)

### Offers (2 endpoints)
- `GET /offers` - List offers (Enterprise)
- `POST /offers` - Create offer (Enterprise)

### Counter Offers (3 endpoints)
- `GET /offers/:offerId/counter` - Get counter history (Enterprise)
- `POST /offers/:offerId/counter/accept` - Accept counter (Enterprise)
- `POST /offers/:offerId/counter/reject` - Reject counter (Enterprise)

### Candidates (2 endpoints)
- `GET /candidates` - Search talent pool (Enterprise)
- `GET /candidates/:id/complete` - Get complete profile (Enterprise)

### Public Embed (1 endpoint)
- `GET /embed/jobs` - Embeddable job widget (Public)

### Notifications (1 endpoint)
- `POST /notifications/call` - Call notification (Internal)

---

## 📊 Complete Endpoint Table

See **[BPOC_API_BIBLE.md - Appendix B](./BPOC_API_BIBLE.md#appendix-b-complete-endpoint-index)** for the complete sortable table with:
- HTTP method
- Full URL
- Tier requirement
- Description

---

## 🎯 Tier Requirements

| Tier | Endpoints Available |
|------|---------------------|
| **Free** | Clients (2), Jobs read (2), Applications read (2) |
| **Pro** | + Jobs write (2), Interviews (3), Video (8) |
| **Enterprise** | + Offers (2), Counter Offers (3), Candidates (2), Transcription (1) |

**Full details:** [BPOC_API_BIBLE.md - Section 3.3](./BPOC_API_BIBLE.md#33-tier-pricing)

---

## 📖 Full Documentation

For complete documentation including:
- Request/response schemas for every endpoint
- cURL examples
- TypeScript/Python production clients
- Error handling
- GDPR compliance
- And more...

**See:** [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md) (4,332 lines, 100% complete)

---

## 🚀 Quick Start

```bash
# 1. Get your API key
# Go to /recruiter/api → Generate API Key

# 2. Test connection
curl "https://bpoc.io/api/v1/clients" \
  -H "X-API-Key: YOUR_KEY"

# 3. Link your first client
curl -X POST "https://bpoc.io/api/v1/clients/get-or-create" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "email": "hr@acme.com"}'
```

**Complete quick start:** [BPOC_API_BIBLE.md - Section 1.3](./BPOC_API_BIBLE.md#13-quick-start-5-minutes)

---

## 📞 Support

- **Complete Documentation:** [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)
- **Quick Start Guide:** [README_API_BIBLE.md](./README_API_BIBLE.md)
- **Email:** dev@bpoc.app
- **API Dashboard:** `/recruiter/api`

---

**Last Updated:** January 9, 2026  
**API Version:** v1  
**Status:** Production
