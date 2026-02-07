/**
 * Daily.co Webhook Handler
 * Receives events from Daily.co for:
 * - recording.ready-to-download - When recording is processed
 * - meeting.ended - When meeting ends
 * - etc.
 * 
 * Configure in Daily.co dashboard: https://dashboard.daily.co/webhooks
 * Webhook URL: https://your-domain.com/api/video/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRecordingAccessLink } from '@/lib/daily';
import { uploadRecordingToPermanentStorage } from '@/lib/video-storage';
import crypto from 'crypto';
import { webhookVideoRecordingReady } from '@/lib/webhooks/events';

/**
 * Verify webhook signature from Daily.co
 *
 * Daily sends:
 * - x-webhook-signature: base64(hmac_sha256(secret, timestamp + "." + rawBody))
 * - x-webhook-timestamp: unix timestamp string
 *
 * IMPORTANT: We fail-open (log only) so we never block recordings in prod
 * if headers are missing/misconfigured.
 */
function verifyWebhookSignature(opts: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
}): { ok: boolean; reason?: string } {
  const { rawBody, signatureHeader, timestampHeader, secret } = opts;

  if (!secret) return { ok: true };
  if (!signatureHeader) return { ok: false, reason: 'missing signature header' };
  if (!timestampHeader) return { ok: false, reason: 'missing timestamp header' };

  // As per Daily docs: sign `${timestamp}.${rawBody}` and base64 encode
  const signedPayload = `${timestampHeader}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('base64');

  // Constant-time compare
  try {
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return { ok: false, reason: 'signature length mismatch' };
    const ok = crypto.timingSafeEqual(a, b);
    return ok ? { ok: true } : { ok: false, reason: 'signature mismatch' };
  } catch {
    return { ok: false, reason: 'signature compare failed' };
  }
}

// POST - Handle Daily.co webhooks
export async function POST(request: NextRequest) {
  // Log immediately that we received something
  console.log('🚨🚨🚨 [Daily Webhook] POST REQUEST RECEIVED 🚨🚨🚨');
  console.log('📬 [Daily Webhook] Timestamp:', new Date().toISOString());
  
  try {
    const rawBody = await request.text();
    
    // Log headers for debugging
    console.log('📬 [Daily Webhook] Headers received:', {
      contentType: request.headers.get('content-type'),
      signature: request.headers.get('x-daily-signature') || request.headers.get('x-webhook-signature'),
      timestamp: request.headers.get('x-daily-timestamp') || request.headers.get('x-webhook-timestamp'),
      userAgent: request.headers.get('user-agent'),
    });
    
    console.log('📬 [Daily Webhook] Raw body length:', rawBody.length);
    console.log('📬 [Daily Webhook] Raw body preview:', rawBody.substring(0, 500));

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.DAILY_WEBHOOK_SECRET;
    const signatureHeader = request.headers.get('x-webhook-signature') || request.headers.get('x-daily-signature');
    const timestampHeader = request.headers.get('x-webhook-timestamp') || request.headers.get('x-daily-timestamp');
    
    if (webhookSecret && signatureHeader && timestampHeader) {
      const verification = verifyWebhookSignature({
        rawBody,
        signatureHeader,
        timestampHeader,
        secret: webhookSecret,
      });
      
      if (!verification.ok) {
        console.error('❌ [Daily Webhook] Signature verification failed:', verification.reason);
        // Log but don't block - fail-open for production safety
        // In production, you might want to return 401 here
      } else {
        console.log('✅ [Daily Webhook] Signature verified');
      }
    } else if (webhookSecret) {
      console.warn('⚠️ [Daily Webhook] Secret configured but signature headers missing');
    }

    const event = JSON.parse(rawBody);
    
    // Daily uses "event" field, not "type" - handle both for safety
    // Per docs: { "event": "recording.ready", "room_name": "...", ... }
    const eventType = event.event || event.type;
    
    console.log('📬 [Daily Webhook] Parsed event:', {
      eventType,
      roomName: event.room_name || event.payload?.room_name,
      hasRecording: !!event.recording,
      recordingId: event.recording?.id || event.payload?.recording_id,
    });

    // Handle events - Daily docs use "recording.ready" not "recording.ready-to-download"
    // We handle BOTH for safety
    switch (eventType) {
      case 'recording.ready':
      case 'recording.ready-to-download':
        await handleRecordingReady(event);
        break;
        
      case 'recording.started':
        await handleRecordingStarted(event);
        break;
        
      case 'recording.error':
        await handleRecordingError(event);
        break;
        
      case 'meeting.started':
        // Per docs: { "event": "meeting.started", "room_name": "...", ... }
        console.log('📞 [Daily Webhook] Meeting started:', event.room_name || event.payload?.room_name);
        break;
        
      case 'meeting.ended':
        await handleMeetingEnded(event);
        break;
        
      case 'participant.joined':
        await handleParticipantJoined(event);
        break;
        
      case 'participant.left':
        await handleParticipantLeft(event);
        break;
        
      default:
        console.log(`📬 [Daily Webhook] Unhandled event type: ${eventType}`);
    }

    // ALWAYS return 200 so Daily doesn't mark webhook as failed
    return NextResponse.json({ success: true, received: eventType });

  } catch (error) {
    console.error('❌ [Daily Webhook] Error:', error);
    // Still return 200 to prevent Daily from circuit-breaking us
    // The error is logged, we can investigate
    return NextResponse.json({ success: true, error: 'logged' });
  }
}

// GET - Show ALL recordings and debug info
export async function GET(request: NextRequest) {
  try {
    // Get ALL recordings (not just 5)
    const { data: recordings, error: recError, count: recCount } = await supabaseAdmin
      .from('video_call_recordings')
      .select('id, room_id, daily_recording_id, status, recording_url, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    // Get ALL participants
    const { data: participants, error: partError, count: partCount } = await supabaseAdmin
      .from('video_call_participants')
      .select('id, room_id, user_id, name, role, status, joined_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    // Get ALL rooms (using only columns guaranteed to exist)
    const { data: rooms, error: roomError, count: roomCount } = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, daily_room_name, status, host_user_id, participant_user_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    // Get transcripts too
    const { data: transcripts, error: transError, count: transCount } = await supabaseAdmin
      .from('video_call_transcripts')
      .select('id, room_id, status, word_count, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    // Get invitations for debugging
    const { data: invitations, error: invError, count: invCount } = await supabaseAdmin
      .from('video_call_invitations')
      .select('id, room_id, invitee_user_id, status, expires_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Daily.co webhook endpoint ready',
      timestamp: new Date().toISOString(),
      totals: {
        recordings: recCount || 0,
        participants: partCount || 0,
        rooms: roomCount || 0,
        transcripts: transCount || 0,
        invitations: invCount || 0,
      },
      debug: {
        recordings: {
          total: recCount || 0,
          shown: recordings?.length || 0,
          error: recError?.message,
          data: recordings,
        },
        participants: {
          total: partCount || 0,
          shown: participants?.length || 0,
          error: partError?.message,
          data: participants,
        },
        rooms: {
          total: roomCount || 0,
          shown: rooms?.length || 0,
          error: roomError?.message,
          data: rooms,
        },
        transcripts: {
          total: transCount || 0,
          shown: transcripts?.length || 0,
          error: transError?.message,
          data: transcripts,
        },
        invitations: {
          total: invCount || 0,
          shown: invitations?.length || 0,
          error: invError?.message,
          data: invitations,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Daily.co webhook endpoint ready (debug failed)',
      timestamp: new Date().toISOString(),
      debugError: String(error),
    });
  }
}

/**
 * Handle recording ready event
 * This is called when Daily.co finishes processing a recording
 * 
 * Daily webhook formats (handle ALL variations):
 * 
 * Format A (legacy): { "event": "recording.ready", "room_name": "...", "recording": { "id": "...", "duration": ... } }
 * Format B (v1): { "type": "recording.ready-to-download", "payload": { "recording_id": "...", "room_name": "...", "duration": ... } }
 * Format C (v2): { "version": "...", "type": "...", "payload": { "recording_id": "...", "room_name": "...", "s3_key": "..." } }
 * 
 * Flow:
 * 1. Get temporary download URL from Daily
 * 2. Save initial record with Daily URL
 * 3. Upload to permanent Supabase Storage
 * 4. Update record with permanent URL
 * 5. Queue transcription if enabled
 */
async function handleRecordingReady(event: any) {
  // ROBUST PARSING: Handle ALL possible Daily.co webhook formats
  // Try to extract room_name from multiple possible locations
  const room_name = 
    event.room_name ||                    // Top-level (legacy)
    event.payload?.room_name ||           // In payload
    event.recording?.room_name ||         // In recording object
    '';
  
  // Try to extract recording_id from multiple possible locations
  const recording_id = 
    event.payload?.recording_id ||        // v1/v2 format in payload
    event.recording?.id ||                // Legacy format
    event.recording?.recording_id ||
    event.recording_id ||                 // Top-level
    event.payload?.id ||
    '';
  
  // Duration and s3_key
  const duration = 
    event.payload?.duration ||
    event.recording?.duration ||
    event.duration ||
    0;
  
  const s3_key = 
    event.payload?.s3_key ||
    event.payload?.s3key ||
    event.recording?.s3_key ||
    event.recording?.s3key ||
    event.s3_key ||
    null;
  
  console.log('🎬🎬🎬 [Daily Webhook] RECORDING READY EVENT RECEIVED 🎬🎬🎬');
  console.log('🎬 [Daily Webhook] Extracted values:', { 
    recording_id, 
    room_name, 
    duration, 
    s3_key,
  });
  console.log('🎬 [Daily Webhook] Raw event structure:', JSON.stringify({
    hasEvent: !!event.event,
    hasType: !!event.type,
    hasPayload: !!event.payload,
    hasRecording: !!event.recording,
    topLevelKeys: Object.keys(event),
    payloadKeys: event.payload ? Object.keys(event.payload) : [],
    recordingKeys: event.recording ? Object.keys(event.recording) : [],
  }));

  if (!recording_id) {
    console.error('❌ [Daily Webhook] Missing recording_id in event payload!');
    console.error('❌ [Daily Webhook] Full event for debugging:', JSON.stringify(event).substring(0, 2000));
    return;
  }
  
  if (!room_name) {
    console.error('❌ [Daily Webhook] Missing room_name in event payload!');
    console.error('❌ [Daily Webhook] Full event for debugging:', JSON.stringify(event).substring(0, 2000));
    return;
  }

  // Find the room by daily room name (try to include job/application ids for downstream linking)
  let room: any = null;
  let roomError: any = null;
  {
    const r1 = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, enable_transcription, job_id, application_id, agency_id')
      .eq('daily_room_name', room_name)
      .single();
    room = r1.data;
    roomError = r1.error;
  }
  if (roomError && /column .*job_id.* does not exist|column .*application_id.* does not exist|column .*agency_id.* does not exist/i.test(roomError.message || '')) {
    const r2 = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, enable_transcription')
      .eq('daily_room_name', room_name)
      .single();
    room = r2.data;
    roomError = r2.error;
  }

  if (roomError || !room) {
    console.error('❌❌❌ [Daily Webhook] ROOM NOT FOUND IN DATABASE ❌❌❌');
    console.error('❌ [Daily Webhook] Looking for daily_room_name:', room_name);
    console.error('❌ [Daily Webhook] Error:', roomError?.message || 'No room returned');
    
    // List all rooms to debug
    const { data: allRooms } = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, daily_room_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    console.error('❌ [Daily Webhook] Recent rooms in DB:', JSON.stringify(allRooms));
    
    // IMPORTANT: We cannot save recording without a room_id (foreign key constraint)
    // But we should log this clearly so it's obvious in Vercel logs
    console.error('❌ [Daily Webhook] RECORDING NOT SAVED - Room must exist first');
    return;
  }
  
  console.log('✅ [Daily Webhook] Found room in DB:', { roomId: room.id, enableTranscription: room.enable_transcription });

  try {
    // STEP 1: Check if recording already exists (IDEMPOTENCY - prevent duplicates)
    const { data: existingRecording } = await supabaseAdmin
      .from('video_call_recordings')
      .select('id, status')
      .eq('daily_recording_id', recording_id)
      .maybeSingle();

    if (existingRecording) {
      console.log('⚠️ [Daily Webhook] Recording already exists (idempotent):', existingRecording.id);
      // If already processing or ready, skip to prevent duplicates
      if (existingRecording.status === 'ready' || existingRecording.status === 'processing') {
        console.log('✅ [Daily Webhook] Recording already processed, skipping duplicate webhook');
        return;
      }
    }

    // STEP 2: Save or update recording info
    // Use only columns guaranteed to exist in all environments
    const basicRecordingData: Record<string, any> = {
      room_id: room.id,
      daily_recording_id: recording_id,
      storage_provider: 'daily',
      storage_path: s3_key || null,
      duration_seconds: Math.round(duration || 0),
      status: 'processing',
    };
    
    console.log('💾 [Daily Webhook] Saving recording info:', JSON.stringify(basicRecordingData));

    let recordingRecord: any = null;

    if (existingRecording) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('video_call_recordings')
        .update(basicRecordingData)
        .eq('id', existingRecording.id)
        .select()
        .single();
      
      recordingRecord = data;
      if (error) {
        console.error('❌ [Daily Webhook] Update failed:', error);
      } else {
        console.log('✅ [Daily Webhook] Recording UPDATED:', recordingRecord?.id);
      }
    } else {
      // Insert new - try with full data, fallback to minimal
      let { data, error: insertError } = await supabaseAdmin
        .from('video_call_recordings')
        .insert(basicRecordingData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ [Daily Webhook] Insert failed, trying minimal insert:', insertError.message);
        
        // Fallback: only essential columns
        const minimalData = {
          room_id: room.id,
          daily_recording_id: recording_id,
          status: 'processing',
        };
        
        const fallbackResult = await supabaseAdmin
          .from('video_call_recordings')
          .insert(minimalData)
          .select()
          .single();
        
        if (fallbackResult.error) {
          console.error('❌❌❌ [Daily Webhook] FAILED to save recording (even minimal):', {
            message: fallbackResult.error.message,
            code: fallbackResult.error.code,
          });
          return;
        }
        
        data = fallbackResult.data;
      }
      
      recordingRecord = data;
      console.log('✅✅✅ [Daily Webhook] Recording SAVED:', recordingRecord?.id);
    }

    // STEP 2: Try to get access link from Daily (might fail if API key not set)
    let dailyDownloadUrl: string | null = null;
    let expiresAt: string | null = null;
    
    console.log('🔗 [Daily Webhook] STEP 2: Fetching access link for recording:', recording_id);
    try {
      const accessLink = await getRecordingAccessLink(recording_id);
      dailyDownloadUrl = accessLink.download_link;
      expiresAt = new Date(accessLink.expires * 1000).toISOString();
      console.log('📎 [Daily Webhook] Got Daily download URL (expires:', expiresAt, ')');
    } catch (accessErr) {
      console.error('⚠️ [Daily Webhook] Could not get access link (API key issue?):', accessErr);
      // Continue without URL - we at least have the recording record
    }

    // STEP 3: Update with URL if we got it
    if (dailyDownloadUrl) {
      const { error: urlUpdateError } = await supabaseAdmin
        .from('video_call_recordings')
        .update({
          recording_url: dailyDownloadUrl,
          download_url: dailyDownloadUrl,
          status: 'ready',
          processed_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('daily_recording_id', recording_id);

      if (urlUpdateError) {
        console.error('❌ [Daily Webhook] Failed to update URL:', urlUpdateError);
      } else {
        console.log('✅ [Daily Webhook] Recording URL updated successfully');
      }
    } else {
      // Still mark as ready even without URL
      await supabaseAdmin
        .from('video_call_recordings')
        .update({ status: 'ready' })
        .eq('daily_recording_id', recording_id);
    }

    // Upload to permanent storage (Supabase Storage) if we have a valid Daily download URL.
    // Note: Daily URLs can be missing if the API key isn't configured, or if access-link fetch failed.
    let uploadResult: { success: boolean; publicUrl?: string; storagePath?: string; error?: string } = {
      success: false,
      error: 'No Daily download URL available',
    };
    if (dailyDownloadUrl) {
      uploadResult = await uploadRecordingToPermanentStorage(
        dailyDownloadUrl,
        room.id,
        recording_id
      );
    } else {
      console.warn('⚠️ [Daily Webhook] Skipping permanent upload: missing Daily download URL');
    }

    if (uploadResult.success && uploadResult.publicUrl) {
      // Update with permanent URL
      await supabaseAdmin
        .from('video_call_recordings')
        .update({
          recording_url: uploadResult.publicUrl,
          download_url: uploadResult.publicUrl,
          storage_provider: 'supabase',
          storage_path: uploadResult.storagePath,
          status: 'ready',
          expires_at: null, // Permanent storage doesn't expire
        })
        // Always match by Daily recording id (unique) so duplicate webhook events still update correctly.
        .eq('daily_recording_id', recording_id);

      console.log('✅ [Daily Webhook] Recording uploaded to permanent storage:', uploadResult.publicUrl);
    } else {
      // Permanent upload failed, but Daily URL is still saved
      console.warn('⚠️ [Daily Webhook] Permanent storage upload failed, keeping Daily URL:', uploadResult.error);
      
      // Still mark as ready with Daily URL
      await supabaseAdmin
        .from('video_call_recordings')
        .update({ status: 'ready' })
        .eq('daily_recording_id', recording_id);
    }

    // Trigger webhook for recording ready
    if (recordingRecord?.id && room.application_id && room.agency_id) {
      const finalRecordingUrl = uploadResult.publicUrl || dailyDownloadUrl || null;

      webhookVideoRecordingReady({
        recordingId: recordingRecord.id,
        roomId: room.id,
        applicationId: room.application_id,
        downloadUrl: finalRecordingUrl || undefined,
        playbackUrl: finalRecordingUrl || undefined,
        duration: duration || undefined,
        agencyId: room.agency_id,
      }).catch(err => console.error('[Webhook] Video recording ready error:', err));
    }

    // Queue transcription if enabled - directly trigger transcription API
    if (room.enable_transcription) {
      const transcriptionUrl = uploadResult.publicUrl || dailyDownloadUrl || '';
      if (!transcriptionUrl) {
        console.warn('⚠️ [Daily Webhook] No transcription URL available (upload + daily url missing)');
        return;
      }
      // IMPORTANT: Use our DB recording UUID, not Daily recording id.
      if (recordingRecord?.id) {
        console.log('🤖 [Daily Webhook] Triggering auto-transcription for recording:', recordingRecord.id);
        
        // Instead of just queueing, directly trigger the transcription API
        try {
          const transcribeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.bpoc.io'}/api/video/transcribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': process.env.DAILY_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
              roomId: room.id,
              recordingId: recordingRecord.id,
              audioUrl: transcriptionUrl,
              source: 'webhook',
            }),
          });
          
          if (transcribeResponse.ok) {
            console.log('✅ [Daily Webhook] Auto-transcription initiated successfully');
          } else {
            const errorData = await transcribeResponse.json().catch(() => ({}));
            console.error('❌ [Daily Webhook] Auto-transcription failed:', transcribeResponse.status, errorData);
          }
        } catch (transcribeErr) {
          console.error('❌ [Daily Webhook] Failed to trigger auto-transcription:', transcribeErr);
        }
      } else {
        console.warn('⚠️ [Daily Webhook] No recordingRecord.id available; cannot trigger auto-transcription');
      }
    }

  } catch (err) {
    console.error('❌ [Daily Webhook] Error processing recording:', err);
  }
}

/**
 * Queue a transcription job for Whisper processing
 */
async function queueTranscriptionJob(
  roomId: string,
  recordingId: string,
  audioUrl: string,
  jobId?: string | null,
  applicationId?: string | null
) {
  console.log('📝 [Daily Webhook] Queueing transcription for room:', roomId);

  // Best-effort job id inference if missing
  let inferredJobId: string | null | undefined = jobId;
  if (!inferredJobId && applicationId) {
    const { data: app } = await supabaseAdmin
      .from('job_applications')
      .select('job_id')
      .eq('id', applicationId)
      .maybeSingle();
    inferredJobId = (app as any)?.job_id || null;
  }

  // Create a transcript record in queued state (worker will pick it up)
  const { data: transcript, error } = await supabaseAdmin
    .from('video_call_transcripts')
    .insert({
      room_id: roomId,
      recording_id: recordingId,
      job_id: inferredJobId || null,
      status: 'queued',
      transcription_provider: 'whisper',
      // processing_started_at is set when worker claims the job
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [Daily Webhook] Failed to create transcript record:', error);
    return;
  }

  console.log('✅ [Daily Webhook] Transcript job queued:', { transcriptId: transcript.id, roomId, recordingId, hasAudioUrl: !!audioUrl });
}

/**
 * Handle recording started event
 */
async function handleRecordingStarted(event: any) {
  // ROBUST PARSING: Handle all Daily.co formats
  const room_name = 
    event.room_name || event.payload?.room_name || event.recording?.room_name || '';
  const recording_id = 
    event.payload?.recording_id || event.recording?.id || event.recording?.recording_id || 
    event.recording_id || event.payload?.id || '';
  
  console.log('🔴 [Daily Webhook] Recording started:', { recording_id, room_name });

  const { data: room } = await supabaseAdmin
    .from('video_call_rooms')
    .select('id')
    .eq('daily_room_name', room_name)
    .single();

  if (room) {
    await supabaseAdmin
      .from('video_call_recordings')
      .upsert({
        room_id: room.id,
        daily_recording_id: recording_id,
        status: 'processing',
        webhook_received_at: new Date().toISOString(),
      }, {
        onConflict: 'daily_recording_id',
      });
    console.log('✅ [Daily Webhook] Recording started - saved to DB');
  } else {
    console.warn('⚠️ [Daily Webhook] Room not found for recording.started:', room_name);
  }
}

/**
 * Handle recording error event
 */
async function handleRecordingError(event: any) {
  // Handle both formats
  const room_name = event.room_name || event.payload?.room_name;
  const recording = event.recording || event.payload || {};
  const recording_id = recording.id || recording.recording_id || event.payload?.recording_id;
  const error = event.error || event.payload?.error;
  
  console.error('❌ [Daily Webhook] Recording error:', { recording_id, room_name, error });

  const { data: room } = await supabaseAdmin
    .from('video_call_rooms')
    .select('id')
    .eq('daily_room_name', room_name)
    .single();

  if (room) {
    await supabaseAdmin
      .from('video_call_recordings')
      .update({
        status: 'failed',
        webhook_payload: event,
      })
      .eq('daily_recording_id', recording_id);
  }
}

/**
 * Handle meeting ended event
 */
async function handleMeetingEnded(event: any) {
  // Per docs: { "event": "meeting.ended", "room_name": "...", "duration": 3600 }
  const room_name = event.room_name || event.payload?.room_name;
  const duration = event.duration || event.payload?.duration;
  
  console.log('📞 [Daily Webhook] Meeting ended:', { room_name, duration });

  const { error } = await supabaseAdmin
    .from('video_call_rooms')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_seconds: Math.round(duration || 0),
    })
    .eq('daily_room_name', room_name)
    .in('status', ['created', 'waiting', 'active']);

  if (error) {
    console.error('❌ [Daily Webhook] Failed to update meeting ended:', error);
  } else {
    console.log('✅ [Daily Webhook] Meeting ended - status updated');
  }

  // Fallback: if Daily isn't configured to send participant.* events,
  // ensure we still create participant rows so the table isn't empty.
  try {
    const { data: room } = await supabaseAdmin
      .from('video_call_rooms')
      .select('id, host_user_id, participant_user_id, started_at, ended_at')
      .eq('daily_room_name', room_name)
      .single();

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

    // Candidate name (if we can resolve it)
    let candidateName = 'Candidate';
    if (room.participant_user_id) {
      const { data: cand } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name')
        .eq('id', room.participant_user_id)
        .maybeSingle();
      if (cand) candidateName = `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || candidateName;
    }

    await supabaseAdmin.from('video_call_participants').insert([
      {
        room_id: room.id,
        user_id: room.host_user_id || null,
        name: 'Host',
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
    ]);

    console.log('✅ [Daily Webhook] Fallback participants inserted (participant.* events may be disabled)');
  } catch (e) {
    console.warn('⚠️ [Daily Webhook] Fallback participant insert failed:', e);
  }
}

/**
 * Handle participant joined event
 * 
 * Per docs structure:
 * {
 *   "event": "participant.joined",
 *   "room_name": "my-room",
 *   "participant": { "id": "...", "user_id": "...", "user_name": "..." }
 * }
 */
async function handleParticipantJoined(event: any) {
  // Handle both formats
  const room_name = event.room_name || event.payload?.room_name;
  const participant = event.participant || event.payload?.participant || event.payload || {};
  let participantName = participant.user_name || participant.userName || '';
  const participantUserId = participant.user_id || participant.userId; // Set via meeting token
  // If token includes role suffix (e.g. "Stephen — Recruiter"), strip it for DB storage.
  const stripRoleSuffix = (name: string) =>
    String(name || '')
      .replace(/\s+—\s+(Recruiter|Candidate|Client)\s*$/i, '')
      .replace(/\s+\((Recruiter|Candidate|Client)\)\s*$/i, '')
      .trim();
  participantName = stripRoleSuffix(participantName);

  // Daily participant session id is useful for debugging, but our DB schema does not include a session_id column.
  // Keep it only in logs to avoid insert failures.
  const sessionId = participant.session_id || participant.id;
  
  console.log('👤 [Daily Webhook] Participant joined:', { 
    room_name, 
    participantName, 
    participantUserId,
    sessionId 
  });

  // Get the room with host/participant info
  // NOTE: host_name and participant_name columns may not exist in all environments
  const { data: room, error: roomError } = await supabaseAdmin
    .from('video_call_rooms')
    .select('id, host_user_id, participant_user_id')
    .eq('daily_room_name', room_name)
    .single();

  if (roomError || !room) {
    console.error('❌ [Daily Webhook] Room not found for participant:', room_name);
    return;
  }

  // If name is empty/unknown, try to get it from the database
  if (!participantName || participantName === 'Unknown') {
    if (participantUserId) {
      // Lookup from candidates table
      const { data: candidateData } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name')
        .eq('id', participantUserId)
        .single();
      
      if (candidateData) {
        participantName = `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'Unknown';
        console.log('✅ [Daily Webhook] Found participant name from DB:', participantName);
      } else {
        // Fallback: user_profiles for recruiter/admin users
        const { data: profileData } = await supabaseAdmin
          .from('user_profiles')
          .select('first_name, last_name, full_name')
          .eq('user_id', participantUserId)
          .maybeSingle();
        if (profileData) {
          participantName =
            (profileData.full_name as string) ||
            `${(profileData.first_name as string) || ''} ${(profileData.last_name as string) || ''}`.trim() ||
            'Unknown';
        }
      }
    }
  }

  // Final fallback
  if (!participantName) participantName = 'Unknown';

  // Update room status to active if first participant
  await supabaseAdmin
    .from('video_call_rooms')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', room.id)
    .in('status', ['created', 'waiting']);

  // Determine participant role
  let role = 'participant';
  if (participantUserId === room.host_user_id) {
    role = 'host';
  } else if (participantUserId === room.participant_user_id) {
    role = 'candidate';
  }

  // Check if participant already exists for this room
  // Prefer user_id match when available, otherwise fall back to name match.
  let existingQuery = supabaseAdmin
    .from('video_call_participants')
    .select('id')
    .eq('room_id', room.id);
  if (participantUserId) {
    existingQuery = existingQuery.eq('user_id', participantUserId);
  } else {
    existingQuery = existingQuery.eq('name', participantName || 'Unknown');
  }
  const { data: existingParticipant } = await existingQuery.maybeSingle();

  if (existingParticipant) {
    console.log('⚠️ [Daily Webhook] Participant already exists, updating status');
    const { error: updateError } = await supabaseAdmin
      .from('video_call_participants')
      .update({ 
        status: 'joined', 
        joined_at: new Date().toISOString(),
        name: participantName, // Update name in case it was Unknown before
        role, // Keep role consistent
      })
      .eq('id', existingParticipant.id);
    
    if (updateError) {
      console.error('❌ [Daily Webhook] Update failed:', updateError);
    } else {
      console.log('✅ [Daily Webhook] Participant updated successfully');
    }
    return;
  }

  // Prepare participant data
  const participantData = {
    room_id: room.id,
    user_id: participantUserId || null,
    name: participantName,
    role,
    status: 'joined',
    joined_at: new Date().toISOString(),
  };
  
  console.log('💾 [Daily Webhook] Saving participant:', JSON.stringify(participantData, null, 2));

  const { data: insertedParticipant, error: insertError } = await supabaseAdmin
    .from('video_call_participants')
    .insert(participantData)
    .select()
    .single();

  if (insertError) {
    console.error('❌❌❌ [Daily Webhook] FAILED to save participant:', {
      message: insertError.message,
      code: insertError.code,
    });
  } else {
    console.log('✅✅✅ [Daily Webhook] Participant SAVED:', insertedParticipant?.id);
  }
}

/**
 * Handle participant left event
 * - Updates participant record with left_at and duration
 */
async function handleParticipantLeft(event: any) {
  // Handle both formats
  const room_name = event.room_name || event.payload?.room_name;
  const participant = event.participant || event.payload?.participant || event.payload || {};
  const participantUserId = participant.user_id || participant.userId;
  const participantName = participant.user_name || participant.userName || 'Unknown';
  
  console.log('👋 [Daily Webhook] Participant left:', { 
    room_name, 
    participantName,
    participantUserId 
  });

  // Get the room
  const { data: room } = await supabaseAdmin
    .from('video_call_rooms')
    .select('id')
    .eq('daily_room_name', room_name)
    .single();

  if (!room) {
    console.error('❌ [Daily Webhook] Room not found for participant left:', room_name);
    return;
  }

  // Find the participant record to update
  let query = supabaseAdmin
    .from('video_call_participants')
    .select('id, joined_at')
    .eq('room_id', room.id)
    .eq('status', 'joined');

  // Match by user_id if available, otherwise by name
  if (participantUserId) {
    query = query.eq('user_id', participantUserId);
  } else {
    query = query.eq('name', participantName);
  }

  const { data: participantRecord } = await query.single();

  if (participantRecord) {
    const leftAt = new Date();
    const joinedAt = participantRecord.joined_at ? new Date(participantRecord.joined_at) : null;
    const durationSeconds = joinedAt 
      ? Math.round((leftAt.getTime() - joinedAt.getTime()) / 1000)
      : null;

    const { error: updateError } = await supabaseAdmin
      .from('video_call_participants')
      .update({
        status: 'left',
        left_at: leftAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', participantRecord.id);

    if (updateError) {
      console.error('❌ [Daily Webhook] Failed to update participant left:', updateError);
    } else {
      console.log('✅ [Daily Webhook] Participant left recorded:', { 
        participantName, 
        durationSeconds 
      });
    }
  }
}

// GET endpoint is defined above with debug info
