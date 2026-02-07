import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../../auth';
import { handleCorsOptions, withCors } from '../../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateRejection } from '@/lib/db/applications/queries.supabase';
import { webhookApplicationStatusChanged } from '@/lib/webhooks/events';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * POST /api/v1/applications/[id]/card/reject
 * Reject an application
 */
export async function POST(
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
  const { reason, rejected_by, rejected_by_id } = body;

  if (!reason || !rejected_by) {
    return withCors(NextResponse.json(
      { error: 'Missing required fields: reason, rejected_by' },
      { status: 400 }
    ), request);
  }

  if (!['client', 'recruiter'].includes(rejected_by)) {
    return withCors(NextResponse.json(
      { error: 'rejected_by must be "client" or "recruiter"' },
      { status: 400 }
    ), request);
  }

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

    const updated = await updateRejection(id, {
      reason,
      rejected_by: rejected_by as 'client' | 'recruiter',
      rejected_by_id,
    });

    if (!updated) {
      return withCors(NextResponse.json({ error: 'Failed to reject application' }, { status: 500 }), request);
    }

    // Trigger webhook for rejection
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
        newStatus: 'rejected',
        changedBy: rejected_by_id,
        agencyId: agencyId,
      }).catch(err => console.error('[Webhook] Application rejection error:', err));
    }

    return withCors(NextResponse.json({ application: updated }), request);
  } catch (error) {
    console.error('Error rejecting application:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to reject application' },
      { status: 500 }
    ), request);
  }
}

