'use client';

import React from 'react';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface StatusStepperProps {
  steps: Step[];
  currentStatus: string;
  rejectedStatus?: string; // Status key that indicates rejection
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showLabels?: boolean;
}

export function StatusStepper({
  steps,
  currentStatus,
  rejectedStatus = 'rejected',
  className,
  variant = 'default',
  showLabels = false,
}: StatusStepperProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStatus);
  const isRejected = currentStatus === rejectedStatus;

  const sizeClasses = {
    default: 'w-8 h-8',
    compact: 'w-6 h-6',
    minimal: 'w-5 h-5',
  };

  const iconSizes = {
    default: 'h-4 w-4',
    compact: 'h-3 w-3',
    minimal: 'h-2.5 w-2.5',
  };

  const connectorWidth = {
    default: 'w-8',
    compact: 'w-4',
    minimal: 'w-3',
  };

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = !isRejected && index < currentIndex;
        const isCurrent = !isRejected && index === currentIndex;
        const isPast = isCompleted || isCurrent;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all',
                  sizeClasses[variant],
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-orange-500 text-white ring-2 ring-orange-500/30',
                  !isPast && 'bg-white/5 text-gray-500',
                  isRejected && index === 0 && 'bg-red-500/20 text-red-400'
                )}
                title={step.label}
              >
                {isCompleted ? (
                  <Check className={iconSizes[variant]} />
                ) : (
                  <StepIcon className={iconSizes[variant]} />
                )}
              </div>
              {showLabels && variant === 'default' && (
                <span className={cn(
                  'text-xs mt-1 whitespace-nowrap',
                  isCurrent ? 'text-orange-400 font-medium' : 'text-gray-500'
                )}>
                  {step.label}
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5',
                  connectorWidth[variant],
                  isCompleted && 'bg-emerald-500',
                  isCurrent && 'bg-gradient-to-r from-orange-500 to-gray-600',
                  !isPast && 'bg-white/10'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Pre-configured steppers for common use cases
export const APPLICATION_STEPS: Step[] = [
  { key: 'submitted', label: 'Applied', icon: require('lucide-react').FileText },
  { key: 'under_review', label: 'Reviewing', icon: require('lucide-react').Eye },
  { key: 'shortlisted', label: 'Shortlisted', icon: require('lucide-react').Star },
  { key: 'interview_scheduled', label: 'Interview', icon: require('lucide-react').Video },
  { key: 'offer_sent', label: 'Offer', icon: require('lucide-react').Gift },
  { key: 'hired', label: 'Hired', icon: require('lucide-react').Award },
];

export const INTERVIEW_STEPS: Step[] = [
  { key: 'scheduled', label: 'Scheduled', icon: require('lucide-react').Calendar },
  { key: 'in_progress', label: 'In Progress', icon: require('lucide-react').Video },
  { key: 'completed', label: 'Completed', icon: require('lucide-react').CheckCircle },
  { key: 'passed', label: 'Passed', icon: require('lucide-react').ThumbsUp },
];

export const OFFER_STEPS: Step[] = [
  { key: 'draft', label: 'Draft', icon: require('lucide-react').FileText },
  { key: 'sent', label: 'Sent', icon: require('lucide-react').Send },
  { key: 'viewed', label: 'Viewed', icon: require('lucide-react').Eye },
  { key: 'accepted', label: 'Accepted', icon: require('lucide-react').CheckCircle },
];

export default StatusStepper;








