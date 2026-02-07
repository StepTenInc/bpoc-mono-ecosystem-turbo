'use client';

import React from 'react';
import { Button } from '@/components/shared/ui/button';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 text-center max-w-md mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

