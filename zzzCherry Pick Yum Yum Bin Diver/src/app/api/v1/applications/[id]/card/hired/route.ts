import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../../auth';
import { handleCorsOptions, withCors } from '../../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateHiredStatus } from '@/lib/db/applications/queries.supabase';
import { webhookApplicationStatusChanged } from '@/lib/webhooks/events';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * PATCH /api/v1/applications/[id]/card/hired
 * Update hired/started status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { agencyId } = auth;
  const { id } = await params;
  const body = await request.json();
  const { offer_acceptance_date, contract_signed, first_day_date, started_status } = body;

  try {
    // Verify application belongs to agency
    const clientIds = await getAgencyClientIds(agencyId);
    const { data: app } = await supabaseAdmin
      .from('job_applications')
      .select('id, jobs!inner(agency_client_id)')
      .eq('id', id)
      .in('jobs.agency_client_id', clientIds)
      .single();

    if (!app) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    if (started_status && !['hired', 'started', 'no_show'].includes(started_status)) {
      return withCors(NextResponse.json(
        { error: 'started_status must be "hired", "started", or "no_show"' },
        { status: 400 }
      ), request);
    }

    const updated = await updateHiredStatus(id, {
      offer_acceptance_date,
      contract_signed,
      first_day_date,
      started_status,
    });

    if (!updated) {
      return withCors(NextResponse.json({ error: 'Failed to update hired status' }, { status: 500 }), request);
    }

    // Trigger webhook for hire/start status change
    if (started_status) {
      const { data: appDetails } = await supabaseAdmin
        .from('job_applications')
        .select('job_id, candidate_id, status')
        .eq('id', id)
        .single();

      if (appDetails) {
        webhookApplicationStatusChanged({
          applicationId: id,
          jobId: appDetails.job_id,
          candidateId: appDetails.candidate_id,
          oldStatus: appDetails.status || 'unknown',
          newStatus: started_status,
          agencyId: agencyId,
        }).catch(err => console.error('[Webhook] Hired status change error:', err));
      }
    }

    return withCors(NextResponse.json({ application: updated }), request);
  } catch (error) {
    console.error('Error updating hired status:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to update hired status' },
      { status: 500 }
    ), request);
  }
}

