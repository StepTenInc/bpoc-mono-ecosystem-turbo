# 🎨 HR Knowledge Base - Visual Guide

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 PHILIPPINE LABOR CODE                           │
│                 (5,281 lines in Docs/HR/)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Parse & Chunk
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              INTELLIGENT PROCESSING                             │
│  • Split by Articles (e.g., Article 295)                       │
│  • Extract Topics (regularization, termination, etc.)          │
│  • Tag Roles (candidate, recruiter, admin)                     │
│  • Generate Keywords                                            │
│  • Create Example Questions                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Generate Embeddings
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              OPENAI EMBEDDING API                               │
│  • Model: text-embedding-ada-002                               │
│  • Dimensions: 1536                                             │
│  • Cost: ~$1 for entire document                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Store in Database
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE (hr_embeddings_kb)                        │
│  🔍 Vector Search  │  🏷️  Topic Tags  │  👥 Role Filter        │
│  📄 ~800 Chunks    │  📊 Similarity   │  🎯 AI Answers         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Query & Search
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES                                 │
│  POST /api/hr-assistant/ask                                     │
│  GET  /api/hr-assistant/search                                  │
│  GET  /api/hr-assistant/article/:number                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Display Results
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   <HRAssistant /> UI                            │
│  💬 Chat Interface  │  📚 Sources  │  🎯 Example Questions     │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 How It Works: User Flow

```
1️⃣  USER ASKS QUESTION
    "When do I become a regular employee?"
    
    ↓

2️⃣  GENERATE EMBEDDING
    Question → OpenAI API → [0.02, 0.15, -0.08, ...]
    
    ↓

3️⃣  SEMANTIC SEARCH
    Compare embedding with database vectors
    Find top 5 most similar chunks
    
    ↓

4️⃣  FILTER BY ROLE
    User: Candidate
    → Only show candidate-relevant content
    
    ↓

5️⃣  BUILD CONTEXT
    Article 295: "Probationary employment shall not
    exceed six (6) months..."
    
    ↓

6️⃣  AI GENERATES ANSWER
    GPT-4 + Context → Clear, cited answer
    
    ↓

7️⃣  DISPLAY TO USER
    Answer + Sources + Related Articles
```

## 📊 Data Structure

```
EACH CHUNK CONTAINS:
┌────────────────────────────────────────────────────┐
│ Content:                                           │
│ "Article 295. Probationary Employment.             │
│  Probationary employment shall not exceed          │
│  six (6) months from the date the employee..."     │
│                                                    │
│ Embedding: [0.02, 0.15, -0.08, ... 1536 dims]    │
│                                                    │
│ Article: "295"                                     │
│                                                    │
│ Topics: ["regularization", "probationary",         │
│          "employment_status"]                      │
│                                                    │
│ Roles: ["candidate", "recruiter"]                  │
│                                                    │
│ Keywords: ["probationary", "six months",           │
│            "regular employment"]                   │
│                                                    │
│ Example Questions:                                 │
│ • "When do I become a regular employee?"           │
│ • "How long is the probationary period?"          │
│                                                    │
│ Importance: 0.95 (highly referenced topic)         │
└────────────────────────────────────────────────────┘
```

## 🎨 UI Component Preview

```
┌─────────────────────────────────────────────────────┐
│ 📚 HR Assistant - Philippine Labor Law              │
│    Philippine Labor Law • Candidate                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Try one of these questions:]                       │
│                                                     │
│ 🔍 When do I become a regular employee?             │
│ 🔍 Can I back out after accepting a job offer?      │
│ 🔍 What leave benefits am I entitled to?            │
│ 🔍 When should I receive my 13th month pay?         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Type your question here...]               [Ask] ▶ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔄 Deployment Flow

```
START
  │
  ├─ 1️⃣  Add OPENAI_API_KEY to .env.local
  │      ✓ Required for embeddings
  │
  ├─ 2️⃣  Run Migration
  │      • Open Supabase Dashboard
  │      • Go to SQL Editor
  │      • Paste migration file
  │      • Execute
  │      ✓ Creates hr_embeddings_kb table
  │      ✓ Creates search functions
  │      ✓ Sets up RLS policies
  │
  ├─ 3️⃣  Run Population Script
  │      npm run populate-hr-embeddings
  │      │
  │      ├─ Parse 5,281 lines
  │      ├─ Create ~800 chunks
  │      ├─ Generate embeddings
  │      ├─ Extract metadata
  │      └─ Insert into database
  │      
  │      ⏱️  Time: 20-30 minutes
  │      💰 Cost: ~$1
  │
  ├─ 4️⃣  Test
  │      npm run test-hr-search
  │      ✓ Verify search works
  │      ✓ Check all roles
  │      ✓ View statistics
  │
  └─ 5️⃣  Deploy
         npm run dev
         Visit: /hr-assistant-demo
         ✓ See it in action!
```

## 📈 Expected Results

```
AFTER POPULATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total Chunks:        ~800-1000
✅ Unique Articles:     ~400+
✅ Topics Covered:      50+
✅ Processing Time:     20-30 min
✅ Success Rate:        >99%

ROLE DISTRIBUTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Candidate Content:   ~800 chunks
🎯 Recruiter Content:   ~700 chunks  
👔 Admin Content:       ~600 chunks

TOP TOPICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 employment           300+ chunks
📊 termination          150+ chunks
📊 wages                120+ chunks
📊 benefits             100+ chunks
📊 regularization       80+ chunks
📊 leave                70+ chunks
📊 working_hours        60+ chunks
```

## 🎯 Integration Examples

### Candidate Dashboard
```tsx
┌──────────────────────────────────────┐
│  Welcome, John!                      │
│                                      │
│  📊 Dashboard                        │
│  💼 Applications: 3                  │
│  📝 Profile: 95% Complete            │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 📚 Have Questions?             │ │
│  │                                │ │
│  │ <HRAssistant                   │ │
│  │   role="candidate"             │ │
│  │   className="h-96"             │ │
│  │ />                             │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Offer Acceptance Page
```tsx
┌──────────────────────────────────────┐
│  🎉 Job Offer from ABC Company       │
│                                      │
│  Position: Customer Service Rep      │
│  Salary: ₱25,000/month               │
│                                      │
│  [Accept Offer]  [Decline]           │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ ❓ Questions About This Offer? │ │
│  │                                │ │
│  │ Ask our HR Assistant:          │ │
│  │ • Can I back out later?        │ │
│  │ • What is probationary period? │ │
│  │ • What are my benefits?        │ │
│  │                                │ │
│  │ <HRAssistant role="candidate" />│ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## 💡 Pro Tips

```
✅ BEST PRACTICES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Run population script during off-hours
   (takes 20-30 minutes)

2. Monitor OpenAI API costs
   (should be ~$1 for full setup)

3. Test with each role type
   (candidate, recruiter, admin)

4. Add to onboarding flow
   (help new users understand rights)

5. Include in help/support pages
   (reduce support tickets)

🔧 OPTIMIZATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Cache common queries
• Adjust similarity threshold (0.7 default)
• Increase batch size if no rate limits
• Add more example questions per role
```

---

## ✅ VISUAL DOCUMENTATION COMPLETE!

All visual guides, diagrams, and flowcharts are now ready.

**Next:** Let's run the migration and populate the database! 🚀

