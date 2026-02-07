import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Overall stats
    const { data: totalLeads, error: totalError } = await supabase
      .from('carpet_bomb_leads')
      .select('id', { count: 'exact', head: true });

    const { data: contactedLeads, error: contactedError } = await supabase
      .from('carpet_bomb_leads')
      .select('id', { count: 'exact', head: true })
      .eq('been_contacted', true);

    const { data: visitedLeads, error: visitedError } = await supabase
      .from('carpet_bomb_leads')
      .select('id', { count: 'exact', head: true })
      .eq('visited_site', true);

    const { data: signedUpLeads, error: signedUpError } = await supabase
      .from('carpet_bomb_leads')
      .select('id', { count: 'exact', head: true })
      .eq('signed_up', true);

    const { data: unsubscribedLeads, error: unsubscribedError } = await supabase
      .from('carpet_bomb_leads')
      .select('id', { count: 'exact', head: true })
      .eq('unsubscribed', true);

    // Engagement stats
    const { data: engagementData } = await supabase
      .from('carpet_bomb_leads')
      .select('total_emails_sent, total_emails_opened, total_emails_clicked');

    let totalEmailsSent = 0;
    let totalEmailsOpened = 0;
    let totalEmailsClicked = 0;

    engagementData?.forEach((lead) => {
      totalEmailsSent += lead.total_emails_sent || 0;
      totalEmailsOpened += lead.total_emails_opened || 0;
      totalEmailsClicked += lead.total_emails_clicked || 0;
    });

    // Source breakdown
    const { data: sourceBreakdown } = await supabase
      .from('carpet_bomb_leads')
      .select('original_source');

    const sourceCounts: Record<string, number> = {};
    sourceBreakdown?.forEach((lead) => {
      const source = lead.original_source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Campaign stats
    const { data: campaigns } = await supabase
      .from('carpet_bomb_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Conversion funnel
    const total = totalLeads?.length || 0;
    const contacted = contactedLeads?.length || 0;
    const visited = visitedLeads?.length || 0;
    const signedUp = signedUpLeads?.length || 0;

    const contactRate = total > 0 ? ((contacted / total) * 100).toFixed(1) : '0';
    const visitRate = contacted > 0 ? ((visited / contacted) * 100).toFixed(1) : '0';
    const conversionRate = visited > 0 ? ((signedUp / visited) * 100).toFixed(1) : '0';
    const overallConversion = total > 0 ? ((signedUp / total) * 100).toFixed(1) : '0';

    const openRate = totalEmailsSent > 0 ? ((totalEmailsOpened / totalEmailsSent) * 100).toFixed(1) : '0';
    const clickRate = totalEmailsSent > 0 ? ((totalEmailsClicked / totalEmailsSent) * 100).toFixed(1) : '0';

    return NextResponse.json({
      overview: {
        totalLeads: total,
        contacted,
        visited,
        signedUp,
        unsubscribed: unsubscribedLeads?.length || 0,
      },
      funnel: {
        contactRate,
        visitRate,
        conversionRate,
        overallConversion,
      },
      engagement: {
        totalEmailsSent,
        totalEmailsOpened,
        totalEmailsClicked,
        openRate,
        clickRate,
      },
      sources: sourceCounts,
      recentCampaigns: campaigns || [],
    });
  } catch (error: any) {
    console.error('Fetch stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
