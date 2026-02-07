# Philippine Labor Code HR Knowledge Base - Complete Setup Guide

## 🎯 Overview

This system creates a powerful AI-powered HR Assistant for **BPOC** that can answer questions about Philippine labor law for:
- 👥 **Candidates** - Questions about rights, regularization, benefits, resignation, etc.
- 🎯 **Recruiters** - Questions about hiring, compliance, employment terms, etc.
- 👔 **Admins** - Questions about regulations, penalties, legal requirements, etc.

The system uses **vector embeddings** to semantically search the entire Philippine Labor Code (DOLE) document.

---

## 📋 What You Need

### 1. **Environment Variables**

Add these to your `.env.local` file:

```bash
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. **Database Setup**

The migration file has been created at:
```
20260109_create_hr_embeddings_kb.sql
```

---

## 🚀 Step-by-Step Setup

### **Step 1: Run the Migration**

This creates the `hr_embeddings_kb` table and all search functions:

```bash
# Option A: Using psql
psql your_database_url < 20260109_create_hr_embeddings_kb.sql

# Option B: Using Supabase Dashboard
# - Go to SQL Editor
# - Copy/paste the contents of 20260109_create_hr_embeddings_kb.sql
# - Run it
```

### **Step 2: Install Dependencies**

Make sure you have OpenAI SDK installed:

```bash
npm install openai
# or
pnpm install openai
```

### **Step 3: Populate the Knowledge Base**

This will:
1. Read the 5,281-line Philippine Labor Code document
2. Intelligently chunk it by articles/sections
3. Generate OpenAI embeddings for each chunk
4. Tag content by role (admin/recruiter/candidate)
5. Extract topics, keywords, and example questions
6. Insert everything into the database

```bash
npm run populate-hr-embeddings
```

**⏱️ Expected time:** ~20-30 minutes (depending on document size and rate limits)

**💰 Cost:** ~$0.50-$1.00 in OpenAI API costs (using ada-002 embeddings)

### **Step 4: Test the System**

Run the test script to see it in action:

```bash
npm run test-hr-search
```

This will test queries like:
- "When do I become a regular employee?"
- "Can I back out after accepting a job offer?"
- "What is the legal probationary period?"
- "When should I receive my 13th month pay?"

---

## 📊 What Gets Created

### **Database Table: `hr_embeddings_kb`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `content` | TEXT | The chunked text content |
| `embedding` | vector(1536) | OpenAI ada-002 embedding |
| `document_section` | VARCHAR | e.g., "Book I - Article 295" |
| `article_number` | VARCHAR | e.g., "295" |
| `topics` | TEXT[] | e.g., `['regularization', 'probationary']` |
| `role_relevance` | VARCHAR[] | e.g., `['candidate', 'recruiter']` |
| `keywords` | TEXT[] | For hybrid search |
| `question_examples` | TEXT[] | Example questions chunk can answer |
| `importance_score` | DECIMAL | 0.0-1.0 (how commonly referenced) |

### **Database Functions**

1. **`search_hr_knowledge()`** - Semantic search with role filtering
2. **`search_hr_hybrid()`** - Vector + keyword hybrid search
3. **`get_hr_related_content()`** - Get all chunks from specific article

---

## 🔍 How to Use the Knowledge Base

### **Example 1: Search from your API**

```typescript
// In your API route (e.g., /api/hr-assistant/search)
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(request: Request) {
  const { question, role } = await request.json();
  
  // 1. Generate embedding for the question
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question,
  });
  const embedding = embeddingResponse.data[0].embedding;
  
  // 2. Search the knowledge base
  const { data, error } = await supabase.rpc('search_hr_knowledge', {
    query_embedding: JSON.stringify(embedding),
    user_role: role, // 'admin', 'recruiter', or 'candidate'
    match_threshold: 0.7,
    match_count: 5
  });
  
  // 3. Return results
  return Response.json({ results: data });
}
```

### **Example 2: Build an AI Chat Assistant**

```typescript
// Combine search results with OpenAI chat
async function askHRAssistant(question: string, role: string) {
  // 1. Search knowledge base
  const searchResults = await searchHRKnowledge(question, role);
  
  // 2. Build context from results
  const context = searchResults
    .map(r => `[Article ${r.article_number}] ${r.content}`)
    .join('\n\n');
  
  // 3. Ask OpenAI with context
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an HR assistant for Philippine labor law. 
                 Answer based on this context from the Labor Code:\n\n${context}`
      },
      {
        role: 'user',
        content: question
      }
    ]
  });
  
  return completion.choices[0].message.content;
}
```

### **Example 3: Get Specific Article**

```typescript
// Get all content about Article 295 (Probationary Employment)
const { data } = await supabase.rpc('get_hr_related_content', {
  source_article_number: '295',
  user_role: 'candidate',
  match_count: 10
});
```

---

## 🎨 UI Component Example

Create a simple HR Assistant chat component:

```tsx
'use client';

import { useState } from 'react';

export function HRAssistant({ role }: { role: 'admin' | 'recruiter' | 'candidate' }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function askQuestion() {
    setLoading(true);
    
    const response = await fetch('/api/hr-assistant/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, role })
    });
    
    const data = await response.json();
    setAnswer(data.answer);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2>HR Assistant - Philippine Labor Law</h2>
      
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask about Philippine labor law..."
        className="w-full p-2 border rounded"
      />
      
      <button 
        onClick={askQuestion}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Searching...' : 'Ask'}
      </button>
      
      {answer && (
        <div className="p-4 bg-gray-50 rounded">
          <h3>Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📈 Example Questions by Role

### **Candidate Questions:**
- "When do I become a regular employee?"
- "Can I back out after accepting a job offer?"
- "What happens if I resign during probationary period?"
- "When should I receive my 13th month pay?"
- "What leave benefits am I entitled to?"
- "How many hours should I work per day?"
- "What is separation pay?"

### **Recruiter Questions:**
- "What is the legal probationary period?"
- "What are valid grounds for termination?"
- "What are the employer's obligations for benefits?"
- "How should employment contracts be structured?"
- "What are the regularization requirements?"
- "What records must we maintain?"

### **Admin Questions:**
- "What are the employer compliance requirements?"
- "What are the penalties for violations?"
- "What reports must be submitted to DOLE?"
- "What are the establishment registration requirements?"
- "What are the inspection procedures?"

---

## 🎯 Features

✅ **Role-Based Access** - Different content relevance for admin/recruiter/candidate
✅ **Semantic Search** - Understands meaning, not just keywords
✅ **Hybrid Search** - Combines vector + keyword search
✅ **Article Lookup** - Direct access to specific Labor Code articles
✅ **Topic Tagging** - Content tagged by topic (regularization, termination, etc.)
✅ **Example Questions** - Each chunk has example questions it can answer
✅ **Importance Scoring** - Prioritizes commonly-referenced content
✅ **Security** - RLS policies ensure proper access control

---

## 🔧 Troubleshooting

### **Issue: "relation user_profiles does not exist"**
✅ **Fixed!** The migration now uses the correct table names:
- `candidates` (not user_profiles)
- `agency_recruiters` (not user_profiles)
- `admin_users` (not user_profiles)

### **Issue: "OpenAI rate limit"**
- The script includes 2-second delays between batches
- If you hit rate limits, you can:
  1. Reduce batch size (change `batchSize` from 10 to 5)
  2. Increase delay between batches
  3. Run the script multiple times (it will resume)

### **Issue: "Document not found"**
- Ensure the document is at: `Docs/HR/Philippine_Labor_Code 2026.md`
- Check the path in the script matches your structure

---

## 📊 Expected Results

After running `populate-hr-embeddings`, you should see:

```
✅ PROCESSING COMPLETE!
📊 Total chunks: ~800-1000 chunks
✅ Successfully processed: 100%

📊 Role Distribution:
   Admin: ~600 chunks
   Recruiter: ~700 chunks
   Candidate: ~800 chunks

📊 Top Topics:
   employment: 300+ chunks
   termination: 150+ chunks
   wages: 120+ chunks
   benefits: 100+ chunks
   ...
```

---

## 🚀 Next Steps

1. **Run the migration** ✅
2. **Populate embeddings** - `npm run populate-hr-embeddings`
3. **Test the search** - `npm run test-hr-search`
4. **Create API routes** for your HR Assistant
5. **Build UI components** for each role
6. **Integrate into your app** - Add HR Assistant to candidate/recruiter/admin dashboards

---

## 💡 Tips

- **Cost Optimization**: OpenAI ada-002 embeddings are cheap (~$0.0001 per 1K tokens)
- **Search Quality**: Adjust `match_threshold` (0.7 default) - lower = more results, higher = more precise
- **Chunking**: The script chunks at ~1000 characters, keeping article boundaries intact
- **Updates**: To update the knowledge base, just re-run the populate script (it clears existing data)

---

## 🎉 You're All Set!

You now have a fully-functional HR Knowledge Base powered by AI that can answer questions about Philippine labor law for all user roles in your BPOC platform!

Questions? Check the test script for working examples of all search functions.

