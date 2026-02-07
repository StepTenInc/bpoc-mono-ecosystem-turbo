# Candidate UI Fixes - Part 2 - January 2026

**Author:** Lovell  
**Date:** January 12, 2026  
**Branch:** (current working branch)

---

## Summary

This document tracks additional UI fixes for candidate-facing pages in BPOC.IO (continuation from Part 1).

| Fix | Page | Issue | Solution |
|-----|------|-------|----------|
| #1 | `/candidate/profile` | Profile data resets after navigating away | Fixed user sync to preserve existing data |
| #2 | Video Call Modal | "Meeting has ended" error shows empty object | Improved error handling with user-friendly messages |

---

## Fix #1: Profile Information Resets After Navigation

### Problem
On `/candidate/profile`, when a user fills out Step 1: Profile Information, saves it, navigates to other tabs, and then returns to the Profile tab, the data is reset. The data also disappears from the database.

### Root Cause
The `AuthContext` triggers a user sync (`/api/user/sync`) on auth state changes. When navigating between pages:
1. Auth state change event fires
2. Sync endpoint receives data from `user_metadata` (which doesn't have profile info like bio, location, etc.)
3. Sync endpoint was **overwriting** existing database values with empty values from `user_metadata`

### Solution
**File:** `src/app/api/user/sync/route.ts`

Modified the sync logic to **preserve existing database values** and only update fields that:
1. Have NEW non-empty data from the sync request
2. AND the existing database value is empty

**Before (problematic):**
```typescript
await updateProfile(userData.id, {
  bio: userData.bio || null,           // Overwrites with null if empty
  position: userData.position || null, // Overwrites with null if empty
  location: userData.location || null, // Overwrites with null if empty
  // ...
}, true)
```

**After (fixed):**
```typescript
// Only update fields that have NEW data AND existing is empty
const profileUpdateData: any = {}

if (userData.bio && userData.bio.trim() && !existingProfile.bio) {
  profileUpdateData.bio = userData.bio
}
if (userData.position && userData.position.trim() && !existingProfile.position) {
  profileUpdateData.position = userData.position
}
if (userData.location && userData.location.trim() && !existingProfile.location) {
  profileUpdateData.location = userData.location
}
// ... etc

// Only call updateProfile if there's something to update
if (Object.keys(profileUpdateData).length > 0) {
  await updateProfile(userData.id, profileUpdateData, true)
} else {
  console.log('⏭️ [sync] No new profile data to update - preserving existing values')
}
```

Same protection was applied to candidate data (first_name, last_name, phone, avatar_url).

---

## Fix #2: Daily.co Video Call Error Handling

### Problem
When a Daily.co video call room has ended or expired, the error handling showed:
- `❌ [Daily] Error: {}` (empty object, not helpful)
- `Call error: "Meeting has ended"` (but UI didn't handle it gracefully)

Users saw unhelpful error messages when trying to join expired or ended meetings.

### Solution
**Files:** 
- `src/components/video/DailyCallFrame.tsx`
- `src/components/video/VideoCallModal.tsx`

**Improvements:**
1. **Better error parsing** - Handle multiple Daily.co error formats (errorMsg, error.message, error, msg)
2. **User-friendly messages** - Convert technical errors to helpful messages:
   - "Meeting has ended" → "This meeting has ended or expired. Please schedule a new call."
   - "404/not found" → "Meeting room not found. The room may have been deleted."
   - "unauthorized/token" → "Access denied. Your meeting link may have expired."
   - Empty `{}` error → "Unable to join the call. The meeting may have ended."
3. **Improved error UI** - Shows:
   - Orange/red icon based on error type
   - Clear "Meeting Unavailable" vs "Call Error" title
   - "Close" and "Refresh Page" buttons
   - Helpful hint: "If you need to rejoin, ask the host to send a new meeting link."

```typescript
// Better error parsing
if (event?.errorMsg) {
  errorMsg = event.errorMsg;
} else if (event?.error?.message) {
  errorMsg = event.error.message;
} else if (errorMsg === '{}') {
  errorMsg = 'Unable to join the call. The meeting may have ended.';
}

// User-friendly messages
if (lowerError.includes('meeting has ended')) {
  errorMsg = 'This meeting has ended or expired. Please schedule a new call.';
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/user/sync/route.ts` | Modified sync logic to preserve existing profile & candidate data |
| `src/components/video/DailyCallFrame.tsx` | Improved error handling, user-friendly messages, better error UI |
| `src/components/video/VideoCallModal.tsx` | Handle "ended" errors by updating call status |

---

## Testing

### Testing Fix #1 (Profile Reset):
1. Log in as a candidate
2. Navigate to `/candidate/profile`
3. Click "Edit Profile" to enter edit mode
4. Fill out Step 1: Profile Information (bio, location, birthday, gender, etc.)
5. Click "Save Changes"
6. Verify toast shows "Profile Saved!"
7. Navigate to a different page (e.g., Dashboard, Jobs, Applications)
8. Return to `/candidate/profile`
9. **Expected:** All profile data should still be visible
10. Verify in Supabase `candidate_profiles` table that data persists

### Testing Fix #2 (Video Call Error Handling):
1. Try to join a video call with an expired or invalid room URL
2. **Expected:** Instead of `{}` or technical error, should see:
   - "Meeting Unavailable" title (orange icon)
   - User-friendly message like "This meeting has ended or expired..."
   - "Close" button to dismiss
   - "Refresh Page" button for retry
   - Helpful hint about requesting a new meeting link
3. Test different error scenarios:
   - Expired meeting → "This meeting has ended or expired"
   - Invalid URL → "Meeting room not found"
   - Invalid token → "Access denied. Your meeting link may have expired."

---

## Notes

- All fixes documented here are continuation of `lovell-candidate-ui-fixes.md` (now in `Docs/status-reports/`)
- The sync endpoint is designed for Google OAuth users who sign in for the first time
- The fix ensures it won't overwrite data that users have manually entered through the profile page
