# .agent Folder

> **AI Agent Configuration and Context**
> 
> This folder contains all the documentation and context needed for AI coding agents (like Claude, OpenCode, Cursor, etc.) to understand and work effectively with the BPOC codebase.

---

## 📖 START HERE

### For AI Agents

**Read these files in this order:**

1. **`MASTER_CONTEXT.md`** - Complete platform overview (MUST READ FIRST!)
2. **`PROJECT_INFO.md`** - Quick reference guide
3. **`DATABASE_SCHEMA.md`** - Database schema reference
4. **`TESTING_PROTOCOLS.md`** - Testing credentials and procedures

### For Developers

If you're a human developer:

1. Read `PROJECT_INFO.md` for quick start
2. Read `MASTER_CONTEXT.md` for deep understanding
3. Check `tracking/FEATURE_COMPLETION.md` for implementation status
4. Follow `rules/CODING_STANDARDS.md` for code style

---

## 📁 FOLDER STRUCTURE

```
.agent/
├── README.md                    ← You are here
├── MASTER_CONTEXT.md            ← THE BRAIN (most important!)
├── PROJECT_INFO.md              ← Quick reference
├── DATABASE_SCHEMA.md           ← Complete schema reference
├── TESTING_PROTOCOLS.md         ← Test users and procedures
│
├── api/                         ← API documentation
│   ├── API_BIBLE.md             ← Complete API guide
│   ├── API_QUICK_REFERENCE.md   ← Quick API reference
│   └── API_REFERENCE.md         ← Endpoint catalog
│
├── architecture/                ← System architecture
│   ├── AGENCY_SYSTEM.md         ← Multi-tenant architecture
│   └── AI_INSIGHTS.md           ← AI insights system
│
├── business/                    ← Business logic and flows
│   └── BPOC_EXPLAINED.md        ← Platform flow definitions
│
├── design/                      ← UI/UX guidelines
│   ├── STYLE_GUIDE.md           ← Brand style guide
│   └── RECRUITER_STYLING.md     ← Recruiter UI styling
│
├── features/                    ← Feature-specific docs
│   ├── candidate/               ← Candidate features
│   │   ├── candidate-flows.md   ← Candidate workflows
│   │   ├── resume-builder.md    ← Resume builder system
│   │   ├── hr-assistant.md      ← HR labor law assistant
│   │   └── esignature.md        ← E-signature implementation
│   ├── recruiter/               ← Recruiter features
│   │   ├── recruiter-flows.md   ← Recruiter workflows
│   │   ├── video-interviews.md  ← Video interview system
│   │   └── application-cards.md ← Application card architecture
│   └── admin/                   ← Admin features
│       └── admin-flows.md       ← Admin workflows
│
├── rules/                       ← Development rules
│   ├── CODING_STANDARDS.md      ← Code style and patterns
│   ├── SECURITY_RULES.md        ← Security guidelines
│   └── PERFORMANCE_RULES.md     ← Performance optimization
│
├── tracking/                    ← Progress tracking
│   ├── FEATURE_COMPLETION.md    ← % complete per feature
│   ├── KNOWN_BUGS.md            ← Bug registry
│   └── TESTING_STATUS.md        ← Test results and coverage
│
└── workflows/                   ← Workflow automation (future)
    ├── test-feature.workflow
    ├── deploy-feature.workflow
    └── debug-api.workflow
```

---

## 🎯 PURPOSE

This folder serves as the **single source of truth** for:

1. **AI Coding Agents** - Context to understand the codebase
2. **New Developers** - Onboarding documentation
3. **Documentation** - Centralized knowledge base
4. **Standards** - Coding and security guidelines
5. **Tracking** - Feature completion and bug registry

---

## 🔑 KEY CONCEPTS

### The Recruiter Gate

Applications are **hidden from clients by default**:
- `job_applications.released_to_client = FALSE` → Client CANNOT see
- `job_applications.released_to_client = TRUE` → Client CAN see

### Video Call Sharing

Each video call has **independent sharing controls**:
- `video_call_rooms.share_with_client` - Toggle per call
- `video_call_rooms.share_with_candidate` - Toggle per call

### Multi-Tenant Architecture

Each agency has **isolated data**:
- Recruiters see only their agency's data
- Clients see only their own jobs + released applications
- Candidates see only their own data

---

## 📝 HOW TO USE

### When Starting a New Task

1. Read `MASTER_CONTEXT.md` for platform understanding
2. Check `features/[role]/` for specific feature requirements
3. Review `DATABASE_SCHEMA.md` for table structures
4. Follow `rules/CODING_STANDARDS.md` for code style
5. Use `TESTING_PROTOCOLS.md` for testing

### When Debugging

1. Check `tracking/KNOWN_BUGS.md` for known issues
2. Review feature-specific documentation
3. Verify database schema and relationships
4. Check security rules for permission issues

### Before Deploying

1. Review `tracking/TESTING_STATUS.md` checklist
2. Verify `rules/SECURITY_RULES.md` compliance
3. Check `rules/PERFORMANCE_RULES.md` optimization
4. Test with credentials from `TESTING_PROTOCOLS.md`

---

## 🚀 QUICK START COMMANDS

```bash
# Read the main context
cat .agent/MASTER_CONTEXT.md

# Check project status
cat .agent/PROJECT_INFO.md

# View database schema
cat .agent/DATABASE_SCHEMA.md

# Get test credentials
cat .agent/TESTING_PROTOCOLS.md

# Check feature completion
cat .agent/tracking/FEATURE_COMPLETION.md
```

---

## 🔄 KEEPING THIS UPDATED

**When to update:**

- Feature completion → Update `tracking/FEATURE_COMPLETION.md`
- New bugs found → Update `tracking/KNOWN_BUGS.md`
- Database changes → Update `DATABASE_SCHEMA.md`
- New features added → Add to `features/[role]/`
- Architecture changes → Update `MASTER_CONTEXT.md`

**Who maintains:**
- Development team
- Lead developers
- Tech leads

---

## 🤖 FOR AI AGENTS

**If you're an AI agent reading this:**

1. **START WITH `MASTER_CONTEXT.md`** - This is the most important file
2. Read role-specific flows in `features/[role]/`
3. Respect security rules in `rules/SECURITY_RULES.md`
4. Follow coding standards in `rules/CODING_STANDARDS.md`
5. Use test credentials from `TESTING_PROTOCOLS.md`

**Critical Security Rules:**
- ⚠️ Always enforce `released_to_client` for client access
- ⚠️ Always respect `share_with_client` and `share_with_candidate` flags
- ⚠️ Always maintain multi-tenant isolation
- ⚠️ Never expose sensitive data without permission checks

---

## 📞 QUESTIONS?

- Check `MASTER_CONTEXT.md` for comprehensive overview
- Check `features/` for specific feature documentation
- Check `tracking/KNOWN_BUGS.md` for known issues
- Check `rules/` for coding guidelines

---

**Last Updated**: January 15, 2026  
**Created By**: BPOC Development Team  
**Purpose**: AI agent context and developer documentation
