import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/v1/video/transcripts/[transcriptId]
 * Get transcript details with full text, summary, and key points
 * 
 * TIER: Enterprise (Transcription requires Enterprise plan)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transcriptId: string }> }
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

  const { transcriptId } = await params;

  try {
    // Get transcript with room info
    const { data: transcript, error } = await supabaseAdmin
      .from('video_call_transcripts')
      .select(`
        *,
        video_call_recordings (
          id,
          duration_seconds,
          status
        ),
        video_call_rooms (
          id,
          daily_room_name,
          job_id,
          application_id,
          interview_id,
          started_at,
          ended_at
        )
      `)
      .eq('id', transcriptId)
      .single();

    if (error || !transcript) {
      return withCors(NextResponse.json({ error: 'Transcript not found' }, { status: 404 }));
    }

    // Verify agency access
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];
    
    if (!jobIds.includes(transcript.video_call_rooms?.job_id)) {
      return withCors(NextResponse.json({ error: 'Transcript not found' }, { status: 404 }));
    }

    // Get candidate info for context
    let candidateInfo = null;
    if (transcript.video_call_rooms?.application_id) {
      const { data: app } = await supabaseAdmin
        .from('job_applications')
        .select('candidate_id')
        .eq('id', transcript.video_call_rooms.application_id)
        .single();

      if (app?.candidate_id) {
        const { data: candidate } = await supabaseAdmin
          .from('candidates')
          .select('first_name, last_name, email')
          .eq('id', app.candidate_id)
          .single();

        if (candidate) {
          candidateInfo = {
            name: `${candidate.first_name} ${candidate.last_name}`.trim(),
            email: candidate.email,
          };
        }
      }
    }

    return withCors(NextResponse.json({
      transcript: {
        id: transcript.id,
        status: transcript.status,
        fullText: transcript.full_text,
        summary: transcript.summary,
        keyPoints: transcript.key_points,
        segments: transcript.segments, // Time-stamped segments if available
        wordCount: transcript.full_text ? transcript.full_text.split(/\s+/).length : 0,
        createdAt: transcript.created_at,
        processedAt: transcript.processed_at,
      },
      recording: transcript.video_call_recordings ? {
        id: transcript.video_call_recordings.id,
        duration: transcript.video_call_recordings.duration_seconds,
      } : null,
      interview: {
        roomId: transcript.video_call_rooms?.id,
        roomName: transcript.video_call_rooms?.daily_room_name,
        applicationId: transcript.video_call_rooms?.application_id,
        jobId: transcript.video_call_rooms?.job_id,
        interviewId: transcript.video_call_rooms?.interview_id,
        startedAt: transcript.video_call_rooms?.started_at,
        endedAt: transcript.video_call_rooms?.ended_at,
      },
      candidate: candidateInfo,
    }));

  } catch (error) {
    console.error('API v1 video transcripts GET error:', error);
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
