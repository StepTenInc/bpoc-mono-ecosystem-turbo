import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../../auth';
import { handleCorsOptions, withCors } from '../../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateRecruiterPrescreen } from '@/lib/db/applications/queries.supabase';
import { webhookApplicationStatusChanged } from '@/lib/webhooks/events';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * PATCH /api/v1/applications/[id]/card/prescreen
 * Update recruiter pre-screening data
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
  const { video_url, transcript, rating, notes, status, screened_by } = body;

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

    if (status && !['pending', 'completed', 'rejected'].includes(status)) {
      return withCors(NextResponse.json(
        { error: 'status must be "pending", "completed", or "rejected"' },
        { status: 400 }
      ), request);
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return withCors(NextResponse.json(
        { error: 'rating must be between 1 and 5' },
        { status: 400 }
      ), request);
    }

    const updated = await updateRecruiterPrescreen(id, {
      video_url,
      transcript,
      rating,
      notes,
      status,
      screened_by,
    });

    if (!updated) {
      return withCors(NextResponse.json({ error: 'Failed to update prescreen' }, { status: 500 }), request);
    }

    // Trigger webhook for prescreen status change
    if (status && ['completed', 'rejected'].includes(status)) {
      const { data: appDetails } = await supabaseAdmin
        .from('job_applications')
        .select('job_id, candidate_id')
        .eq('id', id)
        .single();

      if (appDetails) {
        webhookApplicationStatusChanged({
          applicationId: id,
          jobId: appDetails.job_id,
          candidateId: appDetails.candidate_id,
          oldStatus: 'pending',
          newStatus: status,
          changedBy: screened_by,
          agencyId: agencyId,
        }).catch(err => console.error('[Webhook] Prescreen status change error:', err));
      }
    }

    return withCors(NextResponse.json({ application: updated }), request);
  } catch (error) {
    console.error('Error updating prescreen:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to update prescreen' },
      { status: 500 }
    ), request);
  }
}

