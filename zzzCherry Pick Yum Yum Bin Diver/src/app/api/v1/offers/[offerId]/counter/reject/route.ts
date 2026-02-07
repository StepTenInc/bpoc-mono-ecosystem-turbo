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
 * POST /api/v1/offers/:offerId/counter/reject
 * Reject a candidate counter offer (optionally send a revised counter) (Enterprise only).
 *
 * Body:
 *  - counterOfferId: string (required)
 *  - employerMessage?: string
 *  - sendNewCounter?: boolean
 *  - revisedSalary?: number
 *  - revisedCurrency?: string
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
    const sendNewCounter = !!body?.sendNewCounter;
    const revisedSalary = body?.revisedSalary;
    const revisedCurrency = typeof body?.revisedCurrency === 'string' ? body.revisedCurrency : undefined;

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

    // Load counter offer
    const { data: counterOffer } = await supabaseAdmin
      .from('counter_offers')
      .select('id, offer_id, requested_currency, status')
      .eq('id', counterOfferId)
      .maybeSingle();

    if (!counterOffer || counterOffer.offer_id !== offerId) {
      return withCors(NextResponse.json({ error: 'Counter offer not found' }, { status: 404 }), request);
    }
    if (counterOffer.status !== 'pending') {
      return withCors(NextResponse.json({ error: 'Counter offer already responded to' }, { status: 400 }), request);
    }

    const now = new Date().toISOString();

    // Reject the candidate counter offer
    const { error: rejectErr } = await supabaseAdmin
      .from('counter_offers')
      .update({
        status: 'rejected',
        employer_response: employerMessage,
        response_type: sendNewCounter ? 'employer_counter' : 'rejected',
        responded_at: now,
      })
      .eq('id', counterOfferId);

    if (rejectErr) {
      return withCors(NextResponse.json({ error: 'Failed to reject counter offer', details: rejectErr.message }, { status: 500 }), request);
    }

    let notificationType = 'counter_rejected';
    let notificationTitle = 'Counter Offer Declined';
    let notificationMessage = `Your counter offer${jobTitle ? ` for ${jobTitle}` : ''} was declined.`;

    if (sendNewCounter) {
      if (typeof revisedSalary !== 'number' || revisedSalary <= 0) {
        return withCors(NextResponse.json({ error: 'revisedSalary must be a positive number when sendNewCounter is true' }, { status: 400 }), request);
      }

      const currency = revisedCurrency || counterOffer.requested_currency || 'PHP';

      // Create a new employer counter (pending)
      const { error: createErr } = await supabaseAdmin
        .from('counter_offers')
        .insert({
          offer_id: offerId,
          requested_salary: revisedSalary,
          requested_currency: currency,
          candidate_message: null,
          employer_response: employerMessage || 'We would like to offer a revised salary.',
          response_type: 'employer_counter',
          status: 'pending',
          created_at: now,
        } as any);

      if (createErr) {
        return withCors(NextResponse.json({ error: 'Failed to create revised counter offer', details: createErr.message }, { status: 500 }), request);
      }

      // Keep offer negotiating with revised amount
      await supabaseAdmin
        .from('job_offers')
        .update({
          status: 'negotiating',
          salary_offered: revisedSalary,
          currency,
          responded_at: now,
        })
        .eq('id', offerId);

      notificationType = 'counter_received';
      notificationTitle = 'New Counter Offer Received';
      notificationMessage = `The employer sent a revised counter offer${jobTitle ? ` for ${jobTitle}` : ''}: ${currency} ${Number(revisedSalary).toLocaleString()}.`;
    } else {
      // Revert offer back to sent (best-effort)
      await supabaseAdmin
        .from('job_offers')
        .update({ status: 'sent' })
        .eq('id', offerId);
    }

    // Timeline entry (best-effort)
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: applicationId,
        action_type: sendNewCounter ? 'counter_sent' : 'counter_rejected',
        performed_by_type: 'client',
        performed_by_id: null,
        description: sendNewCounter ? 'New counter offer sent' : 'Counter offer declined',
        metadata: {
          offer_id: offerId,
          counter_offer_id: counterOfferId,
          send_new_counter: sendNewCounter,
        },
      } as any);

    // Candidate notification (best-effort)
    if (candidateId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: candidateId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage + (employerMessage ? ` Message: ${employerMessage}` : ''),
        action_url: `/candidate/offers/${offerId}`,
        action_label: 'View Offer',
        is_urgent: !sendNewCounter,
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


