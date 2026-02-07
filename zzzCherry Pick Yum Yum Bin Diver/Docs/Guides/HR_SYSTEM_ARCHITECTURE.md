# 🏗️ HR Knowledge Base - System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHILIPPINE LABOR CODE (5,281 LINES)              │
│                    Docs/HR/Philippine_Labor_Code 2026.md            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│             POPULATE SCRIPT (populate-hr-embeddings.ts)             │
│                                                                     │
│  1. Parse document by articles/sections                            │
│  2. Chunk intelligently (~1000 chars)                              │
│  3. Extract metadata (topics, keywords, roles)                     │
│  4. Generate OpenAI embeddings (ada-002)                           │
│  5. Insert into database                                           │
│                                                                     │
│  Output: ~800-1000 searchable chunks                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  DATABASE (hr_embeddings_kb table)                  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ Each Chunk Contains:                                   │        │
│  │ • content (TEXT)                                       │        │
│  │ • embedding (vector 1536)                              │        │
│  │ • article_number (e.g., "295")                         │        │
│  │ • topics (e.g., ['regularization', 'probationary'])    │        │
│  │ • role_relevance (['candidate', 'recruiter', 'admin']) │        │
│  │ • keywords (for hybrid search)                         │        │
│  │ • question_examples                                    │        │
│  │ • importance_score (0.0-1.0)                          │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  Search Functions:                                                 │
│  • search_hr_knowledge() - Semantic search                        │
│  • search_hr_hybrid() - Vector + keyword                          │
│  • get_hr_related_content() - Article lookup                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API ROUTES                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ POST /api/hr-assistant/ask                           │          │
│  │ • Accepts: { question, role }                        │          │
│  │ • Generates embedding for question                   │          │
│  │ • Searches database                                  │          │
│  │ • Uses GPT-4 to generate answer                      │          │
│  │ • Returns: { answer, sources, relatedArticles }      │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ GET /api/hr-assistant/search                         │          │
│  │ • Direct search without AI generation                │          │
│  │ • Fast lookup                                        │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ GET /api/hr-assistant/article/:number                │          │
│  │ • Get specific article content                       │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     UI COMPONENT (HRAssistant.tsx)                  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  CANDIDATE  │  │  RECRUITER  │  │    ADMIN    │               │
│  │   ROLE      │  │    ROLE     │  │    ROLE     │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                     │
│  Features:                                                         │
│  • Chat interface                                                  │
│  • Pre-loaded example questions                                    │
│  • Source citations                                                │
│  • Related articles                                                │
│  • Loading states                                                  │
│  • Error handling                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        USER DASHBOARDS                              │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Candidate       │  │  Recruiter       │  │  Admin           │ │
│  │  Dashboard       │  │  Dashboard       │  │  Dashboard       │ │
│  │                  │  │                  │  │                  │ │
│  │  <HRAssistant    │  │  <HRAssistant    │  │  <HRAssistant    │ │
│  │    role="..."    │  │    role="..."    │  │    role="..."    │ │
│  │  />              │  │  />              │  │  />              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Query Flow

```
User Question: "When do I become a regular employee?"
         │
         ▼
[1] Component sends to API: POST /api/hr-assistant/ask
         │
         ▼
[2] API generates embedding using OpenAI (ada-002)
         │
         ▼
[3] Database semantic search (search_hr_knowledge)
    • Filters by role: "candidate"
    • Finds top 5 matching chunks
    • Returns chunks about Article 295 (Probationary Employment)
         │
         ▼
[4] API builds context from search results
         │
         ▼
[5] GPT-4 generates answer based on context
    "According to Article 295 of the Philippine Labor Code,
     you become a regular employee after successfully completing
     the probationary period of six (6) months..."
         │
         ▼
[6] API returns: { answer, sources, relatedArticles }
         │
         ▼
[7] Component displays answer with citations
```

## 🎯 Role-Based Filtering

```
┌──────────────────────────────────────────────────────────────┐
│                     LABOR CODE CONTENT                       │
│                     (~1000 chunks total)                     │
└──────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌────────┐        ┌────────┐        ┌────────┐
    │CANDIDATE│        │RECRUITER│       │ ADMIN  │
    │ FILTER │        │ FILTER │        │ FILTER │
    └────────┘        └────────┘        └────────┘
         │                 │                 │
         ▼                 ▼                 ▼
    ┌────────┐        ┌────────┐        ┌────────┐
    │ ~800   │        │ ~700   │        │ ~600   │
    │ chunks │        │ chunks │        │ chunks │
    └────────┘        └────────┘        └────────┘
         │                 │                 │
    Employee          Compliance       Regulatory
    Rights            Requirements     Requirements
    Benefits          Hiring           Penalties
    Termination       Contracts        Reporting
    Leaves            Records          Inspections
```

## 💾 Database Schema

```
hr_embeddings_kb
├── id (UUID)
├── content (TEXT) ─────────────► The actual text chunk
├── embedding (vector 1536) ────► OpenAI embedding
├── document_source (VARCHAR) ──► "Philippine_Labor_Code_2026"
├── document_section (VARCHAR) ─► "Book I - Article 295"
├── book (VARCHAR) ─────────────► "Book I"
├── title (VARCHAR) ────────────► "Pre-Employment"
├── article_number (VARCHAR) ───► "295"
├── chunk_index (INTEGER) ──────► Sequential order
├── chunk_size (INTEGER) ───────► Character count
├── topics (TEXT[]) ────────────► ['regularization', 'probationary']
├── role_relevance (VARCHAR[]) ─► ['candidate', 'recruiter']
├── importance_score (DECIMAL) ─► 0.0 to 1.0
├── keywords (TEXT[]) ──────────► For hybrid search
├── question_examples (TEXT[]) ─► Example questions
├── is_active (BOOLEAN) ────────► Enable/disable
├── version (VARCHAR) ──────────► "2026"
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔍 Search Methods

### 1. Semantic Search (Vector Similarity)
```
User Query → Embedding → Cosine Similarity → Top Results
"regularization" → [0.1, 0.8, ...] → Find similar vectors → Article 295
```

### 2. Hybrid Search (Vector + Keywords)
```
Query: "probationary period"
├─► Vector Search (70% weight)
│   └─► Finds semantically similar content
└─► Keyword Match (30% weight)
    └─► Matches exact terms
    
Combined Score → Ranked Results
```

### 3. Article Lookup (Direct Access)
```
Article Number: "295"
└─► Get all chunks for Article 295
    └─► Returns complete article text
```

## 📊 Example Data Flow

```
Database Record:
{
  "article_number": "295",
  "content": "Article 295. Probationary Employment. Probationary 
              employment shall not exceed six (6) months from the 
              date the employee started working...",
  "embedding": [0.02, 0.15, -0.08, ...], // 1536 dimensions
  "topics": ["regularization", "probationary", "employment_status"],
  "role_relevance": ["candidate", "recruiter"],
  "keywords": ["probationary", "six months", "regular employment"],
  "question_examples": [
    "When do I become a regular employee?",
    "How long is the probationary period?"
  ],
  "importance_score": 0.95 // Highly referenced topic
}
```

## 🎨 Component Integration

```tsx
// Candidate Dashboard
import { HRAssistant } from '@/components/hr/HRAssistant';

export default function CandidateDashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        {/* Main content */}
      </div>
      
      <div className="col-span-1">
        {/* HR Assistant Sidebar */}
        <HRAssistant role="candidate" />
      </div>
    </div>
  );
}
```

---

## 🚀 Complete System Features

✅ **Vector Embeddings** - Semantic understanding  
✅ **Role-Based Access** - Content filtering  
✅ **Hybrid Search** - Vector + keyword  
✅ **Article Lookup** - Direct access  
✅ **AI Answers** - GPT-4 powered  
✅ **Source Citations** - Transparency  
✅ **Topic Tagging** - Better filtering  
✅ **Importance Scoring** - Relevance ranking  
✅ **Example Questions** - User guidance  
✅ **Beautiful UI** - Production-ready  
✅ **API Routes** - Easy integration  
✅ **Security** - RLS policies  
✅ **Performance** - Indexed search  

---

**Status:** ✅ COMPLETE AND READY TO DEPLOY

