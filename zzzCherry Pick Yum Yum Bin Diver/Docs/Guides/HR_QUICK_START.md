# 🚀 HR Knowledge Base - Quick Start (5 Minutes)

## ⚡ Super Fast Setup

### 1️⃣ Add OpenAI Key (30 seconds)

```bash
# Add to .env.local
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2️⃣ Run Migration (1 minute)

**Option A - Supabase Dashboard:**
1. Go to SQL Editor in Supabase
2. Copy contents of `20260109_create_hr_embeddings_kb.sql`
3. Paste and run

**Option B - Command Line:**
```bash
psql your_database_url < 20260109_create_hr_embeddings_kb.sql
```

### 3️⃣ Populate Data (20-30 minutes)

```bash
npm run populate-hr-embeddings
```

☕ Grab coffee while it processes the 5,281-line Labor Code document!

### 4️⃣ Test It (30 seconds)

```bash
npm run test-hr-search
```

### 5️⃣ See It Live (30 seconds)

```bash
npm run dev
```

Visit: `http://localhost:3000/hr-assistant-demo`

---

## 🎯 Use It Anywhere

```tsx
import { HRAssistant } from '@/components/hr/HRAssistant';

// In your component
<HRAssistant role="candidate" />
// or role="recruiter" or role="admin"
```

---

## 💬 Example Questions

**Candidate:**
- "When do I become regular?"
- "Can I back out of a job offer?"

**Recruiter:**
- "What is the legal probationary period?"
- "What are valid termination grounds?"

**Admin:**
- "What are compliance requirements?"
- "What are penalties for violations?"

---

## 📊 What You Get

✅ ~800-1000 searchable chunks  
✅ Entire Philippine Labor Code  
✅ AI-powered answers  
✅ Article citations  
✅ Role-based filtering  
✅ Beautiful UI component  
✅ 3 API routes ready to use  

---

## 💰 Cost

**Setup:** ~$1  
**Per query:** ~$0.001  

---

## 🎉 Done!

That's it! You now have a production-ready HR assistant for Philippine labor law.

Full docs: `HR_KNOWLEDGE_BASE_SETUP.md`  
Summary: `HR_IMPLEMENTATION_COMPLETE.md`

