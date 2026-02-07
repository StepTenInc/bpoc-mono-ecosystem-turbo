import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/webhooks/[id]
 * Get webhook details and recent deliveries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Get webhook
    const { data: webhook, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('id', params.id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (error || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get recent deliveries
    const { data: deliveries } = await supabaseAdmin
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      webhook: {
        ...webhook,
        secret: '••••••••', // Don't expose secret
      },
      recentDeliveries: deliveries || [],
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/webhooks/[id]
 * Update webhook configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, role')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Only owners/admins can update webhooks
    if (recruiter.role !== 'owner' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Only agency owners/admins can manage webhooks' }, { status: 403 });
    }

    // Verify webhook belongs to agency
    const { data: webhook } = await supabaseAdmin
      .from('webhooks')
      .select('id')
      .eq('id', params.id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const body = await request.json();
    const { url, events, description, is_active } = body;

    const updates: any = {};

    if (url !== undefined) {
      if (!url.match(/^https?:\/\//)) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
      updates.url = url;
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: 'At least one event must be specified' }, { status: 400 });
      }
      updates.events = events;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    // Update webhook
    const { data: updated, error } = await supabaseAdmin
      .from('webhooks')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      webhook: {
        ...updated,
        secret: '••••••••', // Don't expose secret
      },
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/recruiter/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, role')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Only owners/admins can delete webhooks
    if (recruiter.role !== 'owner' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Only agency owners/admins can manage webhooks' }, { status: 403 });
    }

    // Verify webhook belongs to agency
    const { data: webhook } = await supabaseAdmin
      .from('webhooks')
      .select('id')
      .eq('id', params.id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete webhook (cascade will delete deliveries)
    const { error } = await supabaseAdmin
      .from('webhooks')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
