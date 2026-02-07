# Environment Variables Setup for ShoreAgents Testing

> **ShoreAgents:** localhost:3000  
> **BPOC:** localhost:3001 (to avoid conflict)  
> **File:** `.env.local`

---

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================
# Daily.co Video Integration
# ============================================
DAILY_API_KEY=your-daily-api-key-here
DAILY_WEBHOOK_SECRET=IDadt240r5u4q8GyLNZeaseQQVR3cJhDe097gmp+iog=

# ============================================
# OpenAI (for Whisper transcription)
# ============================================
OPENAI_API_KEY=your-openai-api-key-here

# ============================================
# App Configuration
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# ============================================
# Port Configuration
# ============================================
# IMPORTANT: ShoreAgents runs on port 3000
# BPOC must run on port 3001 to avoid conflicts
# Command: PORT=3001 npm run dev
# Or modify package.json: "dev": "next dev -p 3001"
```

---

## Quick Setup Steps

### 1. Open `.env.local` file
```bash
# File location:
/Users/stepten/Desktop/Dev Projects/bpoc-stepten/.env.local
```

### 2. Add Required Variables

**Minimum Required for ShoreAgents Testing:**
```bash
DAILY_API_KEY=your-actual-daily-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Full Setup (with all features):**
```bash
# Daily.co
DAILY_API_KEY=your-daily-api-key
DAILY_WEBHOOK_SECRET=IDadt240r5u4q8GyLNZeaseQQVR3cJhDe097gmp+iog=

# OpenAI (for transcription)
OPENAI_API_KEY=your-openai-api-key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 3. Get Your Daily.co API Key

1. Go to: https://dashboard.daily.co/developers
2. Copy your API key
3. Paste it in `.env.local`:
   ```bash
   DAILY_API_KEY=daily_api_key_here
   ```

### 4. Start Server on Port 3001

```bash
PORT=3001 npm run dev
```

---

## Verification

### Check if variables are loaded:
```bash
# In your terminal, after starting server:
echo $DAILY_API_KEY
```

### Test Daily.co connection:
```bash
curl -X POST http://localhost:3001/api/v1/video/rooms \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{"applicationId":"test","callType":"recruiter_prescreen"}'
```

**If Daily.co is configured correctly:**
- ✅ Returns room with `host.joinUrl` and `participant.joinUrl`
- ✅ No errors about missing API key

**If Daily.co is NOT configured:**
- ❌ Error: "DAILY_API_KEY is not configured"
- ❌ Error: "Video service not configured"

---

## Complete `.env.local` Template

```bash
# ============================================
# Database (Supabase)
# ============================================
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=your-database-url
SUPABASE_DIRECT_URL=your-direct-url

# ============================================
# Daily.co Video Integration
# ============================================
DAILY_API_KEY=your-daily-api-key-here
DAILY_WEBHOOK_SECRET=IDadt240r5u4q8GyLNZeaseQQVR3cJhDe097gmp+iog=

# ============================================
# OpenAI (for Whisper transcription)
# ============================================
OPENAI_API_KEY=your-openai-api-key-here

# ============================================
# App URLs (for localhost:3001 testing)
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001

# ============================================
# Auth
# ============================================
NEXTAUTH_SECRET=your-nextauth-secret

# ============================================
# Environment
# ============================================
NODE_ENV=development
```

---

## Important Notes

### 1. Port Configuration
- **Default:** Next.js runs on port 3000
- **For 3001:** Use `PORT=3001 npm run dev`
- **Or modify:** `package.json` script to `"dev": "next dev -p 3001"`

### 2. API Keys
- ⚠️ **Never commit** `.env.local` to git (it's in `.gitignore`)
- ✅ **Keep secure** - these are sensitive credentials
- ✅ **Use different keys** for development vs production

### 3. Daily.co Webhook Secret
- Already configured in Daily.co dashboard
- Must match in `.env.local` for webhook verification
- Current value: `IDadt240r5u4q8GyLNZeaseQQVR3cJhDe097gmp+iog=`

### 4. Testing Without Email Service
- Email is currently a stub (logs only)
- This is fine for testing
- Notifications still work via database and real-time

---

## Troubleshooting

### "DAILY_API_KEY is not configured"
- ✅ Check `.env.local` has `DAILY_API_KEY=...`
- ✅ Restart dev server after adding variable
- ✅ Verify no typos in variable name

### "Video service not configured"
- ✅ Check Daily.co API key is valid
- ✅ Test API key at: https://dashboard.daily.co/developers
- ✅ Verify key has correct permissions

### Server not starting on port 3001
- ✅ Use: `PORT=3001 npm run dev`
- ✅ Or modify `package.json` script
- ✅ Check if port 3001 is already in use

---

**Last Updated:** January 4, 2026

