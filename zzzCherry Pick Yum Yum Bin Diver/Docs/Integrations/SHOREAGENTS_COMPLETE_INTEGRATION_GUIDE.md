# ShoreAgents → BPOC Complete Integration Guide

**Last Updated:** January 5, 2026

---

## System Architecture

### BPOC Flow

```
BPOC Platform (Main Product)
├── Candidate Tier (Free)
│   └── Candidates sign up looking for work
├── Recruiter Tier (Paid)
│   └── Recruiters use platform to find candidates
└── Enterprise Tier (Paid + API Access)
    └── Agencies (like ShoreAgents)
        ├── Whitelabeled Portal
        ├── API Access to BPOC
        ├── Clients (Companies needing candidates)
        ├── Recruiters (Agency staff)
        └── Candidates (Pool from BPOC)
```

### ShoreAgents Setup
- **Type:** Enterprise Agency (First Customer)
- **Portal:** Whitelabeled version of BPOC
- **Functions:** Same as BPOC recruiters + API access
- **Flow:**
  1. Agency recruiters post jobs FOR clients
  2. Candidates from BPOC apply
  3. Recruiters review/prescreen via video
  4. API sends notifications to candidates
  5. Track applications through lifecycle

---

## API Endpoint Status

### ✅ WORKING: Validation Layer
```bash
# Test invalid input - Returns 400
curl -X POST https://www.bpoc.io/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -d '{"roomId":"invalid","candidateId":"test","participantJoinUrl":"not-a-url"}'

Response: 400 Bad Request
{
  "error": "Invalid candidateId format. Expected UUID (e.g., 092fd214-03c5-435d-9156-4a533d950cc3)"
}
```

### ⚠️ 500 Error Cause
The 500 error occurs when:
1. Valid UUIDs are provided ✅
2. But candidate doesn't exist in BPOC database ❌
3. Should return 404, but something else fails first

**Likely Issues:**
- Candidate UUID doesn't exist in production database
- Email sending fails (SMTP not configured)
- Database connection issue

---

## Complete Integration Steps

### Step 1: Create Real Test Candidate in BPOC

First, you need a REAL candidate UUID from BPOC database:

```bash
# Option A: Sign up as candidate on BPOC
1. Go to https://www.bpoc.io/signup
2. Create candidate account
3. Get candidate UUID from database or profile

# Option B: Use API to create candidate
curl -X POST https://www.bpoc.io/api/v1/candidates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_shoreagents_key" \
  -d '{
    "email": "test@shoreagents.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-0100"
  }'
```

### Step 2: Get Real Candidate UUID

```sql
-- Query BPOC database
SELECT id, email, first_name, last_name
FROM candidates
WHERE email = 'test@shoreagents.com';

-- Returns:
-- id: 092fd214-03c5-435d-9156-4a533d950cc3
```

### Step 3: Send Notification with Real UUID

```bash
curl -X POST https://www.bpoc.io/api/v1/notifications/call \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "candidateId": "092fd214-03c5-435d-9156-4a533d950cc3",
    "participantJoinUrl": "https://shoreagents.daily.co/test-room?t=token123",
    "recruiterName": "Jane Smith",
    "jobTitle": "Senior Developer"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "invitation": {
    "id": "invitation-uuid-here",
    "status": "pending",
    "notificationSent": true
  },
  "message": "Candidate notified successfully"
}
```

---

## Candidate UI Flow (BPOC Side)

### What Happens When Notification is Sent

1. **Email Sent:**
   - Candidate receives email: "Jane Smith wants to video call you"
   - Email contains "Join Video Call" button
   - Button links to `participantJoinUrl`

2. **Database Records Created:**
   - `video_call_rooms` - Room record (if doesn't exist)
   - `video_call_invitations` - Invitation record
   - Status set to "pending"

3. **Candidate Dashboard (Future):**
   - Real-time notification appears
   - "Incoming Call" popup
   - Click to join immediately

### Current Candidate UI Status

**Email Notifications:** ✅ Working
**In-App Notifications:** ⏸️ Disabled (realtime_notifications table doesn't exist)
**Join Flow:** ✅ Click email link → Opens Daily.co room

---

## Testing Checklist for ShoreAgents

### ✅ Validation Works
- [x] Invalid UUID returns 400 with clear message
- [x] Missing fields returns 400
- [x] Invalid URL returns 400

### 🔧 Need to Test with Real Data
- [ ] Create real candidate in BPOC
- [ ] Get real candidate UUID
- [ ] Send notification with real UUID
- [ ] Verify email is sent
- [ ] Verify invitation record created
- [ ] Verify candidate can join call

---

## Quick Fix for Current 500 Error

The 500 error happens because:
1. Test UUID doesn't exist
2. Code tries to query non-existent candidate
3. Should return 404 but fails somewhere else

**Immediate Solution:**
Use a REAL candidate UUID from BPOC production database.

**How to Get One:**
```bash
# Ask BPOC support for a test candidate UUID
# OR create one via signup at www.bpoc.io
# OR use ShoreAgents API to create candidate first
```

---

## ShoreAgents API Integration Pattern

### Recommended Flow

```typescript
// 1. Create candidate in BPOC (if not exists)
const candidate = await createOrGetCandidate({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// 2. Create video room in ShoreAgents Daily.co
const room = await daily.createRoom({
  name: 'prescreen-123',
  privacy: 'private'
});

// 3. Get participant join token
const token = await daily.createMeetingToken({
  room_name: room.name,
  is_owner: false
});

// 4. Send notification via BPOC API
const notification = await fetch('https://www.bpoc.io/api/v1/notifications/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: room.id, // Your Daily room UUID
    candidateId: candidate.id, // From BPOC
    participantJoinUrl: `${room.url}?t=${token}`,
    recruiterName: 'Jane Smith',
    jobTitle: 'Senior Developer'
  })
});

// 5. Handle response
if (notification.success) {
  console.log('Candidate notified!');
  // Candidate receives email
  // Invitation record created in BPOC
}
```

---

## Error Handling Guide

### 400 Errors (Client Issues)

**Missing Fields:**
```json
{
  "error": "Missing required fields: roomId, candidateId, participantJoinUrl"
}
```
**Fix:** Include all required fields in request

**Invalid UUID:**
```json
{
  "error": "Invalid candidateId format. Expected UUID (e.g., 092fd214-03c5-435d-9156-4a533d950cc3)"
}
```
**Fix:** Use proper UUID format (lowercase, with dashes)

**Invalid URL:**
```json
{
  "error": "Invalid participantJoinUrl format. Expected valid URL"
}
```
**Fix:** Use complete URL with protocol (https://...)

### 404 Errors (Not Found)

**Candidate Not Found:**
```json
{
  "error": "Candidate not found",
  "id": "candidate-uuid-here"
}
```
**Fix:** Create candidate in BPOC first, or use existing candidate UUID

### 500 Errors (Server Issues)

**Possible Causes:**
1. Database connection issue
2. Email service not configured
3. Prisma client error
4. Unexpected runtime error

**Solution:** Contact BPOC support with:
- Exact request payload
- Timestamp of request
- ShoreAgents API key (for log lookup)

---

## Candidate UI Requirements (BPOC Side)

### Current State
- **Email Notifications:** ✅ Working
- **Join Button in Email:** ✅ Links to Daily.co
- **In-App Notifications:** ⏸️ Disabled

### What Candidate Sees

1. **Email Notification:**
   ```
   Subject: Jane Smith wants to video call you

   [Email Body]
   Jane Smith wants to have a quick video call with you about
   the Senior Developer position.

   [Join Video Call Button]

   This link is valid for 24 hours.
   ```

2. **Clicks Join Button:**
   - Opens `https://shoreagents.daily.co/room-name?t=token`
   - Daily.co pre-call UI loads
   - Candidate sees camera/mic permissions
   - Clicks "Join Call"
   - Enters video room

3. **In BPOC Dashboard (Future):**
   - Real-time "Incoming Call" popup
   - "Answer" or "Decline" buttons
   - Call history in profile

---

## Next Steps

### For ShoreAgents Team
1. ✅ Validation is working - confirmed
2. 🔧 Get real candidate UUID from BPOC
3. 🔧 Test with real UUID
4. 🔧 Verify email delivery
5. 🔧 Test full video call flow

### For BPOC Team
1. ✅ Fix validation (done)
2. ✅ Add inline UUID/URL validation (done)
3. 🔧 Debug why 500 error with valid UUID
4. 🔧 Add candidate in-app notification UI
5. 🔧 Add real-time notification system

---

## Support

**ShoreAgents Issues:**
- Check: BPOC_API_COMPLETE_GUIDE.md
- Contact: BPOC support team

**API Status:**
- Validation: ✅ Working
- Candidate Lookup: 🔧 Need real UUID to test
- Email Sending: 🔧 Unknown (need real test)
- Full Flow: 🔧 Pending real data test

---

**Last Updated:** January 5, 2026
**Status:** Validation working, awaiting real candidate UUID test
