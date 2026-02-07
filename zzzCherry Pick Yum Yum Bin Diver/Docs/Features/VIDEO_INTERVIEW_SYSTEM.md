# BPOC Video Interview System

## Overview

The BPOC Video Interview System enables recruiters to conduct seamless, in-app video interviews with candidates. It includes:

- **Real-time video calling** via Daily.co
- **Cloud recording** of all interviews
- **AI transcription** using OpenAI Whisper
- **Interview analytics** with AI-generated summaries

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  VideoCallProvider    →  Manages call state & Daily.co SDK      │
│  VideoCallButton      →  "Start Video Interview" button         │
│  VideoCall           →  Full-screen video call UI               │
│  IncomingCallNotification → Candidate call notification         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
├─────────────────────────────────────────────────────────────────┤
│  /api/video/rooms        →  Create/list video rooms             │
│  /api/video/rooms/[id]   →  Get/update/delete room              │
│  /api/video/rooms/[id]/join → Join existing room                │
│  /api/video/recordings   →  Start/stop/list recordings          │
│  /api/video/transcribe   →  Whisper transcription               │
│  /api/video/invitations  →  Manage call invitations             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  Daily.co              →  Video infrastructure                  │
│  OpenAI Whisper        →  Speech-to-text transcription          │
│  OpenAI GPT            →  Summary generation                    │
│  Supabase              →  Database & auth                       │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

1. **video_call_rooms** - Stores Daily.co room instances
   - Room configuration and status
   - Host and participant tracking
   - Recording/transcription settings

2. **video_call_recordings** - Recording metadata
   - Daily.co recording IDs and URLs
   - Processing status
   - Duration and file size

3. **video_call_transcripts** - Transcription data
   - Full text transcripts
   - Time-stamped segments
   - AI-generated summaries and key points

4. **video_call_invitations** - Call invitations
   - Notification tracking
   - Accept/decline status

## Usage

### For Recruiters

1. **Starting a call:**
   ```tsx
   import { VideoCallButton } from '@/components/video';
   
   <VideoCallButton
     candidateUserId="candidate-uuid"
     candidateName="John Doe"
     candidateEmail="john@example.com"
     jobId="optional-job-uuid"
   />
   ```

2. **During the call:**
   - Toggle microphone/camera
   - Share screen
   - Start/stop recording (host only)
   - End call

3. **After the call:**
   - View recordings at `/recruiter/interviews/recordings`
   - Click "Transcribe" to generate transcription
   - View AI-generated summaries and key points

### For Candidates

1. Candidates receive an in-app notification when called
2. They can accept or decline the call
3. Accept opens the video call interface

## API Reference

### Create Video Room

```typescript
POST /api/video/rooms

Body:
{
  "participantUserId": "uuid",
  "participantName": "string",
  "participantEmail": "string (optional)",
  "jobId": "uuid (optional)",
  "applicationId": "uuid (optional)",
  "enableRecording": true,
  "enableTranscription": true
}

Response:
{
  "success": true,
  "room": {
    "id": "uuid",
    "name": "interview-xxxxx",
    "url": "https://bpoc.daily.co/interview-xxxxx",
    "hostToken": "jwt-token",
    "participantToken": "jwt-token"
  }
}
```

### Join Room

```typescript
POST /api/video/rooms/[roomId]/join

Response:
{
  "success": true,
  "room": {
    "id": "uuid",
    "name": "string",
    "url": "string",
    "token": "jwt-token",
    "isHost": boolean
  }
}
```

### Start/Stop Recording

```typescript
POST /api/video/recordings

Body:
{
  "roomId": "uuid",
  "action": "start" | "stop"
}
```

### Transcribe Recording

```typescript
POST /api/video/transcribe

Body:
{
  "roomId": "uuid"
  // OR
  "recordingId": "uuid"
}

Response:
{
  "success": true,
  "transcript": {
    "full_text": "string",
    "segments": [...],
    "summary": "AI-generated summary",
    "key_points": ["point 1", "point 2"]
  }
}
```

## Environment Variables

```env
# Daily.co API Key
DAILY_API_KEY="your-daily-api-key"

# OpenAI (for Whisper transcription)
OPENAI_API_KEY="your-openai-key"
```

## Daily.co Configuration

The system uses Daily.co with the following default settings:

- **Room expiration:** 3 hours
- **Max participants:** 10
- **Recording:** Cloud recording enabled
- **Features:** Chat, screen sharing enabled

## Security

- All API routes require authentication
- RLS policies ensure users can only access their own rooms/recordings
- Meeting tokens are short-lived (2 hours)
- Room access is validated before joining

## Migration

Run the SQL migration to create required tables:

```bash
# Apply migration via Supabase
psql $SUPABASE_DATABASE_URL < 20251217_create_video_calls_tables.sql
```

## Components

### VideoCallProvider

Wrap your app with this provider to enable video calling:

```tsx
import { VideoCallProvider } from '@/contexts/VideoCallContext';

<VideoCallProvider>
  {children}
</VideoCallProvider>
```

### useVideoCall Hook

Access video call state and actions:

```tsx
const {
  callState,           // Current call state
  pendingInvitations,  // Incoming calls
  createCall,          // Start a new call
  joinCall,            // Join existing call
  leaveCall,           // End/leave call
  toggleMute,          // Mute/unmute
  toggleCamera,        // Camera on/off
  toggleScreenShare,   // Share screen
  startRecording,      // Start recording (host only)
  stopRecording,       // Stop recording (host only)
  acceptInvitation,    // Accept incoming call
  declineInvitation,   // Decline incoming call
} = useVideoCall();
```

## Future Enhancements

- [ ] Waiting room feature
- [ ] Multiple participant support
- [ ] Live transcription
- [ ] Interview scheduling integration
- [ ] Automated interview analysis
- [ ] Recording storage on Supabase


