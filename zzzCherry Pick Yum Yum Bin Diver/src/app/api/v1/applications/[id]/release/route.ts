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
 * POST /api/v1/applications/:id/release
 * Recruiter releases an application to the client (Recruiter Gate)
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
    const {
      released_by,
      share_calls_with_client,
      share_calls_with_candidate,
      status = 'shortlisted',
    } = body || {};

    if (!released_by || typeof released_by !== 'string') {
      return withCors(
        NextResponse.json({ error: 'released_by is required (UUID of recruiter auth user)' }, { status: 400 }),
        request
      );
    }

    // Verify application belongs to agency
    const clientIds = await getAgencyClientIds(agencyId);
    const { data: app } = await supabaseAdmin
      .from('job_applications')
      .select('id, status, jobs!inner(agency_client_id)')
      .eq('id', id)
      .in('jobs.agency_client_id', clientIds)
      .single();

    if (!app) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    const now = new Date().toISOString();

    const normalizeShareArray = (value: any) => (Array.isArray(value) ? value : []) as Array<any>;
    const clientShares = normalizeShareArray(share_calls_with_client);
    const candidateShares = normalizeShareArray(share_calls_with_candidate);

    const deriveShareBool = (s: any) =>
      s?.share === true ||
      s?.share_all === true ||
      !!s?.share_video ||
      !!s?.share_notes ||
      !!s?.share_transcript;

    let shareWarning: string | null = null;
    try {
      for (const s of clientShares) {
        if (!s?.room_id) continue;
        const shareAll = deriveShareBool(s);
        await supabaseAdmin
          .from('video_call_rooms')
          .update({
            share_with_client: shareAll,
          })
          .eq('id', s.room_id)
          .eq('application_id', id);

        await supabaseAdmin
          .from('video_call_transcripts')
          .update({
            shared_with_client: shareAll,
          })
          .eq('room_id', s.room_id);

        await supabaseAdmin
          .from('video_call_recordings')
          .update({
            shared_with_client: shareAll,
          })
          .eq('room_id', s.room_id);
      }

      for (const s of candidateShares) {
        if (!s?.room_id) continue;
        const shareAll = deriveShareBool(s);
        await supabaseAdmin
          .from('video_call_rooms')
          .update({
            share_with_candidate: shareAll,
          })
          .eq('id', s.room_id)
          .eq('application_id', id);

        await supabaseAdmin
          .from('video_call_transcripts')
          .update({
            shared_with_candidate: shareAll,
          })
          .eq('room_id', s.room_id);

        await supabaseAdmin
          .from('video_call_recordings')
          .update({
            shared_with_candidate: shareAll,
          })
          .eq('room_id', s.room_id);
      }
    } catch (e) {
      shareWarning = e instanceof Error ? e.message : 'Failed to update call sharing flags';
      console.error('V1 release: call sharing update failed (non-fatal):', e);
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        released_to_client: true,
        released_at: now,
        released_by,
        status: status || app.status,
        updated_at: now,
      })
      .eq('id', id)
      .select('id, status, released_to_client, released_at, released_by')
      .single();

    if (updateError || !updated) {
      console.error('Release application update failed:', updateError);
      return withCors(NextResponse.json({ error: 'Failed to release application' }, { status: 500 }), request);
    }

    // Log to timeline
    await logApplicationActivity(id, {
      action_type: 'released_to_client',
      performed_by_type: 'recruiter',
      performed_by_id: released_by,
      description: `Application released to client${updated.status ? ` (status: ${updated.status})` : ''}`,
      metadata: {
        share_calls_with_client_count: clientShares.length,
        share_calls_with_candidate_count: candidateShares.length,
      },
    });

    // Trigger webhook for release to client
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
        oldStatus: app.status || 'unknown',
        newStatus: updated.status || 'shortlisted',
        changedBy: released_by,
        agencyId: agencyId,
      }).catch(err => console.error('[Webhook] Release to client error:', err));
    }

    return withCors(
      NextResponse.json({
        success: true,
        application: updated,
        warning: shareWarning,
      }),
      request
    );
  } catch (error) {
    console.error('Release application error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}


