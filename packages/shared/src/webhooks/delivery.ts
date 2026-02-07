/**
 * Webhook Delivery System
 *
 * Handles secure webhook delivery with:
 * - HMAC signature generation
 * - Retry logic with exponential backoff
 * - Delivery tracking
 * - Event type matching (supports wildcards)
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface Webhook {
  id: string;
  agency_id: string;
  url: string;
  secret: string;
}

/**
 * Generate HMAC SHA256 signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Send webhook to a specific endpoint
 */
async function sendWebhook(
  webhook: Webhook,
  event: WebhookEvent,
  deliveryId: string,
  attemptNumber: number
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payload = JSON.stringify(event);
  const signature = generateSignature(payload, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': event.event,
        'X-Webhook-Delivery-Id': deliveryId,
        'X-Webhook-Attempt': attemptNumber.toString(),
        'User-Agent': 'BPOC-Webhooks/1.0',
      },
      body: payload,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseBody = await response.text().catch(() => '');

    // Update delivery record
    await supabaseAdmin
      .from('webhook_deliveries')
      .update({
        status: response.ok ? 'sent' : 'failed',
        response_code: response.status,
        response_body: responseBody.substring(0, 1000), // Limit to 1KB
        attempts: attemptNumber,
        last_attempt_at: new Date().toISOString(),
        delivered_at: response.ok ? new Date().toISOString() : null,
      })
      .eq('id', deliveryId);

    // Update webhook last_triggered_at
    if (response.ok) {
      await supabaseAdmin
        .from('webhooks')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', webhook.id);
    }

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';

    // Update delivery record with error
    await supabaseAdmin
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: errorMessage.substring(0, 500),
        attempts: attemptNumber,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Schedule retry for failed webhook delivery
 */
async function scheduleRetry(deliveryId: string, attemptNumber: number) {
  // Exponential backoff: 1min, 5min, 30min
  const retryDelays = [60, 300, 1800]; // seconds
  const delay = retryDelays[attemptNumber - 1] || 1800;
  const nextRetryAt = new Date(Date.now() + delay * 1000);

  await supabaseAdmin
    .from('webhook_deliveries')
    .update({
      status: 'retrying',
      next_retry_at: nextRetryAt.toISOString(),
    })
    .eq('id', deliveryId);

  console.log(`[Webhooks] Scheduled retry for ${deliveryId} at ${nextRetryAt.toISOString()}`);
}

/**
 * Main function: Trigger webhooks for an event
 *
 * @param eventType - Event type (e.g., "application.created")
 * @param data - Event data payload
 * @param agencyId - Optional: Only trigger for specific agency
 */
export async function triggerWebhook(
  eventType: string,
  data: Record<string, any>,
  agencyId?: string
): Promise<void> {
  console.log(`[Webhooks] Triggering event: ${eventType}`, { agencyId });

  // Get all webhooks subscribed to this event
  let query = supabaseAdmin.rpc('get_webhooks_for_event', {
    p_event_type: eventType,
  });

  const { data: webhooks, error } = await query;

  if (error) {
    console.error('[Webhooks] Error fetching webhooks:', error);
    return;
  }

  if (!webhooks || webhooks.length === 0) {
    console.log(`[Webhooks] No webhooks found for event: ${eventType}`);
    return;
  }

  // Filter by agency if specified
  const targetWebhooks = agencyId
    ? webhooks.filter((w: Webhook) => w.agency_id === agencyId)
    : webhooks;

  console.log(`[Webhooks] Found ${targetWebhooks.length} webhooks to trigger`);

  // Create webhook event payload
  const event: WebhookEvent = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  // Send to each webhook
  for (const webhook of targetWebhooks) {
    // Create delivery record
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: event,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      })
      .select('id')
      .single();

    if (deliveryError || !delivery) {
      console.error('[Webhooks] Failed to create delivery record:', deliveryError);
      continue;
    }

    // Send webhook (first attempt)
    const result = await sendWebhook(webhook, event, delivery.id, 1);

    // Schedule retry if failed
    if (!result.success) {
      await scheduleRetry(delivery.id, 1);
      console.log(`[Webhooks] Failed to deliver to ${webhook.url}, scheduled retry`);
    } else {
      console.log(`[Webhooks] Successfully delivered to ${webhook.url}`);
    }
  }
}

/**
 * Process pending webhook retries
 * This should be called by a cron job or background worker
 */
export async function processWebhookRetries(): Promise<void> {
  // Find deliveries that need retry
  const { data: retries, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('id, webhook_id, event_type, payload, attempts, max_attempts')
    .eq('status', 'retrying')
    .lte('next_retry_at', new Date().toISOString())
    .limit(50); // Process 50 at a time

  if (error || !retries || retries.length === 0) {
    return;
  }

  console.log(`[Webhooks] Processing ${retries.length} retry attempts`);

  for (const delivery of retries) {
    // Get webhook details
    const { data: webhook } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('id', delivery.webhook_id)
      .single();

    if (!webhook || !webhook.is_active) {
      // Webhook deleted or disabled, mark as failed
      await supabaseAdmin
        .from('webhook_deliveries')
        .update({ status: 'failed', error_message: 'Webhook deleted or disabled' })
        .eq('id', delivery.id);
      continue;
    }

    const attemptNumber = delivery.attempts + 1;

    // Send webhook
    const result = await sendWebhook(
      webhook,
      delivery.payload as WebhookEvent,
      delivery.id,
      attemptNumber
    );

    // If failed and attempts remaining, schedule next retry
    if (!result.success && attemptNumber < delivery.max_attempts) {
      await scheduleRetry(delivery.id, attemptNumber);
    } else if (!result.success) {
      // Max attempts reached, mark as permanently failed
      await supabaseAdmin
        .from('webhook_deliveries')
        .update({ status: 'failed' })
        .eq('id', delivery.id);

      console.log(`[Webhooks] Delivery ${delivery.id} permanently failed after ${attemptNumber} attempts`);
    }
  }
}

/**
 * Verify webhook signature (for agencies receiving webhooks from BPOC)
 * Agencies can use this in their webhook receivers
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = `sha256=${generateSignature(payload, secret)}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
