# Admin Portal Styling Guide - BPOC Platform

**Date:** January 5, 2026
**Purpose:** Design system reference for Gemini AI to polish Admin UI components
**Applies To:** All Admin Portal features (Onboarding Oversight, Counter Offers Monitoring, Audit Logs, Admin Actions)

---

## 🎨 BPOC Design System - Core Principles

### Color Palette

**Background Colors:**
```css
/* Primary backgrounds */
bg-[#0A0A0F]           /* Main page background - deep dark blue-black */
bg-[#1A1A2E]           /* Card background - dark blue-purple */
bg-white/5             /* Glassmorphism layer - subtle white overlay */
bg-white/10            /* Glassmorphism hover - more prominent white overlay */

/* Accent backgrounds */
bg-cyan-500/10         /* Cyan tint - for info/highlights */
bg-orange-500/10       /* Orange tint - for pending/warning states */
bg-green-500/10        /* Green tint - for success/approved states */
bg-red-500/10          /* Red tint - for danger/rejected/overdue states */
bg-amber-500/10        /* Amber tint - for warning/attention states */
bg-gray-500/10         /* Gray tint - for neutral/inactive states */
```

**Border Colors:**
```css
border-white/10        /* Default border - subtle separation */
border-white/20        /* Hover border - more visible */
border-cyan-500/30     /* Cyan border - info/highlights */
border-orange-500/30   /* Orange border - pending/warning */
border-green-500/30    /* Green border - success/approved */
border-red-500/30      /* Red border - danger/rejected/overdue */
border-amber-500/30    /* Amber border - warning/attention */
```

**Text Colors:**
```css
text-white             /* Primary text - headings, important info */
text-white/90          /* Secondary text - body text */
text-white/70          /* Tertiary text - labels, captions */
text-white/50          /* Muted text - placeholders, disabled */
text-cyan-400          /* Cyan accent - links, interactive elements */
text-orange-400        /* Orange accent - pending states */
text-green-400         /* Green accent - success states */
text-red-400           /* Red accent - danger/error states */
text-amber-400         /* Amber accent - warning states */
text-gray-400          /* Gray accent - neutral/inactive */
```

### Typography

**Font Family:**
```css
font-sans              /* Inter or system-ui fallback */
```

**Font Sizes:**
```css
text-3xl font-bold     /* Page titles (30px) */
text-2xl font-bold     /* Section headings (24px) */
text-xl font-semibold  /* Card titles (20px) */
text-lg font-medium    /* Subheadings (18px) */
text-base              /* Body text (16px) */
text-sm                /* Small text, labels (14px) */
text-xs                /* Tiny text, captions (12px) */
```

**Font Weights:**
```css
font-bold              /* 700 - Page titles, stats numbers */
font-semibold          /* 600 - Section headings, card titles */
font-medium            /* 500 - Subheadings, buttons */
font-normal            /* 400 - Body text */
```

### Spacing System

```css
/* Padding */
p-6                    /* Card padding (24px) */
p-4                    /* Compact card padding (16px) */
p-3                    /* Small element padding (12px) */
px-4 py-2              /* Button padding (16px horizontal, 8px vertical) */

/* Margins */
mb-8                   /* Section bottom margin (32px) */
mb-6                   /* Card group bottom margin (24px) */
mb-4                   /* Element bottom margin (16px) */
gap-6                  /* Grid gap (24px) */
gap-4                  /* Compact grid gap (16px) */
gap-3                  /* Small gap (12px) */
gap-2                  /* Tiny gap (8px) */
```

### Border Radius

```css
rounded-xl             /* Cards (12px) */
rounded-lg             /* Buttons, inputs (8px) */
rounded-md             /* Small elements (6px) */
rounded-full           /* Pills, avatars (9999px) */
```

### Glassmorphism Effect

```css
/* Standard glassmorphism card */
className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"

/* Hover state */
className="hover:bg-white/10 hover:border-white/20 transition-all duration-200"
```

---

## 📊 Admin Onboarding Dashboard - `/admin/onboarding`

**File:** `/src/app/(admin)/admin/onboarding/page.tsx`

### Page Structure

```tsx
{/* Page Container */}
<div className="min-h-screen bg-[#0A0A0F] text-white p-8">

  {/* Header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold mb-2">Onboarding Oversight</h1>
    <p className="text-white/70">Monitor all onboarding tasks across the platform</p>
  </div>

  {/* Stats Dashboard */}
  <div className="grid grid-cols-6 gap-4 mb-8">
    {/* 6 stat cards */}
  </div>

  {/* Search & Filters */}
  <div className="mb-6 flex gap-4">
    {/* Search input */}
    {/* Status filter */}
  </div>

  {/* Tasks Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Task cards */}
  </div>
</div>
```

### Stats Cards Styling

**6 Stat Cards Layout:**
```tsx
<div className="grid grid-cols-6 gap-4 mb-8">
  {/* Card 1: Total Tasks */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-white/70">Total Tasks</p>
      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-white">{stats.total}</p>
  </motion.div>

  {/* Card 2: Pending (Gray) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-white/70">Pending</p>
      <Clock className="w-5 h-5 text-gray-400" />
    </div>
    <p className="text-3xl font-bold text-white">{stats.pending}</p>
  </motion.div>

  {/* Card 3: Submitted (Cyan - Needs Attention!) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-cyan-400">Submitted</p>
      <FileText className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-cyan-400">{stats.submitted}</p>
    <p className="text-xs text-cyan-400/70 mt-1">Needs Review</p>
  </motion.div>

  {/* Card 4: Approved (Green) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-green-400">Approved</p>
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    </div>
    <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
  </motion.div>

  {/* Card 5: Rejected (Red) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-red-400">Rejected</p>
      <XCircle className="w-5 h-5 text-red-400" />
    </div>
    <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
  </motion.div>

  {/* Card 6: Overdue (Amber - Urgent!) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-amber-400">Overdue</p>
      <AlertCircle className="w-5 h-5 text-amber-400" />
    </div>
    <p className="text-3xl font-bold text-amber-400">{stats.overdue}</p>
    <p className="text-xs text-amber-400/70 mt-1">Needs Attention</p>
  </motion.div>
</div>
```

**Design Notes:**
- Grid layout: `grid-cols-6` for desktop, adapt to `grid-cols-2` on mobile
- Staggered animations: Each card delays by 0.1s
- Color coding: Cyan = submitted (needs review), Amber = overdue (urgent)
- Icons: Each stat has a relevant icon (CheckCircle2, Clock, FileText, XCircle, AlertCircle)

### Task Cards Styling

**Individual Task Card:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className={`
    bg-white/5 backdrop-blur-sm
    border rounded-xl p-6
    hover:bg-white/10 hover:border-white/20
    transition-all duration-200
    ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'}
  `}
>
  {/* Candidate Header */}
  <div className="flex items-start gap-4 mb-4">
    <Avatar className="w-12 h-12 border-2 border-white/20">
      <AvatarImage src={candidateAvatar} />
      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
        {candidateName.split(' ').map(n => n[0]).join('')}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-white">{candidateName}</h3>
        {isRequired && (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Required
          </Badge>
        )}
        {isOverdue && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Overdue
          </Badge>
        )}
      </div>
      <p className="text-sm text-white/70">{candidateEmail}</p>
    </div>
  </div>

  {/* Task Title & Status */}
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-white">{taskTitle}</h4>
      <Badge className={statusConfig[status].color}>
        {statusConfig[status].label}
      </Badge>
    </div>
    <p className="text-sm text-white/70 line-clamp-2">{description}</p>
  </div>

  {/* Job & Agency Info */}
  <div className="space-y-2 mb-4">
    <div className="flex items-center gap-2 text-sm">
      <Briefcase className="w-4 h-4 text-white/50" />
      <span className="text-white/70">{jobTitle}</span>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Building2 className="w-4 h-4 text-white/50" />
      <span className="text-white/70">{agency}</span>
      {client && <span className="text-white/50">• {client}</span>}
    </div>
  </div>

  {/* Task Type & Due Date */}
  <div className="flex items-center justify-between mb-4">
    <Badge variant="outline" className="border-white/20 text-white/70">
      {taskType}
    </Badge>
    <div className={`text-sm flex items-center gap-1 ${
      isOverdue ? 'text-red-400' : 'text-white/70'
    }`}>
      <Calendar className="w-4 h-4" />
      <span>Due: {formattedDueDate}</span>
    </div>
  </div>

  {/* Action Button */}
  <Button
    variant="outline"
    className="w-full bg-white/5 hover:bg-white/10 border-white/20 text-white"
    onClick={() => router.push(`/admin/applications/${applicationId}`)}
  >
    <Eye className="w-4 h-4 mr-2" />
    View Application
  </Button>
</motion.div>
```

**Status Badge Configuration:**
```typescript
const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
};
```

### Search & Filter Controls

```tsx
<div className="mb-6 flex flex-col md:flex-row gap-4">
  {/* Search Input */}
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
    <input
      type="text"
      placeholder="Search by candidate name, job title, or agency..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="
        w-full pl-10 pr-4 py-3
        bg-white/5 backdrop-blur-sm
        border border-white/10
        rounded-lg
        text-white placeholder:text-white/50
        focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
        transition-all duration-200
      "
    />
  </div>

  {/* Status Filter */}
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="
      px-4 py-3
      bg-white/5 backdrop-blur-sm
      border border-white/10
      rounded-lg
      text-white
      focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
      transition-all duration-200
      cursor-pointer
    "
  >
    <option value="all" className="bg-[#1A1A2E]">All Status</option>
    <option value="pending" className="bg-[#1A1A2E]">Pending</option>
    <option value="submitted" className="bg-[#1A1A2E]">Submitted</option>
    <option value="approved" className="bg-[#1A1A2E]">Approved</option>
    <option value="rejected" className="bg-[#1A1A2E]">Rejected</option>
  </select>
</div>
```

---

## 💰 Admin Counter Offers Dashboard - `/admin/counter-offers`

**File:** `/src/app/(admin)/admin/counter-offers/page.tsx`

### Page Structure

```tsx
{/* Page Container */}
<div className="min-h-screen bg-[#0A0A0F] text-white p-8">

  {/* Header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold mb-2">Counter Offers Monitoring</h1>
    <p className="text-white/70">Track salary negotiations across the platform</p>
  </div>

  {/* Stats Dashboard */}
  <div className="grid grid-cols-6 gap-4 mb-8">
    {/* 6 stat cards */}
  </div>

  {/* Search & Filters */}
  <div className="mb-6 flex gap-4">
    {/* Search input */}
    {/* Status filter */}
  </div>

  {/* Counter Offers Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Counter offer cards */}
  </div>
</div>
```

### Stats Cards Styling

**6 Stat Cards Layout:**
```tsx
<div className="grid grid-cols-6 gap-4 mb-8">
  {/* Card 1: Total Counters */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-white/70">Total Counters</p>
      <DollarSign className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-white">{stats.total}</p>
  </motion.div>

  {/* Card 2: Pending (Orange) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-orange-400">Pending</p>
      <Clock className="w-5 h-5 text-orange-400" />
    </div>
    <p className="text-3xl font-bold text-orange-400">{stats.pending}</p>
  </motion.div>

  {/* Card 3: Accepted (Green) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-green-400">Accepted</p>
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    </div>
    <p className="text-3xl font-bold text-green-400">{stats.accepted}</p>
  </motion.div>

  {/* Card 4: Rejected (Red) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-red-400">Rejected</p>
      <XCircle className="w-5 h-5 text-red-400" />
    </div>
    <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
  </motion.div>

  {/* Card 5: Avg Increase (Cyan - Key Metric) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-cyan-400">Avg Increase</p>
      <TrendingUp className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-cyan-400">{stats.averageIncrease}%</p>
  </motion.div>

  {/* Card 6: Acceptance Rate (Cyan - Key Metric) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-cyan-400">Acceptance Rate</p>
      <Percent className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-cyan-400">{stats.acceptanceRate}%</p>
  </motion.div>
</div>
```

**Design Notes:**
- Orange for pending (different from onboarding to indicate negotiation)
- Cyan for key metrics (avg increase, acceptance rate) - market intelligence
- Icons: DollarSign, Clock, CheckCircle2, XCircle, TrendingUp, Percent

### Counter Offer Cards Styling

**Individual Counter Offer Card:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="
    bg-white/5 backdrop-blur-sm
    border border-white/10
    rounded-xl p-6
    hover:bg-white/10 hover:border-white/20
    transition-all duration-200
  "
>
  {/* Candidate Header */}
  <div className="flex items-start gap-4 mb-6">
    <Avatar className="w-12 h-12 border-2 border-white/20">
      <AvatarImage src={candidateAvatar} />
      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
        {candidateName.split(' ').map(n => n[0]).join('')}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">{candidateName}</h3>
        <Badge className={statusConfig[status].color}>
          {statusConfig[status].label}
        </Badge>
      </div>
      <p className="text-sm text-white/70">{candidateEmail}</p>
    </div>
  </div>

  {/* 4-Panel Salary Breakdown */}
  <div className="grid grid-cols-4 gap-3 mb-6">
    {/* Panel 1: Original Offer */}
    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
      <p className="text-xs text-white/50 mb-1">Original</p>
      <p className="text-lg font-bold text-white">
        {formatCurrency(originalSalary, currency)}
      </p>
      <p className="text-xs text-white/50 mt-1">/{salaryType}</p>
    </div>

    {/* Panel 2: Requested (Orange with % increase) */}
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
      <p className="text-xs text-orange-400 mb-1">Requested</p>
      <p className="text-lg font-bold text-orange-400">
        {formatCurrency(requestedSalary, currency)}
      </p>
      <p className="text-xs text-orange-400/70 mt-1">
        +{percentageIncrease.toFixed(1)}%
      </p>
    </div>

    {/* Panel 3: Difference (Cyan) */}
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
      <p className="text-xs text-cyan-400 mb-1">Difference</p>
      <p className="text-lg font-bold text-cyan-400">
        +{formatCurrency(difference, currency)}
      </p>
    </div>

    {/* Panel 4: Status */}
    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
      <p className="text-xs text-white/50 mb-1">Status</p>
      <p className={`text-sm font-semibold ${statusConfig[status].textColor}`}>
        {statusConfig[status].label}
      </p>
    </div>
  </div>

  {/* Job & Agency Info */}
  <div className="space-y-2 mb-6">
    <div className="flex items-center gap-2 text-sm">
      <Briefcase className="w-4 h-4 text-white/50" />
      <span className="text-white/70">{jobTitle}</span>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Building2 className="w-4 h-4 text-white/50" />
      <span className="text-white/70">{agency}</span>
      {client && <span className="text-white/50">• {client}</span>}
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4 text-white/50" />
      <span className="text-white/70">
        Created {formatDate(createdAt)}
      </span>
    </div>
  </div>

  {/* Candidate Justification Message */}
  {candidateMessage && (
    <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-cyan-400 mb-1">
            Candidate's Justification
          </p>
          <p className="text-sm text-white/70">
            {candidateMessage}
          </p>
        </div>
      </div>
    </div>
  )}

  {/* Action Buttons */}
  <div className="flex gap-3">
    <Button
      variant="outline"
      className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white"
      onClick={() => router.push(`/admin/offers?offerId=${offerId}`)}
    >
      <FileText className="w-4 h-4 mr-2" />
      View Offer
    </Button>
    <Button
      variant="outline"
      className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white"
      onClick={() => router.push(`/admin/candidates/${candidateId}`)}
    >
      <User className="w-4 h-4 mr-2" />
      View Candidate
    </Button>
  </div>
</motion.div>
```

**Status Badge Configuration:**
```typescript
const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    textColor: 'text-orange-400'
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    textColor: 'text-green-400'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    textColor: 'text-red-400'
  }
};
```

**Helper Function - Currency Formatting:**
```typescript
const formatCurrency = (amount: number, currency: string) => {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'PHP': '₱',
    'EUR': '€',
    'GBP': '£'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};
```

---

## 🎭 Component Patterns

### Framer Motion Animations

**Staggered Card Entrance:**
```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      delay: index * 0.05, // 50ms delay per item
      duration: 0.3,
      ease: "easeOut"
    }}
  >
    {/* Card content */}
  </motion.div>
))}
```

**Hover Scale Effect:**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="..."
>
  Button Text
</motion.button>
```

**Loading State:**
```tsx
{isLoading && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center py-12"
  >
    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
  </motion.div>
)}
```

### Avatar Component

```tsx
<Avatar className="w-12 h-12 border-2 border-white/20">
  <AvatarImage src={avatarUrl} alt={name} />
  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-semibold">
    {name.split(' ').map(n => n[0]).join('')}
  </AvatarFallback>
</Avatar>
```

### Badge Component

```tsx
{/* Status badge */}
<Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
  Active
</Badge>

{/* Outline badge */}
<Badge variant="outline" className="border-white/20 text-white/70">
  document_upload
</Badge>

{/* Warning badge */}
<Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
  Overdue
</Badge>
```

### Button Variants

```tsx
{/* Primary action */}
<Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
  Submit
</Button>

{/* Secondary action */}
<Button
  variant="outline"
  className="bg-white/5 hover:bg-white/10 border-white/20 text-white"
>
  Cancel
</Button>

{/* Danger action */}
<Button className="bg-red-500 hover:bg-red-600 text-white">
  Delete
</Button>

{/* Icon button */}
<Button size="icon" className="bg-white/5 hover:bg-white/10">
  <MoreVertical className="w-4 h-4" />
</Button>
```

---

## 🎨 Polish Suggestions for Gemini

### Micro-interactions to Add

1. **Hover States:**
   - Add subtle scale (1.02) on card hover
   - Add glow effect on interactive elements
   - Add cursor pointer on clickable areas

2. **Loading States:**
   - Skeleton loaders for initial page load
   - Spinner during data fetches
   - Progress indicators for long operations

3. **Empty States:**
   - Illustrative icon when no data
   - Helpful message ("No pending tasks")
   - Call-to-action if appropriate

4. **Transitions:**
   - Smooth height transitions when expanding/collapsing
   - Fade transitions when filtering/searching
   - Slide transitions for modals/drawers

### Accessibility Improvements

1. **ARIA Labels:**
```tsx
<button
  aria-label="View application details"
  aria-describedby="app-description"
>
  View Application
</button>
```

2. **Keyboard Navigation:**
```tsx
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  {/* Interactive card */}
</div>
```

3. **Focus Indicators:**
```css
focus:ring-2 focus:ring-cyan-500/50 focus:outline-none
```

### Responsive Design

**Breakpoints:**
```tsx
{/* Mobile-first approach */}
<div className="
  grid
  grid-cols-1           /* Mobile: 1 column */
  md:grid-cols-2        /* Tablet: 2 columns */
  lg:grid-cols-3        /* Desktop: 3 columns */
  gap-4 md:gap-6        /* Smaller gap on mobile */
">
  {/* Cards */}
</div>

{/* Stats cards - stack on mobile */}
<div className="
  grid
  grid-cols-2           /* Mobile: 2 columns */
  md:grid-cols-3        /* Tablet: 3 columns */
  lg:grid-cols-6        /* Desktop: 6 columns */
  gap-3 md:gap-4
">
  {/* Stat cards */}
</div>
```

### Performance Optimizations

1. **Lazy Loading:**
```tsx
const AdminAuditLog = dynamic(() => import('./AdminAuditLog'), {
  loading: () => <Loader2 className="animate-spin" />
});
```

2. **Memoization:**
```tsx
const filteredTasks = useMemo(() => {
  return tasks.filter(task =>
    task.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [tasks, searchQuery]);
```

3. **Virtual Scrolling for Long Lists:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## 🧩 Reusable Admin Components

### Stats Card Component

**File:** `/src/components/admin/StatsCard.tsx`

```tsx
interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'cyan' | 'orange' | 'green' | 'red' | 'amber' | 'gray';
  delay?: number;
  subtitle?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'gray',
  delay = 0,
  subtitle
}: StatsCardProps) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    gray: 'bg-white/5 border-white/10 text-white'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`
        backdrop-blur-sm border rounded-xl p-6
        ${colorClasses[color]}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm ${color === 'gray' ? 'text-white/70' : ''}`}>
          {label}
        </p>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs opacity-70 mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
```

### Filter Bar Component

**File:** `/src/components/admin/FilterBar.tsx`

```tsx
interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions
}: FilterBarProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3
            bg-white/5 backdrop-blur-sm
            border border-white/10
            rounded-lg
            text-white placeholder:text-white/50
            focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
            transition-all duration-200
          "
        />
      </div>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="
          px-4 py-3
          bg-white/5 backdrop-blur-sm
          border border-white/10
          rounded-lg
          text-white
          focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
          transition-all duration-200
          cursor-pointer
        "
      >
        {statusOptions.map(option => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#1A1A2E]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Empty State Component

**File:** `/src/components/admin/EmptyState.tsx`

```tsx
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 text-center max-w-md mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## 🔍 Admin Audit Log Viewer - `/admin/audit-log`

**File:** `/src/app/(admin)/admin/audit-log/page.tsx`

### Page Structure

```tsx
{/* Page Container */}
<div className="min-h-screen bg-[#0A0A0F] text-white p-8">

  {/* Header */}
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <Shield className="w-8 h-8 text-cyan-400" />
      <h1 className="text-3xl font-bold">Audit Log</h1>
    </div>
    <p className="text-white/70">
      Complete record of all administrative actions for compliance
    </p>
  </div>

  {/* Stats Dashboard (4 cards) */}
  <div className="grid grid-cols-4 gap-4 mb-8">
    {/* Stat cards */}
  </div>

  {/* Search & Filters */}
  <div className="mb-6 flex gap-4">
    {/* Search, action filter, entity filter */}
  </div>

  {/* Audit Log Timeline */}
  <div className="space-y-4">
    {/* Log cards */}
  </div>
</div>
```

### Stats Cards Styling

**4 Stat Cards for Compliance Dashboard:**
```tsx
<div className="grid grid-cols-4 gap-4 mb-8">
  {/* Card 1: Total Actions (Gray) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-white/70">Total Actions</p>
      <Activity className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-white">{stats.total}</p>
  </motion.div>

  {/* Card 2: Suspensions (Red) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-red-400">Suspensions</p>
      <XCircle className="w-5 h-5 text-red-400" />
    </div>
    <p className="text-3xl font-bold text-red-400">
      {/* Count of suspend actions */}
    </p>
  </motion.div>

  {/* Card 3: Reactivations (Green) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-green-400">Reactivations</p>
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    </div>
    <p className="text-3xl font-bold text-green-400">
      {/* Count of reactivate actions */}
    </p>
  </motion.div>

  {/* Card 4: Notes Added (Cyan) */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-cyan-400">Notes Added</p>
      <FileText className="w-5 h-5 text-cyan-400" />
    </div>
    <p className="text-3xl font-bold text-cyan-400">
      {/* Count of note actions */}
    </p>
  </motion.div>
</div>
```

### Audit Log Cards Styling

**Timeline-Style Log Cards:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
  className="
    bg-white/5 backdrop-blur-sm
    border border-white/10
    rounded-xl p-6
    hover:bg-white/10 hover:border-white/20
    transition-all duration-200
  "
>
  <div className="flex items-start gap-4">
    {/* Admin Avatar */}
    <Avatar className="w-10 h-10 border-2 border-white/20 flex-shrink-0">
      <AvatarImage src={admin.avatar} />
      <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-sm">
        {admin.name.split(' ').map(n => n[0]).join('')}
      </AvatarFallback>
    </Avatar>

    {/* Log Content */}
    <div className="flex-1">
      {/* Header: Admin + Action */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-white">
            {admin.name}
            <span className="text-white/50 font-normal ml-2">
              {admin.email}
            </span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            {/* Action Badge - Color based on action type */}
            <Badge className={actionConfig.color}>
              <ActionIcon className="w-3 h-3 mr-1" />
              {action.replace(/_/g, ' ')}
            </Badge>
            <span className="text-sm text-white/70">on</span>
            <Badge variant="outline" className="border-white/20 text-white/70">
              {entityType}
            </Badge>
            {entityName && (
              <span className="text-sm text-white/90 font-medium">
                {entityName}
              </span>
            )}
          </div>
        </div>

        {/* Timestamp + Expand Button */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-white/50 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(createdAt)}
          </div>
          <Button size="sm" variant="ghost">
            <ChevronDown className={`w-4 h-4 ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Reason (if provided) */}
      {reason && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
          <p className="text-xs text-white/50 mb-1">Reason</p>
          <p className="text-sm text-white/90">{reason}</p>
        </div>
      )}

      {/* Expanded Details (JSON) */}
      {isExpanded && details && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white/5 border border-white/10 rounded-lg p-4 mt-3"
        >
          <p className="text-xs text-white/50 mb-2">Additional Details</p>
          <pre className="text-xs text-white/70 overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  </div>
</motion.div>
```

**Action Badge Color Configuration:**
```typescript
const getActionConfig = (action: string) => {
  if (action.includes('suspend')) {
    return {
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: XCircle
    };
  } else if (action.includes('reactivate')) {
    return {
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: CheckCircle2
    };
  } else if (action.includes('delete')) {
    return {
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: XCircle
    };
  } else if (action.includes('note')) {
    return {
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      icon: FileText
    };
  } else if (action.includes('update') || action.includes('override')) {
    return {
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      icon: Activity
    };
  }
  return {
    color: 'bg-white/10 text-white/70 border-white/20',
    icon: Activity
  };
};
```

**Design Notes:**
- Timeline-style layout with admin avatar on left
- Action badges color-coded by severity (red = suspend, green = reactivate)
- Expandable details section (shows JSON with before/after states)
- Timestamp shows relative time ("5m ago", "2h ago")
- Reason highlighted in separate box for visibility

---

## 📝 Admin Notes Component - Reusable

**File:** `/src/components/admin/AdminNotes.tsx`

**Purpose:** Reusable component for adding/viewing admin notes on any entity (agencies, candidates, jobs, applications, offers, etc.)

### Component Structure

```tsx
<AdminNotes
  entityType="agency"
  entityId="uuid-123"
  entityName="ShoreAgents"
/>
```

### Component Styling

**Container:**
```tsx
<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <FileText className="w-5 h-5 text-cyan-400" />
      <h3 className="text-lg font-semibold text-white">Admin Notes</h3>
      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
        {notes.length}
      </Badge>
    </div>
    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
      <Plus className="w-4 h-4 mr-2" />
      Add Note
    </Button>
  </div>

  {/* Add Note Form (when active) */}
  {/* Notes Timeline */}
</div>
```

**Add Note Form:**
```tsx
<AnimatePresence>
  {isAdding && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6"
    >
      <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-4">
        <p className="text-sm text-white/70 mb-2">New Internal Note</p>
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about this entity..."
          className="
            w-full mb-3
            bg-white/5 border-white/10
            text-white placeholder:text-white/50
            focus:border-cyan-500/30
            min-h-[100px]
          "
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Save Note
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Individual Note Card:**
```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  className="bg-white/5 border border-white/10 rounded-lg p-4"
>
  <div className="flex items-start gap-3">
    {/* Admin Avatar */}
    <Avatar className="w-8 h-8 border-2 border-white/20 flex-shrink-0">
      <AvatarImage src={admin.avatar} />
      <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
        {admin.name.split(' ').map(n => n[0]).join('')}
      </AvatarFallback>
    </Avatar>

    {/* Note Content */}
    <div className="flex-1">
      {/* Header: Admin + Timestamp */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-white">{admin.name}</p>
          <p className="text-xs text-white/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(createdAt)}
            {createdAt !== updatedAt && <span>(edited)</span>}
          </p>
        </div>

        {/* Edit/Delete Actions (only for note owner) */}
        {canEdit && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white p-2 h-auto"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 p-2 h-auto"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Note Text */}
      <p className="text-sm text-white/90 whitespace-pre-wrap">
        {note}
      </p>

      {/* Internal Badge */}
      {isInternal && (
        <Badge
          variant="outline"
          className="mt-2 border-white/20 text-white/50 text-xs"
        >
          Internal Only
        </Badge>
      )}
    </div>
  </div>
</motion.div>
```

**Edit Mode:**
```tsx
{/* When editing a note */}
<div>
  <Textarea
    value={editingNoteText}
    onChange={(e) => setEditingNoteText(e.target.value)}
    className="
      w-full mb-2
      bg-white/5 border-white/10
      text-white
      focus:border-cyan-500/30
      min-h-[80px]
    "
  />
  <div className="flex gap-2">
    <Button
      size="sm"
      className="bg-cyan-500 hover:bg-cyan-600 text-white"
    >
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Save
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="text-white/70 hover:text-white"
    >
      Cancel
    </Button>
  </div>
</div>
```

**Empty State:**
```tsx
{notes.length === 0 && (
  <div className="flex flex-col items-center justify-center py-8">
    <FileText className="w-10 h-10 text-white/30 mb-2" />
    <p className="text-white/70 text-sm">No notes yet</p>
    <p className="text-white/50 text-xs">
      Add a note to document important information
    </p>
  </div>
)}
```

**Design Notes:**
- Compact timeline layout (smaller than audit log)
- Cyan theme throughout (add = cyan, borders = cyan)
- Edit/delete only shown for note owner
- Smooth AnimatePresence for add form
- Inline editing with textarea replacement
- "Internal Only" badge for visibility control

---

## 📦 Icon Library (lucide-react)

**Common Icons Used:**
```typescript
import {
  CheckCircle2,      // Approved, success
  Clock,             // Pending, waiting
  XCircle,           // Rejected, error
  AlertCircle,       // Warning, attention needed
  FileText,          // Documents, tasks
  DollarSign,        // Money, salary
  TrendingUp,        // Growth, increase
  Percent,           // Percentage metrics
  Briefcase,         // Job
  Building2,         // Agency, company
  Calendar,          // Dates
  User,              // Candidate, user
  Eye,               // View action
  Search,            // Search functionality
  Filter,            // Filter functionality
  MoreVertical,      // More options menu
  Loader2,           // Loading spinner
  ChevronDown,       // Dropdown indicator
  ChevronRight,      // Navigation arrow
  ArrowLeft,         // Back navigation
  Download,          // Export data
  RefreshCw          // Refresh/reload
} from 'lucide-react';
```

---

## 🎯 Admin-Specific Design Principles

### 1. Information Density
- Admin views need more data per screen than candidate/recruiter views
- Use compact layouts but maintain readability
- Grid layouts maximize screen real estate
- Collapsible sections for detailed data

### 2. Data Visualization
- Stats cards should be immediately scannable
- Color coding for quick status recognition
- Highlight urgent items (overdue, pending review)
- Use percentage/trend indicators for metrics

### 3. Action Clarity
- Primary actions should be obvious (View Application, View Offer)
- Destructive actions (suspend, delete) should be clearly marked
- Confirmation dialogs for irreversible actions
- Audit trail for all admin actions

### 4. Platform-Wide Context
- Show agency/client context in every card
- Link to related entities (candidate → application → job)
- Breadcrumb navigation for deep paths
- Cross-reference between related data

### 5. Monitoring Focus
- Prioritize metrics that indicate platform health
- Highlight items needing attention
- Surface outliers (very high counters, long overdue tasks)
- Provide filtering for targeted investigations

---

## 🚀 Implementation Checklist for Gemini

When polishing admin UI, ensure:

**Visual Consistency:**
- [ ] All cards use glassmorphism effect (bg-white/5, backdrop-blur-sm)
- [ ] Status badges use consistent color scheme
- [ ] Icons are properly sized (w-4 h-4 for inline, w-5 h-5 for headers)
- [ ] Spacing is consistent (p-6 for cards, gap-4 for grids)

**Interactions:**
- [ ] Hover states on all interactive elements
- [ ] Loading states during data fetches
- [ ] Smooth transitions (duration-200)
- [ ] Keyboard navigation support

**Responsiveness:**
- [ ] Stats cards stack properly on mobile (grid-cols-2 → grid-cols-6)
- [ ] Task/offer cards are single column on mobile
- [ ] Search/filter controls stack on mobile
- [ ] Text sizes adapt to viewport

**Accessibility:**
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader labels for icon-only buttons

**Performance:**
- [ ] Animations use GPU-accelerated properties (opacity, transform)
- [ ] Large lists use pagination or virtual scrolling
- [ ] Images are lazy loaded
- [ ] Expensive calculations are memoized

---

## 📝 Summary

This guide documents the complete styling system for BPOC's Admin Portal, including:

1. **Onboarding Oversight** - Platform-wide task monitoring with 6-stat dashboard
2. **Counter Offers Monitoring** - Salary negotiation tracking with market intelligence
3. **Audit Log Viewer** - Compliance dashboard showing all admin actions with 4-stat dashboard
4. **Admin Notes Component** - Reusable notes widget for any entity page

**Key Characteristics:**
- Dark theme with glassmorphism cards
- Color-coded status system (Gray, Cyan, Orange, Green, Red, Amber)
- Responsive grid layouts
- Framer Motion animations
- Comprehensive filtering and search
- Admin-focused information density

**Design Philosophy:**
- Admin = Observer, not Operator (view-only by design)
- Data-dense but scannable
- Urgent items highlighted automatically
- Platform-wide context always visible

**Next Steps for Gemini:**
1. Apply consistent spacing and alignment
2. Enhance micro-interactions (hover, focus, active states)
3. Improve responsive behavior on all devices
4. Add loading/empty state illustrations
5. Ensure accessibility standards met
6. Optimize performance for large datasets

---

**Last Updated:** January 5, 2026
**Built By:** Claude Code
**For:** Gemini AI Design Polish
**Status:** Ready for handoff ✅
