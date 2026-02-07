'use client';

/**
 * Interview Recordings Page
 * View recorded interviews with transcripts and AI analysis
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Play,
  Pause,
  Download,
  FileText,
  Clock,
  Calendar,
  User,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  Lightbulb,
  Volume2,
  Maximize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/shared/ui/toast';

interface VideoCallRoom {
  id: string;
  host_user_id: string;
  participant_user_id: string;
  job_id: string | null;
  application_id: string | null;
  created_at: string;
  ended_at: string;
  // New fields for call context - RECRUITER & CLIENT types
  call_type:
    | 'recruiter_prescreen' | 'recruiter_round_1' | 'recruiter_round_2' | 'recruiter_round_3' | 'recruiter_offer' | 'recruiter_general'
    | 'client_round_1' | 'client_round_2' | 'client_final' | 'client_general';
  call_mode: 'video' | 'phone' | 'audio_only';
  title: string | null;
  description: string | null;
  host_name: string | null;
  host_avatar_url?: string | null;
  participant_name: string | null;
  participant_avatar_url?: string | null;
  participant_email: string | null;
  notes: string | null;
  rating: number | null;
  duration_seconds: number | null;
  jobs?: {
    id: string;
    title: string;
    work_type: string | null;
    work_arrangement: string | null;
    agency_clients: {
      id: string;
      companies: {
        id: string;
        name: string;
      } | null;
      agencies: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
}

interface Recording {
  id: string;
  room_id: string;
  daily_recording_id: string;
  recording_url: string;
  download_url: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  processed_at: string;
  video_call_rooms: VideoCallRoom;
}

// Call type labels and colors for display - RECRUITER & CLIENT
const CALL_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; category: string }> = {
  // RECRUITER-LED (BPOC Internal)
  recruiter_prescreen: { label: 'Pre-Screen', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30', category: 'Recruiter' },
  recruiter_round_1: { label: 'Round 1', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30', category: 'Recruiter' },
  recruiter_round_2: { label: 'Round 2', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30', category: 'Recruiter' },
  recruiter_round_3: { label: 'Round 3', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/30', category: 'Recruiter' },
  recruiter_offer: { label: 'Offer Call', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30', category: 'Recruiter' },
  recruiter_general: { label: 'General', color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/30', category: 'Recruiter' },
  // CLIENT-LED (Client's Process)
  client_round_1: { label: 'Client R1', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30', category: 'Client' },
  client_round_2: { label: 'Client R2', color: 'text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/30', category: 'Client' },
  client_final: { label: 'Client Final', color: 'text-pink-400', bgColor: 'bg-pink-500/10 border-pink-500/30', category: 'Client' },
  client_general: { label: 'Client Call', color: 'text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/30', category: 'Client' },
  // Legacy fallbacks
  prescreen: { label: 'Pre-Screen', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30', category: 'Recruiter' },
  round_1: { label: 'Round 1', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30', category: 'Recruiter' },
  round_2: { label: 'Round 2', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30', category: 'Recruiter' },
  round_3: { label: 'Round 3', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/30', category: 'Recruiter' },
  final_interview: { label: 'Final', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30', category: 'Client' },
  offer_call: { label: 'Offer', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30', category: 'Recruiter' },
  general: { label: 'General', color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/30', category: 'Recruiter' },
};

interface Transcript {
  id: string;
  room_id: string;
  full_text: string | null;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  summary: string | null;
  key_points: string[];
  word_count: number | null;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

interface RecordingWithDetails extends Recording {
  transcript?: Transcript;
}

export default function InterviewRecordingsPage() {
  const { user, session } = useAuth();
  const [recordings, setRecordings] = useState<RecordingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCallType, setFilterCallType] = useState<string>('all');
  const [selectedRecording, setSelectedRecording] = useState<RecordingWithDetails | null>(null);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    // Only fetch when we have both user and session
    if (user?.id && session?.access_token) {
      fetchRecordings();
    }
  }, [user?.id, session?.access_token]);

  const fetchRecordings = async () => {
    // Guard: ensure session is available
    if (!session?.access_token) {
      console.log('[Recordings] No session token available, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      // Get all ended rooms for this user
      const roomsResponse = await fetch('/api/video/rooms?status=ended', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });
      if (!roomsResponse.ok) {
        const errorData = await roomsResponse.json().catch(() => ({}));
        console.error('[Recordings] Failed to fetch rooms:', roomsResponse.status, errorData);
        throw new Error((errorData as any).error || 'Failed to fetch rooms');
      }
      
      const roomsData = await roomsResponse.json();
      const rooms = roomsData.rooms || [];

      // Deduplicate recordings by daily_recording_id
      const seenRecordingIds = new Set<string>();
      const allRecordings: RecordingWithDetails[] = [];
      
      for (const room of rooms) {
        const recResponse = await fetch(`/api/video/recordings?roomId=${room.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          credentials: 'include',
        });
        if (recResponse.ok) {
          const recData = await recResponse.json();
          for (const recording of recData.recordings || []) {
            // Skip duplicates (same daily_recording_id)
            const uniqueKey = recording.daily_recording_id || recording.id;
            if (seenRecordingIds.has(uniqueKey)) {
              console.log('Skipping duplicate recording:', uniqueKey);
              continue;
            }
            seenRecordingIds.add(uniqueKey);
            
            // Fetch transcript if exists
            let transcript: Transcript | undefined;
            const transResponse = await fetch(`/api/video/transcribe?roomId=${room.id}`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
              credentials: 'include',
            });
            if (transResponse.ok) {
              const transData = await transResponse.json();
              transcript = transData.transcripts?.[0];
            }

            // Enhance room with participant name from participants table if missing
            let enhancedRoom = { ...room };
            if (!room.participant_name || room.participant_name === 'Unknown') {
              // Try to get from video_call_invitations which has invitee info
              const invitations = room.video_call_invitations || [];
              if (invitations.length > 0 && invitations[0].invitee_name) {
                enhancedRoom.participant_name = invitations[0].invitee_name;
              }
            }

            allRecordings.push({
              ...recording,
              video_call_rooms: enhancedRoom,
              transcript,
            });
          }
        }
      }

      setRecordings(allRecordings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async (recording: RecordingWithDetails) => {
    setTranscribing(recording.id);
    
    // Show immediate feedback
    toast.info('Starting transcription... This may take a few minutes.');
    
    // Update local state to show processing
    const processingTranscript: Transcript = {
      id: 'temp',
      room_id: recording.room_id,
      full_text: null,
      segments: [],
      summary: null,
      key_points: [],
      word_count: null,
      status: 'processing',
      created_at: new Date().toISOString(),
    };
    
    setRecordings(prev => prev.map(r => 
      r.id === recording.id 
        ? { ...r, transcript: processingTranscript }
        : r
    ));
    
    if (selectedRecording?.id === recording.id) {
      setSelectedRecording({ ...recording, transcript: processingTranscript });
    }

    try {
      if (!session?.access_token) {
        toast.error('Session expired. Please refresh the page.');
        return;
      }

      const response = await fetch('/api/video/transcribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ roomId: recording.room_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (data.code === 'OPENAI_NOT_CONFIGURED') {
          toast.error('Transcription service not configured. Contact administrator.');
        } else {
          toast.error(data.error || 'Transcription failed');
        }
        
        // Update to failed status
        const failedTranscript: Transcript = {
          ...processingTranscript,
          status: 'failed',
          error_message: data.error,
        };
        
        setRecordings(prev => prev.map(r => 
          r.id === recording.id 
            ? { ...r, transcript: failedTranscript }
            : r
        ));
        
        if (selectedRecording?.id === recording.id) {
          setSelectedRecording({ ...recording, transcript: failedTranscript });
        }
        return;
      }
      
      // Update recording with completed transcript
      setRecordings(prev => prev.map(r => 
        r.id === recording.id 
          ? { ...r, transcript: data.transcript }
          : r
      ));

      if (selectedRecording?.id === recording.id) {
        setSelectedRecording({ ...recording, transcript: data.transcript });
      }

      toast.success('Transcription completed!');
    } catch (error) {
      console.error('Transcription failed:', error);
      toast.error('Failed to transcribe recording. Please try again.');
      
      // Update to failed status
      setRecordings(prev => prev.map(r => 
        r.id === recording.id 
          ? { ...r, transcript: { ...processingTranscript, status: 'failed' } }
          : r
      ));
    } finally {
      setTranscribing(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRecordings = recordings.filter(r => {
    const room = r.video_call_rooms;
    
    // Filter by call type
    if (filterCallType !== 'all' && room.call_type !== filterCallType) {
      return false;
    }
    
    // Filter by search query (candidate, recruiter, job, client, call type)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        room.participant_name?.toLowerCase().includes(searchLower) ||
        room.host_name?.toLowerCase().includes(searchLower) ||
        room.title?.toLowerCase().includes(searchLower) ||
        room.call_type?.toLowerCase().includes(searchLower) ||
        CALL_TYPE_CONFIG[room.call_type]?.label.toLowerCase().includes(searchLower) ||
        room.jobs?.title?.toLowerCase().includes(searchLower) ||
        room.jobs?.agency_clients?.companies?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Video className="h-8 w-8 text-orange-400" />
            Interview Recordings
          </h1>
          <p className="text-gray-400 mt-1">Review recorded interviews and transcripts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{recordings.length}</p>
              <p className="text-gray-400 text-sm">Total Recordings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {recordings.filter(r => r.transcript?.full_text).length}
              </p>
              <p className="text-gray-400 text-sm">Transcribed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.round(recordings.reduce((acc, r) => acc + (r.duration_seconds || 0), 0) / 60)}m
              </p>
              <p className="text-gray-400 text-sm">Total Duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by participant, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        
        {/* Call Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <select
            value={filterCallType}
            onChange={(e) => setFilterCallType(e.target.value)}
            className="pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm appearance-none cursor-pointer hover:bg-white/10 transition-colors min-w-[160px]"
          >
            <option value="all" className="bg-gray-900">All Call Types</option>
            <optgroup label="── Recruiter-Led ──" className="bg-gray-900 text-gray-500">
              <option value="recruiter_prescreen" className="bg-gray-900">Pre-Screen</option>
              <option value="recruiter_round_1" className="bg-gray-900">Round 1</option>
              <option value="recruiter_round_2" className="bg-gray-900">Round 2</option>
              <option value="recruiter_round_3" className="bg-gray-900">Round 3</option>
              <option value="recruiter_offer" className="bg-gray-900">Offer Call</option>
              <option value="recruiter_general" className="bg-gray-900">General</option>
            </optgroup>
            <optgroup label="── Client-Led ──" className="bg-gray-900 text-gray-500">
              <option value="client_round_1" className="bg-gray-900">Client Round 1</option>
              <option value="client_round_2" className="bg-gray-900">Client Round 2</option>
              <option value="client_final" className="bg-gray-900">Client Final</option>
              <option value="client_general" className="bg-gray-900">Client General</option>
            </optgroup>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recordings List */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto" />
              <p className="text-gray-400 mt-2">Loading recordings...</p>
            </div>
          ) : filteredRecordings.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Recordings</h3>
                <p className="text-gray-400">Start video interviews to see recordings here.</p>
              </CardContent>
            </Card>
          ) : (
            filteredRecordings.map((recording, i) => (
              <motion.div
                key={recording.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedRecording?.id === recording.id
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedRecording(recording)}
                >
                  <CardContent className="p-4">
                    {/* Meeting Type Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {recording.video_call_rooms.call_type && (
                          <>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${CALL_TYPE_CONFIG[recording.video_call_rooms.call_type]?.bgColor || 'bg-gray-500/10'} ${CALL_TYPE_CONFIG[recording.video_call_rooms.call_type]?.color || 'text-gray-400'}`}
                            >
                              {CALL_TYPE_CONFIG[recording.video_call_rooms.call_type]?.label || 'Call'}
                            </Badge>
                            <span className="text-gray-500 text-xs">
                              {CALL_TYPE_CONFIG[recording.video_call_rooms.call_type]?.category || 'Interview'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(recording.created_at)}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {/* Participants Avatars */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Host/Recruiter Avatar */}
                        <div className="relative">
                          <Avatar className="h-11 w-11 border-2 border-cyan-500/30">
                            <AvatarImage src={recording.video_call_rooms.host_avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
                              {recording.video_call_rooms.host_name?.charAt(0) || user?.email?.charAt(0) || 'R'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 border-2 border-gray-900 flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        
                        {/* Candidate Avatar */}
                        <div className="relative">
                          <Avatar className="h-11 w-11 border-2 border-orange-500/30">
                            <AvatarImage src={recording.video_call_rooms.participant_avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-sm font-semibold">
                              {recording.video_call_rooms.participant_name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 border-2 border-gray-900 flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Participants Info */}
                        <div className="space-y-1.5 mb-2">
                          {/* Host/Recruiter */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-cyan-400 font-medium">Recruiter:</span>
                            <span className="text-white text-sm font-medium truncate">
                              {recording.video_call_rooms.host_name || user?.email || 'You'}
                            </span>
                          </div>
                          {/* Candidate */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-orange-400 font-medium">Candidate:</span>
                            <span className="text-white text-sm font-medium truncate">
                              {recording.video_call_rooms.participant_name || 'Unknown Candidate'}
                            </span>
                          </div>
                        </div>

                        {/* Job & Client Info */}
                        {recording.video_call_rooms.jobs && (
                          <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-purple-400 font-medium">Job:</span>
                                  <span className="text-white text-xs font-medium truncate">
                                    {recording.video_call_rooms.jobs.title}
                                  </span>
                                </div>
                                {recording.video_call_rooms.jobs.agency_clients?.companies && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-400 font-medium">Client:</span>
                                    <span className="text-gray-300 text-xs truncate">
                                      {recording.video_call_rooms.jobs.agency_clients.companies.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Title if exists */}
                        {recording.video_call_rooms.title && (
                          <p className="text-gray-400 text-xs truncate mb-2">
                            📋 {recording.video_call_rooms.title}
                          </p>
                        )}

                        {/* Meeting Stats */}
                        <div className="flex items-center gap-3 text-gray-500 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(recording.duration_seconds || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span className="capitalize">{recording.video_call_rooms.call_mode || 'video'}</span>
                          </div>
                          {recording.video_call_rooms.ended_at && (
                            <span className="text-emerald-400">● Completed</span>
                          )}
                        </div>
                      </div>

                      {/* Badges column */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {recording.transcript?.full_text ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Transcribed
                          </Badge>
                        ) : recording.transcript?.status === 'processing' ? (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing
                          </Badge>
                        ) : recording.transcript?.status === 'failed' ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                            Failed
                          </Badge>
                        ) : null}
                        {recording.video_call_rooms.rating && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                            ★ {recording.video_call_rooms.rating}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Recording Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedRecording ? (
              <motion.div
                key={selectedRecording.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Video Player */}
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <div className="aspect-video bg-gray-900 relative">
                    {selectedRecording.download_url ? (
                      <video
                        src={selectedRecording.download_url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 text-orange-400 animate-spin mx-auto mb-4" />
                          <p className="text-gray-400">Recording processing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedRecording.video_call_rooms.participant_avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                            {selectedRecording.video_call_rooms.participant_name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {selectedRecording.video_call_rooms.call_type && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${CALL_TYPE_CONFIG[selectedRecording.video_call_rooms.call_type]?.bgColor || 'bg-gray-500/10'} ${CALL_TYPE_CONFIG[selectedRecording.video_call_rooms.call_type]?.color || 'text-gray-400'}`}
                              >
                                {CALL_TYPE_CONFIG[selectedRecording.video_call_rooms.call_type]?.label || 'Call'}
                              </Badge>
                            )}
                            {selectedRecording.video_call_rooms.rating && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                                ★ {selectedRecording.video_call_rooms.rating}/5
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-white font-semibold">
                            {selectedRecording.video_call_rooms.participant_name || 'Unknown Candidate'}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {selectedRecording.video_call_rooms.title || 
                              (selectedRecording.video_call_rooms.job_id ? 'Job Interview' : 'General Call')}
                          </p>
                          {selectedRecording.video_call_rooms.host_name && (
                            <p className="text-gray-500 text-xs mt-1">
                              Host: {selectedRecording.video_call_rooms.host_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedRecording.download_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => window.open(selectedRecording.download_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {!selectedRecording.transcript?.full_text && selectedRecording.status === 'ready' && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-amber-600"
                            onClick={() => handleTranscribe(selectedRecording)}
                            disabled={transcribing === selectedRecording.id}
                          >
                            {transcribing === selectedRecording.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Transcribing...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Transcribe
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transcript Processing/Failed Status */}
                {selectedRecording.transcript && !selectedRecording.transcript.full_text && (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedRecording.transcript.status === 'processing' ? (
                            <>
                              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">Transcription in Progress</h4>
                                <p className="text-gray-400 text-sm">Processing audio with Whisper AI...</p>
                              </div>
                            </>
                          ) : selectedRecording.transcript.status === 'failed' ? (
                            <>
                              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">Transcription Failed</h4>
                                <p className="text-gray-400 text-sm">
                                  {selectedRecording.transcript.error_message || 'An error occurred during transcription'}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">No Transcript Content</h4>
                                <p className="text-gray-400 text-sm">The transcription may have been interrupted</p>
                              </div>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-amber-600"
                          onClick={() => handleTranscribe(selectedRecording)}
                          disabled={transcribing === selectedRecording.id}
                        >
                          {transcribing === selectedRecording.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Retry Transcription
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transcript - only show if there's actual content */}
                {selectedRecording.transcript?.full_text && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-400" />
                          Transcript
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTranscript(!showTranscript)}
                          className="text-gray-400 hover:text-white"
                        >
                          {showTranscript ? 'Hide' : 'Show'} Full Transcript
                          {showTranscript ? (
                            <ChevronDown className="w-4 h-4 ml-1" />
                          ) : (
                            <ChevronRight className="w-4 h-4 ml-1" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary */}
                      {selectedRecording.transcript.summary && (
                        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <h4 className="text-purple-400 font-medium flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4" />
                            AI Summary
                          </h4>
                          <p className="text-gray-300">{selectedRecording.transcript.summary}</p>
                        </div>
                      )}

                      {/* Key Points */}
                      {selectedRecording.transcript.key_points?.length > 0 && (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <h4 className="text-amber-400 font-medium flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4" />
                            Key Discussion Points
                          </h4>
                          <ul className="space-y-1">
                            {selectedRecording.transcript.key_points.map((point, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <span className="text-amber-400">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Full Transcript */}
                      <AnimatePresence>
                        {showTranscript && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 rounded-lg bg-white/5 border border-white/10 max-h-96 overflow-y-auto"
                          >
                            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                              {selectedRecording.transcript.full_text}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Word Count */}
                      <div className="flex items-center justify-end gap-4 text-gray-500 text-sm">
                        <span>{selectedRecording.transcript.word_count?.toLocaleString()} words</span>
                        <span>•</span>
                        <span>Transcribed {formatDate(selectedRecording.transcript.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-96 flex items-center justify-center"
              >
                <div className="text-center">
                  <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Select a Recording</h3>
                  <p className="text-gray-500">Choose a recording from the list to view details</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

