import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - View counter offers for an offer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const offerId = params.id;

    // Verify offer belongs to recruiter's agency
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        job_applications (
          jobs (
            agency_clients (agency_id)
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
        offerId: co.offer_id,
        requestedSalary: co.requested_salary,
        requestedCurrency: co.requested_currency,
        candidateMessage: co.candidate_message,
        status: co.status,
        employerResponse: co.employer_response,
        responseType: co.response_type,
        respondedAt: co.responded_at,
        createdAt: co.created_at,
      }))
    });

  } catch (error) {
    console.error('[Get Counter Offers API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch counter offers' }, { status: 500 });
  }
}
