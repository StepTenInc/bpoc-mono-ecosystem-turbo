# 🏗️ INSIGHTS SILO STRUCTURE - START FRESH GUIDE

**Date:** January 9, 2026  
**Status:** Clean Slate - Rebuilding Properly

---

## 🎯 **THE NEW STRUCTURE**

### **Base URL:** `/insights`

```
www.bpoc.io/insights  (Main Hub - lists all silos)
    │
    ├─ /insights/salary-guide  (PILLAR - Silo Topic: "Salary Guide")
    │   ├─ /insights/13th-month-pay-philippines  (SUPPORTING)
    │   ├─ /insights/minimum-wage-philippines  (SUPPORTING)
    │   └─ /insights/overtime-pay-rules  (SUPPORTING)
    │
    ├─ /insights/regularization-guide  (PILLAR - Silo Topic: "Regularization")
    │   ├─ /insights/when-become-regular-employee  (SUPPORTING)
    │   ├─ /insights/probationary-period-guide  (SUPPORTING)
    │   └─ /insights/regular-vs-contractual  (SUPPORTING)
    │
    └─ /insights/benefits-rights-guide  (PILLAR - Silo Topic: "Benefits & Rights")
        ├─ /insights/employee-benefits-complete-guide  (SUPPORTING)
        └─ /insights/sss-contributions-guide  (SUPPORTING)
```

---

## 🏷️ **CONTENT TYPES**

Every article must be marked with `content_type`:

### **1. HUB** (Only One)
- **What:** Main `/insights` landing page
- **Purpose:** List all pillar pages
- **Example:** "BPOC Insights - Philippine Employment Guide"

### **2. PILLAR** (One per silo)
- **What:** Main topic overview page
- **Must Have:** `silo_topic` filled
- **Example:** 
  - Title: "Complete Salary & Compensation Guide Philippines"
  - Slug: `/insights/salary-guide`
  - Silo Topic: "Salary Guide"
  - Content Type: `pillar`

### **3. SUPPORTING** (Multiple per silo)
- **What:** Deep-dive articles
- **Must Have:** `pillar_page_id` (links to its pillar)
- **Example:**
  - Title: "13th Month Pay Philippines 2026"
  - Slug: `/insights/13th-month-pay-philippines`
  - Pillar Page ID: `uuid-of-salary-guide-pillar`
  - Content Type: `supporting`

---

## 📊 **DATABASE FIELDS**

```typescript
insights_posts {
  // NEW SILO FIELDS
  content_type: 'pillar' | 'supporting' | 'hub'
  silo_topic: string  // "Salary Guide", "Regularization", etc.
  pillar_page_id: uuid  // Links supporting → pillar
  
  // Existing fields
  title, slug, content, category, etc.
}
```

---

## 🎨 **8 SILOS TO BUILD**

Based on your DOLE strategy:

1. **Salary Guide** (15 articles)
   - Pillar: Complete Salary & Compensation Guide
   - Supporting: 13th month, minimum wage, overtime, etc.

2. **Regularization** (20 articles)
   - Pillar: Employment Status & Regularization Guide
   - Supporting: Probation, regular vs contractual, etc.

3. **Benefits & Rights** (10 articles)
   - Pillar: Employee Benefits Complete Guide
   - Supporting: SSS, PhilHealth, Pag-IBIG, etc.

4. **Leaves & Time Off** (12 articles)
   - Pillar: Complete Leave Entitlements Guide
   - Supporting: SIL, maternity, sick leave, etc.

5. **Resignation & Termination** (18 articles)
   - Pillar: Resignation & Termination Rights Guide
   - Supporting: How to resign, separation pay, etc.

6. **Working Hours** (10 articles)
   - Pillar: Working Hours & Conditions Guide
   - Supporting: 8-hour rule, overtime, rest days, etc.

7. **Employment Contracts** (12 articles)
   - Pillar: Employment Contracts & Rights Guide
   - Supporting: Contract essentials, non-compete, etc.

8. **Job Hunting** (3 articles)
   - Pillar: BPO Career & Job Hunting Guide
   - Supporting: Red flags, pre-employment, BPOC jobs

**Total:** 8 pillars + 100 supporting articles

---

## 🚀 **WORKFLOW: Create Articles The Right Way**

### **Step 1: Create Pillar Page First**

```typescript
// Example: Salary Guide Pillar
{
  title: "Complete Salary & Compensation Guide Philippines 2026",
  slug: "salary-guide",
  content_type: "pillar",
  silo_topic: "Salary Guide",
  pillar_page_id: null, // It IS the pillar
  content: "Overview of all salary topics...",
  // ... other fields
}
```

### **Step 2: Create Supporting Articles**

```typescript
// Example: 13th Month Pay (supporting)
{
  title: "13th Month Pay Philippines 2026: Complete Guide",
  slug: "13th-month-pay-philippines",
  content_type: "supporting",
  silo_topic: null, // Inherited from pillar
  pillar_page_id: "uuid-of-salary-guide-pillar",
  content: "Deep dive into 13th month...",
  // ... other fields
}
```

### **Step 3: AI Pipeline Automatically:**
- Generates embeddings
- Suggests links to other supporting articles in same silo
- Suggests links to pillar page
- Suggests links to related silos

---

## 🔗 **INTERNAL LINKING STRATEGY**

### **UP Links (to parent):**
Every supporting article links to its pillar:
```markdown
[Back to Salary Guide](/insights/salary-guide)
```

### **SIDEWAYS Links (same silo):**
Supporting articles link to each other:
```markdown
[See also: Minimum Wage Guide](/insights/minimum-wage-philippines)
```

### **CROSS-SILO Links:**
Link between related silos:
```markdown
From: 13th Month Pay article
To: Benefits & Rights pillar
"Learn more about [employee benefits](/insights/benefits-rights-guide)"
```

---

## 📈 **ANALYTICS BY SILO**

Use the `silo_structure` view to monitor:

```sql
-- See all silos with metrics
SELECT * FROM silo_structure ORDER BY silo_topic;

-- Articles in a specific silo
SELECT title, slug, is_published 
FROM insights_posts 
WHERE pillar_page_id = 'uuid-of-pillar'
ORDER BY created_at;

-- Orphan articles (not linked to pillar)
SELECT title, slug 
FROM insights_posts 
WHERE content_type = 'supporting' 
AND pillar_page_id IS NULL;
```

---

## ✅ **MIGRATION STEPS**

### **1. Clean Slate**
```sql
-- Run: 20260109_delete_all_insights.sql
-- Deletes all existing insights
```

### **2. Add Silo Fields**
```sql
-- Run: 20260109_add_silo_structure.sql
-- Adds: content_type, silo_topic, pillar_page_id
```

### **3. Verify**
```sql
-- Check fields exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'insights_posts' 
AND column_name IN ('content_type', 'silo_topic', 'pillar_page_id');
```

---

## 🎯 **START SMALL, SCALE PERFECT**

### **Phase 1: Build One Complete Silo**
1. Create "Salary Guide" pillar
2. Generate 3 supporting articles
3. Test linking
4. Test pipeline
5. Verify analytics
6. **Get it PERFECT!**

### **Phase 2: Add More Silos**
Once Phase 1 works flawlessly:
- Add "Regularization" silo
- Add "Benefits & Rights" silo
- Rinse and repeat

### **Phase 3: Scale to 100**
When structure is proven:
- Use AI pipeline to generate remaining articles
- Maintain proper pillar/supporting structure
- Smart link scanner connects everything

---

## 🔥 **BENEFITS OF THIS STRUCTURE**

✅ **Clear hierarchy** - Easy to see what's pillar vs supporting  
✅ **SEO power** - Proper silo structure = Google loves it  
✅ **Easy management** - Know exactly what silo each article belongs to  
✅ **Smart linking** - Pipeline auto-links within silos  
✅ **Analytics** - Track performance by silo  
✅ **Scalable** - Add silos one at a time  
✅ **Clean** - No orphan articles, everything has a home  

---

## 📝 **NEXT ACTIONS**

1. ✅ Run clean slate SQL (delete all insights)
2. ✅ Run silo structure SQL (add fields)
3. ✅ Create first pillar page manually
4. ✅ Generate 3 supporting articles via pipeline
5. ✅ Test and verify structure
6. ✅ Scale when perfect!

---

**START FRESH, BUILD RIGHT, SCALE BIG!** 🚀

