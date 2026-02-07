/**
 * Audit Service
 *
 * Centralized service for creating audit log entries
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export type AuditAction =
  // Authentication & Access
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_suspended'
  | 'user_reactivated'
  | 'auth_login_success'
  | 'auth_login_failed'
  | 'auth_logout'
  | 'access_granted'
  | 'access_denied'
  // Data Operations
  | 'recording_created'
  | 'recording_viewed'
  | 'recording_shared'
  | 'recording_unshared'
  | 'recording_deleted'
  | 'recording_hard_deleted'
  | 'application_status_changed'
  | 'application_released'
  | 'application_rejected'
  | 'offer_created'
  | 'offer_accepted'
  | 'offer_withdrawn'
  // Configuration
  | 'agency_created'
  | 'agency_updated'
  | 'agency_suspended'
  | 'config_changed'
  | 'retention_policy_updated'
  | 'feature_enabled'
  | 'feature_disabled'
  // Security
  | 'security_breach_detected'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access_attempt'
  // Compliance
  | 'gdpr_request_received'
  | 'gdpr_data_exported'
  | 'gdpr_data_deleted'
  | 'legal_hold_applied'
  | 'legal_hold_released'
  // Admin Override
  | 'admin_override_status'
  | 'admin_force_delete'
  | 'admin_emergency_access';

export type AuditResourceType =
  | 'candidate'
  | 'job'
  | 'job_application'
  | 'video_call_recording'
  | 'video_call_room'
  | 'agency'
  | 'offer'
  | 'interview'
  | 'user'
  | 'config';

export interface CreateAuditLogParams {
  userId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      metadata = {},
      ipAddress,
      userAgent,
      sessionId,
    } = params;

    // Get user info if userId provided
    let userEmail: string | null = null;
    let userRole: string | null = null;

    if (userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, role')
        .eq('id', userId)
        .single();

      if (user) {
        userEmail = user.email;
        userRole = user.role;
      }
    }

    // Determine action category
    const actionCategory = getActionCategory(action);

    // Calculate changes if both old and new values provided
    let changes: Record<string, any> | null = null;
    if (oldValue && newValue) {
      changes = {};
      for (const key in newValue) {
        if (oldValue[key] !== newValue[key]) {
          changes[key] = {
            from: oldValue[key],
            to: newValue[key],
          };
        }
      }
    }

    // Insert audit log
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .insert({
        user_id: userId || null,
        user_email: userEmail,
        user_role: userRole,
        user_ip_address: ipAddress,
        user_agent: userAgent,
        action,
        action_category: actionCategory,
        resource_type: resourceType,
        resource_id: resourceId || null,
        old_value: oldValue || null,
        new_value: newValue || null,
        changes: changes || null,
        metadata,
        session_id: sessionId || null,
        status: 'success',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return { success: false, error: error.message };
    }

    return { success: true, auditId: data.id };
  } catch (error) {
    console.error('Exception creating audit log:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabaseAdmin
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }
    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { success: false, error: error.message, data: null, count: 0 };
    }

    return { success: true, data, count };
  } catch (error) {
    console.error('Exception fetching audit logs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
      count: 0,
    };
  }
}

/**
 * Helper to determine action category
 */
function getActionCategory(action: AuditAction): string {
  if (action.startsWith('user_') || action.startsWith('auth_')) return 'auth';
  if (action.startsWith('recording_') || action.startsWith('data_')) return 'data';
  if (action.startsWith('config_') || action.startsWith('agency_')) return 'config';
  if (action.startsWith('security_') || action.startsWith('access_')) return 'security';
  if (action.startsWith('gdpr_') || action.startsWith('compliance_')) return 'compliance';
  if (action.startsWith('admin_')) return 'admin_override';
  return 'general';
}

/**
 * Convenience functions for common audit scenarios
 */
export const AuditHelpers = {
  /**
   * Log admin override action
   */
  logAdminOverride: async (
    adminId: string,
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    reason: string,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>
  ) => {
    return createAuditLog({
      userId: adminId,
      action,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      metadata: {
        reason,
        override_type: 'admin',
        requires_review: true,
      },
    });
  },

  /**
   * Log GDPR request
   */
  logGDPRRequest: async (
    userId: string,
    requestType: 'export' | 'delete',
    candidateId: string
  ) => {
    const action: AuditAction =
      requestType === 'export' ? 'gdpr_data_exported' : 'gdpr_data_deleted';

    return createAuditLog({
      userId,
      action,
      resourceType: 'candidate',
      resourceId: candidateId,
      metadata: {
        request_type: requestType,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log recording deletion
   */
  logRecordingDeletion: async (
    userId: string,
    recordingId: string,
    isHardDelete: boolean,
    reason?: string
  ) => {
    return createAuditLog({
      userId,
      action: isHardDelete ? 'recording_hard_deleted' : 'recording_deleted',
      resourceType: 'video_call_recording',
      resourceId: recordingId,
      metadata: {
        hard_delete: isHardDelete,
        reason: reason || 'user_requested',
      },
    });
  },
};

export default {
  create: createAuditLog,
  get: getAuditLogs,
  helpers: AuditHelpers,
};
