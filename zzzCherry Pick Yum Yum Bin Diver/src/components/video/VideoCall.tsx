'use client';

/**
 * VideoCall Component
 * Full-screen video call interface wrapping Daily.co's prebuilt UI
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Circle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useVideoCall } from '@/contexts/VideoCallContext';
import DailyCallFrame from './DailyCallFrame';

interface VideoCallProps {
  onClose?: () => void;
}

export default function VideoCall({ onClose }: VideoCallProps) {
  const { callState, leaveCall } = useVideoCall();
  const [callDuration, setCallDuration] = useState(0);

  // Format duration
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
    if (callState.status === 'joined') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callState.status]);

  // Handle call ended
  const handleCallEnded = async () => {
    await leaveCall();
    onClose?.();
  };

  // Handle error
  const handleError = (error: string) => {
    console.error('Call error:', error);
  };

  // Don't render if no room URL
  if (callState.status === 'idle' || !callState.roomUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col"
    >
        {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0f] border-b border-gray-800">
                <div className="flex items-center gap-4">
                  {/* Call Duration */}
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-white text-sm font-medium">
                      {formatDuration(callDuration)}
                    </span>
                  </div>

                  {/* Recording Indicator */}
                  {callState.isRecording && (
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                      <Circle className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
              <span className="text-red-400 text-sm font-medium">Recording</span>
                    </div>
                  )}
                </div>

        <div className="flex items-center gap-3">
                  {/* Participant Count */}
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-white text-sm">{callState.participants.length || 1}</span>
                  </div>

          {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
            onClick={handleCallEnded}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
            <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

      {/* Video Call Frame - Takes up remaining space */}
      <div className="flex-1 p-4 bg-[#0a0a0f]">
        <DailyCallFrame
          roomUrl={callState.roomUrl}
          token={callState.hostToken || ''}
          onCallEnded={handleCallEnded}
          onError={handleError}
        />
              </div>

      {/* Bottom Info Bar */}
      <div className="px-4 py-2 bg-[#0a0a0f] border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Room: <span className="text-gray-300">{callState.roomName}</span>
                </span>
                {callState.isHost && (
            <span className="text-orange-400">You are the host</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
