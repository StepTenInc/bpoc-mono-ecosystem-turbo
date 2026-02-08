'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  XCircle,
  Star,
  Video,
  Calendar,
  X,
  MessageSquare,
  Award,
  Clock,
  User,
  Building2,
  Zap,
  Tag,
  Loader2,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';

export interface ActivityEvent {
  id: string;
  action_type: string;
  performed_by_type: 'candidate' | 'recruiter' | 'client' | 'system';
  performed_by_id?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
  loading?: boolean;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  applied: FileText,
  status_changed: CheckCircle,
  prescreen_completed: Video,
  prescreen_rejected: XCircle,
  client_reviewed: Star,
  interview_scheduled: Calendar,
  interview_completed: CheckCircle,
  interview_cancelled: X,
  offer_sent: DollarSign,
  offer_accepted: CheckCircle,
  offer_rejected: XCircle,
  offer_declined: XCircle,
  rejected: XCircle,
  hired: Award,
  started: CheckCircle,
  no_show: XCircle,
  note_added: MessageSquare,
  rating_added: Star,
  tag_added: Tag,
  onboarding_section_completed: ClipboardCheck,
  other: Zap,
};

const ACTION_COLORS: Record<string, string> = {
  applied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  status_changed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  prescreen_completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  prescreen_rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  client_reviewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  interview_scheduled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  interview_completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  interview_cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  offer_sent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  offer_accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  offer_rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  offer_declined: 'bg-red-500/20 text-red-400 border-red-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  hired: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  started: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  no_show: 'bg-red-500/20 text-red-400 border-red-500/30',
  note_added: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  rating_added: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  tag_added: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  onboarding_section_completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const PERFORMED_BY_LABELS: Record<string, string> = {
  candidate: 'Candidate',
  recruiter: 'Recruiter',
  client: 'Client',
  system: 'System',
};

// Status value to human-readable label mapping (frontend display only)
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offer_pending: 'Offer Pending',
  offer_sent: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  invited: 'Invited',
  started: 'Started',
  no_show: 'No Show',
};

// Format description text by replacing database status values with human-readable labels
const formatDescription = (description: string): string => {
  let formatted = description;
  
  // Replace status values (case-insensitive, whole words only)
  Object.entries(STATUS_LABELS).forEach(([dbValue, label]) => {
    // Match the database value as a whole word (not part of another word)
    const regex = new RegExp(`\\b${dbValue}\\b`, 'gi');
    formatted = formatted.replace(regex, label);
  });
  
  return formatted;
};

export function ActivityTimeline({ events, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No activity yet</p>
            <p className="text-gray-500 text-sm">Activity will appear here as events occur</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = ACTION_ICONS[event.action_type] || Zap;
            const colorClass = ACTION_COLORS[event.action_type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            const performedByLabel = PERFORMED_BY_LABELS[event.performed_by_type] || 'Unknown';

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 group"
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-lg ${colorClass} border shadow-lg`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-full mt-2 bg-gradient-to-b from-white/20 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{formatDescription(event.description)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 text-xs">
                          {performedByLabel}
                        </Badge>
                        {event.metadata?.rating && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {event.metadata.rating}/5
                          </Badge>
                        )}
                        {event.metadata?.tags && Array.isArray(event.metadata.tags) && event.metadata.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {event.metadata.tags.slice(0, 3).map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs whitespace-nowrap">{formatTime(event.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

