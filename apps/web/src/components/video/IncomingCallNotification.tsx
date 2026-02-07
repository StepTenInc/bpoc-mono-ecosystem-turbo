'use client';

/**
 * IncomingCallNotification
 * Premium incoming call notification with beautiful animations
 * Uses React Portal to render on top of everything
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, X, User, Briefcase, Volume2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { useVideoCall } from '@/contexts/VideoCallContext';

export default function IncomingCallNotification() {
  const { pendingInvitations, acceptInvitation, declineInvitation } = useVideoCall();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ensure we're on the client for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Get the most recent invitation
  const currentInvitation = pendingInvitations[0];

  // Play/stop ringtone
  useEffect(() => {
    if (currentInvitation) {
      // Could play a ringtone here
      // audioRef.current?.play();
    } else {
      // audioRef.current?.pause();
    }
    
    return () => {
      // audioRef.current?.pause();
    };
  }, [currentInvitation]);

  const handleAccept = async () => {
    if (!currentInvitation || isAccepting) return;
    
    setIsAccepting(true);
    try {
      await acceptInvitation(currentInvitation.id);
    } catch (error) {
      console.error('Failed to accept call:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!currentInvitation || isDeclining) return;
    
    setIsDeclining(true);
    try {
      await declineInvitation(currentInvitation.id, 'Busy');
    } finally {
      setIsDeclining(false);
    }
  };

  // Don't show notification if no pending invitations or not mounted
  if (!currentInvitation || !mounted) {
    return null;
  }

  const notificationContent = (
    <>
      {/* Ringtone audio element */}
      <audio ref={audioRef} loop>
        {/* Use an existing mp3 in /public to avoid 404 noise in devtools */}
        <source src="/bpoc-disc-songs/maledisc.mp3" type="audio/mpeg" />
      </audio>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998]"
        >
          <div className="relative">
            {/* Glow Effect */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.3)',
                  '0 0 40px rgba(34, 197, 94, 0.5)',
                  '0 0 20px rgba(34, 197, 94, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl"
            />

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-[#0f0f15] to-[#0a0a0f] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden w-[380px]">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, #22c55e 0%, transparent 50%)',
                    backgroundSize: '200% 200%',
                  }}
                />
              </div>

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="relative"
                    >
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <motion.div
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-emerald-500"
                      />
                    </motion.div>
                    <span className="text-emerald-400 font-semibold">Incoming Video Call</span>
                  </div>
                  <button
                    onClick={handleDecline}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Caller Info */}
                <div className="flex flex-col items-center text-center mb-8">
                  {/* Avatar with Animation */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative mb-4"
                  >
                    <Avatar className="h-24 w-24 border-4 border-emerald-500/30 shadow-xl shadow-emerald-500/20">
                      {currentInvitation.hostAvatar ? (
                        <AvatarImage 
                          src={currentInvitation.hostAvatar} 
                          alt={currentInvitation.hostName} 
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-2xl font-semibold">
                          {currentInvitation.hostName
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Video Icon Badge */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                    >
                      <Video className="w-4 h-4 text-white" />
                    </motion.div>

                    {/* Pulsing Rings */}
                    <motion.div
                      animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 border-4 border-emerald-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 border-4 border-emerald-500 rounded-full"
                    />
                  </motion.div>

                  {/* Name & Role */}
                  <h2 className="text-white text-xl font-bold mb-1">
                    {currentInvitation.hostName}
                  </h2>
                  <p className="text-gray-400">Interview Call</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {/* Decline Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDecline}
                    disabled={isDeclining}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDeclining ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full"
                      />
                    ) : (
                      <>
                        <PhoneOff className="w-5 h-5" />
                        <span className="font-semibold">Decline</span>
                      </>
                    )}
                  </motion.button>

                  {/* Accept Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Phone className="w-5 h-5" />
                        <span>Accept</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Multiple Calls Indicator */}
                {pendingInvitations.length > 1 && (
                  <p className="text-center text-gray-500 text-sm mt-4">
                    +{pendingInvitations.length - 1} more incoming call{pendingInvitations.length > 2 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );

  // Use portal to render at document body level
  return createPortal(notificationContent, document.body);
}
