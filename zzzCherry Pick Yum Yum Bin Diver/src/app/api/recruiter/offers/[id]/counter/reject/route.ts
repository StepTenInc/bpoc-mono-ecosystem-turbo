import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST - Reject candidate's counter offer (optionally send new counter back)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const offerId = params.id;
    const {
      counterOfferId,
      employerMessage,
      sendNewCounter,
      revisedSalary,
      revisedCurrency
    } = await request.json();

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

    // Update counter offer to rejected
    await supabaseAdmin
      .from('counter_offers')
      .update({
        status: 'rejected',
        employer_response: employerMessage || null,
        response_type: sendNewCounter ? 'employer_counter' : 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('id', counterOfferId);

    let notificationTitle = 'Counter Offer Declined';
    let notificationMessage = `Your counter offer for ${(offer.job_applications as any)?.jobs?.title} was declined.`;
    let notificationType = 'counter_rejected';

    // If sending new counter, create a new counter offer from employer side
    if (sendNewCounter && revisedSalary) {
      if (revisedSalary <= 0) {
        return NextResponse.json({ error: 'Revised salary must be positive' }, { status: 400 });
      }

      await supabaseAdmin
        .from('counter_offers')
        .insert({
          offer_id: offerId,
          requested_salary: revisedSalary,
          requested_currency: revisedCurrency || counterOffer.requested_currency,
          candidate_message: null,
          status: 'pending',
          employer_response: employerMessage || 'We would like to offer a revised salary.',
          response_type: 'employer_counter',
        });

      await supabaseAdmin
        .from('job_offers')
        .update({
          status: 'negotiating',
          salary_offered: revisedSalary,
          currency: revisedCurrency || counterOffer.requested_currency,
        })
        .eq('id', offerId);

      notificationTitle = 'New Counter Offer Received';
      notificationMessage = `The employer has sent a new counter offer for ${(offer.job_applications as any)?.jobs?.title}: ${revisedCurrency || counterOffer.requested_currency} ${revisedSalary.toLocaleString()}.`;
      notificationType = 'counter_received';
    } else {
      await supabaseAdmin
        .from('job_offers')
        .update({ status: 'sent' })
        .eq('id', offerId);
    }

    // Create activity timeline entry
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: offer.application_id,
        action_type: sendNewCounter ? 'counter_sent' : 'counter_rejected',
        performed_by_type: 'recruiter',
        performed_by_id: user.id,
        description: sendNewCounter
          ? `New counter offer sent: ${revisedCurrency || counterOffer.requested_currency} ${revisedSalary?.toLocaleString()}`
          : 'Counter offer declined',
      });

    // Send notification to candidate
    const candidateId = (offer.job_applications as any)?.candidate_id;

    if (candidateId) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: candidateId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage + (employerMessage ? ` Message: ${employerMessage}` : ''),
          action_url: `/candidate/offers/${offerId}`,
          action_label: 'View Offer',
          is_urgent: !sendNewCounter,
        });
    }

    return NextResponse.json({
      success: true,
      message: sendNewCounter
        ? 'Counter offer sent to candidate'
        : 'Counter offer rejected'
    });

  } catch (error) {
    console.error('[Reject Counter Offer API] Error:', error);
    return NextResponse.json({ error: 'Failed to reject counter offer' }, { status: 500 });
  }
}
