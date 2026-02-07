'use client';

/**
 * VideoCallContext
 * Manages video call state across the application
 * Handles Daily.co call lifecycle, recording, and notifications
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import DailyIframe, { DailyCall, DailyEventObjectParticipant } from '@daily-co/daily-js';
import { useAuth } from './AuthContext';
import { toast } from '@/components/shared/ui/toast';
import { createClient } from '@/lib/supabase/client';

// Optional local telemetry used during debugging.
// If you don't run a local collector on 127.0.0.1:7242, this will spam ERR_CONNECTION_REFUSED in Network.
// Enable only when you explicitly want it.
const ENABLE_LOCAL_INGEST = process.env.NEXT_PUBLIC_ENABLE_LOCAL_INGEST === 'true';
const LOCAL_INGEST_URL = 'http://127.0.0.1:7242/ingest/1e7444aa-54d9-4acf-b22e-cd14cee2d6fd';

function fireAndForgetIngest(payload: Record<string, any>) {
  if (!ENABLE_LOCAL_INGEST) return;
  if (typeof window === 'undefined') return;

  // Never let telemetry affect app behavior
  fetch(LOCAL_INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Helper to get fresh access token from Supabase
// Uses the SSR-compatible client that shares auth state via cookies
async function getFreshAccessToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ [VideoCall] Failed to get session:', error);
      return null;
    }
    if (!session?.access_token) {
      console.warn('⚠️ [VideoCall] No access token in session');
      return null;
    }
    console.log('✅ [VideoCall] Got fresh access token, length:', session.access_token.length);
    return session.access_token;
  } catch (e) {
    console.error('❌ [VideoCall] Error getting session:', e);
    return null;
  }
}

interface Participant {
  id: string;
  userId?: string;
  userName?: string;
  audioOn: boolean;
  videoOn: boolean;
  isLocal: boolean;
  isOwner: boolean;
}

interface VideoCallState {
  roomId: string | null;
  roomName: string | null;
  roomUrl: string | null;
  hostToken: string | null;
  participantToken: string | null;
  status: 'idle' | 'connecting' | 'joined' | 'error';
  isHost: boolean;
  isRecording: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  participants: Participant[];
  error: string | null;
}

interface PendingInvitation {
  id: string;
  roomId: string;
  hostName: string;
  hostAvatar?: string;
  joinUrl: string;
  createdAt: string;
}

interface VideoCallContextType {
  // State
  callState: VideoCallState;
  pendingInvitations: PendingInvitation[];
  callUi: {
    isOpen: boolean;
    meta: {
      // Used only for display in the single global modal
      hostName?: string;
      hostAvatar?: string;
      participantName?: string;
      participantAvatar?: string;
      jobTitle?: string;
      roomName?: string;
      callType?: CreateCallOptions['callType'];
      participantUserId?: string;
    };
  };
  
  // Actions
  createCall: (participantUserId: string, participantName?: string, options?: CreateCallOptions) => Promise<string | null>;
  joinCall: (roomId: string) => Promise<boolean>;
  leaveCall: () => Promise<void>;
  openCallUi: (meta?: VideoCallContextType['callUi']['meta']) => void;
  closeCallUi: () => void;
  
  // Controls
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Invitations
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string, reason?: string) => Promise<void>;
  refreshInvitations: () => Promise<void>;
  
  // Utils
  callObject: DailyCall | null;
}

interface CreateCallOptions {
  jobId?: string;
  applicationId?: string;
  interviewId?: string;
  enableRecording?: boolean;
  enableTranscription?: boolean;
  // Call type for recruitment workflow - RECRUITER & CLIENT types
  callType?: 
    | 'recruiter_prescreen' | 'recruiter_round_1' | 'recruiter_round_2' | 'recruiter_round_3' | 'recruiter_offer' | 'recruiter_general'
    | 'client_round_1' | 'client_round_2' | 'client_final' | 'client_general';
  callMode?: 'video' | 'phone' | 'audio_only';
  title?: string;
  // UI metadata so we can show the same modal everywhere
  participantAvatar?: string;
  hostName?: string;
  hostAvatar?: string;
  jobTitle?: string;
  roomName?: string;
}

const initialState: VideoCallState = {
  roomId: null,
  roomName: null,
  roomUrl: null,
  hostToken: null,
  participantToken: null,
  status: 'idle',
  isHost: false,
  isRecording: false,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  participants: [],
  error: null,
};

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<VideoCallState>(initialState);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [callUi, setCallUi] = useState<VideoCallContextType['callUi']>({ isOpen: false, meta: {} });
  const callObjectRef = useRef<DailyCall | null>(null);
  const invitationPollRef = useRef<NodeJS.Timeout | null>(null);

  const openCallUi = useCallback((meta?: VideoCallContextType['callUi']['meta']) => {
    setCallUi(prev => ({ isOpen: true, meta: { ...prev.meta, ...(meta || {}) } }));
  }, []);

  const closeCallUi = useCallback(() => {
    setCallUi({ isOpen: false, meta: {} });
  }, []);

  // Poll for invitations when user is logged in
  const refreshInvitations = useCallback(async () => {
    if (!user?.id) return;

    try {
      fireAndForgetIngest({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
        location: 'src/contexts/VideoCallContext.tsx:refreshInvitations:pre',
        message: 'Refreshing invitations (pre-fetch)',
        data: { hasUserId: !!user?.id },
        timestamp: Date.now(),
      });
      const freshToken = await getFreshAccessToken();
      const headers: Record<string, string> = {};
      if (freshToken) headers['Authorization'] = `Bearer ${freshToken}`;

      const response = await fetch('/api/video/invitations', {
        headers,
        credentials: 'include',
      });
      fireAndForgetIngest({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
        location: 'src/contexts/VideoCallContext.tsx:refreshInvitations:post',
        message: 'Refreshing invitations (post-fetch)',
        data: { status: response.status, ok: response.ok },
        timestamp: Date.now(),
      });
      if (response.ok) {
        const data = await response.json();
        const newInvitations = data.invitations || [];
        
        // Show toast for new invitations
        if (newInvitations.length > pendingInvitations.length) {
          const newest = newInvitations[0];
          if (newest) {
            toast.info(`📞 Incoming call from ${newest.host?.name || 'Recruiter'}`);
          }
        }
        
        setPendingInvitations(newInvitations.map((inv: any) => ({
          id: inv.id,
          roomId: inv.video_call_rooms?.id,
          hostName: inv.host?.name || 'Recruiter',
          hostAvatar: inv.host?.avatar,
          joinUrl: inv.join_url,
          createdAt: inv.created_at,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  }, [user, pendingInvitations.length]);

  // Start polling for invitations
  useEffect(() => {
    if (user) {
      refreshInvitations();
      invitationPollRef.current = setInterval(refreshInvitations, 10000); // Poll every 10 seconds
    }

    return () => {
      if (invitationPollRef.current) {
        clearInterval(invitationPollRef.current);
      }
    };
  }, [user, refreshInvitations]);

  // Handle Daily.co events
  const handleParticipantJoined = useCallback((event: DailyEventObjectParticipant) => {
    const participant = event.participant;
    setCallState(prev => ({
      ...prev,
      participants: [
        ...prev.participants.filter(p => p.id !== participant.session_id),
        {
          id: participant.session_id,
          userId: participant.user_id,
          userName: participant.user_name,
          audioOn: !participant.audio,
          videoOn: !participant.video,
          isLocal: participant.local,
          isOwner: participant.owner,
        },
      ],
    }));
  }, []);

  const handleParticipantLeft = useCallback((event: DailyEventObjectParticipant) => {
    setCallState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== event.participant.session_id),
    }));
  }, []);

  const handleParticipantUpdated = useCallback((event: DailyEventObjectParticipant) => {
    const participant = event.participant;
    setCallState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === participant.session_id
          ? {
              ...p,
              audioOn: !participant.audio,
              videoOn: !participant.video,
            }
          : p
      ),
    }));
  }, []);

  // Create a new call
  const createCall = useCallback(async (
    participantUserId: string,
    participantName?: string,
    options?: CreateCallOptions
  ): Promise<string | null> => {
    try {
      setCallState(prev => ({ ...prev, status: 'connecting', error: null }));
      // Open the single global call UI immediately; it will show a connecting state
      openCallUi({
        participantName: participantName || 'Candidate',
        participantAvatar: options?.participantAvatar,
        hostName: (user as any)?.user_metadata?.full_name || (user as any)?.email || 'You',
        jobTitle: options?.jobTitle,
        roomName: options?.roomName,
        callType: options?.callType,
        // Needed for Tools sidebar actions
        participantUserId,
      });

      // Get fresh access token directly from Supabase (more reliable than context state)
      const freshToken = await getFreshAccessToken();
      
      fireAndForgetIngest({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
        location: 'src/contexts/VideoCallContext.tsx:createCall:pre',
        message: 'Create call (pre-fetch)',
        data: {
          hasUserId: !!user?.id,
          hasFreshToken: !!freshToken,
          freshTokenLen: freshToken?.length || 0,
          participantIdLen: participantUserId?.length || 0,
          hasParticipantName: !!participantName,
        },
        timestamp: Date.now(),
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (freshToken) {
        headers['Authorization'] = `Bearer ${freshToken}`;
      }

      console.log('📞 [VideoCall] Creating call with auth:', { 
        hasToken: !!freshToken, 
        tokenLen: freshToken?.length || 0 
      });

      const response = await fetch('/api/video/rooms', {
        method: 'POST',
        headers,
        credentials: 'include', // Send cookies for auth fallback
        body: JSON.stringify({
          participantUserId,
          participantName,
          ...options,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to create call';
        try {
        const error = await response.json();
          errMsg = error?.error || error?.message || errMsg;
        } catch {
          try {
            const t = await response.text();
            errMsg = t || errMsg;
          } catch {}
        }
        fireAndForgetIngest({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
          location: 'src/contexts/VideoCallContext.tsx:createCall:error',
          message: 'Create call non-OK response',
          data: {
            status: response.status,
            errMsg: typeof errMsg === 'string' ? errMsg.slice(0, 160) : 'non-string',
          },
          timestamp: Date.now(),
        });
        throw new Error(errMsg);
      }

      const data = await response.json();
      const { room } = data;

      console.log('✅ [VideoCall] Room created:', { 
        id: room.id, 
        name: room.name, 
        url: room.url 
      });

      // Store room info - DailyCallFrame will handle joining
      setCallState(prev => ({
        ...prev,
        roomId: room.id,
        roomName: room.name,
        roomUrl: room.url,
        hostToken: room.hostToken,
        participantToken: room.participantToken,
        status: 'joined',
        isHost: true,
      }));

      toast.success('Call started! Waiting for participant...');
      return room.id;

    } catch (error) {
      console.error('Failed to create call:', error);
      fireAndForgetIngest({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
        location: 'src/contexts/VideoCallContext.tsx:createCall:catch',
        message: 'Create call threw',
        data: {
          errType: error instanceof Error ? 'Error' : typeof error,
          errMsg: error instanceof Error ? String(error.message).slice(0, 160) : 'unknown',
        },
        timestamp: Date.now(),
      });
      setCallState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create call',
      }));
      closeCallUi();
      toast.error('Failed to start call');
      return null;
    }
  }, [user?.id, openCallUi, closeCallUi]);

  // Join an existing call (for participants accepting invitations)
  const joinCall = useCallback(async (roomId: string): Promise<boolean> => {
    try {
      setCallState(prev => ({ ...prev, status: 'connecting', error: null }));
      openCallUi();

      // Get fresh token
      const freshToken = await getFreshAccessToken();

      const response = await fetch(`/api/video/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${freshToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join call');
      }

      const data = await response.json();
      const { room } = data;

      console.log('✅ [VideoCall] Joining room:', { 
        id: room.id, 
        name: room.name, 
        url: room.url 
      });

      // Store room info - DailyCallFrame will handle joining
      setCallState(prev => ({
        ...prev,
        roomId: room.id,
        roomName: room.name,
        roomUrl: room.url,
        hostToken: room.token, // The token for this participant
        participantToken: null,
        status: 'joined',
        isHost: room.isHost || false,
      }));

      toast.success('Joined the call!');
      return true;

    } catch (error) {
      console.error('Failed to join call:', error);
      setCallState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to join call',
      }));
      closeCallUi();
      toast.error('Failed to join call');
      return false;
    }
  }, [openCallUi, closeCallUi]);

  // Leave the call
  const leaveCall = useCallback(async () => {
    try {
      // If host, end the room on the server
      if (callState.isHost && callState.roomId) {
        const freshToken = await getFreshAccessToken();
        await fetch(`/api/video/rooms/${callState.roomId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${freshToken}`,
          },
          credentials: 'include',
        });
      }

      setCallState(initialState);
      closeCallUi();
      toast.info('Call ended');

    } catch (error) {
      console.error('Failed to leave call:', error);
      // Still reset state even if API call fails
      setCallState(initialState);
      closeCallUi();
    }
  }, [callState.isHost, callState.roomId, closeCallUi]);

  // Note: With Daily's prebuilt UI, these controls are handled directly by Daily
  // These are kept for API compatibility but the prebuilt UI handles the actual toggling
  const toggleMute = useCallback(() => {
    // Handled by Daily's prebuilt UI
    console.log('ℹ️ toggleMute - handled by Daily prebuilt UI');
  }, []);

  const toggleCamera = useCallback(() => {
    // Handled by Daily's prebuilt UI
    console.log('ℹ️ toggleCamera - handled by Daily prebuilt UI');
  }, []);

  const toggleScreenShare = useCallback(async () => {
    // Handled by Daily's prebuilt UI
    console.log('ℹ️ toggleScreenShare - handled by Daily prebuilt UI');
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!callState.roomId || !callState.isHost) return;

    try {
      const freshToken = await getFreshAccessToken();
      await fetch('/api/video/recordings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(freshToken ? { 'Authorization': `Bearer ${freshToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: callState.roomId,
          action: 'start',
        }),
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  }, [callState.roomId, callState.isHost]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!callState.roomId || !callState.isHost) return;

    try {
      const freshToken = await getFreshAccessToken();
      await fetch('/api/video/recordings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(freshToken ? { 'Authorization': `Bearer ${freshToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: callState.roomId,
          action: 'stop',
        }),
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('Failed to stop recording');
    }
  }, [callState.roomId, callState.isHost]);

  // Accept invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    try {
      // Capture invitation meta for the single global UI
      const invMeta = pendingInvitations.find(inv => inv.id === invitationId);
      if (invMeta) {
        openCallUi({
          hostName: invMeta.hostName,
          hostAvatar: invMeta.hostAvatar,
          participantName: 'You',
        });
      } else {
        openCallUi();
      }

      const freshToken = await getFreshAccessToken();
      const response = await fetch('/api/video/invitations', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(freshToken ? { 'Authorization': `Bearer ${freshToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          invitationId,
          response: 'accept',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      const data = await response.json();
      
      // Remove from pending
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Join the call
      await joinCall(data.roomId);

    } catch (error) {
      console.error('Failed to accept invitation:', error);
      closeCallUi();
      toast.error('Failed to join call');
    }
  }, [joinCall, pendingInvitations, openCallUi, closeCallUi]);

  // Decline invitation
  const declineInvitation = useCallback(async (invitationId: string, reason?: string) => {
    try {
      const freshToken = await getFreshAccessToken();
      await fetch('/api/video/invitations', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(freshToken ? { 'Authorization': `Bearer ${freshToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          invitationId,
          response: 'decline',
          declineReason: reason,
        }),
      });

      // Remove from pending
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast.info('Call declined');

    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup handled by DailyCallFrame component
    };
  }, []);

  const value: VideoCallContextType = {
    callState,
    pendingInvitations,
    callUi,
    createCall,
    joinCall,
    leaveCall,
    openCallUi,
    closeCallUi,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    startRecording,
    stopRecording,
    acceptInvitation,
    declineInvitation,
    refreshInvitations,
    callObject: null, // Managed by DailyCallFrame component
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
}

