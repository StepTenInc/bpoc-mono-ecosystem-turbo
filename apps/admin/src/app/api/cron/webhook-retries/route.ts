import { NextRequest, NextResponse } from 'next/server';
import { processWebhookRetries } from '@/lib/webhooks/delivery';

/**
 * GET /api/cron/webhook-retries
 * Process pending webhook retries
 *
 * This endpoint should be called by Vercel Cron every 5-10 minutes
 * Configured in vercel.json to run every 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting webhook retry processing...');

    // Process retries
    await processWebhookRetries();

    return NextResponse.json({
      success: true,
      message: 'Webhook retries processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing webhook retries:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook retries' },
      { status: 500 }
    );
  }
}
