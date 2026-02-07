'use client';

/**
 * VideoCallButton Component
 * Button for recruiters to initiate video calls with candidates
 * Includes call type selector for recruitment workflow
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Phone, 
  Loader2, 
  ChevronDown,
  UserCheck,
  Users,
  Briefcase,
  Award,
  MessageSquare,
  PhoneCall,
  X,
} from 'lucide-react';
import { useVideoCall } from '@/contexts/VideoCallContext';

// All available call types - organized by RECRUITER vs CLIENT
const ALL_CALL_TYPES = [
  // ============ RECRUITER-LED (BPOC Internal) ============
  { 
    value: 'recruiter_prescreen', 
    label: 'Pre-Screen', 
    icon: PhoneCall, 
    description: 'Initial screening call',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    category: 'recruiter',
  },
  { 
    value: 'recruiter_round_1', 
    label: 'Round 1', 
    icon: UserCheck, 
    description: 'First BPOC interview',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    category: 'recruiter',
  },
  { 
    value: 'recruiter_round_2', 
    label: 'Round 2', 
    icon: Users, 
    description: 'Second BPOC interview',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    category: 'recruiter',
  },
  { 
    value: 'recruiter_round_3', 
    label: 'Round 3', 
    icon: Users, 
    description: 'Third BPOC interview (rare)',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    category: 'recruiter',
  },
  { 
    value: 'recruiter_offer', 
    label: 'Offer Call', 
    icon: Award, 
    description: 'Discuss/present offer',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    category: 'recruiter',
  },
  { 
    value: 'recruiter_general', 
    label: 'General Call', 
    icon: MessageSquare, 
    description: 'Ad-hoc recruiter call',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    category: 'recruiter',
  },
  // ============ CLIENT-LED (Client's Process) ============
  { 
    value: 'client_round_1', 
    label: 'Client Round 1', 
    icon: Briefcase, 
    description: 'First client interview',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    category: 'client',
  },
  { 
    value: 'client_round_2', 
    label: 'Client Round 2', 
    icon: Briefcase, 
    description: 'Second client interview',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    category: 'client',
  },
  { 
    value: 'client_final', 
    label: 'Client Final', 
    icon: Award, 
    description: 'Final client interview',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    category: 'client',
  },
  { 
    value: 'client_general', 
    label: 'Client General', 
    icon: MessageSquare, 
    description: 'Ad-hoc client call',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    category: 'client',
  },
];

// Context-based call type groups for recruiter workflow
export type CallContext = 'talent_pool' | 'applications' | 'interviews' | 'client_interviews' | 'offers' | 'all';

const CALL_TYPE_BY_CONTEXT: Record<CallContext, string[]> = {
  // Sourcing/first contact - recruiter pre-screens
  // In practice recruiters also run R1/R2/R3 from Talent Pool, so include them here.
  talent_pool: ['recruiter_prescreen', 'recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3', 'recruiter_offer', 'recruiter_general'],
  // Evaluating applicants - recruiter screens
  // Include Round 1/2/3 here because recruiters often run these directly from Applications
  applications: ['recruiter_prescreen', 'recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3', 'recruiter_general'],
  // BPOC interview stages
  interviews: ['recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3'],
  // Client interview stages
  client_interviews: ['client_round_1', 'client_round_2', 'client_final', 'client_general'],
  // Offer discussion
  offers: ['recruiter_offer', 'recruiter_general'],
  // All types
  all: [
    'recruiter_prescreen', 'recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3', 'recruiter_offer', 'recruiter_general',
    'client_round_1', 'client_round_2', 'client_final', 'client_general',
  ],
};

const DEFAULT_CALL_TYPE_BY_CONTEXT: Record<CallContext, string> = {
  talent_pool: 'recruiter_prescreen',
  applications: 'recruiter_prescreen',
  interviews: 'recruiter_round_1',
  client_interviews: 'client_round_1',
  offers: 'recruiter_offer',
  all: 'recruiter_general',
};

type CallType = 
  | 'recruiter_prescreen' | 'recruiter_round_1' | 'recruiter_round_2' | 'recruiter_round_3' | 'recruiter_offer' | 'recruiter_general'
  | 'client_round_1' | 'client_round_2' | 'client_final' | 'client_general';

interface VideoCallButtonProps {
  candidateUserId: string;
  candidateName: string;
  candidateEmail?: string;
  candidateAvatar?: string;
  jobId?: string;
  jobTitle?: string;
  applicationId?: string;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
  defaultCallType?: string;
  /** Context determines which call types are shown in dropdown */
  context?: CallContext;
}

// Dropdown component rendered via portal
function CallTypeDropdown({
  isOpen,
  onClose,
  onSelect,
  selectedCallType,
  candidateName,
  buttonRect,
  callTypes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  selectedCallType: string;
  candidateName: string;
  buttonRect: DOMRect | null;
  callTypes: typeof ALL_CALL_TYPES;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen || !buttonRect) return null;

  const dropdownStyle = {
    position: 'fixed' as const,
    top: buttonRect.bottom + 8,
    left: Math.max(8, buttonRect.right - 288),
    zIndex: 9999,
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
          />
          
          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={dropdownStyle}
            className="w-72 bg-[#0f0f15] border border-gray-600 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-[#0a0a0f]">
              <span className="text-sm font-medium text-white">Select Call Type</span>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Options */}
            <div className="p-2 max-h-80 overflow-y-auto">
              {callTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedCallType === type.value;
                
                return (
                  <button
                    key={type.value}
                    onClick={() => onSelect(type.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/20 border border-emerald-500/40' 
                        : 'hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white font-medium text-sm">{type.label}</p>
                      <p className="text-gray-500 text-xs truncate">{type.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 bg-[#0a0a0f] border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Calling <span className="text-white font-medium">{candidateName}</span>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default function VideoCallButton({
  candidateUserId,
  candidateName,
  candidateEmail,
  candidateAvatar,
  jobId,
  jobTitle,
  applicationId,
  variant = 'default',
  className = '',
  defaultCallType,
  context = 'all',
}: VideoCallButtonProps) {
  const { callState, createCall } = useVideoCall();
  const [isLoading, setIsLoading] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get filtered call types based on context
  const allowedCallTypeValues = CALL_TYPE_BY_CONTEXT[context];
  const filteredCallTypes = ALL_CALL_TYPES.filter(t => allowedCallTypeValues.includes(t.value));
  
  // Set default based on context if not explicitly provided
  const effectiveDefaultCallType = defaultCallType || DEFAULT_CALL_TYPE_BY_CONTEXT[context];
  const [selectedCallType, setSelectedCallType] = useState(effectiveDefaultCallType);

  const selectedType = filteredCallTypes.find(t => t.value === selectedCallType) || filteredCallTypes[0];

  const handleButtonClick = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setShowTypeSelector(!showTypeSelector);
  };

  const handleSelectCallType = async (callType: string) => {
    setSelectedCallType(callType);
    setShowTypeSelector(false);
    setIsLoading(true);
    
    console.log('📞 [VideoCallButton] Starting call...', { callType, candidateUserId });
    
    try {
      const roomId = await createCall(candidateUserId, candidateName, {
        jobId,
        applicationId,
        enableRecording: true,
        enableTranscription: true,
        callType: callType as CallType,
        participantAvatar: candidateAvatar,
        jobTitle,
        roomName: selectedType.label,
      });

      console.log('📞 [VideoCallButton] createCall returned:', roomId);
      // IMPORTANT:
      // roomId can be undefined if DB insert failed (e.g. migrations not applied),
      // but the Daily roomUrl + hostToken can still be present in callState.
      // We must NOT treat a missing roomId as a failure here.
      //
      // The useEffect above will open the modal as soon as callState.roomUrl + callState.hostToken are set.
      
    } catch (error) {
      console.error('Failed to start call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isInCall = callState.status === 'joined' || callState.status === 'connecting';

  // Render button based on variant
  if (variant === 'icon') {
    return (
      <>
        <motion.button
          ref={buttonRef}
          onClick={handleButtonClick}
          disabled={isLoading || isInCall}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`rounded-full w-10 h-10 p-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50 ${className}`}
          title={`Video call ${candidateName}`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
        </motion.button>

        <CallTypeDropdown
          isOpen={showTypeSelector && !isInCall}
          onClose={() => setShowTypeSelector(false)}
          onSelect={handleSelectCallType}
          selectedCallType={selectedCallType}
          candidateName={candidateName}
          buttonRect={buttonRect}
          callTypes={filteredCallTypes}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <motion.button
          ref={buttonRef}
          onClick={handleButtonClick}
          disabled={isLoading || isInCall}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 ${className}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Calling...</span>
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              <span className="text-sm">Call</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showTypeSelector ? 'rotate-180' : ''}`} />
            </>
          )}
        </motion.button>

        <CallTypeDropdown
          isOpen={showTypeSelector && !isInCall}
          onClose={() => setShowTypeSelector(false)}
          onSelect={handleSelectCallType}
          selectedCallType={selectedCallType}
          candidateName={candidateName}
          buttonRect={buttonRect}
          callTypes={filteredCallTypes}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={isLoading || isInCall}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Starting...</span>
          </>
        ) : isInCall ? (
          <>
            <Phone className="w-4 h-4" />
            <span className="text-sm">In Call</span>
          </>
        ) : (
          <>
            <selectedType.icon className="w-4 h-4" />
            <span className="text-sm">{selectedType.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showTypeSelector ? 'rotate-180' : ''}`} />
          </>
        )}
      </motion.button>

      <CallTypeDropdown
        isOpen={showTypeSelector && !isInCall}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleSelectCallType}
        selectedCallType={selectedCallType}
        candidateName={candidateName}
        buttonRect={buttonRect}
        callTypes={filteredCallTypes}
      />
    </>
  );
}
