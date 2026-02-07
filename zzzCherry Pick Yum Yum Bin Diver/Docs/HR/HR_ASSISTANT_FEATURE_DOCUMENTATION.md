# HR Assistant Feature Documentation

> **Last Updated:** January 9, 2026  
> **Status:** ✅ Active & Fixed  
> **Feature Owner:** BPOC Engineering Team

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [Frontend Pages](#frontend-pages)
6. [Components](#components)
7. [Issues & Fixes Log](#issues--fixes-log)
8. [How It Works](#how-it-works)
9. [Future Improvements](#future-improvements)

---

## Feature Overview

The **HR Assistant** is an AI-powered chatbot that helps users (candidates, recruiters, and admins) understand Philippine Labor Law by querying a knowledge base built from the Philippine Labor Code and DOLE regulations.

### Key Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Q&A** | Uses OpenAI GPT-4o-mini with semantic search to answer labor law questions |
| **Role-Based Responses** | Different prompts and perspectives for candidates, recruiters, and admins |
| **Conversation Memory** | Stores conversations per user, remembers context for follow-up questions |
| **Long-Term Memory** | After 30 days, conversations are summarized and archived |
| **Source Citations** | All answers cite relevant Labor Code articles |
| **Semantic Search** | Vector embeddings enable intelligent search of past conversations |

### User Roles

| Role | Use Case | UI Theme |
|------|----------|----------|
| **Candidate** | Understanding employee rights, benefits, regularization | Cyan/Purple gradient |
| **Recruiter** | Hiring compliance, employer obligations, termination rules | Orange/Amber gradient |
| **Admin** | Company-wide compliance, DOLE requirements, penalties | Cyan/Glass-morphism |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  ├── /candidate/hr-assistant                                     │
│  ├── /recruiter/hr-assistant                                     │
│  └── /admin/hr-assistant                                         │
│                                                                  │
│  Widget Components:                                              │
│  ├── HRAssistantCandidate.tsx                                    │
│  ├── HRAssistantRecruiter.tsx                                    │
│  └── HRAssistantAdmin.tsx                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/hr-assistant/ask     → Main Q&A endpoint              │
│  GET  /api/hr-assistant/history → Get conversation history       │
│  GET  /api/hr-assistant/search  → Direct knowledge base search   │
│  GET  /api/hr-assistant/article/[articleNumber] → Get article    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (Supabase)                        │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  ├── hr_embeddings_kb                → Knowledge base (Labor     │
│  │                                     Code chunks + embeddings) │
│  ├── hr_assistant_conversations      → User messages (30 days)   │
│  └── hr_assistant_conversation_summaries → Long-term memory      │
│                                                                  │
│  Functions:                                                      │
│  ├── search_hr_knowledge()           → Semantic search KB        │
│  ├── get_hr_conversation_history()   → Get user's history        │
│  ├── get_hr_conversation_summaries() → Get archived summaries    │
│  └── search_past_hr_conversations()  → Search past conversations │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│  OpenAI API:                                                     │
│  ├── text-embedding-ada-002  → Generate vector embeddings        │
│  └── gpt-4o-mini             → Generate answers                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `hr_embeddings_kb`

The knowledge base containing Philippine Labor Code content with vector embeddings.

```sql
CREATE TABLE hr_embeddings_kb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,                    -- Chunked text content
    embedding vector(1536),                   -- OpenAI ada-002 embeddings
    document_source VARCHAR(255),             -- e.g., 'Philippine_Labor_Code_2026'
    document_section VARCHAR(500),            -- e.g., 'Book I - Pre-Employment'
    book VARCHAR(100),                        -- Which book of labor code
    title VARCHAR(500),                       -- Chapter/Article title
    article_number VARCHAR(50),               -- Article number (e.g., '295')
    chunk_index INTEGER NOT NULL,             -- Order of chunk in document
    chunk_size INTEGER,                       -- Size in characters
    topics TEXT[],                            -- Topics covered
    role_relevance VARCHAR(20)[],             -- ['admin', 'recruiter', 'candidate']
    importance_score DECIMAL(3,2),            -- 0.0 to 1.0
    keywords TEXT[],                          -- For hybrid search
    question_examples TEXT[],                 -- Example questions this answers
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(50),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Table: `hr_assistant_conversations`

Stores all conversation messages for 30 days.

```sql
CREATE TABLE hr_assistant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) NOT NULL,                -- 'candidate', 'recruiter', 'admin'
    session_id UUID NOT NULL,                 -- Groups messages in same session
    message_type VARCHAR(20) NOT NULL,        -- 'user' or 'assistant'
    content TEXT NOT NULL,                    -- The message text
    sources JSONB,                            -- Source citations (assistant only)
    related_articles TEXT[],                  -- Related article numbers
    embedding vector(1536),                   -- For semantic search
    token_count INTEGER,                      -- API usage tracking
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Table: `hr_assistant_conversation_summaries`

Long-term memory - AI-generated summaries of conversations after 30 days.

```sql
CREATE TABLE hr_assistant_conversation_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) NOT NULL,
    session_id UUID NOT NULL,                 -- References original conversation
    summary TEXT NOT NULL,                    -- AI-generated summary
    key_topics TEXT[],                        -- Main topics discussed
    articles_referenced TEXT[],               -- All articles mentioned
    message_count INTEGER NOT NULL,           -- Number of messages
    conversation_start TIMESTAMPTZ,
    conversation_end TIMESTAMPTZ,
    embedding vector(1536),                   -- For semantic search
    created_at TIMESTAMPTZ
);
```

### Database Functions

| Function | Purpose |
|----------|---------|
| `search_hr_knowledge(query_embedding, user_role, match_threshold, match_count)` | Semantic search of knowledge base with role filtering |
| `search_hr_hybrid(query_embedding, query_keywords, user_role, match_count)` | Hybrid search (vector + keyword) |
| `get_hr_conversation_history(p_user_id, p_role, p_limit, p_session_id)` | Get user's conversation history |
| `get_hr_conversation_summaries(p_user_id, p_role, p_limit)` | Get archived conversation summaries |
| `search_past_hr_conversations(p_user_id, p_role, p_query_embedding, p_limit)` | Semantic search of past conversations |
| `cleanup_old_hr_conversations()` | Identify conversations older than 30 days |
| `get_hr_related_content(source_article_number, user_role, match_count)` | Get related content by article |

---

## API Routes

### POST `/api/hr-assistant/ask`

Main endpoint for asking questions.

**File:** `src/app/api/hr-assistant/ask/route.ts`

**Request:**
```json
{
  "question": "When do I become a regular employee?",
  "role": "candidate",
  "sessionId": "uuid-optional"
}
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response:**
```json
{
  "answer": "According to Article 295 of the Labor Code...",
  "sources": [
    {
      "section": "Book VI - Post-Employment",
      "article": "295",
      "topics": ["regularization", "probationary_period"],
      "similarity": 89
    }
  ],
  "relatedArticles": ["295", "296", "297"],
  "sessionId": "uuid",
  "hasHistory": true,
  "contextUsed": {
    "currentSession": 4,
    "summaries": 2,
    "relatedPastDiscussions": 1
  }
}
```

**Flow:**
1. Validate input and authenticate user
2. Generate embedding for the question
3. Fetch conversation history (current session)
4. Fetch conversation summaries (long-term memory)
5. Search past conversations for similar questions
6. Search knowledge base for relevant content
7. Save user message to database
8. Generate answer using GPT-4o-mini with full context
9. Save assistant message to database
10. Return response with sources

---

### GET `/api/hr-assistant/history`

Get conversation history for the current user.

**File:** `src/app/api/hr-assistant/history/route.ts`

**Request:**
```
GET /api/hr-assistant/history?role=candidate&sessionId=uuid
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "message_type": "user",
      "content": "When do I become regular?",
      "sources": null,
      "related_articles": null,
      "created_at": "2026-01-09T12:00:00Z"
    },
    {
      "id": "uuid",
      "session_id": "uuid",
      "message_type": "assistant",
      "content": "According to Article 295...",
      "sources": "[...]",
      "related_articles": ["295", "296"],
      "created_at": "2026-01-09T12:00:05Z"
    }
  ],
  "sessionId": "uuid"
}
```

---

### GET `/api/hr-assistant/search`

Direct search of the knowledge base.

**File:** `src/app/api/hr-assistant/search/route.ts`

**Request:**
```
GET /api/hr-assistant/search?q=regularization&role=candidate&limit=10
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "section": "Book VI - Post-Employment",
      "article": "295",
      "content": "Article 295 defines...",
      "topics": ["regularization"],
      "similarity": 92
    }
  ],
  "count": 10
}
```

---

### GET `/api/hr-assistant/article/[articleNumber]`

Get specific article details.

**File:** `src/app/api/hr-assistant/article/[articleNumber]/route.ts`

**Request:**
```
GET /api/hr-assistant/article/295
```

---

## Frontend Pages

### Full-Page HR Assistant

| Path | File | Description |
|------|------|-------------|
| `/candidate/hr-assistant` | `src/app/(candidate)/candidate/hr-assistant/page.tsx` | Candidate full-page experience |
| `/recruiter/hr-assistant` | `src/app/(recruiter)/recruiter/hr-assistant/page.tsx` | Recruiter full-page experience |
| `/admin/hr-assistant` | `src/app/(admin)/admin/hr-assistant/page.tsx` | Admin full-page experience |

### Features of Full-Page Experience:
- Auto-scroll to bottom on new messages
- Conversation history loading on mount
- Clear chat functionality
- Message count indicator
- Beautiful role-specific theming
- FormattedAIResponse for markdown rendering

---

## Components

### Widget Components (for embedding in dashboards)

| Component | File | Description |
|-----------|------|-------------|
| `HRAssistant` | `src/components/hr/HRAssistant.tsx` | Generic base component |
| `HRAssistantCandidate` | `src/components/hr/HRAssistantCandidate.tsx` | Candidate-themed widget |
| `HRAssistantRecruiter` | `src/components/hr/HRAssistantRecruiter.tsx` | Recruiter-themed widget |
| `HRAssistantAdmin` | `src/components/hr/HRAssistantAdmin.tsx` | Admin-themed widget |

### Helper Components

| Component | File | Description |
|-----------|------|-------------|
| `FormattedAIResponse` | `src/components/hr/FormattedAIResponse.tsx` | Renders AI markdown into styled HTML |

---

## Issues & Fixes Log

### Issue #1: Predefined Questions Not Storing in Database

**Reported:** January 9, 2026  
**Status:** ✅ Fixed

**Problem:**
When users clicked a predefined question button, it only called `setInput(question)` but did NOT submit the form. Users had to manually click "Ask" after selecting a predefined question.

**Root Cause:**
```tsx
// BEFORE (broken)
onClick={() => setInput(question)}
```

**Solution:**
Changed all predefined question buttons to auto-submit:
```tsx
// AFTER (fixed)
onClick={() => handleSubmit(undefined, question)}
```

**Files Modified:**
- `src/app/(candidate)/candidate/hr-assistant/page.tsx`
- `src/app/(recruiter)/recruiter/hr-assistant/page.tsx`
- `src/app/(admin)/admin/hr-assistant/page.tsx`
- `src/components/hr/HRAssistant.tsx`
- `src/components/hr/HRAssistantCandidate.tsx`
- `src/components/hr/HRAssistantRecruiter.tsx`
- `src/components/hr/HRAssistantAdmin.tsx`

---

### Issue #2: Second Question Not Storing / UI Bug

**Reported:** January 9, 2026  
**Status:** ✅ Fixed

**Problem:**
After typing the first question and receiving a response, typing a second question:
- Did NOT store in the database
- UI showed the first question instead of the new one

**Root Cause:**
The `input` state variable was being used in the API call AFTER `setInput('')` was called, causing a potential race condition where the cleared value was being sent.

```tsx
// BEFORE (potential race condition)
async function handleSubmit(e: React.FormEvent) {
  setMessages(prev => [...prev, userMessage]);
  setInput('');  // Clears input
  
  // ... later ...
  body: JSON.stringify({ 
    question: input,  // 'input' might be stale here
    role: 'candidate',
    sessionId 
  })
}
```

**Solution:**
Capture the input value at the start of the function:
```tsx
// AFTER (fixed)
async function handleSubmit(e?: React.FormEvent, directQuestion?: string) {
  if (e) e.preventDefault();
  
  // Capture value immediately
  const questionText = directQuestion || input;
  if (!questionText.trim() || loading || !user || !session) return;

  // Use captured value everywhere
  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: questionText  // Use captured value
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');  // Now safe to clear
  
  // ... later ...
  body: JSON.stringify({ 
    question: questionText,  // Use captured value
    role: 'candidate',
    sessionId 
  })
}
```

---

### Issue #3: Widget Components Missing Authentication

**Reported:** January 9, 2026  
**Status:** ✅ Fixed

**Problem:**
The widget components (`HRAssistantRecruiter.tsx` and `HRAssistantAdmin.tsx`) were NOT sending Authorization headers, causing 401 Unauthorized errors silently.

**Root Cause:**
```tsx
// BEFORE (missing auth)
const response = await fetch('/api/hr-assistant/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },  // No auth!
  body: JSON.stringify({ question: input, role: 'recruiter' })
});
```

**Solution:**
Added full authentication support:
```tsx
// AFTER (with auth)
const { user, session } = useAuth();

// ... in handleSubmit ...
const response = await fetch('/api/hr-assistant/ask', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`  // Now authenticated
  },
  body: JSON.stringify({ 
    question: questionText, 
    role: 'recruiter',
    sessionId 
  })
});
```

Also added:
- Session ID state management
- Conversation history loading on mount
- Loading state for history
- Message count indicator

---

### Issue #4: `hr_assistant_conversation_summaries` Empty

**Reported:** January 9, 2026  
**Status:** ℹ️ Not a Bug - By Design

**Observation:**
The `hr_assistant_conversation_summaries` table was empty.

**Explanation:**
This is **expected behavior**. The summaries table is populated by a cleanup script that:
1. Runs on conversations older than 30 days
2. Generates AI summaries of the conversations
3. Saves summaries to the table
4. Deletes original messages

**Cleanup Script:** `scripts/cleanup-hr-conversations.ts`

**How to run:**
```bash
npm run cleanup-hr-conversations
```

**Recommended:** Set up a cron job to run daily at 2 AM:
```bash
0 2 * * * cd /path/to/project && npm run cleanup-hr-conversations
```

---

## How It Works

### Conversation Flow

```
1. USER OPENS HR ASSISTANT
   └─ Component mounts → calls GET /api/hr-assistant/history
   └─ Fetches last 50 messages for this role
   └─ Displays conversation history
   └─ Gets sessionId from first message (or null if new)

2. USER ASKS QUESTION (types or clicks predefined)
   └─ handleSubmit() called with question text
   └─ User message added to UI immediately
   └─ Request sent to POST /api/hr-assistant/ask

3. API GATHERS CONTEXT (in parallel)
   ├─ Get conversation history (current session)
   ├─ Get conversation summaries (old conversations)
   ├─ Search past conversations (semantic similarity)
   └─ Search knowledge base (Philippine Labor Code)

4. API BUILDS CONTEXT FOR OpenAI
   ├─ System prompt (role-specific)
   ├─ Knowledge base context (top 5 matching articles)
   ├─ Conversation history (last 10 messages)
   ├─ Long-term memory (last 3 summaries)
   └─ Similar past discussions (top 3 matches)

5. OPENAI GENERATES ANSWER
   └─ Uses ALL context to provide contextual answer
   └─ References previous discussions if relevant
   └─ Cites article numbers

6. API SAVES EVERYTHING
   ├─ User message → hr_assistant_conversations (with embedding)
   └─ Assistant message → hr_assistant_conversations (with embedding)

7. RESPONSE RETURNED TO FRONTEND
   └─ Assistant message displayed in UI
   └─ Sources shown below answer
   └─ sessionId stored for next question

8. AFTER 30 DAYS (cleanup script)
   ├─ Finds old conversations
   ├─ Generates AI summaries
   ├─ Saves summaries → hr_assistant_conversation_summaries
   └─ Deletes old messages (keeps summaries)
```

### Role-Specific System Prompts

**Candidate:**
> "You are an HR assistant helping job candidates understand their rights under Philippine labor law. Be clear, empathetic, and practical. Focus on what matters to employees - their rights, benefits, protections, and what they're entitled to."

**Recruiter:**
> "You are an HR assistant helping recruiters understand compliance and best practices for hiring Filipino workers under Philippine labor law. Focus on hiring requirements, employee obligations, DOLE compliance, best practices for managing employees, legal requirements for contracts and benefits."

**Admin:**
> "You are an HR assistant helping BPOC administrators ensure overall company compliance with Philippine labor law. Focus on administrative compliance requirements, DOLE obligations, company-wide responsibilities, penalties for violations, establishment registration, and organizational compliance."

---

## Future Improvements

### High Priority

| Improvement | Description | Estimated Effort |
|-------------|-------------|------------------|
| **Streaming Responses** | Use Server-Sent Events to stream AI responses character by character | Medium |
| **Clear Conversation** | Add button to clear conversation from database (not just UI) | Low |
| **Export Conversation** | Allow users to export conversation as PDF | Medium |
| **Typing Indicator** | Show "AI is typing..." with animated dots | Low |

### Medium Priority

| Improvement | Description | Estimated Effort |
|-------------|-------------|------------------|
| **Follow-up Suggestions** | After each answer, suggest related questions | Medium |
| **Article Deep Links** | Click on article numbers to see full article text | Medium |
| **Conversation Search** | Search through past conversations | High |
| **Favorites/Bookmarks** | Save important answers for quick access | Medium |
| **Multi-language Support** | Support Filipino/Tagalog questions | High |

### Low Priority / Nice-to-Have

| Improvement | Description | Estimated Effort |
|-------------|-------------|------------------|
| **Voice Input** | Speech-to-text for asking questions | High |
| **Voice Output** | Text-to-speech for AI responses | High |
| **Dark/Light Theme Toggle** | User preference for theme | Low |
| **Keyboard Shortcuts** | Ctrl+Enter to submit, etc. | Low |
| **Rate Answers** | Thumbs up/down on AI responses | Medium |
| **Admin Analytics** | Dashboard showing usage statistics | High |
| **Offline Cache** | Cache common answers for offline access | High |

### Technical Debt

| Item | Description |
|------|-------------|
| **Remove Duplicate Code** | Widget components share a lot of code with pages |
| **Create Shared Hook** | Extract common logic into `useHRAssistant()` hook |
| **Add Unit Tests** | Test API routes and components |
| **Add E2E Tests** | Playwright tests for full user flows |
| **Improve Error Handling** | More specific error messages to users |
| **Add Rate Limiting** | Prevent API abuse |
| **Optimize Embeddings** | Consider caching embeddings for common questions |

---

## Related Documentation

- [HR System Architecture](../Guides/HR_SYSTEM_ARCHITECTURE.md)
- [HR Knowledge Base Setup](../Guides/HR_KNOWLEDGE_BASE_SETUP.md)
- [HR Quick Start Guide](../Guides/HR_QUICK_START.md)
- [HR Conversation Memory](../status-reports/HR_ASSISTANT_CONVERSATION_MEMORY.md)

---

## Migrations

| Migration File | Description |
|----------------|-------------|
| `20260109_create_hr_embeddings_kb.sql` | Creates knowledge base table and functions |
| `20260109_hr_assistant_conversations.sql` | Creates conversation tables and functions |

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Cleanup Conversations | `npm run cleanup-hr-conversations` | Summarize and archive 30+ day old conversations |
| Test HR Search | `npx tsx scripts/test-hr-search.ts` | Test knowledge base search |
| Populate Embeddings | `npx tsx scripts/populate-hr-embeddings.ts` | Populate knowledge base with embeddings |

---

*Documentation maintained by BPOC Engineering Team*
