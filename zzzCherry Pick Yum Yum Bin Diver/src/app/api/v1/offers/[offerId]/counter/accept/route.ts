import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../../../../auth';
import { handleCorsOptions, withCors } from '../../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * POST /api/v1/offers/:offerId/counter/accept
 * Accept a candidate counter offer (Enterprise only).
 *
 * Body:
 *  - counterOfferId: string (required)
 *  - employerMessage?: string
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  try {
    const tier = await getAgencyTier(auth.agencyId);
    if (tier !== 'enterprise') {
      return withCors(NextResponse.json({
        error: 'Counter-offer management via API requires Enterprise plan',
      }, { status: 403 }), request);
    }

    const { offerId } = await params;
    const body = await request.json().catch(() => ({}));
    const counterOfferId = String(body?.counterOfferId || '');
    const employerMessage = typeof body?.employerMessage === 'string' ? body.employerMessage : null;

    if (!counterOfferId) {
      return withCors(NextResponse.json({ error: 'counterOfferId is required' }, { status: 400 }), request);
    }

    // Verify offer belongs to agency and fetch application + candidate for notifications
    const { data: offer } = await supabaseAdmin
      .from('job_offers')
      .select('id, application_id, job_applications!inner(id, candidate_id, job_id, jobs!inner(id, title, agency_client_id, agency_clients!inner(id, agency_id, companies(name))))')
      .eq('id', offerId)
      .eq('job_applications.jobs.agency_clients.agency_id', auth.agencyId)
      .maybeSingle();

    if (!offer) {
      return withCors(NextResponse.json({ error: 'Offer not found' }, { status: 404 }), request);
    }

    const applicationId = (offer as any)?.application_id as string;
    const candidateId = (offer as any)?.job_applications?.candidate_id as string | undefined;
    const jobTitle = (offer as any)?.job_applications?.jobs?.title || null;
    const companyName = (offer as any)?.job_applications?.jobs?.agency_clients?.companies?.name || null;

    // Load counter offer
    const { data: counterOffer } = await supabaseAdmin
      .from('counter_offers')
      .select('id, offer_id, requested_salary, requested_currency, status')
      .eq('id', counterOfferId)
      .maybeSingle();

    if (!counterOffer || counterOffer.offer_id !== offerId) {
      return withCors(NextResponse.json({ error: 'Counter offer not found' }, { status: 404 }), request);
    }
    if (counterOffer.status !== 'pending') {
      return withCors(NextResponse.json({ error: 'Counter offer already responded to' }, { status: 400 }), request);
    }

    const now = new Date().toISOString();

    // Mark counter accepted
    const { error: counterErr } = await supabaseAdmin
      .from('counter_offers')
      .update({
        status: 'accepted',
        employer_response: employerMessage,
        response_type: 'accepted',
        responded_at: now,
      })
      .eq('id', counterOfferId);

    if (counterErr) {
      return withCors(NextResponse.json({ error: 'Failed to accept counter offer', details: counterErr.message }, { status: 500 }), request);
    }

    // Update offer with negotiated salary
    const { error: offerErr } = await supabaseAdmin
      .from('job_offers')
      .update({
        salary_offered: counterOffer.requested_salary,
        currency: counterOffer.requested_currency,
        status: 'accepted',
        responded_at: now,
      })
      .eq('id', offerId);

    if (offerErr) {
      return withCors(NextResponse.json({ error: 'Failed to update offer', details: offerErr.message }, { status: 500 }), request);
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'hired' })
      .eq('id', applicationId);

    // Timeline entry (best-effort)
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: applicationId,
        action_type: 'counter_accepted',
        performed_by_type: 'client',
        performed_by_id: null,
        description: `Counter offer accepted. New salary: ${counterOffer.requested_currency} ${Number(counterOffer.requested_salary).toLocaleString()}`,
        metadata: {
          offer_id: offerId,
          counter_offer_id: counterOfferId,
        },
      } as any);

    // Candidate notification (best-effort)
    if (candidateId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: candidateId,
        type: 'counter_accepted',
        title: 'Counter Offer Accepted',
        message: `Your counter offer${jobTitle ? ` for ${jobTitle}` : ''}${companyName ? ` at ${companyName}` : ''} was accepted.`,
        action_url: `/candidate/offers`,
        action_label: 'View Offer',
        is_urgent: true,
      } as any);
    }

    return withCors(NextResponse.json({ success: true }), request);
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


