/**
 * Admin Audit Log API
 *
 * GET /api/admin/audit-log  - View all admin actions (compliance requirement)
 *
 * Query parameters:
 * - adminId: Filter by admin who performed action
 * - action: Filter by action type
 * - entityType: Filter by entity type
 * - entityId: Filter by specific entity
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - page: Pagination
 * - limit: Results per page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { getAuditLogs, isAdmin } from '@/lib/admin-audit';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);

    // 2. Check if user is admin
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 4. Fetch audit logs
    const { logs, total } = await getAuditLogs({
      adminId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      limit,
      offset: (page - 1) * limit,
    });

    // 5. Format response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      admin: {
        id: log.admin.id,
        name: `${log.admin.first_name} ${log.admin.last_name}`,
        email: log.admin.email,
        avatar: log.admin.avatar_url,
      },
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      entityName: log.entity_name,
      details: log.details,
      reason: log.reason,
      createdAt: log.created_at.toISOString(),
    }));

    // 6. Calculate action statistics
    const actionStats = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      logs: formattedLogs,
      stats: {
        total,
        returned: formattedLogs.length,
        actionBreakdown: actionStats,
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
