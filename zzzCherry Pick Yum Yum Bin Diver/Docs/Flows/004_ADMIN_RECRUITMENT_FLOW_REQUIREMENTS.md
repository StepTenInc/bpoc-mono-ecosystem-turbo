# BPOC Admin - Recruitment Flow Requirements

> **Platform Oversight & Management**
> 
> Version: 1.0 | Last Updated: January 5, 2026
> 
> **Scope:** Recruitment flow oversight only (not billing, technical settings, etc.)
> **Role:** BPOC internal team - platform administrators

---

## Table of Contents

1. [Admin Role Overview](#admin-role-overview)
2. [Module Overview](#module-overview)
3. [Agency Management](#agency-management)
4. [Candidate Management](#candidate-management)
5. [Job Monitoring](#job-monitoring)
6. [Application Oversight](#application-oversight)
7. [Interview Monitoring](#interview-monitoring)
8. [Offer Tracking](#offer-tracking)
9. [Leaderboard & Performance](#leaderboard--performance)
10. [Insights Manager](#insights-manager)
11. [Analytics](#analytics)
12. [Support & Intervention](#support--intervention)
13. [Admin vs Other Roles](#admin-vs-other-roles)
14. [Notification System](#notification-system)
15. [Data Admin Sees](#data-admin-sees)
16. [Actions Admin Can Take](#actions-admin-can-take)
17. [Database Requirements](#database-requirements)
18. [API Endpoints Required](#api-endpoints-required)

---

## Admin Role Overview

### What is BPOC Admin?

- Internal BPOC team member
- Platform-level oversight and management
- Can see ALL data across ALL agencies
- Monitors platform health and quality
- Provides support when needed
- Does NOT typically perform day-to-day recruitment tasks

### Admin Philosophy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ADMIN ROLE                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRIMARY: Oversight & Monitoring                                           │
│   ─────────────────────────────────────────────────────────────────────     │
│   • See everything across all agencies                                      │
│   • Monitor platform health                                                 │
│   • Track performance metrics                                               │
│   • Ensure quality standards                                                │
│                                                                             │
│   SECONDARY: Support & Intervention                                         │
│   ─────────────────────────────────────────────────────────────────────     │
│   • Help agencies with issues                                               │
│   • Assist candidates with problems                                         │
│   • Resolve disputes                                                        │
│   • Fix data issues                                                         │
│                                                                             │
│   RARE: Direct Action                                                       │
│   ─────────────────────────────────────────────────────────────────────     │
│   • Override statuses (exceptional cases)                                   │
│   • Suspend bad actors                                                      │
│   • Manual corrections                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Admin Capabilities Summary

| Capability | Description |
|------------|-------------|
| **Full Visibility** | See ALL data across ALL agencies |
| **Read Everything** | All candidates, jobs, applications, offers |
| **Monitor Metrics** | Platform-wide analytics and performance |
| **Support Actions** | Help users, resolve issues |
| **Override Powers** | Change statuses, fix data (rare) |
| **Suspend/Ban** | Remove bad actors from platform |

---

## Module Overview

### Admin Platform Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BPOC ADMIN PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MAIN                                                                       │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  📊 Dashboard        Platform overview, key metrics, alerts                 │
│  🏛️ Agencies         All agencies, performance, status                      │
│  👥 Candidates       All candidates platform-wide                           │
│  💼 Jobs             All jobs across all agencies                           │
│  📋 Applications     All applications platform-wide                         │
│  📅 Interviews       All interviews across platform                         │
│  📨 Offers           All offers platform-wide                               │
│  🏆 Leaderboard      Agency & recruiter rankings                            │
│  💡 Insights Manager Platform insights & trends                             │
│  📈 Analytics        Detailed platform analytics                            │
│                                                                             │
│  SETTINGS                                                                   │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ⚙️ Settings         Platform configuration (out of scope)                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Hierarchy

```
                         ┌─────────────────┐
                         │   BPOC ADMIN    │
                         │  (sees ALL)     │
                         └────────┬────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
     ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
     │  Agency A   │       │  Agency B   │       │  Agency C   │
     │ (ShoreAgents)│       │ (RecruitCo) │       │ (TalentHub) │
     └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
            │                     │                     │
     ┌──────┴──────┐       ┌──────┴──────┐       ┌──────┴──────┐
     │ Recruiters  │       │ Recruiters  │       │ Recruiters  │
     │ Clients     │       │ Clients     │       │ Clients     │
     │ Jobs        │       │ Jobs        │       │ Jobs        │
     │ Applications│       │ Applications│       │ Applications│
     └─────────────┘       └─────────────┘       └─────────────┘
```

---

## Agency Management

### View All Agencies

**Admin Sees:**
```
agency_list {
  agencies: array [{
    id: uuid
    name: string
    slug: string
    logo_url: string
    
    // Status
    status: "active" | "inactive" | "suspended" | "pending"
    tier: "standard" | "enterprise"
    
    // Stats
    recruiter_count: integer
    client_count: integer
    active_jobs: integer
    total_applications: integer
    total_placements: integer
    
    // Performance
    avg_time_to_hire: decimal (days)
    placement_rate: decimal (percentage)
    
    // Activity
    last_active: timestamp
    created_at: timestamp
  }]
}
```

### Agency Detail View

**Admin Sees Full Agency Data:**
```
agency_detail {
  // Basic Info
  id: uuid
  name: string
  slug: string
  logo_url: string
  website: string
  description: text
  
  // Contact
  contact_name: string
  contact_email: string
  contact_phone: string
  
  // Status
  status: "active" | "inactive" | "suspended" | "pending"
  tier: "standard" | "enterprise"
  verified: boolean
  
  // Team
  recruiters: array [{
    id: uuid
    name: string
    email: string
    role: string
    status: string
    applications_handled: integer
    placements_made: integer
    last_active: timestamp
  }]
  
  // Clients
  clients: array [{
    id: uuid
    name: string
    status: string
    jobs_count: integer
    placements_count: integer
  }]
  
  // Stats
  stats: {
    total_recruiters: integer
    total_clients: integer
    total_jobs: integer
    active_jobs: integer
    total_applications: integer
    total_placements: integer
    avg_time_to_hire: decimal
    placement_rate: decimal
  }
  
  // Activity
  recent_activity: array of events
  
  // Timestamps
  created_at: timestamp
  updated_at: timestamp
}
```

### Agency Filters

| Filter | Options |
|--------|---------|
| **Status** | Active, Inactive, Suspended, Pending |
| **Tier** | Standard, Enterprise |
| **Performance** | High, Medium, Low |
| **Activity** | Active recently, Inactive |
| **Size** | By recruiter count, client count |
| **Date** | Created date range |

### Agency Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **View** | See full agency details | Monitoring |
| **View Recruiters** | See all recruiters | Support |
| **View Clients** | See all clients | Support |
| **View Jobs** | See all jobs | Monitoring |
| **View Applications** | See all applications | Support |
| **Suspend** | Temporarily disable agency | Policy violation |
| **Reactivate** | Re-enable suspended agency | After resolution |
| **Change Tier** | Upgrade/downgrade tier | Sales/billing |
| **Add Note** | Internal admin note | Documentation |

### Agency Status Flow

```
┌─────────┐     ┌─────────┐
│ pending │ ──▶ │ active  │
└─────────┘     └─────────┘
                     │
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
      ┌───────────┐    ┌───────────┐
      │ suspended │    │ inactive  │
      └─────┬─────┘    └───────────┘
            │
            ▼
      ┌───────────┐
      │  active   │ (reactivated)
      └───────────┘
```

---

## Candidate Management

### View All Candidates

**Admin Sees ALL Candidates Platform-Wide:**
```
candidate_list {
  candidates: array [{
    id: uuid
    full_name: string
    email: string
    avatar_url: string
    headline: string
    location: string
    
    // Status
    status: "active" | "inactive" | "suspended" | "incomplete"
    profile_complete: boolean
    
    // Activity
    applications_count: integer
    interviews_count: integer
    offers_count: integer
    placements_count: integer
    
    // Timestamps
    last_active: timestamp
    created_at: timestamp
  }]
}
```

### Candidate Detail View

**Admin Sees Full Candidate Data:**
```
candidate_detail {
  // All candidate profile fields (same as recruiter view)
  // Plus admin-specific fields:
  
  // Account Status
  account_status: "active" | "inactive" | "suspended" | "deleted"
  email_verified: boolean
  phone_verified: boolean
  
  // Platform Activity
  login_count: integer
  last_login: timestamp
  
  // Applications Across ALL Agencies
  all_applications: array [{
    id: uuid
    job_title: string
    agency_name: string
    client_name: string
    status: string
    applied_at: timestamp
  }]
  
  // Flags/Issues
  flags: array [{
    type: string
    reason: string
    flagged_by: string
    flagged_at: timestamp
  }]
  
  // Admin Notes
  admin_notes: array [{
    note: text
    created_by: string
    created_at: timestamp
  }]
}
```

### Candidate Filters

| Filter | Options |
|--------|---------|
| **Status** | Active, Inactive, Suspended |
| **Profile** | Complete, Incomplete |
| **Activity** | Active recently, Inactive |
| **Applications** | Has applications, No applications |
| **Location** | City, Province, Country |
| **Date** | Registered date range |
| **Agency** | Applied to specific agency |

### Candidate Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **View** | See full candidate profile | Support |
| **View Applications** | See all applications | Support |
| **Suspend** | Temporarily disable account | Policy violation |
| **Reactivate** | Re-enable account | After resolution |
| **Delete** | Permanently remove (GDPR) | User request |
| **Merge** | Merge duplicate accounts | Data cleanup |
| **Add Note** | Internal admin note | Documentation |
| **Reset Password** | Trigger password reset | Support |
| **Verify Email** | Manually verify email | Support |

### Candidate Status Flow

```
┌────────────┐     ┌─────────┐
│ incomplete │ ──▶ │ active  │
└────────────┘     └─────────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
      ┌───────────┐ ┌───────────┐ ┌───────────┐
      │ suspended │ │ inactive  │ │  deleted  │
      └─────┬─────┘ └───────────┘ └───────────┘
            │
            ▼
      ┌───────────┐
      │  active   │ (reactivated)
      └───────────┘
```

---

## Job Monitoring

### View All Jobs

**Admin Sees ALL Jobs Platform-Wide:**
```
job_list {
  jobs: array [{
    id: uuid
    title: string
    
    // Context
    agency_name: string
    client_name: string
    posted_by: string (recruiter name)
    
    // Status
    status: "draft" | "active" | "paused" | "closed" | "filled"
    
    // Stats
    views: integer
    applications_count: integer
    interviews_count: integer
    offers_count: integer
    
    // Dates
    created_at: timestamp
    application_deadline: date
  }]
}
```

### Job Detail View

**Admin Sees Full Job Data:**
```
job_detail {
  // All job fields (same as recruiter view)
  // Plus cross-reference data:
  
  // Agency Context
  agency: {
    id: uuid
    name: string
    status: string
  }
  
  // Client Context
  client: {
    id: uuid
    name: string
    status: string
  }
  
  // All Applications (regardless of release status)
  all_applications: array
  
  // Funnel Metrics
  funnel: {
    views: integer
    applications: integer
    screened: integer
    released: integer
    interviewed: integer
    offered: integer
    hired: integer
  }
  
  // Admin Notes
  admin_notes: array
}
```

### Job Filters

| Filter | Options |
|--------|---------|
| **Agency** | Select agency |
| **Client** | Select client |
| **Status** | Draft, Active, Paused, Closed, Filled |
| **Work Type** | Full-time, Part-time, Contract |
| **Work Arrangement** | Remote, Onsite, Hybrid |
| **Salary Range** | Min-max range |
| **Date** | Posted date range |
| **Performance** | High applications, Low applications |

### Job Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **View** | See full job details | Monitoring |
| **View Applications** | See all applications | Support |
| **Pause** | Temporarily hide job | Policy issue |
| **Close** | Force close job | Policy issue |
| **Flag** | Flag for review | Quality control |
| **Add Note** | Internal admin note | Documentation |

---

## Application Oversight

### View All Applications

**Admin Sees ALL Applications Platform-Wide:**
```
application_list {
  applications: array [{
    id: uuid
    
    // Candidate
    candidate_name: string
    candidate_email: string
    
    // Job Context
    job_title: string
    agency_name: string
    client_name: string
    
    // Status
    status: string
    released_to_client: boolean
    
    // Flow Progress
    has_prescreen: boolean
    prescreen_rating: integer
    has_interview: boolean
    has_offer: boolean
    
    // Dates
    applied_at: timestamp
    updated_at: timestamp
  }]
}
```

### Application Detail View

**Admin Sees Full Application Data:**
```
application_detail {
  // All application fields (same as recruiter view)
  // Plus admin-specific data:
  
  // Cross-Agency View
  candidate_other_applications: array [{
    // Applications to OTHER agencies
    agency_name: string
    job_title: string
    status: string
    applied_at: timestamp
  }]
  
  // Full Timeline (including internal events)
  full_timeline: array
  
  // Admin Notes
  admin_notes: array
  
  // Flags
  flags: array
}
```

### Application Filters

| Filter | Options |
|--------|---------|
| **Agency** | Select agency |
| **Client** | Select client |
| **Job** | Select job |
| **Status** | All statuses |
| **Released** | Released, Not released |
| **Stage** | Pre-screen, Interview, Offer, Hired |
| **Date** | Applied date range |
| **Candidate** | Search by name/email |

### Application Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **View** | See full application | Support |
| **View Candidate** | Jump to candidate | Support |
| **View Job** | Jump to job | Support |
| **Override Status** | Force status change | Fix issues |
| **Add Note** | Internal admin note | Documentation |
| **Flag** | Flag for review | Quality control |

### Application Flow Monitoring

**Admin Can Monitor:**
```
Platform-Wide Funnel:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Applied      Screened     Released    Interviewed    Offered     Hired    │
│  ────────    ──────────   ──────────   ───────────   ─────────   ───────   │
│   10,000       6,500        4,200        2,100         800         450     │
│    100%         65%          42%          21%           8%         4.5%    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Interview Monitoring

### View All Interviews

**Admin Sees ALL Interviews Platform-Wide:**
```
interview_list {
  interviews: array [{
    id: uuid
    
    // Candidate
    candidate_name: string
    
    // Context
    job_title: string
    agency_name: string
    client_name: string
    
    // Type
    interview_type: string
    
    // Scheduling
    scheduled_at: timestamp
    duration_minutes: integer
    
    // Status
    status: "scheduled" | "completed" | "cancelled" | "no_show"
    outcome: string (if completed)
    
    // Recording
    has_recording: boolean
  }]
}
```

### Interview Filters

| Filter | Options |
|--------|---------|
| **Agency** | Select agency |
| **Client** | Select client |
| **Type** | Pre-screen, Round 1, Round 2, Final |
| **Status** | Scheduled, Completed, Cancelled, No-show |
| **Outcome** | Passed, Failed, Pending |
| **Date** | Scheduled date range |
| **Has Recording** | Yes, No |

### Interview Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **View** | See interview details | Monitoring |
| **View Recording** | Watch recording | Quality review |
| **View Transcript** | Read transcript | Quality review |
| **Flag** | Flag for review | Quality control |
| **Add Note** | Internal admin note | Documentation |

---

## Offer Tracking

### View All Offers

**Admin Sees ALL Offers Platform-Wide:**
```
offer_list {
  offers: array [{
    id: uuid
    
    // Candidate
    candidate_name: string
    
    // Context
    job_title: string
    agency_name: string
    client_name: string
    
    // Offer Details
    salary_offered: decimal
    currency: string
    start_date: date
    
    // Status
    status: "sent" | "viewed" | "accepted" | "declined" | "negotiating" | "expired"
    
    // Dates
    sent_at: timestamp
    responded_at: timestamp
    expires_at: timestamp
  }]
}
```

### Offer Filters

| Filter | Options |
|--------|---------|
| **Agency** | Select agency |
| **Client** | Select client |
| **Status** | Sent, Viewed, Accepted, Declined, Negotiating, Expired |
| **Salary Range** | Min-max range |
| **Date** | Sent date range |

### Offer Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| **View** | See offer details | Monitoring |
| **View Application** | Jump to application | Context |
| **Flag** | Flag for review | Quality control |
| **Add Note** | Internal admin note | Documentation |

### Offer Metrics

**Admin Monitors:**
```
Platform-Wide Offer Metrics:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Total Offers      Accepted       Declined      Negotiating     Expired    │
│  ─────────────    ──────────     ──────────    ───────────     ─────────   │
│      800            450            180            120             50        │
│      100%          56.3%          22.5%          15.0%           6.3%      │
│                                                                             │
│  Average Salary: ₱42,500                                                    │
│  Avg Time to Accept: 3.2 days                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Leaderboard & Performance

### Agency Leaderboard

**Admin Sees Agency Rankings:**
```
agency_leaderboard {
  period: "week" | "month" | "quarter" | "year" | "all_time"
  
  rankings: array [{
    rank: integer
    agency: {
      id: uuid
      name: string
      logo_url: string
    }
    
    metrics: {
      placements: integer
      applications_processed: integer
      time_to_hire_avg: decimal (days)
      offer_acceptance_rate: decimal (percentage)
      candidate_satisfaction: decimal (1-5)
      client_satisfaction: decimal (1-5)
    }
    
    change: integer (rank change from previous period)
  }]
}
```

### Recruiter Leaderboard

**Admin Sees Recruiter Rankings (Across All Agencies):**
```
recruiter_leaderboard {
  period: string
  
  rankings: array [{
    rank: integer
    recruiter: {
      id: uuid
      name: string
      avatar_url: string
      agency_name: string
    }
    
    metrics: {
      placements: integer
      applications_processed: integer
      prescreens_conducted: integer
      avg_prescreen_rating: decimal
      time_to_hire_avg: decimal
    }
    
    change: integer
  }]
}
```

### Leaderboard Filters

| Filter | Options |
|--------|---------|
| **Period** | This week, This month, This quarter, This year, All time |
| **Metric** | By placements, By applications, By time-to-hire |
| **Agency** | All agencies, Specific agency |
| **Tier** | Standard, Enterprise |

### Leaderboard Metrics

| Metric | Description |
|--------|-------------|
| **Placements** | Successful hires |
| **Applications Processed** | Total applications handled |
| **Time to Hire** | Average days from application to start |
| **Offer Acceptance Rate** | % of offers accepted |
| **Candidate Satisfaction** | Candidate ratings |
| **Client Satisfaction** | Client ratings |
| **Pre-screen Volume** | Number of pre-screens conducted |
| **Conversion Rate** | Application to hire conversion |

---

## Insights Manager

### Purpose

Generate and manage platform-wide insights, trends, and reports.

### Insight Types

| Type | Description |
|------|-------------|
| **Trend Alerts** | Significant changes in metrics |
| **Anomaly Detection** | Unusual patterns |
| **Performance Insights** | Agency/recruiter performance |
| **Market Insights** | Job market trends |
| **Quality Insights** | Platform quality metrics |

### Insight Data

```
insight {
  id: uuid
  type: string
  title: string
  description: text
  severity: "info" | "warning" | "critical"
  
  // Context
  related_entity: string (agency, job, candidate, etc.)
  related_id: uuid
  
  // Data
  metrics: object
  comparison: object (vs previous period)
  
  // Status
  status: "new" | "acknowledged" | "resolved"
  
  // Timestamps
  detected_at: timestamp
  acknowledged_at: timestamp
  acknowledged_by: uuid
}
```

### Example Insights

| Insight | Severity | Description |
|---------|----------|-------------|
| "Agency X placement rate dropped 40%" | Warning | Performance issue |
| "Candidate complaints up 25%" | Warning | Quality issue |
| "VA jobs up 50% this month" | Info | Market trend |
| "Avg time-to-hire improved 20%" | Info | Positive trend |
| "Agency Y inactive for 30 days" | Warning | Activity issue |

### Insight Actions

| Action | Description |
|--------|-------------|
| **View** | See insight details |
| **Acknowledge** | Mark as seen |
| **Investigate** | Drill into data |
| **Resolve** | Mark as resolved |
| **Create Report** | Generate report from insight |

---

## Analytics

### Platform-Wide Metrics

**Admin Dashboard Metrics:**
```
platform_metrics {
  // Overview
  total_agencies: integer
  total_recruiters: integer
  total_candidates: integer
  total_clients: integer
  
  // Jobs
  total_jobs: integer
  active_jobs: integer
  jobs_this_month: integer
  
  // Applications
  total_applications: integer
  applications_this_month: integer
  avg_applications_per_job: decimal
  
  // Interviews
  interviews_this_month: integer
  interview_completion_rate: decimal
  
  // Offers
  offers_this_month: integer
  offer_acceptance_rate: decimal
  
  // Placements
  total_placements: integer
  placements_this_month: integer
  avg_time_to_hire: decimal
  
  // Trends
  growth_rate: decimal (month over month)
}
```

### Analytics Views

| View | Description |
|------|-------------|
| **Overview** | High-level platform metrics |
| **Agencies** | Agency performance comparison |
| **Jobs** | Job market analysis |
| **Applications** | Application flow analysis |
| **Conversions** | Funnel conversion rates |
| **Time Analysis** | Time-to-hire, time-in-stage |
| **Geographic** | Location-based analysis |
| **Salary** | Salary trends and analysis |

### Analytics Filters

| Filter | Options |
|--------|---------|
| **Date Range** | Custom date selection |
| **Agency** | All or specific |
| **Job Type** | Work type, arrangement |
| **Location** | City, province, country |
| **Comparison** | vs previous period |

### Reports

**Admin Can Generate:**
- Platform health report
- Agency performance report
- Monthly summary report
- Candidate activity report
- Job market report
- Custom reports

---

## Support & Intervention

### When Admin Intervenes

| Situation | Admin Action |
|-----------|--------------|
| **Candidate complaint** | Review application, contact agency |
| **Agency dispute** | Review data, mediate |
| **Stuck application** | Override status if needed |
| **Duplicate accounts** | Merge accounts |
| **Policy violation** | Suspend user/agency |
| **Data issue** | Manual correction |
| **Technical problem** | Escalate to engineering |

### Intervention Actions

| Action | Description | Severity |
|--------|-------------|----------|
| **Add Note** | Document issue | Low |
| **Contact Agency** | Reach out to agency | Medium |
| **Contact Candidate** | Reach out to candidate | Medium |
| **Override Status** | Force status change | Medium |
| **Suspend User** | Temporarily disable account | High |
| **Suspend Agency** | Temporarily disable agency | High |
| **Delete Account** | Permanently remove (GDPR) | Critical |

### Intervention Flow

```
Issue Reported/Detected
         │
         ▼
   ┌───────────┐
   │  Review   │
   │   Data    │
   └─────┬─────┘
         │
         ▼
   ┌───────────┐
   │ Document  │
   │  (Note)   │
   └─────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Resolve│ │Escalate│
│ Self  │ │       │
└───────┘ └───┬───┘
              │
         ┌────┴────┐
         │         │
         ▼         ▼
    ┌───────┐ ┌───────┐
    │Contact│ │Override│
    │ User  │ │/Suspend│
    └───────┘ └───────┘
```

### Audit Trail

**All Admin Actions Logged:**
```
admin_audit_log {
  id: uuid
  admin_id: uuid
  admin_name: string
  
  action: string
  entity_type: string
  entity_id: uuid
  
  details: jsonb
  reason: text
  
  created_at: timestamp
}
```

---

## Admin vs Other Roles

### Permission Comparison

| Action | Candidate | Client | Recruiter | Admin |
|--------|:---------:|:------:|:---------:|:-----:|
| See own data | ✅ | ✅ | ✅ | ✅ |
| See agency data | ❌ | Own client | Own agency | ALL |
| See all agencies | ❌ | ❌ | ❌ | ✅ |
| See all candidates | ❌ | Released | All in agency | ALL |
| See all applications | Own | Released | All in agency | ALL |
| Conduct pre-screens | ❌ | ❌ | ✅ | View only |
| Release to client | ❌ | ❌ | ✅ | Override |
| Send offers | ❌ | ✅ | ✅ | View only |
| Suspend users | ❌ | ❌ | ❌ | ✅ |
| Override statuses | ❌ | ❌ | ❌ | ✅ |
| View analytics | ❌ | Limited | Agency | ALL |
| Manage agencies | ❌ | ❌ | ❌ | ✅ |

### What Admin Does NOT Typically Do

| Action | Why |
|--------|-----|
| Conduct pre-screens | Agency responsibility |
| Release applications | Agency decision |
| Schedule interviews | Agency/client responsibility |
| Send offers | Agency/client responsibility |
| Manage onboarding | Agency responsibility |

**Admin is oversight, not operations.**

---

## Notification System

### Admin Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| `new_agency_signup` | Agency registers | 🟢 Normal |
| `agency_suspended` | Agency auto-suspended | 🟠 High |
| `candidate_complaint` | Candidate reports issue | 🟠 High |
| `performance_alert` | Metrics threshold breached | 🟠 High |
| `anomaly_detected` | Unusual pattern found | 🟠 High |
| `policy_violation` | Potential violation detected | 🔴 Critical |
| `system_alert` | Platform issue | 🔴 Critical |
| `milestone_reached` | Platform milestone | 🟢 Normal |

### Notification Data

```
admin_notification {
  id: uuid
  type: string
  title: string
  message: string
  severity: "info" | "warning" | "critical"
  
  related_entity: string
  related_id: uuid
  action_url: string
  
  is_read: boolean
  created_at: timestamp
}
```

---

## Data Admin Sees

### Full Platform Access

| Data | Access Level |
|------|--------------|
| **All Agencies** | Full details + internal metrics |
| **All Recruiters** | Full details + performance |
| **All Candidates** | Full profiles + all applications |
| **All Clients** | Full details |
| **All Jobs** | Full details + metrics |
| **All Applications** | Full details + cross-agency view |
| **All Interviews** | Full details + recordings |
| **All Offers** | Full details |
| **All Placements** | Full details |
| **Platform Analytics** | All metrics |
| **Audit Logs** | All admin actions |

### Admin-Only Data

| Data | Description |
|------|-------------|
| **Cross-agency candidate applications** | See where else candidate applied |
| **Internal notes** | Admin-only notes on any entity |
| **Audit logs** | All admin actions |
| **Platform metrics** | Aggregate platform data |
| **Flags/issues** | Reported problems |

---

## Actions Admin Can Take

### Complete Action List

| Category | Actions |
|----------|---------|
| **Agencies** | View, Suspend, Reactivate, Change Tier, Add Note |
| **Candidates** | View, Suspend, Reactivate, Delete, Merge, Add Note, Reset Password |
| **Jobs** | View, Pause, Close, Flag, Add Note |
| **Applications** | View, Override Status, Flag, Add Note |
| **Interviews** | View, View Recording, Flag, Add Note |
| **Offers** | View, Flag, Add Note |
| **Insights** | View, Acknowledge, Resolve, Create Report |
| **Analytics** | View all, Generate reports, Export data |
| **Leaderboard** | View, Filter, Export |
| **Audit** | View all admin actions |

---

## Database Requirements

### Tables Admin Interacts With

| Table | Access |
|-------|--------|
| `agencies` | Full Read + Limited Write |
| `agency_recruiters` | Full Read + Limited Write |
| `agency_clients` | Full Read |
| `candidates` | Full Read + Limited Write |
| `candidate_profiles` | Full Read |
| `jobs` | Full Read + Limited Write |
| `job_applications` | Full Read + Limited Write |
| `job_interviews` | Full Read |
| `job_offers` | Full Read |
| `video_call_rooms` | Full Read |
| `video_call_recordings` | Full Read |
| `video_call_transcripts` | Full Read |
| `placements` | Full Read |
| `admin_notes` | Full CRUD |
| `admin_audit_log` | Read + Create |
| `platform_insights` | Full CRUD |
| `platform_analytics` | Read |

---

## API Endpoints Required

### Admin-Facing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| **Dashboard** | | |
| `/admin/dashboard` | GET | Platform overview |
| `/admin/dashboard/metrics` | GET | Key metrics |
| **Agencies** | | |
| `/admin/agencies` | GET | List all agencies |
| `/admin/agencies/:id` | GET | Get agency detail |
| `/admin/agencies/:id/suspend` | POST | Suspend agency |
| `/admin/agencies/:id/reactivate` | POST | Reactivate agency |
| `/admin/agencies/:id/tier` | PATCH | Change tier |
| `/admin/agencies/:id/notes` | POST | Add note |
| **Candidates** | | |
| `/admin/candidates` | GET | List all candidates |
| `/admin/candidates/:id` | GET | Get candidate detail |
| `/admin/candidates/:id/suspend` | POST | Suspend candidate |
| `/admin/candidates/:id/reactivate` | POST | Reactivate |
| `/admin/candidates/:id/delete` | DELETE | Delete candidate |
| `/admin/candidates/:id/notes` | POST | Add note |
| **Jobs** | | |
| `/admin/jobs` | GET | List all jobs |
| `/admin/jobs/:id` | GET | Get job detail |
| `/admin/jobs/:id/pause` | POST | Pause job |
| `/admin/jobs/:id/close` | POST | Close job |
| `/admin/jobs/:id/notes` | POST | Add note |
| **Applications** | | |
| `/admin/applications` | GET | List all applications |
| `/admin/applications/:id` | GET | Get application detail |
| `/admin/applications/:id/override` | POST | Override status |
| `/admin/applications/:id/notes` | POST | Add note |
| **Interviews** | | |
| `/admin/interviews` | GET | List all interviews |
| `/admin/interviews/:id` | GET | Get interview detail |
| **Offers** | | |
| `/admin/offers` | GET | List all offers |
| `/admin/offers/:id` | GET | Get offer detail |
| **Leaderboard** | | |
| `/admin/leaderboard/agencies` | GET | Agency rankings |
| `/admin/leaderboard/recruiters` | GET | Recruiter rankings |
| **Insights** | | |
| `/admin/insights` | GET | List insights |
| `/admin/insights/:id` | GET | Get insight detail |
| `/admin/insights/:id/acknowledge` | POST | Acknowledge |
| `/admin/insights/:id/resolve` | POST | Resolve |
| **Analytics** | | |
| `/admin/analytics/overview` | GET | Platform overview |
| `/admin/analytics/agencies` | GET | Agency analytics |
| `/admin/analytics/jobs` | GET | Job analytics |
| `/admin/analytics/applications` | GET | Application analytics |
| `/admin/analytics/conversions` | GET | Funnel analytics |
| `/admin/analytics/export` | POST | Export report |
| **Audit** | | |
| `/admin/audit-log` | GET | View audit log |

---

## Summary

### Admin Can DO:

1. ✅ View ALL agencies and their data
2. ✅ View ALL candidates platform-wide
3. ✅ View ALL jobs platform-wide
4. ✅ View ALL applications platform-wide
5. ✅ View ALL interviews and recordings
6. ✅ View ALL offers
7. ✅ Suspend/reactivate agencies
8. ✅ Suspend/reactivate candidates
9. ✅ Override application statuses (rare)
10. ✅ Add internal notes to any entity
11. ✅ View leaderboards and rankings
12. ✅ Monitor platform insights
13. ✅ Access full analytics
14. ✅ Generate reports
15. ✅ View audit logs

### Admin Can SEE:

1. ✅ All platform data (all agencies, all users)
2. ✅ Cross-agency candidate applications
3. ✅ Internal performance metrics
4. ✅ Platform-wide analytics
5. ✅ Audit logs of all admin actions
6. ✅ Insights and anomalies
7. ✅ All recordings and transcripts

### Admin Does NOT Typically Do:

1. ❌ Conduct pre-screens (agency does this)
2. ❌ Release applications (agency does this)
3. ❌ Schedule interviews (agency/client does this)
4. ❌ Send offers (agency/client does this)
5. ❌ Manage onboarding (agency does this)
6. ❌ Day-to-day recruitment operations

**Admin = Oversight + Support, NOT Operations**

---

*End of BPOC Admin Recruitment Flow Requirements*
