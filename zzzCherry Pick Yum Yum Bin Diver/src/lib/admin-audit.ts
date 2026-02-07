/**
 * Admin Audit Logging Middleware
 *
 * Provides automatic logging of all administrative actions for compliance and accountability.
 * Every admin action (suspend, reactivate, delete, modify) is logged with:
 * - Who performed the action
 * - What action was performed
 * - Which entity was affected
 * - When it happened
 * - Why (optional reason)
 * 
 * USES SUPABASE DIRECTLY
 */

import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

export interface AuditLogParams {
  adminId: string;
  adminName: string;
  adminEmail?: string;
  action: string;
  entityType: 'agency' | 'candidate' | 'job' | 'application' | 'offer' | 'counter_offer' | 'onboarding_task' | 'other';
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  reason?: string;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(params: AuditLogParams): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: params.adminId,
        admin_name: params.adminName,
        admin_email: params.adminEmail || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName || null,
        details: params.details || null,
        reason: params.reason || null,
      });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (error) {
    // Log to console but don't throw - audit logging failure shouldn't block the action
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(filters?: {
  adminId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.adminId) query = query.eq('admin_id', filters.adminId);
    if (filters?.action) query = query.eq('action', filters.action);
    if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters?.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate.toISOString());
    if (filters?.endDate) query = query.lte('created_at', filters.endDate.toISOString());
    
    query = query.range(
      filters?.offset || 0, 
      (filters?.offset || 0) + (filters?.limit || 100) - 1
    );

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('Failed to get audit logs:', error);
      return { logs: [], total: 0 };
    }

    // Transform logs to include admin object structure expected by API
    const transformedLogs = (logs || []).map(log => ({
      id: log.id,
      admin_id: log.admin_id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      entity_name: log.entity_name,
      details: log.details,
      reason: log.reason,
      created_at: new Date(log.created_at),
      admin: {
        id: log.admin_id,
        first_name: log.admin_name?.split(' ')[0] || 'Admin',
        last_name: log.admin_name?.split(' ').slice(1).join(' ') || '',
        email: log.admin_email,
        avatar_url: null,
      }
    }));

    return { logs: transformedLogs, total: count || 0 };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Common admin actions for type safety
 */
export const ADMIN_ACTIONS = {
  // Agency actions
  SUSPEND_AGENCY: 'suspend_agency',
  REACTIVATE_AGENCY: 'reactivate_agency',
  UPDATE_AGENCY_TIER: 'update_agency_tier',
  DELETE_AGENCY: 'delete_agency',

  // Candidate actions
  SUSPEND_CANDIDATE: 'suspend_candidate',
  REACTIVATE_CANDIDATE: 'reactivate_candidate',
  DELETE_CANDIDATE: 'delete_candidate',

  // Job actions
  SUSPEND_JOB: 'suspend_job',
  REACTIVATE_JOB: 'reactivate_job',
  DELETE_JOB: 'delete_job',

  // Application actions
  CANCEL_APPLICATION: 'cancel_application',
  OVERRIDE_APPLICATION_STATUS: 'override_application_status',

  // Offer actions
  CANCEL_OFFER: 'cancel_offer',
  OVERRIDE_OFFER: 'override_offer',

  // Counter offer actions
  OVERRIDE_COUNTER_OFFER: 'override_counter_offer',

  // Onboarding actions
  OVERRIDE_ONBOARDING_TASK: 'override_onboarding_task',
  EXTEND_TASK_DEADLINE: 'extend_task_deadline',

  // Notes
  ADD_ADMIN_NOTE: 'add_admin_note',
  UPDATE_ADMIN_NOTE: 'update_admin_note',
  DELETE_ADMIN_NOTE: 'delete_admin_note',

  // System
  UPDATE_PLATFORM_SETTINGS: 'update_platform_settings',
  BULK_ACTION: 'bulk_action',
} as const;

/**
 * Check if user is an admin (uses bpoc_users table)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('bpoc_users')
      .select('id, role, is_active')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    
    return data.is_active && ['admin', 'super_admin'].includes(data.role);
  } catch {
    return false;
  }
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('bpoc_users')
      .select('id, role, is_active')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    
    return data.is_active && data.role === 'super_admin';
  } catch {
    return false;
  }
}

/**
 * Get admin user details
 */
export async function getAdminUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('bpoc_users')
      .select('id, email, first_name, last_name, role, is_active, avatar_url')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    
    return {
      id: data.id,
      user_id: data.id,
      role: data.role,
      is_active: data.is_active,
      user: {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        avatar_url: data.avatar_url,
      }
    };
  } catch {
    return null;
  }
}
