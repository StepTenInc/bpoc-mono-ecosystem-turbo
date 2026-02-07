/**
 * Manual Recording Sync API
 * Fetches recordings directly from Daily.co API and syncs to our database
 * 
 * Use this when:
 * - Webhooks are not working
 * - Recordings are missing from UI
 * - Need to manually refresh recording status
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { listRecordings, getRecordingAccessLink } from '@/lib/daily';

// POST - Manually sync recordings for a room
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, roomName } = body;

    if (!roomId && !roomName) {
      return NextResponse.json({ error: 'roomId or roomName is required' }, { status: 400 });
    }

    // Get room
    let room;
    if (roomId) {
      const { data, error } = await supabaseAdmin
        .from('video_call_rooms')
        .select('id, daily_room_name, host_user_id, participant_user_id, enable_transcription')
        .eq('id', roomId)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      room = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('video_call_rooms')
        .select('id, daily_room_name, host_user_id, participant_user_id, enable_transcription')
        .eq('daily_room_name', roomName)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      room = data;
    }

    // Verify user has access
    if (room.host_user_id !== userId && room.participant_user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔄 [Sync] Fetching recordings for room:', room.daily_room_name);

    // Fetch recordings from Daily.co
    let dailyRecordings;
    try {
      dailyRecordings = await listRecordings(room.daily_room_name);
      console.log('🔄 [Sync] Found', dailyRecordings.length, 'recordings on Daily.co');
    } catch (dailyError: any) {
      console.error('🔄 [Sync] Failed to fetch from Daily:', dailyError);
      return NextResponse.json({ 
        error: 'Failed to fetch recordings from Daily.co',
        details: dailyError.message,
      }, { status: 500 });
    }

    if (!dailyRecordings || dailyRecordings.length === 0) {
      return NextResponse.json({ 
        message: 'No recordings found on Daily.co for this room',
        roomName: room.daily_room_name,
        synced: 0,
      });
    }

    // Sync each recording
    const syncResults = [];
    
    for (const dailyRec of dailyRecordings) {
      console.log('🔄 [Sync] Processing recording:', dailyRec.id);
      
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from('video_call_recordings')
        .select('id, status')
        .eq('daily_recording_id', dailyRec.id)
        .maybeSingle();

      if (existing) {
        console.log('🔄 [Sync] Recording already exists:', existing.id);
        
        // Update if status changed
        if (dailyRec.status === 'finished' && existing.status !== 'ready') {
          // Get download URL
          let downloadUrl = null;
          try {
            const accessLink = await getRecordingAccessLink(dailyRec.id);
            downloadUrl = accessLink.download_link;
          } catch (e) {
            console.error('🔄 [Sync] Failed to get access link:', e);
          }

          const { error: updateError } = await supabaseAdmin
            .from('video_call_recordings')
            .update({
              status: 'ready',
              duration_seconds: dailyRec.duration || 0,
              recording_url: downloadUrl,
              download_url: downloadUrl,
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('🔄 [Sync] Update failed:', updateError);
          }
          
          syncResults.push({ 
            dailyId: dailyRec.id, 
            action: 'updated', 
            dbId: existing.id,
            downloadUrl: downloadUrl ? 'yes' : 'no',
          });
        } else {
          syncResults.push({ dailyId: dailyRec.id, action: 'skipped', dbId: existing.id });
        }
        continue;
      }

      // Get download URL for finished recordings
      let downloadUrl = null;
      if (dailyRec.status === 'finished') {
        try {
          const accessLink = await getRecordingAccessLink(dailyRec.id);
          downloadUrl = accessLink.download_link;
        } catch (e) {
          console.error('🔄 [Sync] Failed to get access link:', e);
        }
      }

      // Insert new recording
      const { data: newRec, error: insertError } = await supabaseAdmin
        .from('video_call_recordings')
        .insert({
          room_id: room.id,
          daily_recording_id: dailyRec.id,
          status: dailyRec.status === 'finished' ? 'ready' : 'processing',
          duration_seconds: dailyRec.duration || 0,
          recording_url: downloadUrl,
          download_url: downloadUrl,
          storage_provider: 'daily',
        })
        .select()
        .single();

      if (insertError) {
        console.error('🔄 [Sync] Insert failed:', insertError);
        syncResults.push({ dailyId: dailyRec.id, action: 'error', error: insertError.message });
      } else {
        console.log('🔄 [Sync] Recording synced:', newRec?.id);
        syncResults.push({ 
          dailyId: dailyRec.id, 
          action: 'created', 
          dbId: newRec?.id,
          downloadUrl: downloadUrl ? 'yes' : 'no',
        });
      }
    }

    return NextResponse.json({
      success: true,
      roomName: room.daily_room_name,
      dailyRecordingsFound: dailyRecordings.length,
      synced: syncResults.filter(r => r.action === 'created').length,
      updated: syncResults.filter(r => r.action === 'updated').length,
      skipped: syncResults.filter(r => r.action === 'skipped').length,
      errors: syncResults.filter(r => r.action === 'error').length,
      results: syncResults,
    });

  } catch (error) {
    console.error('Sync recordings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// GET - Sync all recent rooms (for debugging)
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Get recent ended rooms for this user
    const { data: rooms, error } = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, daily_room_name, status, created_at')
      .or(`host_user_id.eq.${userId},participant_user_id.eq.${userId}`)
      .eq('status', 'ended')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'POST to this endpoint with { roomId } or { roomName } to sync recordings',
      recentEndedRooms: rooms?.map(r => ({
        id: r.id,
        roomName: r.daily_room_name,
        createdAt: r.created_at,
      })),
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
