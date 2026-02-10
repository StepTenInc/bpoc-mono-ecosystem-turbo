import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * POST /api/recruiter/webhooks/:id/test
 * Send a test webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get agency ID from user
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter' }, { status: 403 });
    }

    // Get webhook
    const { data: webhook, error: webhookError } = await supabaseAdmin
      .from('webhooks')
      .select('url, secret')
      .eq('id', id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Create test payload
    const testEvent = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from BPOC',
        webhook_id: id,
        agency_id: recruiter.agency_id,
      },
    };

    // Generate signature
    const payload = JSON.stringify(testEvent);
    const signature = `sha256=${crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex')}`;

    // Send test webhook
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'test',
          'X-Webhook-Delivery-Id': `test-${Date.now()}`,
          'User-Agent': 'BPOC-Webhooks/1.0',
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await response.text().catch(() => '');

      // Log delivery
      await supabaseAdmin
        .from('webhook_deliveries')
        .insert({
          webhook_id: id,
          event_type: 'test',
          payload: testEvent,
          status: response.ok ? 'sent' : 'failed',
          response_code: response.status,
          response_body: responseText.substring(0, 1000),
          attempts: 1,
          delivered_at: response.ok ? new Date().toISOString() : null,
        });

      if (response.ok) {
        // Update last_triggered_at
        await supabaseAdmin
          .from('webhooks')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', id);

        return NextResponse.json({
          success: true,
          status: response.status,
          message: 'Test webhook sent successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          status: response.status,
          message: 'Webhook endpoint returned an error',
          response: responseText.substring(0, 200),
        }, { status: 400 });
      }
    } catch (fetchError: any) {
      // Log failed delivery
      await supabaseAdmin
        .from('webhook_deliveries')
        .insert({
          webhook_id: id,
          event_type: 'test',
          payload: testEvent,
          status: 'failed',
          error_message: fetchError.message,
          attempts: 1,
        });

      return NextResponse.json({
        success: false,
        message: 'Failed to reach webhook endpoint',
        error: fetchError.message,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
