# 🛡️ BPOC Internal User System - Testing Documentation

> **Last Updated:** December 18, 2024  
> **Status:** ✅ Fixed  
> **Issue:** Admin users were incorrectly being added to the `candidates` table

---

## 📋 Overview

BPOC has **three distinct user types** that must be kept separate:

| User Type | Table | Portal | Description |
|-----------|-------|--------|-------------|
| **Candidate** | `candidates` + `candidate_profiles` | `/candidate/*` | Job seekers using the platform |
| **Recruiter** | `agency_recruiters` + `agencies` | `/recruiter/*` | Agency recruiters managing talent |
| **Admin** | `bpoc_users` + `bpoc_profiles` | `/admin/*` | BPOC internal staff/administrators |

### ⚠️ Critical Rule
**Admin and Recruiter users should NEVER be added to the `candidates` table!**

---

## 🐛 Issue #1: Admin Creates Candidate Record (FIXED)

### Problem
When creating a BPOC Admin account, the system was incorrectly creating a candidate record in the `candidates` table.

### Root Cause
The `/api/user/sync/route.ts` only checked for `recruiter` role but NOT `admin` role:

```typescript
// BEFORE (BUG):
if (computedAdminLevel === 'recruiter') {
  // Skip sync
}

// AFTER (FIXED):
if (computedAdminLevel === 'recruiter' || computedAdminLevel === 'admin') {
  // Skip sync for both
}
```

### Files Modified
1. `/src/app/api/user/sync/route.ts` - Added `admin` check
2. `/src/contexts/AuthContext.tsx` - Enhanced skip logic with better logging

---

## ✅ Testing Checklist

### Test 1: Create New Admin Account
1. Go to `/admin/signup`
2. Fill in the form:
   - First Name: `BPOC`
   - Last Name: `Admin`
   - Email: `admin-test@bpoc.io`
   - Password: `securepassword123`
3. Submit the form
4. **Expected Result:**
   - ✅ Account created in `auth.users`
   - ✅ Record created in `bpoc_users` table
   - ✅ Record created in `bpoc_profiles` table
   - ❌ NO record in `candidates` table

### Test 2: Admin Login Flow
1. After creating account, go to `/admin/login`
2. Sign in with admin credentials
3. Check browser console for logs
4. **Expected Console Output:**
   ```
   🔀 Redirecting admin user to /admin dashboard
   🔍 SIGNED_IN event detected for user: admin-test@bpoc.io
   ⏭️ Skipping sync for BPOC internal user - not a candidate: {
     email: "admin-test@bpoc.io",
     role: "admin",
     reason: "BPOC Admin user"
   }
   ```
5. **Expected Result:**
   - ✅ Admin **automatically redirected** to `/admin` dashboard
   - ❌ NO candidate record created

### Test 2b: Admin Sign-in from Homepage
1. Go to homepage (`/`)
2. Click "Sign In"
3. Sign in with admin credentials
4. **Expected Result:**
   - ✅ Admin **automatically redirected** to `/admin` dashboard (not candidate dashboard)

### Test 3: Verify Database State
Run these queries in Supabase SQL Editor:

```sql
-- Check admin exists in bpoc_users (SHOULD EXIST)
SELECT * FROM bpoc_users WHERE email = 'admin-test@bpoc.io';

-- Check admin profile exists (SHOULD EXIST)
SELECT * FROM bpoc_profiles WHERE bpoc_user_id = (
  SELECT id FROM bpoc_users WHERE email = 'admin-test@bpoc.io'
);

-- Check NO candidate record exists (SHOULD BE EMPTY)
SELECT * FROM candidates WHERE email = 'admin-test@bpoc.io';
```

### Test 4: Create Recruiter Account
1. Go to `/recruiter/signup`
2. Fill in the form:
   - First Name: `Test`
   - Last Name: `Recruiter`
   - Email: `recruiter-test@agency.com`
   - Password: `securepassword123`
   - Agency Name: `Test Agency`
3. Submit the form
4. **Expected Result:**
   - ✅ Account created in `auth.users` with `role: 'recruiter'`
   - ✅ Record created in `agencies` table
   - ✅ Record created in `agency_recruiters` table
   - ❌ NO record in `candidates` table
   - ❌ NO record in `bpoc_users` table

### Test 5: Recruiter Login Flow
1. After creating account, you'll be auto-signed in
2. Check browser console for logs
3. **Expected Console Output:**
   ```
   🔀 Redirecting recruiter user to /recruiter dashboard
   🔍 SIGNED_IN event detected for user: recruiter-test@agency.com
   ⏭️ Skipping sync for BPOC internal user - not a candidate: {
     email: "recruiter-test@agency.com",
     role: "recruiter",
     reason: "Recruiter user"
   }
   ```
4. **Expected Result:**
   - ✅ Recruiter **automatically redirected** to `/recruiter` dashboard
   - ❌ NO candidate record created

### Test 5b: Recruiter Sign-in from Homepage
1. Go to homepage (`/`)
2. Click "Sign In"
3. Sign in with recruiter credentials
4. **Expected Result:**
   - ✅ Recruiter **automatically redirected** to `/recruiter` dashboard (not candidate dashboard)

### Test 6: Verify Recruiter Database State
Run these queries in Supabase SQL Editor:

```sql
-- Check recruiter exists in agency_recruiters (SHOULD EXIST)
SELECT * FROM agency_recruiters WHERE email = 'recruiter-test@agency.com';

-- Check agency was created (SHOULD EXIST)
SELECT * FROM agencies WHERE name = 'Test Agency';

-- Check NO candidate record exists (SHOULD BE EMPTY)
SELECT * FROM candidates WHERE email = 'recruiter-test@agency.com';

-- Check NO bpoc_users record exists (SHOULD BE EMPTY - that's for admins)
SELECT * FROM bpoc_users WHERE email = 'recruiter-test@agency.com';
```

### Test 7: Create Candidate (Sanity Check)
1. Go to homepage (`/`)
2. Click "Sign Up" 
3. Create a regular candidate account
4. **Expected Result:**
   - ✅ Record created in `candidates` table
   - ✅ Record created in `candidate_profiles` table
   - ❌ NO record in `bpoc_users` table
   - ❌ NO record in `agency_recruiters` table

---

## 🔧 Technical Implementation

### User Type Detection Flow

```
User Signs In/Signs Up
        │
        ▼
┌─────────────────────────────────┐
│  Check user_metadata            │
│  - admin_level                  │
│  - role                         │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Is admin_level === 'admin' OR 'recruiter'?         │
│  OR role === 'admin' OR 'recruiter'?                │
└─────────────────────────────────────────────────────┘
        │
    YES │                                          NO
        ▼                                           │
┌─────────────────────────────────┐                 │
│ SKIP candidate sync             │                 │
│                                 │                 │
│ • Admin → bpoc_users table      │                 │
│ • Recruiter → agency_recruiters │                 │
│                                 │                 │
│ Log: "Skipping sync for BPOC    │                 │
│       internal user"            │                 │
└─────────────────────────────────┘                 │
                                                    ▼
                                    ┌─────────────────────────────┐
                                    │ CREATE/UPDATE candidate     │
                                    │ record in:                  │
                                    │ • candidates table          │
                                    │ • candidate_profiles table  │
                                    └─────────────────────────────┘
```

### Signup Flow by User Type

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN SIGNUP                                  │
│  /admin/signup → /api/admin/signup                                  │
├─────────────────────────────────────────────────────────────────────┤
│  1. Create auth.users with role='admin', admin_level='admin'        │
│  2. Create bpoc_users record                                        │
│  3. Create bpoc_profiles record                                     │
│  4. On login: AuthContext skips candidate sync ✅                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       RECRUITER SIGNUP                               │
│  /recruiter/signup → /api/recruiter/signup                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Create auth.users with role='recruiter', admin_level='recruiter'│
│  2. Create/get agencies record                                      │
│  3. Create agency_recruiters record                                 │
│  4. On login: AuthContext skips candidate sync ✅                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       CANDIDATE SIGNUP                               │
│  / (homepage) → SignUpForm → AuthContext.signUp()                   │
├─────────────────────────────────────────────────────────────────────┤
│  1. Create auth.users with default role='user'                      │
│  2. syncUserToDatabase() called                                     │
│  3. Create candidates record                                        │
│  4. Create candidate_profiles record                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Code Locations

| File | Purpose |
|------|---------|
| `/src/app/api/user/sync/route.ts` | Server-side sync - skips admin/recruiter |
| `/src/lib/user-sync.ts` | Client-side sync helper - skips admin/recruiter |
| `/src/contexts/AuthContext.tsx` | Auth state handler - skips sync for internal users |
| `/src/app/api/admin/signup/route.ts` | Admin signup - creates bpoc_users record |
| `/src/app/api/recruiter/signup/route.ts` | Recruiter signup - creates agency_recruiters record |
| `/src/app/recruiter/signup/page.tsx` | Recruiter signup UI |
| `/src/app/(admin)/admin/signup/page.tsx` | Admin signup UI |

---

## 🚫 DO NOT

1. **DO NOT** manually add admin users to the `candidates` table
2. **DO NOT** remove the admin/recruiter check from the sync endpoints
3. **DO NOT** change the `admin_level` metadata for existing users without understanding the implications
4. **DO NOT** test admin features with a candidate account

---

## 🧹 Cleanup: Remove Incorrect Candidate Records

If admin or recruiter users were incorrectly added to candidates table, clean them up:

### For Admin Users:
```sql
-- Find incorrectly created candidate records for admin users
SELECT c.id, c.email, c.created_at 
FROM candidates c
WHERE c.id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'admin_level' = 'admin'
     OR raw_user_meta_data->>'role' = 'admin'
);

-- Delete incorrect candidate records (CAREFUL!)
DELETE FROM candidates 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'admin_level' = 'admin'
     OR raw_user_meta_data->>'role' = 'admin'
);

-- Also delete any associated profiles
DELETE FROM candidate_profiles 
WHERE candidate_id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'admin_level' = 'admin'
     OR raw_user_meta_data->>'role' = 'admin'
);
```

### For Recruiter Users:
```sql
-- Find incorrectly created candidate records for recruiter users
SELECT c.id, c.email, c.created_at 
FROM candidates c
WHERE c.id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'admin_level' = 'recruiter'
     OR raw_user_meta_data->>'role' = 'recruiter'
);

-- Delete incorrect candidate records (CAREFUL!)
DELETE FROM candidates 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'admin_level' = 'recruiter'
     OR raw_user_meta_data->>'role' = 'recruiter'
);

-- Also delete any associated profiles
DELETE FROM candidate_profiles 
WHERE candidate_id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'admin_level' = 'recruiter'
     OR raw_user_meta_data->>'role' = 'recruiter'
);
```

### Find ALL incorrectly created records (Admin + Recruiter):
```sql
-- Find all internal users incorrectly in candidates table
SELECT c.id, c.email, c.created_at,
       au.raw_user_meta_data->>'role' as role,
       au.raw_user_meta_data->>'admin_level' as admin_level
FROM candidates c
JOIN auth.users au ON c.id = au.id
WHERE au.raw_user_meta_data->>'admin_level' IN ('admin', 'recruiter')
   OR au.raw_user_meta_data->>'role' IN ('admin', 'recruiter');
```

---

## 📞 Support

If issues persist:
1. Check browser console for sync logs
2. Check Vercel function logs for API errors
3. Verify user metadata in Supabase Auth dashboard
4. Ensure environment variables are set correctly

---

**Document Version:** 1.0  
**Tested By:** AI Assistant  
**Status:** ✅ Ready for Testing
