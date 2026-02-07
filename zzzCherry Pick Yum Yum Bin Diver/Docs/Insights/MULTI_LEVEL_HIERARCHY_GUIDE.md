# 🌳 MULTI-LEVEL SILO HIERARCHY - 4 LEVELS DEEP

**Date:** January 9, 2026  
**Purpose:** Support deep hierarchies + cross-silo linking

---

## 🎯 **THE HIERARCHY SYSTEM**

### **5 Depth Levels (0-4):**

```
DEPTH 0: HUB
  └─ /insights (Main landing page)

DEPTH 1: PILLAR
  ├─ /insights/employment-guide
  ├─ /insights/bpo-jobs
  └─ /insights/salary-guide

DEPTH 2: SUB-PILLAR
  ├─ /insights/dole-rules
  ├─ /insights/manila-jobs
  └─ /insights/compensation-types

DEPTH 3: TOPIC
  ├─ /insights/terminations
  ├─ /insights/makati-call-centers
  └─ /insights/13th-month-details

DEPTH 4: DEEP ARTICLE
  ├─ /insights/how-not-to-get-terminated
  ├─ /insights/best-makati-bpo-companies
  └─ /insights/13th-month-calculation-examples
```

---

## 📊 **DATABASE STRUCTURE**

### **New Fields:**

```sql
insights_posts {
  depth: INTEGER (0-4)
  parent_id: UUID (links to parent article)
  content_type: TEXT (pillar/supporting/hub)
  silo_topic: TEXT (optional, for grouping)
}
```

---

## 🌲 **EXAMPLE HIERARCHIES**

### **Example 1: BPO Jobs Silo**

```
DEPTH 1: BPO Jobs in Philippines (PILLAR)
  │
  ├─ DEPTH 2: BPO Jobs by City (SUB-PILLAR)
  │   │
  │   ├─ DEPTH 3: BPO Jobs Manila (TOPIC)
  │   │   │
  │   │   ├─ DEPTH 4: Best Call Centers Makati (DEEP)
  │   │   └─ DEPTH 4: Ortigas BPO Companies (DEEP)
  │   │
  │   └─ DEPTH 3: BPO Jobs Cebu (TOPIC)
  │       └─ DEPTH 4: IT Park BPO Companies (DEEP)
  │
  └─ DEPTH 2: BPO Jobs by Industry (SUB-PILLAR)
      └─ DEPTH 3: Healthcare BPO (TOPIC)
          └─ DEPTH 4: Medical Coding Jobs (DEEP)
```

### **Example 2: Employment Guide Silo**

```
DEPTH 1: Philippine Employment Guide (PILLAR)
  │
  ├─ DEPTH 2: DOLE Rules & Regulations (SUB-PILLAR)
  │   │
  │   ├─ DEPTH 3: Termination Laws (TOPIC)
  │   │   │
  │   │   ├─ DEPTH 4: How Not to Get Terminated (DEEP)
  │   │   ├─ DEPTH 4: Fighting Illegal Dismissal (DEEP)
  │   │   └─ DEPTH 4: Separation Pay Calculator (DEEP)
  │   │
  │   └─ DEPTH 3: Regularization Process (TOPIC)
  │       └─ DEPTH 4: 6-Month Probation Timeline (DEEP)
  │
  └─ DEPTH 2: Employee Rights (SUB-PILLAR)
      └─ DEPTH 3: Salary Rights (TOPIC)
          └─ DEPTH 4: Minimum Wage by Region (DEEP)
```

---

## 🔗 **CROSS-SILO LINKING (SIDEWAYS)**

Articles can link to other silos:

```
Article: "How Not to Get Terminated" (Employment Guide silo)
  │
  ├─ UP: Termination Laws
  ├─ DOWN: (none, it's depth 4)
  ├─ SIDEWAYS: "Know Your Rights" (Employee Rights silo)
  └─ SIDEWAYS: "Finding New Jobs" (BPO Jobs silo)
```

**Tracked in:** `cross_silo_links` table

---

## 🧭 **NAVIGATION & BREADCRUMBS**

### **Automatic Breadcrumbs:**

```sql
-- Get full path for any article
SELECT * FROM get_article_breadcrumb('article-uuid');

-- Returns:
Employment Guide > DOLE Rules > Terminations > How Not to Get Terminated
```

### **Get All Children:**

```sql
-- Get all descendants
SELECT * FROM get_article_children('pillar-uuid');

-- Returns all child articles at any depth
```

### **Get Siblings:**

```sql
-- Get articles at same level with same parent
SELECT * FROM get_article_siblings('article-uuid');
```

---

## 📝 **HOW TO CREATE ARTICLES**

### **Depth 1: Pillar**
```typescript
{
  title: "Philippine Employment Guide",
  slug: "employment-guide",
  depth: 1,
  content_type: "pillar",
  silo_topic: "Employment Guide",
  parent_id: null,  // Top level
}
```

### **Depth 2: Sub-Pillar**
```typescript
{
  title: "DOLE Rules & Regulations",
  slug: "dole-rules",
  depth: 2,
  content_type: "supporting",
  parent_id: "uuid-of-employment-guide",  // Links to pillar
}
```

### **Depth 3: Topic**
```typescript
{
  title: "Termination Laws Philippines",
  slug: "terminations",
  depth: 3,
  content_type: "supporting",
  parent_id: "uuid-of-dole-rules",  // Links to sub-pillar
}
```

### **Depth 4: Deep Article**
```typescript
{
  title: "How Not to Get Terminated and End Up in Front of DOLE",
  slug: "how-not-to-get-terminated",
  depth: 4,
  content_type: "supporting",
  parent_id: "uuid-of-terminations",  // Links to topic
}
```

---

## 🔍 **FINDING ARTICLES BY DEPTH**

```sql
-- All pillars (depth 1)
SELECT * FROM insights_posts WHERE depth = 1;

-- All sub-pillars under a specific pillar
SELECT * FROM insights_posts 
WHERE depth = 2 AND parent_id = 'pillar-uuid';

-- All deep articles (depth 4)
SELECT * FROM insights_posts WHERE depth = 4;

-- View entire hierarchy as tree
SELECT * FROM silo_hierarchy;
```

---

## 🎨 **VISUAL REPRESENTATION**

```
┌─────────────────────────────────────────────────────────┐
│ DEPTH 0: /insights (Hub)                                │
└─────────────────────────────────────────────────────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
┌──────────▼───────────┐          ┌──────────▼───────────┐
│ DEPTH 1: Pillar      │          │ DEPTH 1: Pillar      │
│ Employment Guide     │          │ BPO Jobs             │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                  │
     ┌─────┴─────┐                     ┌─────┴─────┐
     │           │                     │           │
┌────▼────┐ ┌────▼────┐          ┌────▼────┐ ┌────▼────┐
│ DEPTH 2 │ │ DEPTH 2 │          │ DEPTH 2 │ │ DEPTH 2 │
│ DOLE    │ │ Rights  │          │ By City │ │ By Type │
│ Rules   │ │         │          │         │ │         │
└────┬────┘ └─────────┘          └────┬────┘ └─────────┘
     │                                 │
┌────▼────┐                       ┌────▼────┐
│ DEPTH 3 │                       │ DEPTH 3 │
│ Termin- │◄─────SIDEWAYS────────▶│ Manila  │
│ ations  │      LINKS            │ Jobs    │
└────┬────┘                       └────┬────┘
     │                                 │
┌────▼────┐                       ┌────▼────┐
│ DEPTH 4 │                       │ DEPTH 4 │
│ How Not │                       │ Makati  │
│ to Get  │                       │ Call    │
│ Fired   │                       │ Centers │
└─────────┘                       └─────────┘
```

---

## 🎯 **LINKING STRATEGY**

### **Vertical Links (Up/Down):**
- ✅ Child → Parent (always)
- ✅ Parent → Children (featured children)

### **Horizontal Links (Sideways):**
- ✅ Same silo, same depth
- ✅ Cross-silo, any depth (use `cross_silo_links`)

### **Smart Link Scanner:**
Your AI pipeline will automatically suggest:
1. **UP links** - to parent
2. **DOWN links** - to key children
3. **SIDEWAYS links** - to siblings
4. **CROSS-SILO links** - to related topics in other silos

---

## 🚀 **FUNCTIONS AVAILABLE**

| Function | Purpose |
|----------|---------|
| `get_article_breadcrumb(id)` | Full path from article to top |
| `get_article_children(id)` | All descendants recursively |
| `get_article_siblings(id)` | Articles at same level |
| `silo_hierarchy` view | See entire tree structure |

---

## 📊 **ANALYTICS BY DEPTH**

```sql
-- Articles by depth level
SELECT 
  depth,
  COUNT(*) as total,
  COUNT(CASE WHEN is_published THEN 1 END) as published
FROM insights_posts
GROUP BY depth
ORDER BY depth;

-- Returns:
-- depth | total | published
-- ------|-------|----------
--   0   |   1   |     1      (Hub)
--   1   |   8   |     6      (Pillars)
--   2   |  24   |    18      (Sub-pillars)
--   3   |  40   |    30      (Topics)
--   4   |  27   |    20      (Deep articles)
```

---

## ✅ **READY TO BUILD**

Now you can create:
- Deep hierarchies (up to 4 levels)
- Cross-silo links (sideways connections)
- Automatic breadcrumbs
- Recursive navigation
- Smart link suggestions at any depth

**Start with depth 1 pillars, then build down!** 🌳🚀

