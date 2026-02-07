import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/outbound/campaigns/[id]
 * Get campaign details with recipients
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get recipient stats
    const { data: recipientStats } = await supabaseAdmin
      .from('campaign_recipients')
      .select('status')
      .eq('campaign_id', id);

    const stats = {
      pending: recipientStats?.filter(r => r.status === 'pending').length || 0,
      sent: recipientStats?.filter(r => r.status === 'sent').length || 0,
      failed: recipientStats?.filter(r => r.status === 'failed').length || 0,
      bounced: recipientStats?.filter(r => r.status === 'bounced').length || 0,
      opened: recipientStats?.filter(r => r.status === 'opened').length || 0,
      clicked: recipientStats?.filter(r => r.status === 'clicked').length || 0,
      skipped: recipientStats?.filter(r => r.status === 'skipped').length || 0,
    };

    return NextResponse.json({
      campaign,
      stats,
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/admin/outbound/campaigns/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/outbound/campaigns/[id]
 * Update campaign
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Can only update draft campaigns
    const { data: existing } = await supabaseAdmin
      .from('email_campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existing.status !== 'draft' && existing.status !== 'scheduled') {
      return NextResponse.json({ error: 'Can only update draft or scheduled campaigns' }, { status: 400 });
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('email_campaigns')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('[API] Error in PUT /api/admin/outbound/campaigns/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/outbound/campaigns/[id]
 * Delete campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Can only delete draft campaigns
    const { data: existing } = await supabaseAdmin
      .from('email_campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Can only delete draft campaigns' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/admin/outbound/campaigns/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
