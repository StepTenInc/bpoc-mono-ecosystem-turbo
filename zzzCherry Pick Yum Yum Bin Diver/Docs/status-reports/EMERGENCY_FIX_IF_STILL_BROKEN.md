# Emergency Fix - If Endpoint Still Returns 500

## Quick Rollback Plan

If the validation framework is still causing issues, here's a simple inline fix:

### Replace the validation imports with inline code:

```typescript
// REMOVE THIS:
import {
    corsHeaders,
    validationError,
    notFoundError,
    serverError,
    successResponse,
    validateUUIDField,
    validateURLField,
    validateRequiredFields,
} from '../../validation';

// ADD THIS INLINE:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
```

### Then update the validation code:

```typescript
// Validate required fields
if (!roomId || !candidateId || !participantJoinUrl) {
    console.error('[Notification API] Missing required fields');
    return NextResponse.json(
        { error: 'Missing required fields: roomId, candidateId, participantJoinUrl' },
        { status: 400, headers: corsHeaders }
    );
}

// Validate UUID formats
if (!isValidUUID(candidateId)) {
    console.error('[Notification API] Invalid candidateId format:', candidateId);
    return NextResponse.json(
        { error: 'Invalid candidateId format. Expected UUID (e.g., 092fd214-03c5-435d-9156-4a533d950cc3)' },
        { status: 400, headers: corsHeaders }
    );
}

if (!isValidUUID(roomId)) {
    console.error('[Notification API] Invalid roomId format:', roomId);
    return NextResponse.json(
        { error: 'Invalid roomId format. Expected UUID' },
        { status: 400, headers: corsHeaders }
    );
}

// Validate URL format
if (!isValidURL(participantJoinUrl)) {
    console.error('[Notification API] Invalid URL format:', participantJoinUrl);
    return NextResponse.json(
        { error: 'Invalid participantJoinUrl format. Expected valid URL' },
        { status: 400, headers: corsHeaders }
    );
}
```

### And update error responses:

```typescript
// Candidate not found
if (!candidate) {
    console.error('[Notification API] Candidate not found:', candidateId);
    return NextResponse.json(
        { error: 'Candidate not found', id: candidateId },
        { status: 404, headers: corsHeaders }
    );
}

// Success response
return NextResponse.json({
    success: true,
    invitation: {
        id: invitation.id,
        status: invitation.status,
        notificationSent: invitation.notification_sent,
    },
    message: 'Candidate notified successfully',
}, { headers: corsHeaders });

// Error catch
} catch (error) {
    console.error('[Notification API] Error:', error);
    return NextResponse.json(
        { error: 'Failed to notify candidate' },
        { status: 500, headers: corsHeaders }
    );
}
```

This removes the dependency on the validation module and should work immediately.
