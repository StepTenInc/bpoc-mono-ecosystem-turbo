import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../auth';
import { handleCorsOptions, withCors } from '../../cors';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/v1/video/recordings
 * List video recordings for agency's interviews
 * 
 * Query params:
 *   - roomId: Filter by specific room
 *   - applicationId: Filter by application
 *   - status: Filter by recording status (pending, ready, error)
 *   - hasTranscript: Filter by whether transcript exists
 *   - limit: Max results (default 50, max 100)
 *   - offset: Pagination offset
 * 
 * TIER: Pro+ (Video features require Pro plan)
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  const tier = await getAgencyTier(auth.agencyId);
  if (tier === 'free') {
    return withCors(NextResponse.json({ 
      error: 'Video interview features require Pro plan. Upgrade at bpoc.app/pricing',
    }, { status: 403 }));
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const applicationId = searchParams.get('applicationId');
  const status = searchParams.get('status');
  const hasTranscript = searchParams.get('hasTranscript');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Get agency's client IDs to verify access
    const clientIds = await getAgencyClientIds(auth.agencyId);
    
    if (clientIds.length === 0) {
      return withCors(NextResponse.json({ recordings: [], total: 0 }));
    }

    // Get jobs for these clients
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    if (jobIds.length === 0) {
      return withCors(NextResponse.json({ recordings: [], total: 0 }));
    }

    // Get video rooms for these jobs
    let roomQuery = supabaseAdmin
      .from('video_call_rooms')
      .select('id, application_id, job_id')
      .in('job_id', jobIds);

    if (applicationId) roomQuery = roomQuery.eq('application_id', applicationId);

    const { data: rooms } = await roomQuery;
    const roomIds = rooms?.map(r => r.id) || [];

    if (roomIds.length === 0) {
      return withCors(NextResponse.json({ recordings: [], total: 0 }));
    }

    // Build recordings query
    let query = supabaseAdmin
      .from('video_call_recordings')
      .select(`
        id,
        room_id,
        daily_recording_id,
        status,
        duration_seconds,
        file_size_mb,
        created_at,
        processed_at,
        video_call_rooms (
          id,
          daily_room_name,
          application_id,
          job_id,
          interview_id
        ),
        video_call_transcripts (
          id,
          status
        )
      `, { count: 'exact' })
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (roomId) query = query.eq('room_id', roomId);
    if (status) query = query.eq('status', status);

    const { data: recordings, count, error } = await query;

    if (error) {
      console.error('API v1 video recordings GET error:', error);
      return withCors(NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 }));
    }

    // Filter by hasTranscript if specified
    let filteredRecordings = recordings || [];
    if (hasTranscript !== null) {
      const wantTranscript = hasTranscript === 'true';
      filteredRecordings = filteredRecordings.filter((r: any) => {
        const hasT = r.video_call_transcripts && r.video_call_transcripts.length > 0;
        return wantTranscript ? hasT : !hasT;
      });
    }

    const formattedRecordings = filteredRecordings.map((recording: any) => ({
      id: recording.id,
      roomId: recording.room_id,
      roomName: recording.video_call_rooms?.daily_room_name,
      dailyRecordingId: recording.daily_recording_id,
      status: recording.status,
      duration: recording.duration_seconds,
      fileSizeMb: recording.file_size_mb,
      applicationId: recording.video_call_rooms?.application_id,
      jobId: recording.video_call_rooms?.job_id,
      interviewId: recording.video_call_rooms?.interview_id,
      hasTranscript: recording.video_call_transcripts && recording.video_call_transcripts.length > 0,
      transcriptStatus: recording.video_call_transcripts?.[0]?.status || null,
      createdAt: recording.created_at,
      processedAt: recording.processed_at,
    }));

    return withCors(NextResponse.json({
      recordings: formattedRecordings,
      total: count || 0,
      limit,
      offset,
    }));

  } catch (error) {
    console.error('API v1 video recordings error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

/**
 * Get agency tier for feature gating
 */
async function getAgencyTier(agencyId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agencyId)
    .single();
  
  return data?.api_tier || 'free';
}
