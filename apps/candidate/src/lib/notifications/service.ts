/**
 * Notification Service
 *
 * Centralized service for creating and managing notifications across the platform
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export type NotificationType =
  | 'incoming_call'
  | 'missed_call'
  | 'application_submitted'
  | 'application_status_changed'
  | 'prescreen_scheduled'
  | 'prescreen_reminder'
  | 'interview_scheduled'
  | 'interview_reminder'
  | 'interview_completed'
  | 'offer_received'
  | 'offer_expiring'
  | 'offer_expired'
  | 'offer_withdrawn'
  | 'offer_accepted'
  | 'offer_declined'
  | 'counter_offer_received'
  | 'counter_response'
  | 'onboarding_task_assigned'
  | 'onboarding_task_due'
  | 'onboarding_started'
  | 'day_one_reminder'
  | 'recording_deletion_scheduled'
  | 'job_approved'
  | 'job_rejected'
  | 'system_announcement';

export interface CreateNotificationParams {
  recipientId: string;
  recipientType: 'candidate' | 'recruiter' | 'client' | 'admin';
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string;
  relatedType?: string;
  isUrgent?: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationService {
  create: (params: CreateNotificationParams) => Promise<{ success: boolean; notificationId?: string; error?: string }>;
  createBatch: (notifications: CreateNotificationParams[]) => Promise<{ success: boolean; count: number; errors: string[] }>;
  markAsRead: (notificationId: string) => Promise<{ success: boolean }>;
  markAllAsRead: (userId: string) => Promise<{ success: boolean }>;
  deleteExpired: () => Promise<{ success: boolean; deleted: number }>;
}

/**
 * Create a single notification
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: params.recipientId,
        recipient_type: params.recipientType,
        type: params.type,
        title: params.title,
        message: params.message,
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        related_id: params.relatedId,
        related_type: params.relatedType,
        is_urgent: params.isUrgent || false,
        is_read: false,
        expires_at: params.expiresAt?.toISOString(),
        metadata: params.metadata,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error('Exception creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create multiple notifications in batch
 */
export async function createBatchNotifications(notifications: CreateNotificationParams[]) {
  const errors: string[] = [];
  let successCount = 0;

  for (const notif of notifications) {
    const result = await createNotification(notif);
    if (result.success) {
      successCount++;
    } else {
      errors.push(`Failed for ${notif.recipientId}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    count: successCount,
    errors,
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception marking notification as read:', error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception marking all notifications as read:', error);
    return { success: false };
  }
}

/**
 * Delete expired notifications (cleanup)
 */
export async function deleteExpiredNotifications() {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) {
      console.error('Error deleting expired notifications:', error);
      return { success: false, deleted: 0 };
    }

    return { success: true, deleted: data?.length || 0 };
  } catch (error) {
    console.error('Exception deleting expired notifications:', error);
    return { success: false, deleted: 0 };
  }
}

/**
 * Notification templates for common scenarios
 */
export const NotificationTemplates = {
  /**
   * Interview reminder (24h, 1h, or 15m before)
   */
  interviewReminder: (
    candidateId: string,
    interviewId: string,
    jobTitle: string,
    scheduledAt: Date,
    timeframe: '24h' | '1h' | '15m'
  ) => {
    const timeMap = {
      '24h': 'tomorrow',
      '1h': 'in 1 hour',
      '15m': 'in 15 minutes',
    };

    return {
      recipientId: candidateId,
      recipientType: 'candidate' as const,
      type: 'interview_reminder' as const,
      title: `Interview Reminder: ${jobTitle}`,
      message: `Your interview for ${jobTitle} is scheduled ${timeMap[timeframe]} at ${scheduledAt.toLocaleTimeString()}. Please be ready 15 minutes early.`,
      actionUrl: `/candidate/interviews`,
      actionLabel: 'View Interview',
      relatedId: interviewId,
      relatedType: 'interview',
      isUrgent: timeframe === '15m',
    };
  },

  /**
   * Offer expiring soon
   */
  offerExpiring: (
    candidateId: string,
    offerId: string,
    jobTitle: string,
    expiresAt: Date
  ) => ({
    recipientId: candidateId,
    recipientType: 'candidate' as const,
    type: 'offer_expiring' as const,
    title: `Offer Expiring Soon: ${jobTitle}`,
    message: `Your job offer for ${jobTitle} expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}. Please accept, decline, or submit a counter offer before it expires.`,
    actionUrl: `/candidate/offers/${offerId}`,
    actionLabel: 'View Offer',
    relatedId: offerId,
    relatedType: 'offer',
    isUrgent: true,
  }),

  /**
   * Day 1 reminder (for candidates who accepted offer)
   */
  dayOneReminder: (
    candidateId: string,
    applicationId: string,
    jobTitle: string,
    startDate: Date
  ) => ({
    recipientId: candidateId,
    recipientType: 'candidate' as const,
    type: 'day_one_reminder' as const,
    title: `Starting Tomorrow: ${jobTitle}`,
    message: `You're starting your new role as ${jobTitle} tomorrow! Make sure you've completed all onboarding tasks. Good luck!`,
    actionUrl: `/candidate/onboarding`,
    actionLabel: 'View Onboarding',
    relatedId: applicationId,
    relatedType: 'application',
    isUrgent: true,
  }),

  /**
   * Missed call notification
   */
  missedCall: (
    candidateId: string,
    roomId: string,
    callerName: string
  ) => ({
    recipientId: candidateId,
    recipientType: 'candidate' as const,
    type: 'missed_call' as const,
    title: `Missed Call from ${callerName}`,
    message: `You missed a video call from ${callerName}. They may reach out again soon.`,
    actionUrl: `/candidate/applications`,
    actionLabel: 'View Applications',
    relatedId: roomId,
    relatedType: 'video_call',
    isUrgent: true,
  }),

  /**
   * Prescreen scheduled
   */
  prescreenScheduled: (
    candidateId: string,
    applicationId: string,
    jobTitle: string,
    scheduledAt: Date
  ) => ({
    recipientId: candidateId,
    recipientType: 'candidate' as const,
    type: 'prescreen_scheduled' as const,
    title: `Pre-screen Scheduled: ${jobTitle}`,
    message: `Your pre-screening call for ${jobTitle} is scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString()}.`,
    actionUrl: `/candidate/applications/${applicationId}`,
    actionLabel: 'View Application',
    relatedId: applicationId,
    relatedType: 'application',
    isUrgent: false,
  }),

  /**
   * Offer expired
   */
  offerExpired: (
    candidateId: string,
    offerId: string,
    jobTitle: string
  ) => ({
    recipientId: candidateId,
    recipientType: 'candidate' as const,
    type: 'offer_expired' as const,
    title: `Offer Expired: ${jobTitle}`,
    message: `Your job offer for ${jobTitle} has expired. Please contact the recruiter if you're still interested in this opportunity.`,
    actionUrl: `/candidate/applications`,
    actionLabel: 'View Applications',
    relatedId: offerId,
    relatedType: 'offer',
    isUrgent: false,
  }),

  /**
   * Offer withdrawn
   */
  offerWithdrawn: (
    candidateId: string,
    offerId: string,
    jobTitle: string,
    reason: string
  ) => ({
    recipientId: candidateId,
    recipientType: 'candidate' as const,
    type: 'offer_withdrawn' as const,
    title: `Offer Withdrawn: ${jobTitle}`,
    message: `The job offer for ${jobTitle} has been withdrawn by the employer. Reason: ${reason}`,
    actionUrl: `/candidate/applications`,
    actionLabel: 'View Applications',
    relatedId: offerId,
    relatedType: 'offer',
    isUrgent: true,
  }),
};

export default {
  create: createNotification,
  createBatch: createBatchNotifications,
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  deleteExpired: deleteExpiredNotifications,
  templates: NotificationTemplates,
};
