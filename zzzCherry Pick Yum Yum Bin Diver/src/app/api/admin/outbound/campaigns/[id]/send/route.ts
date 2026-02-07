import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeCampaign } from '@/lib/outbound/campaign-executor';

/**
 * POST /api/admin/outbound/campaigns/[id]/send
 * Execute campaign (send emails)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    console.log(`[API] Starting campaign execution: ${id}`);

    // Execute campaign (this runs in the background)
    const result = await executeCampaign(id);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[API] Error in POST /api/admin/outbound/campaigns/[id]/send:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
