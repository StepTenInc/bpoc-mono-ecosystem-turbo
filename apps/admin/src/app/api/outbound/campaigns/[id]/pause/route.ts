import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pauseCampaign } from '@/lib/outbound/campaign-executor';

/**
 * POST /api/admin/outbound/campaigns/[id]/pause
 * Pause a running campaign
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pauseCampaign(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error in POST /api/admin/outbound/campaigns/[id]/pause:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
