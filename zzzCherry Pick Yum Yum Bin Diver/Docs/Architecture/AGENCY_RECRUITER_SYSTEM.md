# 🏢 Agency & Recruiter Management System

> **Last Updated:** December 18, 2024  
> **Status:** ✅ Implemented

---

## 📋 Overview

This document covers the agency and recruiter management system, including:
- How recruiters are assigned to agencies
- Team invitation system with agency auto-assignment
- Admin ability to reassign recruiters between agencies

---

## 🔧 Problem Solved

### Original Issue
When recruiters signed up, they could:
1. Create duplicate agencies with the same name
2. Not be assigned to the correct agency
3. There was no way for invited team members to auto-join the right agency

### Solution
1. **Team Invitations** - Invitations include `agency_id` so new members auto-join
2. **Admin Reassignment** - Admins can move recruiters between agencies
3. **Invite Token Flow** - New signups with invite token skip agency creation

---

## 📊 Database Schema

### New Table: `team_invitations`

```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL,          -- The agency to join
  inviter_id UUID NOT NULL,          -- Who sent the invitation
  inviter_email VARCHAR(255),
  inviter_name VARCHAR(255),
  invitee_email VARCHAR(255) NOT NULL,
  invitee_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'recruiter',
  invite_token VARCHAR(255) UNIQUE,  -- Secure token for signup
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);
```

---

## 🔄 Flows

### Flow 1: Recruiter Invites Team Member

```
Recruiter clicks "Invite Member"
        │
        ▼
┌─────────────────────────────┐
│ POST /api/recruiter/team/invite │
│ Body: { email, name?, role }   │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Creates team_invitations    │
│ with agency_id from         │
│ inviter's agency            │
└─────────────────────────────┘
        │
        ▼
Returns invite link:
/recruiter/signup?invite=inv_xxx
```

### Flow 2: Invited User Signs Up

```
User visits /recruiter/signup?invite=inv_xxx
        │
        ▼
┌─────────────────────────────┐
│ POST /api/recruiter/signup  │
│ Body: { ..., inviteToken }  │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Validates invitation:       │
│ - Token valid?              │
│ - Not expired?              │
│ - Email matches?            │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Creates agency_recruiters   │
│ with agency_id FROM         │
│ the invitation              │
│ (skips agency creation!)    │
└─────────────────────────────┘
        │
        ▼
User is now part of the invited agency
```

### Flow 3: Admin Reassigns Recruiter

```
Admin opens /admin/agencies/[id]
        │
        ▼
Clicks "Add" on Team Members
        │
        ▼
┌─────────────────────────────┐
│ Selects recruiter from      │
│ dropdown (shows recruiter   │
│ + their current agency)     │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ POST /api/admin/agencies/reassign-recruiter │
│ Body: { recruiterId, newAgencyId }          │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Updates agency_recruiters   │
│ SET agency_id = newAgencyId │
└─────────────────────────────┘
        │
        ▼
Recruiter moved to new agency
```

---

## 📁 API Endpoints

### Recruiter Team APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recruiter/team/invite` | POST | Send team invitation |
| `/api/recruiter/team/invite` | GET | List pending invitations |
| `/api/recruiter/team/invite?id=xxx` | DELETE | Cancel invitation |
| `/api/recruiter/team/accept` | POST | Accept invitation |
| `/api/recruiter/team/accept?token=xxx` | GET | Validate invitation token |

### Admin APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/agencies/reassign-recruiter` | POST | Move recruiter to new agency |
| `/api/admin/agencies/reassign-recruiter` | GET | List all recruiters |

---

## 🎨 UI Components

### Recruiter Team Page (`/recruiter/team`)
- Shows current team members
- "Invite Member" button opens invite form
- Pending invitations list with cancel option
- Role selection (recruiter/admin)
- Copy invite link feature

### Admin Agency Detail Page (`/admin/agencies/[id]`)
- Team Members section with "Add" button
- Modal to select recruiter from other agencies
- Shows recruiter's current agency
- Reassign button moves recruiter

---

## ✅ Testing Checklist

### Test 1: Send Team Invitation
1. Go to `/recruiter/team`
2. Click "Invite Member"
3. Enter email and select role
4. Click "Send Invite"
5. **Expected:** Invitation appears in pending list, link is shown

### Test 2: Accept Invitation (New User)
1. Copy the invite link
2. Open in incognito/new browser
3. Sign up with the invited email
4. **Expected:** 
   - User is created with recruiter role
   - User is assigned to inviter's agency
   - No new agency is created

### Test 3: Accept Invitation (Existing User)
1. If user with email exists, they should see error
2. They need to be reassigned by admin

### Test 4: Admin Reassign Recruiter
1. Go to `/admin/agencies/[id]`
2. Click "Add" in Team Members section
3. Select a recruiter from dropdown
4. Click "Reassign"
5. **Expected:** Recruiter moved to this agency

---

## 🗄️ SQL Queries for Verification

```sql
-- Check pending invitations
SELECT * FROM team_invitations WHERE status = 'pending';

-- Check recruiter's agency
SELECT ar.*, a.name as agency_name 
FROM agency_recruiters ar
JOIN agencies a ON ar.agency_id = a.id
WHERE ar.email = 'test@example.com';

-- Find duplicate agencies
SELECT name, COUNT(*) as count 
FROM agencies 
GROUP BY name 
HAVING COUNT(*) > 1;
```

---

## 🚫 DO NOT

1. **DO NOT** allow signups with invite token if email doesn't match
2. **DO NOT** create new agency when invite token is provided
3. **DO NOT** allow non-admin recruiters to reassign members
4. **DO NOT** delete the invitation record on accept (keep for audit)

---

## 📞 Support

If issues occur:
1. Check browser console for API errors
2. Check Vercel function logs
3. Verify team_invitations table in Supabase
4. Ensure agency_id is correctly passed in all flows

---

**Document Version:** 1.0  
**Status:** ✅ Ready for Testing
