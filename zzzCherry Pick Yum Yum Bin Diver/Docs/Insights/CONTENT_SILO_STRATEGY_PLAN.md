# 🎯 BPOC INSIGHTS CONTENT SILO STRATEGY - MASTER PLAN

**Date:** January 9, 2026  
**Goal:** Create semantically connected content silos that dominate Philippine employment law SEO

---

## 🧠 STRATEGIC DECISION: ONE SILO OR TWO?

### **RECOMMENDATION: ✅ KEEP ONE UNIFIED SILO - "Benefits & Rights"**

**Why NOT create separate "Employment Guide" silo:**

1. **SEO Authority:** One strong pillar > Two weak pillars
2. **User Intent:** All searches are about the same thing (employee rights/benefits)
3. **Link Juice:** Concentrated authority in one place
4. **Semantic Overlap:** 80% of content overlaps between "benefits" and "employment rights"
5. **Competition:** Can't compete against ourselves for same keywords

### **The Screenshot Shows:**
```
BPOC Intelligence (Home) → Benefits & Rights (PILLAR)
```

This IS your "Philippine Employment Guide" pillar! Just rename it.

---

## 🏗️ PROPOSED UNIFIED SILO ARCHITECTURE

### **Level 1: MAIN HUB (Pillar Page)**

```
www.bpoc.io/philippine-employment-guide
(Currently: Benefits & Rights)

Title: "Philippine Employment Rights & Benefits Guide 2026"
Purpose: THE definitive resource linking to everything
```

**This page contains:**
- Overview of Philippine Labor Code
- Quick navigation to all 8 clusters
- "Ask HR Assistant" prominent CTA
- Links to top 20 most important articles
- Schema markup as "CollectionPage"

---

### **Level 2: SUB-HUBS (8 Clusters)**

These are your category pages that organize the 100 articles:

#### **Cluster 1: Regularization & Employment Status**
- **URL:** `/insights/regularization-employment-guide`
- **Pillar Article:** "When Do You Become a Regular Employee?"
- **20 Articles:** All about probation, regularization, employment types
- **Links UP to:** Philippine Employment Guide
- **Links DOWN to:** 20 cluster articles
- **Links SIDEWAYS to:** Wages cluster (mentions salary), Benefits cluster

#### **Cluster 2: Wages & Compensation**
- **URL:** `/insights/salary-wages-compensation-guide`
- **Pillar Article:** "Philippine Salary Rights: Complete Guide"
- **15 Articles:** 13th month, minimum wage, overtime, deductions
- **Links UP to:** Philippine Employment Guide
- **Links SIDEWAYS to:** Leaves (mentions paid leaves), Termination (final pay)

#### **Cluster 3: Leaves & Time Off**
- **URL:** `/insights/employee-leaves-guide`
- **Pillar Article:** "Complete Guide to Employee Leaves"
- **12 Articles:** SIL, maternity, sick leave, vacation
- **Links UP to:** Philippine Employment Guide
- **Links SIDEWAYS to:** Benefits (leave benefits), Rights (leave rights)

#### **Cluster 4: Resignation & Termination**
- **URL:** `/insights/resignation-termination-guide`
- **Pillar Article:** "How to Resign & Your Termination Rights"
- **18 Articles:** Resignation process, separation pay, illegal dismissal
- **Links UP to:** Philippine Employment Guide
- **Links SIDEWAYS to:** Wages (final pay), Leaves (unused leaves)

#### **Cluster 5: Working Hours & Conditions**
- **URL:** `/insights/working-hours-conditions-guide`
- **Pillar Article:** "Legal Working Hours in the Philippines"
- **10 Articles:** 8-hour rule, overtime, rest days, shifts
- **Links UP to:** Philippine Employment Guide
- **Links SIDEWAYS to:** Wages (overtime pay), Rights (forced overtime)

#### **Cluster 6: Employment Contracts & Rights**
- **URL:** `/insights/employment-contract-rights-guide`
- **Pillar Article:** "Your Employment Rights in the Philippines"
- **12 Articles:** Contract essentials, rights, violations, harassment
- **Links UP to:** Philippine Employment Guide
- **Links SIDEWAYS to:** All other clusters (cross-cutting topic)

#### **Cluster 7: Benefits & Government Mandates**
- **URL:** `/insights/employee-benefits-guide`
- **Pillar Article:** "Complete Guide to Employee Benefits"
- **10 Articles:** SSS, PhilHealth, Pag-IBIG, HMO, retirement
- **Links UP to:** Philippine Employment Guide
- **Links SIDEWAYS to:** Wages (deductions), Termination (retirement)

#### **Cluster 8: Job Hunting & Career**
- **URL:** `/insights/bpo-career-job-hunting-guide`
- **Pillar Article:** "BPO Career Guide Philippines"
- **3 Articles:** Job hunting tips, red flags, BPOC platform
- **Links UP to:** Philippine Employment Guide
- **Links OUT to:** Job search, applications
- **CONVERSION HEAVY:** Main funnel to job applications

---

## 🔗 INTERNAL LINKING STRATEGY

### **The 3-Directional Linking System:**

```
                    [Philippine Employment Guide]
                         (MAIN PILLAR)
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      [Regularization]   [Wages & Pay]   [Resignation]
        (SUB-HUB)         (SUB-HUB)       (SUB-HUB)
              │               │               │
        ┌─────┼─────┐   ┌─────┼─────┐  ┌─────┼─────┐
        ▼     ▼     ▼   ▼     ▼     ▼  ▼     ▼     ▼
      Art1  Art2  Art3 Art21 Art22 Art23 Art48 Art49 Art50
        │     │     │   │     │     │  │     │     │
        └─────┴─────┴───┴─────┴─────┴──┴─────┴─────┘
                         (SIDEWAYS)
```

### **Linking Rules:**

#### **1. UP Links (to parent):**
- Every article → its cluster hub
- Every cluster hub → main pillar
- **Anchor text examples:**
  - "Complete employment guide"
  - "Back to regularization guide"
  - "See full benefits guide"

#### **2. DOWN Links (to children):**
- Main pillar → all 8 cluster hubs
- Cluster hubs → their 10-20 articles
- **Placement:** Table of contents, related articles section
- **Anchor text examples:**
  - "Learn about regularization"
  - "Read more about 13th month pay"

#### **3. SIDEWAYS Links (lateral):**
- Articles within same cluster (3-4 links)
- Articles to related clusters (2-3 links)
- **Anchor text examples:**
  - "Check your separation pay rights"
  - "Understand overtime rules"
  - "See maternity leave benefits"

### **AI-Powered Link Suggestions:**

Use your embeddings system to auto-suggest:

```typescript
// When writing article about "probation"
const suggestedLinks = await getSimilarArticles(articleEmbedding, {
  minSimilarity: 0.75,
  excludeSameCluster: false,
  limit: 10
});

// Returns:
[
  { title: "Regular vs Contractual", similarity: 0.89, cluster: "regularization" },
  { title: "Termination During Probation", similarity: 0.87, cluster: "regularization" },
  { title: "Benefits During Probation", similarity: 0.82, cluster: "benefits" }, // SIDEWAYS!
  { title: "Resignation in Probation", similarity: 0.79, cluster: "termination" } // SIDEWAYS!
]
```

---

## 🧬 SEMANTIC CONNECTION TO HR KNOWLEDGE BASE

### **Bridge Between Insights & HR Assistant:**

Every insights article about employment law should:

1. **Link to HR KB Articles**
   - Article mentions "probationary period" → link to Labor Code Article 296
   - Use your `related_labor_articles` field

2. **Embed HR Assistant Widget**
   ```html
   <div class="hr-assistant-cta">
     <h3>Have specific questions about probationary period?</h3>
     <button onclick="openHRAssistant('What are my rights during probation?')">
       Ask Our AI Legal Assistant
     </button>
   </div>
   ```

3. **Pre-load Questions**
   - Detect topic from article
   - Pre-fill HR Assistant with relevant question
   - Track engagement: `hr_assistant_opens` in analytics

### **Embedding Connection Strategy:**

```sql
-- Find insights related to HR KB topics
SELECT 
  i.title AS insight_title,
  i.slug AS insight_slug,
  COUNT(DISTINCT hrk.article_number) AS related_hr_articles,
  ARRAY_AGG(DISTINCT hrk.topic) AS hr_topics
FROM insights_posts i
CROSS JOIN LATERAL (
  SELECT 
    article_number,
    topic,
    (1 - (embedding <=> i.embedding)) AS similarity
  FROM hr_knowledge_base
  WHERE (1 - (embedding <=> i.embedding)) > 0.7
  LIMIT 5
) hrk
GROUP BY i.id;
```

---

## 📊 CONTENT MATRIX: HOW ARTICLES CONNECT

### **Example: "When Do You Become Regular Employee?"**

**UP Links (1):**
- → Philippine Employment Guide (main pillar)

**DOWN Links (none - it's a leaf article)**

**SIDEWAYS Links (5-7):**

| Link To | Anchor Text | Why Connected |
|---------|------------|---------------|
| Probationary Period Guide | "your probationary period" | Same cluster |
| Regular vs Contractual | "difference between regular and contractual" | Same cluster |
| Termination During Probation | "being terminated during probation" | Related topic |
| Benefits During Probation | "benefits you're entitled to" | Cross-cluster |
| Employment Contract Guide | "your employment contract" | Cross-cluster |
| Security of Tenure | "what security of tenure means" | Same cluster |
| BPO Regularization Special | "if you work in BPO" | Same cluster + industry |

**HR KB Links (3):**
- Labor Code Article 295 (Regular Employment)
- Labor Code Article 296 (Probationary Period)
- Labor Code Article 297 (Security of Tenure)

**CTAs (3):**
1. Top: "Browse BPO Jobs" → `/jobs`
2. Middle: "Ask HR Assistant about Regularization" → HR popup
3. Bottom: "Find Your Next Opportunity" → `/talent-search`

---

## 🎨 VISUAL SILO MAP (ReactFlow Implementation)

### **What Your SiloVisualization Should Show:**

```javascript
const siloStructure = {
  nodes: [
    // Main Hub
    { 
      id: 'hub', 
      type: 'pillar',
      data: { 
        label: 'Philippine Employment Guide',
        articles: 100,
        traffic: '50K/mo',
        status: 'pillar'
      },
      position: { x: 500, y: 0 }
    },
    
    // Sub-Hubs (8 clusters)
    { 
      id: 'regularization', 
      type: 'cluster',
      data: { 
        label: 'Regularization (20)',
        orphans: 0,
        avgLinks: 4.2
      },
      position: { x: 100, y: 200 }
    },
    { 
      id: 'wages', 
      type: 'cluster',
      data: { label: 'Wages (15)' },
      position: { x: 300, y: 200 }
    },
    // ... 6 more clusters
    
    // Individual Articles (100 nodes)
    {
      id: 'art-001',
      type: 'article',
      data: {
        title: 'When Become Regular Employee',
        published: true,
        views: 1200,
        inboundLinks: 5,
        outboundLinks: 7,
        hrLinks: 3
      },
      position: { x: 50, y: 350 }
    },
    // ... 99 more articles
  ],
  
  edges: [
    // UP links (all articles → cluster → hub)
    { source: 'art-001', target: 'regularization', type: 'up', label: '↑ Parent' },
    { source: 'regularization', target: 'hub', type: 'up', label: '↑ Pillar' },
    
    // SIDEWAYS links (article ← → article)
    { source: 'art-001', target: 'art-002', type: 'lateral', label: '↔ Related' },
    { source: 'art-001', target: 'art-021', type: 'lateral', label: '↔ Cross-cluster' },
    
    // HR KB links (article → HR KB)
    { source: 'art-001', target: 'hr-art-295', type: 'external', label: '→ Labor Code' }
  ]
};
```

### **Color Coding:**
- 🟣 Purple: Main pillar
- 🔵 Blue: Cluster hubs
- 🟢 Green: Published articles (good linking)
- 🟡 Yellow: Published articles (weak linking)
- 🔴 Red: Orphan articles (no inbound links)
- ⚫ Gray: Unpublished/draft

---

## 🤖 AI GENERATOR WORKFLOW

### **How to Use AI Generator for This Strategy:**

#### **Step 1: Cluster Selection**
```
[ ] Regularization & Employment Status
[ ] Wages & Compensation
[ ] Leaves & Time Off
[ ] Resignation & Termination
[ ] Working Hours & Conditions
[ ] Employment Contracts & Rights
[ ] Benefits & Government Mandates
[ ] Job Hunting & Career
```

#### **Step 2: Article Selection**
Shows articles 1-100 from DOLE_BPOC_SEO_CONTENT_STRATEGY.md:
```
Cluster: Regularization
[✓] 1. When Do You Become Regular Employee? (PUBLISHED)
[✓] 2. Probationary Period Guide (PUBLISHED)
[ ] 3. Regular vs Contractual (GENERATE THIS)
[ ] 4. Can Your Employer Fire You During Probation?
...
```

#### **Step 3: Auto-populate Fields**
Based on article plan:
- ✅ Slug (from plan)
- ✅ Title (from plan)
- ✅ Semantic IDs (from plan)
- ✅ Focus keyword
- ✅ Meta description template
- ✅ H2 headlines (from plan)

#### **Step 4: Auto-suggest Links**
Use embeddings to suggest:
- **UP link:** → Cluster hub → Main pillar
- **DOWN links:** (none for leaf articles)
- **SIDEWAYS links:** 5-7 related articles
- **HR KB links:** 2-3 Labor Code articles
- **CTAs:** Pre-populate 3 conversion points

#### **Step 5: AI Generation**
```typescript
const articlePrompt = `
Write a comprehensive article about "${articleData.title}" for Philippine BPO workers.

REQUIREMENTS:
- Target keyword: "${articleData.focusKeyword}"
- Word count: 1,800-2,200 words
- Include these H2 sections: ${articleData.h2Headlines.join(', ')}
- Reference these Labor Code articles: ${articleData.relatedLaborArticles.join(', ')}
- Link to these related articles: ${articleData.suggestedLinks.map(l => l.title).join(', ')}
- Tone: Friendly, helpful, authoritative
- Persona: "Ate Yna" (Filipino HR expert)
- Include 3 CTAs: top (Find BPO Jobs), middle (Ask HR Assistant), bottom (Apply Now)

STRUCTURE:
1. Introduction (hook with common problem)
2. [H2 sections from plan]
3. Key Takeaways box
4. FAQ (5 questions with schema markup)
5. Related Articles section
6. Final CTA

Use Taglish when appropriate. Focus on practical, actionable advice.
`;

// Generate with Claude/GPT
const content = await generateArticle(articlePrompt);
```

#### **Step 6: Auto-linking**
After generation:
```typescript
// Auto-insert internal links
const contentWithLinks = insertInternalLinks(content, {
  suggestedLinks: articleData.suggestedLinks,
  anchorTextStyle: 'natural', // Don't use exact match anchors
  maxLinksPerArticle: 7,
  distribution: 'even' // Spread throughout content
});

// Auto-insert HR KB links
const finalContent = insertHRKBLinks(contentWithLinks, {
  laborArticles: articleData.relatedLaborArticles,
  ctaPlacement: ['after-h2-1', 'mid-content', 'before-faq']
});
```

---

## 📈 ROLLOUT PLAN: 100 ARTICLES IN 9 MONTHS

### **Publishing Schedule:**

| Month | Cluster | Articles | Per Week | Status |
|-------|---------|----------|----------|--------|
| **Month 1-2** | Regularization | 20 | 3/week | 🔴 Not Started |
| **Month 3** | Wages | 15 | 4/week | 🔴 Not Started |
| **Month 4** | Leaves | 12 | 3/week | 🔴 Not Started |
| **Month 5** | Termination | 18 | 4-5/week | 🔴 Not Started |
| **Month 6** | Working Hours | 10 | 3/week | 🔴 Not Started |
| **Month 7** | Contracts | 12 | 3/week | 🔴 Not Started |
| **Month 8** | Benefits | 10 | 3/week | 🔴 Not Started |
| **Month 9** | Career | 3 | 1/week | 🔴 Not Started |

### **Week 1 Implementation:**

**Day 1-2: Set up cluster hub**
- Create "Regularization & Employment Guide" pillar article
- Link to main Philippine Employment Guide
- Set up schema markup

**Day 3-7: Generate first 3 articles**
- Article 1: "When Do You Become Regular Employee"
- Article 2: "Probationary Period Guide"
- Article 3: "Regular vs Contractual"

Each article:
1. Generate with AI (1 hour)
2. Review & edit (1 hour)
3. Add internal links (30 min)
4. Add HR KB links (30 min)
5. SEO optimization (30 min)
6. Publish (15 min)

**Total:** ~4 hours per article = 12 hours for 3 articles

---

## 🎯 SUCCESS TRACKING

### **Per-Article KPIs:**

```sql
CREATE VIEW article_performance AS
SELECT 
  i.title,
  i.slug,
  i.category AS cluster,
  
  -- Traffic
  SUM(a.views) AS total_views,
  AVG(a.avg_time_on_page) AS avg_time,
  AVG(a.bounce_rate) AS bounce_rate,
  
  -- Engagement
  COUNT(il.target_post_id) AS inbound_links,
  (SELECT COUNT(*) FROM internal_links WHERE source_post_id = i.id) AS outbound_links,
  SUM(a.hr_assistant_opens) AS hr_opens,
  
  -- Conversion
  SUM(a.job_clicks) AS job_clicks,
  (SUM(a.job_clicks)::DECIMAL / NULLIF(SUM(a.views), 0) * 100) AS conversion_rate,
  
  -- SEO
  i.seo_score,
  i.readability_score,
  i.word_count
  
FROM insights_posts i
LEFT JOIN insight_analytics a ON a.insight_id = i.id
LEFT JOIN internal_links il ON il.target_post_id = i.id
WHERE i.is_published = TRUE
GROUP BY i.id;
```

### **Cluster Health Dashboard:**

```typescript
interface ClusterHealth {
  name: string;
  articles: {
    total: number;
    published: number;
    draft: number;
  };
  traffic: {
    totalViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
  };
  linking: {
    avgInboundLinks: number;
    avgOutboundLinks: number;
    orphanArticles: number; // 0 inbound links
    deadEndArticles: number; // 0 outbound links
  };
  conversion: {
    avgJobClicks: number;
    avgHROpens: number;
    conversionRate: number;
  };
  seo: {
    avgSEOScore: number;
    keywordsRanking: number;
    featuredSnippets: number;
  };
  healthScore: number; // 0-100 overall score
}
```

### **Red Flags to Watch:**
- ❌ Orphan articles (no inbound links) → Fix linking
- ❌ Dead-end articles (no outbound links) → Add related links
- ❌ High bounce rate (>70%) → Improve content quality
- ❌ Low conversion (<2%) → Better CTAs
- ❌ Low SEO score (<70) → Optimize meta, keywords

---

## 🔧 TECHNICAL IMPLEMENTATION CHECKLIST

### **Database Ready?**
- [x] `insights_posts` table exists
- [x] `seo_metadata` table exists
- [x] `internal_links` table exists
- [ ] `related_labor_articles` field added
- [ ] `hr_topics` field added
- [ ] `cluster_name` field added
- [ ] `pillar_page_id` field added
- [ ] `insight_embeddings` table created

### **Admin Interface Ready?**
- [x] Article editor exists
- [x] Link manager exists
- [x] SEO dashboard exists
- [x] Silo visualization exists
- [x] AI generator exists
- [ ] Cluster selector added to generator
- [ ] Auto-link suggestion feature
- [ ] HR KB article picker
- [ ] Bulk import tool

### **Analytics Ready?**
- [ ] `insight_analytics` table created
- [ ] Tracking script on public pages
- [ ] Dashboard showing cluster health
- [ ] Conversion funnel tracking
- [ ] HR Assistant engagement tracking

---

## 💡 FINAL RECOMMENDATION

### **DO THIS:**

✅ **Keep ONE unified silo: "Philippine Employment Rights & Benefits Guide"**
- This IS your employment guide
- All 100 articles live here
- 8 sub-clusters organize the content
- Semantic linking connects everything

✅ **Don't create separate "Employment Guide" silo**
- Would compete with yourself
- Split authority
- Confuse Google
- Duplicate content risk

✅ **Use the screenshot structure:**
```
BPOC Intelligence (Home)
  └─ Benefits & Rights (rename to: "Philippine Employment Guide")
       ├─ Salary Guide (Cluster: Wages)
       ├─ Hiring Guide (Cluster: Regularization)
       ├─ Career Growth (Cluster: Career)
       ├─ Best Companies (Content type: List)
       └─ Jobs Guide (Cluster: Job Hunting)
```

✅ **Leverage your advantages:**
- You have embeddings → Auto-suggest links
- You have HR KB → Deep legal authority
- You have AI generator → Fast content creation
- You have silo viz → Visual content strategy

---

## 🚀 NEXT IMMEDIATE ACTIONS

1. **Rename "Benefits & Rights" → "Philippine Employment Guide"**
2. **Create 8 cluster hub pages** (sub-hubs)
3. **Run database migrations** (add cluster, pillar fields)
4. **Update AI generator** (add cluster selector)
5. **Generate first 3 articles** (Regularization cluster)
6. **Set up tracking** (analytics + conversion)
7. **Start publishing** (3 articles/week, Month 1)

---

**RESULT:** One powerful, semantically connected content silo that dominates Philippine employment law SEO, drives massive traffic, and converts visitors to job applicants through your unique HR Assistant advantage! 🎯


