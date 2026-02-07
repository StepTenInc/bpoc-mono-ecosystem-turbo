/**
 * Internal Transcription Worker Runner
 * Claims one queued transcript job and processes it.
 *
 * Auth: requires header `x-worker-secret` matching env TRANSCRIPTION_WORKER_SECRET
 *
 * NOTE: This endpoint is intended to be called by a long-running worker/cron
 * (e.g. Render/Railway/Fly) where ffmpeg is available.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { getRecordingAccessLink } from '@/lib/daily';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export const maxDuration = 300; // keep endpoint bounded; worker should call repeatedly

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function requireWorkerAuth(request: NextRequest): { ok: boolean; error?: string } {
  const expected = process.env.TRANSCRIPTION_WORKER_SECRET;
  const got = request.headers.get('x-worker-secret');
  if (!expected) return { ok: false, error: 'TRANSCRIPTION_WORKER_SECRET not configured' };
  if (!got || got !== expected) return { ok: false, error: 'Unauthorized' };
  return { ok: true };
}

async function hasFfmpeg(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const p = spawn('ffmpeg', ['-version']);
      p.on('error', reject);
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
    });
    return true;
  } catch {
    return false;
  }
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${stderr.slice(-1200)}`));
    });
  });
}

async function statBytes(filePath: string): Promise<number> {
  const s = await fs.stat(filePath);
  return s.size;
}

async function whisperTranscribeFile(filePath: string): Promise<{ text: string }> {
  if (!openai) throw new Error('OPENAI_API_KEY not configured');
  const buf = await fs.readFile(filePath);
  const file = new File([buf], path.basename(filePath), { type: 'audio/mpeg' });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    language: 'en',
  });
  return { text: (transcription as any).text || '' };
}

async function generateSummary(text: string): Promise<{ summary: string; keyPoints: string[] }> {
  if (!openai) return { summary: '', keyPoints: [] };
  if (!text || text.length < 200) return { summary: '', keyPoints: [] };
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You summarize interview/call transcripts. Return JSON: { "summary": "...", "keyPoints": ["..."] }',
      },
      { role: 'user', content: text.substring(0, 12000) },
    ],
    response_format: { type: 'json_object' },
  });
  const parsed = JSON.parse(resp.choices[0].message.content || '{}');
  return { summary: parsed.summary || '', keyPoints: parsed.keyPoints || [] };
}

async function processTranscriptJob(transcriptId: string) {
  // Load transcript + recording + room
  const { data: transcript, error: tErr } = await supabaseAdmin
    .from('video_call_transcripts')
    .select('*')
    .eq('id', transcriptId)
    .single();
  if (tErr || !transcript) throw new Error(tErr?.message || 'Transcript not found');

  // Backfill job_id if missing (room.job_id -> application.job_id)
  try {
    if (!transcript.job_id) {
      const { data: room } = await supabaseAdmin
        .from('video_call_rooms')
        .select('job_id, application_id')
        .eq('id', transcript.room_id)
        .maybeSingle();
      let jobId = (room as any)?.job_id || null;
      if (!jobId && (room as any)?.application_id) {
        const { data: app } = await supabaseAdmin
          .from('job_applications')
          .select('job_id')
          .eq('id', (room as any).application_id)
          .maybeSingle();
        jobId = (app as any)?.job_id || null;
      }
      if (jobId) {
        await supabaseAdmin.from('video_call_transcripts').update({ job_id: jobId }).eq('id', transcriptId);
        (transcript as any).job_id = jobId;
      }
    }
  } catch {
    // ignore (best-effort)
  }

  const { data: recording, error: rErr } = await supabaseAdmin
    .from('video_call_recordings')
    .select('id, daily_recording_id, download_url, recording_url, room_id')
    .eq('id', transcript.recording_id)
    .single();
  if (rErr || !recording) throw new Error(rErr?.message || 'Recording not found for transcript');

  let downloadUrl: string | null = recording.download_url || recording.recording_url || null;
  if (!downloadUrl && recording.daily_recording_id) {
    const access = await getRecordingAccessLink(recording.daily_recording_id);
    downloadUrl = access.download_link;
  }
  if (!downloadUrl) throw new Error('No download_url available for recording');

  if (!(await hasFfmpeg())) {
    throw new Error('ffmpeg not available in this environment. Run worker on a host with ffmpeg installed.');
  }

  // Download to temp
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bpoc-transcribe-'));
  const inputPath = path.join(tmpDir, 'recording.mp4');
  const audioPath = path.join(tmpDir, 'audio.mp3');

  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to download recording: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(inputPath, buf);

  // Extract small audio-only mp3 (mono, 16kHz, low bitrate)
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-b:a',
    '32k',
    audioPath,
  ]);

  const whisperMax = 25 * 1024 * 1024;
  const audioSize = await statBytes(audioPath);

  let fullText = '';
  if (audioSize <= whisperMax) {
    const t = await whisperTranscribeFile(audioPath);
    fullText = t.text;
  } else {
    // Chunk audio (10-minute segments)
    const chunkPattern = path.join(tmpDir, 'chunk-%03d.mp3');
    await runFfmpeg([
      '-y',
      '-i',
      audioPath,
      '-f',
      'segment',
      '-segment_time',
      '600',
      '-reset_timestamps',
      '1',
      chunkPattern,
    ]);

    // Read chunks sorted
    const files = (await fs.readdir(tmpDir))
      .filter((f) => f.startsWith('chunk-') && f.endsWith('.mp3'))
      .sort();

    for (const f of files) {
      const p = path.join(tmpDir, f);
      const sz = await statBytes(p);
      if (sz > whisperMax) {
        throw new Error(`Audio chunk still too large for Whisper: ${f} (${(sz / 1024 / 1024).toFixed(2)} MB)`);
      }
      const t = await whisperTranscribeFile(p);
      fullText += (fullText ? '\n\n' : '') + t.text;
    }
  }

  const wordCount = fullText ? fullText.trim().split(/\s+/).filter(Boolean).length : 0;
  const { summary, keyPoints } = await generateSummary(fullText);

  await supabaseAdmin
    .from('video_call_transcripts')
    .update({
      full_text: fullText,
      summary,
      key_points: keyPoints,
      word_count: wordCount,
      model_used: 'whisper-1',
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', transcriptId);

  // Cleanup best-effort
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export async function POST(request: NextRequest) {
  const auth = requireWorkerAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  if (!openai) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });
  }

  // Claim one queued job
  const { data: job } = await supabaseAdmin
    .from('video_call_transcripts')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!job?.id) {
    return NextResponse.json({ success: true, message: 'No queued transcript jobs' });
  }

  const now = new Date().toISOString();
  // Attempt to claim
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('video_call_transcripts')
    .update({ status: 'processing', processing_started_at: now })
    .eq('id', job.id)
    .eq('status', 'queued')
    .select('id')
    .single();

  if (claimErr || !claimed) {
    return NextResponse.json({ success: true, message: 'Job already claimed' });
  }

  try {
    await processTranscriptJob(claimed.id);
    return NextResponse.json({ success: true, transcriptId: claimed.id, status: 'completed' });
  } catch (e: any) {
    const msg = e?.message || String(e);
    await supabaseAdmin
      .from('video_call_transcripts')
      .update({ status: 'failed', error_message: msg })
      .eq('id', claimed.id);
    return NextResponse.json({ success: false, transcriptId: claimed.id, status: 'failed', error: msg }, { status: 500 });
  }
}


