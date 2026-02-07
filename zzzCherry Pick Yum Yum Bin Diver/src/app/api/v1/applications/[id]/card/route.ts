import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createMeetingToken } from '@/lib/daily';
import {
  getApplicationActivityTimeline,
} from '@/lib/db/applications/queries.supabase';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/applications/[id]/card
 * Get full application card data including timeline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { agencyId } = auth;
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get('mode') || 'client').toLowerCase();
  const { id } = await params;

  try {
    // Verify application belongs to agency's jobs
    const clientIds = await getAgencyClientIds(agencyId);
    const { data: application } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs!inner(
          id,
          agency_client_id
        )
      `)
      .eq('id', id)
      .in('jobs.agency_client_id', clientIds)
      .single();

    if (!application) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    // Recruiter Gate: client mode can only access released apps
    if (mode === 'client' && !application.released_to_client) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }
    if (mode !== 'client' && mode !== 'recruiter') {
      return withCors(NextResponse.json({ error: 'Invalid mode. Use mode=client or mode=recruiter.' }, { status: 400 }), request);
    }

    // Get activity timeline
    const timeline = await getApplicationActivityTimeline(id);

    // Client feedback (migrated off job_applications)
    const { data: clientFeedback } = await supabaseAdmin
      .from('application_client_feedback')
      .select('notes, rating')
      .eq('application_id', id)
      .maybeSingle();

    // Back-compat fields used by existing consumers
    (application as any).client_notes = clientFeedback?.notes ?? null;
    (application as any).client_rating = clientFeedback?.rating ?? null;
    (application as any).client_tags = [];

    // Get related interviews
    const { data: interviews } = await supabaseAdmin
      .from('job_interviews')
      .select('*')
      .eq('application_id', id)
      .order('scheduled_at', { ascending: false });

    // Get related offers
    const { data: offers } = await supabaseAdmin
      .from('job_offers')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    // Get all video calls (recruiter + client) attached to this application.
    // IMPORTANT: Do NOT hardcode recruiter_prescreen only; Round 1/2/3 must also be visible (with sharing rules).
    const { data: calls } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        id,
        daily_room_name,
        daily_room_url,
        call_type,
        call_title,
        status,
        notes,
        rating,
        share_with_client,
        share_with_candidate,
        started_at,
        ended_at,
        duration_seconds,
        host_user_id,
        participant_user_id,
        created_at,
        recordings:video_call_recordings(
          id,
          recording_url,
          download_url,
          duration_seconds,
          status,
          shared_with_client,
          shared_with_candidate,
          created_at
        ),
        transcripts:video_call_transcripts(
          id,
          full_text,
          summary,
          key_points,
          word_count,
          status,
          shared_with_candidate,
          shared_with_client,
          created_at
        )
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    const filteredCalls = await Promise.all((calls || []).map(async (c: any) => {
      if (mode !== 'client') return c;

      const safe = { ...c };
      const isRecruiterCall = typeof safe.call_type === 'string' && safe.call_type.startsWith('recruiter_');

      // Recruiter Gate sharing rules apply to recruiter-led calls only.
      if (isRecruiterCall) {
        // Simplified: if share_with_client exists, it controls everything for this call.
        const shareAll = !!safe.share_with_client;

        if (!shareAll) {
          safe.notes = null;
          safe.transcripts = [];
          safe.recordings = [];
          safe.daily_room_url = null;
          safe.daily_room_name = null;
        }
      }

      // IMPORTANT: Daily private rooms require a token.
      // Many integrations (Daily JS/React) need token separately: callObject.join({ url, token }).
      // We keep the raw room URL and return explicit join_url + join_token for clients.
      if (safe.daily_room_name && safe.daily_room_url) {
        try {
          const token = await createMeetingToken({
            roomName: safe.daily_room_name,
            userId: application.jobs?.agency_client_id || undefined,
            userName: 'Client',
            isOwner: false,
            enableRecording: false,
            enableScreenShare: true,
          });
          const rawUrl = safe.daily_room_url;
          const joinUrl = `${rawUrl}?t=${token}`;
          safe.daily_room_url_raw = rawUrl;
          safe.join_url = joinUrl;
          safe.join_token = token;
        } catch (e) {
          // If token creation fails, keep raw URL (Daily may reject; better than crashing the endpoint)
          console.error('Failed to create client join token for room', safe.id, e);
        }
      }

      return safe;
    }));

    // Back-compat: "prescreens" now contains recruiter-led calls (including rounds), not only recruiter_prescreen.
    const recruiterCalls = filteredCalls.filter((c: any) => typeof c.call_type === 'string' && c.call_type.startsWith('recruiter_'));

    return withCors(NextResponse.json({
      application: {
        ...application,
        // New: all call artifacts (client + recruiter calls)
        calls: filteredCalls,
        // Legacy field (kept for existing consumers)
        prescreens: recruiterCalls,
        interviews: interviews || [],
        offers: offers || [],
        timeline: timeline || [],
      },
    }), request);
  } catch (error) {
    console.error('Error fetching application card:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to fetch application card' },
      { status: 500 }
    ), request);
  }
}


