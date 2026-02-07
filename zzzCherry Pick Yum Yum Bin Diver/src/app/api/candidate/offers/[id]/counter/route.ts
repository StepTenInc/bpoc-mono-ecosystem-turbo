import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// POST - Submit a counter offer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const offerId = params.id;
    const { requestedSalary, requestedCurrency, candidateMessage } = await request.json();

    // Validation
    if (!requestedSalary || requestedSalary <= 0) {
      return NextResponse.json({ error: 'Valid requested salary required' }, { status: 400 });
    }

    // Verify offer belongs to this candidate
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select('id, status, job_applications(id, candidate_id)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer || (offer.job_applications as any)?.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if offer is still active
    if (!['sent', 'viewed'].includes(offer.status)) {
      return NextResponse.json(
        { error: 'Can only counter active offers' },
        { status: 400 }
      );
    }

    // Create counter offer
    const { data: counterOffer, error: counterError } = await supabaseAdmin
      .from('counter_offers')
      .insert({
        offer_id: offerId,
        requested_salary: requestedSalary,
        requested_currency: requestedCurrency || 'PHP',
        candidate_message: candidateMessage || null,
        status: 'pending',
      })
      .select()
      .single();

    if (counterError) {
      console.error('Error creating counter offer:', counterError);
      return NextResponse.json({ error: 'Failed to submit counter offer' }, { status: 500 });
    }

    // Update job offer status to 'negotiating'
    await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'negotiating',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    return NextResponse.json({
      success: true,
      counterOffer: {
        id: counterOffer.id,
        requestedSalary: counterOffer.requested_salary,
        requestedCurrency: counterOffer.requested_currency,
        status: counterOffer.status,
        createdAt: counterOffer.created_at,
      },
      message: 'Counter offer submitted successfully'
    });

  } catch (error) {
    console.error('[Counter Offer API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit counter offer' },
      { status: 500 }
    );
  }
}

// GET - Fetch counter offer history for an offer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const offerId = params.id;

    // Verify offer belongs to this candidate
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select('id, job_applications(candidate_id)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer || (offer.job_applications as any)?.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Get all counter offers for this offer
    const { data: counterOffers, error: counterError } = await supabaseAdmin
      .from('counter_offers')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (counterError) {
      console.error('Error fetching counter offers:', counterError);
      return NextResponse.json({ error: 'Failed to fetch counter offers' }, { status: 500 });
    }

    return NextResponse.json({
      counterOffers: (counterOffers || []).map(co => ({
        id: co.id,
        requestedSalary: co.requested_salary,
        requestedCurrency: co.requested_currency,
        candidateMessage: co.candidate_message,
        employerResponse: co.employer_response,
        responseType: co.response_type,
        status: co.status,
        createdAt: co.created_at,
        respondedAt: co.responded_at,
      }))
    });

  } catch (error) {
    console.error('[Counter Offer API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counter offers' },
      { status: 500 }
    );
  }
}
