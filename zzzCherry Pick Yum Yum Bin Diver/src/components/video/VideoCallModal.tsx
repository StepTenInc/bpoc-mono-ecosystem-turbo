'use client';

/**
 * VideoCallModal
 * Premium full-screen video call experience with BPOC custom features
 * Uses Daily.co's prebuilt UI + BPOC-specific controls
 * Uses React Portal to escape parent containers
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
  PhoneOff,
  User,
  Briefcase,
  Calendar,
  FileText,
  Star,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import DailyCallFrame from './DailyCallFrame';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  roomUrl: string;
  token: string;
  isHost: boolean;
  hostName?: string;
  hostAvatar?: string;
  participantName?: string;
  participantAvatar?: string;
  jobTitle?: string;
  roomName?: string;
  participantUserId?: string;
  /**
   * UI mode:
   * - daily: show only Daily's prebuilt UI (recommended until call flows are fully stable)
   * - bpoc: show BPOC header/sidebar/tools around the Daily frame
   */
  uiMode?: 'daily' | 'bpoc';
}

export default function VideoCallModal({
  isOpen,
  onClose,
  roomId,
  roomUrl,
  token,
  isHost,
  hostName = 'Recruiter',
  hostAvatar,
  participantName = 'Candidate',
  participantAvatar,
  jobTitle,
  roomName,
  participantUserId,
  uiMode = 'daily',
}: VideoCallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [participantCount, setParticipantCount] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'ready' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  // Ensure we're on the client for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update call duration
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected') return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setCallStatus('connecting');
      setParticipantCount(1);
      setIsRecording(false);
      setNotes('');
      setRating(null);
    }
  }, [isOpen]);

  const patchRoom = useCallback(async (patch: Record<string, any>) => {
    if (!roomId) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/video/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        console.error('❌ [VideoCallModal] Failed to save room patch:', res.status, t);
      }
    } catch (e) {
      console.error('❌ [VideoCallModal] Failed to save room patch:', e);
    } finally {
      setIsSaving(false);
    }
  }, [roomId]);

  // Debounced auto-save notes (host only)
  useEffect(() => {
    if (!isHost) return;
    if (!roomId) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      patchRoom({ notes });
    }, 800);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [notes, isHost, roomId, patchRoom]);

  const handleSetRating = useCallback(async (nextRating: number) => {
    setRating(nextRating);
    if (isHost && roomId) {
      await patchRoom({ rating: nextRating });
    }
  }, [isHost, roomId, patchRoom]);

  const handleOpenCandidateProfile = useCallback(() => {
    if (!participantUserId) return;
    // Works for both route-group and non-group routes depending on your app mapping.
    window.open(`/recruiter/talent/${participantUserId}`, '_blank', 'noopener,noreferrer');
  }, [participantUserId]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle call events
  const handleCallJoined = useCallback(() => {
    setCallStatus('connected');
  }, []);

  const handleParticipantJoined = useCallback(() => {
    setParticipantCount(prev => prev + 1);
  }, []);

  const handleParticipantLeft = useCallback(() => {
    setParticipantCount(prev => Math.max(1, prev - 1));
  }, []);

  const handleCallEnded = useCallback(() => {
    setCallStatus('ended');
    onClose();
  }, [onClose]);

  const handleError = useCallback((error: string) => {
    console.error('Call error:', error);
    // If meeting ended, close the modal automatically after showing the error
    if (error.toLowerCase().includes('ended') || error.toLowerCase().includes('expired')) {
      setCallStatus('ended');
    }
  }, []);

  const handleRecordingStarted = useCallback(() => {
    console.log('🔴 [VideoCallModal] Recording STARTED');
    setIsRecording(true);
    setRecordingStatus('recording');
  }, []);

  const handleRecordingStopped = useCallback(() => {
    console.log('⏹️ [VideoCallModal] Recording STOPPED - Processing...');
    setIsRecording(false);
    setRecordingStatus('processing');
    
    // After stopping, Daily processes the recording (typically 30-90 seconds)
    // Show processing status until user ends call
  }, []);

  // Handle end call
  const handleEndCall = useCallback(() => {
    setCallStatus('ended');
    onClose();
  }, [onClose]);

  // Get current user info
  const currentUserName = isHost ? hostName : participantName;
  const otherUserName = isHost ? participantName : hostName;
  const otherUserAvatar = isHost ? participantAvatar : hostAvatar;

  // Don't render if not open or not mounted (SSR safety)
  if (!isOpen || !mounted) return null;

  // DAILY-ONLY MODE: render just the Daily prebuilt UI, fullscreen.
  if (uiMode === 'daily') {
    const dailyOnly = (
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
          <DailyCallFrame
            roomUrl={roomUrl}
            token={token}
            userName={currentUserName}
            enableChat={true}
            enableScreenShare={true}
            enableRecording={true}
            enableNetworkInfo={true}
            enablePeoplePanel={true}
            onCallJoined={handleCallJoined}
            onCallEnded={handleCallEnded}
            onError={handleError}
            onParticipantJoined={handleParticipantJoined}
            onParticipantLeft={handleParticipantLeft}
            onRecordingStarted={handleRecordingStarted}
            onRecordingStopped={handleRecordingStopped}
          />
        </motion.div>
      </AnimatePresence>
    );
    return createPortal(dailyOnly, document.body);
  }

  // Render via portal to escape parent containers
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
            {/* Minimal Top Bar - Only show BPOC branding + essential info */}
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3"
            >
              {/* Left: Call Info */}
              <div className="flex items-center gap-3">
                {/* Recording indicator - shows different states */}
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
                    <span className="text-orange-400 text-xs font-medium">Processing Recording...</span>
                  </motion.div>
                )}
                
                {/* Duration badge */}
                {callStatus === 'connected' && (
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
                  </div>
                )}
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-2">
                {/* Toggle BPOC Sidebar (Host only) */}
                {isHost && (
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

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.header>

            {/* Daily Video Frame - Full height */}
            <div className="flex-1 relative">
              <DailyCallFrame
                roomUrl={roomUrl}
                token={token}
                userName={currentUserName}
                enableChat={true}
                enableScreenShare={true}
                enableRecording={true}
                enableNetworkInfo={true}
                enablePeoplePanel={true}
                onCallJoined={handleCallJoined}
                onCallEnded={handleCallEnded}
                onError={handleError}
                onParticipantJoined={handleParticipantJoined}
                onParticipantLeft={handleParticipantLeft}
                onRecordingStarted={handleRecordingStarted}
                onRecordingStopped={handleRecordingStopped}
              />

              {/* Connecting Overlay */}
              <AnimatePresence>
                {callStatus === 'connecting' && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center z-20"
                  >
                    <div className="text-center">
                      {/* Animated Avatar */}
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative inline-block mb-6"
                      >
                        <Avatar className="h-32 w-32 border-4 border-orange-500/30">
                          {otherUserAvatar ? (
                            <AvatarImage src={otherUserAvatar} alt={otherUserName} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-4xl">
                              {otherUserName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
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

                      <h2 className="text-white text-2xl font-semibold mb-2">
                        {isHost ? 'Waiting for candidate...' : 'Joining call...'}
                      </h2>
                      <p className="text-gray-400">
                        {isHost 
                          ? `Calling ${participantName}` 
                          : `Connecting to ${hostName}`}
                      </p>
                      
                      {jobTitle && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm">{jobTitle}</span>
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
            {showSidebar && isHost && (
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

                {/* Candidate Info */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {participantAvatar ? (
                        <AvatarImage src={participantAvatar} alt={participantName} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {participantName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h4 className="text-white font-medium">{participantName}</h4>
                      {jobTitle && (
                        <p className="text-gray-400 text-sm">{jobTitle}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-b border-gray-800">
                  <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSetRating(5)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                      title="Set rating (5)"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                        <Star className="w-5 h-5 text-orange-400" />
                      </div>
                      <span className="text-white text-xs font-medium">
                        Rate{rating ? ` (${rating})` : ''}
                      </span>
                    </button>
                    <button
                      onClick={handleOpenCandidateProfile}
                      disabled={!participantUserId}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group disabled:opacity-50"
                      title={participantUserId ? 'Open candidate profile' : 'Missing candidate id'}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-white text-xs font-medium">Resume</span>
                    </button>
                    <button
                      onClick={() => console.log('[BPOC Tools] AI Assist clicked')}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                      title="AI Assist (coming soon)"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-white text-xs font-medium">AI Assist</span>
                    </button>
                    <button
                      onClick={handleOpenCandidateProfile}
                      disabled={!participantUserId}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group disabled:opacity-50"
                      title={participantUserId ? 'Open candidate profile' : 'Missing candidate id'}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <User className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-white text-xs font-medium">Profile</span>
                    </button>
                  </div>
                </div>

                {/* Interview Notes */}
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
                    {isSaving ? 'Saving…' : 'Auto-saved to this call'}
                  </p>
                </div>

                {/* Recording Status Section */}
                {recordingStatus !== 'idle' && (
                  <div className="p-4 border-t border-gray-800">
                    <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
                      Recording Status
                    </h4>
                    <div className={`p-3 rounded-lg ${
                      recordingStatus === 'recording' 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : recordingStatus === 'processing'
                        ? 'bg-orange-500/10 border border-orange-500/20'
                        : recordingStatus === 'ready'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-gray-500/10 border border-gray-500/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        {recordingStatus === 'recording' && (
                          <>
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                            </motion.div>
                            <span className="text-red-400 text-sm font-medium">Recording in progress</span>
                          </>
                        )}
                        {recordingStatus === 'processing' && (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                              <Circle className="w-3 h-3 text-orange-500" />
                            </motion.div>
                            <div className="flex flex-col">
                              <span className="text-orange-400 text-sm font-medium">Processing recording...</span>
                              <span className="text-orange-400/70 text-xs">This may take 30-90 seconds</span>
                            </div>
                          </>
                        )}
                        {recordingStatus === 'ready' && (
                          <>
                            <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                            <span className="text-green-400 text-sm font-medium">Recording saved!</span>
                          </>
                        )}
                        {recordingStatus === 'error' && (
                          <>
                            <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                            <span className="text-red-400 text-sm font-medium">Recording failed</span>
                          </>
                        )}
                      </div>
                    </div>
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
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
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
