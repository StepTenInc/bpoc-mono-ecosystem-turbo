import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // Find recruiter's agency for agency-scoped broadcasts
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();
    const agencyId = (recruiter as any)?.agency_id || null;

    // 1) User-specific notifications
    const { data: direct } = await supabaseAdmin
      .from('notifications')
      .select('id,type,title,message,action_url,action_label,metadata,is_read,is_urgent,created_at,expires_at,user_id,target_role,agency_id')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(60);

    // 2) Broadcast notifications for recruiters (role-scoped) and optional agency scope
    let broadcastQuery = supabaseAdmin
      .from('notifications')
      .select('id,type,title,message,action_url,action_label,metadata,is_read,is_urgent,created_at,expires_at,user_id,target_role,agency_id')
      .is('user_id', null)
      .or(`target_role.is.null,target_role.eq.recruiter`)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(60);

    if (agencyId) {
      broadcastQuery = broadcastQuery.or(`agency_id.is.null,agency_id.eq.${agencyId}`);
    } else {
      broadcastQuery = broadcastQuery.is('agency_id', null);
    }

    const { data: broadcast } = await broadcastQuery;

    const all = [...(direct || []), ...(broadcast || [])];

    // Read receipts for broadcasts
    const broadcastIds = (broadcast || []).map((n: any) => n.id);
    let readSet = new Set<string>();
    if (broadcastIds.length > 0) {
      const { data: reads } = await supabaseAdmin
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId)
        .in('notification_id', broadcastIds);
      readSet = new Set((reads || []).map((r: any) => r.notification_id));
    }

    const normalized = all
      .map((n: any) => {
        const isBroadcast = !n.user_id;
        const isRead = isBroadcast ? readSet.has(n.id) : !!n.is_read;
        return {
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          actionUrl: n.action_url || undefined,
          actionLabel: n.action_label || undefined,
          metadata: n.metadata,
          isRead,
          isUrgent: !!n.is_urgent,
          createdAt: n.created_at,
          _sort: new Date(n.created_at).getTime(),
        };
      })
      .sort((a: any, b: any) => b._sort - a._sort)
      .slice(0, 30)
      .map(({ _sort, ...rest }: any) => rest);

    const unreadCount = normalized.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      notifications: normalized,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching recruiter notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      // Mark user-specific as read
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      // Mark all recruiter broadcasts as read for this user (respect agency scope)
      const nowIso = new Date().toISOString();
      const { data: recruiter } = await supabaseAdmin
        .from('agency_recruiters')
        .select('agency_id')
        .eq('user_id', userId)
        .single();
      const agencyId = (recruiter as any)?.agency_id || null;

      let q = supabaseAdmin
        .from('notifications')
        .select('id')
        .is('user_id', null)
        .or(`target_role.is.null,target_role.eq.recruiter`)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .limit(400);

      if (agencyId) q = q.or(`agency_id.is.null,agency_id.eq.${agencyId}`);
      else q = q.is('agency_id', null);

      const { data: broadcast } = await q;
      const ids = (broadcast || []).map((n: any) => n.id);
      if (ids.length > 0) {
        await supabaseAdmin
          .from('notification_reads')
          .upsert(ids.map((id: string) => ({ notification_id: id, user_id: userId })), { onConflict: 'notification_id,user_id' });
      }
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      const { data: n } = await supabaseAdmin
        .from('notifications')
        .select('id,user_id')
        .eq('id', notificationId)
        .single();

      if (!n) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

      if (n.user_id) {
        if (n.user_id !== userId) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', notificationId);
      } else {
        await supabaseAdmin
          .from('notification_reads')
          .upsert({ notification_id: notificationId, user_id: userId }, { onConflict: 'notification_id,user_id' });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating recruiter notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}


