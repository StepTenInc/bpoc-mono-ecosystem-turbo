/**
 * Video Call Recordings API
 * POST - Start recording
 * GET - Get recordings for a room
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { startRecording, stopRecording, listRecordings, getRecordingAccessLink } from '@/lib/daily';

async function canRecruiterActOnAgencyHostedRoom(userId: string, room: any): Promise<boolean> {
  if (!room?.agency_id) return false;
  if (room.host_user_id !== room.agency_id) return false;
  const { data: recruiterRow } = await supabaseAdmin
    .from('agency_recruiters')
    .select('id')
    .eq('user_id', userId)
    .eq('agency_id', room.agency_id)
    .maybeSingle();
  return !!recruiterRow;
}

// POST - Start or stop recording
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, action } = body; // action: 'start' | 'stop'

    if (!roomId || !action) {
      return NextResponse.json({ error: 'Room ID and action are required' }, { status: 400 });
    }

    // Get room and verify host
    const { data: room, error: roomError } = await supabaseAdmin
      .from('video_call_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const recruiterAgencyHostOk = await canRecruiterActOnAgencyHostedRoom(userId, room);
    if (room.host_user_id !== userId && !recruiterAgencyHostOk) {
      return NextResponse.json({ error: 'Only the host can control recording' }, { status: 403 });
    }

    if (action === 'start') {
      // Start recording
      const recording = await startRecording(room.daily_room_name);

      // Save recording record
      const { data: recordingRecord, error: saveError } = await supabaseAdmin
        .from('video_call_recordings')
        .insert({
          room_id: roomId,
          daily_recording_id: recording.id,
          status: 'processing',
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save recording record:', saveError);
      }

      return NextResponse.json({
        success: true,
        recording: {
          id: recordingRecord?.id,
          dailyId: recording.id,
          status: 'recording',
        },
      });

    } else if (action === 'stop') {
      // Stop recording
      await stopRecording(room.daily_room_name);

      // Update recording status
      await supabaseAdmin
        .from('video_call_recordings')
        .update({
          status: 'processing',
        })
        .eq('room_id', roomId)
        .is('processed_at', null);

      return NextResponse.json({
        success: true,
        message: 'Recording stopped. Processing will begin shortly.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Recording operation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Recording operation failed' },
      { status: 500 }
    );
  }
}

// GET - Get recordings for a room
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Get room and verify access
    const { data: room, error: roomError } = await supabaseAdmin
      .from('video_call_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const recruiterAgencyHostOk = await canRecruiterActOnAgencyHostedRoom(userId, room);
    if (room.host_user_id !== userId && room.participant_user_id !== userId && !recruiterAgencyHostOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get recordings from database
    const { data: recordings, error: recError } = await supabaseAdmin
      .from('video_call_recordings')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (recError) {
      throw recError;
    }

    // Check for new recordings from Daily.co
    try {
      const dailyRecordings = await listRecordings(room.daily_room_name);
      
      // Update any recordings with access links
      for (const recording of recordings || []) {
        if (recording.status === 'processing' && recording.daily_recording_id) {
          const dailyRec = dailyRecordings.find(r => r.id === recording.daily_recording_id);
          if (dailyRec && dailyRec.status === 'finished') {
            // Get access link
            const accessLink = await getRecordingAccessLink(recording.daily_recording_id);
            
            // Update recording
            await supabaseAdmin
              .from('video_call_recordings')
              .update({
                status: 'ready',
                download_url: accessLink.download_link,
                expires_at: new Date(accessLink.expires * 1000).toISOString(),
                duration_seconds: dailyRec.duration,
                processed_at: new Date().toISOString(),
              })
              .eq('id', recording.id);
          }
        }
      }
    } catch (dailyError) {
      console.error('Failed to sync with Daily recordings:', dailyError);
    }

    // Refetch updated recordings
    const { data: updatedRecordings } = await supabaseAdmin
      .from('video_call_recordings')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      recordings: updatedRecordings || [],
    });

  } catch (error) {
    console.error('Failed to get recordings:', error);
    return NextResponse.json(
      { error: 'Failed to get recordings' },
      { status: 500 }
    );
  }
}
