/**
 * Platform Status Constants
 *
 * Centralized source of truth for all status values across the platform.
 * These match the database enums and should be used consistently in UI, API, and DB queries.
 */

// ========================================
// APPLICATION STATUSES
// ========================================
export const APPLICATION_STATUS = {
  // Initial states
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',

  // Screening states
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED: 'interviewed',

  // Offer states
  OFFER_SENT: 'offer_sent',
  NEGOTIATING: 'negotiating',
  OFFER_ACCEPTED: 'offer_accepted',

  // Final states
  HIRED: 'hired',
  STARTED: 'started',

  // Rejection/Withdrawal
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  NO_SHOW: 'no_show',
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

// UI Display labels
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [APPLICATION_STATUS.SUBMITTED]: 'Application Submitted',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'Under Review',
  [APPLICATION_STATUS.SHORTLISTED]: 'Shortlisted',
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: 'Interview Scheduled',
  [APPLICATION_STATUS.INTERVIEWED]: 'Interview Completed',
  [APPLICATION_STATUS.OFFER_SENT]: 'Offer Sent',
  [APPLICATION_STATUS.NEGOTIATING]: 'Negotiating Offer',
  [APPLICATION_STATUS.OFFER_ACCEPTED]: 'Offer Accepted',
  [APPLICATION_STATUS.HIRED]: 'Hired',
  [APPLICATION_STATUS.STARTED]: 'Started',
  [APPLICATION_STATUS.REJECTED]: 'Rejected',
  [APPLICATION_STATUS.WITHDRAWN]: 'Withdrawn',
  [APPLICATION_STATUS.NO_SHOW]: 'No Show',
};

// Status aliases (for backward compatibility and user-friendly names)
export const APPLICATION_STATUS_ALIASES: Record<string, ApplicationStatus> = {
  'applied': APPLICATION_STATUS.SUBMITTED,
  'reviewing': APPLICATION_STATUS.UNDER_REVIEW,
  'screening': APPLICATION_STATUS.UNDER_REVIEW,
  'shortlist': APPLICATION_STATUS.SHORTLISTED,
  'interview': APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  'offer': APPLICATION_STATUS.OFFER_SENT,
  'negotiation': APPLICATION_STATUS.NEGOTIATING,
  'accepted': APPLICATION_STATUS.OFFER_ACCEPTED,
  'hired': APPLICATION_STATUS.HIRED,
  'active': APPLICATION_STATUS.STARTED,
  'rejected': APPLICATION_STATUS.REJECTED,
  'withdrawn': APPLICATION_STATUS.WITHDRAWN,
  'no-show': APPLICATION_STATUS.NO_SHOW,
  'noshow': APPLICATION_STATUS.NO_SHOW,
};

/**
 * Normalize status value to canonical form
 */
export function normalizeApplicationStatus(status: string): ApplicationStatus {
  const normalized = status.toLowerCase().trim();
  return APPLICATION_STATUS_ALIASES[normalized] || (normalized as ApplicationStatus);
}

// ========================================
// JOB STATUSES
// ========================================
export const JOB_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
  FILLED: 'filled',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JOB_STATUS.DRAFT]: 'Draft',
  [JOB_STATUS.ACTIVE]: 'Active',
  [JOB_STATUS.PAUSED]: 'Paused',
  [JOB_STATUS.CLOSED]: 'Closed',
  [JOB_STATUS.FILLED]: 'Filled',
};

// ========================================
// INTERVIEW STATUSES
// ========================================
export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
} as const;

export type InterviewStatus = typeof INTERVIEW_STATUS[keyof typeof INTERVIEW_STATUS];

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  [INTERVIEW_STATUS.SCHEDULED]: 'Scheduled',
  [INTERVIEW_STATUS.CONFIRMED]: 'Confirmed',
  [INTERVIEW_STATUS.IN_PROGRESS]: 'In Progress',
  [INTERVIEW_STATUS.COMPLETED]: 'Completed',
  [INTERVIEW_STATUS.CANCELLED]: 'Cancelled',
  [INTERVIEW_STATUS.NO_SHOW]: 'No Show',
  [INTERVIEW_STATUS.RESCHEDULED]: 'Rescheduled',
};

// ========================================
// OFFER STATUSES
// ========================================
export const OFFER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  NEGOTIATING: 'negotiating',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn',
} as const;

export type OfferStatus = typeof OFFER_STATUS[keyof typeof OFFER_STATUS];

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  [OFFER_STATUS.DRAFT]: 'Draft',
  [OFFER_STATUS.SENT]: 'Sent',
  [OFFER_STATUS.VIEWED]: 'Viewed',
  [OFFER_STATUS.ACCEPTED]: 'Accepted',
  [OFFER_STATUS.DECLINED]: 'Declined',
  [OFFER_STATUS.NEGOTIATING]: 'Negotiating',
  [OFFER_STATUS.EXPIRED]: 'Expired',
  [OFFER_STATUS.WITHDRAWN]: 'Withdrawn',
};

// ========================================
// VIDEO CALL STATUSES
// ========================================
export const VIDEO_CALL_STATUS = {
  CREATED: 'created',
  WAITING: 'waiting',
  ACTIVE: 'active',
  ENDED: 'ended',
  FAILED: 'failed',
} as const;

export type VideoCallStatus = typeof VIDEO_CALL_STATUS[keyof typeof VIDEO_CALL_STATUS];

export const VIDEO_CALL_STATUS_LABELS: Record<VideoCallStatus, string> = {
  [VIDEO_CALL_STATUS.CREATED]: 'Created',
  [VIDEO_CALL_STATUS.WAITING]: 'Waiting',
  [VIDEO_CALL_STATUS.ACTIVE]: 'Active',
  [VIDEO_CALL_STATUS.ENDED]: 'Ended',
  [VIDEO_CALL_STATUS.FAILED]: 'Failed',
};

// ========================================
// ONBOARDING TASK STATUSES
// ========================================
export const ONBOARDING_TASK_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  OVERDUE: 'overdue',
} as const;

export type OnboardingTaskStatus = typeof ONBOARDING_TASK_STATUS[keyof typeof ONBOARDING_TASK_STATUS];

export const ONBOARDING_TASK_STATUS_LABELS: Record<OnboardingTaskStatus, string> = {
  [ONBOARDING_TASK_STATUS.PENDING]: 'Pending',
  [ONBOARDING_TASK_STATUS.SUBMITTED]: 'Submitted',
  [ONBOARDING_TASK_STATUS.APPROVED]: 'Approved',
  [ONBOARDING_TASK_STATUS.REJECTED]: 'Rejected',
  [ONBOARDING_TASK_STATUS.OVERDUE]: 'Overdue',
};

// ========================================
// RECORDING STATUSES
// ========================================
export const RECORDING_STATUS = {
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  DELETED: 'deleted',
} as const;

export type RecordingStatus = typeof RECORDING_STATUS[keyof typeof RECORDING_STATUS];

export const RECORDING_STATUS_LABELS: Record<RecordingStatus, string> = {
  [RECORDING_STATUS.PROCESSING]: 'Processing',
  [RECORDING_STATUS.READY]: 'Ready',
  [RECORDING_STATUS.FAILED]: 'Failed',
  [RECORDING_STATUS.DELETED]: 'Deleted',
};

// ========================================
// AGENCY STATUSES
// ========================================
export const AGENCY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export type AgencyStatus = typeof AGENCY_STATUS[keyof typeof AGENCY_STATUS];

export const AGENCY_STATUS_LABELS: Record<AgencyStatus, string> = {
  [AGENCY_STATUS.ACTIVE]: 'Active',
  [AGENCY_STATUS.INACTIVE]: 'Inactive',
  [AGENCY_STATUS.SUSPENDED]: 'Suspended',
  [AGENCY_STATUS.PENDING]: 'Pending',
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if an application status is terminal (no further changes expected)
 */
export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return [
    APPLICATION_STATUS.STARTED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
    APPLICATION_STATUS.NO_SHOW,
  ].includes(status);
}

/**
 * Get the next valid statuses from a given status
 */
export function getNextApplicationStatuses(status: ApplicationStatus): ApplicationStatus[] {
  const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    [APPLICATION_STATUS.SUBMITTED]: [APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.UNDER_REVIEW]: [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.SHORTLISTED]: [APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: [APPLICATION_STATUS.INTERVIEWED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.INTERVIEWED]: [APPLICATION_STATUS.OFFER_SENT, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.OFFER_SENT]: [APPLICATION_STATUS.NEGOTIATING, APPLICATION_STATUS.OFFER_ACCEPTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.NEGOTIATING]: [APPLICATION_STATUS.OFFER_SENT, APPLICATION_STATUS.OFFER_ACCEPTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    [APPLICATION_STATUS.OFFER_ACCEPTED]: [APPLICATION_STATUS.HIRED],
    [APPLICATION_STATUS.HIRED]: [APPLICATION_STATUS.STARTED, APPLICATION_STATUS.NO_SHOW],
    [APPLICATION_STATUS.STARTED]: [],
    [APPLICATION_STATUS.REJECTED]: [],
    [APPLICATION_STATUS.WITHDRAWN]: [],
    [APPLICATION_STATUS.NO_SHOW]: [],
  };

  return transitions[status] || [];
}

/**
 * Get status color for UI (Tailwind classes)
 */
export function getApplicationStatusColor(status: ApplicationStatus): string {
  const colorMap: Record<ApplicationStatus, string> = {
    [APPLICATION_STATUS.SUBMITTED]: 'bg-blue-100 text-blue-800',
    [APPLICATION_STATUS.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800',
    [APPLICATION_STATUS.SHORTLISTED]: 'bg-purple-100 text-purple-800',
    [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: 'bg-indigo-100 text-indigo-800',
    [APPLICATION_STATUS.INTERVIEWED]: 'bg-cyan-100 text-cyan-800',
    [APPLICATION_STATUS.OFFER_SENT]: 'bg-orange-100 text-orange-800',
    [APPLICATION_STATUS.NEGOTIATING]: 'bg-amber-100 text-amber-800',
    [APPLICATION_STATUS.OFFER_ACCEPTED]: 'bg-emerald-100 text-emerald-800',
    [APPLICATION_STATUS.HIRED]: 'bg-green-100 text-green-800',
    [APPLICATION_STATUS.STARTED]: 'bg-green-200 text-green-900',
    [APPLICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800',
    [APPLICATION_STATUS.WITHDRAWN]: 'bg-gray-100 text-gray-800',
    [APPLICATION_STATUS.NO_SHOW]: 'bg-red-200 text-red-900',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

export default {
  APPLICATION_STATUS,
  JOB_STATUS,
  INTERVIEW_STATUS,
  OFFER_STATUS,
  VIDEO_CALL_STATUS,
  ONBOARDING_TASK_STATUS,
  RECORDING_STATUS,
  AGENCY_STATUS,
  normalizeApplicationStatus,
  isTerminalApplicationStatus,
  getNextApplicationStatuses,
  getApplicationStatusColor,
};
