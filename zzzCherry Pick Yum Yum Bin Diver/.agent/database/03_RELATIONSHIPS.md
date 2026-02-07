# Foreign Key Relationships

> **Complete Relationship Map**  
> **Generated**: 2026-01-27 09:22 SGT  
> **Total Foreign Keys**: 200+

---

## Key Relationships

### Candidates Ecosystem
```
candidates (core identity)
├── candidate_profiles (1:1)
├── candidate_resumes (1:n)
├── candidate_skills (1:n)
├── candidate_educations (1:n)
├── candidate_work_experiences (1:n)
├── candidate_ai_analysis (1:1)
├── job_applications (1:n)
├── job_matches (1:n)
├── personality_profiles (1:1)
├── carpet_bomb_leads (1:1)
└── outbound_contacts (1:1)
```

### Jobs Ecosystem
```
jobs
├── job_applications (1:n)
├── job_matches (1:n)
├── job_interviews (via applications, 1:n)
├── job_offers (via applications, 1:n)
└── job_skills (1:n)
```

### Agency Ecosystem
```
agencies
├── agency_recruiters (1:n)
├── agency_profiles (1:1)
├── agency_clients (1:n)
├── jobs (via agency_clients, 1:n)
└── webhooks (1:n)
```

### Video Calls
```
video_call_rooms
├── video_call_participants (1:n)
├── video_call_recordings (1:n)
├── video_call_transcripts (via recordings, 1:n)
└── video_call_invitations (1:n)
```

---

## Critical Foreign Keys

**candidates → others** (Most referenced table)
- candidate_profiles.candidate_id → candidates.id
- candidate_resumes.candidate_id → candidates.id
- job_applications.candidate_id → candidates.id
- (+17 more...)

**agencies → others**
- agency_clients.agency_id → agencies.id
- agency_recruiters.agency_id → agencies.id
- webhooks.agency_id → agencies.id

**jobs → others**
- job_applications.job_id → jobs.id
- job_matches.job_id → jobs.id
- job_skills.job_id → jobs.id

---

**For complete list with CASCADE/SET NULL rules**, see database via MCP.
