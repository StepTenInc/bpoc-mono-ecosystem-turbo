# Recruiter UI Styling Guide

**For:** Gemini AI Design Polish
**Date:** January 5, 2026
**Features:** Counter Offer Manager + Onboarding Task Manager

---

## 🎨 BPOC Design System Reference

### Color Palette
```css
/* Background */
--bg-primary: #0F1419;
--bg-secondary: #1a1f26;

/* Glass Effects */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-hover: rgba(255, 255, 255, 0.10);

/* Brand Colors */
--orange-primary: #f97316;    /* Orange-600 */
--orange-hover: #ea580c;      /* Orange-700 */
--orange-light: rgba(249, 115, 22, 0.1);
--orange-border: rgba(249, 115, 22, 0.3);

--cyan-primary: #06b6d4;      /* Cyan-500 */
--cyan-hover: #0891b2;        /* Cyan-600 */
--cyan-light: rgba(6, 182, 212, 0.1);
--cyan-border: rgba(6, 182, 212, 0.3);

/* Status Colors */
--emerald-primary: #10b981;   /* Success */
--red-primary: #ef4444;       /* Danger/Error */
--amber-primary: #f59e0b;     /* Warning */
--purple-primary: #a855f7;    /* Info */
--gray-primary: #6b7280;      /* Neutral */

/* Text Colors */
--text-white: #ffffff;
--text-gray-300: #d1d5db;
--text-gray-400: #9ca3af;
--text-gray-500: #6b7280;
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 1️⃣ Counter Offer Manager Component

### File Location
`/src/components/recruiter/CounterOfferManager.tsx`

### Component Structure
```
Counter Offer Card (if counter exists)
├─ Header Section
│  ├─ Icon (TrendingUp) + Title
│  └─ Status Badge (Pending Response)
├─ Salary Comparison Grid (2 columns)
│  ├─ Original Offer Card
│  └─ Candidate Requests Card
├─ Candidate Message (if provided)
├─ Action Buttons (3 buttons)
│  ├─ Accept Counter (Green)
│  ├─ Send New Counter (Orange)
│  └─ Decline (Red)
└─ Info Tip (bottom)
```

### Current Styling

#### Main Card
```tsx
className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30"
```
- **Purpose:** Highlight that action is needed
- **Design:** Orange gradient background with orange border
- **Effect:** Draws attention to pending counter offers

#### Header
```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <TrendingUp className="h-5 w-5 text-orange-500" />
    <h3 className="text-lg font-semibold text-white">Counter Offer Received</h3>
  </div>
  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
    Pending Response
  </Badge>
</div>
```

#### Salary Comparison Cards

**Original Offer:**
```tsx
<div className="p-4 rounded-lg bg-white/5 border border-white/10">
  <p className="text-sm text-gray-400 mb-1">Original Offer</p>
  <p className="text-xl font-bold text-white">
    {currency} {originalSalary.toLocaleString()}
  </p>
  <p className="text-xs text-gray-500">/ {salaryType}</p>
</div>
```
- Background: Subtle white glass effect
- Text hierarchy: Label (gray) → Amount (white bold) → Period (gray small)

**Requested Salary:**
```tsx
<div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
  <p className="text-sm text-gray-400 mb-1">Candidate Requests</p>
  <p className="text-xl font-bold text-white">
    {requestedCurrency} {requestedSalary.toLocaleString()}
  </p>
  <p className="text-xs text-orange-400">
    +{currency} {difference.toLocaleString()} ({percentageIncrease}% increase)
  </p>
</div>
```
- Background: Orange highlight
- Difference shown in orange to emphasize increase

#### Candidate Message
```tsx
<div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
  <div className="flex items-start gap-2 mb-2">
    <MessageSquare className="h-4 w-4 text-cyan-400 mt-0.5" />
    <p className="text-sm font-medium text-cyan-400">Candidate's Justification:</p>
  </div>
  <p className="text-sm text-gray-300 pl-6">
    {candidateMessage}
  </p>
</div>
```
- Cyan accent for message indicator
- Indented text for visual hierarchy

#### Action Buttons
```tsx
/* Accept - Success */
<Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
  <Check className="h-4 w-4 mr-2" />
  Accept Counter
</Button>

/* Send New Counter - Primary */
<Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20">
  <ArrowRight className="h-4 w-4 mr-2" />
  Send New Counter
</Button>

/* Decline - Danger */
<Button
  variant="outline"
  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
>
  <X className="h-4 w-4 mr-2" />
  Decline
</Button>
```
- **Color coding:** Green = positive action, Orange = neutral/continue, Red = negative
- **Shadows:** Subtle colored shadows for depth
- **Icons:** Left-aligned icons for better UX

#### Info Tip
```tsx
<div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
  <AlertCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
  <p className="text-xs text-cyan-300">
    <strong>Tip:</strong> Consider market rates...
  </p>
</div>
```
- Cyan background for informational notes
- Small text size for secondary info

### Dialogs

#### Send New Counter Dialog
```tsx
<DialogContent className="bg-[#0F1419] border-white/10 text-gray-300">
  <DialogHeader>
    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
      <TrendingUp className="h-5 w-5 text-orange-500" />
      Send New Counter Offer
    </DialogTitle>
    <DialogDescription className="text-gray-400">
      Propose a revised salary to {candidateName}
    </DialogDescription>
  </DialogHeader>
  {/* ... */}
</DialogContent>
```

**Comparison Panel:**
```tsx
<div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
  <div className="flex items-center justify-between mb-2">
    <span className="text-gray-400">Original Offer:</span>
    <span className="text-white font-semibold">{currency} {originalSalary.toLocaleString()}</span>
  </div>
  <div className="flex items-center justify-between">
    <span className="text-gray-400">They Requested:</span>
    <span className="text-orange-400 font-semibold">
      {currency} {requestedSalary.toLocaleString()}
    </span>
  </div>
</div>
```

**Input Field:**
```tsx
<div className="relative">
  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input
    type="number"
    className="pl-10 bg-white/5 border-white/10 text-white"
    placeholder="Enter amount"
  />
</div>
```
- Icon inside input for better UX
- Glass background consistent with design system

#### Reject Dialog
```tsx
<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
  <p className="text-sm text-red-400">
    <strong>Note:</strong> Declining will revert the offer to its original terms...
  </p>
</div>
```
- Red warning box for destructive actions

---

## 2️⃣ Onboarding Task Manager Component

### File Location
`/src/components/recruiter/OnboardingTaskManager.tsx`

### Component Structure
```
Onboarding Manager (if hired)
├─ Progress Card
│  ├─ Percentage + Progress Bar
│  └─ Stats Grid (5 stats)
├─ Add Task Button
├─ Tasks List
│  ├─ Task Cards (grouped by status)
│  │  ├─ Status badge + Type badge
│  │  ├─ Title + Description
│  │  ├─ Due date + Required indicator
│  │  └─ Action button (Review if submitted)
│  └─ Empty State (if no tasks)
├─ Create Task Dialog
│  ├─ Task Type Selector (6 options with icons)
│  ├─ Title + Description fields
│  ├─ Due Date Picker
│  └─ Required Toggle
├─ Review Task Dialog
│  ├─ Submission details
│  ├─ Uploaded files / Form data
│  └─ Approve / Reject buttons
└─ Mark Complete Button (if 100%)
```

### Current Styling

#### Progress Card
```tsx
<Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-cyan-500/10 border-white/10">
  <CardContent className="p-6">
    {/* Circular Progress */}
    <div className="text-center mb-6">
      <div className="text-5xl font-bold text-white mb-2">{percentage}%</div>
      <div className="w-full bg-white/10 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-orange-500 to-cyan-500 h-3 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-gray-400 text-sm mt-2">Onboarding Progress</p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-5 gap-3">
      <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-2xl font-bold text-emerald-400">{completed}</p>
        <p className="text-xs text-gray-400">Completed</p>
      </div>
      {/* ... more stats */}
    </div>
  </CardContent>
</Card>
```
- **Gradient:** Orange → Amber → Cyan for visual interest
- **Progress Bar:** Matches gradient theme
- **Stats:** Color-coded by status (emerald = good, red = needs attention)

#### Task Cards

**Completed Task:**
```tsx
<Card className="bg-white/5 border-l-4 border-l-emerald-500/50 border-white/10">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-emerald-400" />
        <div>
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    </div>
  </CardContent>
</Card>
```
- **Left Border:** Color-coded by status (emerald, gray, cyan, red)
- **Icons:** Status icon + badge for quick visual scanning

**Submitted Task (Needs Review):**
```tsx
<Card className="bg-cyan-500/5 border-l-4 border-l-cyan-500 border-cyan-500/30">
  <CardContent className="p-4">
    {/* ... */}
    <div className="mt-3">
      <Button
        size="sm"
        className="bg-cyan-600 hover:bg-cyan-700 text-white"
      >
        <Eye className="h-4 w-4 mr-1" />
        Review Submission
      </Button>
    </div>
  </CardContent>
</Card>
```
- **Highlight:** Cyan background + border to draw attention
- **Action:** Prominent "Review" button

**Overdue Task:**
```tsx
<Card className="bg-red-500/5 border-l-4 border-l-red-500 border-red-500/30">
  <CardContent className="p-4">
    <div className="flex items-center gap-2 mb-2">
      <h4 className="text-white font-medium">{title}</h4>
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Overdue
      </Badge>
    </div>
    <p className="text-sm text-red-400">Due: {dueDate}</p>
  </CardContent>
</Card>
```
- **Alert:** Red theme throughout
- **Warning Badge:** AlertTriangle icon

#### Create Task Dialog

**Task Type Grid:**
```tsx
<div className="grid grid-cols-2 gap-3">
  {/* Document Upload */}
  <button
    onClick={() => setTaskType('document_upload')}
    className={`p-4 rounded-lg border-2 transition-all text-left ${
      taskType === 'document_upload'
        ? 'border-orange-500 bg-orange-500/10'
        : 'border-white/10 bg-white/5 hover:border-white/20'
    }`}
  >
    <Upload className="h-5 w-5 text-orange-500 mb-2" />
    <p className="font-medium text-white text-sm">Document Upload</p>
    <p className="text-xs text-gray-400">Request file uploads</p>
  </button>
  {/* ... more types */}
</div>
```
- **Selection:** Orange border + background when selected
- **Icons:** Unique icon for each task type (Upload, FileText, PenTool, CheckSquare, GraduationCap, Info)
- **Layout:** 2-column grid for easy scanning

**Task Types with Icons:**
1. **document_upload** → Upload icon (Orange)
2. **form_fill** → FileText icon (Cyan)
3. **e_sign** → PenTool icon (Purple)
4. **acknowledgment** → CheckSquare icon (Emerald)
5. **training** → GraduationCap icon (Blue)
6. **information** → Info icon (Gray)

#### Review Dialog

**Submission Display:**
```tsx
<div className="p-4 rounded-lg bg-white/5 border border-white/10">
  <h4 className="text-sm font-medium text-gray-400 mb-3">Submission Details:</h4>

  {/* File Uploads */}
  {files.length > 0 && (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Uploaded Files:</p>
      {files.map(file => (
        <div className="flex items-center gap-2 p-2 rounded bg-white/5">
          <FileText className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-white">{file.name}</span>
          <Button size="sm" variant="ghost">Download</Button>
        </div>
      ))}
    </div>
  )}

  {/* Form Data */}
  {formData && (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-2">Form Response:</p>
      <pre className="p-3 rounded bg-black/30 text-xs text-gray-300 overflow-auto">
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
  )}
</div>
```

**Approve/Reject Buttons:**
```tsx
<div className="flex gap-3 mt-6">
  <Button
    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
    onClick={() => handleReview('approved')}
  >
    <CheckCircle className="h-4 w-4 mr-2" />
    Approve
  </Button>
  <Button
    variant="outline"
    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
    onClick={() => setShowRejectReason(true)}
  >
    <XCircle className="h-4 w-4 mr-2" />
    Reject
  </Button>
</div>
```
- **Side-by-side:** Equal width for balanced layout
- **Clear actions:** Green = approve, Red = reject

**Feedback Textarea (on reject):**
```tsx
<Textarea
  placeholder="Explain what needs to be corrected..."
  className="bg-white/5 border-white/10 text-white min-h-[100px]"
  value={reviewerNotes}
  onChange={(e) => setReviewerNotes(e.target.value)}
/>
```

#### Empty State
```tsx
<Card className="bg-white/5 border-white/10 border-dashed">
  <CardContent className="p-12 text-center">
    <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">
      No Onboarding Tasks Yet
    </h3>
    <p className="text-gray-400 mb-6">
      Get started by creating the first onboarding task for {candidateName}
    </p>
    <Button
      className="bg-gradient-to-r from-orange-500 to-amber-600"
      onClick={() => setShowCreateDialog(true)}
    >
      <Plus className="h-4 w-4 mr-2" />
      Create First Task
    </Button>
  </CardContent>
</Card>
```
- **Dashed Border:** Indicates placeholder state
- **Large Icon:** Visual anchor
- **CTA Button:** Orange gradient to match brand

---

## 🎯 Animation & Interactions

### Framer Motion Animations
```tsx
/* Card Entry */
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  {/* Content */}
</motion.div>

/* Staggered List */
{tasks.map((task, index) => (
  <motion.div
    key={task.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {/* Task Card */}
  </motion.div>
))}
```

### Loading States
```tsx
{loading && (
  <div className="flex items-center justify-center p-6">
    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
  </div>
)}
```

### Hover Effects
```tsx
/* Cards */
className="transition-all hover:border-cyan-500/30 hover:scale-[1.01]"

/* Buttons */
className="transition-colors hover:bg-orange-700"
```

---

## 📏 Spacing & Layout

### Card Padding
- **Large Cards:** `p-6` (24px)
- **Medium Cards:** `p-4` (16px)
- **Small Cards:** `p-3` (12px)

### Gap Spacing
- **Between sections:** `space-y-6` (24px)
- **Between cards:** `space-y-4` (16px)
- **Between elements:** `gap-3` or `gap-4` (12-16px)
- **Icon-text gaps:** `gap-2` (8px)

### Border Radius
- **Cards:** `rounded-lg` (8px)
- **Buttons:** `rounded-md` (6px)
- **Badges:** `rounded-full` or `rounded-md`
- **Inputs:** `rounded-md` (6px)

---

## 🔤 Icon Usage

### Icon Library
All icons from `lucide-react`:
- TrendingUp, Check, X, ArrowRight
- CheckCircle, XCircle, Clock, AlertTriangle
- Upload, FileText, PenTool, CheckSquare, GraduationCap, Info
- MessageSquare, DollarSign, Eye, Loader2, Plus, Briefcase

### Icon Sizes
- **Large headers:** `h-5 w-5` (20px)
- **Button icons:** `h-4 w-4` (16px)
- **Badge icons:** `h-3 w-3` (12px)
- **Empty state:** `h-16 w-16` (64px)

---

## ✨ Polish Suggestions for Gemini

### Enhance Micro-interactions
1. **Button Press Animation:**
   ```css
   active:scale-95 transition-transform
   ```

2. **Card Hover Lift:**
   ```css
   hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all
   ```

3. **Progress Bar Animation:**
   ```css
   transition-all duration-500 ease-out
   ```

### Improve Visual Hierarchy
1. **Larger Salary Numbers:**
   - Increase font size from `text-xl` to `text-2xl`
   - Add number formatting with commas

2. **Clearer Task Status:**
   - Make status badges slightly larger
   - Add subtle pulse animation to "Submitted" badges

3. **Better Info Tips:**
   - Add subtle background glow
   - Consider dismissible option

### Accessibility Improvements
1. **Focus States:**
   ```css
   focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#0F1419]
   ```

2. **Color Contrast:**
   - Ensure all text meets WCAG AA standards
   - Test with color blindness simulators

3. **Keyboard Navigation:**
   - All interactive elements should be keyboard accessible
   - Add visual focus indicators

### Mobile Responsiveness
1. **Stack on Mobile:**
   ```css
   /* Salary comparison */
   grid grid-cols-1 md:grid-cols-2

   /* Action buttons */
   flex flex-col md:flex-row
   ```

2. **Touch Targets:**
   - Ensure buttons are at least 44x44px
   - Add more padding on mobile

---

## 🎨 Design Consistency Checklist

- [x] All colors from BPOC design system
- [x] Glassmorphism effects consistent
- [x] Orange/Cyan brand colors used appropriately
- [x] Status colors semantically correct (green=success, red=error, etc.)
- [x] Typography hierarchy clear
- [x] Spacing consistent throughout
- [x] Icons from same library (lucide-react)
- [x] Shadows used for depth
- [x] Hover states on all interactive elements
- [x] Loading states handled
- [x] Empty states designed
- [x] Error states handled

---

**End of Recruiter Styling Guide**
