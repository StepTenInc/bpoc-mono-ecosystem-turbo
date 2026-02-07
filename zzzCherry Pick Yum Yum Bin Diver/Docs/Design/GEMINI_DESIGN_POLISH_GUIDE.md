# Design Polish Guide for Gemini AI - Candidate Portal

**Purpose:** Exact specifications to polish candidate UI to 100% perfection
**Target:** All candidate portal pages and components
**Design System:** BPOC Cyber/Tech Aesthetic with Glassmorphism
**Last Updated:** January 5, 2026

---

## Table of Contents

1. [BPOC Design System](#bpoc-design-system)
2. [Color Palette (Exact Codes)](#color-palette-exact-codes)
3. [Typography](#typography)
4. [Component Patterns](#component-patterns)
5. [Page-by-Page Specifications](#page-by-page-specifications)
6. [Animation & Effects](#animation--effects)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)

---

## BPOC Design System

### Core Visual Identity

**Theme:** Cyber/Tech Futuristic Dark Mode
**Aesthetic:** Glassmorphism with Neon Accents
**Mood:** Professional, Modern, High-Tech, Trustworthy

### Design Principles

1. **Dark-First:** Everything on near-black backgrounds
2. **Glass Effects:** Frosted glass cards with transparency
3. **Neon Accents:** Vibrant cyber colors for CTAs and highlights
4. **Depth:** Layered UI with subtle shadows and blurs
5. **Motion:** Smooth micro-interactions and breathing effects
6. **Contrast:** High readability with white/cyan text on dark

---

## Color Palette (Exact Codes)

### Base Colors

```css
/* Primary Background - Almost Black */
--bg-primary: #0B0B0D;
--bg-secondary: #0F1419;
--bg-tertiary: #1A1F2E;

/* Surface Colors (Glass) */
--surface-glass: rgba(255, 255, 255, 0.05);  /* bg-white/5 */
--surface-glass-hover: rgba(255, 255, 255, 0.10);  /* bg-white/10 */
--surface-border: rgba(255, 255, 255, 0.10);  /* border-white/10 */
--surface-border-hover: rgba(255, 255, 255, 0.20);  /* border-white/20 */
```

### Brand Colors (BPOC Official)

```css
/* Primary Brand - Orange (ShoreAgents) */
--orange-50: #FFF7ED;
--orange-500: #F97316;  /* Main orange */
--orange-600: #EA580C;  /* Hover/pressed orange */
--orange-700: #C2410C;

/* Secondary Brand - Cyan (Cyber Blue) */
--cyan-400: #22D3EE;
--cyan-500: #0EA5E9;  /* Main cyber blue */
--cyan-600: #0284C7;

/* Accent - Purple (Electric) */
--purple-400: #C084FC;
--purple-500: #A855F7;  /* Electric purple */
--purple-600: #9333EA;

/* Success - Green (Neon) */
--green-400: #4ADE80;
--green-500: #10B981;  /* Neon green */
--green-600: #059669;

/* Warning - Yellow */
--yellow-400: #FACC15;
--yellow-500: #EAB308;

/* Error - Red */
--red-400: #F87171;
--red-500: #EF4444;
--red-600: #DC2626;
```

### Text Colors

```css
/* Text Hierarchy */
--text-primary: #FFFFFF;          /* Headings, important text */
--text-secondary: #D1D5DB;        /* Body text (gray-300) */
--text-tertiary: #9CA3AF;         /* Labels (gray-400) */
--text-muted: #6B7280;            /* Placeholder, disabled (gray-500) */

/* Tailwind Classes */
.text-white      /* #FFFFFF - Headings */
.text-gray-300   /* #D1D5DB - Body */
.text-gray-400   /* #9CA3AF - Labels */
.text-gray-500   /* #6B7280 - Muted */
```

---

## Typography

### Font Family

```css
/* Primary Font: Geist Sans (Default Next.js font) */
font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (for stats, numbers, code) */
font-family: 'Geist Mono', 'SF Mono', Consolas, monospace;
```

### Font Sizes & Weights

```css
/* Headings */
.text-3xl.font-bold         /* Page titles: 30px, 700 weight */
.text-2xl.font-bold         /* Section headers: 24px, 700 weight */
.text-xl.font-semibold      /* Card titles: 20px, 600 weight */
.text-lg.font-semibold      /* Subsection titles: 18px, 600 weight */

/* Body Text */
.text-base.text-gray-300    /* Primary body: 16px, gray-300 */
.text-sm.text-gray-400      /* Secondary body: 14px, gray-400 */
.text-xs.text-gray-500      /* Caption/meta: 12px, gray-500 */

/* Stats & Numbers (use monospace) */
.text-2xl.font-bold.font-mono   /* Large stats */
.text-lg.font-semibold.font-mono /* Medium stats */
```

### Line Height

```css
.leading-tight    /* 1.25 - Headings */
.leading-normal   /* 1.5 - Body text */
.leading-relaxed  /* 1.625 - Long-form content */
```

---

## Component Patterns

### 1. Cards (Primary Pattern)

**Basic Glass Card:**
```tsx
<Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Gradient Glass Card (Featured):**
```tsx
<Card className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border-orange-500/20">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Hover Card with Glow:**
```tsx
<Card className="bg-white/5 border-white/10 hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all cursor-pointer">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### 2. Buttons

**Primary Button (Orange):**
```tsx
<Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all">
  Click Me
</Button>
```

**Secondary Button (Glass):**
```tsx
<Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all">
  Cancel
</Button>
```

**Cyan Button (Alternative Primary):**
```tsx
<Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/20">
  Submit
</Button>
```

**Ghost Button:**
```tsx
<Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10 transition-all">
  Learn More
</Button>
```

**Icon Button:**
```tsx
<Button variant="ghost" size="icon" className="hover:bg-white/10 text-gray-300 hover:text-white">
  <Bell className="h-5 w-5" />
</Button>
```

### 3. Badges

**Status Badge (Pending):**
```tsx
<Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
  Pending
</Badge>
```

**Status Badge (Success):**
```tsx
<Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
  Approved
</Badge>
```

**Status Badge (Error):**
```tsx
<Badge className="bg-red-500/20 text-red-400 border-red-500/30">
  Rejected
</Badge>
```

**Status Badge (Info):**
```tsx
<Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
  In Review
</Badge>
```

**Status Badge (Negotiating - Orange):**
```tsx
<Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
  Negotiating
</Badge>
```

**Required Badge:**
```tsx
<Badge className="bg-red-500/20 text-red-400 text-xs">
  Required
</Badge>
```

### 4. Progress Bars

**Standard Progress:**
```tsx
<Progress value={65} className="h-3 bg-white/10" />
```

**Custom Colored Progress:**
```tsx
<Progress
  value={65}
  className="h-3 bg-white/10"
  style={{
    '--progress-background': 'linear-gradient(90deg, #F97316, #0EA5E9)',
  }}
/>
```

### 5. Input Fields

**Text Input:**
```tsx
<Input
  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
  placeholder="Enter text..."
/>
```

**Input with Icon:**
```tsx
<div className="relative">
  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input
    type="number"
    className="pl-10 bg-white/5 border-white/10 text-white"
    placeholder="0.00"
  />
</div>
```

**Textarea:**
```tsx
<Textarea
  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 min-h-[100px]"
  placeholder="Enter description..."
/>
```

### 6. Dropdowns

**Dropdown Menu:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    align="end"
    className="bg-[#0F1419] border-white/10"
  >
    <DropdownMenuItem className="text-gray-300 hover:bg-white/10 hover:text-white">
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 7. Modals/Dialogs

**Standard Dialog:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
        <Icon className="h-5 w-5 text-orange-500" />
        Dialog Title
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Description text here
      </DialogDescription>
    </DialogHeader>

    {/* Content */}
    <div className="space-y-4 mt-4">
      {/* Your content */}
    </div>

    {/* Footer Actions */}
    <div className="flex gap-3 pt-4">
      <Button
        variant="outline"
        className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
      >
        Cancel
      </Button>
      <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 8. Loading States

**Spinner:**
```tsx
<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
```

**Full Page Loading:**
```tsx
<div className="flex items-center justify-center min-h-screen">
  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
</div>
```

**Inline Loading:**
```tsx
<Button disabled>
  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  Loading...
</Button>
```

### 9. Empty States

**Standard Empty State:**
```tsx
<Card className="bg-white/5 border-white/10">
  <CardContent className="p-12 text-center">
    <Icon className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-50" />
    <h3 className="text-xl font-semibold text-white mb-2">No Items Found</h3>
    <p className="text-gray-400">
      Description of empty state and what user can do
    </p>
    <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
      Take Action
    </Button>
  </CardContent>
</Card>
```

### 10. Stats Grid

**4-Column Stats:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="text-center">
    <div className="text-2xl font-bold font-mono text-emerald-400">42</div>
    <div className="text-xs text-gray-400">Completed</div>
  </div>
  <div className="text-center">
    <div className="text-2xl font-bold font-mono text-cyan-400">12</div>
    <div className="text-xs text-gray-400">Pending</div>
  </div>
  <div className="text-center">
    <div className="text-2xl font-bold font-mono text-red-400">3</div>
    <div className="text-xs text-gray-400">Overdue</div>
  </div>
  <div className="text-center">
    <div className="text-2xl font-bold font-mono text-white">57</div>
    <div className="text-xs text-gray-400">Total</div>
  </div>
</div>
```

---

## Page-by-Page Specifications

### 1. Onboarding Page (`/candidate/onboarding`)

**Current File:** `src/app/(candidate)/candidate/onboarding/page.tsx`

**Layout Structure:**
```tsx
<div className="space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-3xl font-bold text-white">Onboarding</h1>
    <p className="text-gray-400 mt-1">Complete your onboarding tasks to get started</p>
  </div>

  {/* Progress Card */}
  <Card className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border-orange-500/20">
    <CardContent className="p-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
          <p className="text-sm text-gray-400">
            {completed} of {total} tasks completed
          </p>
        </div>
        <div className="text-3xl font-bold font-mono text-orange-500">
          {percentage}%
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={percentage} className="h-3 mb-4" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* See Stats Grid pattern above */}
      </div>
    </CardContent>
  </Card>

  {/* Tasks List */}
  <div className="space-y-4">
    {tasks.map((task) => (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          className={`
            bg-white/5
            border-white/10
            hover:border-orange-500/30
            transition-all
            cursor-pointer
            ${isOverdue ? 'border-red-500/30' : ''}
          `}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Task Icon */}
              <div className={`
                p-3
                rounded-lg
                ${task.status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-orange-500/20 text-orange-400'}
              `}>
                {getTaskIcon(task.taskType)}
              </div>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {task.title}
                      {task.isRequired && (
                        <Badge className="bg-red-500/20 text-red-400 text-xs">
                          Required
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {task.jobTitle} at {task.company}
                    </p>
                  </div>
                  {getStatusBadge(task.status, task.dueDate)}
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-sm text-gray-300 mb-3">{task.description}</p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {formatDate(task.dueDate)}
                    </div>
                  )}
                  {task.submittedAt && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Submitted {formatDate(task.submittedAt)}
                    </div>
                  )}
                </div>

                {/* Reviewer feedback */}
                {task.reviewerNotes && (
                  <div className="mt-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-sm text-cyan-300">
                      <strong>Feedback:</strong> {task.reviewerNotes}
                    </p>
                  </div>
                )}

                {/* Action button */}
                {task.status === 'pending' && (
                  <div className="mt-4">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      Complete Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </div>
</div>
```

**Empty State:**
```tsx
{tasks.length === 0 && (
  <Card className="bg-white/5 border-white/10">
    <CardContent className="p-12 text-center">
      <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-50" />
      <h3 className="text-xl font-semibold text-white mb-2">No Onboarding Tasks</h3>
      <p className="text-gray-400">
        Once you accept a job offer, onboarding tasks will appear here.
      </p>
    </CardContent>
  </Card>
)}
```

### 2. Counter Offer Dialog

**Current File:** `src/components/candidate/CounterOfferDialog.tsx`

**Dialog Structure:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-orange-500" />
        Submit Counter Offer
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Negotiate your salary. The employer will review your request.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 mt-4">
      {/* Current Offer Display */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm text-gray-400 mb-1">Current Offer</p>
        <p className="text-lg font-bold text-white">
          {currency} {currentSalary.toLocaleString()}
          <span className="text-sm text-gray-400 ml-2">/ {salaryType}</span>
        </p>
      </div>

      {/* Counter Offer Input */}
      <div className="space-y-2">
        <Label htmlFor="requested-salary" className="text-gray-300">
          Your Counter Offer *
        </Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="requested-salary"
            type="number"
            value={requestedSalary}
            onChange={(e) => setRequestedSalary(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white focus:border-orange-500/50"
            placeholder="Enter amount"
          />
        </div>

        {/* Real-time Difference Display */}
        {difference > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="text-emerald-400 font-semibold">
              +{currency} {difference.toLocaleString()} ({percentageIncrease}% increase)
            </div>
          </div>
        )}
      </div>

      {/* Justification Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-gray-300">
          Justification (Optional)
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-white/5 border-white/10 text-white min-h-[100px] focus:border-orange-500/50"
          placeholder="Explain why you're requesting this salary (experience, market rate, skills, etc.)"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Counter Offer'
          )}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### 3. Notification Bell

**Current File:** `src/components/shared/NotificationBell.tsx`

**Component Structure:**
```tsx
<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-white/10 text-gray-300 hover:text-white transition-all"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 border-none text-white text-xs font-bold"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    className="w-[380px] bg-[#0F1419] border-white/10 p-0"
  >
    {/* Header */}
    <div className="p-4 border-b border-white/10 flex items-center justify-between">
      <h3 className="font-semibold text-white">Notifications</h3>
      {unreadCount > 0 && (
        <Button
          onClick={markAllAsRead}
          variant="ghost"
          size="sm"
          className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 h-auto p-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Mark all read
        </Button>
      )}
    </div>

    {/* Notifications List */}
    <div className="max-h-[400px] overflow-y-auto">
      {loading ? (
        <div className="p-8 text-center text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {notifications.slice(0, 10).map((notification) => (
            <div
              key={notification.id}
              className={`
                p-4
                hover:bg-white/5
                transition-colors
                cursor-pointer
                ${!notification.isRead ? 'bg-orange-500/5' : ''}
              `}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`
                  mt-1
                  ${notification.isUrgent ? 'text-red-400' : 'text-gray-400'}
                `}>
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`
                      font-medium
                      text-sm
                      ${!notification.isRead ? 'text-white' : 'text-gray-300'}
                    `}>
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(notification.createdAt)}
                    </span>

                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                      >
                        {notification.actionLabel || 'View'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Footer */}
    {notifications.length > 0 && (
      <div className="p-3 border-t border-white/10 text-center">
        <Link
          href="/candidate/notifications"
          className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
        >
          View all notifications
        </Link>
      </div>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

### 4. Applications Page (`/candidate/applications`)

**Layout Structure:**
```tsx
<div className="space-y-6">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-white">My Applications</h1>
      <p className="text-gray-400 mt-1">Track your job applications</p>
    </div>
    <Button className="bg-orange-600 hover:bg-orange-700">
      <Plus className="h-4 w-4 mr-2" />
      Browse Jobs
    </Button>
  </div>

  {/* Filter Tabs (Optional) */}
  <div className="flex gap-2 border-b border-white/10">
    <button className="px-4 py-2 text-sm font-medium text-white border-b-2 border-orange-500">
      All
    </button>
    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
      Active
    </button>
    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
      Withdrawn
    </button>
  </div>

  {/* Applications List */}
  <div className="space-y-4">
    {applications.map((app) => (
      <Card
        key={app.id}
        className="bg-white/5 border-white/10 hover:border-orange-500/30 transition-all cursor-pointer"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {app.jobTitle}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {app.company} • Applied {formatDate(app.appliedAt)}
              </p>

              {/* Status Badge */}
              {getStatusBadge(app.status)}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0F1419] border-white/10">
                <DropdownMenuItem className="text-gray-300 hover:bg-white/10">
                  View Details
                </DropdownMenuItem>
                {canWithdraw(app.status) && (
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-red-500/10"
                    onClick={() => handleWithdraw(app.id)}
                  >
                    Withdraw Application
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

### 5. Offers Page (`/candidate/offers`)

**Offer Card:**
```tsx
<Card className="bg-gradient-to-br from-orange-500/10 via-white/5 to-cyan-500/10 border-orange-500/20">
  <CardContent className="p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">{offer.jobTitle}</h3>
        <p className="text-gray-400">{offer.company}</p>
      </div>
      {getOfferStatusBadge(offer.status)}
    </div>

    {/* Salary Display */}
    <div className="p-4 rounded-lg bg-white/10 border border-white/20 mb-4">
      <p className="text-sm text-gray-400 mb-1">Offered Salary</p>
      <p className="text-3xl font-bold font-mono text-white">
        {offer.currency} {offer.salary.toLocaleString()}
        <span className="text-sm text-gray-400 ml-2">/ {offer.salaryType}</span>
      </p>
    </div>

    {/* Benefits Grid */}
    <div className="grid grid-cols-2 gap-2 mb-4">
      {offer.benefits.map((benefit) => (
        <div key={benefit} className="flex items-center gap-2 text-sm text-gray-300">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {benefit}
        </div>
      ))}
    </div>

    {/* Action Buttons */}
    <div className="flex gap-3">
      <Button
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => handleAccept(offer.id)}
      >
        Accept Offer
      </Button>
      <Button
        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
        onClick={() => openCounterDialog(offer.id)}
      >
        Counter Offer
      </Button>
      <Button
        variant="outline"
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        onClick={() => handleDecline(offer.id)}
      >
        Decline
      </Button>
    </div>

    {/* Expiration Warning */}
    {daysUntilExpiry <= 2 && (
      <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-400 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Offer expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
        </p>
      </div>
    )}
  </CardContent>
</Card>
```

---

## Animation & Effects

### 1. Framer Motion Animations

**Card Entry Animation:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <Card>{/* ... */}</Card>
</motion.div>
```

**Staggered List Animation:**
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <Card>{/* ... */}</Card>
    </motion.div>
  ))}
</motion.div>
```

**Modal Entry Animation:**
```tsx
<Dialog>
  <DialogContent asChild>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Dialog content */}
    </motion.div>
  </DialogContent>
</Dialog>
```

### 2. CSS Transitions

**Standard Transitions:**
```css
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

**Hover Effects:**
```tsx
// Card hover with glow
className="hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all"

// Button hover with scale
className="hover:scale-105 active:scale-95 transition-transform"

// Border color transition
className="border-white/10 hover:border-orange-500/30 transition-colors"
```

### 3. Breathing Effects

**Breathing Glow (for important elements):**
```tsx
<div className="relative">
  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
  <div className="relative">
    {/* Your content */}
  </div>
</div>
```

**Custom Breathing Animation:**
```css
@keyframes breathing {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.animate-breathing {
  animation: breathing 3s ease-in-out infinite;
}
```

### 4. Loading Skeleton

**Skeleton Pattern:**
```tsx
<div className="animate-pulse">
  <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
  <div className="h-4 bg-white/5 rounded w-1/2" />
</div>
```

---

## Responsive Design

### Breakpoints (Tailwind Defaults)

```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Responsive Patterns

**Grid Layouts:**
```tsx
// 1 column mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

// 1 column mobile, 3 on desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

**Text Sizing:**
```tsx
// Responsive headings
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// Responsive body
<p className="text-sm md:text-base lg:text-lg">
```

**Spacing:**
```tsx
// Responsive padding
<div className="p-4 md:p-6 lg:p-8">

// Responsive margin
<div className="mb-4 md:mb-6 lg:mb-8">
```

**Layout Changes:**
```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="block md:hidden">
```

---

## Accessibility

### 1. Color Contrast

All text meets WCAG AA standards:
- White (#FFFFFF) on dark background: ✅ AAA
- Gray-300 (#D1D5DB) on dark background: ✅ AA
- Gray-400 (#9CA3AF) on dark background: ✅ AA (large text only)

### 2. Focus States

**Keyboard Navigation:**
```tsx
// All interactive elements should have visible focus
<Button className="focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#0B0B0D]">

// Input focus
<Input className="focus:border-orange-500/50 focus:ring-orange-500/20">
```

### 3. ARIA Labels

**Icon Buttons:**
```tsx
<Button variant="ghost" size="icon" aria-label="Open notifications">
  <Bell className="h-5 w-5" />
</Button>
```

**Loading States:**
```tsx
<Button disabled aria-busy="true">
  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
  Loading...
</Button>
```

**Screen Reader Text:**
```tsx
<span className="sr-only">5 unread notifications</span>
```

### 4. Semantic HTML

Use proper HTML elements:
```tsx
// Use <button> for clickable actions
<button onClick={...}>Click Me</button>

// Use <a> for navigation
<a href="/page">Go to Page</a>

// Use proper headings hierarchy
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
```

---

## Implementation Checklist

Use this checklist when polishing each component:

### Visual Design
- [ ] Background color matches BPOC dark theme (#0B0B0D or #0F1419)
- [ ] Cards use glassmorphism (bg-white/5, border-white/10)
- [ ] Hover states add glow or border color change
- [ ] Text colors follow hierarchy (white → gray-300 → gray-400)
- [ ] Orange (#F97316) used for primary CTAs
- [ ] Cyan (#0EA5E9) used for secondary accents
- [ ] Status badges use correct color coding (emerald=success, yellow=pending, red=error, cyan=info)

### Typography
- [ ] Headings use font-bold or font-semibold
- [ ] Body text is gray-300
- [ ] Labels/meta text is gray-400 or gray-500
- [ ] Numbers/stats use font-mono
- [ ] Line height appropriate (tight for headings, normal for body)

### Spacing
- [ ] Cards have p-6 or p-8 padding
- [ ] Sections separated with space-y-4 or space-y-6
- [ ] Grid gaps are gap-4 or gap-6
- [ ] Consistent margin/padding throughout

### Interactions
- [ ] All buttons have hover states
- [ ] Loading states show spinner
- [ ] Disabled states have reduced opacity
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Animations
- [ ] Page loads use fade-in animation
- [ ] Lists use stagger animation
- [ ] Modals have scale animation on open
- [ ] Important elements may have breathing effect

### Responsive
- [ ] Looks good on mobile (320px+)
- [ ] Tablet layout optimized (768px+)
- [ ] Desktop layout uses available space (1024px+)
- [ ] Text sizes scale appropriately
- [ ] Grids collapse to fewer columns on mobile

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] All interactive elements focusable
- [ ] ARIA labels on icon buttons
- [ ] Loading states have aria-busy
- [ ] Semantic HTML used
- [ ] Keyboard navigation works

### Performance
- [ ] Images lazy loaded
- [ ] Animations use GPU (transform, opacity)
- [ ] No layout shifts on load
- [ ] Skeleton loaders for async content

---

## Quick Reference: Common Fixes

### Issue: Card looks flat
**Fix:** Add hover effects
```tsx
className="bg-white/5 border-white/10 hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all"
```

### Issue: Text hard to read
**Fix:** Use proper text colors
```tsx
// Headings
className="text-white font-bold"

// Body
className="text-gray-300"

// Labels
className="text-gray-400"
```

### Issue: Button looks plain
**Fix:** Add shadow and hover effect
```tsx
className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
```

### Issue: Loading state missing
**Fix:** Show spinner
```tsx
{loading ? (
  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
) : (
  /* Content */
)}
```

### Issue: No empty state
**Fix:** Add empty state card
```tsx
{items.length === 0 && (
  <Card className="bg-white/5 border-white/10">
    <CardContent className="p-12 text-center">
      <Icon className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-50" />
      <h3 className="text-xl font-semibold text-white mb-2">No Items</h3>
      <p className="text-gray-400">Description of empty state</p>
    </CardContent>
  </Card>
)}
```

### Issue: Mobile layout broken
**Fix:** Add responsive classes
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
```

### Issue: Animation jerky
**Fix:** Use GPU-accelerated properties
```tsx
// Good - GPU accelerated
className="transition-transform hover:scale-105"

// Bad - causes reflow
className="transition-all hover:width-full"
```

---

## Summary

**This guide provides:**
✅ Exact color codes for all BPOC design elements
✅ Complete component patterns with Tailwind classes
✅ Page-by-page implementation specifications
✅ Animation and effect patterns
✅ Responsive design breakpoints
✅ Accessibility requirements
✅ Implementation checklist

**To achieve 100% design perfection:**
1. Follow color palette exactly (no deviation)
2. Use provided component patterns
3. Ensure all hover/focus states work
4. Test on mobile, tablet, desktop
5. Verify accessibility with keyboard navigation
6. Add loading and empty states
7. Use proper animations (subtle, smooth)
8. Maintain consistent spacing throughout

**Key Principle:**
Every UI element should feel like it belongs to the BPOC cyber/tech aesthetic—dark, glassmorphic, with neon accents, smooth transitions, and professional polish.

---

**Document Version:** 1.0
**Last Updated:** January 5, 2026
**Status:** Complete and Ready for Gemini Implementation
**Compatibility:** All candidate portal pages and components
