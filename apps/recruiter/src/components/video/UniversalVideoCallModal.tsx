'use client';

/**
 * UniversalVideoCallModal
 * 
 * THE PERFECT REUSABLE DAILY.CO VIDEO CALL MODAL
 * 
 * Works for:
 * - ✅ API clients joining via joinUrl
 * - ✅ Recruiters in BPOC platform
 * - ✅ External platforms using API
 * - ✅ Standalone (no context needed)
 * - ✅ Multi-participant support
 * 
 * Only props that change:
 * - callType: Type of call (recruiter_prescreen, client_round_1, etc.)
 * - participants: Array of participant info
 * - joinUrl: Direct Daily.co join URL (for API clients)
 * - roomId + token: For internal BPOC use
 * 
 * Features:
 * - ✅ All Daily.co functions (chat, screen share, recording, etc.)
 * - ✅ Recording status tracking
 * - ✅ Call duration
 * - ✅ Participant management
 * - ✅ Error handling & recovery
 * - ✅ Mobile responsive
 * - ✅ Fullscreen support
 * - ✅ BPOC branding
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Clock,
  Maximize2,
  Minimize2,
  Circle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Share2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  User,
  Briefcase,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import DailyCallFrame from './DailyCallFrame';

// ============================================
// TYPES & INTERFACES
// ============================================

export type CallType =
  | 'recruiter_prescreen' | 'recruiter_round_1' | 'recruiter_round_2' | 'recruiter_round_3' | 'recruiter_offer' | 'recruiter_general'
  | 'client_round_1' | 'client_round_2' | 'client_final' | 'client_general';

export type CallMode = 'video' | 'phone' | 'audio_only';

export type CallOutcome = 'successful' | 'no_show' | 'rescheduled' | 'cancelled' | 'needs_followup';

export interface Participant {
  id?: string;
  userId?: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'host' | 'participant' | 'candidate' | 'client' | 'recruiter';
  isLocal?: boolean;
}

export interface CallMetadata {
  callType?: CallType;
  callMode?: CallMode;
  title?: string;
  description?: string;
  jobTitle?: string;
  jobId?: string;
  applicationId?: string;
  interviewId?: string;
  scheduledFor?: string;
  timezone?: string;
}

export interface UniversalVideoCallModalProps {
  // REQUIRED: Either joinUrl OR (roomId + token)
  joinUrl?: string;              // Direct Daily.co join URL (for API clients)
  roomId?: string;               // BPOC room ID (for internal use)
  token?: string;                 // Daily.co meeting token (for internal use)
  
  // PARTICIPANTS (only thing that changes)
  participants: Participant[];   // All participants in the call
  currentUser: Participant;       // Current user (the one viewing this modal)
  
  // CALL METADATA (only thing that changes)
  metadata?: CallMetadata;
  
  // UI STATE
  isOpen: boolean;
  onClose: () => void;
  
  // CALLBACKS (optional)
  onCallJoined?: () => void;
  onCallEnded?: () => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participant: Participant) => void;
  onRecordingStarted?: () => void;
  onRecordingStopped?: () => void;
  onError?: (error: string) => void;
  
  // FEATURES (all Daily.co functions)
  enableChat?: boolean;
  enableScreenShare?: boolean;
  enableRecording?: boolean;
  enableNetworkInfo?: boolean;
  enablePeoplePanel?: boolean;
  
  // BPOC TOOLS (for recruiters/hosts)
  enableBpocTools?: boolean;      // Show BPOC sidebar tools
  onSaveNotes?: (notes: string) => Promise<void>;
  onSetRating?: (rating: number) => Promise<void>;
  onSetOutcome?: (outcome: CallOutcome) => Promise<void>;
  onOpenProfile?: (userId: string) => void;
  
  // STYLING
  theme?: 'dark' | 'light';
  showBranding?: boolean;
  
  // API MODE (for external clients)
  apiMode?: boolean;              // If true, uses joinUrl directly, no BPOC API calls
}

// ============================================
// CALL TYPE LABELS
// ============================================

const CALL_TYPE_LABELS: Record<CallType, { label: string; icon: any; color: string; category: string }> = {
  // RECRUITER-LED
  recruiter_prescreen: { label: 'Pre-Screen', icon: Video, color: 'text-blue-400', category: 'Recruiter' },
  recruiter_round_1: { label: 'Round 1 Interview', icon: Users, color: 'text-emerald-400', category: 'Recruiter' },
  recruiter_round_2: { label: 'Round 2 Interview', icon: Users, color: 'text-purple-400', category: 'Recruiter' },
  recruiter_round_3: { label: 'Round 3 Interview', icon: Users, color: 'text-indigo-400', category: 'Recruiter' },
  recruiter_offer: { label: 'Offer Discussion', icon: CheckCircle, color: 'text-amber-400', category: 'Recruiter' },
  recruiter_general: { label: 'General Call', icon: Video, color: 'text-gray-400', category: 'Recruiter' },
  // CLIENT-LED
  client_round_1: { label: 'Client Round 1', icon: Users, color: 'text-orange-400', category: 'Client' },
  client_round_2: { label: 'Client Round 2', icon: Users, color: 'text-orange-500', category: 'Client' },
  client_final: { label: 'Client Final Interview', icon: CheckCircle, color: 'text-orange-600', category: 'Client' },
  client_general: { label: 'Client Call', icon: Video, color: 'text-orange-300', category: 'Client' },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function UniversalVideoCallModal({
  joinUrl,
  roomId,
  token,
  participants,
  currentUser,
  metadata = {},
  isOpen,
  onClose,
  onCallJoined,
  onCallEnded,
  onParticipantJoined,
  onParticipantLeft,
  onRecordingStarted,
  onRecordingStopped,
  onError,
  enableChat = true,
  enableScreenShare = true,
  enableRecording = true,
  enableNetworkInfo = true,
  enablePeoplePanel = true,
  enableBpocTools = false,
  onSaveNotes,
  onSetRating,
  onSetOutcome,
  onOpenProfile,
  theme = 'dark',
  showBranding = true,
  apiMode = false,
}: UniversalVideoCallModalProps) {
  // ============================================
  // STATE
  // ============================================
  
  const [mounted, setMounted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended' | 'error'>('connecting');
  const [participantCount, setParticipantCount] = useState(participants.length || 1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'ready' | 'error'>('idle');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  
  // ============================================
  // RESOLVE JOIN URL & TOKEN
  // ============================================
  
  const [resolvedJoinUrl, setResolvedJoinUrl] = useState<string | null>(null);
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);
  
  // Resolve join URL and token based on props
  useEffect(() => {
    if (!isOpen) return;
    
    if (joinUrl) {
      // API Mode: Use joinUrl directly
      // Extract token from URL if present: ?t=TOKEN
      const urlObj = new URL(joinUrl);
      const urlToken = urlObj.searchParams.get('t');
      setResolvedJoinUrl(joinUrl);
      setResolvedToken(urlToken || null);
    } else if (roomId && token) {
      // Internal Mode: Build URL from roomId + token
      // Fetch room URL from API if needed, or construct from token
      if (apiMode) {
        // If API mode but no joinUrl, we need to fetch it
        fetch(`/api/v1/video/rooms/${roomId}`)
          .then(res => res.json())
          .then(data => {
            if (data.room?.roomUrl) {
              const fullUrl = `${data.room.roomUrl}?t=${token}`;
              setResolvedJoinUrl(fullUrl);
              setResolvedToken(token);
            }
          })
          .catch(err => {
            console.error('Failed to fetch room:', err);
            setError('Failed to load video room');
          });
      } else {
        // Internal: Use context or fetch from internal API
        fetch(`/api/video/rooms/${roomId}/join`, {
          method: 'POST',
          credentials: 'include',
        })
          .then(res => res.json())
          .then(data => {
            if (data.room?.url) {
              setResolvedJoinUrl(`${data.room.url}?t=${data.room.token}`);
              setResolvedToken(data.room.token);
            }
          })
          .catch(err => {
            console.error('Failed to join room:', err);
            setError('Failed to join video room');
          });
      }
    } else {
      setError('Missing joinUrl or (roomId + token)');
    }
  }, [isOpen, joinUrl, roomId, token, apiMode]);
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setCallStatus('connecting');
      setParticipantCount(participants.length || 1);
      setIsRecording(false);
      setRecordingStatus('idle');
      setNotes('');
      setRating(null);
      setOutcome(null);
      setError(null);
      setResolvedJoinUrl(null);
      setResolvedToken(null);
    }
  }, [isOpen, participants.length]);
  
  // Update call duration
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected') return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);
  
  // ============================================
  // UTILITIES
  // ============================================
  
  const formatDuration = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const isHost = currentUser.role === 'host' || currentUser.role === 'recruiter' || currentUser.role === 'client';
  const otherParticipants = participants.filter(p => p.id !== currentUser.id && p.userId !== currentUser.userId);
  const primaryOtherParticipant = otherParticipants[0] || participants.find(p => !p.isLocal);
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handleCallJoined = useCallback(() => {
    setCallStatus('connected');
    onCallJoined?.();
  }, [onCallJoined]);
  
  const handleCallEnded = useCallback(() => {
    setCallStatus('ended');
    onCallEnded?.();
    // Auto-close after a brief delay
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [onCallEnded, onClose]);
  
  const handleParticipantJoined = useCallback(() => {
    setParticipantCount(prev => prev + 1);
    if (otherParticipants.length > 0) {
      onParticipantJoined?.(otherParticipants[otherParticipants.length - 1]);
    }
  }, [otherParticipants, onParticipantJoined]);
  
  const handleParticipantLeft = useCallback(() => {
    setParticipantCount(prev => Math.max(1, prev - 1));
    onParticipantLeft?.(otherParticipants[0]);
  }, [otherParticipants, onParticipantLeft]);
  
  const handleRecordingStarted = useCallback(() => {
    setIsRecording(true);
    setRecordingStatus('recording');
    onRecordingStarted?.();
  }, [onRecordingStarted]);
  
  const handleRecordingStopped = useCallback(() => {
    setIsRecording(false);
    setRecordingStatus('processing');
    onRecordingStopped?.();
  }, [onRecordingStopped]);
  
  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setCallStatus('error');
    onError?.(errorMsg);
  }, [onError]);
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  
  const handleEndCall = useCallback(() => {
    setCallStatus('ended');
    onClose();
  }, [onClose]);
  
  // ============================================
  // BPOC TOOLS HANDLERS
  // ============================================
  
  const handleSaveNotes = useCallback(async () => {
    if (!onSaveNotes || !notes.trim()) return;
    setIsSaving(true);
    try {
      await onSaveNotes(notes);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSaving(false);
    }
  }, [notes, onSaveNotes]);
  
  const handleSetRating = useCallback(async (newRating: number) => {
    setRating(newRating);
    if (onSetRating) {
      try {
        await onSetRating(newRating);
      } catch (err) {
        console.error('Failed to set rating:', err);
      }
    }
  }, [onSetRating]);
  
  const handleSetOutcome = useCallback(async (newOutcome: CallOutcome) => {
    setOutcome(newOutcome);
    if (onSetOutcome) {
      try {
        await onSetOutcome(newOutcome);
      } catch (err) {
        console.error('Failed to set outcome:', err);
      }
    }
  }, [onSetOutcome]);
  
  // Auto-save notes (debounced)
  useEffect(() => {
    if (!isHost || !onSaveNotes || !notes) return;
    
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = window.setTimeout(() => {
      handleSaveNotes();
    }, 1000);
    
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [notes, isHost, onSaveNotes, handleSaveNotes]);
  
  // ============================================
  // RENDER
  // ============================================
  
  if (!isOpen || !mounted) return null;
  
  // Get call type info
  const callTypeInfo = metadata.callType ? CALL_TYPE_LABELS[metadata.callType] : null;
  const callTitle = metadata.title || callTypeInfo?.label || 'Video Call';
  
  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#0a0a0f]"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        {/* Main Layout */}
        <div className="h-full flex">
          {/* Video Area */}
          <div className="flex-1 flex flex-col relative">
            {/* Top Bar */}
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm"
            >
              {/* Left: Call Info */}
              <div className="flex items-center gap-3">
                {/* Call Type Badge */}
                {callTypeInfo && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm ${callTypeInfo.color}`}>
                    {React.createElement(callTypeInfo.icon, { className: 'w-3.5 h-3.5' })}
                    <span className="text-xs font-medium">{callTypeInfo.label}</span>
                  </div>
                )}
                
                {/* Recording Indicator */}
                {recordingStatus === 'recording' && (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
                  >
                    <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                    <span className="text-red-400 text-xs font-medium">RECORDING</span>
                  </motion.div>
                )}
                
                {recordingStatus === 'processing' && (
                  <motion.div
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Circle className="w-2.5 h-2.5 text-orange-500" />
                    </motion.div>
                    <span className="text-orange-400 text-xs font-medium">Processing...</span>
                  </motion.div>
                )}
                
                {/* Duration */}
                {callStatus === 'connected' && (
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
                  </div>
                )}
                
                {/* Participant Count */}
                {callStatus === 'connected' && (
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-white text-sm font-medium">{participantCount}</span>
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* BPOC Tools Toggle (Host only) */}
                {enableBpocTools && isHost && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                      showSidebar 
                        ? 'bg-orange-500/20 text-orange-400' 
                        : 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">BPOC Tools</span>
                  </motion.button>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close */}
                <button
                  onClick={handleEndCall}
                  className="p-2 rounded-full bg-red-500/20 backdrop-blur-sm text-red-400 hover:bg-red-500/30 transition-colors"
                  title="End call"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.header>

            {/* Video Frame */}
            <div className="flex-1 relative">
              {error ? (
                <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">Call Error</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Button 
                      onClick={onClose}
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-800"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : resolvedJoinUrl && resolvedToken ? (
                <DailyCallFrame
                  roomUrl={resolvedJoinUrl.split('?')[0]} // Remove token from URL, Daily handles it via join()
                  token={resolvedToken}
                  userName={currentUser.name}
                  enableChat={enableChat}
                  enableScreenShare={enableScreenShare}
                  enableRecording={enableRecording && isHost}
                  enableNetworkInfo={enableNetworkInfo}
                  enablePeoplePanel={enablePeoplePanel}
                  onCallJoined={handleCallJoined}
                  onCallEnded={handleCallEnded}
                  onError={handleError}
                  onParticipantJoined={handleParticipantJoined}
                  onParticipantLeft={handleParticipantLeft}
                  onRecordingStarted={handleRecordingStarted}
                  onRecordingStopped={handleRecordingStopped}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading video call...</p>
                  </div>
                </div>
              )}

              {/* Connecting Overlay */}
              <AnimatePresence>
                {callStatus === 'connecting' && !error && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center z-20"
                  >
                    <div className="text-center">
                      {/* Animated Avatar */}
                      {primaryOtherParticipant && (
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="relative inline-block mb-6"
                        >
                          <Avatar className="h-32 w-32 border-4 border-orange-500/30">
                            {primaryOtherParticipant.avatar ? (
                              <AvatarImage src={primaryOtherParticipant.avatar} alt={primaryOtherParticipant.name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-4xl">
                                {primaryOtherParticipant.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          {/* Pulsing Ring */}
                          <motion.div
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 border-4 border-orange-500 rounded-full"
                          />
                        </motion.div>
                      )}

                      <h2 className="text-white text-2xl font-semibold mb-2">
                        {isHost ? 'Waiting for participants...' : 'Joining call...'}
                      </h2>
                      <p className="text-gray-400">
                        {isHost 
                          ? primaryOtherParticipant 
                            ? `Calling ${primaryOtherParticipant.name}` 
                            : 'Preparing call...'
                          : `Connecting to ${otherParticipants[0]?.name || 'host'}`}
                      </p>
                      
                      {metadata.jobTitle && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm">{metadata.jobTitle}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* BPOC Tools Sidebar (Host only) */}
          <AnimatePresence>
            {showSidebar && enableBpocTools && isHost && (
              <motion.aside
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-80 bg-[#111118] border-l border-gray-800 flex flex-col"
              >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <h3 className="text-white font-semibold">BPOC Tools</h3>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 rounded hover:bg-gray-800 text-gray-400"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Participant Info */}
                {primaryOtherParticipant && (
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {primaryOtherParticipant.avatar ? (
                          <AvatarImage src={primaryOtherParticipant.avatar} alt={primaryOtherParticipant.name} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {primaryOtherParticipant.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h4 className="text-white font-medium">{primaryOtherParticipant.name}</h4>
                        {metadata.jobTitle && (
                          <p className="text-gray-400 text-sm">{metadata.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="p-4 border-b border-gray-800">
                  <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Rating */}
                    {onSetRating && (
                      <button
                        onClick={() => handleSetRating(5)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <Sparkles className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-white text-xs font-medium">
                          Rate{rating ? ` (${rating})` : ''}
                        </span>
                      </button>
                    )}
                    
                    {/* Profile */}
                    {onOpenProfile && primaryOtherParticipant?.userId && (
                      <button
                        onClick={() => onOpenProfile(primaryOtherParticipant.userId!)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-white text-xs font-medium">Profile</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Outcome Selector */}
                {onSetOutcome && (
                  <div className="p-4 border-b border-gray-800">
                    <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
                      Call Outcome
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(['successful', 'no_show', 'rescheduled', 'cancelled', 'needs_followup'] as CallOutcome[]).map((out) => (
                        <button
                          key={out}
                          onClick={() => handleSetOutcome(out)}
                          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                            outcome === out
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          {out.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {onSaveNotes && (
                  <div className="flex-1 p-4 flex flex-col">
                    <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Interview Notes
                    </h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Take notes during the interview..."
                      className="flex-1 w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      {isSaving ? 'Saving…' : 'Auto-saved'}
                    </p>
                  </div>
                )}

                {/* Call Info Footer */}
                <div className="p-4 border-t border-gray-800 space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">
                      Duration: {formatDuration(callDuration)}
                    </span>
                  </div>
                  {metadata.scheduledFor && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">
                        {new Date(metadata.scheduledFor).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}






