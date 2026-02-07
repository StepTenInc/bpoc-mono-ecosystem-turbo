import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/outbound/campaigns
 * List all campaigns
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error('[API] Error fetching campaigns:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('[API] Error in GET /api/admin/outbound/campaigns:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/outbound/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      subject,
      template_type,
      email_html,
      from_name,
      from_email,
      reply_to,
      batch_size,
      delay_between_batches,
      scheduled_at,
      target_filters,
      notes,
      contact_ids, // Optional: specific contacts to send to
    } = body;

    // Validate required fields
    if (!name || !subject || !email_html) {
      return NextResponse.json({ error: 'Name, subject, and email content are required' }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        name,
        subject,
        template_type: template_type || 'custom',
        email_html,
        from_name: from_name || 'BPOC Team',
        from_email: from_email || 'noreply@bpoc.com',
        reply_to,
        batch_size: batch_size || 50,
        delay_between_batches: delay_between_batches || 5000,
        scheduled_at,
        target_filters: target_filters || {},
        notes,
        status: scheduled_at ? 'scheduled' : 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error('[API] Error creating campaign:', campaignError);
      return NextResponse.json({ error: campaignError?.message || 'Failed to create campaign' }, { status: 500 });
    }

    // Create campaign recipients
    let recipients: any[] = [];

    if (contact_ids && contact_ids.length > 0) {
      // Use specific contacts
      recipients = contact_ids.map((contactId: string) => ({
        campaign_id: campaign.id,
        contact_id: contactId,
      }));
    } else {
      // Use target filters to select contacts
      let query = supabaseAdmin
        .from('outbound_contacts')
        .select('id');

      // Apply filters
      const filters = target_filters || {};

      if (filters.is_registered !== undefined) {
        query = query.eq('is_registered', filters.is_registered);
      }

      if (filters.email_valid !== undefined) {
        query = query.eq('email_valid', filters.email_valid);
      } else {
        // By default, only send to valid emails
        query = query.eq('email_valid', true);
      }

      if (filters.unsubscribed !== undefined) {
        query = query.eq('unsubscribed', filters.unsubscribed);
      } else {
        // By default, don't send to unsubscribed
        query = query.eq('unsubscribed', false);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data: contacts } = await query;

      if (contacts) {
        recipients = contacts.map(contact => ({
          campaign_id: campaign.id,
          contact_id: contact.id,
        }));
      }
    }

    // Insert recipients
    if (recipients.length > 0) {
      const { error: recipientsError } = await supabaseAdmin
        .from('campaign_recipients')
        .insert(recipients);

      if (recipientsError) {
        console.error('[API] Error creating recipients:', recipientsError);
        // Don't fail the campaign creation, just log the error
      }

      // Update campaign total_recipients count
      await supabaseAdmin
        .from('email_campaigns')
        .update({ total_recipients: recipients.length })
        .eq('id', campaign.id);
    }

    return NextResponse.json({
      campaign,
      total_recipients: recipients.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error in POST /api/admin/outbound/campaigns:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
