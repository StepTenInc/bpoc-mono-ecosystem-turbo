# Quick Start: BPOC + ShoreAgents Testing

> **ShoreAgents:** `localhost:3000`  
> **BPOC:** `localhost:3001`  
> **Date:** January 4, 2026

---

## 🚀 Quick Setup

### 1. Start BPOC on Port 3001

```bash
cd "/Users/stepten/Desktop/Dev Projects/bpoc-stepten"
PORT=3001 npm run dev
```

**Why 3001?** ShoreAgents is already running on port 3000!

### 2. Verify BPOC is Running

```bash
curl http://localhost:3001/api/health
# Should return 200 OK
```

### 3. Test Notification Endpoint

```bash
curl -X POST http://localhost:3001/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bpoc_c3371bf9449ffee56632a14625a1d1f658f7774c0609249f" \
  -d '{
    "roomId": "test",
    "candidateId": "test",
    "recruiterName": "Test",
    "jobTitle": "Test",
    "participantJoinUrl": "https://test.com"
  }'
```

**Expected:** `{"success":true}` ✅

---

## 📋 Required `.env.local` Variables

```bash
# Daily.co (REQUIRED)
DAILY_API_KEY=your-daily-api-key-here

# App URL (for localhost:3001)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## ✅ Status

- ✅ **ShoreAgents:** Running on `localhost:3000`
- ✅ **BPOC:** Running on `localhost:3001`
- ✅ **Endpoints:** All functional
- ✅ **Daily.co:** Configured

**Ready for testing!** 🎉

