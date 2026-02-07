/**
 * Application Path Badge Component
 *
 * Displays which hire path an application is following:
 * - Path 1: Normal Application Flow (with recruiter gate)
 * - Path 2: Direct Talent Pool (bypass screening)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export type HirePath = 'normal' | 'direct';

export interface ApplicationPathBadgeProps {
  hirePath: HirePath;
  releasedToClient?: boolean;
  className?: string;
  showDescription?: boolean;
}

export function ApplicationPathBadge({
  hirePath,
  releasedToClient = false,
  className = '',
  showDescription = false,
}: ApplicationPathBadgeProps) {
  // Direct Hire Path (Path 2)
  if (hirePath === 'direct') {
    return (
      <div className={`flex flex-col ${className}`}>
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
          <span className="text-sm">🚀</span>
          <span className="font-medium">Direct Hire</span>
        </Badge>
        {showDescription && (
          <span className="text-xs text-gray-500 mt-1">
            Client requested interview directly
          </span>
        )}
      </div>
    );
  }

  // Normal Application Flow (Path 1)
  const isReleased = releasedToClient;
  const badgeVariant = isReleased ? 'default' : 'secondary';
  const badgeClasses = isReleased
    ? 'bg-blue-100 text-blue-800 border-blue-300'
    : 'bg-yellow-100 text-yellow-800 border-yellow-300';

  return (
    <div className={`flex flex-col ${className}`}>
      <Badge variant={badgeVariant} className={`flex items-center gap-1 ${badgeClasses}`}>
        <span className="text-sm">📋</span>
        <span className="font-medium">
          {isReleased ? 'Released to Client' : 'Under Review'}
        </span>
      </Badge>
      {showDescription && (
        <span className="text-xs text-gray-500 mt-1">
          {isReleased
            ? 'Application passed recruiter screening'
            : 'Recruiter review in progress'}
        </span>
      )}
    </div>
  );
}

/**
 * Get path description for tooltips/help text
 */
export function getPathDescription(hirePath: HirePath): string {
  if (hirePath === 'direct') {
    return 'Direct Hire: Client found this candidate in the talent pool and requested an interview directly, bypassing recruiter screening.';
  }

  return 'Standard Application: Candidate applied to a job posting. Recruiter will review and release qualified candidates to the client.';
}

/**
 * Get path color for charts/visualizations
 */
export function getPathColor(hirePath: HirePath): { bg: string; text: string; border: string } {
  return hirePath === 'direct'
    ? { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
    : { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
}

export default ApplicationPathBadge;
