# Transcription Worker Setup (Robust for 30–60 minute calls)

## Why this exists

Whisper has a **25 MB upload limit**. Full MP4 recordings from Daily will often exceed this, even for “short” calls depending on bitrate.

**Robust approach:** keep MP4 for playback, but transcribe **audio-only** using a worker that can run `ffmpeg`.

## How it works in BPOC

- Daily webhook creates recordings rows (`video_call_recordings`)
- Daily webhook **enqueues** transcript jobs by inserting `video_call_transcripts.status = 'queued'`
- A worker calls an internal endpoint that:
  - claims one queued job
  - downloads the recording
  - runs `ffmpeg` to produce a small audio-only MP3 (mono 16kHz, low bitrate)
  - runs Whisper
  - saves `full_text`, `word_count`, `summary`, `key_points`

## Internal worker endpoint

- **POST** `/api/internal/transcription/run`
- Requires header:
  - `x-worker-secret: <TRANSCRIPTION_WORKER_SECRET>`

Environment variables required on the worker host:

- `TRANSCRIPTION_WORKER_SECRET`
- `OPENAI_API_KEY`
- `DAILY_API_KEY` (needed when a fresh recording access link must be fetched)
- Supabase envs used by server code:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Running the worker (recommended)

Run this on a server that has **ffmpeg installed** (Render/Railway/Fly/VM). Schedule it as:
- a loop that calls the endpoint every few seconds, or
- a cron that calls it every minute (it processes one job per call).

Example curl:

```bash
curl -X POST 'https://www.bpoc.io/api/internal/transcription/run' \
  -H "x-worker-secret: $TRANSCRIPTION_WORKER_SECRET"
```

## Notes

- If audio extraction still produces >25MB (rare), the worker automatically chunks audio into 10-minute segments and transcribes sequentially.
- This keeps recruiter/client UI responsive: transcripts are eventually consistent and can be polled via the existing DB/API views.


