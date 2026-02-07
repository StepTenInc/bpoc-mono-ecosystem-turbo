import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAdminFromSession, requireAdmin } from '@/lib/admin-helpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();
    const admin = await getAdminFromSession();

    // Rate limiting
    const rateLimitResult = checkRateLimit(admin.adminId, RATE_LIMITS.NOTIFICATIONS);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before sending more notifications.',
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { userIds, title, message, type, link } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      );
    }

    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: type || 'info',
      link: link || null,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${userIds.length} users`,
      sentCount: data?.length || 0,
    });

  } catch (error) {
    console.error('Batch notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send batch notifications' },
      { status: 500 }
    );
  }
}
