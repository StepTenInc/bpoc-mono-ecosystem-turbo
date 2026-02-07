/**
 * Video Call Room API - Single Room Operations
 * GET - Get room details
 * PATCH - Update room status
 * DELETE - End/delete room
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { deleteDailyRoom, getRoomPresence } from '@/lib/daily';

async function isAgencyHostedRoomHost(userId: string, room: any): Promise<boolean> {
  try {
    if (!userId || !room) return false;
    if (!room.agency_id) return false;
    // Agency-hosted convention: host_user_id == agency_id
    if (room.host_user_id !== room.agency_id) return false;

    const { data: recruiterRow } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id')
      .eq('user_id', userId)
      .eq('agency_id', room.agency_id)
      .maybeSingle();

    return !!recruiterRow;
  } catch {
    return false;
  }
}

async function ensureParticipantsForRoom(room: any) {
  try {
    if (!room?.id) return;

    const { count } = await supabaseAdmin
      .from('video_call_participants')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if ((count || 0) > 0) return;

    const joinedAt = room.started_at || new Date().toISOString();
    const leftAt = room.ended_at || new Date().toISOString();
    const durationSeconds =
      room.started_at && room.ended_at
        ? Math.max(0, Math.round((new Date(room.ended_at).getTime() - new Date(room.started_at).getTime()) / 1000))
        : null;

    // Host + candidate names best-effort (no "Host" placeholders)
    let hostName = 'Recruiter';
    if (room.host_user_id) {
      // Prefer agency_recruiters (auth user_id)
      const { data: recruiterRow } = await supabaseAdmin
        .from('agency_recruiters')
        .select('first_name, last_name')
        .eq('user_id', room.host_user_id)
        .maybeSingle();
      if (recruiterRow) {
        hostName = `${(recruiterRow as any).first_name || ''} ${(recruiterRow as any).last_name || ''}`.trim() || hostName;
      } else {
        // Then user_profiles
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
    }

    let candidateName = 'Candidate';
    if (room.participant_user_id) {
      const { data: cand } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name')
        .eq('id', room.participant_user_id)
        .maybeSingle();
      if (cand) candidateName = `${(cand as any).first_name || ''} ${(cand as any).last_name || ''}`.trim() || candidateName;
    }

    const fullRows = [
      {
        room_id: room.id,
        user_id: room.host_user_id || null,
        name: hostName,
        role: 'host',
        status: 'left',
        joined_at: joinedAt,
        left_at: leftAt,
        duration_seconds: durationSeconds,
      },
      {
        room_id: room.id,
        user_id: room.participant_user_id || null,
        name: candidateName,
        role: 'candidate',
        status: 'left',
        joined_at: joinedAt,
        left_at: leftAt,
        duration_seconds: durationSeconds,
      },
    ];

    const insert1 = await supabaseAdmin.from('video_call_participants').insert(fullRows);
    if (!insert1.error) return;

    // Fallback for environments missing some tracking columns
    const minimalRows = fullRows.map((r) => ({
      room_id: r.room_id,
      user_id: r.user_id,
      name: r.name,
      role: r.role,
      status: r.status,
      joined_at: r.joined_at,
    }));
    const insert2 = await supabaseAdmin.from('video_call_participants').insert(minimalRows);
    if (insert2.error) {
      console.warn('[Video Rooms] Failed to ensure participants:', insert2.error.message);
    }
  } catch (e) {
    console.warn('[Video Rooms] ensureParticipantsForRoom failed:', e);
  }
}

// GET - Get room details
export async function GET(
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
    const { data: room, error } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        *,
        video_call_recordings(*),
        video_call_transcripts(*),
        video_call_invitations(*)
      `)
      .eq('id', roomId)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check user has access
    const isHost = room.host_user_id === userId || (await isAgencyHostedRoomHost(userId, room));
    const isParticipant = room.participant_user_id === userId;
    if (!isHost && !isParticipant) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Get live presence if room is active
    let presence = null;
    if (['created', 'waiting', 'active'].includes(room.status)) {
      try {
        presence = await getRoomPresence(room.daily_room_name);
      } catch {
        // Room might not exist yet or be empty
      }
    }

    return NextResponse.json({
      success: true,
      room,
      presence,
    });

  } catch (error) {
    console.error('Failed to get room:', error);
    return NextResponse.json(
      { error: 'Failed to get room details' },
      { status: 500 }
    );
  }
}

// PATCH - Update room (status + notes/rating/outcome)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, startedAt, endedAt, notes, rating, outcome } = body;

    // Get room to verify ownership
    const { data: room, error: fetchError } = await supabaseAdmin
      .from('video_call_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (fetchError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only host can update room status
    const isHost = room.host_user_id === userId || (await isAgencyHostedRoomHost(userId, room));
    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can update room status' }, { status: 403 });
    }

    // Validate rating (1-5)
    if (rating !== undefined && rating !== null) {
      const r = Number(rating);
      if (!Number.isFinite(r) || r < 1 || r > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
      }
    }

    // Calculate duration if ending
    let durationSeconds = null;
    if (status === 'ended' && room.started_at) {
      const start = new Date(room.started_at).getTime();
      const end = endedAt ? new Date(endedAt).getTime() : Date.now();
      durationSeconds = Math.floor((end - start) / 1000);
    }

    // Update room
    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (startedAt) updateData.started_at = startedAt;
    if (endedAt || status === 'ended') {
      updateData.ended_at = endedAt || new Date().toISOString();
    }
    if (durationSeconds) updateData.duration_seconds = durationSeconds;
    if (notes !== undefined) updateData.notes = notes;
    if (rating !== undefined) updateData.rating = rating;
    if (outcome !== undefined) updateData.outcome = outcome;

    const { data: updatedRoom, error: updateError } = await supabaseAdmin
      .from('video_call_rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (status === 'ended') {
      await ensureParticipantsForRoom(updatedRoom);
    }

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    });

  } catch (error) {
    console.error('Failed to update room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

// DELETE - End and cleanup room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Get room
    const { data: room, error: fetchError } = await supabaseAdmin
      .from('video_call_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (fetchError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only host can delete room
    const isHost = room.host_user_id === userId || (await isAgencyHostedRoomHost(userId, room));
    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can end the call' }, { status: 403 });
    }

    // Calculate duration
    let durationSeconds = null;
    if (room.started_at) {
      const start = new Date(room.started_at).getTime();
      durationSeconds = Math.floor((Date.now() - start) / 1000);
    }

    // Update room status to ended
    const { error: updateError } = await supabaseAdmin
      .from('video_call_rooms')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', roomId);

    if (updateError) {
      console.error('Failed to update room status:', updateError);
    }

    // Ensure participants exist even if Daily participant webhooks are disabled
    await ensureParticipantsForRoom({
      ...room,
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    });

    // Cancel all pending invitations for this room
    const { error: inviteError } = await supabaseAdmin
      .from('video_call_invitations')
      .update({
        status: 'cancelled',
        responded_at: new Date().toISOString(),
      })
      .eq('room_id', roomId)
      .eq('status', 'pending');

    if (inviteError) {
      console.error('Failed to cancel invitations:', inviteError);
    }

    // Delete Daily.co room (this ends the call for everyone)
    try {
      await deleteDailyRoom(room.daily_room_name);
    } catch (dailyError) {
      console.error('Failed to delete Daily room:', dailyError);
      // Continue anyway - room might already be deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Call ended successfully',
      duration_seconds: durationSeconds,
    });

  } catch (error) {
    console.error('Failed to end room:', error);
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    );
  }
}
