import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST - Accept candidate's counter offer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const offerId = params.id;
    const { counterOfferId, employerMessage } = await request.json();

    if (!counterOfferId) {
      return NextResponse.json({ error: 'Counter offer ID required' }, { status: 400 });
    }

    // Verify recruiter owns this offer
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        application_id,
        job_applications (
          candidate_id,
          jobs (
            title,
            agency_clients (
              agency_id,
              companies (name)
            )
          )
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Verify recruiter belongs to same agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    const offerAgencyId = (offer.job_applications as any)?.jobs?.agency_clients?.agency_id;

    if (!recruiter || recruiter.agency_id !== offerAgencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the counter offer
    const { data: counterOffer, error: counterError } = await supabaseAdmin
      .from('counter_offers')
      .select('*')
      .eq('id', counterOfferId)
      .single();

    if (counterError || !counterOffer || counterOffer.offer_id !== offerId) {
      return NextResponse.json({ error: 'Counter offer not found' }, { status: 404 });
    }

    if (counterOffer.status !== 'pending') {
      return NextResponse.json({ error: 'Counter offer already responded to' }, { status: 400 });
    }

    // Update counter offer to accepted
    await supabaseAdmin
      .from('counter_offers')
      .update({
        status: 'accepted',
        employer_response: employerMessage || null,
        response_type: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', counterOfferId);

    // Update the original offer with the new salary
    await supabaseAdmin
      .from('job_offers')
      .update({
        salary_offered: counterOffer.requested_salary,
        currency: counterOffer.requested_currency,
        status: 'accepted',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    // Update application status to hired
    await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'hired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', offer.application_id);

    // Create activity timeline entry
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: offer.application_id,
        action_type: 'counter_accepted',
        performed_by_type: 'recruiter',
        performed_by_id: user.id,
        description: `Counter offer accepted. New salary: ${counterOffer.requested_currency} ${counterOffer.requested_salary.toLocaleString()}`,
      });

    // Send notification to candidate
    const candidateId = (offer.job_applications as any)?.candidate_id;
    const jobTitle = (offer.job_applications as any)?.jobs?.title;
    const companyName = (offer.job_applications as any)?.jobs?.agency_clients?.companies?.name;

    if (candidateId) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: candidateId,
          type: 'counter_accepted',
          title: 'Counter Offer Accepted! 🎉',
          message: `Great news! Your counter offer for ${jobTitle} at ${companyName} has been accepted. New salary: ${counterOffer.requested_currency} ${counterOffer.requested_salary.toLocaleString()}.`,
          action_url: `/candidate/offers/${offerId}`,
          action_label: 'View Offer',
          is_urgent: true,
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Counter offer accepted successfully'
    });

  } catch (error) {
    console.error('[Accept Counter Offer API] Error:', error);
    return NextResponse.json({ error: 'Failed to accept counter offer' }, { status: 500 });
  }
}
