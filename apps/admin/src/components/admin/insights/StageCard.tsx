'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface StageCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'complete' | 'error';
  stageNumber: number;
  stageColor: string; // e.g., 'blue', 'purple', 'green'
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  errorMessage?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'gray',
    label: 'Waiting',
  },
  active: {
    icon: null, // No icon, just border glow
    color: 'current', // Use stageColor
    label: 'In Progress',
  },
  complete: {
    icon: CheckCircle2,
    color: 'green',
    label: 'Complete',
  },
  error: {
    icon: AlertCircle,
    color: 'red',
    label: 'Error',
  },
};

export default function StageCard({
  title,
  description,
  icon: Icon,
  status,
  stageNumber,
  stageColor,
  children,
  collapsible = false,
  defaultExpanded = true,
  errorMessage,
}: StageCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const displayColor = status === 'active' ? stageColor : config.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          status === 'active' && `border-${stageColor}-500/50 shadow-lg shadow-${stageColor}-500/20`,
          status === 'complete' && 'border-green-500/30',
          status === 'error' && 'border-red-500/50',
          status === 'pending' && 'border-white/10 opacity-60'
        )}
      >
        {/* Gradient background for active state */}
        {status === 'active' && (
          <div className={`absolute inset-0 bg-gradient-to-br from-${stageColor}-500/10 to-transparent pointer-events-none`} />
        )}

        {/* Pulsing border for active state */}
        {status === 'active' && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 border-2 border-${stageColor}-500/30 rounded-xl pointer-events-none`}
          />
        )}

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Stage Number Badge */}
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg relative',
                status === 'active' && `bg-${stageColor}-500/20 text-${stageColor}-400 border border-${stageColor}-500/50`,
                status === 'complete' && 'bg-green-500/20 text-green-400 border border-green-500/50',
                status === 'error' && 'bg-red-500/20 text-red-400 border border-red-500/50',
                status === 'pending' && 'bg-white/5 text-gray-500 border border-white/10'
              )}>
                {stageNumber}

                {/* Status icon overlay */}
                {StatusIcon && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center">
                    <StatusIcon className={`w-3 h-3 text-${config.color}-400`} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    status === 'active' && `text-${stageColor}-400`,
                    status === 'complete' && 'text-green-400',
                    status === 'error' && 'text-red-400',
                    status === 'pending' && 'text-gray-500'
                  )} />
                  <CardTitle className={cn(
                    'text-lg',
                    status === 'active' && `text-${stageColor}-400`,
                    status === 'complete' && 'text-green-400',
                    status === 'error' && 'text-red-400',
                    status === 'pending' && 'text-gray-500'
                  )}>
                    {title}
                  </CardTitle>

                  {/* Status Badge */}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                    status === 'active' && `bg-${stageColor}-500/20 text-${stageColor}-300`,
                    status === 'complete' && 'bg-green-500/20 text-green-300',
                    status === 'error' && 'bg-red-500/20 text-red-300',
                    status === 'pending' && 'bg-white/5 text-gray-500'
                  )}>
                    {config.label}
                  </span>
                </div>
                <CardDescription className={status === 'pending' ? 'text-gray-600' : ''}>
                  {description}
                </CardDescription>

                {/* Error message */}
                {status === 'error' && errorMessage && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Collapse toggle */}
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </CardHeader>

        {/* Content */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <CardContent className="relative z-10">
            {children}
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}
