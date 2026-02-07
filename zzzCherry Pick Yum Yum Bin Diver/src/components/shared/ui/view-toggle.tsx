'use client';

import React from 'react';
import { Grid3X3, List, LayoutGrid, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'kanban' | 'table';

interface ViewOption {
  value: ViewMode;
  icon: React.ElementType;
  label: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { value: 'grid', icon: Grid3X3, label: 'Grid view' },
  { value: 'list', icon: List, label: 'List view' },
  { value: 'kanban', icon: Kanban, label: 'Kanban view' },
  { value: 'table', icon: LayoutGrid, label: 'Table view' },
];

interface ViewToggleProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  options?: ViewMode[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ViewToggle({
  value,
  onChange,
  options = ['grid', 'list'],
  className,
  size = 'md',
}: ViewToggleProps) {
  const filteredOptions = VIEW_OPTIONS.filter(opt => options.includes(opt.value));

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn(
      'flex items-center bg-white/5 rounded-lg p-1 border border-white/10',
      className
    )}>
      {filteredOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md transition-all',
              sizeClasses[size],
              isActive
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
            title={option.label}
          >
            <Icon className={iconSizes[size]} />
          </button>
        );
      })}
    </div>
  );
}

export default ViewToggle;








