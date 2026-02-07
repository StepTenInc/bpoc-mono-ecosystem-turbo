# Recruiter UI Fixes - January 2026

**Author:** Lovell  
**Date:** January 9, 2026  
**Branch:** (current working branch)

---

## Summary

This document outlines **4 UI fixes** made to the recruiter application detail page in BPOC.IO:

| Fix | Page | Issue | Solution |
|-----|------|-------|----------|
| #1 | `/recruiter/applications/[id]` | Hired & Started Tracking always active in sidebar | Disabled when no data, editable only when data exists |
| #2 | `/recruiter/applications/[id]` | Quick Action buttons inconsistent styling | Added consistent color-coded button styling |
| #3 | `/recruiter/applications/[id]` | Button layout not optimal | Reorganized: General Call top, Review/Shortlist row, Schedule/Profile row |
| #4 | `/recruiter/applications/[id]` | Reject button in header awkward position | Moved Reject Application button below rejection details content |
| #5 | `/recruiter/applications/[id]` | Rejected applications still have active action buttons | Disabled all action buttons when application is rejected |
| #6 | `/recruiter/applications/[id]` | Review button enabled for already shortlisted candidates | Disabled Review button when status is shortlisted |
| #7 | `/recruiter/applications` | Action buttons on cards have inconsistent sizes | Added uniform min-width and centered text |

---

## Fix #1: Hired & Started Tracking Sidebar Section - Conditional Editable State

### Problem
In the Quick Actions sidebar on `/recruiter/applications/[id]`, the "Hired & Started Tracking" component was always displayed with edit capability even when there was no data yet. This was confusing because:
1. There was nothing meaningful to edit
2. Users could accidentally create empty/invalid hired status records
3. The section looked active when it should be disabled until relevant data exists

### Solution

#### 1. Application Detail Page Update
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

Changed the HiredStatus rendering logic to conditionally pass `editable` based on whether data exists:

```tsx
// Before: Always editable
{application.status !== 'hired' && !application.started_status && (
  <HiredStatus
    applicationId={application.id}
    offerAcceptanceDate={application.offer_acceptance_date}
    contractSigned={application.contract_signed}
    firstDayDate={application.first_day_date}
    startedStatus={application.started_status}
    onUpdate={handleUpdate}
    editable={true}
  />
)}

// After: Only editable when data exists
{(() => {
  const hasHiredData = !!(
    application.offer_acceptance_date ||
    application.contract_signed ||
    application.first_day_date ||
    application.started_status
  );
  // Don't show if already hired (main area shows it)
  if (application.status === 'hired') return null;
  
  return (
    <HiredStatus
      applicationId={application.id}
      offerAcceptanceDate={application.offer_acceptance_date}
      contractSigned={application.contract_signed}
      firstDayDate={application.first_day_date}
      startedStatus={application.started_status}
      onUpdate={handleUpdate}
      editable={hasHiredData}
    />
  );
})()}
```

#### 2. HiredStatus Component Update
**File:** `src/components/shared/application/HiredStatus.tsx`

Added `hasData` variable to track if any hired-related data exists:

```tsx
// Added hasData check
const hasData = !!(offerAcceptanceDate || contractSigned || firstDayDate || startedStatus);
```

Updated the Card styling to show disabled state:

```tsx
<Card className={`border-white/10 ${!editable && !hasData ? 'bg-white/[0.02] opacity-60' : 'bg-white/5'}`}>
```

Added "No Data Yet" badge when section is disabled:

```tsx
{!editable && !hasData && (
  <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs">
    No Data Yet
  </Badge>
)}
```

Added placeholder content for disabled state:

```tsx
) : !editable && !hasData ? (
  // Disabled state when no data and not editable
  <div className="text-center py-4">
    <Award className="h-8 w-8 text-gray-600 mx-auto mb-2" />
    <p className="text-gray-500 text-sm">
      Hired & started tracking data will appear here once the candidate is hired.
    </p>
  </div>
) : (
  // Normal view state with data
  ...
)
```

### Result
- When there's NO hired data: Section appears disabled/dimmed with "No Data Yet" badge and placeholder message
- When there IS hired data: Section is fully active and editable
- When application status is 'hired': Section doesn't show in sidebar (already shown in main content area)
- Visual feedback is clear - users know immediately if they can interact with the section

---

## Fix #2: Quick Actions Buttons - Consistent Color-Coded Styling

### Problem
The Quick Actions buttons in the sidebar had inconsistent styling:
- "Review" and "Shortlist" buttons had proper color-coded borders/text
- "Schedule Interview" and "View Candidate Profile" buttons had plain default styling
- This made the UI look inconsistent and unprofessional

### Solution
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

Added consistent color-coded styling to all Quick Action buttons:

#### Schedule Interview Button
```tsx
// Before
<Button
  variant="outline"
  className="w-full justify-start"
  onClick={() => setScheduleOpen((v) => !v)}
>
  <Calendar className="h-4 w-4 mr-2" />
  Schedule Interview
</Button>

// After
<Button
  variant="outline"
  className="w-full justify-start border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
  onClick={() => setScheduleOpen((v) => !v)}
>
  <Calendar className="h-4 w-4 mr-2" />
  Schedule Interview
</Button>
```

#### View Candidate Profile Button
```tsx
// Before
<Link href={`/recruiter/talent/${application.candidate_id}`}>
  <Button variant="outline" className="w-full justify-start">
    <User className="h-4 w-4 mr-2" />
    View Candidate Profile
  </Button>
</Link>

// After
<Link href={`/recruiter/talent/${application.candidate_id}`}>
  <Button variant="outline" className="w-full justify-start border-blue-500/30 text-blue-300 hover:bg-blue-500/10">
    <User className="h-4 w-4 mr-2" />
    View Candidate Profile
  </Button>
</Link>
```

### Button Color Scheme Summary
| Button | Color | Rationale |
|--------|-------|-----------|
| Review | Cyan | Information/processing status |
| Shortlist | Purple | Selection/highlight action |
| General Call (VideoCallButton) | Emerald | Communication/positive action |
| Schedule Interview | Orange | Calendar/scheduling action |
| View Candidate Profile | Blue | Navigation/view action |

### Result
- All Quick Action buttons now have consistent color-coded styling
- Colors semantically match the action type
- Hover states are consistent across all buttons
- Better visual hierarchy and user experience

---

## Fix #3: Quick Actions Button Layout Reorganization

### Problem
The Quick Actions sidebar button layout was not optimal:
- VideoCallButton (General Call) was placed in the middle of other buttons
- Schedule Interview and View Candidate Profile were on separate rows
- The layout didn't efficiently use the available space

### Solution
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

Reorganized the button layout with the following structure:

1. **General Call Button** - Full width at top (most common action)
2. **Review & Shortlist** - Grid row with 2 columns
3. **Schedule & Profile** - Grid row with 2 columns (shortened labels to fit)

```tsx
<CardContent className="space-y-3">
  {/* General Call Button - Full Width */}
  <VideoCallButton
    // ... props
    className="w-full justify-center"
  />

  {/* Review & Shortlist Buttons - Grid Row */}
  {application.status !== 'rejected' && application.status !== 'hired' && (
    <div className="grid grid-cols-2 gap-2">
      <Button className="w-full justify-center ...">Review</Button>
      <Button className="w-full justify-center ...">Shortlist</Button>
    </div>
  )}

  {/* Schedule Interview & View Profile - Grid Row */}
  <div className="grid grid-cols-2 gap-2">
    <Button className="w-full justify-center ...">Schedule</Button>
    <Link href={...} className="w-full">
      <Button className="w-full justify-center ...">Profile</Button>
    </Link>
  </div>

  {/* Schedule Interview Expanded Panel */}
  {scheduleOpen && ( ... )}
</CardContent>
```

### Button Label Changes
- "Schedule Interview" → "Schedule" (fits better in grid)
- "View Candidate Profile" → "Profile" (fits better in grid)

### Result
- General Call is prominently displayed at the top (most used action)
- Review and Shortlist are grouped together logically
- Schedule and Profile share a row, maximizing space efficiency
- All buttons are center-aligned for visual balance
- Cleaner, more organized Quick Actions panel

---

## Fix #4: Reject Application Button Position

### Problem
In the RejectionInfo component, the "Reject Application" button was placed in the card header next to the title. This was awkward because:
- It cluttered the header
- The button position was inconsistent with other action patterns
- Users expected action buttons to be at the bottom of content sections

### Solution
**File:** `src/components/shared/application/RejectionInfo.tsx`

Moved the "Reject Application" button from the header to below the card content:

```tsx
// Before - Button in header
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle className="text-white flex items-center gap-2">
      <XCircle className="h-5 w-5 text-red-400" />
      Rejection Details
    </CardTitle>
    {editable && !rejectionReason && (
      <Button variant="destructive" size="sm" onClick={() => setShowRejectDialog(true)}>
        <XCircle className="h-4 w-4 mr-2" />
        Reject Application
      </Button>
    )}
  </div>
</CardHeader>

// After - Button below content
<CardHeader>
  <CardTitle className="text-white flex items-center gap-2">
    <XCircle className="h-5 w-5 text-red-400" />
    Rejection Details
  </CardTitle>
</CardHeader>
<CardContent className="space-y-4">
  {rejectionReason ? (
    // ... rejection details display
  ) : (
    <p className="text-gray-500 text-sm">No rejection details recorded yet.</p>
  )}
  
  {/* Reject Application Button - Below Content */}
  {editable && !rejectionReason && (
    <Button variant="destructive" className="w-full" onClick={() => setShowRejectDialog(true)}>
      <XCircle className="h-4 w-4 mr-2" />
      Reject Application
    </Button>
  )}
</CardContent>
```

### Additional Change
- Added placeholder text "No rejection details recorded yet." when no rejection reason exists
- Made the button full-width for better visibility

### Result
- Cleaner card header with just the title
- Action button is now at the bottom of the section (consistent with UX patterns)
- Full-width button is more prominent and easier to click
- Added helpful placeholder text when no rejection data exists

---

## Fix #5: Disable All Actions When Application is Rejected

### Problem
When an application was rejected, recruiters could still see and click action buttons like:
- General Call button
- Schedule Interview button
- Release To Client button
- Review/Shortlist buttons (these were already hidden)
- Hired & Started Tracking section

This was confusing because rejected applications shouldn't have further actions available.

### Solution
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

#### 1. Added Rejection Notice Banner
When the application is rejected, a prominent notice appears at the top of Quick Actions:

```tsx
{application.status === 'rejected' && (
  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
    <p className="text-red-400 text-sm text-center font-medium">
      This application has been rejected. Actions are disabled.
    </p>
  </div>
)}
```

#### 2. Disabled General Call Button
Replaced the VideoCallButton with a disabled placeholder when rejected:

```tsx
{application.status !== 'rejected' ? (
  <VideoCallButton ... />
) : (
  <Button
    disabled
    className="w-full justify-center bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed"
  >
    <Calendar className="h-4 w-4 mr-2" />
    General Call
  </Button>
)}
```

#### 3. Disabled Schedule Interview Button
Added disabled state and styling for rejected applications:

```tsx
<Button
  variant="outline"
  className={`w-full justify-center ${
    application.status === 'rejected'
      ? 'border-gray-500/20 text-gray-500 cursor-not-allowed'
      : 'border-orange-500/30 text-orange-300 hover:bg-orange-500/10'
  }`}
  disabled={application.status === 'rejected'}
>
```

#### 4. Hidden Schedule Interview Panel
The expanded scheduling panel won't open for rejected applications:

```tsx
{scheduleOpen && application.status !== 'rejected' && ( ... )}
```

#### 5. Hidden Hired & Started Tracking Section
Rejected applications don't show the hired tracking section in sidebar:

```tsx
// Don't show for rejected applications
if (application.status === 'rejected') return null;
```

#### 6. Disabled Release To Client Buttons
Replaced buttons with a notice for rejected applications:

```tsx
{application.status === 'rejected' ? (
  <div className="w-full p-2 rounded-lg bg-red-500/10 border border-red-500/20">
    <p className="text-red-400 text-xs text-center">
      Cannot release rejected applications to client
    </p>
  </div>
) : (
  // Normal buttons
)}
```

### What Remains Enabled for Rejected Applications
- **View Candidate Profile button** - Recruiters can still view the candidate's profile
- **Resume viewing** - The resume section remains accessible
- **Rejection Info display** - Shows the rejection reason and details in the main content area
- **Activity Timeline** - Shows the history of the application
- **Call Artifacts** - Previous call recordings remain viewable

### Result
- Clear visual indication that the application is rejected
- All action buttons are disabled/hidden appropriately
- Recruiters can still view details but cannot take further actions
- Consistent experience between list page and detail page

---

## Fix #6: Disable Review Button When Candidate is Already Shortlisted

### Problem
When a candidate was already shortlisted, the "Review" button was still enabled. Clicking it would move the candidate backwards in the pipeline from "shortlisted" to "under_review", which doesn't make logical sense.

### Solution
**File:** `src/app/(recruiter)/recruiter/applications/[id]/page.tsx`

Updated the Review button to be disabled when the application status is already `shortlisted`:

```tsx
<Button
  variant="outline"
  className={`w-full justify-center ${
    application.status === 'under_review' || application.status === 'shortlisted'
      ? 'border-gray-500/20 text-gray-500 cursor-not-allowed'
      : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
  }`}
  onClick={() => updateApplicationStatus('under_review')}
  disabled={!!statusLoading || application.status === 'under_review' || application.status === 'shortlisted'}
  title={application.status === 'shortlisted' ? 'Already shortlisted' : 'Mark as Under Review'}
>
  ...
  Review
</Button>
```

Also updated the Shortlist button to show disabled styling when already shortlisted:

```tsx
className={`w-full justify-center ${
  application.status === 'shortlisted'
    ? 'border-gray-500/20 text-gray-500 cursor-not-allowed'
    : 'border-purple-500/30 text-purple-300 hover:bg-purple-500/10'
}`}
```

### Result
- When status is `submitted`: Both Review and Shortlist are enabled
- When status is `under_review`: Review is disabled, Shortlist is enabled
- When status is `shortlisted`: Both Review and Shortlist are disabled (grayed out)
- Proper tooltip shows "Already shortlisted" when hovering over disabled buttons

---

## Fix #7: Uniform Button Sizes and Order on Application Cards

### Problem
On the `/recruiter/applications` list page:
1. Action buttons had inconsistent sizes (different heights and widths)
2. Button order was not intuitive (Reject appeared before Call/Schedule)

### Solution
**Files:** 
- `src/app/(recruiter)/recruiter/applications/page.tsx`
- `src/components/video/VideoCallButton.tsx`

#### 1. Reordered Buttons
Changed button order for `under_review` and `shortlisted` statuses to: **Call → Schedule → Reject**

#### 2. Uniform Button Sizing
Added consistent `h-8 px-3 min-w-[100px]` to all action buttons:

```tsx
<Button 
  size="sm" 
  className="h-8 px-3 min-w-[100px] justify-center ..."
>
```

#### 3. Updated VideoCallButton Compact Variant
Made the compact variant match other button sizes and use solid color:

```tsx
// Before
className={`... border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 ...`}

// After
className={`... bg-emerald-500 hover:bg-emerald-600 text-white ...`}
```

#### 4. Updated Reject Button to Solid Color
Changed from outline style to solid red:

```tsx
// Before
className="... border-red-500/30 text-red-400 hover:bg-red-500/10"

// After  
className="... bg-red-500 hover:bg-red-600 text-white"
```

### Button Order by Status:
| Status | Buttons (in order) |
|--------|-------------------|
| `submitted` | Review, Reject |
| `under_review` | Shortlist, Call, Schedule, Reject |
| `shortlisted` | Call, Schedule, Reject |
| `interview_scheduled` | View Interview |
| `hired` | View Placement |

### Button Sizing:
| Property | Value | Effect |
|----------|-------|--------|
| `h-8` | 32px height | Uniform height |
| `px-3` | 12px horizontal padding | Consistent padding |
| `min-w-[100px]` | 100px minimum width | Consistent width |
| `justify-center` | Center alignment | Centered text/icons |

### Result
- All action buttons now have identical heights and consistent widths
- Buttons are ordered logically: Call → Schedule → Reject
- VideoCallButton compact variant matches other button sizes
- Professional, uniform appearance across all cards

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/(recruiter)/recruiter/applications/[id]/page.tsx` | Updated HiredStatus editable logic, added button styling, reorganized button layout, disabled actions for rejected apps |
| `src/app/(recruiter)/recruiter/applications/page.tsx` | Reordered buttons (Call, Schedule, Reject), added uniform sizing (h-8 px-3 min-w-[100px]) |
| `src/components/video/VideoCallButton.tsx` | Updated compact variant padding/sizing to match other buttons |
| `src/components/shared/application/HiredStatus.tsx` | Added disabled state UI, "No Data Yet" badge, placeholder content |
| `src/components/shared/application/RejectionInfo.tsx` | Moved Reject button to below content, added placeholder text, full-width button |

---

## Testing

### Testing Fix #1 (Hired Status Conditional State):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for an application that:
   - Is NOT in 'hired' status
   - Has NO hired tracking data (no offer_acceptance_date, contract_signed, first_day_date, started_status)
3. Look at the Quick Actions sidebar on the right
4. The "Hired & Started Tracking" section should:
   - Appear dimmed/grayed out (opacity reduced)
   - Show "No Data Yet" badge in the header
   - Display placeholder text: "Hired & started tracking data will appear here once the candidate is hired."
   - NOT have an "Edit" button
5. Now test with an application that HAS some hired data:
   - The section should be fully visible (not dimmed)
   - An "Edit" button should appear
   - Clicking Edit should allow modifying the data

### Testing Fix #2 (Button Styling):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]`
3. Look at the Quick Actions sidebar
4. Verify all buttons have consistent color-coded styling:
   - Review: Cyan border/text
   - Shortlist: Purple border/text
   - Schedule: Orange border/text
   - Profile: Blue border/text
5. Hover over each button - verify the hover background matches the button's color scheme

### Testing Fix #3 (Button Layout):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]`
3. Look at the Quick Actions sidebar layout:
   - **Top row**: General Call button (full width, green gradient)
   - **Second row**: Review and Shortlist buttons side by side (if not rejected/hired)
   - **Third row**: Schedule and Profile buttons side by side
4. Verify the buttons are center-aligned and evenly spaced
5. Click "Schedule" - verify the interview scheduling panel expands below
6. Click "Profile" - verify it navigates to the candidate profile page

### Testing Fix #4 (Reject Button Position):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for a non-rejected application
3. Look at the "Rejection Details" card in the Quick Actions sidebar
4. Verify:
   - The card header shows only the title "Rejection Details" (no button in header)
   - Below the header, there should be placeholder text: "No rejection details recorded yet."
   - The "Reject Application" button should be full-width, below the placeholder text
5. Click "Reject Application" - verify the rejection dialog opens
6. For an already-rejected application, verify:
   - The rejection reason and details are displayed
   - No "Reject Application" button is shown (already rejected)

### Testing Fix #5 (Disabled Actions for Rejected Applications):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for a **rejected** application
3. Verify Quick Actions sidebar:
   - Red notice banner: "This application has been rejected. Actions are disabled."
   - General Call button is disabled (grayed out)
   - Schedule button is disabled (grayed out)
   - Profile button is still enabled (can view candidate profile)
   - Review and Shortlist buttons are NOT shown
   - Rejection Details section is NOT shown (already rejected)
   - Hired & Started Tracking section is NOT shown
4. Verify Release To Client section (main content area):
   - Buttons are replaced with: "Cannot release rejected applications to client"
5. Verify these elements remain functional for rejected applications:
   - View Candidate Profile link
   - Resume download/view
   - Activity Timeline display
   - Call Artifacts display (previous recordings)
   - Rejection Info in main content area (showing rejection details)
6. Compare with a non-rejected application:
   - All action buttons should be enabled
   - No rejection notice banner
   - Release To Client buttons are active

### Testing Fix #6 (Review Button Disabled When Shortlisted):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications/[id]` for a **shortlisted** application
3. Verify Quick Actions sidebar:
   - Review button is disabled (grayed out, `cursor-not-allowed`)
   - Shortlist button is disabled (grayed out, already shortlisted)
   - Hover over Review button - tooltip should show "Already shortlisted"
4. Navigate to an application with status `submitted`:
   - Both Review and Shortlist buttons should be enabled
5. Navigate to an application with status `under_review`:
   - Review button should be disabled
   - Shortlist button should be enabled

### Testing Fix #7 (Uniform Button Sizes):
1. Log in as a recruiter
2. Navigate to `/recruiter/applications`
3. Look at the action buttons on each application card
4. Verify:
   - All buttons (Review, Shortlist, Reject, Call, Schedule) have the same minimum width
   - Button text is centered within each button
   - Buttons align nicely when multiple are shown on the same card
5. Check different application statuses:
   - `submitted`: Review and Reject buttons visible
   - `under_review`: Shortlist, Reject, Call, and Schedule buttons visible
   - `shortlisted`: Reject, Call, and Schedule buttons visible
   - `interview_scheduled`: View Interview button visible
   - `hired`: View Placement button visible

---

## Notes for Main Branch Merge

- No database migrations required
- No new dependencies added
- Changes are backward compatible
- The `HiredStatus` component styling update may affect other pages that use this component:
  - Admin application detail page
  - Any other pages using `HiredStatus` component
- The disabled state only shows when `editable=false` AND no data exists, so existing usages should work correctly
- The `RejectionInfo` component changes affect all pages using this component:
  - Recruiter application detail page
  - Admin application detail page
  - The button position change improves UX across all portals
- Fix #5 (rejected application disabled actions) only affects the recruiter application detail page
  - The applications list page already hides action buttons for rejected applications
  - Admin application detail page may need similar treatment if desired

