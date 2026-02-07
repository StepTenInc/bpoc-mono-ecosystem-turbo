# BPOC Webhooks Design Document

## Overview

Webhooks allow external systems to receive real-time notifications when events occur in BPOC, eliminating the need for constant polling.

## Implementation Status

🚧 **Planned for v1.1** (Q2 2026)

This document describes the planned webhook system architecture.

## Use Cases

### For Agencies
- **Application submitted** → Send notification to recruiter
- **Application released** → Update agency CRM
- **Interview scheduled** → Add to agency calendar
- **Offer accepted** → Trigger onboarding workflow

### For Clients
- **New candidate released** → Send email to hiring manager
- **Interview completed** → Update hiring dashboard
- **Candidate withdrawn** → Remove from consideration

### For Candidates
- **Application viewed** → Send confirmation email
- **Interview scheduled** → Send calendar invite
- **Offer extended** → Send notification

## Webhook Events

### Application Events
- `application.created` - New application submitted
- `application.released` - Application released to client
- `application.status_changed` - Application status updated
- `application.withdrawn` - Candidate withdrew application

### Job Events
- `job.created` - New job posted
- `job.updated` - Job details changed
- `job.closed` - Job closed/filled
- `job.deadline_approaching` - Application deadline in 24 hours

### Candidate Events
- `candidate.created` - New candidate registered
- `candidate.updated` - Candidate profile updated
- `candidate.assessment_completed` - Assessment completed

### Interview Events
- `interview.scheduled` - Interview scheduled
- `interview.started` - Interview started
- `interview.completed` - Interview completed
- `interview.rescheduled` - Interview rescheduled
- `interview.cancelled` - Interview cancelled

### Offer Events
- `offer.created` - Offer extended
- `offer.accepted` - Offer accepted
- `offer.rejected` - Offer rejected
- `offer.countered` - Counter offer submitted

## Webhook Configuration

### Registering Webhooks

**API Endpoint:** `POST /api/v1/webhooks`

```bash
curl -X POST "https://bpoc.io/api/v1/webhooks" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/bpoc",
    "events": [
      "application.created",
      "application.released",
      "interview.scheduled"
    ],
    "secret": "your-webhook-secret-for-signature-verification",
    "description": "Production webhook for CRM integration"
  }'
```

**Response:**
```json
{
  "id": "webhook_abc123",
  "url": "https://your-app.com/webhooks/bpoc",
  "events": [
    "application.created",
    "application.released",
    "interview.scheduled"
  ],
  "secret": "whsec_xxxxxxxxxxxxxxxx",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Listing Webhooks

```bash
curl "https://bpoc.io/api/v1/webhooks" \
  -H "X-API-Key: YOUR_KEY"
```

### Updating Webhooks

```bash
curl -X PATCH "https://bpoc.io/api/v1/webhooks/webhook_abc123" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["application.created"],
    "active": true
  }'
```

### Deleting Webhooks

```bash
curl -X DELETE "https://bpoc.io/api/v1/webhooks/webhook_abc123" \
  -H "X-API-Key: YOUR_KEY"
```

## Webhook Payload Format

### Standard Payload Structure

```json
{
  "id": "evt_abc123xyz",
  "event": "application.created",
  "createdAt": "2024-01-15T10:30:00Z",
  "data": {
    "application": {
      "id": "app_123",
      "candidateId": "cand_456",
      "jobId": "job_789",
      "status": "applied",
      "releasedToClient": false,
      "appliedAt": "2024-01-15T10:30:00Z",
      "candidate": {
        "id": "cand_456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "job": {
        "id": "job_789",
        "title": "Virtual Assistant",
        "clientId": "client_101"
      }
    }
  },
  "agencyId": "agency_999"
}
```

### Event-Specific Payloads

#### application.created
```json
{
  "id": "evt_123",
  "event": "application.created",
  "createdAt": "2024-01-15T10:30:00Z",
  "data": {
    "application": { /* full application object */ },
    "candidate": { /* full candidate object */ },
    "job": { /* full job object */ }
  }
}
```

#### application.released
```json
{
  "id": "evt_124",
  "event": "application.released",
  "createdAt": "2024-01-15T11:00:00Z",
  "data": {
    "application": { /* full application object */ },
    "releasedBy": {
      "id": "user_789",
      "name": "Jane Recruiter",
      "email": "jane@agency.com"
    }
  }
}
```

#### interview.scheduled
```json
{
  "id": "evt_125",
  "event": "interview.scheduled",
  "createdAt": "2024-01-15T12:00:00Z",
  "data": {
    "interview": {
      "id": "int_456",
      "applicationId": "app_123",
      "scheduledAt": "2024-01-20T14:00:00Z",
      "duration": 60,
      "meetingUrl": "https://bpoc.io/interviews/int_456",
      "type": "video"
    },
    "application": { /* application object */ },
    "candidate": { /* candidate object */ }
  }
}
```

## Security

### Signature Verification

All webhook payloads include an HMAC signature for verification:

**Headers:**
```
X-BPOC-Signature: sha256=abc123...
X-BPOC-Timestamp: 1705320000
X-BPOC-Webhook-ID: webhook_abc123
```

**Verification (Node.js):**
```javascript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  // Prevent replay attacks (reject if > 5 minutes old)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(expectedSignature)
  );
}

// Express.js example
app.post('/webhooks/bpoc', (req, res) => {
  const signature = req.headers['x-bpoc-signature'];
  const timestamp = req.headers['x-bpoc-timestamp'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET, timestamp)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const event = req.body;
  console.log('Received event:', event.event);

  // Return 200 to acknowledge receipt
  res.status(200).send({ received: true });
});
```

## Delivery Guarantees

### Retry Logic

- **Initial attempt:** Immediate
- **Retry 1:** After 1 minute
- **Retry 2:** After 5 minutes
- **Retry 3:** After 15 minutes
- **Retry 4:** After 1 hour
- **Retry 5:** After 6 hours

After 5 failed attempts, the webhook is marked as failing and an alert is sent to the agency.

### Success Criteria

A webhook delivery is considered successful if:
- HTTP status code is 2xx (200-299)
- Response received within 30 seconds

### Failure Handling

If your endpoint is down:
1. Webhooks are queued and retried
2. You receive email alerts after 3 failed attempts
3. Webhook is disabled after 100 consecutive failures
4. Event history retained for 30 days

## Best Practices

### 1. Return 200 Immediately

```javascript
// ❌ Bad - Processing before response
app.post('/webhooks', async (req, res) => {
  await processEvent(req.body); // Takes 5 seconds
  res.status(200).send({ received: true });
});

// ✅ Good - Respond immediately, process async
app.post('/webhooks', async (req, res) => {
  res.status(200).send({ received: true });
  
  // Process asynchronously
  setImmediate(async () => {
    try {
      await processEvent(req.body);
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  });
});
```

### 2. Implement Idempotency

```javascript
const processedEvents = new Set();

async function handleWebhook(event) {
  // Check if already processed
  if (processedEvents.has(event.id)) {
    console.log('Duplicate event, skipping:', event.id);
    return;
  }

  // Process event
  await processEvent(event);

  // Mark as processed
  processedEvents.add(event.id);
  
  // Clean up old events (keep last 10,000)
  if (processedEvents.size > 10000) {
    const firstEvent = processedEvents.values().next().value;
    processedEvents.delete(firstEvent);
  }
}
```

### 3. Use Event Types for Routing

```javascript
app.post('/webhooks/bpoc', async (req, res) => {
  res.status(200).send({ received: true });

  const event = req.body;

  switch (event.event) {
    case 'application.created':
      await handleNewApplication(event.data);
      break;
    
    case 'application.released':
      await notifyClient(event.data);
      break;
    
    case 'interview.scheduled':
      await sendCalendarInvite(event.data);
      break;
    
    default:
      console.log('Unknown event type:', event.event);
  }
});
```

### 4. Log Everything

```javascript
await db.webhookLogs.insert({
  eventId: event.id,
  eventType: event.event,
  receivedAt: new Date(),
  payload: event,
  processed: true,
  error: null
});
```

## Testing Webhooks

### Test Mode

Use test API keys to receive webhook events without affecting production:

```bash
# Test webhook endpoint
curl -X POST "https://bpoc.io/api/v1/webhooks/test" \
  -H "X-API-Key: YOUR_TEST_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/test",
    "events": ["application.created"]
  }'
```

### Webhook Simulator

Send test events to your endpoint:

```bash
curl -X POST "https://bpoc.io/api/v1/webhooks/webhook_abc123/test" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "application.created"
  }'
```

### Local Development

Use ngrok or similar to expose local server:

```bash
ngrok http 3000

# Use ngrok URL in webhook config
# https://abc123.ngrok.io/webhooks/bpoc
```

## Monitoring

### Webhook Dashboard

View webhook health at:
https://bpoc.io/recruiter/webhooks/dashboard

**Metrics:**
- Total events sent
- Success rate
- Average latency
- Failed deliveries
- Recent events log

### Event History

Query past webhook events:

```bash
curl "https://bpoc.io/api/v1/webhooks/events?limit=100" \
  -H "X-API-Key: YOUR_KEY"
```

## Rate Limits

- **Max webhooks per agency:** 10
- **Max events per webhook:** 20 event types
- **Max delivery attempts:** 5
- **Max concurrent deliveries:** 100

## Support

**Webhook issues?**
- Check webhook dashboard for errors
- Test with webhook simulator
- Email webhooks@bpoc.io with webhook ID

**Status page:** https://status.bpoc.io/webhooks
