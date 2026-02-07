 'use client';
 
 /**
  * VideoCallOverlay
  * The single, reusable global call modal for the entire app.
  * This guarantees we don't recreate call UI per page.
  */
 
 import React, { useMemo, useCallback } from 'react';
 import { useVideoCall } from '@/contexts/VideoCallContext';
 import VideoCallModal from './VideoCallModal';
 
 export default function VideoCallOverlay() {
   const { callState, callUi, leaveCall } = useVideoCall();
 
   const token = useMemo(() => {
     // In our current state model, `hostToken` holds the token for the current user (host OR participant).
     return callState.hostToken || callState.participantToken || '';
   }, [callState.hostToken, callState.participantToken]);
 
  // Robust open logic:
  // - Prefer explicit UI open flag (callUi.isOpen)
  // - ALSO open automatically whenever the call is active/connecting, even if a UI flag wasn't set.
  //   This fixes: "candidate has token/logs but no popup".
  const isOpen =
    !!callUi.isOpen ||
    callState.status === 'connecting' ||
    (callState.status === 'joined' && (!!callState.roomUrl || !!token));
 
   const handleClose = useCallback(async () => {
     await leaveCall();
   }, [leaveCall]);
 
  // Only render when the UI is open. Modal itself can show "connecting" overlay while roomUrl/token appear.
   if (!isOpen) return null;
 
   return (
     <VideoCallModal
       isOpen={true}
       onClose={handleClose}
      roomId={callState.roomId || undefined}
       roomUrl={callState.roomUrl || ''}
       token={token}
       isHost={callState.isHost}
       hostName={callUi.meta.hostName || (callState.isHost ? 'You' : 'Recruiter')}
       hostAvatar={callUi.meta.hostAvatar}
       participantName={callUi.meta.participantName || (callState.isHost ? 'Candidate' : 'You')}
       participantAvatar={callUi.meta.participantAvatar}
       jobTitle={callUi.meta.jobTitle}
       roomName={callUi.meta.roomName || callState.roomName || undefined}
      participantUserId={(callUi.meta as any).participantUserId}
     />
   );
 }

