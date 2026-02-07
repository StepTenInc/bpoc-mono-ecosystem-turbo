import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/offers/:offerId/counter
 * List counter offers for a job offer (Enterprise only).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { offerId } = await params;

  try {
    const tier = await getAgencyTier(auth.agencyId);
    if (tier !== 'enterprise') {
      return withCors(NextResponse.json({
        error: 'Counter-offer management via API requires Enterprise plan',
      }, { status: 403 }), request);
    }

    // Verify offer belongs to this agency via application -> job -> agency_client -> agency
    const { data: offer } = await supabaseAdmin
      .from('job_offers')
      .select('id, application_id, job_applications!inner(id, job_id, jobs!inner(id, agency_client_id, agency_clients!inner(id, agency_id)))')
      .eq('id', offerId)
      .eq('job_applications.jobs.agency_clients.agency_id', auth.agencyId)
      .maybeSingle();

    if (!offer) {
      return withCors(NextResponse.json({ error: 'Offer not found' }, { status: 404 }), request);
    }

    const { data: counters, error } = await supabaseAdmin
      .from('counter_offers')
      .select('id, offer_id, requested_salary, requested_currency, candidate_message, employer_response, response_type, status, created_at, responded_at')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      return withCors(NextResponse.json({ error: 'Failed to fetch counter offers', details: error.message }, { status: 500 }), request);
    }

    return withCors(NextResponse.json({ counterOffers: counters || [] }), request);
  } catch (e: any) {
    return withCors(NextResponse.json({ error: 'Internal server error', details: e?.message || String(e) }, { status: 500 }), request);
  }
}

async function getAgencyTier(agencyId: string): Promise<string> {
  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('tier')
    .eq('id', agencyId)
    .maybeSingle();

  return (agency as any)?.tier || 'free';
}


