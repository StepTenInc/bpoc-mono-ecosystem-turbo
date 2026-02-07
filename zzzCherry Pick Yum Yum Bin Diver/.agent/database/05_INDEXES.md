# Database Indexes

> **All Indexes for Query Optimization**  
> **Generated**: 2026-01-27 09:22 SGT  
> **Total Indexes**: 400+

---

## Index Types

- **B-tree**: Standard indexes (most common)
- **GIN**: For array/JSONB fields
- **UNIQUE**: Enforce uniqueness

---

## Key Indexes

### Candidates Table
- `candidates_pkey` - PRIMARY KEY (id)
- `candidates_email_key` - UNIQUE (email)
- `candidates_username_key` - UNIQUE (username)
- `idx_candidates_email` - INDEX (email)
- `idx_candidates_is_active` - INDEX (is_active)

### Job Applications
- `idx_job_applications_candidate_id` - INDEX (candidate_id)
- `idx_job_applications_job_id` - INDEX (job_id)
- `idx_job_applications_status` - INDEX (status)
- `idx_job_applications_created_at` - INDEX (created_at DESC)

### Video Calls
- `idx_video_call_rooms_status` - INDEX (status)
- `idx_video_call_rooms_scheduled_at` - INDEX (scheduled_at)
- `idx_video_call_rooms_agency_id` - INDEX (agency_id)

### Carpet Bomb Leads
- `idx_carpet_bomb_leads_email` - INDEX (email)
- `idx_carpet_bomb_leads_signed_up` - INDEX (signed_up)
- `idx_carpet_bomb_leads_utm_campaign` - INDEX (utm_campaign)

---

## Performance Notes

- All foreign keys have indexes
- Status fields have indexes for filtering
- Timestamp fields have DESC indexes for sorting
- Email fields have indexes for lookups
- JSONB fields use GIN indexes where needed

---

**For complete index definitions (400+)**, query via MCP.
