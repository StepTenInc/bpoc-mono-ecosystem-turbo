/**
 * Video Call Transcription API
 * POST - Transcribe a recording using Whisper
 * GET - Get transcripts for a room
 * 
 * Supports two auth modes:
 * 1. User auth (Bearer token) - for manual transcription requests
 * 2. Webhook auth (x-webhook-secret) - for automatic transcription from Daily webhook
 */

import { NextRequest, NextResponse } from 'next/server';

// Increase timeout for transcription (Whisper can take 2-3 minutes for long recordings)
// This requires Vercel Pro plan for >60s, but will gracefully use max available
export const maxDuration = 300; // 5 minutes max
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import OpenAI from 'openai';
import { getRecordingAccessLink } from '@/lib/daily';
import { webhookVideoTranscriptCompleted } from '@/lib/webhooks/events';

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

// Check if OpenAI API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null;

/**
 * Convert video to MP3 using CloudConvert
 * Returns the MP3 audio buffer ready for Whisper transcription
 */
async function convertToMp3WithCloudConvert(videoUrl: string): Promise<Buffer> {
  console.log('🔄 [CloudConvert] Starting conversion for:', videoUrl.substring(0, 80) + '...');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bpoc.io';

  // Step 1: Submit conversion job to CloudConvert
  const convertResponse = await fetch(`${baseUrl}/api/cloudconvert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks: {
        'import-video': {
          operation: 'import/url',
          url: videoUrl,
        },
        'convert-to-mp3': {
          operation: 'convert',
          input: 'import-video',
          output_format: 'mp3',
          audio_codec: 'mp3',
          audio_bitrate: 32,
          audio_frequency: 16000,
          audio_channels: 1,
        },
        'export-mp3': {
          operation: 'export/url',
          input: 'convert-to-mp3',
        },
      },
    }),
  });

  if (!convertResponse.ok) {
    const errorData = await convertResponse.json().catch(() => ({}));
    throw new Error(`CloudConvert job creation failed: ${convertResponse.status} - ${JSON.stringify(errorData)}`);
  }

  const { data: jobData } = await convertResponse.json();
  const jobId = jobData?.id;

  if (!jobId) {
    throw new Error('CloudConvert did not return a job ID');
  }

  console.log('✅ [CloudConvert] Job created:', jobId);

  // Step 2: Poll for completion (max 60 seconds, check every 2 seconds)
  let mp3Url: string | null = null;
  const maxAttempts = 30;
  const pollInterval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const statusResponse = await fetch(`${baseUrl}/api/cloudconvert?jobId=${jobId}`);

    if (!statusResponse.ok) {
      console.warn(`⚠️ [CloudConvert] Status check failed (attempt ${i + 1}/${maxAttempts}):`, statusResponse.status);
      continue;
    }

    const { data: statusData } = await statusResponse.json();
    const status = statusData?.status;

    console.log(`🔍 [CloudConvert] Job status (attempt ${i + 1}/${maxAttempts}):`, status);

    if (status === 'finished') {
      // Find the export task to get the download URL
      const tasks = statusData?.tasks || [];
      const exportTask = tasks.find((task: any) => task.operation === 'export/url' && task.status === 'finished');

      if (exportTask?.result?.files?.[0]?.url) {
        mp3Url = exportTask.result.files[0].url;
        console.log('✅ [CloudConvert] Conversion completed, got MP3 URL');
        break;
      } else {
        throw new Error('CloudConvert job finished but no download URL found');
      }
    } else if (status === 'error') {
      const errorMessage = statusData?.message || 'Unknown error';
      throw new Error(`CloudConvert conversion failed: ${errorMessage}`);
    }
    // Continue polling if status is 'waiting' or 'processing'
  }

  if (!mp3Url) {
    throw new Error('CloudConvert conversion timed out after 60 seconds');
  }

  // Step 3: Download the MP3 file
  console.log('📥 [CloudConvert] Downloading MP3 from:', mp3Url.substring(0, 80) + '...');

  const mp3Response = await fetch(mp3Url, {
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!mp3Response.ok) {
    throw new Error(`Failed to download MP3 from CloudConvert: ${mp3Response.status} ${mp3Response.statusText}`);
  }

  const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());

  console.log('✅ [CloudConvert] MP3 downloaded:', {
    size: audioBuffer.length,
    sizeMB: (audioBuffer.length / 1024 / 1024).toFixed(2) + ' MB',
  });

  if (audioBuffer.length === 0) {
    throw new Error('Downloaded MP3 file is empty');
  }

  return audioBuffer;
}

/**
 * Transcribe audio buffer with Whisper
 */
async function whisperTranscribeBuffer(audioBuffer: Buffer, filename: string = 'audio.mp3'): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  if (!openai) throw new Error('OPENAI_API_KEY not configured');

  const file = new File([audioBuffer], filename, { type: 'audio/mpeg' });

  console.log('🎤 [Whisper] Transcribing audio file:', {
    filename,
    size: audioBuffer.length,
    sizeMB: (audioBuffer.length / 1024 / 1024).toFixed(2) + ' MB',
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    language: 'en',
  });

  const text = (transcription as any).text || '';
  const segments =
    (transcription as any).segments?.map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    })) || [];

  return { text, segments };
}

/**
 * Verify if request is from internal webhook
 */
function isWebhookRequest(request: NextRequest): boolean {
  const webhookSecret = request.headers.get('x-webhook-secret');
  const expectedSecret = process.env.DAILY_WEBHOOK_SECRET;
  
  // Allow internal calls with matching secret or 'internal' marker
  if (webhookSecret === expectedSecret || webhookSecret === 'internal') {
    return true;
  }
  
  return false;
}

// POST - Transcribe a recording
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId, roomId, audioUrl, source, transcriptId } = body;

    // Check auth - either webhook or user
    const isFromWebhook = isWebhookRequest(request) || source === 'webhook';
    let userId: string | null = null;

    if (!isFromWebhook) {
      // Regular user auth
      const authResult = await verifyAuthToken(request);
      if (!authResult.userId) {
        return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
      }
      userId = authResult.userId;
    }

    console.log('📝 [Transcribe] Request received:', { 
      recordingId, 
      roomId, 
      source,
      hasAudioUrl: !!audioUrl,
      isFromWebhook 
    });

    if (!recordingId && !roomId) {
      return NextResponse.json({ error: 'Recording ID or Room ID is required' }, { status: 400 });
    }

    // Get recording
    let recording;
    if (recordingId) {
      // Try by our DB id first, then by daily_recording_id
      let { data, error } = await supabaseAdmin
        .from('video_call_recordings')
        .select('*, video_call_rooms(*)')
        .eq('id', recordingId)
        .single();

      if (error || !data) {
        // Try by daily_recording_id
        const result = await supabaseAdmin
          .from('video_call_recordings')
          .select('*, video_call_rooms(*)')
          .eq('daily_recording_id', recordingId)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        console.error('❌ [Transcribe] Recording not found:', recordingId);
        return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
      }
      recording = data;
    } else {
      // Get latest recording for room
      const { data, error } = await supabaseAdmin
        .from('video_call_recordings')
        .select('*, video_call_rooms(*)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error('❌ [Transcribe] No recording found for room:', roomId);
        return NextResponse.json({ error: 'No recording found' }, { status: 404 });
      }
      recording = data;
    }

    const room = recording.video_call_rooms;
    
    // Verify user has access (skip for webhook requests)
    if (!isFromWebhook && userId) {
      const recruiterAgencyHostOk = await canRecruiterActOnAgencyHostedRoom(userId, room);
      if (room.host_user_id !== userId && room.participant_user_id !== userId && !recruiterAgencyHostOk) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Check if transcript already exists (use transcriptId from webhook if provided)
    let existingTranscript = null;
    
    if (transcriptId) {
      const { data } = await supabaseAdmin
        .from('video_call_transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single();
      existingTranscript = data;
    } else {
      const { data } = await supabaseAdmin
        .from('video_call_transcripts')
        .select('*')
        .eq('recording_id', recording.id)
        .single();
      existingTranscript = data;
    }

    if (existingTranscript && existingTranscript.status === 'completed') {
      console.log('✅ [Transcribe] Transcript already exists');
      return NextResponse.json({
        success: true,
        transcript: existingTranscript,
        message: 'Transcript already exists',
      });
    }

    // Use provided audioUrl, or get from recording, or fetch fresh from Daily
    let downloadUrl = audioUrl || recording.download_url || recording.recording_url;
    
    if (!downloadUrl && recording.daily_recording_id) {
      try {
        console.log('🔗 [Transcribe] Fetching fresh download URL from Daily...');
        const accessLink = await getRecordingAccessLink(recording.daily_recording_id);
        downloadUrl = accessLink.download_link;
      } catch (e) {
        console.error('❌ [Transcribe] Failed to get fresh access link:', e);
      }
    }

    if (!downloadUrl) {
      console.error('❌ [Transcribe] No download URL available');
      return NextResponse.json({ error: 'Recording not ready for transcription' }, { status: 400 });
    }

    // Check if OpenAI is configured
    if (!openai) {
      console.error('❌ [Transcribe] OpenAI API key not configured');

      // Update transcript status to failed
      if (transcriptRecord?.id) {
        await supabaseAdmin
          .from('video_call_transcripts')
          .update({
            status: 'failed',
            error_message: 'OpenAI API key not configured'
          })
          .eq('id', transcriptRecord.id);
      }

      return NextResponse.json({
        error: 'Transcription service not configured. Please set OPENAI_API_KEY environment variable.',
        code: 'OPENAI_NOT_CONFIGURED'
      }, { status: 503 });
    }

    // Check if CloudConvert is configured
    if (!process.env.CLOUDCONVERT_API_KEY) {
      console.error('❌ [Transcribe] CloudConvert API key not configured');

      // Update transcript status to failed
      if (transcriptRecord?.id) {
        await supabaseAdmin
          .from('video_call_transcripts')
          .update({
            status: 'failed',
            error_message: 'CloudConvert API key not configured'
          })
          .eq('id', transcriptRecord.id);
      }

      return NextResponse.json({
        error: 'Audio conversion service not configured. Please set CLOUDCONVERT_API_KEY environment variable.',
        code: 'CLOUDCONVERT_NOT_CONFIGURED',
      }, { status: 503 });
    }

    console.log('✅ [Transcribe] CloudConvert and OpenAI are configured, proceeding with transcription');

    console.log('📎 [Transcribe] Using download URL:', downloadUrl.substring(0, 50) + '...');

    // Create or update transcript record
    const { data: transcriptRecord, error: createError } = await supabaseAdmin
      .from('video_call_transcripts')
      .upsert({
        id: existingTranscript?.id || transcriptId,
        room_id: room.id,
        recording_id: recording.id,
        job_id: room.job_id || null,
        status: 'processing',
        transcription_provider: 'whisper',
        processing_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [Transcribe] Failed to create transcript record:', createError);
    }

    // Convert video to MP3 using CloudConvert and transcribe with Whisper
    let transcriptionText = '';
    let segments: Array<{ start: number; end: number; text: string }> = [];

    try {
      // Step 1: Convert to MP3 with CloudConvert
      console.log('🎬 [Transcribe] Converting video to MP3 with CloudConvert...');
      let audioBuffer: Buffer;

      try {
        audioBuffer = await convertToMp3WithCloudConvert(downloadUrl);
      } catch (cloudConvertErr: any) {
        const errorMsg = `CloudConvert conversion failed: ${cloudConvertErr?.message || cloudConvertErr}`;
        console.error('❌ [Transcribe]', errorMsg);

        // Update transcript status to failed
        if (transcriptRecord?.id) {
          await supabaseAdmin
            .from('video_call_transcripts')
            .update({
              status: 'failed',
              error_message: errorMsg,
            })
            .eq('id', transcriptRecord.id);
        }

        // Check for specific CloudConvert errors
        if (errorMsg.includes('timed out')) {
          return NextResponse.json(
            {
              error: 'Audio conversion timed out. The recording may be too long.',
              details: errorMsg,
              code: 'CLOUDCONVERT_TIMEOUT',
            },
            { status: 504 }
          );
        }

        if (errorMsg.includes('403') || errorMsg.includes('404')) {
          // Try to get fresh URL from Supabase storage fallback
          console.log('🔄 [Transcribe] Daily URL expired, checking Supabase storage...');

          const { data: recordingData } = await supabaseAdmin
            .from('video_call_recordings')
            .select('recording_url, storage_provider')
            .eq('id', recording.id)
            .single();

          if (recordingData?.recording_url && recordingData.storage_provider === 'supabase') {
            console.log('✅ [Transcribe] Found Supabase storage URL, retrying conversion...');
            try {
              audioBuffer = await convertToMp3WithCloudConvert(recordingData.recording_url);
            } catch (retryErr: any) {
              return NextResponse.json(
                {
                  error: 'Recording URL expired and Supabase fallback failed.',
                  details: `${errorMsg} | Retry: ${retryErr?.message}`,
                  code: 'URL_EXPIRED_FALLBACK_FAILED',
                },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              {
                error: 'Recording URL expired. No Supabase storage fallback available.',
                details: errorMsg,
                code: 'URL_EXPIRED',
              },
              { status: 400 }
            );
          }
        }

        return NextResponse.json(
          {
            error: 'Audio conversion failed.',
            details: errorMsg,
            code: 'CLOUDCONVERT_ERROR',
          },
          { status: 500 }
        );
      }

      // Step 2: Transcribe with Whisper
      console.log('🎤 [Transcribe] Transcribing audio with Whisper...');

      // Check Whisper size limit (25MB)
      const whisperMax = 25 * 1024 * 1024;
      if (audioBuffer.length > whisperMax) {
        const errorMsg = `Audio file too large for Whisper: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB (max 25 MB)`;
        console.error('❌ [Transcribe]', errorMsg);

        if (transcriptRecord?.id) {
          await supabaseAdmin
            .from('video_call_transcripts')
            .update({
              status: 'failed',
              error_message: errorMsg,
            })
            .eq('id', transcriptRecord.id);
        }

        return NextResponse.json(
          {
            error: 'Recording too large for transcription.',
            details: errorMsg,
            code: 'FILE_TOO_LARGE',
          },
          { status: 400 }
        );
      }

      try {
        const result = await whisperTranscribeBuffer(audioBuffer);
        transcriptionText = result.text;
        segments = result.segments;
      } catch (whisperErr: any) {
        const errorMsg = `Whisper transcription failed: ${whisperErr?.message || whisperErr}`;
        console.error('❌ [Transcribe]', errorMsg);

        if (transcriptRecord?.id) {
          await supabaseAdmin
            .from('video_call_transcripts')
            .update({
              status: 'failed',
              error_message: errorMsg,
            })
            .eq('id', transcriptRecord.id);
        }

        return NextResponse.json(
          {
            error: 'Transcription failed.',
            details: errorMsg,
            code: 'WHISPER_ERROR',
          },
          { status: 500 }
        );
      }
    } catch (err: any) {
      const errorMsg = `Unexpected error during transcription: ${err?.message || err}`;
      console.error('❌ [Transcribe]', errorMsg);

      if (transcriptRecord?.id) {
        await supabaseAdmin
          .from('video_call_transcripts')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', transcriptRecord.id);
      }

      return NextResponse.json(
        {
          error: 'Transcription failed.',
          details: errorMsg,
          code: 'UNEXPECTED_ERROR',
        },
        { status: 500 }
      );
    }

    console.log('✅ [Transcribe] Whisper completed!', {
      textLength: transcriptionText?.length || 0,
      segmentsCount: segments.length,
    });

    // Check if transcription is empty or too short
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      const errorMsg = 'Transcription returned empty text. Recording may be silent or too short.';
      console.error('❌ [Transcribe]', errorMsg);

      if (transcriptRecord?.id) {
        await supabaseAdmin
          .from('video_call_transcripts')
          .update({ 
            status: 'failed', 
            error_message: errorMsg,
            full_text: '[No audio detected]',
          })
          .eq('id', transcriptRecord.id);
      }

      return NextResponse.json(
        {
          error: errorMsg,
          code: 'EMPTY_TRANSCRIPTION',
        },
        { status: 400 }
      );
    }

    console.log('📝 [Transcribe] Transcription preview:', transcriptionText.substring(0, 200));

    // Generate summary using GPT
    let summary = '';
    let keyPoints: string[] = [];
    
    if (transcriptionText && transcriptionText.length > 100) {
      try {
        console.log('🤖 [Transcribe] Generating AI summary...');
        const summaryResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert at summarizing interview transcripts. 
              Provide a concise summary (2-3 sentences) and extract 3-5 key discussion points.
              Focus on: candidate qualifications discussed, questions asked, notable responses, and overall impression.
              Format your response as JSON: { "summary": "...", "keyPoints": ["...", "..."] }`
            },
            {
              role: 'user',
              content: `Summarize this interview transcript:\n\n${transcriptionText.substring(0, 8000)}`
            }
          ],
          response_format: { type: 'json_object' },
        });

        const summaryData = JSON.parse(summaryResponse.choices[0].message.content || '{}');
        summary = summaryData.summary || '';
        keyPoints = summaryData.keyPoints || [];
        console.log('✅ [Transcribe] Summary generated');
      } catch (e) {
        console.error('⚠️ [Transcribe] Failed to generate summary:', e);
        // Continue without summary - transcript is still valuable
      }
    }

    // Update transcript record
    const transcriptIdToUpdate = transcriptRecord?.id || existingTranscript?.id || transcriptId;
    
    const { data: updatedTranscript, error: updateError } = await supabaseAdmin
      .from('video_call_transcripts')
      .update({
        full_text: transcriptionText,
        segments,
        summary,
        key_points: keyPoints,
        word_count: transcriptionText?.split(/\s+/).filter(Boolean).length || 0,
        model_used: 'whisper-1',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transcriptIdToUpdate)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Transcribe] Failed to update transcript:', updateError);
    } else {
      console.log('✅ [Transcribe] Transcript saved successfully:', {
        id: updatedTranscript?.id,
        wordCount: updatedTranscript?.word_count,
        hasSegments: segments.length > 0,
        hasSummary: !!summary,
      });
    }

    // Trigger webhook for transcript completion
    if (updatedTranscript && room.agency_id && room.application_id) {
      webhookVideoTranscriptCompleted({
        transcriptId: updatedTranscript.id,
        recordingId: recording.id,
        roomId: room.id,
        applicationId: room.application_id,
        summary: summary || null,
        agencyId: room.agency_id,
      }).catch(err => console.error('[Webhook] Video transcript completed error:', err));
    }

    return NextResponse.json({
      success: true,
      transcript: updatedTranscript || {
        full_text: transcriptionText,
        segments,
        summary,
        key_points: keyPoints,
        status: 'completed',
      },
    });

  } catch (error) {
    console.error('❌ [Transcribe] Transcription failed:', error);
    
    // Try to update transcript status to failed
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body.transcriptId) {
        await supabaseAdmin
          .from('video_call_transcripts')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Unknown error' 
          })
          .eq('id', body.transcriptId);
      }
    } catch {
      // Ignore errors when updating status
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}

// GET - Get transcripts for a room
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

    // Get transcripts
    const { data: transcripts, error } = await supabaseAdmin
      .from('video_call_transcripts')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      transcripts: transcripts || [],
    });

  } catch (error) {
    console.error('Failed to get transcripts:', error);
    return NextResponse.json(
      { error: 'Failed to get transcripts' },
      { status: 500 }
    );
  }
}
