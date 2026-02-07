# 🔍 SMART LINK SCANNER - Retroactive Link Discovery

**Date:** January 9, 2026  
**Purpose:** Continuously scan published articles and suggest new links (even months/years later)

---

## 🎯 **THE PROBLEM YOU IDENTIFIED:**

You publish an article today. **6-7 months later:**
- ✅ You've published 50+ new related articles
- ❌ The old article doesn't link to any of them
- ❌ Old article is missing link opportunities
- ❌ SEO suffers because articles aren't connected

---

## ✅ **THE SOLUTION: SMART LINK SCANNER**

AI **continuously scans** all published articles and suggests links to:

1. **Related content that was missed** originally
2. **NEW content** published after the original article
3. **Older content** that should be linked but isn't

---

## 🔄 **HOW IT WORKS:**

```
┌────────────────────────────────────────────────────┐
│ SMART LINK SCANNER WORKFLOW                        │
├────────────────────────────────────────────────────┤
│                                                    │
│ 1. Run scanner (daily/weekly cron job)           │
│    ↓                                              │
│ 2. Scans ALL published articles                  │
│    ↓                                              │
│ 3. For each article:                             │
│    • Check existing links                        │
│    • Find related articles (same silo/category)  │
│    • Find NEWER articles (published after)       │
│    • Calculate similarity                        │
│    ↓                                              │
│ 4. Generate link_suggestions (status: pending)   │
│    ↓                                              │
│ 5. Admin reviews suggestions                     │
│    ↓                                              │
│ 6. Admin approves → Link applied                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🛠️ **FUNCTIONS CREATED:**

### **1. Find Missing Links for One Article**
```sql
SELECT * FROM find_missing_links_for_article('article-uuid');
```

Returns:
- Target articles that should be linked
- Suggested anchor text
- Whether it's newer content (published after)
- Similarity score
- Reason for suggestion

**Example Output:**
```
target_title: "13th Month Pay Guide 2026"
is_newer_content: true  ← Published AFTER your article!
reason: "Same silo: Salary Guide (NEW CONTENT)"
```

---

### **2. Generate Suggestions for One Article**
```sql
SELECT generate_link_suggestions_for_article('article-uuid');
```

- Finds missing links
- Creates entries in `link_suggestions` table
- Returns count of suggestions created
- **You review and approve in admin panel**

---

### **3. Bulk Scan ALL Articles (THE MONEY MAKER!)**
```sql
SELECT * FROM generate_link_suggestions_bulk();
```

**This is the one you run daily/weekly!**

Scans every published article and:
- Finds missing links
- Suggests links to new content
- Creates pending suggestions
- Returns summary

**Output:**
```
article_title: "BPO Interview Tips" (published 8 months ago)
suggestions_created: 7
  → 3 missed links
  → 4 NEW articles published after
```

---

### **4. Quick Scan Overview**
```sql
SELECT * FROM scan_all_articles_for_missing_links();
```

Shows which articles have missing link opportunities:
```
source_title: "Minimum Wage Philippines"
missing_links_count: 12
newer_content_count: 8  ← 8 new articles since published!
```

---

## 👁️ **VIEWS FOR MONITORING:**

### **1. Link Coverage Report**
```sql
SELECT * FROM link_coverage_report;
```

Shows for each article:
- Days since published
- Outbound link count
- Inbound link count
- Pending suggestions
- Link health score (0-100)
- Article age category

**Example:**
```
title: "Termination Laws"
days_since_published: 210 (7 months)
outbound_links_count: 2  ← LOW!
inbound_links_count: 15  ← Good!
link_health_score: 45  ← Needs work
article_age: "Established (6-12 months)"
```

---

### **2. Articles Needing Links**
```sql
SELECT * FROM articles_needing_links;
```

**This is your priority list!**

Shows articles that NEED link attention:
- Old articles (> 30 days) with < 3 outbound links
- ANY article with 0 outbound links
- Articles with link health < 30

**Perfect for your weekly link maintenance!**

---

## 🤖 **AUTOMATION WORKFLOW:**

### **Option 1: Manual (Weekly)**
```sql
-- 1. See what needs attention
SELECT * FROM articles_needing_links LIMIT 20;

-- 2. Generate suggestions for all articles
SELECT * FROM generate_link_suggestions_bulk();

-- 3. Review in admin panel (/admin/insights)
-- 4. Approve suggestions → Links applied
```

### **Option 2: Automated (Cron Job)**
```typescript
// Run this daily/weekly via cron or Vercel scheduled function

export async function scanArticlesForLinks() {
  const { data } = await supabase.rpc('generate_link_suggestions_bulk');
  
  console.log(`✅ Created ${data.length} batches of link suggestions`);
  
  // Optional: Send email notification
  if (data.length > 0) {
    await sendEmail({
      subject: `${data.length} articles have new link suggestions`,
      body: 'Review them at /admin/insights/link-suggestions'
    });
  }
}
```

---

## 📊 **USE CASES:**

### **Use Case 1: Old Article Maintenance**
```
Article: "BPO Career Guide" (published 8 months ago)
Problem: Only has 2 outbound links

Scanner finds:
- 12 related articles published AFTER this one
- 5 existing articles that should have been linked

Result: 17 new link suggestions!
```

### **Use Case 2: New Content Published**
```
Today: You publish "13th Month Pay Calculator"

Scanner detects:
- 8 old articles about salary that should link to it

Result: Suggests 8 BACKWARD links
  (from old articles TO new calculator)
```

### **Use Case 3: Silo Building**
```
Silo: "Employment Guide" (20 articles)
Problem: Articles aren't well connected

Scanner finds:
- 47 missing internal connections
- Creates web of related links

Result: Strong silo structure for SEO!
```

---

## 🎯 **REAL EXAMPLE:**

### **Scenario: 6 Months After Launch**

You have:
- 100 published articles
- Some are 6 months old
- Some published yesterday

**Run scanner:**
```sql
SELECT * FROM generate_link_suggestions_bulk();
```

**Results:**
```
67 articles need link attention
234 new link suggestions created
  • 98 links to NEW content (published after)
  • 136 links to missed related content

Top priority:
1. "Minimum Wage Guide" (7 months old, 1 link) → 14 suggestions
2. "BPO Interview Tips" (5 months old, 0 links!) → 11 suggestions
3. "DOLE Regulations" (8 months old, 2 links) → 9 suggestions
```

**You review and approve in admin panel**

**Result:**
- Old articles now link to new content ✅
- Better internal linking structure ✅
- Improved SEO ✅
- Users find related content easier ✅

---

## 🔧 **ADMIN PANEL INTEGRATION (TODO):**

Create new page: `/admin/insights/link-scanner`

**Features:**
1. **Dashboard:**
   - Articles needing links (from `articles_needing_links` view)
   - Link health scores
   - "Scan Now" button

2. **Pending Suggestions:**
   - List of AI-generated suggestions
   - Source article → Target article
   - Approve/Reject buttons
   - Bulk approve

3. **Automation Settings:**
   - Schedule: Daily/Weekly/Manual
   - Min link health threshold
   - Max suggestions per article

---

## 📝 **EXAMPLE QUERIES:**

### **Find old articles with few links:**
```sql
SELECT 
  title,
  days_since_published,
  outbound_links_count,
  link_health_score
FROM link_coverage_report
WHERE days_since_published > 180
  AND outbound_links_count < 3
ORDER BY days_since_published DESC;
```

### **Generate suggestions for articles > 3 months old:**
```sql
SELECT generate_link_suggestions_for_article(id)
FROM insights_posts
WHERE is_published = true
  AND published_at < NOW() - INTERVAL '3 months'
  AND (
    SELECT COUNT(*) 
    FROM internal_links 
    WHERE source_post_id = insights_posts.id
  ) < 5;
```

### **See what new content an old article should link to:**
```sql
SELECT *
FROM find_missing_links_for_article('old-article-uuid')
WHERE is_newer_content = true;
```

---

## ✅ **BENEFITS:**

✅ **Automatic Discovery:** No manual searching for related content  
✅ **Catches New Content:** Links old articles to new ones automatically  
✅ **Fills Gaps:** Finds missed linking opportunities  
✅ **SEO Improvement:** Better internal link structure  
✅ **Time Saver:** AI does the scanning, you just approve  
✅ **Scalable:** Works with 100 or 10,000 articles  
✅ **Prioritized:** Shows which articles need attention most  

---

## 🚀 **GET STARTED:**

### **Step 1: Run Migration**
```sql
-- Run this in Supabase SQL Editor
/20260109_smart_link_scanner.sql
```

### **Step 2: Try It**
```sql
-- See articles that need links
SELECT * FROM articles_needing_links;

-- Generate suggestions for all
SELECT * FROM generate_link_suggestions_bulk();

-- Check link_suggestions table
SELECT * FROM link_suggestions WHERE status = 'pending';
```

### **Step 3: Review & Approve**
- Go to admin panel
- Review suggestions
- Approve → Links applied automatically!

### **Step 4: Automate**
Set up daily/weekly cron job:
```typescript
// Vercel cron or similar
cron.schedule('0 2 * * *', async () => {
  await supabase.rpc('generate_link_suggestions_bulk');
});
```

---

## 🎉 **THE RESULT:**

After 6 months:
- ✅ 100 articles all well-connected
- ✅ New content automatically linked from old articles
- ✅ No orphaned pages
- ✅ Strong silo structure
- ✅ Better SEO rankings
- ✅ Users find related content easily

**IT WORKS CONTINUOUSLY IN THE BACKGROUND!** 🔥

