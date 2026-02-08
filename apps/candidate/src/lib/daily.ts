/**
 * Daily.co Video Call Integration
 * Server-side utilities for managing video rooms, recordings, and transcriptions
 */

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

interface DailyRoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: {
    exp?: number; // Expiration timestamp
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    enable_recording?: 'cloud' | 'local' | 'raw-tracks';
    enable_network_ui?: boolean;
    enable_prejoin_ui?: boolean;
    enable_knocking?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
    owner_only_broadcast?: boolean;
    eject_at_room_exp?: boolean;
    lang?: string;
  };
}

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: string;
  created_at: string;
  config: object;
}

interface DailyMeetingToken {
  token: string;
}

interface DailyRecording {
  id: string;
  room_name: string;
  start_ts: number;
  duration: number;
  status: string;
  tracks: string[];
  share_token?: string;
}

/**
 * Create a new Daily.co room for video calls
 */
export async function createDailyRoom(config?: DailyRoomConfig): Promise<DailyRoom> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  // Generate a unique room name if not provided
  const roomName = config?.name || `bpoc-interview-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Default expiration: 2 hours from now
  const defaultExp = Math.floor(Date.now() / 1000) + (2 * 60 * 60);

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: config?.privacy || 'private',
      properties: {
        exp: config?.properties?.exp || defaultExp,
        max_participants: config?.properties?.max_participants || 10,
        enable_chat: config?.properties?.enable_chat ?? true,
        enable_screenshare: config?.properties?.enable_screenshare ?? true,
        enable_recording: config?.properties?.enable_recording || 'cloud', // Enable cloud recording
        enable_network_ui: config?.properties?.enable_network_ui ?? true,
        enable_prejoin_ui: config?.properties?.enable_prejoin_ui ?? false,
        enable_knocking: config?.properties?.enable_knocking ?? false,
        start_video_off: config?.properties?.start_video_off ?? false,
        start_audio_off: config?.properties?.start_audio_off ?? false,
        eject_at_room_exp: config?.properties?.eject_at_room_exp ?? true,
        lang: config?.properties?.lang || 'en',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Daily.co room creation error:', error);
    throw new Error(error.info || 'Failed to create Daily.co room');
  }

  return response.json();
}

/**
 * Get room details
 */
export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.info || 'Failed to get Daily.co room');
  }

  return response.json();
}

/**
 * Delete a Daily.co room
 */
export async function deleteDailyRoom(roomName: string): Promise<boolean> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  });

  return response.ok;
}

/**
 * Create a meeting token for a participant
 */
export async function createMeetingToken(options: {
  roomName: string;
  userId?: string;
  userName?: string;
  isOwner?: boolean;
  expiresIn?: number; // seconds
  enableRecording?: boolean;
  enableScreenShare?: boolean;
}): Promise<string> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  // Token expires in 2 hours by default
  const exp = Math.floor(Date.now() / 1000) + (options.expiresIn || 2 * 60 * 60);

  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: options.roomName,
        user_id: options.userId,
        user_name: options.userName,
        is_owner: options.isOwner ?? false,
        exp,
        // enable_recording_ui controls if user sees recording button (for Daily Prebuilt)
        enable_recording_ui: options.enableRecording ?? true,
        enable_screenshare: options.enableScreenShare ?? true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Daily.co token creation error:', error);
    throw new Error(error.info || 'Failed to create meeting token');
  }

  const data: DailyMeetingToken = await response.json();
  return data.token;
}

/**
 * Start cloud recording for a room
 */
export async function startRecording(roomName: string): Promise<{ id: string }> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}/recordings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      // Recording configuration
      layout: {
        preset: 'active-participant', // or 'default', 'portrait', 'single-participant'
      },
      // Output configuration
      output_format: {
        type: 'mp4',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Daily.co recording start error:', error);
    throw new Error(error.info || 'Failed to start recording');
  }

  return response.json();
}

/**
 * Stop cloud recording for a room
 */
export async function stopRecording(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}/recordings`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Daily.co recording stop error:', error);
    throw new Error(error.info || 'Failed to stop recording');
  }
}

/**
 * Get recording access link
 */
export async function getRecordingAccessLink(recordingId: string): Promise<{ download_link: string; expires: number }> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}/access-link`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.info || 'Failed to get recording access link');
  }

  return response.json();
}

/**
 * List recordings for a room
 */
export async function listRecordings(roomName: string): Promise<DailyRecording[]> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/recordings?room_name=${roomName}`, {
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.info || 'Failed to list recordings');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get current participants in a room
 */
export async function getRoomPresence(roomName: string): Promise<{ total_count: number; data: any[] }> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}/presence`, {
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.info || 'Failed to get room presence');
  }

  return response.json();
}

/**
 * Utility: Generate a unique room name
 * Creates human-readable names like: prescreen-john-dec19-a3x2
 */
export function generateRoomName(prefix: string = 'bpoc'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// Short call type labels for room names
const CALL_TYPE_SHORT: Record<string, string> = {
  // RECRUITER-LED
  recruiter_prescreen: 'prescreen',
  recruiter_round_1: 'r1',
  recruiter_round_2: 'r2',
  recruiter_round_3: 'r3',
  recruiter_offer: 'offer',
  recruiter_general: 'call',
  // CLIENT-LED
  client_round_1: 'cr1',
  client_round_2: 'cr2',
  client_final: 'cfinal',
  client_general: 'ccall',
  // Legacy
  prescreen: 'prescreen',
  round_1: 'r1',
  round_2: 'r2',
  round_3: 'r3',
  final_interview: 'final',
  offer_call: 'offer',
  general: 'call',
};

/**
 * Utility: Generate a meaningful room name for video calls
 * Format: {callType}-{participantFirstName}-{date}-{short-id}
 * Example: prescreen-john-dec19-x7k2, cr1-sarah-dec20-a2b3
 */
export function generateMeaningfulRoomName(options: {
  callType?: string;
  participantName?: string;
  hostName?: string;
}): string {
  const { callType = 'call', participantName, hostName } = options;
  
  // Get date part (e.g., "dec19")
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const day = now.getDate();
  const datePart = `${month}${day}`;
  
  // Get first name from participant or host, cleaned up
  let namePart = 'guest';
  const nameSource = participantName || hostName;
  if (nameSource) {
    // Get first word/name, remove special chars, lowercase, max 10 chars
    namePart = nameSource
      .split(' ')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 10) || 'guest';
  }
  
  // Get short call type label
  const typePart = CALL_TYPE_SHORT[callType] || callType.replace(/_/g, '').toLowerCase().substring(0, 12);
  
  // Short random ID for uniqueness
  const randomPart = Math.random().toString(36).substring(2, 6);
  
  // Combine: prescreen-john-dec19-x7k2 or cr1-sarah-dec20-a2b3
  return `${typePart}-${namePart}-${datePart}-${randomPart}`;
}

/**
 * Utility: Calculate room expiration (default 2 hours from now)
 */
export function calculateRoomExpiration(hoursFromNow: number = 2): number {
  return Math.floor(Date.now() / 1000) + (hoursFromNow * 60 * 60);
}

