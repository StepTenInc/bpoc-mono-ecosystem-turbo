'use client';

import React from 'react';
import { CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';

interface BatchActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  loading?: boolean;
  actions?: Array<{
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'success';
  }>;
}

export default function BatchActionsBar({
  selectedCount,
  onClear,
  onApprove,
  onReject,
  loading,
  actions
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-cyan-500/90 to-purple-600/90 backdrop-blur-lg border border-white/20 rounded-full px-6 py-3 shadow-2xl shadow-cyan-500/25">
        <div className="flex items-center gap-4">
          <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
            {selectedCount} selected
          </Badge>

          <div className="h-6 w-px bg-white/30" />

          {actions ? (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'default'}
                    className={
                      action.variant === 'success'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : action.variant === 'destructive'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                    }
                    onClick={action.onClick}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Icon className="h-4 w-4 mr-1" />
                        {action.label}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          ) : (
            <>
              {onApprove && (
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={onApprove}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All
                    </>
                  )}
                </Button>
              )}

              {onReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={onReject}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject All
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          <div className="h-6 w-px bg-white/30" />

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
