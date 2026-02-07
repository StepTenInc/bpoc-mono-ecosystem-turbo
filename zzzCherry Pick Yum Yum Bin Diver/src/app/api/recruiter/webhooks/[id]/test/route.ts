import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { triggerWebhook } from '@/lib/webhooks/delivery';

/**
 * POST /api/recruiter/webhooks/[id]/test
 * Send a test webhook delivery
 */
export async function POST(
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

    // Create test payload
    const testData = {
      test: true,
      message: 'This is a test webhook from BPOC',
      webhook_id: webhook.id,
      timestamp: new Date().toISOString(),
      sample_data: {
        applicationId: '00000000-0000-0000-0000-000000000000',
        candidateName: 'Test Candidate',
        jobTitle: 'Test Position',
        status: 'applied',
      },
    };

    // Trigger test webhook (use first event type from webhook)
    const testEventType = webhook.events[0] || 'test.webhook';

    await triggerWebhook(testEventType, testData, recruiter.agency_id);

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent! Check your endpoint logs.',
      event: testEventType,
      url: webhook.url,
    });
  } catch (error) {
    console.error('Error sending test webhook:', error);
    return NextResponse.json({ error: 'Failed to send test webhook' }, { status: 500 });
  }
}
