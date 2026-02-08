'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  Video, 
  Trophy, 
  Gift, 
  Star,
  XCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationPipelineTrackerProps {
  status: string;
  jobTitle?: string;
  company?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Pipeline stages in order
const PIPELINE_STAGES = [
  {
    key: 'invited',
    label: 'Invited',
    icon: Gift,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-indigo-400',
    activeBg: 'bg-indigo-500/20',
    activeBorder: 'border-indigo-500/50'
  },
  { 
    key: 'submitted', 
    label: 'Applied', 
    icon: FileText, 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-cyan-400',
    activeBg: 'bg-cyan-500/20',
    activeBorder: 'border-cyan-500/50'
  },
  { 
    key: 'qualified', 
    label: 'Qualified', 
    icon: Search, 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-blue-400',
    activeBg: 'bg-blue-500/20',
    activeBorder: 'border-blue-500/50'
  },
  { 
    key: 'verified', 
    label: 'Verified', 
    icon: CheckCircle, 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-purple-400',
    activeBg: 'bg-purple-500/20',
    activeBorder: 'border-purple-500/50'
  },
  { 
    key: 'initial_interview', 
    label: 'Interview', 
    icon: Video, 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-orange-400',
    activeBg: 'bg-orange-500/20',
    activeBorder: 'border-orange-500/50',
    aliases: ['initial interview', 'final_interview', 'final interview']
  },
  { 
    key: 'passed', 
    label: 'Passed', 
    icon: Trophy, 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-yellow-400',
    activeBg: 'bg-yellow-500/20',
    activeBorder: 'border-yellow-500/50'
  },
  { 
    key: 'hired', 
    label: 'Hired! 🎉', 
    icon: Star, 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    activeColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/20',
    activeBorder: 'border-emerald-500/50'
  },
];

// Map various status values to pipeline position
const getStageIndex = (status: string): number => {
  const normalizedStatus = status.toLowerCase().replace(/[_\s-]/g, '_');
  
  // Direct matches
  const directMatch = PIPELINE_STAGES.findIndex(s => s.key === normalizedStatus);
  if (directMatch !== -1) return directMatch;
  
  // Check aliases
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stage = PIPELINE_STAGES[i];
    if (stage.aliases?.some(alias => alias.toLowerCase().replace(/[_\s-]/g, '_') === normalizedStatus)) {
      return i;
    }
  }
  
  // Special cases
  if (normalizedStatus === 'for_verification') return 2; // Between qualified and verified (after invited + submitted)
  if (normalizedStatus === 'under_review') return 2;
  if (normalizedStatus === 'shortlisted') return 3;
  if (normalizedStatus === 'interview_scheduled') return 4;
  if (normalizedStatus === 'offer_sent') return 5;
  
  return 1; // Default to submitted (invited is explicit)
};

// Check if status is terminal/negative
const isNegativeStatus = (status: string): boolean => {
  const negative = ['rejected', 'not_qualified', 'not qualified', 'withdrawn', 'closed', 'failed'];
  return negative.some(n => status.toLowerCase().includes(n.replace('_', ' ')) || status.toLowerCase().includes(n));
};

export function ApplicationPipelineTracker({ 
  status, 
  jobTitle, 
  company,
  showLabels = true,
  size = 'md' 
}: ApplicationPipelineTrackerProps) {
  const currentStageIndex = getStageIndex(status);
  const isNegative = isNegativeStatus(status);
  
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', container: 'w-8 h-8', line: 'h-0.5', text: 'text-xs' },
    md: { icon: 'w-8 h-8', container: 'w-10 h-10', line: 'h-1', text: 'text-sm' },
    lg: { icon: 'w-10 h-10', container: 'w-14 h-14', line: 'h-1.5', text: 'text-base' },
  };
  
  const sizes = sizeClasses[size];
  
  if (isNegative) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          "rounded-full flex items-center justify-center border-2",
          sizes.container,
          "bg-red-500/20 border-red-500/50"
        )}>
          <XCircle className={cn(sizes.icon, "text-red-400 p-1")} />
        </div>
        <span className={cn(sizes.text, "text-red-400 font-medium capitalize")}>
          {status.replace(/_/g, ' ')}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(jobTitle || company) && (
        <div className="mb-4 text-center">
          {jobTitle && <h4 className="text-white font-medium">{jobTitle}</h4>}
          {company && <p className="text-gray-400 text-sm">{company}</p>}
        </div>
      )}
      
      {/* Pipeline Progress */}
      <div className="relative flex items-center justify-between">
        {/* Progress Line Background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0">
          <div className={cn("w-full bg-gray-700/50 rounded-full", sizes.line)} />
        </div>
        
        {/* Progress Line Filled */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-0"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={cn(
            "w-full rounded-full",
            sizes.line,
            "bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500"
          )} />
        </motion.div>
        
        {/* Stage Nodes */}
        {PIPELINE_STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;
          const Icon = stage.icon;
          
          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  sizes.container,
                  isCompleted && "bg-gradient-to-br from-cyan-500 to-purple-600 border-transparent shadow-lg shadow-cyan-500/30",
                  isCurrent && cn(stage.activeBg, stage.activeBorder, "shadow-lg animate-pulse"),
                  isPending && cn(stage.bgColor, stage.borderColor, "opacity-50")
                )}
              >
                {isCompleted ? (
                  <CheckCircle className={cn(sizes.icon, "text-white p-1")} />
                ) : (
                  <Icon className={cn(
                    sizes.icon, 
                    "p-1",
                    isCurrent ? stage.activeColor : stage.color
                  )} />
                )}
              </motion.div>
              
              {showLabels && (
                <motion.span 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className={cn(
                    "mt-2 font-medium whitespace-nowrap",
                    sizes.text,
                    isCompleted && "text-cyan-400",
                    isCurrent && stage.activeColor,
                    isPending && "text-gray-500"
                  )}
                >
                  {stage.label}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current Status Message */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
          PIPELINE_STAGES[currentStageIndex]?.activeBg || 'bg-cyan-500/20',
          PIPELINE_STAGES[currentStageIndex]?.activeBorder || 'border-cyan-500/50'
        )}>
          {currentStageIndex === PIPELINE_STAGES.length - 1 ? (
            <span className="text-emerald-400 font-medium">
              🎉 Congratulations! You're hired!
            </span>
          ) : (
            <>
              <Clock className={cn("w-4 h-4", PIPELINE_STAGES[currentStageIndex]?.activeColor || 'text-cyan-400')} />
              <span className={cn(PIPELINE_STAGES[currentStageIndex]?.activeColor || 'text-cyan-400', "font-medium")}>
                Currently at: {PIPELINE_STAGES[currentStageIndex]?.label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400 text-sm">
                Next: {PIPELINE_STAGES[currentStageIndex + 1]?.label || 'Final Stage'}
              </span>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Compact version for list items
export function ApplicationPipelineBadge({ status }: { status: string }) {
  const currentStageIndex = getStageIndex(status);
  const isNegative = isNegativeStatus(status);
  const totalStages = PIPELINE_STAGES.length;
  const progress = ((currentStageIndex + 1) / totalStages) * 100;
  
  if (isNegative) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-red-500/50 w-full" />
        </div>
        <span className="text-xs text-red-400 capitalize">{status.replace(/_/g, ' ')}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={cn(
        "text-xs font-medium",
        currentStageIndex === totalStages - 1 ? "text-emerald-400" : "text-cyan-400"
      )}>
        {currentStageIndex + 1}/{totalStages}
      </span>
    </div>
  );
}






