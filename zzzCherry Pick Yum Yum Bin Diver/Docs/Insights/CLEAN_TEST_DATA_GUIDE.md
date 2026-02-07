# 🗑️ CLEAN TEST DATA GUIDE

**Date:** January 9, 2026  
**Purpose:** Remove all test/dummy data while keeping database structure intact

---

## ⚠️ **WHAT THIS DOES:**

This script **DELETES ALL DATA** from:
- ✅ insights_posts
- ✅ seo_metadata
- ✅ internal_links
- ✅ link_suggestions
- ✅ insight_embeddings
- ✅ image_generation_logs
- ✅ pipeline_execution_logs

---

## ✅ **WHAT IT KEEPS:**

- ✅ All tables (structure)
- ✅ All columns
- ✅ All functions
- ✅ All views
- ✅ All indexes
- ✅ All constraints

---

## 🚀 **HOW TO USE:**

### **Run the cleanup script:**

1. Open Supabase SQL Editor
2. Copy/paste:
   ```
   /Users/stepten/Desktop/Dev Projects/bpoc-stepten/Supabase: CLEAN_TEST_DATA.sql
   ```
3. Click "Run"

---

## 📊 **EXPECTED OUTPUT:**

```
⚠️  WARNING: This will DELETE ALL insights data!
⏸️  PAUSING FOR 3 SECONDS...

🗑️  Starting cleanup...
✅ Deleted pipeline_execution_logs
✅ Deleted image_generation_logs
✅ Deleted insight_embeddings
✅ Deleted link_suggestions
✅ Deleted internal_links
✅ Deleted seo_metadata
✅ Deleted insights_posts

═══════════════════════════════════════════════════════
📊 CLEANUP VERIFICATION
═══════════════════════════════════════════════════════
insights_posts:          0 rows
seo_metadata:            0 rows
internal_links:          0 rows
link_suggestions:        0 rows
insight_embeddings:      0 rows
image_generation_logs:   0 rows
pipeline_execution_logs: 0 rows
═══════════════════════════════════════════════════════
✅ ALL TEST DATA CLEANED!
🎯 Database is ready for production content!
═══════════════════════════════════════════════════════

✅ Tables still exist      | table_count: 7
✅ Functions still exist    | function_count: 4+
✅ Views still exist        | view_count: 5

🎉 CLEANUP COMPLETE!
```

---

## 🔍 **VERIFY IT WORKED:**

### **Check all tables are empty:**
```sql
SELECT 
  'insights_posts' as table_name,
  COUNT(*) as rows
FROM insights_posts

UNION ALL

SELECT 'internal_links', COUNT(*) FROM internal_links
UNION ALL
SELECT 'link_suggestions', COUNT(*) FROM link_suggestions
UNION ALL
SELECT 'insight_embeddings', COUNT(*) FROM insight_embeddings
UNION ALL
SELECT 'image_generation_logs', COUNT(*) FROM image_generation_logs;
```

**Expected:** All show `0 rows`

---

### **Check structure still exists:**
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'insight%'
  OR table_name IN ('internal_links', 'seo_metadata');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%article%' 
  OR routine_name LIKE '%link%';
```

**Expected:** All tables and functions still listed

---

## 🎯 **AFTER CLEANUP:**

You're ready to create production content:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

const prisma = createClient();

// Create your first REAL pillar page
const firstPillar = await prisma.insights_posts.create({
  data: {
    title: "Employment Guide Philippines 2026",
    slug: "employment-guide",
    content: "<p>Your complete guide...</p>",
    description: "Everything you need to know",
    category: "Employment Guide",
    author: "BPOC Team",
    author_slug: "bpoc-team",
    content_type: "pillar",
    silo_topic: "Employment Guide",
    depth: 1,
    is_published: true,
    published_at: new Date()
  }
});

console.log("✅ First production article created!");
```

---

## ⚠️ **SAFETY NOTES:**

1. **This is destructive** - all data is permanently deleted
2. **No undo** - make sure you want to clean everything
3. **Structure preserved** - tables/functions/views remain
4. **Foreign keys respected** - deletes in correct order
5. **No backup needed** - it's just test data anyway

---

## 🔄 **IF YOU NEED TEST DATA AGAIN:**

Run the test suite again:
```
prisma-supabase/TEST_COMPLETE_SYSTEM.sql
```

It will recreate test articles for testing.

---

## ✅ **CHECKLIST:**

After running cleanup:
- [ ] All tables show 0 rows
- [ ] All tables still exist
- [ ] All functions still work
- [ ] All views still work
- [ ] Ready to create production content
- [ ] Clean slate for building content silos

---

## 🎉 **YOU'RE CLEAN!**

- ✅ No test data
- ✅ All structure intact
- ✅ Ready for production
- ✅ Fresh start for your 100 articles

**GO BUILD YOUR CONTENT EMPIRE!** 🚀

