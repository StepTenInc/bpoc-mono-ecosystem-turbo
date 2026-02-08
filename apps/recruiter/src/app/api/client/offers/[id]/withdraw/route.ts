import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Withdraw a job offer
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: offer_id } = await context.params;
    const body = await request.json();
    const { token, reason } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.job_id;

    // Verify offer belongs to this job
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        status,
        application_id,
        job_applications!inner(job_id)
      `)
      .eq('id', offer_id)
      .single();

    if (offerError || !offer || (offer as any).job_applications?.job_id !== jobId) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Only allow withdrawal of pending/sent/viewed offers
    if (!['sent', 'viewed', 'pending'].includes(offer.status)) {
      return NextResponse.json({ 
        error: `Cannot withdraw offer with status: ${offer.status}` 
      }, { status: 400 });
    }

    // Withdraw the offer
    const { error: updateError } = await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'withdrawn',
        withdrawal_reason: reason || 'Withdrawn by client',
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', offer_id);

    if (updateError) {
      console.error('Error withdrawing offer:', updateError);
      return NextResponse.json({ error: 'Failed to withdraw offer' }, { status: 500 });
    }

    // Update application status back to interviewed
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'interviewed' })
      .eq('id', offer.application_id);

    return NextResponse.json({ 
      success: true,
      message: 'Offer withdrawn successfully' 
    });
  } catch (error) {
    console.error('Error withdrawing offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
