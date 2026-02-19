import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/agencies/[id]/webhooks
 * Admin endpoint to view webhooks for an agency (read-only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin (check bpoc_users by auth id)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const { data: user } = await supabase
      .from('bpoc_users')
      .select('role')
      .eq('email', authUser?.user?.email)
      .single();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all webhooks for this agency
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select(`
        id,
        url,
        events,
        description,
        is_active,
        created_at,
        updated_at,
        last_triggered_at
      `)
      .eq('agency_id', (await params).id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    // Get delivery stats for each webhook
    const webhooksWithStats = await Promise.all(
      (webhooks || []).map(async (webhook) => {
        const { count: totalDeliveries } = await supabase
          .from('webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('webhook_id', webhook.id);

        const { count: successfulDeliveries } = await supabase
          .from('webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('webhook_id', webhook.id)
          .eq('status', 'sent');

        const { count: failedDeliveries } = await supabase
          .from('webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('webhook_id', webhook.id)
          .eq('status', 'failed');

        return {
          ...webhook,
          stats: {
            total: totalDeliveries || 0,
            successful: successfulDeliveries || 0,
            failed: failedDeliveries || 0,
          },
        };
      })
    );

    return NextResponse.json({ webhooks: webhooksWithStats });
  } catch (error) {
    console.error('Error in admin webhooks GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
