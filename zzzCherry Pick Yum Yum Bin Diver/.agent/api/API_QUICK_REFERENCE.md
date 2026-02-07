# API Quick Reference

**👉 For complete API documentation, see [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)**

---

## 🚀 Quick Start (30 seconds)

```typescript
// 1. Initialize
const bpoc = new BpocClient(process.env.BPOC_API_KEY);

// 2. Link client (REQUIRED FIRST)
const client = await bpoc.getOrCreateClient({
  name: "Acme Corp",
  email: "hr@acme.com"
});

// 3. Create job
const job = await bpoc.createJob({
  clientId: client.clientId,
  title: "Virtual Assistant",
  description: "...",
  salaryMin: 30000,
  salaryMax: 45000
});

// 4. Get applications
const apps = await bpoc.getApplications({
  jobId: job.job.id,
  mode: "recruiter"  // See ALL applications
});
```

**Complete code:** [BPOC_API_BIBLE.md - Section 12](./BPOC_API_BIBLE.md#12-code-examples)

---

## 📚 What's in the API Bible?

| Section | Content |
|---------|---------|
| **Section 1-5** | Introduction, Auth, Workflows (5 Mermaid diagrams) |
| **Section 6** | All 35 endpoints (fully documented) |
| **Section 7** | 10 data models (TypeScript interfaces) |
| **Section 8** | Field values, enums, status transitions |
| **Section 10** | Error handling & troubleshooting |
| **Section 12** | Production-ready code (TypeScript, Python, cURL) |
| **Section 14** | GDPR compliance & data policies |
| **Appendix A** | 1-page quick reference card |
| **Appendix B** | Complete endpoint index (sortable table) |
| **Appendix C** | Database schema reference |

---

## 🔗 Quick Links

### For First-Time Integrators
- **[5-Minute Quick Start](./BPOC_API_BIBLE.md#13-quick-start-5-minutes)** - Get up and running
- **[Complete Workflows](./BPOC_API_BIBLE.md#5-complete-workflows)** - Visual diagrams

### For Developers
- **[API Reference](./BPOC_API_BIBLE.md#6-api-reference)** - All 35 endpoints
- **[Code Examples](./BPOC_API_BIBLE.md#12-code-examples)** - TypeScript, Python, cURL
- **[Error Handling](./BPOC_API_BIBLE.md#10-error-handling)** - Troubleshooting guide

### For Quick Lookup
- **[Quick Reference Card](./BPOC_API_BIBLE.md#appendix-a-quick-reference-card)** - 1-page cheat sheet
- **[Endpoint Index](./BPOC_API_BIBLE.md#appendix-b-complete-endpoint-index)** - All endpoints table
- **[Field Values](./BPOC_API_BIBLE.md#8-field-values-reference)** - Enums & status transitions

---

## 📋 Essential Endpoints

### Clients
```bash
GET  /api/v1/clients
POST /api/v1/clients/get-or-create  # ⚠️ Required first!
```

### Jobs
```bash
GET   /api/v1/jobs
GET   /api/v1/jobs/:id
POST  /api/v1/jobs/create          # Pro+
PATCH /api/v1/jobs/:id
```

### Applications
```bash
GET   /api/v1/applications?mode=recruiter  # See all
GET   /api/v1/applications/:id
PATCH /api/v1/applications/:id
POST  /api/v1/applications/:id/release     # Recruiter Gate
```

### Interviews & Video
```bash
POST /api/v1/interviews                    # Pro+
POST /api/v1/video/rooms                   # Pro+
```

### Offers
```bash
GET  /api/v1/offers                        # Enterprise
POST /api/v1/offers                        # Enterprise
```

**Complete list:** [BPOC_API_BIBLE.md - Appendix B](./BPOC_API_BIBLE.md#appendix-b-complete-endpoint-index)

---

## 🎯 Status Values Quick Reference

### Application Statuses
```
invited → submitted → under_review → shortlisted 
       → interview_scheduled → offer_sent → hired → started ✅
```

**Complete transitions:** [BPOC_API_BIBLE.md - Section 8.1](./BPOC_API_BIBLE.md#81-status-values)

---

## ⚡ Common Patterns

### Pattern 1: Client Posts a Job
```typescript
// 1. Link client (once per client)
const { clientId } = await bpoc.getOrCreateClient({ name: "Acme Corp" });

// 2. Create job
const { job } = await bpoc.createJob({
  clientId,
  title: "Virtual Assistant",
  description: "...",
  salaryMin: 30000,
  salaryMax: 45000,
  workArrangement: "remote"  // Flexible input: "remote", "wfh", "work from home"
});
```

### Pattern 2: Release to Client (Recruiter Gate)
```typescript
await bpoc.releaseToClient(applicationId, {
  status: "shortlisted",
  share_calls_with_client: ["prescreen-room-id"]
});
```

### Pattern 3: Schedule Interview
```typescript
const { joinUrls } = await bpoc.scheduleInterview({
  applicationId,
  type: "client_round_1",
  scheduledAt: "2025-02-15T10:00:00Z",
  clientId
});

// Send: joinUrls.recruiter.url, joinUrls.candidate.url, joinUrls.client.url
```

**More examples:** [BPOC_API_BIBLE.md - Section 12](./BPOC_API_BIBLE.md#12-code-examples)

---

## 🔑 Authentication

```bash
# All requests require:
X-API-Key: your-api-key-here
Content-Type: application/json

# Base URL
https://bpoc.io/api/v1
```

**Get your key:** `/recruiter/api` → Generate API Key

---

## 🚨 Common Errors

| Error | Solution |
|-------|----------|
| `Invalid or missing API key` | Check `X-API-Key` header, regenerate if needed |
| `Client not found` | Call `POST /clients/get-or-create` first |
| `Tier restriction` | Feature requires Pro or Enterprise plan |
| `Application not found` | Check `clientId` scope, use `mode=recruiter` |

**Troubleshooting guide:** [BPOC_API_BIBLE.md - Section 10.3](./BPOC_API_BIBLE.md#103-common-errors--solutions)

---

## 📞 Support

- **Complete Documentation:** [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md) (4,332 lines)
- **Quick Start Guide:** [README_API_BIBLE.md](./README_API_BIBLE.md)
- **Email:** dev@bpoc.app
- **API Dashboard:** `/recruiter/api`

---

**Ready to integrate? Start with [BPOC_API_BIBLE.md](./BPOC_API_BIBLE.md)** 🚀
