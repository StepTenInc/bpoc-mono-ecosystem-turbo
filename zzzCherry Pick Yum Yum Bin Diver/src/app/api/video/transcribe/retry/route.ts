/**
 * Manual Retry Endpoint for Failed Transcriptions
 * POST - Retry a failed transcription
 *
 * This endpoint allows admins to manually retry transcriptions that failed
 * due to temporary issues like CloudConvert timeouts, expired URLs, etc.
 *
 * Auth: Requires user authentication (Bearer token)
 *
 * Request body:
 * - roomId: string (optional) - Retry latest recording for this room
 * - recordingId: string (optional) - Retry specific recording
 * - transcriptId: string (optional) - Retry specific transcript
 *
 * At least one of roomId, recordingId, or transcriptId must be provided.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, recordingId, transcriptId } = body;

    console.log('🔄 [Transcribe Retry] Request received:', {
      roomId,
      recordingId,
      transcriptId,
      userId,
    });

    if (!roomId && !recordingId && !transcriptId) {
      return NextResponse.json(
        { error: 'At least one of roomId, recordingId, or transcriptId is required' },
        { status: 400 }
      );
    }

    // Find the transcript to retry
    let transcript: any = null;

    if (transcriptId) {
      // Direct transcript lookup
      const { data, error } = await supabaseAdmin
        .from('video_call_transcripts')
        .select('*, video_call_recordings(*), video_call_rooms(*)')
        .eq('id', transcriptId)
        .single();

      if (error || !data) {
        console.error('❌ [Transcribe Retry] Transcript not found:', transcriptId);
        return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
      }

      transcript = data;
    } else if (recordingId) {
      // Find transcript by recording ID
      const { data, error } = await supabaseAdmin
        .from('video_call_transcripts')
        .select('*, video_call_recordings(*), video_call_rooms(*)')
        .eq('recording_id', recordingId)
        .single();

      if (error || !data) {
        console.error('❌ [Transcribe Retry] No transcript found for recording:', recordingId);
        return NextResponse.json({ error: 'No transcript found for this recording' }, { status: 404 });
      }

      transcript = data;
    } else if (roomId) {
      // Find latest transcript for room
      const { data, error } = await supabaseAdmin
        .from('video_call_transcripts')
        .select('*, video_call_recordings(*), video_call_rooms(*)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error('❌ [Transcribe Retry] No transcript found for room:', roomId);
        return NextResponse.json({ error: 'No transcript found for this room' }, { status: 404 });
      }

      transcript = data;
    }

    const room = transcript.video_call_rooms;
    const recording = transcript.video_call_recordings;

    // Verify user has access to this transcript
    // Allow if user is host, participant, or recruiter for agency-hosted room
    const isHost = room.host_user_id === userId;
    const isParticipant = room.participant_user_id === userId;

    let isRecruiterForAgency = false;
    if (room.agency_id && room.host_user_id === room.agency_id) {
      const { data: recruiterRow } = await supabaseAdmin
        .from('agency_recruiters')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', room.agency_id)
        .maybeSingle();
      isRecruiterForAgency = !!recruiterRow;
    }

    if (!isHost && !isParticipant && !isRecruiterForAgency) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if transcript is in a retryable state
    if (transcript.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Transcript already completed',
          transcript,
        },
        { status: 400 }
      );
    }

    if (transcript.status === 'processing') {
      return NextResponse.json(
        {
          error: 'Transcript is currently being processed',
          transcript,
        },
        { status: 400 }
      );
    }

    // Get download URL for the recording
    let downloadUrl = recording.download_url || recording.recording_url;

    if (!downloadUrl) {
      console.error('❌ [Transcribe Retry] No download URL available for recording');
      return NextResponse.json(
        { error: 'No download URL available for this recording' },
        { status: 400 }
      );
    }

    console.log('✅ [Transcribe Retry] Found transcript to retry:', {
      transcriptId: transcript.id,
      recordingId: recording.id,
      roomId: room.id,
      currentStatus: transcript.status,
    });

    // Reset transcript status to processing
    await supabaseAdmin
      .from('video_call_transcripts')
      .update({
        status: 'processing',
        error_message: null,
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', transcript.id);

    // Trigger transcription via internal API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bpoc.io';

    try {
      const transcribeResponse = await fetch(`${baseUrl}/api/video/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          recordingId: recording.id,
          roomId: room.id,
          audioUrl: downloadUrl,
          transcriptId: transcript.id,
        }),
      });

      if (transcribeResponse.ok) {
        const result = await transcribeResponse.json();
        console.log('✅ [Transcribe Retry] Transcription retry initiated successfully');

        return NextResponse.json({
          success: true,
          message: 'Transcription retry initiated',
          transcript: result.transcript,
        });
      } else {
        const errorData = await transcribeResponse.json().catch(() => ({}));
        console.error('❌ [Transcribe Retry] Transcription retry failed:', transcribeResponse.status, errorData);

        // Update transcript with error
        await supabaseAdmin
          .from('video_call_transcripts')
          .update({
            status: 'failed',
            error_message: `Retry failed: ${JSON.stringify(errorData)}`,
          })
          .eq('id', transcript.id);

        return NextResponse.json(
          {
            error: 'Transcription retry failed',
            details: errorData,
          },
          { status: transcribeResponse.status }
        );
      }
    } catch (retryErr: any) {
      const errorMsg = `Failed to trigger transcription retry: ${retryErr?.message || retryErr}`;
      console.error('❌ [Transcribe Retry]', errorMsg);

      // Update transcript with error
      await supabaseAdmin
        .from('video_call_transcripts')
        .update({
          status: 'failed',
          error_message: errorMsg,
        })
        .eq('id', transcript.id);

      return NextResponse.json(
        {
          error: errorMsg,
          code: 'RETRY_TRIGGER_FAILED',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [Transcribe Retry] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retry transcription' },
      { status: 500 }
    );
  }
}
