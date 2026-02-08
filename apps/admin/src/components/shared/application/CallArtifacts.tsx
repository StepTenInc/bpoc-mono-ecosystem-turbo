'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Video, FileText, Clock, ChevronDown, ChevronRight, Download, ExternalLink, Wand2, Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import { getSessionToken } from '@/lib/auth-helpers';

type CallType =
  | 'recruiter_prescreen'
  | 'recruiter_round_1'
  | 'recruiter_round_2'
  | 'recruiter_round_3'
  | 'recruiter_offer'
  | 'recruiter_general'
  | 'client_round_1'
  | 'client_round_2'
  | 'client_final'
  | 'client_general'
  | string;

export interface CallArtifactRecording {
  id: string;
  daily_recording_id?: string | null;
  recording_url?: string | null;
  download_url?: string | null;
  duration_seconds?: number | null;
  status?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
}

export interface CallArtifactTranscript {
  id: string;
  recording_id?: string | null;
  full_text?: string | null;
  segments?: any;
  summary?: string | null;
  key_points?: any;
  word_count?: number | null;
  status?: string | null;
  error_message?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
}

export interface CallArtifactRoom {
  id: string;
  daily_room_name?: string | null;
  daily_room_url?: string | null;
  call_type?: CallType | null;
  call_mode?: string | null;
  call_title?: string | null;
  title?: string | null;
  status?: string | null;
  notes?: string | null;
  rating?: number | null;
  // Per-call sharing flags (source of truth for client/candidate visibility)
  share_video_with_client?: boolean | null;
  share_notes_with_client?: boolean | null;
  share_transcript_with_client?: boolean | null;
  share_video_with_candidate?: boolean | null;
  share_notes_with_candidate?: boolean | null;
  share_transcript_with_candidate?: boolean | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  created_at?: string | null;
  recordings?: CallArtifactRecording[] | null;
  transcripts?: CallArtifactTranscript[] | null;
}

const CALL_TYPE_UI: Record<string, { label: string; badge: string }> = {
  recruiter_prescreen: { label: 'Pre-Screen', badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  recruiter_round_1: { label: 'Recruiter Round 1', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  recruiter_round_2: { label: 'Recruiter Round 2', badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  recruiter_round_3: { label: 'Recruiter Round 3', badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  recruiter_offer: { label: 'Recruiter Offer Call', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  recruiter_general: { label: 'Recruiter Call', badge: 'bg-slate-500/10 border-slate-500/30 text-slate-300' },
  client_round_1: { label: 'Client Round 1', badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  client_round_2: { label: 'Client Round 2', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
  client_final: { label: 'Client Final', badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
  client_general: { label: 'Client Call', badge: 'bg-gray-500/10 border-gray-500/30 text-gray-300' },
};

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(ts?: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  // Keep this compact so the actions area (View/Download/Transcribe) doesn't get cramped.
  try {
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return d.toLocaleString();
  }
}

function coerceKeyPoints(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') return value ? [value] : [];
  return [];
}

export function CallArtifacts(props: { rooms: CallArtifactRoom[]; allowTranscribe?: boolean; onDataChanged?: () => void }) {
  const { rooms, allowTranscribe = false, onDataChanged } = props;
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(new Set());
  const [expandedTranscriptIds, setExpandedTranscriptIds] = useState<Set<string>>(new Set());
  const [transcribingByRecordingId, setTranscribingByRecordingId] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const recruiter: CallArtifactRoom[] = [];
    const client: CallArtifactRoom[] = [];
    const other: CallArtifactRoom[] = [];

    for (const r of rooms || []) {
      const t = String(r.call_type || '');
      if (t.startsWith('recruiter_')) recruiter.push(r);
      else if (t.startsWith('client_')) client.push(r);
      else other.push(r);
    }

    return { recruiter, client, other };
  }, [rooms]);

  const toggleRoom = (roomId: string) => {
    setExpandedRoomIds(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const toggleTranscript = (transcriptId: string) => {
    setExpandedTranscriptIds(prev => {
      const next = new Set(prev);
      if (next.has(transcriptId)) next.delete(transcriptId);
      else next.add(transcriptId);
      return next;
    });
  };

  const renderRoom = (room: CallArtifactRoom) => {
    const typeKey = String(room.call_type || 'unknown');
    const ui = CALL_TYPE_UI[typeKey] || { label: room.call_type || 'Call', badge: 'bg-white/5 border-white/10 text-white/80' };
    const title = room.call_title || room.title || ui.label;
    const isExpanded = expandedRoomIds.has(room.id);
    const recordings = room.recordings || [];
    const transcripts = room.transcripts || [];
    const hasCompletedTranscript = transcripts.some((t) => t.status === 'completed');

    return (
      <div key={room.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleRoom(room.id)}
          className="w-full text-left p-4 hover:bg-white/[0.07] transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={ui.badge}>
                  {ui.label}
                </Badge>
                <span className="text-white font-semibold truncate">{title}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-white/60 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(room.duration_seconds)}
                </span>
                <span>Started: {formatDate(room.started_at || room.created_at)}</span>
                <span>Ended: {formatDate(room.ended_at)}</span>
                <span>Status: {room.status || '—'}</span>
              </div>
            </div>
            <div className="shrink-0 mt-0.5 text-white/60">
              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-4">
            {room.notes && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60 mb-1">Notes</div>
                <div className="text-sm text-white/90 whitespace-pre-wrap">{room.notes}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Video className="h-4 w-4 text-cyan-400" />
                  Recordings
                  <span className="text-xs text-white/60 font-normal">({recordings.length})</span>
                </div>

                {recordings.length === 0 ? (
                  <div className="text-sm text-white/60 mt-2">No recordings yet.</div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {recordings.map((rec) => {
                      const canDownload = !!rec.download_url;
                      const canView = !!rec.recording_url;
                      // Show transcribe button if: allowed, recording is ready, and no existing transcript for THIS recording
                      const hasExistingTranscript = transcripts.some(t => t.recording_id === rec.id);
                      const canTranscribe = allowTranscribe && rec.status === 'ready' && !hasExistingTranscript;
                      const isTranscribing = !!transcribingByRecordingId[rec.id];
                      return (
                        <div key={rec.id} className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/5 p-2">
                          <div className="min-w-0">
                            <div className="text-sm text-white/90 truncate">
                              {rec.status || 'recording'}
                              {rec.duration_seconds ? ` • ${formatDuration(rec.duration_seconds)}` : ''}
                            </div>
                            <div className="text-xs text-white/60">{formatDate(rec.created_at)}</div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                            {canTranscribe && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                disabled={isTranscribing}
                                onClick={async () => {
                                  try {
                                    setTranscribingByRecordingId((prev) => ({ ...prev, [rec.id]: true }));
                                    const token = await getSessionToken();
                                    if (!token) {
                                      toast.error('Not authenticated');
                                      return;
                                    }
                                    const res = await fetch('/api/video/transcribe', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        recordingId: rec.id,
                                        roomId: room.id,
                                        source: 'manual',
                                      }),
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (!res.ok) {
                                      const msg = (data?.error || data?.details || 'Failed to start transcription') as string;
                                      toast.error(msg.length > 180 ? msg.slice(0, 180) + '…' : msg);
                                      return;
                                    }
                                    toast.success(data?.message || 'Transcription started');
                                    onDataChanged?.();
                                  } catch (e) {
                                    console.error('Failed to start transcription:', e);
                                    toast.error('Failed to start transcription');
                                  } finally {
                                    setTranscribingByRecordingId((prev) => ({ ...prev, [rec.id]: false }));
                                  }
                                }}
                              >
                                {isTranscribing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Transcribing...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="h-4 w-4 mr-1" />
                                    Transcribe
                                  </>
                                )}
                              </Button>
                            )}
                            {canView && (
                              <a href={rec.recording_url!} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline" className="h-8">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </a>
                            )}
                            {canDownload && (
                              <a href={rec.download_url!} target="_blank" rel="noreferrer">
                                <Button size="sm" className="h-8 bg-cyan-600 hover:bg-cyan-700 text-white">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FileText className="h-4 w-4 text-orange-400" />
                  Transcripts
                  <span className="text-xs text-white/60 font-normal">({transcripts.length})</span>
                </div>

                {transcripts.length === 0 ? (
                  <div className="text-sm text-white/60 mt-2">No transcripts yet.</div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {transcripts.map((t) => {
                      const isTxExpanded = expandedTranscriptIds.has(t.id);
                      const keyPoints = coerceKeyPoints(t.key_points);
                      return (
                        <div key={t.id} className="rounded-md border border-white/10 bg-white/5 p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm text-white/90 truncate">
                                {t.status || 'processing'}
                                {t.word_count ? ` • ${t.word_count} words` : ''}
                              </div>
                              <div className="text-xs text-white/60">{formatDate(t.created_at)}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => toggleTranscript(t.id)}
                            >
                              {isTxExpanded ? 'Hide' : 'View'}
                            </Button>
                          </div>

                          {t.status === 'failed' && t.error_message && (
                            <div className="mt-2 text-xs bg-red-500/10 border border-red-500/20 rounded p-2">
                              <div className="text-red-300 font-medium mb-1">Transcription Failed</div>
                              <div className="text-red-400/80">
                                {t.error_message.includes('ffmpeg') || t.error_message.includes('ENOENT') 
                                  ? 'Audio processing service unavailable. Please contact support or try again later.'
                                  : t.error_message.includes('OPENAI') || t.error_message.includes('API key')
                                  ? 'Transcription service not configured. Please contact support.'
                                  : t.error_message.includes('empty') || t.error_message.includes('silent')
                                  ? 'No audio detected in the recording. The call may have been too short or silent.'
                                  : t.error_message.includes('expired') || t.error_message.includes('403')
                                  ? 'Recording access expired. Please try transcribing again.'
                                  : t.error_message.length > 100
                                  ? t.error_message.slice(0, 100) + '...'
                                  : t.error_message
                                }
                              </div>
                            </div>
                          )}

                          {isTxExpanded && (
                            <div className="mt-3 space-y-2">
                              {t.summary && (
                                <div className="rounded-md border border-white/10 bg-black/20 p-2">
                                  <div className="text-xs text-white/60 mb-1">Summary</div>
                                  <div className="text-sm text-white/90 whitespace-pre-wrap">{t.summary}</div>
                                </div>
                              )}
                              {keyPoints.length > 0 && (
                                <div className="rounded-md border border-white/10 bg-black/20 p-2">
                                  <div className="text-xs text-white/60 mb-1">Key points</div>
                                  <ul className="text-sm text-white/90 list-disc pl-5 space-y-1">
                                    {keyPoints.map((kp, idx) => (
                                      <li key={`${t.id}-kp-${idx}`}>{kp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {t.full_text && (
                                <div className="rounded-md border border-white/10 bg-black/20 p-2">
                                  <div className="text-xs text-white/60 mb-1">Full transcript</div>
                                  <div className="text-sm text-white/90 whitespace-pre-wrap max-h-64 overflow-auto">
                                    {t.full_text}
                                  </div>
                                </div>
                              )}
                              {!t.summary && !t.full_text && t.status === 'processing' && (
                                <div className="text-sm text-white/60">Transcript is processing…</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Video className="h-5 w-5 text-cyan-400" />
          Call Artifacts (Rooms → Recordings → Transcripts)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rooms.length === 0 ? (
          <div className="text-sm text-white/60">No calls recorded for this application yet.</div>
        ) : (
          <>
            {grouped.recruiter.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-white/80">Recruiter Calls</div>
                <div className="space-y-3">{grouped.recruiter.map(renderRoom)}</div>
              </div>
            )}
            {grouped.client.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-white/80">Client Calls</div>
                <div className="space-y-3">{grouped.client.map(renderRoom)}</div>
              </div>
            )}
            {grouped.other.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-white/80">Other Calls</div>
                <div className="space-y-3">{grouped.other.map(renderRoom)}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


