'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Zap, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

interface PipelineLoaderProps {
  status: string;
  progress?: number; // 0-100
  stage?: 'preparing' | 'processing' | 'analyzing' | 'finalizing';
  stageColor?: string; // e.g., 'blue', 'purple', 'green'
  estimatedTime?: number; // seconds remaining
  canCancel?: boolean;
  onCancel?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

const stageConfig = {
  preparing: {
    icon: Sparkles,
    label: 'Preparing',
    color: 'cyan',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    color: 'blue',
  },
  analyzing: {
    icon: Zap,
    label: 'Analyzing',
    color: 'purple',
  },
  finalizing: {
    icon: CheckCircle2,
    label: 'Finalizing',
    color: 'green',
  },
};

export default function PipelineLoader({
  status,
  progress = 0,
  stage = 'processing',
  stageColor,
  estimatedTime,
  canCancel,
  onCancel,
  error,
  onRetry,
}: PipelineLoaderProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;
  const color = stageColor || config.color;

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-red-400 font-semibold mb-1">Operation Failed</h3>
            <p className="text-gray-300 text-sm mb-4">{error}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-6 relative overflow-hidden`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            background: [
              `linear-gradient(90deg, transparent, var(--tw-gradient-from) 50%, transparent)`,
            ],
            x: ['-100%', '100%'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-0 from-${color}-500/20`}
          style={{ width: '50%' }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: stage === 'processing' || stage === 'analyzing' ? 360 : 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Icon className={`w-6 h-6 text-${color}-400`} />
            </motion.div>
            <div>
              <div className={`text-${color}-400 font-semibold text-sm`}>
                {config.label}
              </div>
              <div className="text-white font-medium">{status}</div>
            </div>
          </div>

          {canCancel && onCancel && (
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={`text-${color}-400 font-medium`}>{Math.round(progress)}%</span>
            {estimatedTime !== undefined && estimatedTime > 0 && (
              <span className="text-gray-400">
                ~{estimatedTime}s remaining
              </span>
            )}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400 rounded-full relative`}
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ width: '50%' }}
              />
            </motion.div>
          </div>
        </div>

        {/* Pulsing dots */}
        <div className="flex items-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className={`w-2 h-2 rounded-full bg-${color}-400`}
            />
          ))}
          <span className="text-gray-400 text-xs ml-2">
            Processing your request...
          </span>
        </div>
      </div>
    </motion.div>
  );
}
