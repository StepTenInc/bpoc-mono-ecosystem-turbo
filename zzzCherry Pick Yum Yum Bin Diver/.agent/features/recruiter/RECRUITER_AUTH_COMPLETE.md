# 🔐 RECRUITER AUTHORIZATION SYSTEM - IMPLEMENTATION

**Scenario:** Lady signs up → Chooses to not be authorized → Invites Cath → Cath becomes HEAD_OF_RECRUITMENT → Both can work

---

## 🎯 WHAT WE'RE BUILDING

```
STEP 1: Lady Signs Up
  └─ Question: "Are you authorized to make recruitment decisions?"
     ├─ If YES → She's HEAD_OF_RECRUITMENT, complete docs, admin verifies
     └─ If NO → Go to Step 2

STEP 2: Lady Provides Authorized Person
  └─ Input: "Who should we contact?"
  └─ First Name, Last Name, Email
  └─ System sends email invite to that person

STEP 3: Cath Receives Email
  └─ Click link → Signup form pre-filled
  └─ First name: (optional pre-fill)
  └─ Email: (locked, from invite)
  └─ Company: (locked, from Lady's signup)
  └─ Role: HEAD_OF_RECRUITMENT (locked, read-only)
  └─ Create password

STEP 4: Cath Completes Profile
  └─ Upload company docs (TIN, DTI, business permit)
  └─ Status: PENDING_ADMIN_VERIFICATION

STEP 5: Admin Dashboard Shows
  └─ Cath's profile - APPROVE/REJECT button
  └─ Lady's profile - auto-approved once Cath approved

STEP 6: Both Active
  └─ Cath: Full recruiter access (post jobs, manage, hire)
  └─ Lady: Limited access (post jobs only if Cath approves)
```

---

## 🗄️ DATABASE SCHEMA

### NEW COLUMNS for `agency_recruiters` table:

```sql
-- Add these columns to existing agency_recruiters table

authorization_level VARCHAR(50) DEFAULT 'recruiter'
-- Options: 
--   'head_of_recruitment' = Can do everything, authorize others
--   'senior_recruiter'    = Can post jobs, manage, but not authorize
--   'recruiter'           = Can post jobs (if approved), manage assigned
--   'junior_recruiter'    = Limited access

is_authorization_head BOOLEAN DEFAULT FALSE
-- TRUE = This person is the official authorization head for their agency
-- They can approve/reject other recruiters

invited_by_recruiter_id UUID REFERENCES agency_recruiters(id)
-- If not NULL, this person was invited by another recruiter
-- Tracks the chain: Lady → invites Cath

invitation_token VARCHAR(255) UNIQUE
-- Secure token from invite email link
-- Used to verify they came from correct invitation

invitation_accepted_at TIMESTAMPTZ
-- When they clicked the invite link and created account

profile_completion_percentage INT DEFAULT 0
-- Track: 0-25% (basic), 25-50% (profile), 50-75% (docs), 75-100% (complete)

docs_uploaded BOOLEAN DEFAULT FALSE
-- Company docs (TIN, DTI, business permit) uploaded

docs_verified_by_admin_id UUID REFERENCES bpoc_users(id)
-- Which admin verified their docs

verification_status VARCHAR(50) DEFAULT 'pending_docs'
-- Options:
--   'pending_docs'              = Waiting for docs upload
--   'pending_admin_verification' = Docs uploaded, admin reviewing
--   'verified'                  = Admin approved, account active
--   'rejected'                  = Admin rejected
```

### NEW TABLE: `recruiter_invitations`

```sql
CREATE TABLE recruiter_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who's being invited
  invited_email VARCHAR(255) NOT NULL,
  invited_first_name VARCHAR(100),
  invited_last_name VARCHAR(100),
  
  -- Which agency/recruiter
  agency_id UUID NOT NULL REFERENCES agencies(id),
  inviter_recruiter_id UUID REFERENCES agency_recruiters(id),
  
  -- Invitation token
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  invitation_url VARCHAR(500),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending'
  -- 'pending', 'accepted', 'declined', 'expired'
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  -- Link to created account
  created_recruiter_id UUID REFERENCES agency_recruiters(id)
);

CREATE INDEX idx_recruiter_invitations_token ON recruiter_invitations(invitation_token);
CREATE INDEX idx_recruiter_invitations_email ON recruiter_invitations(invited_email);
CREATE INDEX idx_recruiter_invitations_agency ON recruiter_invitations(agency_id);
```

---

## 🛣️ FLOW WITH DATABASE LOGIC

### Phase 1: Lady Signs Up (No Invite Yet)

**User sees:**
```
[Recruiter Signup]
Email: lady@sureagents.com
Company: Sure Agents (auto-filled from OA database)

☐ Are you authorized to make recruitment decisions for your company?

⚫ YES - I am the recruitment head
○ NO - Someone else is the head
```

**If Lady clicks NO:**

**Database:**
```sql
-- Create basic recruiter record (NOT YET ACTIVE)
INSERT INTO agency_recruiters (
  user_id, 
  agency_id, 
  email,
  authorization_level = 'recruiter',
  is_authorization_head = FALSE,
  verification_status = 'pending_authorization_head'
  -- Cannot do anything until head is activated
)
VALUES (lady_user_id, sure_agents_id, 'lady@sureagents.com', ...)
```

**UI shows:**
```
[Continue to Authorization]

"Who is the authorized head of recruitment for Sure Agents?"

First Name: [________]
Last Name:  [________]
Email:      [________]

[SEND INVITATION]
```

---

### Phase 2: Lady Sends Invite to Cath

**User enters:**
```
First Name: Cath
Last Name: Smith
Email: cath@sureagents.com

[SEND INVITATION]
```

**Database:**
```sql
-- Create invitation record
INSERT INTO recruiter_invitations (
  invited_email = 'cath@sureagents.com',
  invited_first_name = 'Cath',
  invited_last_name = 'Smith',
  agency_id = sure_agents_id,
  inviter_recruiter_id = lady_id,
  invitation_token = generate_token(),
  status = 'pending'
)

-- Update Lady's status
UPDATE agency_recruiters 
SET verification_status = 'pending_authorization_head_acceptance'
WHERE id = lady_id
-- She can't do anything until Cath accepts
```

**Email sent to Cath:**
```
From: BPOC <noreply@bpoc.com>
Subject: Complete Your Sure Agents Recruitment Setup

Hi Cath,

Lady from Sure Agents has invited you to be the recruitment head on BPOC.

Click here to complete your setup:
https://bpoc.com/recruit/invite/abc123xyz789...

This link expires in 7 days.

---
BPOC Team
```

---

### Phase 3: Cath Clicks Invite Link

**URL:** `https://bpoc.com/recruit/invite/abc123xyz789...`

**System validates:**
```sql
SELECT * FROM recruiter_invitations 
WHERE invitation_token = 'abc123xyz789...'
  AND status = 'pending'
  AND expires_at > NOW()
-- If found → Show signup form
-- If expired/invalid → Show "Link expired" message
```

**Cath sees signup form:**
```
[Complete Your Profile - Sure Agents]

First Name: Cath (editable)
Last Name: Smith (locked, from invite)
Email: cath@sureagents.com (locked, from invite)

Company: Sure Agents (locked, from invite)
Role: Head of Recruitment (locked, read-only)

Password: [________]
Confirm: [________]

☑ I confirm I am the authorized head of recruitment for Sure Agents

[CREATE ACCOUNT]
```

---

### Phase 4: Cath Creates Account

**Database:**
```sql
-- Create Cath's recruiter record WITH authorization
INSERT INTO agency_recruiters (
  user_id = cath_user_id,
  agency_id = sure_agents_id,
  email = 'cath@sureagents.com',
  authorization_level = 'head_of_recruitment',
  is_authorization_head = TRUE,
  invited_by_recruiter_id = NULL, -- She's the top
  invitation_token = 'abc123xyz789...',
  invitation_accepted_at = NOW(),
  verification_status = 'pending_docs',
  created_at = NOW()
)

-- Mark invitation as accepted
UPDATE recruiter_invitations
SET status = 'accepted',
    accepted_at = NOW(),
    created_recruiter_id = cath_id
WHERE invitation_token = 'abc123xyz789...'

-- Update Lady's record to know who her head is
UPDATE agency_recruiters
SET invited_by_recruiter_id = cath_id,
    verification_status = 'pending_authorization_head_verification'
WHERE id = lady_id
-- Now she CAN see her dashboard, but CAN'T post jobs yet
```

**Cath sees:**
```
[Complete Your Profile]

Status: 3 of 3 Steps

Step 1: Basic Info ✓
Step 2: Create Account ✓
Step 3: Upload Company Documents

Required:
☐ TIN Certificate (upload)
☐ DTI Registration (upload)
☐ Business Permit (upload)

[UPLOAD FILES]
```

---

### Phase 5: Cath Uploads Docs & Submits

**Database:**
```sql
UPDATE agency_recruiters
SET docs_uploaded = TRUE,
    profile_completion_percentage = 100,
    verification_status = 'pending_admin_verification'
WHERE id = cath_id
-- Now admin can see her in the verification queue
```

**Email to Cath:**
```
Your profile is complete!

We're reviewing your documents.
You'll hear from us within 24 hours.

In the meantime, you can start setting up your team.

---
BPOC Team
```

---

### Phase 6: Admin Sees Verification Queue

**Admin Dashboard:**
```
[Recruiter Verifications - Pending]

Sure Agents Team
├─ Cath Smith (Head of Recruitment)
│  ├─ Status: PENDING_ADMIN_VERIFICATION
│  ├─ Documents:
│  │  ✓ TIN Certificate
│  │  ✓ DTI Registration
│  │  ✓ Business Permit
│  ├─ Verified by: (none)
│  ├─ [APPROVE] [REJECT] [REQUEST_MORE_INFO]
│
└─ Lady (Recruiter)
   ├─ Status: PENDING_AUTHORIZATION_HEAD_VERIFICATION
   ├─ Note: Waiting for Cath's approval
   ├─ Will auto-approve once Cath is approved
   └─ [View Details]

[APPROVE CATH] → Button that approves Cath + Lady both
```

---

### Phase 7: Admin Approves Cath

**Admin clicks: [APPROVE]**

**Database:**
```sql
-- Approve Cath
UPDATE agency_recruiters
SET verification_status = 'verified',
    docs_verified_by_admin_id = admin_id,
    is_active = TRUE
WHERE id = cath_id

-- Auto-approve Lady
UPDATE agency_recruiters
SET verification_status = 'verified',
    docs_verified_by_admin_id = admin_id,
    is_active = TRUE
WHERE id = lady_id
  AND invited_by_recruiter_id = cath_id
  AND authorization_level = 'recruiter'

-- Send emails
SEND EMAIL to cath@sureagents.com: "You're approved!"
SEND EMAIL to lady@sureagents.com: "You're approved!"
```

---

### Phase 8: Both Accounts Active ✅

**Cath can:**
```sql
SELECT * FROM jobs 
WHERE agency_id = sure_agents_id
-- Can create, edit, post jobs

SELECT * FROM job_applications
WHERE job_id IN (sure_agents jobs)
-- Can manage all applications

SELECT * FROM agency_recruiters
WHERE agency_id = sure_agents_id
  AND is_authorization_head = TRUE
-- Can see and manage her team
```

**Lady can:**
```sql
SELECT * FROM jobs
WHERE recruiter_id = lady_id
-- Can create jobs assigned to her

SELECT * FROM job_applications
WHERE job_id IN (lady's jobs)
-- Can manage only her applications

-- CANNOT:
-- - Invite new team members
-- - Approve other recruiters
-- - Delete jobs
-- - Change agency settings
```

---

## 🔑 PERMISSION MATRIX

| Action | HEAD_OF_RECRUITMENT | RECRUITER | JUNIOR_RECRUITER |
|--------|-------------------|-----------|-----------------|
| Post Jobs | ✅ | ✅ | ❌ |
| Manage Applications | ✅ (all) | ✅ (own) | ❌ |
| Approve Other Jobs | ✅ | ❌ | ❌ |
| Invite Team Members | ✅ | ❌ | ❌ |
| Delete Jobs | ✅ | ❌ | ❌ |
| Change Settings | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ❌ |
| Access Dashboard | ✅ | ✅ | Limited |

---

## 🛡️ KEY VALIDATION RULES

### Rule 1: Can't Post Jobs Until Verified
```sql
-- When Lady tries to create job:
SELECT verification_status FROM agency_recruiters
WHERE id = lady_id

IF verification_status != 'verified' THEN
  ERROR: "You must complete your profile before posting jobs"
ELSE
  ALLOW job creation
END
```

### Rule 2: Head Can't Delete Agency
```sql
-- Cath is deleted by mistake
-- System prevents deletion if:
DELETE FROM agency_recruiters
WHERE id = cath_id
  AND is_authorization_head = TRUE
  
IF (other_recruiters exist) THEN
  ERROR: "Cannot delete authorization head while team exists"
  FIX: "Appoint new head or remove team members first"
ELSE
  ALLOW deletion
END
```

### Rule 3: Lady Can't Do Anything Until Cath Approved
```sql
-- Lady tries to view her dashboard
SELECT * FROM agency_recruiters
WHERE id = lady_id
AND verification_status NOT IN ('verified', 'pending_admin_verification')

IF verification_status = 'pending_authorization_head_acceptance' THEN
  SHOW: "Your recruiter head hasn't accepted yet. Check back soon."
ELSE IF verification_status = 'pending_authorization_head_verification' THEN
  SHOW: "Your recruiter head is being verified. Check back within 24 hours."
END
```

---

## 📧 EMAIL SEQUENCE

### Email 1: To Cath (Invitation)
```
Subject: You're invited to be Head of Recruitment at Sure Agents on BPOC

Hi Cath,

Lady from Sure Agents has invited you to manage recruitment for their team on BPOC.

Complete your setup: https://bpoc.com/recruit/invite/abc123...

Link expires in 7 days.

Questions? support@bpoc.com
```

### Email 2: To Lady (Confirmation of Invite Sent)
```
Subject: Invitation sent to Cath Smith

Hi Lady,

We've sent an invitation to cath@sureagents.com

Once Cath accepts and completes her profile, you'll both be able to post jobs.

Status: WAITING FOR AUTHORIZATION HEAD

Questions? support@bpoc.com
```

### Email 3: To Cath (Docs Received)
```
Subject: We received your documents

Hi Cath,

Thanks for uploading your company documents. We're reviewing them now.

You'll hear from us within 24 hours.

In the meantime, check out these resources:
- Posting your first job
- Managing applications
- Adding team members

---
BPOC Team
```

### Email 4: To Cath (Approved)
```
Subject: ✓ Your account has been verified!

Hi Cath,

Great news! Your BPOC account for Sure Agents has been verified.

You're ready to:
✓ Post job openings
✓ Manage your team
✓ Start hiring

Log in: https://bpoc.com/recruiter

Welcome to BPOC!

---
BPOC Team
```

### Email 5: To Lady (Approved)
```
Subject: ✓ Your account is ready to use!

Hi Lady,

Your BPOC account is now verified and active.

You can now:
✓ Post job openings
✓ Manage applications
✓ Collaborate with your team

Log in: https://bpoc.com/recruiter

Let's start hiring!

---
BPOC Team
```

---

## 🔄 STATE DIAGRAM

```
Lady Signup
    ↓
    ├─ "Are you authorized?"
    │   ├─ YES → authorization_level = 'head_of_recruitment'
    │   │         is_authorization_head = TRUE
    │   │         verification_status = 'pending_docs'
    │   │         → Go to: Upload Docs
    │   │
    │   └─ NO → authorization_level = 'recruiter'
    │           is_authorization_head = FALSE
    │           verification_status = 'pending_authorization_head_acceptance'
    │           → Go to: Invite Head
    │
    ├─ Invite Head
    │   ├─ Enter: Cath's name, email
    │   ├─ Create: recruiter_invitations record
    │   └─ Send: Email to Cath
    │
    ├─ Cath Clicks Link
    │   ├─ Validate: invitation_token
    │   ├─ Create: agency_recruiters for Cath
    │   ├─ Set: is_authorization_head = TRUE
    │   ├─ Set: authorization_level = 'head_of_recruitment'
    │   └─ Go to: Upload Docs
    │
    ├─ Upload Docs
    │   ├─ Set: docs_uploaded = TRUE
    │   ├─ Set: verification_status = 'pending_admin_verification'
    │   └─ Notify: Admin
    │
    ├─ Admin Reviews
    │   ├─ Check: Cath's docs + Lady's info
    │   ├─ Set: docs_verified_by_admin_id = admin_id
    │   └─ Set: verification_status = 'verified'
    │
    └─ ACTIVE ✅
        ├─ Cath: Full recruiter access
        └─ Lady: Can post jobs, manage applications
```

---

## ✅ IMPLEMENTATION CHECKLIST

**Database:**
- [ ] Add columns to `agency_recruiters` table
- [ ] Create `recruiter_invitations` table
- [ ] Add indexes on invitation tokens
- [ ] Create migration script

**Backend API Endpoints:**
- [ ] `POST /api/recruiter/signup` - Accept authorization answer
- [ ] `POST /api/recruiter/send-invitation` - Send invite email
- [ ] `GET /api/recruiter/invite/{token}` - Validate invite token
- [ ] `POST /api/recruiter/accept-invitation` - Create account from invite
- [ ] `POST /api/recruiter/upload-docs` - Upload company documents
- [ ] `GET /api/admin/recruiter-verifications` - Admin dashboard
- [ ] `PATCH /api/admin/recruiter/{id}/approve` - Admin approval
- [ ] `PATCH /api/admin/recruiter/{id}/reject` - Admin rejection

**Frontend:**
- [ ] Add "Are you authorized?" question to signup flow
- [ ] Build invitation input form
- [ ] Build invitation acceptance page (from email link)
- [ ] Add file upload for company docs
- [ ] Create "Pending Verification" status page
- [ ] Add permission checks before job posting
- [ ] Admin dashboard - verification queue

**Tests:**
- [ ] Test: Lady signs up as HEAD_OF_RECRUITMENT
- [ ] Test: Lady signs up and invites Cath
- [ ] Test: Cath accepts invite and creates account
- [ ] Test: Lady can't post until Cath verified
- [ ] Test: Admin approves both together
- [ ] Test: Permission matrix enforced
- [ ] Test: Email invitations sent and links work
- [ ] Test: Invitation tokens expire after 7 days

---

## 💡 BENEFITS

✅ **Clear Authority Chain:** Everyone knows who's the head  
✅ **Reduced Verification Time:** Admin only verifies one person (head)  
✅ **Friction-Free for Juniors:** They just click a link, no docs needed  
✅ **Accountability:** Head is responsible for their team  
✅ **Scalable:** Head can invite unlimited team members  
✅ **Audit Trail:** Know who invited who, when they were verified  

---

This is ready to build. Want the migration scripts + API specs?
