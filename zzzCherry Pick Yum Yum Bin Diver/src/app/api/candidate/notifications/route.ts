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

    // 1) User-specific notifications
    const { data: direct } = await supabaseAdmin
      .from('notifications')
      .select('id,type,title,message,action_url,action_label,metadata,is_read,is_urgent,created_at,expires_at,user_id,target_role,agency_id')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(50);

    // 2) Broadcast notifications for candidates (user_id NULL and target_role NULL or 'candidate')
    const { data: broadcast } = await supabaseAdmin
      .from('notifications')
      .select('id,type,title,message,action_url,action_label,metadata,is_read,is_urgent,created_at,expires_at,user_id,target_role,agency_id')
      .is('user_id', null)
      .or(`target_role.is.null,target_role.eq.candidate`)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(50);

    const all = [...(direct || []), ...(broadcast || [])];

    // Fetch read status for broadcasts
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

    // Normalize + compute unread
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
      .slice(0, 20)
      .map(({ _sort, ...rest }: any) => rest);

    const unreadCount = normalized.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      notifications: normalized,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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

      // Mark all candidate broadcasts as read for this user by inserting into notification_reads
      const nowIso = new Date().toISOString();
      const { data: broadcast } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .is('user_id', null)
        .or(`target_role.is.null,target_role.eq.candidate`)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .limit(200);

      const broadcastIds = (broadcast || []).map((n: any) => n.id);
      if (broadcastIds.length > 0) {
        await supabaseAdmin
          .from('notification_reads')
          .upsert(
            broadcastIds.map((id: string) => ({ notification_id: id, user_id: userId })),
            { onConflict: 'notification_id,user_id' }
          );
      }
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // Determine if broadcast
      const { data: n } = await supabaseAdmin
        .from('notifications')
        .select('id,user_id')
        .eq('id', notificationId)
        .single();

      if (!n) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

      if (n.user_id) {
        // user-specific: must belong to user
        if (n.user_id !== userId) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', notificationId);
      } else {
        // broadcast: mark read via receipt
        await supabaseAdmin
          .from('notification_reads')
          .upsert({ notification_id: notificationId, user_id: userId }, { onConflict: 'notification_id,user_id' });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
