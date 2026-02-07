# Candidate UI Fixes - January 2026

**Author:** Lovell  
**Date:** January 8, 2026  
**Branch:** (current working branch)

---

## Summary

This document outlines **8 UI fixes** made to the candidate-facing pages in BPOC.IO:

| Fix | Page | Issue | Solution |
|-----|------|-------|----------|
| #1 | `/candidate/applications` | Rejection reason not displayed | Added rejection reason to API & UI card |
| #2 | `/candidate/applications` | "View Job Details" 404 error | Created JobDetailsModal component |
| #3 | `/candidate/profile` | Save flow issues, gender enum bug | Fixed validation, success overlay, enum fix |
| #4 | `/candidate/applications` & `/candidate/jobs` | Enum values lowercase | Added formatters (remote→Remote, full_time→Full Time, day→Day Shift) |
| #5 | `/candidate/interviews` | Same interview shown twice | Excluded hero card interview from list |
| #6 | `/candidate/jobs` | Can apply to already-applied jobs | Fetch existing applications, disable Apply button |
| #7 | `/candidate/applications` | "Complete Profile" clickable when profile done | Show disabled "Profile Complete" when complete |
| #8 | `/candidate/applications/[id]` | Status badge lowercase | Added status formatter (submitted→Submitted) |

---

## Fix #1: Rejection Reason Display on Application Cards

### Problem
When a candidate's application was rejected, the application card on `/candidate/applications` would show the "Rejected" status but **did not display the rejection reason** to the candidate. The `rejection_reason` column exists in the `job_applications` table but was not being fetched or displayed.

### Solution

#### 1. API Route Update
**File:** `src/app/api/candidate/applications/route.ts`

Added `rejection_reason` to the Supabase query:

```typescript
const { data: applications, error: appsError } = await supabaseAdmin
  .from('job_applications')
  .select(`
    id,
    job_id,
    status,
    created_at,
    released_to_client,
    released_at,
    rejection_reason,  // ← Added this field
    jobs (
      // ... job fields
    )
  `)
```

Added `rejectionReason` to the formatted API response:

```typescript
return {
  id: app.id,
  jobId: app.job_id,
  // ... other fields
  rejectionReason: (app as any).rejection_reason || null,  // ← Added this
  // ... remaining fields
};
```

#### 2. UI Component Update
**File:** `src/components/candidate/CandidateApplicationCard.tsx`

Added a **visible rejection reason section** directly on the card (no need to expand):

```tsx
{/* Rejection Reason Preview (visible without expanding) */}
{application.status === 'rejected' && application.rejectionReason && (
    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
                <span className="text-red-400 font-medium text-sm">Reason: </span>
                <span className="text-gray-300 text-sm">{application.rejectionReason}</span>
            </div>
        </div>
    </div>
)}
```

#### 3. Removed Duplicate Display
Previously, there was a "Feedback" section in the expanded area that would also show the rejection reason. This was removed to avoid redundancy. Now the rejection reason appears only once, prominently displayed on the card without needing to click "More".

### Result
- Candidates can now immediately see the rejection reason on their application card
- The reason is displayed with a red-tinted background and lightbulb icon for visibility
- No duplicate information when expanding the card

---

## Fix #2: View Job Details Button - Broken URL & Modal Implementation

### Problem
The "View Job Details" button in the application card was linking to `/candidate/jobs/[jobId]` which **does not exist**. This caused a 404 error when candidates clicked the button.

The correct public job details page exists at `/jobs/[jobId]`.

### Solution
Instead of just fixing the URL (which would navigate users away from their applications page), we implemented a **modal approach** for better UX:

#### 1. Created New Component
**File:** `src/components/candidate/JobDetailsModal.tsx`

A new modal component that:
- Fetches job details via the existing `/api/jobs/public/[id]` API
- Displays job information in a styled modal overlay
- Shows salary, work type, arrangement, shift, skills, description, requirements, responsibilities, and benefits
- Has loading and error states
- Allows candidates to close and stay on their applications page

#### 2. Updated Application Card
**File:** `src/components/candidate/CandidateApplicationCard.tsx`

- Added import for `JobDetailsModal`
- Added `showJobModal` state to control modal visibility
- Replaced the broken `<Link>` with a `<Button>` that opens the modal
- Changed icon from `ExternalLink` to `Eye` to indicate viewing (not navigating away)
- Added the `JobDetailsModal` component at the end of the card

```tsx
// Before (broken)
<Link href={`/candidate/jobs/${application.jobId}`}>
    <Button variant="outline">
        <ExternalLink className="h-4 w-4 mr-2" />
        View Job Details
    </Button>
</Link>

// After (modal)
<Button onClick={() => setShowJobModal(true)}>
    <Eye className="h-4 w-4 mr-2" />
    View Job Details
</Button>

<JobDetailsModal
    jobId={application.jobId}
    isOpen={showJobModal}
    onClose={() => setShowJobModal(false)}
/>
```

### Result
- Candidates can now view job details without leaving the applications page
- Modal displays comprehensive job information
- Better UX - candidates stay in context and can easily close the modal
- No 404 errors

---

## Fix #3: Profile Save Flow Improvements

### Problem
The profile save functionality on `/candidate/profile` had several UX issues:
1. Multiple separate validation error toasts (one for each missing field)
2. No visual confirmation after successful save (only a toast)
3. Birthday field was missing the `disabled` prop when in view mode
4. Fields like gender, location, birthday, title (position), and bio needed proper storage verification
5. Gender enum mismatch: UI used `others` but database enum expects `other` - causing silent save failures
6. Inconsistent button text: "Save Profile" vs "Save Changes"

### Solution

#### 1. Consolidated Validation
**File:** `src/app/(candidate)/candidate/profile/page.tsx`

Changed from multiple separate validation toasts to a single consolidated message:

```tsx
// Before: Multiple separate toasts
if (!formData.location) { toast({ title: 'Error', description: 'Location required' }) }
if (!formData.birthday) { toast({ title: 'Error', description: 'Birthday required' }) }
// ... more individual checks

// After: Consolidated validation
const missingFields: string[] = []
if (!formData.location) missingFields.push('Location')
if (!formData.birthday) missingFields.push('Birthday')
// ... collect all missing fields

if (missingFields.length > 0) {
  toast({
    title: 'Please complete required fields',
    description: missingFields.join(', '),
    variant: 'destructive',
  })
}
```

#### 2. Visual Success Confirmation
Added a success overlay that shows after saving:

```tsx
{saveSuccess && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-8 text-center">
      <CheckCircle className="w-10 h-10 text-emerald-400" />
      <h3 className="text-xl font-bold text-white">Profile Saved!</h3>
      <p className="text-gray-400">Your changes have been saved successfully.</p>
    </div>
  </div>
)}
```

#### 3. Fixed Birthday Field
Added missing `disabled={shouldDisableFields}` prop to the birthday input field.

#### 4. Fixed Gender Enum Mismatch
The UI was using `others` for the "Other" gender option, but the database enum only accepts `other`. This caused Supabase to silently reject the entire profile update.

**Fixed in 4 places:**
- Select option value: `others` → `other`
- Conditional for custom gender input display
- handleInputChange check for clearing custom gender
- profileUpdate gender_custom condition

#### 5. Unified Button Text
Changed "Save Profile" to "Save Changes" in the bottom sticky bar to match the header button text.

#### 6. Verified Field Storage
Confirmed that the following fields are properly mapped and stored in the `candidate_profiles` table:
- `bio` → `bio`
- `position` → `position` (title)
- `location` → `location`
- `birthday` → `birthday`
- `gender` → `gender`

### Result
- Single, clear validation message listing all missing required fields
- Visual success overlay with animation after successful save
- Smoother, more professional save experience
- All fields (gender, location, birthday, title, bio) properly stored
- Profile save now works correctly (gender enum fix resolved silent failures)
- Consistent "Save Changes" button text throughout the page

---

## Fix #4: Work Arrangement, Work Type & Shift Display Formatting

### Problem
On `/candidate/applications` and `/candidate/jobs`, enum values were displayed as raw database values instead of properly formatted text.

**Before:** `remote`, `full_time`, `day`
**After:** `Remote`, `Full Time`, `Day Shift`

### Solution
**Files:** 
- `src/components/candidate/CandidateApplicationCard.tsx`
- `src/app/(candidate)/candidate/jobs/page.tsx`

Added helper functions to format enum values:

```tsx
// Work Arrangement
const formatWorkArrangement = (arrangement?: string) => {
    const formats: Record<string, string> = {
        'remote': 'Remote',
        'on-site': 'On-Site',
        'onsite': 'On-Site',
        'hybrid': 'Hybrid',
    };
    return formats[arrangement?.toLowerCase()] || ...;
};

// Work Type
const formatWorkType = (workType?: string) => {
    const formats: Record<string, string> = {
        'full_time': 'Full Time',
        'part_time': 'Part Time',
        'contract': 'Contract',
        'freelance': 'Freelance',
    };
    return formats[workType?.toLowerCase()] || ...;
};

// Shift
const formatShift = (shift?: string) => {
    const formats: Record<string, string> = {
        'day': 'Day Shift',
        'night': 'Night Shift',
        'both': 'Day/Night Shift',
    };
    return formats[shift?.toLowerCase()] || ...;
};
```

### Result
- All enum values now display with proper capitalization and formatting
- `full_time` → `Full Time`
- `day` → `Day Shift`
- `remote` → `Remote`
- Fallback for unknown values formats them nicely

---

## Fix #5: Duplicate Interview Display

### Problem
On `/candidate/interviews`, the same interview was displayed twice:
1. Once in the "Hero Card" section (highlighted, with "UPCOMING" badge)
2. Again in the regular interviews list below

This caused confusion as it looked like there were two separate interviews when there was only one.

### Solution
**File:** `src/app/(candidate)/candidate/interviews/page.tsx`

Added logic to exclude the hero interview from the regular list:

```tsx
{(() => {
  // Find the hero interview ID to exclude it from the list
  const upcomingInterviews = interviews
    .filter(i => i.scheduledAt && i.status === 'scheduled' && new Date(i.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  const heroInterviewId = upcomingInterviews[0]?.id;
  
  // Filter out the hero interview from the list
  const listInterviews = interviews.filter(i => i.id !== heroInterviewId);
  
  return listInterviews.map((interview, index) => {
    // ... render interview cards
  });
})()}
```

### Result
- Each interview now appears only once
- The next upcoming interview shows in the highlighted hero card
- All other interviews show in the regular list below
- No more duplicate display confusion

---

## Fix #6: Disable Apply Button for Already-Applied Jobs

### Problem
On `/candidate/jobs`, candidates could still click "Apply Now" on jobs they had already applied to. The button only changed to "Applied" if they applied during the current session - refreshing the page would reset it.

### Solution
**File:** `src/app/(candidate)/candidate/jobs/page.tsx`

Added a useEffect to fetch existing applications on page load:

```tsx
// Fetch candidate's existing applications on mount
useEffect(() => {
  const fetchExistingApplications = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch('/api/candidate/applications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const appliedJobIds = new Set<string>(
          data.applications?.map((app: { jobId: string }) => app.jobId) || []
        );
        setAppliedJobs(appliedJobIds);
      }
    } catch (error) {
      console.error('Failed to fetch existing applications:', error);
    }
  };

  fetchExistingApplications();
}, [session?.access_token]);
```

### Result
- On page load, all jobs the candidate has already applied to show "Applied" (disabled)
- Jobs not yet applied to show "Apply Now" (active)
- Applying to a job immediately updates the button state
- State persists across page refreshes

---

## Fix #7: Disable "Complete Profile" Button When Profile is Complete

### Problem
On `/candidate/applications`, when an application has status "submitted", it shows a "Complete Profile" button. However, this button was always clickable even when the candidate's profile was already 100% complete.

### Solution
**Files:** 
- `src/app/(candidate)/candidate/applications/page.tsx`
- `src/components/candidate/CandidateApplicationCard.tsx`

**Step 1:** Fetch profile completion status in the applications page:

```tsx
const [profileComplete, setProfileComplete] = useState(false);

const fetchProfileStatus = useCallback(async () => {
  if (!session?.user?.id) return;

  try {
    const response = await fetch(`/api/candidates/${session.user.id}/profile`);
    const data = await response.json();

    if (response.ok && data.profile) {
      const isComplete = data.profile.profile_completion_percentage === 100 
        || data.profile.profile_completed === true;
      setProfileComplete(isComplete);
    }
  } catch (error) {
    console.error('Failed to fetch profile status:', error);
  }
}, [session?.user?.id]);
```

**Step 2:** Pass `profileComplete` prop to `CandidateApplicationCard`:

```tsx
<CandidateApplicationCard 
  key={app.id} 
  application={app} 
  onRefresh={fetchApplications} 
  profileComplete={profileComplete} 
/>
```

**Step 3:** Conditionally render button in the card:

```tsx
{stageInfo.action.label === 'Complete Profile' && profileComplete ? (
  <Button disabled className="bg-emerald-500/20 text-emerald-400 cursor-not-allowed">
    <CheckCircle className="h-4 w-4 mr-2" />
    Profile Complete
  </Button>
) : (
  <Link href={stageInfo.action.href}>
    <Button className="...">
      {stageInfo.action.label}
    </Button>
  </Link>
)}
```

### Result
- If profile is incomplete: Shows "Complete Profile" button (clickable, links to profile page)
- If profile is complete: Shows "Profile Complete" button (disabled, green checkmark)

---

## Fix #8: Status Badge Case Sensitivity on Application Detail Page

### Problem
On `/candidate/applications/[id]` (individual application detail page), the status badge in the upper right displayed raw enum values like "submitted" instead of properly formatted "Submitted".

### Solution
**File:** `src/app/(candidate)/candidate/applications/[id]/page.tsx`

Added a status formatter function:

```tsx
const formatStatus = (status?: string) => {
  if (!status) return 'Submitted';
  const formats: Record<string, string> = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'for_verification': 'For Verification',
    'verified': 'Verified',
    'qualified': 'Qualified',
    'shortlisted': 'Shortlisted',
    'interview_scheduled': 'Interview Scheduled',
    'initial_interview': 'Initial Interview',
    'interviewed': 'Interviewed',
    'passed': 'Passed',
    'offer_sent': 'Offer Sent',
    'hired': 'Hired',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn',
    'invited': 'Invited',
  };
  return formats[status.toLowerCase()] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};
```

Updated the badge display:
```tsx
<Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10">
  {formatStatus(application.status)}
</Badge>
```

### Result
- `submitted` → `Submitted`
- `under_review` → `Under Review`
- `interview_scheduled` → `Interview Scheduled`
- All status values now display with proper capitalization

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/candidate/applications/route.ts` | Added `rejection_reason` to query and response |
| `src/components/candidate/CandidateApplicationCard.tsx` | Added rejection reason, JobDetailsModal, work arrangement formatter, profile complete button logic |
| `src/app/(candidate)/candidate/jobs/page.tsx` | Added enum formatters, fetch existing applications to disable "Apply" button |
| `src/components/candidate/JobDetailsModal.tsx` | **NEW FILE** - Modal component for viewing job details |
| `src/app/(candidate)/candidate/profile/page.tsx` | Improved save flow, added success overlay, fixed birthday disabled state, consolidated validation, fixed gender enum |
| `src/app/(candidate)/candidate/interviews/page.tsx` | Fixed duplicate interview display by excluding hero card interview from list |
| `src/app/(candidate)/candidate/applications/page.tsx` | Added profile completion status fetch, pass to card components |
| `src/app/(candidate)/candidate/applications/[id]/page.tsx` | Added status formatter for proper case display |

---

## Database Reference

The rejection reason is stored in:
- **Table:** `job_applications`
- **Column:** `rejection_reason` (text, nullable)

This column is populated when a recruiter rejects an application and provides a reason.

---

## Testing

### Testing Fix #1 (Rejection Reason):
1. Log in as a candidate who has at least one rejected application
2. Navigate to `/candidate/applications`
3. Look for any application with "Rejected" status
4. The rejection reason should now be visible directly on the card with a red background
5. Clicking "More" should NOT show a duplicate "Feedback" section

### Testing Fix #2 (Job Details Modal):
1. Log in as a candidate with at least one application
2. Navigate to `/candidate/applications`
3. Click "More" on any application card to expand it
4. Click the "View Job Details" button
5. A modal should open showing full job details (title, salary, description, requirements, etc.)
6. Click "Close" or click outside the modal to dismiss it
7. Verify you're still on the `/candidate/applications` page (no navigation occurred)

### Testing Fix #3 (Profile Save Flow):
1. Log in as a candidate
2. Navigate to `/candidate/profile`
3. Click "Edit Profile" to enter edit mode
4. Try saving with missing required fields - should see ONE toast listing all missing fields
5. Fill in all required fields including: Gender, Location, Birthday, Bio, Work Status, Expected Salary, Preferred Shift, Preferred Work Setup
6. Click "Save Changes"
7. A success overlay should appear with a checkmark animation
8. The overlay should disappear after ~3 seconds
9. Verify the fields are saved by refreshing the page and checking the values
10. Verify in Supabase `candidate_profiles` table that gender, location, birthday, position, bio are stored correctly

### Testing Fix #4 (Work Arrangement Formatting):
1. Log in as a candidate with applications that have different work arrangements
2. Navigate to `/candidate/applications`
3. Check the work arrangement badges on the application cards
4. Should display: "Remote", "On-Site", "Hybrid" (properly capitalized, not raw enum values)

### Testing Fix #5 (Duplicate Interview):
1. Log in as a candidate with at least one scheduled interview
2. Navigate to `/candidate/interviews`
3. Verify the upcoming interview shows ONLY in the hero card (highlighted section at top)
4. The same interview should NOT appear again in the list below
5. Other interviews (not the next upcoming) should still appear in the list

### Testing Fix #6 (Already Applied Disable):
1. Log in as a candidate who has already applied to some jobs
2. Navigate to `/candidate/jobs`
3. Jobs the candidate has already applied to should show "Applied" button (disabled, green)
4. Jobs not yet applied to should show "Apply Now" button (active, gradient)
5. Apply to a new job - button should immediately change to "Applied"

### Testing Fix #7 (Complete Profile Button):
1. Log in as a candidate with a 100% complete profile
2. Navigate to `/candidate/applications`
3. Find any application with "submitted" or "Application Received" status
4. Click "More" to expand the card
5. The button should show "Profile Complete" (disabled, green with checkmark)
6. Test with incomplete profile: button should show "Complete Profile" (clickable)

### Testing Fix #8 (Status Badge Formatting):
1. Log in as a candidate with at least one application
2. Navigate to `/candidate/applications`
3. Click on any application to view the detail page (e.g., `/candidate/applications/[id]`)
4. Look at the status badge in the upper right corner
5. Should display "Submitted", "Under Review", etc. (properly capitalized, not raw enum values like "submitted")

---

## Notes for Main Branch Merge

- No database migrations required
- No new dependencies added
- The `Application` interface in the page already had `rejectionReason?: string` defined, so TypeScript types are already compatible
- Styling follows existing design patterns (red-tinted background for rejection states)
- New `JobDetailsModal` component uses existing Dialog components from `@/components/shared/ui/dialog`
- Modal fetches data from existing API endpoint `/api/jobs/public/[id]`

