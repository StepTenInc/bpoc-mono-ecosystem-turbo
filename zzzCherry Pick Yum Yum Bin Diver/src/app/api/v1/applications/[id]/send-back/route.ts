import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';
import { webhookApplicationStatusChanged } from '@/lib/webhooks/events';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * POST /api/v1/applications/:id/send-back
 * Client sends application back to recruiter (Recruiter Gate)
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

  try {
    const body = await request.json();
    const normalizeStatus = (raw: any): string => {
      const s = String(raw || '').toLowerCase().trim();
      if (s === 'reviewed' || s === 'review') return 'under_review';
      return s;
    };

    const { reason, requested_by, status = 'under_review' } = body || {};
    const normalizedStatus = normalizeStatus(status);

    if (!requested_by || typeof requested_by !== 'string') {
      return withCors(
        NextResponse.json({ error: 'requested_by is required (UUID of client user)' }, { status: 400 }),
        request
      );
    }

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

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        released_to_client: false,
        status: normalizedStatus,
        updated_at: now,
      })
      .eq('id', id)
      .select('id, status, released_to_client')
      .single();

    if (updateError || !updated) {
      console.error('Send-back update failed:', updateError);
      return withCors(NextResponse.json({ error: 'Failed to send back application' }, { status: 500 }), request);
    }

    await logApplicationActivity(id, {
      action_type: 'sent_back_to_recruiter',
      performed_by_type: 'client',
      performed_by_id: requested_by,
      description: reason ? `Client sent back application: ${reason}` : 'Client sent back application to recruiter',
      metadata: reason ? { reason } : undefined,
    });

    // Trigger webhook for send-back to recruiter
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
        oldStatus: 'shortlisted',
        newStatus: normalizedStatus,
        changedBy: requested_by,
        agencyId: agencyId,
      }).catch(err => console.error('[Webhook] Send-back to recruiter error:', err));
    }

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Application sent back to recruiter',
        application: updated,
      }),
      request
    );
  } catch (error) {
    console.error('Send-back error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}


