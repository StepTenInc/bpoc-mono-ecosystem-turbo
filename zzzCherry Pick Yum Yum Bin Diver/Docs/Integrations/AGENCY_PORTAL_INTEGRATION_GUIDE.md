# Agency Portal Integration Guide

> **Complete guide for agencies building their own Client Portal and Admin Portal integrated with BPOC**

## Overview

This guide explains how an agency can build their own portal (like ShoreAgents.ai) that integrates with BPOC to provide:

- **Agency Admin Portal**: Manage recruiters, clients, and overall operations
- **Client Portal**: Clients can post jobs, browse candidates, schedule interviews, send offers
- **Video Interviews**: Hosted by BPOC's Daily.co infrastructure - no setup required!

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR AGENCY PORTAL                          │
│  (ShoreAgents.ai, YourAgency.com, etc.)                        │
├─────────────────────┬───────────────────────────────────────────┤
│   Admin Portal      │           Client Portal                   │
│   ─────────────     │           ─────────────                   │
│   • Manage clients  │   • Post job requests                     │
│   • View all jobs   │   • Browse candidates                     │
│   • Analytics       │   • Review applications                   │
│   • Team mgmt       │   • Schedule interviews                   │
│                     │   • Join video calls                      │
│                     │   • Send offers                           │
└─────────────────────┴───────────────────────────────────────────┘
                              │
                              │ API Calls (X-API-Key header)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BPOC API                                │
│              https://bpoc.io/api/v1/                            │
├─────────────────────────────────────────────────────────────────┤
│  • /clients          - Link/create clients                      │
│  • /jobs             - Manage job listings                      │
│  • /applications     - Handle applications                      │
│  • /candidates       - Talent pool access                       │
│  • /interviews       - Schedule interviews                      │
│  • /video/rooms      - Create video call rooms ◄── Daily.co     │
│  • /video/recordings - Access recordings                        │
│  • /offers           - Send job offers                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Internal
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BPOC Infrastructure                          │
├─────────────────────────────────────────────────────────────────┤
│  • Supabase (Database, Auth, Storage)                           │
│  • Daily.co (Video calls, recordings, transcription)            │
│  • OpenAI Whisper (AI transcription)                            │
│  • GPT-4 (AI summaries, candidate analysis)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Concept: Video Calls via BPOC's Daily.co

**IMPORTANT**: Your agency does NOT need a Daily.co account!

BPOC hosts all video infrastructure. When you call the video API:

1. **Create Room**: `POST /video/rooms` → Returns join URLs
2. **Host Join URL**: Embed in your Client Portal for client/recruiter
3. **Participant Join URL**: Send to candidate via email
4. **Everyone joins**: Browser-based, no app download needed
5. **Recording**: Automatically saved to BPOC (if enabled)
6. **Transcription**: AI-powered transcription available (Enterprise)

```
Client clicks "Start Interview" in YOUR portal
           │
           ▼
Your portal calls: POST /api/v1/video/rooms
           │
           ▼
BPOC creates room on Daily.co
           │
           ▼
Returns: { host.joinUrl, participant.joinUrl }
           │
           ├──► Embed host.joinUrl in iframe OR open in new tab
           │    (Client/recruiter joins this way)
           │
           └──► Send participant.joinUrl via email to candidate
                (Candidate clicks link to join)
           │
           ▼
Both join the same Daily.co room (hosted by BPOC)
Recording is saved to BPOC's storage
```

---

## Getting Started

### 1. Get Your API Key

1. Login to BPOC as a recruiter
2. Go to **Settings** → **API Keys**
3. Generate an API key
4. Store securely (never expose in frontend code!)

### 2. Base URL

```
Production: https://bpoc.io/api/v1
```

### 3. Authentication

All requests require the `X-API-Key` header:

```bash
curl -X GET "https://bpoc.io/api/v1/jobs" \
  -H "X-API-Key: bpoc_xxxxxxxxxxxxx"
```

---

## Implementation Guide

### Step 1: Create API Client

Create a server-side API client (never expose API key to frontend):

```typescript
// lib/bpoc-api.ts
const BPOC_BASE_URL = process.env.BPOC_API_URL || 'https://bpoc.io/api/v1';
const BPOC_API_KEY = process.env.BPOC_API_KEY!;

export async function bpocApi<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BPOC_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': BPOC_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }
  
  return data;
}
```

### Step 2: Link Clients to BPOC

**CRITICAL**: Always call `/clients/get-or-create` first and store the returned `clientId`.

```typescript
// When a new client signs up on your portal
export async function linkClientToBPOC(clientData: {
  name: string;
  email: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
}) {
  const result = await bpocApi('/clients/get-or-create', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
  
  // Store this clientId in YOUR database!
  // { clientId: "uuid", companyId: "uuid", name: "...", created: true/false }
  return result;
}
```

### Step 3: Client Posts a Job

```typescript
export async function createJobInBPOC(data: {
  clientId: string;  // From linkClientToBPOC
  title: string;
  description: string;
  requirements?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  workArrangement?: 'remote' | 'onsite' | 'hybrid';
  workType?: 'full_time' | 'part_time' | 'contract';
  experienceLevel?: 'entry_level' | 'mid_level' | 'senior_level';
}) {
  return bpocApi('/jobs/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### Step 4: Browse & Apply Candidates

```typescript
// Client views applications for their jobs
export async function getApplications(clientId: string, jobId?: string) {
  const params = new URLSearchParams({ clientId });
  if (jobId) params.set('job_id', jobId);
  
  return bpocApi(`/applications?${params}`);
}

// Get full candidate details
export async function getApplicationDetails(applicationId: string) {
  return bpocApi(`/applications/${applicationId}`);
}

// Update application status
export async function updateApplicationStatus(
  applicationId: string, 
  status: string, 
  notes?: string
) {
  return bpocApi(`/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}
```

### Step 5: Schedule & Conduct Video Interview

This is the key integration - video calls hosted by BPOC's Daily.co:

```typescript
// Create video room for interview
export async function createVideoInterview(data: {
  applicationId: string;
  callType: 'screening' | 'technical' | 'client_intro' | 'final' | 'general';
  scheduledFor?: string;  // ISO date string
  candidateName?: string;
  enableRecording?: boolean;  // Default: true
}) {
  const result = await bpocApi('/video/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // Result contains:
  // {
  //   room: { id, roomName, roomUrl, status, callType, title },
  //   host: { joinUrl, token },        // For client/recruiter
  //   participant: { joinUrl, token }  // For candidate
  // }
  
  return result;
}

// Get fresh join tokens (tokens expire after 2 hours)
export async function getVideoRoom(roomId: string) {
  return bpocApi(`/video/rooms/${roomId}`);
}

// After interview - update outcome
export async function updateInterviewOutcome(
  roomId: string,
  outcome: 'successful' | 'no_show' | 'rescheduled' | 'cancelled',
  notes?: string
) {
  return bpocApi(`/video/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ended', outcome, notes }),
  });
}
```

### Step 6: Access Recordings & Transcripts

```typescript
// List recordings for a room
export async function getRecordings(roomId: string) {
  return bpocApi(`/video/recordings?roomId=${roomId}`);
}

// Get recording with download link (valid 1 hour)
export async function getRecordingDownload(recordingId: string) {
  return bpocApi(`/video/recordings/${recordingId}`);
}

// Get AI transcript (Enterprise)
export async function getTranscript(transcriptId: string) {
  return bpocApi(`/video/transcripts/${transcriptId}`);
}
```

### Step 7: Send Job Offer

```typescript
export async function sendJobOffer(data: {
  applicationId: string;
  salary: number;
  currency?: string;
  startDate?: string;
  benefits?: string[];
  message?: string;
}) {
  return bpocApi('/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

## Client Portal UI Implementation

### Embedding Video Calls

**Option 1: Open in New Tab (Simplest)**

```tsx
function JoinInterviewButton({ joinUrl }: { joinUrl: string }) {
  return (
    <button onClick={() => window.open(joinUrl, '_blank')}>
      Join Video Interview
    </button>
  );
}
```

**Option 2: Embed in Iframe**

```tsx
function VideoCallEmbed({ joinUrl }: { joinUrl: string }) {
  return (
    <div className="video-container" style={{ width: '100%', height: '600px' }}>
      <iframe
        src={joinUrl}
        allow="camera; microphone; fullscreen; display-capture"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}
```

**Option 3: Daily.co Prebuilt UI (Advanced)**

```tsx
import DailyIframe from '@daily-co/daily-js';

function VideoCallComponent({ roomUrl, token }: { roomUrl: string; token: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
    });

    callFrameRef.current.join({ url: roomUrl, token });

    return () => {
      callFrameRef.current?.destroy();
    };
  }, [roomUrl, token]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
}
```

---

## Complete Workflow Example

Here's a complete example of the hiring flow:

```typescript
// 1. Client signs up on your portal
const client = await linkClientToBPOC({
  name: 'Acme Corporation',
  email: 'hr@acme.com',
  industry: 'Technology',
  contactName: 'Jane Smith',
});
// Store client.clientId in your database

// 2. Client posts a job
const job = await createJobInBPOC({
  clientId: client.clientId,
  title: 'Virtual Assistant',
  description: 'Looking for an experienced VA...',
  salaryMin: 30000,
  salaryMax: 50000,
  workArrangement: 'remote',
});

// 3. Candidates apply on BPOC (or via your portal)
// ... candidates see job on bpoc.io and apply ...

// 4. Client reviews applications
const { applications } = await getApplications(client.clientId);
const appDetails = await getApplicationDetails(applications[0].id);

// 5. Client shortlists candidate
await updateApplicationStatus(appDetails.application.id, 'shortlisted');

// 6. Schedule interview
const interview = await bpocApi('/interviews', {
  method: 'POST',
  body: JSON.stringify({
    applicationId: appDetails.application.id,
    type: 'screening',
    scheduledAt: '2025-01-20T10:00:00Z',
  }),
});

// 7. Create video room
const videoRoom = await createVideoInterview({
  applicationId: appDetails.application.id,
  callType: 'screening',
  scheduledFor: '2025-01-20T10:00:00Z',
});

// 8. Send candidate the join link
await sendEmail({
  to: appDetails.application.candidate.email,
  subject: 'Interview Scheduled - Acme Corporation',
  body: `Join your interview here: ${videoRoom.participant.joinUrl}`,
});

// 9. Client joins via their portal
// Embed or link to: videoRoom.host.joinUrl

// 10. After interview - update outcome
await updateInterviewOutcome(videoRoom.room.id, 'successful', 'Great candidate!');

// 11. Access recording
const recordings = await getRecordings(videoRoom.room.id);
const recordingDetails = await getRecordingDownload(recordings.recordings[0].id);
// recordingDetails.download.url = temporary download link

// 12. Send offer
await sendJobOffer({
  applicationId: appDetails.application.id,
  salary: 45000,
  currency: 'PHP',
  startDate: '2025-02-01',
  benefits: ['HMO', '13th Month Pay', 'Remote Work'],
});

// 13. Candidate accepts → Mark as hired
await updateApplicationStatus(appDetails.application.id, 'hired');
```

---

## API Reference Summary

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clients` | List all clients |
| POST | `/clients/get-or-create` | Link/create client (returns clientId) |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | List jobs (filter: clientId, status) |
| GET | `/jobs/:id` | Get job details |
| POST | `/jobs/create` | Create job (requires clientId) |
| PATCH | `/jobs/:id` | Update job |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/applications` | List applications |
| GET | `/applications/:id` | Full application with candidate profile |
| POST | `/applications` | Submit application |
| PATCH | `/applications/:id` | Update status |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/interviews` | List interviews |
| POST | `/interviews` | Schedule interview |
| PATCH | `/interviews` | Update outcome |

### Video Calls (Daily.co hosted by BPOC)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/video/rooms` | List video rooms |
| POST | `/video/rooms` | **Create room → Returns join URLs** |
| GET | `/video/rooms/:id` | Get room with fresh tokens |
| PATCH | `/video/rooms/:id` | Update status/outcome |
| DELETE | `/video/rooms/:id` | Delete room |

### Recordings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/video/recordings` | List recordings |
| GET | `/video/recordings/:id` | Get download link |
| POST | `/video/recordings/:id` | Trigger transcription |

### Transcripts (Enterprise)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/video/transcripts/:id` | Full transcript + AI summary |

### Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/offers` | List offers |
| POST | `/offers` | Send offer |

### Talent Pool (Enterprise)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/candidates` | Search candidates |

---

## Security Best Practices

1. **Never expose API key in frontend** - Always call BPOC API from your server
2. **Store clientId mapping** - Keep BPOC clientId in your database
3. **Validate users** - Ensure logged-in user owns the client before API calls
4. **Handle token expiry** - Video tokens expire in 2 hours, fetch fresh via GET `/video/rooms/:id`

---

## Error Handling

| Status | Error | Solution |
|--------|-------|----------|
| 401 | Missing API key | Add `X-API-Key` header |
| 401 | Invalid API key | Use correct key from BPOC settings |
| 400 | No clients found | Call `/clients/get-or-create` first |
| 400 | Invalid clientId | Use clientId from `/clients/get-or-create` |
| 404 | Resource not found | Verify ID exists and belongs to your agency |

---

## Support

- **API Documentation**: https://bpoc.io/recruiter/api
- **Dashboard**: https://bpoc.io/recruiter
- **Contact**: support@bpoc.io

---

## Changelog

- **v1.0** (Dec 2025): Initial release with full video integration





