import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/candidate/offers/[id]/accept
 * Accept a job offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { id: offerId } = await params;

    console.log('[accept] Starting offer acceptance for:', offerId, 'user:', user.id);

    // Get offer with application
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        status,
        application_id,
        job_applications!inner(
          id,
          candidate_id
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('[accept] Offer not found:', offerError);
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const application = Array.isArray(offer.job_applications)
      ? offer.job_applications[0]
      : offer.job_applications;

    // Verify candidate owns this offer
    if (application.candidate_id !== user.id) {
      console.error('[accept] Unauthorized - candidate mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if offer can be accepted
    if (offer.status === 'accepted') {
      return NextResponse.json({ error: 'Offer already accepted' }, { status: 400 });
    }

    if (offer.status === 'expired' || offer.status === 'withdrawn' || offer.status === 'declined') {
      return NextResponse.json({ error: 'Offer is no longer valid' }, { status: 400 });
    }

    console.log('[accept] Updating offer status to accepted');

    // Update offer status
    const { error: updateOfferError } = await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateOfferError) {
      console.error('[accept] Error updating offer:', updateOfferError);
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }

    console.log('[accept] Updating application status to offer_accepted (pending contract signing)');

    // Update application status to offer_accepted (not hired yet - need to sign contract first)
    const { error: updateAppError } = await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'offer_accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id);

    if (updateAppError) {
      console.error('[accept] Error updating application:', updateAppError);
      // Don't fail - offer is already accepted
    }

    console.log('[accept] Success!');

    return NextResponse.json({
      success: true,
      message: 'Offer accepted! Welcome aboard!',
    });

  } catch (error: any) {
    console.error('[accept] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
