import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/candidate/offers/[id]/decline
 * Decline a job offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { id: offerId } = await params;

    // Get offer details
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        *,
        application:job_applications!inner(
          id,
          candidate_id
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const application = Array.isArray(offer.application)
      ? offer.application[0]
      : offer.application;

    // Verify candidate owns this offer
    if (application.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if offer can be declined
    if (offer.status === 'accepted') {
      return NextResponse.json({ error: 'Cannot decline an accepted offer' }, { status: 400 });
    }

    if (offer.status === 'declined') {
      return NextResponse.json({ error: 'Offer already declined' }, { status: 400 });
    }

    // Update offer status to declined
    const { error: updateOfferError } = await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateOfferError) {
      console.error('Error declining offer:', updateOfferError);
      return NextResponse.json({ error: 'Failed to decline offer' }, { status: 500 });
    }

    // Update application status
    const { error: updateApplicationError } = await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'offer_declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id);

    if (updateApplicationError) {
      console.error('Error updating application:', updateApplicationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Offer declined',
    });

  } catch (error: any) {
    console.error('Decline offer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
