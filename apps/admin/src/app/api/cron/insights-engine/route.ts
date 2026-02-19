import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CRON: /api/cron/insights-engine
 * Runs every 30 minutes to ensure the insights engine is running
 * 
 * If there are queued items and nothing is in progress, triggers the engine
 */
export async function GET(request: NextRequest) {
  try {
    // Check for queued items
    const { count: queuedCount } = await supabase
      .from('insights_production_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    // Check for in-progress items
    const { count: inProgressCount } = await supabase
      .from('insights_production_queue')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("queued","published","failed","paused")');

    console.log(`[INSIGHTS CRON] Queued: ${queuedCount}, In Progress: ${inProgressCount}`);

    // If there are queued items but nothing in progress, trigger the engine
    if (queuedCount && queuedCount > 0 && (!inProgressCount || inProgressCount === 0)) {
      console.log('[INSIGHTS CRON] Triggering engine...');
      
      const BASE_URL = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://www.bpoc.io';

      // Fire and forget - don't wait for the engine to complete
      fetch(`${BASE_URL}/api/insights/production-queue/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-next' }),
      }).catch(err => console.error('[INSIGHTS CRON] Trigger error:', err));

      return NextResponse.json({
        success: true,
        message: 'Engine triggered',
        queued: queuedCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: inProgressCount && inProgressCount > 0 ? 'Engine already running' : 'Nothing to process',
      queued: queuedCount || 0,
      inProgress: inProgressCount || 0,
    });
  } catch (error: any) {
    console.error('[INSIGHTS CRON] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
