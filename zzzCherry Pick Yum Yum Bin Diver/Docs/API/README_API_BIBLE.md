# BPOC API Bible - Quick Start

## 📖 What is This?

The **BPOC API Bible** is the **single source of truth** for integrating with the BPOC recruitment platform via API.

**File:** [`BPOC_API_BIBLE.md`](./BPOC_API_BIBLE.md)  
**Size:** 4,332 lines  
**Status:** ✅ **100% Complete**  
**Last Updated:** January 9, 2026

---

## 🎯 Who Is This For?

- **External Agencies** (e.g., ShoreAgents) integrating with BPOC
- **Developers** building recruitment management systems
- **Product Managers** understanding the BPOC platform
- **Compliance Officers** reviewing data handling policies

---

## 📚 What's Inside?

### Core Integration (Sections 1-5)
- **5-minute Quick Start** - Get up and running immediately
- **Authentication** - API key setup and security
- **Complete Workflows** - 5 end-to-end flows with Mermaid diagrams
  - Client Onboarding
  - Job-to-Hire (12 steps)
  - Video Interviews
  - Recruiter Gate
  - Offer Negotiation

### API Reference (Section 6)
- **35 Endpoints** - Fully documented with:
  - Request/response schemas
  - cURL examples
  - Tier restrictions
  - Error handling

**Endpoint Groups:**
- Clients (2), Jobs (4), Applications (6), Application Card (2)
- Interviews (3), Offers (2), Counter Offers (3)
- Video Rooms (5), Recordings (3), Transcripts (1)
- Candidates/Talent Pool (2), Embed (1), Notifications (1)

### Data Models (Section 7)
- **10 Complete TypeScript Interfaces**
  - Client, Job, Application, Candidate
  - Interview, Offer, VideoCallRoom, Recording
  - Transcript, TimelineEvent
- All sub-models (Skill, WorkExperience, Education, Assessments, etc.)

### Field Values (Section 8)
- **Status Transitions** - Valid state changes
- **Enum Values** - All accepted values + aliases
- **Flexible Input Mapping** - How the API normalizes your data

### Error Handling (Section 10)
- **6 Common Errors** with solutions
- **Retry Strategies** - Exponential backoff code
- **Debug Mode** - Get detailed error info

### Code Examples (Section 12)
- **Production-Ready TypeScript Client** (200+ lines)
- **Production-Ready Python Client** (100+ lines)
- **Complete cURL Workflow** (end-to-end)

### Compliance (Section 14)
- **GDPR Compliance** - Candidate rights, agency responsibilities
- **Data Retention** - By data type
- **Data Export/Deletion** - Procedures

### Appendices
- **Quick Reference Card** - 1-page cheat sheet
- **Complete Endpoint Index** - Sortable table of all 35 endpoints
- **Database Schema** - Table relationships

---

## 🚀 Quick Start (30 seconds)

```typescript
// 1. Install (copy into your project)
// See Section 12.1 for complete TypeScript client

// 2. Initialize
const bpoc = new BpocClient(process.env.BPOC_API_KEY);

// 3. Link client (REQUIRED FIRST)
const client = await bpoc.getOrCreateClient({
  name: "Acme Corp",
  email: "hr@acme.com"
});

// 4. Create job
const job = await bpoc.createJob({
  clientId: client.clientId,
  title: "Virtual Assistant",
  description: "...",
  salaryMin: 30000,
  salaryMax: 45000
});

// 5. Get applications
const apps = await bpoc.getApplications({
  jobId: job.job.id,
  mode: "recruiter"  // See ALL applications
});

// 6. Release to client
await bpoc.releaseToClient(apps.applications[0].id, {
  status: "shortlisted",
  share_calls_with_client: ["prescreen-room-id"]
});
```

**That's it!** You're integrated. See Section 5 for complete workflows.

---

## 📖 How to Use This Bible

### For First-Time Integrators
1. Read **Section 1-2** (Introduction & Auth) - 5 minutes
2. Run **Section 1.3** (Quick Start) - 5 minutes
3. Review **Section 5** (Workflows) - Choose your flow
4. Implement using **Section 6** (API Reference)
5. Copy **Section 12** (Code Examples) into your project

### For Experienced Developers
1. Jump to **Section 6** (API Reference)
2. Use **Appendix B** (Endpoint Index) for quick lookup
3. Copy **Section 12.1** (TypeScript Client) or **12.2** (Python Client)
4. Reference **Section 8** (Field Values) for enums

### For Product Managers
1. Review **Section 5** (Workflows with Diagrams)
2. Check **Section 3.3** (Tier Pricing)
3. Review **Section 8.1** (Status Transitions)

### For Troubleshooting
1. Check **Section 10.3** (Common Errors & Solutions)
2. Use **Section 10.4** (Retry Strategy)
3. Add `?debug=1` to API calls for detailed errors

---

## 🔗 Related Documentation

| File | Purpose | Status |
|------|---------|--------|
| **BPOC_API_BIBLE.md** | **Single source of truth** | ✅ Complete |
| API_GAPS_REPORT.md | Known gaps (rate limits, webhooks, etc.) | ✅ Complete |
| API_BIBLE_STATUS.md | Detailed completion report | ✅ Complete |
| BPOC_API_REFERENCE.md | Canonical endpoint list | ✅ Complete |
| API_QUICK_REFERENCE.md | Code snippets (now points to Bible) | ✅ Updated |

**Recommendation:** Point all integrators to **`BPOC_API_BIBLE.md`** first.

---

## 🎁 What You Get

✅ **35 Endpoints** - Fully documented  
✅ **10 Data Models** - TypeScript interfaces  
✅ **5 Workflows** - With Mermaid diagrams  
✅ **2 Production Clients** - TypeScript + Python  
✅ **100+ Code Examples** - Copy-paste ready  
✅ **50+ Reference Tables** - Status, enums, errors  
✅ **6 Error Solutions** - Troubleshooting guide  
✅ **3 Appendices** - Quick reference, endpoint index, DB schema  

**Total:** 4,332 lines of comprehensive, production-ready API documentation.

---

## 📞 Support

**Questions about the API?**
- Email: dev@bpoc.app
- Technical Support: support@bpoc.app

**Found an issue in the docs?**
- Email: dev@bpoc.app with subject "API Bible Feedback"

**Need a feature that's not implemented?**
- Email: hello@bpoc.app
- Reference the [API Gaps Report](./API_GAPS_REPORT.md)

---

## 🏆 Success Checklist

Before going live, ensure you:

- [ ] Read Section 1-2 (Introduction & Auth)
- [ ] Generated API key in `/recruiter/api`
- [ ] Called `POST /clients/get-or-create` for each client
- [ ] Stored `clientId` (not `companyId`)
- [ ] Use `mode=recruiter` to see all applications
- [ ] Implement error handling (Section 10.4)
- [ ] Handle status transitions correctly (Section 8.1)
- [ ] Store and use video join URLs (Section 6.6)
- [ ] Respect tier restrictions (Section 3.3)
- [ ] Review GDPR compliance (Section 14.2)

---

## 🎉 You're Ready!

The BPOC API Bible contains **everything** you need to integrate with BPOC.

**Start here:** Section 1.3 (5-Minute Quick Start)

**Good luck, and happy recruiting!** 🚀

