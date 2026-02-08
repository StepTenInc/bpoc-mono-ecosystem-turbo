import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Respond to a counter offer (accept, reject, or send new offer)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: counterOfferId } = await context.params;
    const body = await request.json();
    const { token, action, newSalary, newStartDate, message } = body;

    if (!token || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: token, action' 
      }, { status: 400 });
    }

    if (!['accept', 'reject', 'new_offer'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be: accept, reject, or new_offer' 
      }, { status: 400 });
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.job_id;

    // Get counter offer with related offer and application
    const { data: counterOffer, error: coError } = await supabaseAdmin
      .from('counter_offers')
      .select(`
        id,
        offer_id,
        requested_salary,
        requested_currency,
        status,
        job_offers!inner(
          id,
          application_id,
          salary_offered,
          currency,
          job_applications!inner(job_id)
        )
      `)
      .eq('id', counterOfferId)
      .single();

    if (coError || !counterOffer) {
      return NextResponse.json({ error: 'Counter offer not found' }, { status: 404 });
    }

    const offer = (counterOffer as any).job_offers;
    if (offer.job_applications?.job_id !== jobId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check counter offer is still pending
    if (counterOffer.status !== 'pending') {
      return NextResponse.json({ 
        error: `Counter offer already ${counterOffer.status}` 
      }, { status: 400 });
    }

    if (action === 'accept') {
      // Accept the counter offer - create new offer at requested amount
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create new offer at the counter-offered amount
      const { data: newOffer, error: newOfferError } = await supabaseAdmin
        .from('job_offers')
        .insert({
          application_id: offer.application_id,
          salary_offered: counterOffer.requested_salary,
          salary_type: 'monthly',
          currency: counterOffer.requested_currency || offer.currency,
          start_date: newStartDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          additional_terms: message || `Accepted counter-offer. Original offer: ${offer.currency} ${offer.salary_offered}`,
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (newOfferError) {
        console.error('Error creating new offer:', newOfferError);
        return NextResponse.json({ error: 'Failed to create new offer' }, { status: 500 });
      }

      // Update counter offer status
      await supabaseAdmin
        .from('counter_offers')
        .update({
          status: 'accepted',
          response_type: 'accepted',
          employer_response: message || 'Counter offer accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', counterOfferId);

      // Withdraw the original offer
      await supabaseAdmin
        .from('job_offers')
        .update({
          status: 'superseded',
          superseded_by: newOffer.id,
        })
        .eq('id', offer.id);

      // Update application status
      await supabaseAdmin
        .from('job_applications')
        .update({ status: 'offer_sent' })
        .eq('id', offer.application_id);

      return NextResponse.json({ 
        success: true,
        message: 'Counter offer accepted. New offer sent.',
        newOffer
      });

    } else if (action === 'reject') {
      // Reject the counter offer
      await supabaseAdmin
        .from('counter_offers')
        .update({
          status: 'rejected',
          response_type: 'rejected',
          employer_response: message || 'Counter offer declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', counterOfferId);

      return NextResponse.json({ 
        success: true,
        message: 'Counter offer rejected' 
      });

    } else if (action === 'new_offer') {
      // Send a new offer at a different amount (negotiation)
      if (!newSalary) {
        return NextResponse.json({ 
          error: 'newSalary is required for new_offer action' 
        }, { status: 400 });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: newOffer, error: newOfferError } = await supabaseAdmin
        .from('job_offers')
        .insert({
          application_id: offer.application_id,
          salary_offered: newSalary,
          salary_type: 'monthly',
          currency: offer.currency,
          start_date: newStartDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          additional_terms: message || `Counter-proposal. They requested: ${counterOffer.requested_currency} ${counterOffer.requested_salary}`,
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (newOfferError) {
        console.error('Error creating new offer:', newOfferError);
        return NextResponse.json({ error: 'Failed to create new offer' }, { status: 500 });
      }

      // Update counter offer status
      await supabaseAdmin
        .from('counter_offers')
        .update({
          status: 'countered',
          response_type: 'countered',
          employer_response: message || `Counter-proposal sent: ${offer.currency} ${newSalary}`,
          responded_at: new Date().toISOString(),
        })
        .eq('id', counterOfferId);

      // Withdraw original offer
      await supabaseAdmin
        .from('job_offers')
        .update({
          status: 'superseded',
          superseded_by: newOffer.id,
        })
        .eq('id', offer.id);

      return NextResponse.json({ 
        success: true,
        message: 'New offer sent',
        newOffer
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error responding to counter offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
