/**
 * Video Call Join API
 * POST - Join an existing video call room
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { createMeetingToken, getDailyRoom } from '@/lib/daily';

function stripRoleSuffix(name: string) {
  return String(name || '')
    .replace(/\s+—\s+(Recruiter|Candidate|Client)\s*$/i, '')
    .replace(/\s+\((Recruiter|Candidate|Client)\)\s*$/i, '')
    .trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Get room from database
    const { data: room, error: roomError } = await supabaseAdmin
      .from('video_call_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user is authorized to join
    let isHost = room.host_user_id === userId;
    let isParticipant = room.participant_user_id === userId;

    // Fallback authorization (defensive):
    // Some external systems historically stored host_user_id as agency_id instead of recruiter auth uid.
    // If that happens, allow a recruiter in that agency to join as host.
    if (!isHost && room.agency_id && room.host_user_id === room.agency_id) {
      const { data: recruiterRow } = await supabaseAdmin
        .from('agency_recruiters')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', room.agency_id)
        .maybeSingle();
      if (recruiterRow) isHost = true;
    }

    // Fallback authorization for candidates if participant_user_id is missing but the room is tied to an application.
    if (!isParticipant && !room.participant_user_id && room.application_id) {
      const { data: appRow } = await supabaseAdmin
        .from('job_applications')
        .select('candidate_id')
        .eq('id', room.application_id)
        .maybeSingle();
      if (appRow?.candidate_id === userId) isParticipant = true;
    }

    if (!isHost && !isParticipant) {
      // Check if user has a valid invitation
      const { data: invitation } = await supabaseAdmin
        .from('video_call_invitations')
        .select('*')
        .eq('room_id', roomId)
        .eq('invitee_user_id', userId)
        .single();

      if (!invitation) {
        return NextResponse.json({ error: 'Not authorized to join this call' }, { status: 403 });
      }

      // Update invitation status
      await supabaseAdmin
        .from('video_call_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);
    }

    // Check room status
    if (room.status === 'ended') {
      return NextResponse.json({ error: 'This call has ended' }, { status: 400 });
    }

    // Verify Daily.co room still exists
    const dailyRoom = await getDailyRoom(room.daily_room_name);
    if (!dailyRoom) {
      return NextResponse.json({ error: 'Video room no longer exists' }, { status: 404 });
    }

    // Determine role and resolve a human name.
    // IMPORTANT: video_call_participants.role is constrained in DB; use allowed values.
    // - host: recruiter hosting the call
    // - candidate: candidate
    // - participant: fallback
    let participantRole: 'host' | 'candidate' | 'participant' = isHost ? 'host' : isParticipant ? 'candidate' : 'participant';
    let baseName = 'Participant';

    // Recruiter identity is best resolved from agency_recruiters by auth user_id
    const { data: recruiterRow } = await supabaseAdmin
      .from('agency_recruiters')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle();
    if (recruiterRow) {
      participantRole = 'host';
      baseName = `${(recruiterRow as any).first_name || ''} ${(recruiterRow as any).last_name || ''}`.trim() || baseName;
    } else {
      // Candidates table for candidates
      const { data: cand } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      if (cand) {
        if (participantRole === 'participant') participantRole = 'candidate';
        baseName = `${(cand as any).first_name || ''} ${(cand as any).last_name || ''}`.trim() || baseName;
      } else {
        // user_profiles fallback
        const { data: prof } = await supabaseAdmin
          .from('user_profiles')
          .select('full_name, first_name, last_name')
          .eq('user_id', userId)
          .maybeSingle();
        if (prof) {
          baseName =
            (prof as any).full_name ||
            `${(prof as any).first_name || ''} ${(prof as any).last_name || ''}`.trim() ||
            baseName;
        }
      }
    }

    baseName = stripRoleSuffix(baseName) || baseName;
    const dailyDisplayName =
      participantRole === 'host'
        ? `${baseName} — Recruiter`
        : participantRole === 'candidate'
          ? `${baseName} — Candidate`
          : baseName;

    // Create a new token for this user
    const token = await createMeetingToken({
      roomName: room.daily_room_name,
      userId: userId,
      userName: dailyDisplayName,
      isOwner: isHost,
      enableRecording: isHost, // Only host can record
      enableScreenShare: true,
    });

    // Best-effort: record attendance in video_call_participants so we know which recruiter actually hosted.
    // This complements webhook-based participant tracking (which can be missed).
    try {
      const now = new Date().toISOString();
      const role = participantRole;
      const res = await supabaseAdmin.from('video_call_participants').upsert(
        {
          room_id: roomId,
          user_id: userId,
          name: baseName || 'Participant',
          role,
          status: 'joined',
          joined_at: now,
          updated_at: now,
        },
        { onConflict: 'room_id,user_id' }
      );
      if (res.error) {
        console.error('[video/rooms/:roomId/join] Participant upsert failed (non-fatal):', res.error.message);
      }
    } catch (e) {
      console.error('[video/rooms/:roomId/join] Failed to upsert participant (non-fatal):', e);
    }

    // Update room status to active if first join
    if (room.status === 'created' || room.status === 'waiting') {
      await supabaseAdmin
        .from('video_call_rooms')
        .update({
          status: 'active',
          started_at: room.started_at || new Date().toISOString(),
        })
        .eq('id', roomId);
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.daily_room_name,
        url: room.daily_room_url,
        token,
        isHost,
        enableRecording: room.enable_recording,
        enableTranscription: room.enable_transcription,
      },
    });

  } catch (error) {
    console.error('Failed to join room:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join room' },
      { status: 500 }
    );
  }
}
