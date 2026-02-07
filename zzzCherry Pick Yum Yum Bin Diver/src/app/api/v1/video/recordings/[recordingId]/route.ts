import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';
import { getRecordingAccessLink } from '@/lib/daily';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/v1/video/recordings/[recordingId]
 * Get recording details including a temporary download link
 * 
 * The download link is valid for 1 hour.
 * 
 * TIER: Pro+
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  const tier = await getAgencyTier(auth.agencyId);
  if (tier === 'free') {
    return withCors(NextResponse.json({ 
      error: 'Video interview features require Pro plan',
    }, { status: 403 }));
  }

  const { recordingId } = await params;

  try {
    // Get recording and verify agency access
    const { data: recording, error } = await supabaseAdmin
      .from('video_call_recordings')
      .select(`
        *,
        video_call_rooms (
          id,
          daily_room_name,
          job_id,
          application_id,
          interview_id
        ),
        video_call_transcripts (
          id,
          full_text,
          summary,
          key_points,
          status,
          created_at
        )
      `)
      .eq('id', recordingId)
      .single();

    if (error || !recording) {
      return withCors(NextResponse.json({ error: 'Recording not found' }, { status: 404 }));
    }

    // Verify agency has access to this recording's job
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];
    
    if (!jobIds.includes(recording.video_call_rooms?.job_id)) {
      return withCors(NextResponse.json({ error: 'Recording not found' }, { status: 404 }));
    }

    // Get download link from Daily.co if recording is ready
    let downloadLink = null;
    let downloadExpiresAt = null;

    if (recording.status === 'ready' && recording.daily_recording_id) {
      try {
        const accessLink = await getRecordingAccessLink(recording.daily_recording_id);
        downloadLink = accessLink.download_link;
        downloadExpiresAt = new Date(accessLink.expires * 1000).toISOString();
      } catch (linkError) {
        console.error('Failed to get recording download link:', linkError);
        // Recording might be expired or deleted from Daily.co
      }
    }

    // Format transcript if available
    const transcript = recording.video_call_transcripts?.[0] || null;

    return withCors(NextResponse.json({
      recording: {
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
        createdAt: recording.created_at,
        processedAt: recording.processed_at,
      },
      download: downloadLink ? {
        url: downloadLink,
        expiresAt: downloadExpiresAt,
      } : null,
      transcript: transcript ? {
        id: transcript.id,
        status: transcript.status,
        fullText: transcript.full_text,
        summary: transcript.summary,
        keyPoints: transcript.key_points,
        createdAt: transcript.created_at,
      } : null,
    }));

  } catch (error) {
    console.error('API v1 video recordings GET error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

/**
 * POST /api/v1/video/recordings/[recordingId]
 * Trigger transcription for a recording
 * 
 * Body:
 *   action: 'transcribe' - Start AI transcription
 * 
 * TIER: Enterprise (Transcription requires Enterprise plan)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  const tier = await getAgencyTier(auth.agencyId);
  if (tier !== 'enterprise') {
    return withCors(NextResponse.json({ 
      error: 'AI transcription requires Enterprise plan. Contact sales@bpoc.app',
    }, { status: 403 }));
  }

  const { recordingId } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'transcribe') {
      return withCors(NextResponse.json({ 
        error: 'Invalid action. Supported actions: transcribe',
      }, { status: 400 }));
    }

    // Verify agency access
    const { data: recording } = await supabaseAdmin
      .from('video_call_recordings')
      .select(`
        *,
        video_call_rooms (
          job_id
        )
      `)
      .eq('id', recordingId)
      .single();

    if (!recording) {
      return withCors(NextResponse.json({ error: 'Recording not found' }, { status: 404 }));
    }

    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];
    
    if (!jobIds.includes(recording.video_call_rooms?.job_id)) {
      return withCors(NextResponse.json({ error: 'Recording not found' }, { status: 404 }));
    }

    // Check if recording is ready
    if (recording.status !== 'ready') {
      return withCors(NextResponse.json({ 
        error: 'Recording is not ready yet',
        status: recording.status,
      }, { status: 400 }));
    }

    // Check if transcript already exists
    const { data: existingTranscript } = await supabaseAdmin
      .from('video_call_transcripts')
      .select('id, status')
      .eq('recording_id', recordingId)
      .single();

    if (existingTranscript) {
      return withCors(NextResponse.json({
        success: true,
        message: 'Transcript already exists',
        transcriptId: existingTranscript.id,
        status: existingTranscript.status,
      }));
    }

    // Create transcript record (processing will happen async)
    const { data: transcript, error: insertError } = await supabaseAdmin
      .from('video_call_transcripts')
      .insert({
        recording_id: recordingId,
        room_id: recording.room_id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return withCors(NextResponse.json({ error: 'Failed to start transcription' }, { status: 500 }));
    }

    // TODO: Trigger async transcription job
    // For now, agencies can poll the transcript status or use webhooks

    return withCors(NextResponse.json({
      success: true,
      message: 'Transcription started',
      transcriptId: transcript.id,
      status: 'pending',
      hint: 'Poll GET /api/v1/video/transcripts/{id} to check status',
    }, { status: 202 }));

  } catch (error) {
    console.error('API v1 video recordings POST error:', error);
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
