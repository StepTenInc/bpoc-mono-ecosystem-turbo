import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * POST /api/developer/webhook-receiver
 * 
 * Local webhook receiver endpoint for testing webhook deliveries
 * This endpoint logs all webhook requests for monitoring in the simulator
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // 1. Parse webhook payload
        const body = await request.json();
        const signature = request.headers.get('x-webhook-signature');
        const webhookId = request.headers.get('x-webhook-id');

        // 2. Extract event type (either from header or body)
        const eventType = request.headers.get('x-webhook-event') || body.event || 'unknown';

        // 3. Validate signature if provided
        let signatureValid = null;
        if (signature && webhookId) {
            // Fetch webhook secret
            const { data: webhook } = await supabaseAdmin
                .from('webhooks')
                .select('secret')
                .eq('id', webhookId)
                .single();

            if (webhook?.secret) {
                const expectedSignature = crypto
                    .createHmac('sha256', webhook.secret)
                    .update(JSON.stringify(body))
                    .digest('hex');

                signatureValid = signature === expectedSignature;
            }
        }

        // 4. Log webhook delivery
        const duration = Date.now() - startTime;

        await supabaseAdmin
            .from('webhook_test_logs')
            .insert({
                webhook_id: webhookId || null,
                event_type: eventType,
                payload: body,
                response_status: 200,
                response_body: JSON.stringify({ received: true, signatureValid }),
                response_headers: {
                    'content-type': 'application/json',
                },
                duration_ms: duration,
            });

        // 5. Return success response
        return NextResponse.json({
            success: true,
            message: 'Webhook received successfully',
            eventType,
            signatureValid,
            timestamp: new Date().toISOString(),
        }, {
            status: 200,
            headers: {
                'X-Received-At': new Date().toISOString(),
            },
        });

    } catch (error: any) {
        const duration = Date.now() - startTime;

        // Log error
        await supabaseAdmin
            .from('webhook_test_logs')
            .insert({
                webhook_id: null,
                event_type: 'error',
                payload: {},
                response_status: 500,
                response_body: null,
                error_message: error.message,
                duration_ms: duration,
            })
            .catch(() => {
                // Ignore logging errors
            });

        return NextResponse.json({
            success: false,
            error: 'Failed to process webhook',
            details: error.message,
        }, { status: 500 });
    }
}

/**
 * GET /api/developer/webhook-receiver
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'online',
        endpoint: '/api/developer/webhook-receiver',
        message: 'Webhook receiver is ready to accept POST requests',
        usage: 'Send webhook POST requests to this endpoint for testing',
    });
}
