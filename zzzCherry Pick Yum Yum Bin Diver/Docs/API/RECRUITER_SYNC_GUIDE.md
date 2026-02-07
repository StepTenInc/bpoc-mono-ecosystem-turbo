# Recruiter ID Synchronization Guide

## Overview

This guide explains how to synchronize recruiter actions between your external agency portal and the BPOC platform for Enterprise tier agencies.

## Architecture

```
Your Agency Portal          BPOC Platform
─────────────────          ─────────────
External Users      ←→     agency_recruiters
  ↓                            ↓
recruiter_id        =      agency_recruiters.id (UUID)
  ↓                            ↓
Actions via API     →      Stored with recruiter attribution
```

## Setup Process

### 1. Store BPOC Recruiter IDs

When your recruiters sign up or are invited to BPOC, store their `agency_recruiters.id` in your database:

```sql
-- Your database schema
CREATE TABLE external_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  bpoc_recruiter_id UUID,  -- ← Store BPOC ID here
  ...
);
```

### 2. Map External Users to BPOC Recruiters

When a recruiter performs an action in your portal, include their BPOC ID in API calls:

```javascript
// Your API call to BPOC
const response = await fetch('https://bpoc.io/api/v1/jobs/create', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'client-uuid',
    title: 'Senior Developer',
    description: '...',
    postedBy: user.bpoc_recruiter_id  // ← Include BPOC recruiter ID
  })
});
```

## Recruiter ID Format

- **Type:** UUID (Universally Unique Identifier)
- **Example:** `f47ac10b-58cc-4372-a567-0e02b2c3d479`
- **Source:** `agency_recruiters.id` in BPOC database

## API Endpoints that Accept Recruiter ID

### Job Management

```javascript
// Create job
POST /api/v1/jobs/create
{
  ...
  postedBy: "recruiter-uuid"  // Your recruiter's BPOC ID
}

// Approve job
POST /api/v1/jobs/{id}/approve
{
  approvedBy: "recruiter-uuid"  // Admin/manager BPOC ID
}
```

### Application Management

```javascript
// Release application to client
POST /api/v1/applications/{id}/release
{
  notes: "Excellent candidate",
  releasedBy: "recruiter-uuid"  // Optional: track who released
}

// Reject application
POST /api/v1/applications/{id}/reject
{
  reason: "Skills mismatch",
  rejectedBy: "recruiter-uuid"
}
```

### Interview Scheduling

```javascript
// Schedule interview
POST /api/v1/interviews
{
  applicationId: "app-uuid",
  interviewType: "client_round_1",
  scheduledAt: "2024-02-01T10:00:00Z",
  interviewerId: "recruiter-uuid",  // Who is conducting the interview
  scheduledBy: "recruiter-uuid"      // Who scheduled it
}
```

### Onboarding

```javascript
// Create onboarding tasks
POST /api/v1/onboarding
{
  applicationId: "app-uuid",
  tasks: [...],
  createdBy: "recruiter-uuid"
}

// Approve task
PUT /api/v1/onboarding/{taskId}
{
  action: "approve",
  reviewedBy: "recruiter-uuid"
}
```

## Activity Attribution

All actions performed via API are attributed to the recruiter ID you provide:

```sql
-- Example database records
jobs
  posted_by = recruiter_id
  
job_applications
  reviewed_by = recruiter_id
  released_by = recruiter_id
  
job_interviews
  interviewer_id = recruiter_id
  
job_offers
  created_by = recruiter_id
  
onboarding_tasks
  reviewed_by = recruiter_id
```

## Audit Trail

Every action creates an entry in the activity timeline:

```javascript
// Example activity log
{
  action_type: "application_released",
  performed_by_type: "recruiter",
  performed_by_id: "recruiter-uuid",
  description: "Released candidate to client",
  timestamp: "2024-01-20T10:30:00Z",
  metadata: {
    application_id: "...",
    notes: "..."
  }
}
```

## Getting Recruiter IDs

### Option 1: After Signup

When a recruiter signs up via your portal's custom flow:

```javascript
// 1. Create recruiter in BPOC
const signupResponse = await fetch('https://bpoc.io/api/v1/recruiters/create', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'recruiter@agency.com',
    firstName: 'John',
    lastName: 'Recruiter',
    role: 'recruiter'  // or 'admin', 'manager'
  })
});

const { recruiterId } = await signupResponse.json();

// 2. Store in your database
await db.users.update({
  where: { email: 'recruiter@agency.com' },
  data: { bpoc_recruiter_id: recruiterId }
});
```

### Option 2: List Existing Recruiters

If you already have recruiters in BPOC, fetch their IDs:

```javascript
const response = await fetch('https://bpoc.io/api/v1/agency/recruiters', {
  headers: {
    'X-API-Key': 'your_api_key'
  }
});

const { recruiters } = await response.json();

// Map by email
for (const recruiter of recruiters) {
  await db.users.update({
    where: { email: recruiter.email },
    data: { bpoc_recruiter_id: recruiter.id }
  });
}
```

### Option 3: Team Invitations

Use BPOC's invitation system:

```javascript
// 1. Send invitation
const inviteResponse = await fetch('https://bpoc.io/api/v1/team/invite', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newrecruiter@agency.com',
    name: 'Jane Recruiter',
    role: 'recruiter'
  })
});

const { inviteToken } = await inviteResponse.json();

// 2. Send custom email with your portal URL
// Include the invite token to auto-associate on signup
```

## Validation

Always validate that the recruiter ID belongs to your agency:

```javascript
// BPOC automatically validates this on every API call
// If recruiter doesn't belong to your agency, you'll get a 403 error
{
  error: "Recruiter does not belong to your agency",
  status: 403
}
```

## Best Practices

### 1. Cache Recruiter IDs

Don't query BPOC for recruiter IDs on every request:

```javascript
// Bad ❌
for (const job of jobs) {
  const recruiter = await fetchRecruiterFromBPOC(job.postedBy);
  // ...
}

// Good ✅
const recruiterIds = await db.users.findMany({
  select: { id: true, bpoc_recruiter_id: true }
});
const recruiterMap = new Map(recruiterIds.map(r => [r.id, r.bpoc_recruiter_id]));
```

### 2. Handle Missing IDs Gracefully

```javascript
function getBPOCRecruiterId(userId) {
  const user = db.users.findOne({ id: userId });
  
  if (!user.bpoc_recruiter_id) {
    // Sync recruiter to BPOC
    const bpocId = await syncRecruiterToBPOC(user);
    user.bpoc_recruiter_id = bpocId;
    await user.save();
  }
  
  return user.bpoc_recruiter_id;
}
```

### 3. Sync in Background

Use a background job to keep IDs in sync:

```javascript
// Cron job: Every day at 3 AM
async function syncRecruiters() {
  const bpocRecruiters = await fetch('https://bpoc.io/api/v1/agency/recruiters', {
    headers: { 'X-API-Key': process.env.BPOC_API_KEY }
  }).then(r => r.json());
  
  for (const recruiter of bpocRecruiters.recruiters) {
    await db.users.upsert({
      where: { email: recruiter.email },
      update: { bpoc_recruiter_id: recruiter.id },
      create: {
        email: recruiter.email,
        bpoc_recruiter_id: recruiter.id,
        // ... other fields
      }
    });
  }
}
```

### 4. Error Handling

```javascript
try {
  const response = await fetch('https://bpoc.io/api/v1/jobs/create', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...jobData,
      postedBy: recruiterId
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (error.message?.includes('Invalid recruiter')) {
      // Re-sync recruiter
      const newId = await syncRecruiterToBPOC(user);
      // Retry with new ID
    }
  }
} catch (error) {
  console.error('BPOC API Error:', error);
}
```

## Troubleshooting

### "Invalid recruiter ID" Error

**Cause:** The UUID doesn't exist in BPOC or doesn't belong to your agency.

**Solution:**
1. Verify the recruiter exists: `GET /api/v1/agency/recruiters`
2. Check if they're active: `is_active = true`
3. Re-sync if needed

### "Recruiter does not belong to your agency" Error

**Cause:** The recruiter ID is valid but belongs to a different agency.

**Solution:**
1. Check your database mapping
2. Ensure you're not accidentally using IDs from another agency's data
3. Use your agency's API key (each agency has unique key)

### Missing Attribution in BPOC

**Cause:** API calls don't include `postedBy`, `createdBy`, or similar fields.

**Solution:**
1. Always include recruiter ID in API calls
2. Check API documentation for required fields
3. Use optional fields like `metadata` to include additional context

## Example: Complete Integration

```javascript
class BPOCClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://bpoc.io/api/v1';
  }
  
  async createJob(jobData, localUserId) {
    // 1. Get BPOC recruiter ID from local user
    const recruiter = await db.users.findOne({ 
      id: localUserId 
    });
    
    if (!recruiter.bpoc_recruiter_id) {
      throw new Error('Recruiter not synced to BPOC');
    }
    
    // 2. Create job with attribution
    const response = await fetch(`${this.baseUrl}/jobs/create`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...jobData,
        postedBy: recruiter.bpoc_recruiter_id  // ← Attribution
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return response.json();
  }
}

// Usage
const bpoc = new BPOCClient(process.env.BPOC_API_KEY);

try {
  const job = await bpoc.createJob({
    clientId: 'client-uuid',
    title: 'Senior React Developer',
    description: '...',
    requirements: [...],
    salary_min: 80000,
    salary_max: 120000
  }, req.user.id);  // Local user ID
  
  console.log('Job created:', job);
} catch (error) {
  console.error('Failed to create job:', error);
}
```

## Support

If you encounter issues with recruiter ID synchronization:

1. Check the [API Reference](/docs/api/reference)
2. Verify your API key has correct permissions
3. Contact BPOC support with:
   - Your agency ID
   - The recruiter's email
   - Error messages received
   - API endpoint and request body

---

**Last Updated:** January 15, 2026  
**Version:** 1.0
