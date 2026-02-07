import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/notifications/broadcast
 * Create a broadcast notification (single row) targeted by role and optional agency scope.
 *
 * Body:
 * - type: string (required)
 * - title: string (required)
 * - message: string (required)
 * - targetRole?: 'candidate' | 'recruiter' | 'admin' | null
 * - agencyId?: string | null (uuid) (only meaningful for recruiter broadcasts)
 * - actionUrl?: string | null
 * - actionLabel?: string | null
 * - expiresAt?: string | null (ISO)
 * - isUrgent?: boolean
 * - metadata?: any
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    if (!userId) return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });

    // Verify admin
    const { data: bpocUser } = await supabaseAdmin
      .from('bpoc_users')
      .select('id,is_active')
      .eq('id', userId)
      .single();
    if (!bpocUser || !(bpocUser as any).is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      type,
      title,
      message,
      targetRole,
      agencyId,
      actionUrl,
      actionLabel,
      expiresAt,
      isUrgent,
      metadata,
    } = body || {};

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'type, title, and message are required' }, { status: 400 });
    }

    const insert = {
      user_id: null,
      target_role: targetRole ?? null,
      agency_id: agencyId ?? null,
      type,
      title,
      message,
      action_url: actionUrl ?? null,
      action_label: actionLabel ?? null,
      is_read: false,
      is_urgent: !!isUrgent,
      metadata: metadata ?? {},
      expires_at: expiresAt ?? null,
      created_by_user_id: userId,
      created_by_role: 'admin',
    };

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[admin broadcast] insert failed:', error);
      return NextResponse.json({ error: 'Failed to create broadcast notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (e) {
    console.error('[admin broadcast] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


