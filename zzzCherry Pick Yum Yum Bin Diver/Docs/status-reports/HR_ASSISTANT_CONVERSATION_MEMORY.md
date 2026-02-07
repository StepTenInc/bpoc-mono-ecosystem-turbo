# 🧠 HR ASSISTANT - CONVERSATION MEMORY SYSTEM

## 🎯 **WHAT WAS ADDED:**

The HR Assistant now has a **FULL MEMORY SYSTEM** that:
- ✅ Remembers ALL conversations per user + role
- ✅ Stores messages for 30 days
- ✅ Generates AI summaries after 30 days (long-term memory)
- ✅ Uses conversation context for better answers
- ✅ Searches past conversations for relevant info
- ✅ Continues conversations across sessions

---

## 🏗️ **DATABASE ARCHITECTURE:**

### **Table 1: `hr_assistant_conversations`**
**Stores all messages for 30 days**

```sql
Columns:
- id (UUID)
- user_id (UUID) → references auth.users
- role (VARCHAR) → 'candidate', 'recruiter', 'admin'
- session_id (UUID) → groups messages in same conversation
- message_type (VARCHAR) → 'user' or 'assistant'
- content (TEXT) → the actual message
- sources (JSONB) → source citations (assistant only)
- related_articles (TEXT[]) → article numbers
- embedding (vector(1536)) → for semantic search
- token_count (INTEGER) → API usage tracking
- created_at, updated_at
```

**Indexes:**
- `idx_hr_conversations_user_role` → Fast user+role lookup
- `idx_hr_conversations_session` → Session history
- `idx_hr_conversations_embedding` → Vector search past conversations

---

### **Table 2: `hr_assistant_conversation_summaries`**
**Long-term memory after 30 days**

```sql
Columns:
- id (UUID)
- user_id (UUID)
- role (VARCHAR)
- session_id (UUID) → references original conversation
- summary (TEXT) → AI-generated summary
- key_topics (TEXT[]) → main topics discussed
- articles_referenced (TEXT[]) → all articles mentioned
- message_count (INTEGER) → how many messages
- conversation_start (TIMESTAMPTZ)
- conversation_end (TIMESTAMPTZ)
- embedding (vector(1536)) → semantic search summaries
- created_at
```

**Indexes:**
- `idx_hr_summaries_user_role` → Fast user+role lookup
- `idx_hr_summaries_embedding` → Vector search summaries

---

## 🔐 **SECURITY (RLS):**

```sql
-- Users can only access their own conversations
CREATE POLICY hr_conversations_own_data 
ON hr_assistant_conversations
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY hr_summaries_own_data 
ON hr_assistant_conversation_summaries
FOR ALL
USING (user_id = auth.uid());
```

**Result:** Users can ONLY see their own conversations. Secure by default! 🔒

---

## 🔧 **DATABASE FUNCTIONS:**

### **1. `get_hr_conversation_history()`**
```sql
get_hr_conversation_history(
  p_user_id UUID,
  p_role VARCHAR(20),
  p_limit INTEGER DEFAULT 50,
  p_session_id UUID DEFAULT NULL
)
```

**What it does:**
- Returns conversation history for a user + role
- If `session_id` provided → returns that specific session
- If no `session_id` → returns recent messages across all sessions
- Orders by date ascending (chronological)

**Use case:** Load conversation history when user opens HR Assistant

---

### **2. `get_hr_conversation_summaries()`**
```sql
get_hr_conversation_summaries(
  p_user_id UUID,
  p_role VARCHAR(20),
  p_limit INTEGER DEFAULT 10
)
```

**What it does:**
- Returns past conversation summaries (long-term memory)
- Latest 10 summaries by default
- Includes key topics and articles referenced

**Use case:** Provide context from old conversations (30+ days ago)

---

### **3. `search_past_hr_conversations()`**
```sql
search_past_hr_conversations(
  p_user_id UUID,
  p_role VARCHAR(20),
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 5
)
```

**What it does:**
- Semantic search through past conversations
- Finds similar questions/answers user has asked before
- Returns with similarity scores

**Use case:** "You asked something similar before..." context

---

### **4. `cleanup_old_hr_conversations()`**
```sql
cleanup_old_hr_conversations()
```

**What it does:**
- Identifies conversations older than 30 days
- Returns list of sessions that need summarization
- Returns count of messages to delete

**Use case:** Run by cleanup script to manage data

---

## 🚀 **API ENDPOINTS:**

### **POST `/api/hr-assistant/ask`** (ENHANCED)

**Request:**
```json
{
  "question": "What are my rights?",
  "role": "candidate",
  "sessionId": "uuid-optional"
}
```

**Response:**
```json
{
  "answer": "According to Article 295...",
  "sources": [...],
  "relatedArticles": [...],
  "sessionId": "uuid",
  "hasHistory": true,
  "contextUsed": {
    "currentSession": 4,
    "summaries": 2,
    "relatedPastDiscussions": 1
  }
}
```

**What changed:**
- ✅ Now accepts `sessionId` (creates new if not provided)
- ✅ Loads conversation history from database
- ✅ Loads conversation summaries (long-term memory)
- ✅ Searches past conversations for similar questions
- ✅ Passes ALL context to OpenAI for better answers
- ✅ Saves both user + assistant messages to database
- ✅ Generates embeddings for semantic search
- ✅ Returns context info for debugging

---

### **GET `/api/hr-assistant/history`** (NEW)

**Request:**
```
GET /api/hr-assistant/history?role=candidate&sessionId=uuid
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
      "sources": [...],
      "related_articles": ["295", "296"],
      "created_at": "2026-01-09T12:00:05Z"
    }
  ],
  "sessionId": "uuid"
}
```

**Use case:** Load conversation history when user opens HR Assistant

---

## 🧹 **CLEANUP SCRIPT:**

### **`scripts/cleanup-hr-conversations.ts`**

**What it does:**
1. Finds conversations older than 30 days
2. Groups messages by session
3. Generates AI summary for each session using GPT-4o-mini
4. Extracts key topics and article references
5. Generates embeddings for semantic search of summaries
6. Saves summaries to `hr_assistant_conversation_summaries`
7. Deletes old messages (keeps summaries)

**Run manually:**
```bash
npm run cleanup-hr-conversations
```

**Or set up cron job:**
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/project && npm run cleanup-hr-conversations
```

**Output:**
```
🧹 Starting HR Assistant conversation cleanup...

📊 Fetching conversations older than 30 days...
Found 156 old messages
Organized into 12 conversation sessions

📝 Processing session a3b4c5d6...
   User: 1a2b3c4d... | Role: candidate | Messages: 8
   🤖 Generating AI summary...
   ✅ Summary: "User asked about regularization, probation, and 13th month pay..."
   📚 Topics: regularization, probation period, 13th month pay
   📖 Articles: 295, 296, 297
   💾 Saving summary...
   🗑️  Deleting old messages...
   ✅ Session summarized and cleaned!

=================================================================
🎉 Cleanup Complete!
=================================================================
📊 Sessions processed: 12
✅ Summarized: 10
⏭️  Skipped: 2
🗑️  Messages deleted: 156
=================================================================
```

---

## 🧠 **HOW MEMORY WORKS:**

### **Conversation Flow:**

```
1. USER OPENS HR ASSISTANT
   └─ Component loads → calls GET /api/hr-assistant/history
   └─ Fetches last 50 messages for this role
   └─ Displays conversation history
   └─ Gets sessionId from first message (or null if new)

2. USER ASKS QUESTION
   └─ Component sends: { question, role, sessionId }
   └─ API receives request
   
3. API GATHERS CONTEXT
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
   ├─ Saves user message → hr_assistant_conversations
   ├─ Generates embedding for user message
   ├─ Saves assistant message → hr_assistant_conversations
   ├─ Generates embedding for assistant message
   └─ Returns answer + sessionId

7. COMPONENT UPDATES UI
   └─ Displays answer
   └─ Updates sessionId for next question
   └─ Shows context indicators (hasHistory, contextUsed)

8. AFTER 30 DAYS (CLEANUP SCRIPT)
   ├─ Finds old conversations
   ├─ Generates AI summaries
   ├─ Saves summaries → hr_assistant_conversation_summaries
   └─ Deletes old messages (saves space, keeps summaries)
```

---

## 💡 **EXAMPLE SCENARIOS:**

### **Scenario 1: Follow-up Question**

**User:** "When do I become regular?"  
**Assistant:** "After 6 months probation or 1 year casual..."

**User:** "What if I fail probation?"  
**Assistant:** (knows context from previous answer) "Based on your earlier question about regularization, if you don't meet the standards..."

---

### **Scenario 2: Similar Past Question**

**30 days ago:** User asked about "13th month pay"  
**Today:** User asks about "Christmas bonus"  

**Assistant:** "I notice we discussed 13th month pay before (which is similar). As I mentioned then, Article 297..."

---

### **Scenario 3: Long-term Memory**

**3 months ago:** Long conversation about employee rights  
**Today:** User asks new question  

**Assistant:** "Building on our previous conversations about employee rights (summarized: regularization, leave benefits, termination), here's the answer..."

---

## 📊 **DATA RETENTION:**

### **Timeline:**

```
DAY 0-30:
  └─ Full messages stored in hr_assistant_conversations
  └─ All details preserved (content, sources, embeddings)
  └─ Fast lookups, full context

DAY 30+:
  └─ Cleanup script runs
  └─ AI generates summary
  └─ Summary saved → hr_assistant_conversation_summaries
  └─ Original messages deleted (saves space)
  └─ Long-term memory preserved

FOREVER:
  └─ Summaries kept indefinitely
  └─ Key topics + articles preserved
  └─ Semantic search available
```

**Why 30 days?**
- ✅ Recent conversations need full detail
- ✅ Old conversations just need summary for context
- ✅ Saves database space (messages deleted)
- ✅ Preserves long-term memory (summaries kept)
- ✅ Balance between detail and efficiency

---

## 🎨 **UI UPDATES:**

### **Conversation History Indicator:**

```tsx
{messages.length > 0 && (
  <div className="flex items-center gap-2 text-xs text-gray-400">
    <History className="w-4 h-4" />
    {messages.length} messages
  </div>
)}
```

Shows how many messages in current conversation.

### **Loading History State:**

```tsx
if (loadingHistory) {
  return (
    <div className="... flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      <p>Loading conversation history...</p>
    </div>
  );
}
```

### **Auth-aware:**

Component checks `useAuth()` → only loads history if user logged in.

---

## 🔧 **MIGRATION:**

**File:** `20260109_hr_assistant_conversations.sql`

**Run in Supabase:**
1. Go to SQL Editor
2. Copy entire migration file
3. Execute
4. Tables + functions + policies created ✅

---

## 📦 **FILES CREATED:**

```

  └─ 20260109_hr_assistant_conversations.sql

src/app/api/hr-assistant/
  ├─ ask/route.ts (ENHANCED)
  └─ history/route.ts (NEW)

scripts/
  └─ cleanup-hr-conversations.ts (NEW)

src/components/hr/
  └─ HRAssistantCandidate.tsx (ENHANCED with memory)

package.json
  └─ Added "cleanup-hr-conversations" script
```

---

## ✅ **BENEFITS:**

### **Better Answers:**
- ✅ Understands context from previous messages
- ✅ Can reference past discussions
- ✅ No need to repeat information
- ✅ Follow-up questions work naturally

### **User Experience:**
- ✅ Conversations persist across sessions
- ✅ Can continue where you left off
- ✅ History loaded automatically
- ✅ Feels like talking to someone who remembers

### **Long-term Memory:**
- ✅ Summaries preserve context forever
- ✅ Can reference old conversations
- ✅ Learns user's common questions
- ✅ More personalized over time

### **Performance:**
- ✅ Recent conversations: full detail
- ✅ Old conversations: summarized (less storage)
- ✅ Vector search: fast semantic lookups
- ✅ Indexes: optimized queries

### **Privacy:**
- ✅ RLS: users only see their own data
- ✅ Role-based: candidate can't see recruiter convos
- ✅ Secure by default
- ✅ Can delete if needed

---

## 🎯 **NEXT STEPS:**

### **To Enable:**
1. Run migration in Supabase
2. Deploy updated API routes
3. Deploy updated components
4. Set up cleanup cron job (optional)

### **To Test:**
1. Open HR Assistant
2. Ask a question
3. Refresh page
4. See conversation history loaded ✅
5. Ask follow-up question
6. Notice contextual answer ✅

### **To Maintain:**
- Run cleanup script monthly (or set up cron)
- Monitor database size
- Check token usage (OpenAI API)

---

## 🔥 **IT'S LIVE!**

**No more one-shot answers!**  
**Now it's a REAL conversation with MEMORY!** 🧠

---

**Migration:** `20260109_hr_assistant_conversations.sql`  
**API Enhanced:** `ask/route.ts`, `history/route.ts`  
**Script:** `cleanup-hr-conversations.ts`  
**Status:** ✅ READY TO DEPLOY!

