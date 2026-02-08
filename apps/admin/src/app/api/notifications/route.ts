import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // Ensure user is a BPOC admin (defense-in-depth)
    const { data: bpocUser } = await supabase
      .from('bpoc_users')
      .select('id,is_active')
      .eq('id', userId)
      .single();
    if (!bpocUser || !(bpocUser as any).is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // User-specific notifications
    const { data: direct } = await supabase
      .from('notifications')
      .select('id,type,title,message,action_url,action_label,metadata,is_read,is_urgent,created_at,expires_at,user_id,target_role,agency_id')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(80);

    // Broadcast notifications for admins
    const { data: broadcast } = await supabase
      .from('notifications')
      .select('id,type,title,message,action_url,action_label,metadata,is_read,is_urgent,created_at,expires_at,user_id,target_role,agency_id')
      .is('user_id', null)
      .or(`target_role.is.null,target_role.eq.admin`)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(80);

    const all = [...(direct || []), ...(broadcast || [])];

    const broadcastIds = (broadcast || []).map((n: any) => n.id);
    let readSet = new Set<string>();
    if (broadcastIds.length > 0) {
      const { data: reads } = await supabase
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
          action_url: n.action_url || undefined,
          action_label: n.action_label || undefined,
          metadata: n.metadata,
          is_read: isRead,
          is_urgent: !!n.is_urgent,
          created_at: n.created_at,
          _sort: new Date(n.created_at).getTime(),
        };
      })
      .sort((a: any, b: any) => b._sort - a._sort)
      .slice(0, 50)
      .map(({ _sort, ...rest }: any) => rest);

    const unreadCount = normalized.filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      notifications: normalized,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { data: bpocUser } = await supabase
      .from('bpoc_users')
      .select('id,is_active')
      .eq('id', userId)
      .single();
    if (!bpocUser || !(bpocUser as any).is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { notification_id, mark_all_read } = await request.json();

    if (mark_all_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      const nowIso = new Date().toISOString();
      const { data: broadcast } = await supabase
        .from('notifications')
        .select('id')
        .is('user_id', null)
        .or(`target_role.is.null,target_role.eq.admin`)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .limit(500);

      const ids = (broadcast || []).map((n: any) => n.id);
      if (ids.length > 0) {
        await supabase
          .from('notification_reads')
          .upsert(ids.map((id: string) => ({ notification_id: id, user_id: userId })), { onConflict: 'notification_id,user_id' });
      }
      return NextResponse.json({ success: true });
    }

    if (notification_id) {
      const { data: n } = await supabase
        .from('notifications')
        .select('id,user_id')
        .eq('id', notification_id)
        .single();

      if (!n) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

      if (n.user_id) {
        if (n.user_id !== userId) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        await supabase.from('notifications').update({ is_read: true }).eq('id', notification_id);
      } else {
        await supabase
          .from('notification_reads')
          .upsert({ notification_id: notification_id, user_id: userId }, { onConflict: 'notification_id,user_id' });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating admin notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}


