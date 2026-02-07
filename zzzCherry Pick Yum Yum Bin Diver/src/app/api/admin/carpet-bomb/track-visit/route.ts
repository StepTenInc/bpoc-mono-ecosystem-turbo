import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { email, source, medium, campaign, content, term } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find the lead by email
    const { data: lead, error: leadError } = await supabase
      .from('carpet_bomb_leads')
      .select('id, visited_site, visit_count')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update lead with visit tracking
    const updates: any = {
      visited_site: true,
      visit_count: (lead.visit_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    // Set first visit timestamp if this is first visit
    if (!lead.visited_site) {
      updates.first_visit_at = new Date().toISOString();
    }

    // Update UTM params if provided
    if (source) updates.utm_source = source;
    if (medium) updates.utm_medium = medium;
    if (campaign) updates.utm_campaign = campaign;
    if (content) updates.utm_content = content;
    if (term) updates.utm_term = term;

    const { error: updateError } = await supabase
      .from('carpet_bomb_leads')
      .update(updates)
      .eq('id', lead.id);

    if (updateError) throw updateError;

    // Find campaign if campaign name provided
    let campaignId = null;
    if (campaign) {
      const { data: campaignData } = await supabase
        .from('carpet_bomb_campaigns')
        .select('id')
        .eq('name', campaign)
        .single();

      if (campaignData) {
        campaignId = campaignData.id;
      }
    }

    // Track the link click
    const { error: clickError } = await supabase
      .from('carpet_bomb_link_clicks')
      .insert({
        lead_id: lead.id,
        campaign_id: campaignId,
        url: request.url,
        utm_source: source,
        utm_medium: medium,
        utm_campaign: campaign,
        utm_content: content,
        utm_term: term,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
      });

    if (clickError) {
      console.error('Failed to track click:', clickError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track visit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track visit' },
      { status: 500 }
    );
  }
}
