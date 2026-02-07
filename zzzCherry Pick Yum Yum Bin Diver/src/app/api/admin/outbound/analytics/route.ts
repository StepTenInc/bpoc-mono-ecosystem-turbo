import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/outbound/analytics
 * Get email campaign analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get overall stats
    const { data: contacts } = await supabaseAdmin
      .from('outbound_contacts')
      .select('id, is_registered, email_valid, unsubscribed, total_emails_sent');

    const totalContacts = contacts?.length || 0;
    const registeredContacts = contacts?.filter(c => c.is_registered).length || 0;
    const validEmails = contacts?.filter(c => c.email_valid).length || 0;
    const unsubscribed = contacts?.filter(c => c.unsubscribed).length || 0;
    const totalEmailsSent = contacts?.reduce((sum, c) => sum + (c.total_emails_sent || 0), 0) || 0;

    // Get campaign stats
    const { data: campaigns } = await supabaseAdmin
      .from('email_campaigns')
      .select('*');

    const totalCampaigns = campaigns?.length || 0;
    const activeCampaigns = campaigns?.filter(c => c.status === 'sending').length || 0;
    const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;

    const totalSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
    const totalOpened = campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0;
    const totalClicked = campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0;
    const totalBounced = campaigns?.reduce((sum, c) => sum + (c.bounced_count || 0), 0) || 0;
    const totalFailed = campaigns?.reduce((sum, c) => sum + (c.failed_count || 0), 0) || 0;

    // Calculate rates
    const deliveryRate = totalSent > 0 ? ((totalSent - totalBounced) / totalSent) * 100 : 0;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Get recent activity
    const { data: recentActivity } = await supabaseAdmin
      .from('email_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Get top performing campaigns
    const topCampaigns = campaigns
      ?.sort((a, b) => (b.opened_count || 0) - (a.opened_count || 0))
      .slice(0, 10);

    return NextResponse.json({
      overview: {
        totalContacts,
        registeredContacts,
        validEmails,
        unsubscribed,
        totalEmailsSent,
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
      },
      emailStats: {
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        totalFailed,
        deliveryRate: deliveryRate.toFixed(2),
        openRate: openRate.toFixed(2),
        clickRate: clickRate.toFixed(2),
        bounceRate: bounceRate.toFixed(2),
      },
      topCampaigns,
      recentActivity: recentActivity?.slice(0, 20),
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/admin/outbound/analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
