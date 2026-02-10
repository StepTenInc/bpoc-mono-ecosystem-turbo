/**
 * Security Audit Logging
 * 
 * Logs security-relevant events for monitoring and compliance
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export type AuditEventType =
  | 'auth.login_success'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'auth.api_key_created'
  | 'auth.api_key_regenerated'
  | 'api.rate_limit_exceeded'
  | 'api.invalid_key'
  | 'api.unauthorized_access'
  | 'data.candidate_viewed'
  | 'data.candidate_exported'
  | 'data.bulk_export'
  | 'data.pii_accessed'
  | 'webhook.delivery_failed'
  | 'webhook.signature_invalid'
  | 'file.upload_rejected'
  | 'file.malicious_detected'
  | 'admin.settings_changed'
  | 'admin.user_invited'
  | 'admin.user_removed';

export interface AuditLogEntry {
  event_type: AuditEventType;
  actor_id?: string;        // User or API key ID
  actor_type?: 'user' | 'api_key' | 'system';
  agency_id?: string;
  resource_type?: string;   // e.g., 'candidate', 'job', 'application'
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Log a security audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('security_audit_log')
      .insert({
        event_type: entry.event_type,
        actor_id: entry.actor_id,
        actor_type: entry.actor_type || 'user',
        agency_id: entry.agency_id,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        metadata: entry.metadata || {},
        severity: entry.severity || 'info',
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Log to console if DB write fails (don't throw - audit logging shouldn't break the app)
      console.error('[AUDIT] Failed to write audit log:', error);
    }
  } catch (err) {
    console.error('[AUDIT] Error writing audit log:', err);
  }
}

/**
 * Log failed authentication attempt
 */
export async function logAuthFailure(
  reason: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    event_type: 'auth.login_failed',
    actor_type: 'system',
    ip_address: ipAddress,
    user_agent: userAgent,
    severity: 'warning',
    metadata: { reason, ...metadata },
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  agencyId: string,
  ipAddress?: string,
  endpoint?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'api.rate_limit_exceeded',
    actor_type: 'api_key',
    agency_id: agencyId,
    ip_address: ipAddress,
    severity: 'warning',
    metadata: { endpoint },
  });
}

/**
 * Log unauthorized API access attempt
 */
export async function logUnauthorizedAccess(
  reason: string,
  ipAddress?: string,
  userAgent?: string,
  endpoint?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'api.unauthorized_access',
    actor_type: 'system',
    ip_address: ipAddress,
    user_agent: userAgent,
    severity: 'error',
    metadata: { reason, endpoint },
  });
}

/**
 * Log file upload rejection
 */
export async function logFileUploadRejected(
  reason: string,
  filename: string,
  userId?: string,
  agencyId?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'file.upload_rejected',
    actor_id: userId,
    actor_type: 'user',
    agency_id: agencyId,
    severity: 'warning',
    metadata: { reason, filename },
  });
}

/**
 * Log PII data access
 */
export async function logPiiAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  agencyId?: string,
  action: 'view' | 'export' | 'download' = 'view'
): Promise<void> {
  await logAuditEvent({
    event_type: 'data.pii_accessed',
    actor_id: userId,
    actor_type: 'user',
    agency_id: agencyId,
    resource_type: resourceType,
    resource_id: resourceId,
    severity: 'info',
    metadata: { action },
  });
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
