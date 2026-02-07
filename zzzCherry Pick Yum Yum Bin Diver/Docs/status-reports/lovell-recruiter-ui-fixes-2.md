# Recruiter UI Fixes - Part 2 - January 2026

**Author:** Lovell  
**Date:** January 12, 2026  
**Branch:** (current working branch)

---

## Summary

This document tracks **new UI fixes** made to the recruiter portal starting January 12, 2026.

| Fix | Page | Issue | Solution |
|-----|------|-------|----------|
| #1 | `/recruiter/applications/[id]` | Activity timeline shows raw database status values (e.g., "under_review") | Added frontend formatter to convert to human-readable labels ("Under Review") |
| #2 | `/recruiter/applications/[id]` | Release to Client button enabled even without any video calls | Disabled button until at least one video call is completed |
| #3 | `/recruiter/applications/[id]` | No visibility into what call data is available for sharing | Added data availability indicators (Video, Notes, Transcript) per call |
| #4 | `/recruiter/applications/[id]` | Raw technical error shown for transcription failures (FFmpeg ENOENT) | Added user-friendly error messages and early failure detection |
| #5 | `/recruiter/interviews/recordings` | Page fails to load recordings | Fixed session token race condition - wait for session before fetching |
| #6 | `/recruiter/interviews/recordings` | 500 error - foreign key not found | Removed broken FK hint, fetch jobs data separately |
| #7 | `/recruiter/applications/[id]` | Release to Client button can be clicked repeatedly | Disable button after release, show success message instead |

---

## Fix #1: Activity Timeline - Human-Readable Status Labels

### Problem
In the Activity Timeline on the application detail page (`/recruiter/applications/[id]`), status values were displayed exactly as stored in the database:
- "under_review" instead of "Under Review"
- "interview_scheduled" instead of "Interview Scheduled"
- "offer_sent" instead of "Offer Sent"

This looked unprofessional and confusing to users.

### Solution
**File:** `src/components/shared/application/ActivityTimeline.tsx`

Added a status label mapping and formatter function that converts database values to proper case:

#### 1. Added Status Labels Map
```tsx
// Status value to human-readable label mapping (frontend display only)
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offer_pending: 'Offer Pending',
  offer_sent: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  invited: 'Invited',
  started: 'Started',
  no_show: 'No Show',
};
```

#### 2. Added Format Description Function
```tsx
// Format description text by replacing database status values with human-readable labels
const formatDescription = (description: string): string => {
  let formatted = description;
  
  // Replace status values (case-insensitive, whole words only)
  Object.entries(STATUS_LABELS).forEach(([dbValue, label]) => {
    // Match the database value as a whole word (not part of another word)
    const regex = new RegExp(`\\b${dbValue}\\b`, 'gi');
    formatted = formatted.replace(regex, label);
  });
  
  return formatted;
};
```

#### 3. Applied Formatter to Description Display
```tsx
// Before
<p className="text-white font-medium text-sm">{event.description}</p>

// After
<p className="text-white font-medium text-sm">{formatDescription(event.description)}</p>
```

### Result
- "Status changed to under_review" → "Status changed to Under Review"
- "Application released to client (status: shortlisted)" → "Application released to client (status: Shortlisted)"
- All status values in activity descriptions are now properly formatted
- Change is **frontend only** - no database modifications needed

---

## Fix #2: Release to Client - Require Completed Video Call First

### Problem
On the application detail page (`/recruiter/applications/[id]`), recruiters could release applications to clients without first conducting any video call (pre-screen, interview, etc.). This meant clients could receive applications without any recruiter screening.

### Solution
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

Added a check to verify at least one video call has been completed before enabling the "Release To Client" button.

#### 1. Added Completed Call Check
```tsx
// Check if any call has been completed (has ended or has recordings)
const hasCompletedCall = (application.calls || []).some((call: any) => 
  call.status === 'ended' || 
  call.ended_at || 
  (call.recordings && call.recordings.length > 0)
);
```

#### 2. Updated Button Rendering Logic
```tsx
if (!hasCompletedCall) {
  return (
    <div className="w-full p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
      <p className="text-yellow-400 text-xs text-center">
        Complete at least one video call before releasing to client
      </p>
    </div>
  );
}
```

### Check Criteria
A call is considered "completed" if ANY of these conditions are true:
- `call.status === 'ended'` - Call status is ended
- `call.ended_at` - Call has an end timestamp
- `call.recordings.length > 0` - Call has recordings

### Result
- **No completed calls:** Yellow warning message: "Complete at least one video call before releasing to client"
- **Application rejected:** Red message: "Cannot release rejected applications to client"
- **Has completed call:** Normal "Release To Client" button is enabled

This ensures recruiters always screen candidates before sharing them with clients.

---

## Fix #3: Show Available Call Data for Release to Client

### Problem
In the "Release To Client" section, recruiters could see their calls but had no way to know what data was actually available for each call:
- Did the call get recorded?
- Are there notes attached?
- Is there a transcript available?

This made the "Share with Client/Candidate" checkboxes confusing - what exactly would be shared?

### Solution
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

Added visual indicators for each call showing what data is available.

#### 1. Added Data Availability Checks
```tsx
// Check what data is available for this call
const hasRecording = (c.recordings && c.recordings.length > 0);
const hasNotes = !!(c.notes && c.notes.trim());
const hasTranscript = (c.transcripts && c.transcripts.some((t: any) => t.status === 'completed' && t.full_text));
const callEnded = c.status === 'ended' || c.ended_at;
```

#### 2. Added Call Status Badge
Shows whether the call is "Completed" or "In Progress":
```tsx
<Badge 
  variant="outline" 
  className={callEnded 
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs' 
    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs'
  }
>
  {callEnded ? 'Completed' : 'In Progress'}
</Badge>
```

#### 3. Added Data Availability Pills
Three pill badges showing availability of each data type:
```tsx
<div className="mt-2 flex flex-wrap gap-2">
  <div className={`... ${hasRecording ? 'emerald styling' : 'gray styling'}`}>
    {hasRecording ? '✓' : '✗'} Video
  </div>
  <div className={`... ${hasNotes ? 'emerald styling' : 'gray styling'}`}>
    {hasNotes ? '✓' : '✗'} Notes
  </div>
  <div className={`... ${hasTranscript ? 'emerald styling' : 'gray styling'}`}>
    {hasTranscript ? '✓' : '✗'} Transcript
  </div>
</div>
```

### Visual Indicators

| Data Type | Available | Not Available |
|-----------|-----------|---------------|
| Video | ✓ Video (green) | ✗ Video (gray) |
| Notes | ✓ Notes (green) | ✗ Notes (gray) |
| Transcript | ✓ Transcript (green) | ✗ Transcript (gray) |

### Result
- Recruiters can see at a glance what data each call has
- Clear indication of call completion status
- No more guessing what will be shared with clients/candidates
- Green = available, Gray = not available

---

## Fix #4: User-Friendly Transcription Error Messages

### Problem
When transcription failed (especially on Vercel deployment), users saw raw technical error messages like:
```
Transcription failed: spawn /var/task/.next/server/app/api/video/transcribe/ffmpeg ENOENT
```

This was confusing and unhelpful for users.

### Root Cause
The `ffmpeg-static` package doesn't work properly on Vercel serverless functions because:
- The binary isn't bundled correctly in the serverless package
- The path returned by `ffmpeg-static` doesn't exist at runtime

### Solution

#### 1. Frontend - User-Friendly Error Messages
**File:** `src/components/shared/application/CallArtifacts.tsx`

Added error message formatter that converts technical errors to human-readable messages:

```tsx
{t.status === 'failed' && t.error_message && (
  <div className="mt-2 text-xs bg-red-500/10 border border-red-500/20 rounded p-2">
    <div className="text-red-300 font-medium mb-1">Transcription Failed</div>
    <div className="text-red-400/80">
      {t.error_message.includes('ffmpeg') || t.error_message.includes('ENOENT') 
        ? 'Audio processing service unavailable. Please contact support or try again later.'
        : t.error_message.includes('OPENAI') || t.error_message.includes('API key')
        ? 'Transcription service not configured. Please contact support.'
        : t.error_message.includes('empty') || t.error_message.includes('silent')
        ? 'No audio detected in the recording. The call may have been too short or silent.'
        : t.error_message.includes('expired') || t.error_message.includes('403')
        ? 'Recording access expired. Please try transcribing again.'
        : t.error_message.length > 100
        ? t.error_message.slice(0, 100) + '...'
        : t.error_message
      }
    </div>
  </div>
)}
```

#### 2. Backend - Early FFmpeg Detection
**File:** `src/app/api/video/transcribe/route.ts`

Added check to detect FFmpeg availability before attempting transcription:

```tsx
// Check if FFmpeg is available (may not be on Vercel serverless)
function checkFfmpegAvailable(): boolean {
  if (!ffmpegPath) return false;
  try {
    const fs = require('fs');
    return fs.existsSync(ffmpegPath);
  } catch {
    return false;
  }
}

const isFfmpegAvailable = checkFfmpegAvailable();
```

Then early-exit with a clean error:
```tsx
if (!isFfmpegAvailable) {
  return NextResponse.json({ 
    error: 'Audio processing service unavailable in this environment.',
    code: 'FFMPEG_NOT_AVAILABLE'
  }, { status: 503 });
}
```

### Error Message Mapping

| Technical Error | User-Friendly Message |
|-----------------|----------------------|
| `ffmpeg ENOENT` | "Audio processing service unavailable. Please contact support or try again later." |
| `OPENAI_API_KEY` | "Transcription service not configured. Please contact support." |
| `empty` / `silent` | "No audio detected in the recording. The call may have been too short or silent." |
| `expired` / `403` | "Recording access expired. Please try transcribing again." |
| Long error | Truncated to 100 characters |

### Result
- Users see helpful, actionable error messages instead of raw technical errors
- Backend fails early if FFmpeg isn't available (saves time and resources)
- Error messages include "Transcription Failed" header for clarity

### Note on FFmpeg on Vercel
This is a known limitation of Vercel serverless functions. To fully resolve:
1. Deploy transcription to a different service (AWS Lambda with layers, dedicated server)
2. Use an external transcription API (AssemblyAI, Rev.ai, etc.)
3. Use Vercel Edge Functions with WebAssembly-based FFmpeg

---

## Fix #5: Recordings Page - Session Token Race Condition

### Problem
The `/recruiter/interviews/recordings` page was failing to load recordings with an error. The page was making API calls before the authentication session was available.

### Root Cause
```tsx
// Before - problematic code
useEffect(() => {
  fetchRecordings();  // Called immediately when user.id exists
}, [user?.id]);        // But session might not be ready yet!

// API call used session?.access_token which could be undefined
const roomsResponse = await fetch('/api/video/rooms?status=ended', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,  // undefined!
  },
});
```

### Solution
**File:** `src/app/(recruiter)/recruiter/interviews/recordings/page.tsx`

#### 1. Wait for Session Before Fetching
```tsx
useEffect(() => {
  // Only fetch when we have both user and session
  if (user?.id && session?.access_token) {
    fetchRecordings();
  }
}, [user?.id, session?.access_token]);
```

#### 2. Guard Function Entry
```tsx
const fetchRecordings = async () => {
  // Guard: ensure session is available
  if (!session?.access_token) {
    console.log('[Recordings] No session token available, skipping fetch');
    setLoading(false);
    return;
  }
  // ... rest of function now uses session.access_token (non-optional)
};
```

#### 3. Validate Session in Transcribe Handler
```tsx
const handleTranscribe = async (recording) => {
  if (!session?.access_token) {
    toast.error('Session expired. Please refresh the page.');
    return;
  }
  // ... proceed with transcription
};
```

### Result
- Page now waits for authentication to be ready before fetching
- No more 401 Unauthorized errors on page load
- Clear error message if session expires during use
- Recordings load correctly when page is accessed

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/shared/application/ActivityTimeline.tsx` | Added `STATUS_LABELS` map, `formatDescription()` function, applied formatter to description display |
| `src/app/(recruiter)/recruiter/applications/[id]/page.tsx` | Added `hasCompletedCall` check, disabled Release To Client if no calls completed, added call data availability indicators |
| `src/components/shared/application/CallArtifacts.tsx` | Added user-friendly error message formatting for failed transcriptions |
| `src/app/api/video/transcribe/route.ts` | Added FFmpeg availability check, improved error messages, early failure detection |
| `src/app/(recruiter)/recruiter/interviews/recordings/page.tsx` | Fixed session token race condition, added session validation before API calls |
| `src/app/api/video/rooms/route.ts` | Removed broken FK join hint, fetch jobs data separately to avoid PGRST200 error |

---

## Testing

### Testing Fix #1 (Activity Timeline Status Labels):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for any application
3. Scroll down to the "Activity Timeline" section
4. Verify that all status values are displayed in proper case:
   - "Under Review" instead of "under_review"
   - "Shortlisted" instead of "shortlisted"
   - "Interview Scheduled" instead of "interview_scheduled"
   - etc.
5. Test with applications that have multiple status changes in their timeline
6. Verify the formatting works for both direct status mentions and status mentions in context (e.g., "released to client (status: Shortlisted)")

### Testing Fix #2 (Release to Client Requires Call):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for an application that has **NO video calls** yet
3. Look at the "Release To Client (Recruiter Gate)" section
4. Verify:
   - The "Release To Client" button is NOT shown
   - A yellow warning message appears: "Complete at least one video call before releasing to client"
5. Now initiate and complete a video call with the candidate (any type: pre-screen, general call, etc.)
6. Refresh the page or wait for the data to update
7. Verify:
   - The warning message is gone
   - The "Release To Client" button is now visible and clickable
8. Also test with a **rejected** application:
   - Should still show "Cannot release rejected applications to client" (red message)
   - Even if there are completed calls, rejected apps cannot be released

### Testing Fix #3 (Call Data Availability Indicators):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for an application with video calls
3. Look at the "Release To Client (Recruiter Gate)" section
4. For each call card, verify:
   - A "Completed" or "In Progress" badge appears next to the call title
   - Three pill indicators show: Video, Notes, Transcript
   - Green (✓) indicates data is available
   - Gray (✗) indicates data is not available
5. Test with different call scenarios:
   - Call with recording but no notes/transcript → Video green, Notes gray, Transcript gray
   - Call with notes but no recording → Video gray, Notes green, Transcript gray
   - Call with all data → All green
   - Call in progress (not ended) → Yellow "In Progress" badge
6. Verify the checkboxes for "Share with Client/Candidate" are still functional

### Testing Fix #4 (User-Friendly Transcription Errors):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` with a failed transcription
3. Look at the Call Artifacts section
4. Verify:
   - Error displays with "Transcription Failed" header
   - Error message is user-friendly, not raw technical text
   - No mention of "spawn", "ENOENT", or file paths
5. If testing on Vercel:
   - Try to transcribe a recording
   - Should see "Audio processing service unavailable" error instead of raw FFmpeg error

### Testing Fix #5 (Recordings Page Load):
1. Log in as a recruiter
2. Navigate to `/recruiter/interviews/recordings`
3. Verify:
   - Page loads without errors
   - "Loading recordings..." spinner appears briefly
   - Recordings list populates (or shows "No Recordings" if none exist)
   - No 401 errors in browser console
4. Click on a recording to view details
5. Try transcribing a recording (if available)
6. Refresh the page - should reload correctly

### Testing Fix #6 (500 Error - Foreign Key):
1. Log in as a recruiter
2. Navigate to `/recruiter/interviews/recordings`
3. Verify:
   - No 500 Internal Server Error in console
   - Rooms load successfully
   - Job information displays if available
4. Check server logs - should not show PGRST200 error

---

## Notes for Main Branch Merge

- No database migrations required
- No new dependencies added
- Changes are backward compatible
- The `ActivityTimeline` component is shared across multiple pages:
  - Recruiter application detail page
  - Admin application detail page  
  - Candidate application detail page (if applicable)
- All pages using this component will automatically benefit from the improved formatting
- Fix #2 (Release to Client) only affects the recruiter application detail page
  - This adds a quality gate ensuring candidates are screened before client review
  - Existing released applications are unaffected (they stay released)

