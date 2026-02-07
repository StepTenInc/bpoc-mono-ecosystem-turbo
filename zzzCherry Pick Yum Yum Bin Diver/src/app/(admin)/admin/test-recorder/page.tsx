'use client';

/**
 * ISOLATED TEST PAGE FOR VOICE RECORDER
 * This page tests the MediaRecorder API directly without any other dependencies
 */

import { useState, useRef } from 'react';

export default function TestRecorderPage() {
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const log = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const cleanup = () => {
    log('🧹 Cleaning up...');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        log(`Stopping track: ${t.kind}`);
        t.stop();
      });
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setSeconds(0);
  };

  const startRecording = async () => {
    setError('');
    setLogs([]);
    chunksRef.current = [];
    
    try {
      log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;
      log(`✅ Got stream with ${stream.getAudioTracks().length} audio tracks`);

      // Check supported types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          log(`✅ Using MIME type: ${mime}`);
          break;
        }
      }

      const recorder = selectedMime 
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);
      
      mediaRecorderRef.current = recorder;
      log(`📼 MediaRecorder created, state: ${recorder.state}`);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          log(`📦 Chunk received: ${e.data.size} bytes (total: ${chunksRef.current.length} chunks)`);
        }
      };

      recorder.onstop = async () => {
        log(`🛑 recorder.onstop fired, ${chunksRef.current.length} chunks`);
        cleanup();
        
        if (chunksRef.current.length === 0) {
          setError('No audio data captured');
          setStatus('idle');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        log(`📼 Blob created: ${blob.size} bytes, type: ${blob.type}`);

        if (blob.size < 1000) {
          setError('Recording too short');
          setStatus('idle');
          return;
        }

        setStatus('transcribing');
        log('🔄 Sending to Whisper API...');

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const res = await fetch('/api/admin/insights/pipeline/voice-personality', {
            method: 'POST',
            body: formData,
          });

          const json = await res.json();
          log(`📨 API Response: ${JSON.stringify(json).slice(0, 200)}...`);

          if (json.transcription || json.transcript) {
            setTranscript(json.transcription || json.transcript);
            log('✅ Transcription successful!');
          } else {
            setError(json.error || 'No transcript returned');
          }
        } catch (err: any) {
          log(`❌ API Error: ${err.message}`);
          setError(err.message);
        }

        setStatus('idle');
      };

      recorder.onerror = (e: any) => {
        log(`❌ Recorder error: ${e.error?.name || 'Unknown'}`);
        setError(`Recorder error: ${e.error?.message || 'Unknown'}`);
        cleanup();
        setStatus('idle');
      };

      // Start with timeslice to get regular data chunks
      recorder.start(500);
      log(`▶️ Recording started, state: ${recorder.state}`);
      setStatus('recording');

      // Timer
      let count = 0;
      timerRef.current = setInterval(() => {
        count++;
        setSeconds(count);
      }, 1000);

    } catch (err: any) {
      log(`❌ Mic error: ${err.message}`);
      setError(`Microphone error: ${err.message}`);
      cleanup();
    }
  };

  const stopRecording = () => {
    log('🖐️ STOP button clicked');
    const recorder = mediaRecorderRef.current;
    
    if (!recorder) {
      log('⚠️ No recorder found');
      setStatus('idle');
      cleanup();
      return;
    }

    log(`📼 Recorder state: ${recorder.state}`);

    if (recorder.state === 'recording') {
      log('🛑 Calling recorder.stop()...');
      // Request any remaining data before stopping
      try {
        recorder.requestData();
      } catch (e) {
        log('requestData not supported or failed');
      }
      recorder.stop();
      setStatus('processing');
    } else {
      log(`⚠️ Recorder not recording (state: ${recorder.state})`);
      setStatus('idle');
      cleanup();
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">🎤 Voice Recorder Test</h1>
        <p className="text-gray-400 text-center">Isolated test page for MediaRecorder API</p>

        {/* Status Display */}
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          {status === 'idle' && (
            <>
              <div className="w-32 h-32 rounded-full bg-purple-600 mx-auto mb-4 flex items-center justify-center">
                <span className="text-6xl">🎤</span>
              </div>
              <p className="text-xl mb-4">Ready to Record</p>
              <button
                onClick={startRecording}
                className="w-64 h-16 bg-green-600 hover:bg-green-700 rounded-xl text-xl font-bold"
              >
                ▶️ START RECORDING
              </button>
            </>
          )}

          {status === 'recording' && (
            <>
              <div className="w-32 h-32 rounded-full bg-red-500 mx-auto mb-4 flex items-center justify-center animate-pulse">
                <span className="text-6xl">🔴</span>
              </div>
              <p className="text-2xl font-bold mb-2">RECORDING</p>
              <p className="text-4xl font-mono text-red-400 mb-4">{formatTime(seconds)}</p>
              <button
                onClick={stopRecording}
                className="w-64 h-16 bg-red-600 hover:bg-red-700 rounded-xl text-xl font-bold"
              >
                ⏹️ STOP RECORDING
              </button>
            </>
          )}

          {status === 'processing' && (
            <>
              <div className="w-32 h-32 rounded-full bg-yellow-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-6xl animate-spin">⚙️</span>
              </div>
              <p className="text-xl">Processing audio...</p>
            </>
          )}

          {status === 'transcribing' && (
            <>
              <div className="w-32 h-32 rounded-full bg-blue-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-6xl animate-pulse">🤖</span>
              </div>
              <p className="text-xl">Transcribing with Whisper...</p>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
            <p className="text-red-400 font-bold">❌ Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-green-500/20 border border-green-500 rounded-xl p-4">
            <p className="text-green-400 font-bold mb-2">✅ Transcript:</p>
            <p className="text-lg">{transcript}</p>
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 font-bold mb-2">📋 Debug Logs:</p>
          <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <p key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-300'}>
                {log}
              </p>
            ))}
            {logs.length === 0 && <p className="text-gray-500">Click START to begin...</p>}
          </div>
        </div>

        {/* Browser Info */}
        <div className="bg-gray-800 rounded-xl p-4 text-sm">
          <p className="text-gray-400 font-bold mb-2">🌐 Browser Info:</p>
          <p>MediaRecorder supported: {typeof MediaRecorder !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
          <p>getUserMedia supported: {navigator.mediaDevices?.getUserMedia ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>
    </div>
  );
}

