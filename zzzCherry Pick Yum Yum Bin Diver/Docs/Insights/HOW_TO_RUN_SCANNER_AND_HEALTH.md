# 🔍 SMART SCANNER & HEALTH MONITORING - HOW TO USE

**Date:** January 9, 2026  
**Purpose:** Explain how to run smart scanner and link health monitoring

---

## 🎯 **TWO WAYS TO RUN:**

### **1. MANUAL (Admin Buttons)** ← Recommended for now
### **2. AUTOMATED (Cron Jobs)** ← Set up later

---

## 🖱️ **OPTION 1: MANUAL (ADMIN BUTTONS)**

### **API Routes Created:**

```
✅ POST /api/admin/insights/scan-links
   - Scan all articles for missing links
   - Scan single article
   - Find missing links

✅ GET /api/admin/insights/link-health
   - Get link health overview
   - Get articles needing attention
   - Get article-specific health

✅ POST /api/admin/insights/approve-link
   - Approve link suggestion
   - Get pending suggestions
```

---

## 🎨 **WHERE TO ADD BUTTONS:**

### **Option A: On Main Insights Page (`/admin/insights`)**

Add a "Link Health" section:

```tsx
// Add to: src/app/(admin)/admin/insights/page.tsx

<div className="mb-6 flex gap-3">
  {/* Existing buttons... */}
  
  <button
    onClick={handleScanAllArticles}
    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
  >
    🔍 Scan All Articles
  </button>
  
  <button
    onClick={handleViewLinkHealth}
    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
  >
    📊 Link Health Report
  </button>
</div>
```

---

### **Option B: Create New Page (`/admin/insights/link-scanner`)**

Better option - dedicated page for link management:

```tsx
// Create: src/app/(admin)/admin/insights/link-scanner/page.tsx

export default function LinkScannerPage() {
  return (
    <div className="p-6">
      <h1>Smart Link Scanner</h1>
      
      {/* SCAN SECTION */}
      <section>
        <h2>Run Scanner</h2>
        <button onClick={scanAllArticles}>
          🔍 Scan All Articles
        </button>
        <p>Last scan: {lastScanTime}</p>
        <p>Articles scanned: {articlesScanned}</p>
        <p>Suggestions created: {suggestionsCreated}</p>
      </section>
      
      {/* HEALTH SECTION */}
      <section>
        <h2>Link Health Overview</h2>
        <div className="stats">
          <StatCard title="Avg Health" value={avgHealth} />
          <StatCard title="Need Attention" value={needAttention} />
          <StatCard title="Well Linked" value={wellLinked} />
        </div>
      </section>
      
      {/* PENDING SUGGESTIONS */}
      <section>
        <h2>Pending Link Suggestions</h2>
        <SuggestionsTable suggestions={pendingSuggestions} />
      </section>
      
      {/* ARTICLES NEEDING ATTENTION */}
      <section>
        <h2>Articles Needing Links</h2>
        <ArticlesTable articles={articlesNeedingLinks} />
      </section>
    </div>
  );
}
```

---

## 🔄 **HOW TO USE THE API ROUTES:**

### **1. Scan All Articles (Weekly)**

```typescript
async function scanAllArticles() {
  const response = await fetch('/api/admin/insights/scan-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'scan-all' })
  });
  
  const result = await response.json();
  
  console.log(`✅ Scanned ${result.articlesScanned} articles`);
  console.log(`✅ Created ${result.totalSuggestions} suggestions`);
}
```

### **2. Scan Single Article**

```typescript
async function scanSingleArticle(articleId: string) {
  const response = await fetch('/api/admin/insights/scan-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'scan-single',
      articleId 
    })
  });
  
  const result = await response.json();
  console.log(`✅ Created ${result.suggestionsCreated} suggestions`);
}
```

### **3. Get Link Health Overview**

```typescript
async function getLinkHealth() {
  const response = await fetch('/api/admin/insights/link-health?type=overview');
  const result = await response.json();
  
  console.log('📊 Link Health:');
  console.log(`  Avg Health: ${result.summary.avgLinkHealth}`);
  console.log(`  Need Attention: ${result.summary.articlesNeedingAttention}`);
  console.log(`  Well Linked: ${result.summary.wellLinkedArticles}`);
}
```

### **4. Get Pending Suggestions**

```typescript
async function getPendingSuggestions() {
  const response = await fetch('/api/admin/insights/approve-link?status=pending');
  const result = await response.json();
  
  console.log(`📋 ${result.count} pending suggestions`);
  return result.suggestions;
}
```

### **5. Approve Link Suggestion**

```typescript
async function approveLink(suggestionId: string) {
  const response = await fetch('/api/admin/insights/approve-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestionId })
  });
  
  const result = await response.json();
  console.log('✅ Link approved and applied!');
}
```

---

## ⏰ **OPTION 2: AUTOMATED (CRON JOBS)**

### **Set up weekly auto-scan:**

```typescript
// Create: src/app/api/cron/scan-links/route.ts

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Run the scanner
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/insights/scan-links`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan-all' })
      }
    );

    const result = await response.json();

    // Optional: Send notification email
    // await sendEmail({
    //   to: 'admin@bpoc.io',
    //   subject: `Link Scanner: ${result.totalSuggestions} new suggestions`,
    //   body: `Scanned ${result.articlesScanned} articles`
    // });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron scan error:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
```

### **Add to `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/scan-links",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

**Schedule:** Every Sunday at 2 AM

---

## 📊 **TYPICAL WORKFLOW:**

### **Weekly Routine:**

1. **Monday Morning:**
   - Click "🔍 Scan All Articles" button
   - Wait 30-60 seconds
   - See "Created 47 link suggestions"

2. **Review Suggestions:**
   - Go to "Pending Suggestions" section
   - See list of AI-generated link suggestions
   - Click "✅ Approve" or "❌ Reject" for each

3. **Check Health:**
   - View "Link Health Report"
   - See which articles have low link scores
   - Prioritize old articles with < 3 links

4. **Repeat weekly** to keep content well-connected

---

## 🎯 **RECOMMENDED SETUP:**

### **For Now (Manual):**
```
✅ Add buttons to /admin/insights page
✅ Run scanner manually once a week
✅ Review and approve suggestions
✅ Monitor link health dashboard
```

### **Later (Automated):**
```
✅ Set up cron job for weekly scans
✅ Email notifications when suggestions ready
✅ Auto-approve high-confidence suggestions (score > 0.9)
```

---

## 🚀 **QUICK START:**

1. **Test the API routes:**
   ```bash
   # In browser console on /admin/insights
   await fetch('/api/admin/insights/scan-links', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ action: 'scan-all' })
   }).then(r => r.json()).then(console.log);
   ```

2. **See the results:**
   ```bash
   await fetch('/api/admin/insights/approve-link?status=pending')
     .then(r => r.json())
     .then(console.log);
   ```

3. **Add UI buttons** to make it easier!

---

## ✅ **SUMMARY:**

**Current State:** ✅ API routes created  
**To Add:** 🔲 Admin UI buttons  
**Optional:** 🔲 Cron automation  

**Manual workflow:**
1. Click "Scan All" button
2. Review suggestions
3. Approve good ones
4. Check health report
5. Repeat weekly

**Simple and effective!** 🎯

