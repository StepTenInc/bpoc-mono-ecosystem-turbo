import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import crypto from 'crypto';

/**
 * GET /api/recruiter/webhooks
 * List all webhooks for the recruiter's agency
 */
export async function GET(request: NextRequest) {
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

    // Get all webhooks for this agency
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select(`
        id,
        url,
        events,
        description,
        is_active,
        created_at,
        updated_at,
        last_triggered_at,
        created_by
      `)
      .eq('agency_id', recruiter.agency_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    // Get delivery stats for each webhook
    const webhooksWithStats = await Promise.all(
      (webhooks || []).map(async (webhook) => {
        const { count: totalDeliveries } = await supabaseAdmin
          .from('webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('webhook_id', webhook.id);

        const { count: successfulDeliveries } = await supabaseAdmin
          .from('webhook_deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('webhook_id', webhook.id)
          .eq('status', 'sent');

        const { count: failedDeliveries } = await supabaseAdmin
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
    console.error('Error in webhooks GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
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

    // Only owners/admins can create webhooks
    if (recruiter.role !== 'owner' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Only agency owners/admins can manage webhooks' }, { status: 403 });
    }

    const body = await request.json();
    const { url, events, description } = body;

    // Validation
    if (!url || !url.match(/^https?:\/\//)) {
      return NextResponse.json({ error: 'Invalid URL. Must start with http:// or https://' }, { status: 400 });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'At least one event must be specified' }, { status: 400 });
    }

    // Validate event types
    const validEventPrefixes = [
      'application.',
      'interview.',
      'offer.',
      'video.',
      'placement.',
      'candidate.',
    ];

    const invalidEvents = events.filter((event: string) =>
      !validEventPrefixes.some((prefix) => event.startsWith(prefix))
    );

    if (invalidEvents.length > 0) {
      return NextResponse.json({
        error: `Invalid event types: ${invalidEvents.join(', ')}`,
      }, { status: 400 });
    }

    // Generate secret for HMAC signatures
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const { data: webhook, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        agency_id: recruiter.agency_id,
        url,
        events,
        description: description || null,
        secret,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        description: webhook.description,
        secret: webhook.secret, // Only shown once!
        is_active: webhook.is_active,
        created_at: webhook.created_at,
      },
      message: 'Webhook created successfully. Save the secret - it will not be shown again!',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
