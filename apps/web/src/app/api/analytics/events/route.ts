import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/analytics/events
 * Batch insert analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Get IP from headers (for geo lookup later if needed)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               null;

    // Transform events for database insert
    const dbEvents = events.map(event => ({
      anon_session_id: event.context?.anonSessionId || null,
      user_id: event.context?.userId || null,
      event_name: event.eventName,
      event_category: event.eventCategory,
      metadata: event.metadata || {},
      page_path: event.pagePath,
      page_title: event.pageTitle,
      referrer: event.context?.referrer || null,
      utm_source: event.context?.utmSource || null,
      utm_medium: event.context?.utmMedium || null,
      utm_campaign: event.context?.utmCampaign || null,
      device_type: event.context?.deviceType || null,
      browser: event.context?.browser || null,
      os: event.context?.os || null,
      user_agent: event.context?.userAgent || null,
      ip_address: ip,
      created_at: event.timestamp || new Date().toISOString()
    }));

    // Batch insert
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert(dbEvents);

    if (error) {
      console.error('Failed to insert analytics events:', error);
      return NextResponse.json({ error: 'Failed to save events' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: dbEvents.length });

  } catch (error) {
    console.error('Analytics events error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
