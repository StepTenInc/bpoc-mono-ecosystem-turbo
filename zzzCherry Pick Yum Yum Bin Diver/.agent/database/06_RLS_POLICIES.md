# Row Level Security (RLS) Policies

> **Complete RLS Policy Reference**  
> **Generated**: 2026-01-27 09:22 SGT  
> **Total Policies**: 100+  
> **Tables with RLS**: 51/67

---

## RLS Summary

| Status | Count |
|--------|-------|
| **RLS Enabled** | 51 tables |
| **RLS Disabled** | 16 tables |
| **Total Policies** | 100+ |

---

## Tables WITHOUT RLS (16)

These tables are accessible without RLS (typically via service role or public):

- `anonymous_sessions`
- `application_activity_timeline`
- `application_client_feedback`
- `article_embeddings`
- `article_links`
- `campaign_recipients`
- `email_activity_log`
- `email_campaigns`
- `csv_import_batches`
- `content_pipelines`
- `humanization_patterns`
- `insight_embeddings`
- `notification_reads`
- `outbound_contacts`
- `personality_profiles`
- `pipeline_execution_logs`

---

## Key RLS Policies

### Candidates
- **Policy**: Candidates can manage their own data
- **SELECT**: `auth.uid() = id`
- **INSERT**: `auth.uid() = id`
- **UPDATE**: `auth.uid() = id`
- **DELETE**: `auth.uid() = id`

### Candidate Profiles
- **Policy**: Candidates manage own profile
- **SELECT**: `candidate_id = auth.uid()` OR public fields
- **UPDATE**: `candidate_id = auth.uid()`

### Jobs
- **Policy**: Agency isolation
- **SELECT**: Public if active
- **INSERT**: Agency recruiters only
- **UPDATE**: Agency recruiter of owning agency
- **DELETE**: Agency owner only

### Job Applications
- **Policy**: Candidate + recruiter access
- **SELECT**: Candidate can see their own, recruiters see their agency's
- **UPDATE**: Status updates by recruiters only

### Agencies
- **Policy**: Agency isolation
- **SELECT**: Public basic info, full details for members
- **UPDATE**: Agency admins/owners only

### Video Calls
- **Policy**: Participant access
- **SELECT**: Room host or participant
- **UPDATE**: Room host only

### Webhooks
- **Policy**: Agency isolation
- **ALL**: Agency members only via `agency_id IN (SELECT agency_id FROM agency_recruiters WHERE user_id = auth.uid())`

### Admin Tables
- **Policy**: Admin users only
- **ALL**: `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())`

---

## Common Policy Patterns

### 1. User Isolation
```sql
auth.uid() = user_id
```

### 2. Agency Isolation
```sql
agency_id IN (
  SELECT agency_id FROM agency_recruiters 
  WHERE user_id = auth.uid()
)
```

### 3. Candidate Ownership
```sql
candidate_id = auth.uid()
```

### 4. Admin Only
```sql
EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid()
)
```

### 5. Service Role Bypass
```sql
auth.role() = 'service_role'
```

---

## Special Notes

**Storage RLS**: Storage buckets have separate RLS policies
- `candidate` bucket: Users can upload/update/delete their own files
- Public buckets: Read-only public access
- Private buckets: Authenticated access only

**Service Role**: Many policies allow `service_role` to bypass RLS for server-side operations

---

**For complete policy definitions (100+)**, query via MCP `pg_policies` table.
