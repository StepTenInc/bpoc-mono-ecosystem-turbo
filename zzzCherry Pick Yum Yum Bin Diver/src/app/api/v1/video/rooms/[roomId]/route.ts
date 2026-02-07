import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';
import { createMeetingToken, getDailyRoom, deleteDailyRoom } from '@/lib/daily';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/v1/video/rooms/[roomId]
 * Get video room details and generate fresh join tokens
 * 
 * Use this to:
 *   - Get current room status
 *   - Generate new tokens if old ones expired
 *   - Get join URLs to send to participants
 * 
 * TIER: Pro+
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

  const { roomId } = await params;

  try {
    // Get room and verify agency access
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    const { data: room, error } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        *,
        video_call_recordings(
          id,
          daily_recording_id,
          status,
          duration_seconds,
          created_at
        )
      `)
      .eq('id', roomId)
      .in('job_id', jobIds)
      .single();

    if (error || !room) {
      return withCors(NextResponse.json({ error: 'Room not found' }, { status: 404 }));
    }

    // Check if room is still active on Daily.co
    let dailyRoomActive = false;
    try {
      const dailyRoom = await getDailyRoom(room.daily_room_name);
      dailyRoomActive = !!dailyRoom;
    } catch {
      dailyRoomActive = false;
    }

    // Generate fresh tokens if room is still active
    let hostToken = null;
    let participantToken = null;

    if (dailyRoomActive && room.status !== 'ended') {
      // Resolve a better host display name (avoid Daily showing "Host")
      let hostName = 'Recruiter';
      try {
        // If host_user_id is actually agency_id, use agency name.
        if (room.agency_id && room.host_user_id === room.agency_id) {
          const { data: agency } = await supabaseAdmin
            .from('agencies')
            .select('name')
            .eq('id', room.agency_id)
            .maybeSingle();
          if (agency?.name) hostName = agency.name;
        } else if (room.host_user_id) {
          // Otherwise attempt to use user_profiles (recruiter/admin) for name.
          const { data: prof } = await supabaseAdmin
            .from('user_profiles')
            .select('full_name, first_name, last_name')
            .eq('user_id', room.host_user_id)
            .maybeSingle();
          if (prof) {
            hostName =
              (prof as any).full_name ||
              `${(prof as any).first_name || ''} ${(prof as any).last_name || ''}`.trim() ||
              hostName;
          }
        }
      } catch {
        hostName = 'Recruiter';
      }

      // Get candidate info for token
      let candidateName = 'Candidate';
      if (room.application_id) {
        const { data: app } = await supabaseAdmin
          .from('job_applications')
          .select('candidate_id')
          .eq('id', room.application_id)
          .single();

        if (app?.candidate_id) {
          const { data: candidate } = await supabaseAdmin
            .from('candidates')
            .select('first_name, last_name, user_id')
            .eq('id', app.candidate_id)
            .single();

          if (candidate) {
            candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();
          }
        }
      }

      try {
        hostToken = await createMeetingToken({
          roomName: room.daily_room_name,
          userName: hostName,
          isOwner: true,
          enableRecording: room.enable_recording,
        });

        participantToken = await createMeetingToken({
          roomName: room.daily_room_name,
          userName: candidateName,
          isOwner: false,
        });
      } catch (tokenError) {
        console.error('Failed to generate new tokens:', tokenError);
      }
    }

    return withCors(NextResponse.json({
      room: {
        id: room.id,
        roomName: room.daily_room_name,
        roomUrl: room.daily_room_url,
        status: room.status,
        isActive: dailyRoomActive && room.status !== 'ended',
        recordingEnabled: room.enable_recording,
        transcriptionEnabled: room.enable_transcription,
        interviewId: room.interview_id,
        applicationId: room.application_id,
        jobId: room.job_id,
        duration: room.duration_seconds,
        createdAt: room.created_at,
        startedAt: room.started_at,
        endedAt: room.ended_at,
      },
      // Fresh tokens (null if room is ended)
      host: hostToken ? {
        joinUrl: `${room.daily_room_url}?t=${hostToken}`,
        token: hostToken,
      } : null,
      participant: participantToken ? {
        joinUrl: `${room.daily_room_url}?t=${participantToken}`,
        token: participantToken,
      } : null,
      // Associated recordings
      recordings: (room.video_call_recordings || []).map((r: any) => ({
        id: r.id,
        status: r.status,
        duration: r.duration_seconds,
        createdAt: r.created_at,
      })),
    }));

  } catch (error) {
    console.error('API v1 video rooms GET error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

/**
 * PATCH /api/v1/video/rooms/[roomId]
 * Update room status, outcome, and notes
 * 
 * Body:
 *   status?: 'ended' - Mark room as ended
 *   outcome?: 'successful' | 'no_show' | 'rescheduled' | 'cancelled' | 'needs_followup'
 *   notes?: string - Add notes about the call
 *   title?: string - Update call title
 * 
 * TIER: Pro+
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

  const { roomId } = await params;

  // Valid outcomes
  const validOutcomes = ['successful', 'no_show', 'rescheduled', 'cancelled', 'needs_followup'];

  try {
    const body = await request.json();
    const { status, outcome, notes, title } = body;

    // Validate outcome if provided
    if (outcome && !validOutcomes.includes(outcome)) {
      return withCors(NextResponse.json({ 
        error: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`,
      }, { status: 400 }));
    }

    // Verify agency access
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    const { data: room } = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, daily_room_name, status, interview_id')
      .eq('id', roomId)
      .in('job_id', jobIds)
      .single();

    if (!room) {
      return withCors(NextResponse.json({ error: 'Room not found' }, { status: 404 }));
    }

    const updateData: any = {};

    // Update notes directly on the room
    if (notes !== undefined) updateData.notes = notes;
    if (title !== undefined) updateData.call_title = title;
    if (outcome) updateData.outcome = outcome;

    if (status === 'ended') {
      updateData.status = 'ended';
      updateData.ended_at = new Date().toISOString();
      
      // Calculate duration if started_at exists
      const { data: fullRoom } = await supabaseAdmin
        .from('video_call_rooms')
        .select('started_at')
        .eq('id', roomId)
        .single();
      
      if (fullRoom?.started_at) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(fullRoom.started_at).getTime()) / 1000
        );
        updateData.duration_seconds = duration;
      }

      // Optionally delete room from Daily.co to free resources
      try {
        await deleteDailyRoom(room.daily_room_name);
      } catch {
        // Room may already be expired/deleted
      }
    }

    // Also update linked interview if exists
    if (notes && room.interview_id) {
      await supabaseAdmin
        .from('job_interviews')
        .update({ interviewer_notes: notes })
        .eq('id', room.interview_id);
    }

    // Update interview outcome based on call outcome
    if (outcome && room.interview_id) {
      const interviewOutcome = outcome === 'successful' ? 'passed' : 
                               outcome === 'no_show' ? 'no_show' : null;
      if (interviewOutcome) {
        await supabaseAdmin
          .from('job_interviews')
          .update({ outcome: interviewOutcome, status: 'completed' })
          .eq('id', room.interview_id);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('video_call_rooms')
      .update(updateData)
      .eq('id', roomId);

    if (updateError) {
      return withCors(NextResponse.json({ error: 'Failed to update room' }, { status: 500 }));
    }

    return withCors(NextResponse.json({ 
      success: true,
      status: updateData.status || room.status,
      outcome: updateData.outcome || null,
    }));

  } catch (error) {
    console.error('API v1 video rooms PATCH error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

/**
 * DELETE /api/v1/video/rooms/[roomId]
 * Delete a video room (only if not started)
 * 
 * TIER: Pro+
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

  const { roomId } = await params;

  try {
    // Verify agency access
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    const { data: room } = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, daily_room_name, status')
      .eq('id', roomId)
      .in('job_id', jobIds)
      .single();

    if (!room) {
      return withCors(NextResponse.json({ error: 'Room not found' }, { status: 404 }));
    }

    // Only allow deletion of rooms that haven't started
    if (room.status !== 'created') {
      return withCors(NextResponse.json({ 
        error: 'Cannot delete room that has already started. Use PATCH to end it instead.',
      }, { status: 400 }));
    }

    // Delete from Daily.co
    try {
      await deleteDailyRoom(room.daily_room_name);
    } catch {
      // Room may already be deleted
    }

    // Delete from database
    await supabaseAdmin
      .from('video_call_rooms')
      .delete()
      .eq('id', roomId);

    return withCors(NextResponse.json({ success: true }));

  } catch (error) {
    console.error('API v1 video rooms DELETE error:', error);
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
