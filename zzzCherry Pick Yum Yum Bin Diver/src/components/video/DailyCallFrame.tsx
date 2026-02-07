'use client';

/**
 * DailyCallFrame Component
 * Embeds Daily.co's prebuilt video call UI with BPOC theming
 * Handles singleton pattern to prevent duplicate instances
 */

import React, { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

interface DailyCallFrameProps {
  roomUrl: string;
  token: string;
  userName?: string;
  // Feature toggles
  enableChat?: boolean;
  enableScreenShare?: boolean;
  enableRecording?: boolean;
  enableNetworkInfo?: boolean;
  enablePeoplePanel?: boolean;
  // Callbacks
  onCallJoined?: () => void;
  onCallEnded?: () => void;
  onError?: (error: string) => void;
  onParticipantJoined?: () => void;
  onParticipantLeft?: () => void;
  onRecordingStarted?: () => void;
  onRecordingStopped?: () => void;
}

// Global ref to track the single Daily instance
let globalDailyInstance: DailyCall | null = null;

// Cleanup function to destroy existing instance
function cleanupDailyInstance() {
  if (globalDailyInstance) {
    try {
      globalDailyInstance.leave();
      globalDailyInstance.destroy();
    } catch (e) {
      console.log('[Daily] Cleanup error (safe to ignore):', e);
    }
    globalDailyInstance = null;
  }
}

// Export for external access (e.g., to trigger recording from parent)
export function getDailyInstance(): DailyCall | null {
  return globalDailyInstance;
}

export default function DailyCallFrame({
  roomUrl,
  token,
  userName,
  // Feature defaults - all enabled
  enableChat = true,
  enableScreenShare = true,
  enableRecording = true,
  enableNetworkInfo = true,
  enablePeoplePanel = true,
  // Callbacks
  onCallJoined,
  onCallEnded,
  onError,
  onParticipantJoined,
  onParticipantLeft,
  onRecordingStarted,
  onRecordingStopped,
}: DailyCallFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef({
    onCallJoined,
    onCallEnded,
    onError,
    onParticipantJoined,
    onParticipantLeft,
    onRecordingStarted,
    onRecordingStopped,
  });
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onCallJoined,
      onCallEnded,
      onError,
      onParticipantJoined,
      onParticipantLeft,
      onRecordingStarted,
      onRecordingStopped,
    };
  }, [onCallJoined, onCallEnded, onError, onParticipantJoined, onParticipantLeft, onRecordingStarted, onRecordingStopped]);

  const handleClose = () => {
    cleanupDailyInstance();
    callbacksRef.current.onCallEnded?.();
  };

  useEffect(() => {
    // Prevent double initialization (React StrictMode)
    if (initedRef.current) return;
    if (!containerRef.current || !roomUrl || !token) return;

    initedRef.current = true;

    const initCall = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cleanup any existing instance first
        cleanupDailyInstance();

        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if container still exists
        if (!containerRef.current) {
          console.log('[Daily] Container no longer exists, aborting init');
          return;
        }

        console.log('🎥 [Daily] Creating call frame with BPOC theme...');

        // BPOC Custom Theme for Daily.co
        // Using our brand colors: orange (#f97316) and dark bg (#0a0a0f)
        const bpocTheme = {
          colors: {
            // Primary accent color (orange)
            accent: '#f97316',
            accentText: '#ffffff',
            // Background colors (dark theme)
            background: '#0a0a0f',
            backgroundAccent: '#111118',
            // Base colors for UI elements
            baseText: '#ffffff',
            border: '#374151',
            // Main area colors
            mainAreaBg: '#0a0a0f',
            mainAreaBgAccent: '#111118',
            mainAreaText: '#ffffff',
            // Support colors
            supportiveText: '#9ca3af',
          },
        };

        // Create the call frame with Daily's prebuilt UI and BPOC theme
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px',
          },
          // Theme configuration
          theme: bpocTheme,
          // Show/hide UI elements
          showLeaveButton: true,
          showFullscreenButton: true,
          showParticipantsBar: enablePeoplePanel,
          showLocalVideo: true,
          showActiveSpeakerInSidebar: true,
          // Feature toggles
          activeSpeakerMode: true,
          // Custom layout options
          layoutConfig: {
            grid: {
              maxTilesPerPage: 9,
            },
          },
        });

        globalDailyInstance = callFrame;

        // Set up event listeners
        callFrame.on('joined-meeting', () => {
          console.log('✅ [Daily] Joined meeting');
          setIsLoading(false);
          callbacksRef.current.onCallJoined?.();
        });

        callFrame.on('left-meeting', () => {
          console.log('📞 [Daily] Left meeting');
          cleanupDailyInstance();
          callbacksRef.current.onCallEnded?.();
        });

        callFrame.on('participant-joined', (event) => {
          console.log('👤 [Daily] Participant joined:', event?.participant?.user_name);
          callbacksRef.current.onParticipantJoined?.();
        });

        callFrame.on('participant-left', (event) => {
          console.log('👋 [Daily] Participant left:', event?.participant?.user_name);
          callbacksRef.current.onParticipantLeft?.();
        });

        callFrame.on('error', (event) => {
          console.error('❌ [Daily] Error:', JSON.stringify(event, null, 2));
          
          // Parse Daily.co error - can be in different formats
          let errorMsg = 'An error occurred';
          
          if (event?.errorMsg) {
            errorMsg = event.errorMsg;
          } else if (event?.error?.message) {
            errorMsg = event.error.message;
          } else if (event?.error) {
            errorMsg = typeof event.error === 'string' ? event.error : JSON.stringify(event.error);
          } else if (event?.msg) {
            errorMsg = event.msg;
          }
          
          // Handle specific error cases with user-friendly messages
          const lowerError = errorMsg.toLowerCase();
          if (lowerError.includes('meeting has ended') || 
              lowerError.includes('room has ended') || 
              lowerError.includes('exp') ||
              lowerError.includes('expired')) {
            errorMsg = 'This meeting has ended or expired. Please schedule a new call.';
          } else if (lowerError.includes('not found') || lowerError.includes('404')) {
            errorMsg = 'Meeting room not found. The room may have been deleted or the link is invalid.';
          } else if (lowerError.includes('unauthorized') || lowerError.includes('401') || lowerError.includes('token')) {
            errorMsg = 'Access denied. Your meeting link may have expired. Please request a new invite.';
          } else if (lowerError.includes('network') || lowerError.includes('connection')) {
            errorMsg = 'Network connection issue. Please check your internet and try again.';
          } else if (errorMsg === 'An error occurred' || errorMsg === '{}') {
            // Handle empty error object
            errorMsg = 'Unable to join the call. The meeting may have ended or the link is invalid.';
          }
          
          setError(errorMsg);
          setIsLoading(false);
          callbacksRef.current.onError?.(errorMsg);
        });

        // Recording events
        callFrame.on('recording-started', () => {
          console.log('🔴 [Daily] Recording started');
          callbacksRef.current.onRecordingStarted?.();
        });

        callFrame.on('recording-stopped', () => {
          console.log('⏹️ [Daily] Recording stopped');
          callbacksRef.current.onRecordingStopped?.();
        });

        // Handle when meeting is ended by host or room is deleted
        callFrame.on('meeting-session-state-updated' as any, (event: any) => {
          console.log('📋 [Daily] Meeting state updated:', event);
          if (event?.meetingSessionState?.topology === 'none') {
            console.log('🔚 [Daily] Meeting ended by host');
            cleanupDailyInstance();
            callbacksRef.current.onCallEnded?.();
          }
        });

        // Handle when call is ejected/kicked
        callFrame.on('nonfatal-error' as any, (event: any) => {
          console.log('⚠️ [Daily] Non-fatal error:', event);
          if (event?.type === 'ejected' || event?.errorMsg?.includes('ended')) {
            console.log('🔚 [Daily] Ejected from meeting');
            cleanupDailyInstance();
            callbacksRef.current.onCallEnded?.();
          }
        });

        // Join the call
        console.log('🎥 [Daily] Joining call...');
        // Some endpoints provide tokenized URLs (e.g. https://.../room?t=TOKEN).
        // Daily join works best with a clean base URL + token passed separately.
        let joinUrl = roomUrl;
        try {
          const u = new URL(roomUrl);
          u.searchParams.delete('t');
          // Keep only origin + pathname (avoid any other query params leaking into room lookup)
          joinUrl = `${u.origin}${u.pathname}`;
        } catch {
          joinUrl = roomUrl;
        }
        await callFrame.join({
          url: joinUrl,
          token: token,
          userName: userName || 'Participant',
        });

        console.log('✅ [Daily] Join complete');

      } catch (err) {
        console.error('❌ [Daily] Failed to initialize:', err);
        let errorMsg = 'Failed to start video call';
        
        if (err instanceof Error) {
          const lowerError = err.message.toLowerCase();
          if (lowerError.includes('meeting has ended') || 
              lowerError.includes('room has ended') ||
              lowerError.includes('expired')) {
            errorMsg = 'This meeting has ended or expired. Please schedule a new call.';
          } else if (lowerError.includes('not found')) {
            errorMsg = 'Meeting room not found. The room may have been deleted.';
          } else if (lowerError.includes('unauthorized') || lowerError.includes('token')) {
            errorMsg = 'Access denied. Your meeting link may have expired.';
          } else {
            errorMsg = err.message;
          }
        }
        
        setError(errorMsg);
        callbacksRef.current.onError?.(errorMsg);
        setIsLoading(false);
      }
    };

    initCall();

    // Cleanup on unmount
    return () => {
      console.log('🧹 [Daily] Component unmounting, cleaning up...');
      initedRef.current = false;
      cleanupDailyInstance();
    };
  }, [roomUrl, token, userName]);

  // Error state
  if (error) {
    // Determine if this is an "ended" error vs other error
    const isEndedError = error.toLowerCase().includes('ended') || 
                         error.toLowerCase().includes('expired') ||
                         error.toLowerCase().includes('not found');
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f] rounded-xl">
        <div className="text-center p-8 max-w-md">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isEndedError ? 'bg-orange-500/20' : 'bg-red-500/20'
          }`}>
            <AlertCircle className={`w-8 h-8 ${isEndedError ? 'text-orange-400' : 'text-red-400'}`} />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">
            {isEndedError ? 'Meeting Unavailable' : 'Call Error'}
          </h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleClose}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Close
            </Button>
            {isEndedError && (
              <Button 
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Refresh Page
              </Button>
            )}
          </div>
          {isEndedError && (
            <p className="text-gray-500 text-sm mt-4">
              If you need to rejoin, ask the host to send a new meeting link.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // IMPORTANT: Do NOT block pointer events; Daily's prejoin/permission UI lives inside the iframe.
          // If this overlay captures clicks, users can never allow camera/mic or press Join.
          // Also keep this overlay visually light so the Daily UI beneath is visible/clickable.
          className="absolute inset-0 bg-[#0a0a0f]/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 pointer-events-none"
        >
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Connecting to call...</p>
            <p className="text-gray-400 text-sm mt-2">
              If prompted, allow camera/microphone and click Join in the Daily window.
            </p>
          </div>
        </motion.div>
      )}

      {/* Daily.co iframe container */}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-xl overflow-hidden bg-[#0a0a0f]"
      />
    </div>
  );
}
