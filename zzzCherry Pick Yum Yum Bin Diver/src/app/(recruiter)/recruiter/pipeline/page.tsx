'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Loader2,
  User,
  Briefcase,
  MapPin,
  Video,
  Clock,
  ChevronDown,
  ExternalLink,
  GripVertical,
  Star,
  Play,
  Phone,
  Mail,
  Calendar,
  Award,
  Gift,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';
import Link from 'next/link';
import { VideoCallButton } from '@/components/video';

interface PipelineCandidate {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  candidateLocation?: string;
  jobId: string;
  jobTitle: string;
  clientName?: string;
  stage: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  daysInStage: number;
  interviewCount: number;
  latestInterview?: {
    id: string;
    type: string;
    status: string;
    outcome?: string;
  };
  interviewOutcome?: string;
  hasOffer: boolean;
  offerStatus?: string;
  offerAmount?: number;
  offerCurrency?: string;
  videoCallCount: number;
  recordingsCount: number;
  hasRecordings: boolean;
}

interface Stage {
  label: string;
  count: number;
  candidates: PipelineCandidate[];
  color: string;
}

type Stages = Record<string, Stage>;

// Stage configuration with colors
// Pipeline stages represent WHERE a candidate is in the process
const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  applied: { label: 'Applied', color: 'text-cyber-blue', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: <FileText className="h-4 w-4" /> },
  reviewing: { label: 'Reviewing', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', icon: <Eye className="h-4 w-4" /> },
  shortlisted: { label: 'Shortlisted', color: 'text-electric-purple', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: <Star className="h-4 w-4" /> },
  // BPOC Recruiter interviews
  round_1: { label: 'BPOC R1', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', icon: <Video className="h-4 w-4" /> },
  round_2: { label: 'BPOC R2', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: <Video className="h-4 w-4" /> },
  // Client interviews
  final: { label: 'Client Interview', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30', icon: <Award className="h-4 w-4" /> },
  offer_sent: { label: 'Offer Sent', color: 'text-neon-green', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', icon: <Gift className="h-4 w-4" /> },
  hired: { label: 'Hired! 🎉', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: <CheckCircle className="h-4 w-4" /> },
};

// Context for video calls based on stage - determines what call types are shown
const STAGE_CALL_CONTEXT: Record<string, 'talent_pool' | 'applications' | 'interviews' | 'client_interviews' | 'offers'> = {
  applied: 'applications',
  reviewing: 'applications',
  shortlisted: 'applications',
  round_1: 'interviews',        // BPOC recruiter interviews
  round_2: 'interviews',        // BPOC recruiter interviews
  final: 'client_interviews',   // Client interviews
  offer_sent: 'offers',
  hired: 'offers',
};

export default function RecruiterPipelinePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Stages>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [draggedCandidate, setDraggedCandidate] = useState<PipelineCandidate | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Get unique jobs from candidates for filter
  const allJobs = Object.values(stages).flatMap(s => s.candidates).reduce((acc, c) => {
    if (!acc.find(j => j.id === c.jobId)) {
      acc.push({ id: c.jobId, title: c.jobTitle });
    }
    return acc;
  }, [] as { id: string; title: string }[]);

  useEffect(() => {
    if (user?.id) fetchPipeline();
  }, [user?.id]);

  const fetchPipeline = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/pipeline', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      const data = await response.json();
      if (response.ok) {
        setStages(data.stages || {});
      }
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, candidate: PipelineCandidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedCandidate || draggedCandidate.stage === newStage) {
      setDraggedCandidate(null);
      return;
    }

    // Optimistically update UI
    const oldStage = draggedCandidate.stage;
    setStages(prev => {
      const newStages = { ...prev };
      
      // Remove from old stage
      newStages[oldStage] = {
        ...newStages[oldStage],
        candidates: newStages[oldStage].candidates.filter(c => c.id !== draggedCandidate.id),
        count: newStages[oldStage].count - 1,
      };
      
      // Add to new stage
      const updatedCandidate = { ...draggedCandidate, stage: newStage, daysInStage: 0 };
      newStages[newStage] = {
        ...newStages[newStage],
        candidates: [updatedCandidate, ...newStages[newStage].candidates],
        count: newStages[newStage].count + 1,
      };
      
      return newStages;
    });

    setUpdating(draggedCandidate.id);

    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/pipeline', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          applicationId: draggedCandidate.id,
          newStage,
        }),
      });

      if (response.ok) {
        toast.success(`Moved ${draggedCandidate.candidateName} to ${STAGE_CONFIG[newStage]?.label || newStage}`);
      } else {
        // Revert on error
        fetchPipeline();
        toast.error('Failed to update stage');
      }
    } catch (error) {
      fetchPipeline();
      toast.error('Failed to update stage');
    } finally {
      setUpdating(null);
      setDraggedCandidate(null);
    }
  };

  // Filter candidates
  const filterCandidates = (candidates: PipelineCandidate[]) => {
    return candidates.filter(c => {
      const matchesSearch = searchQuery === '' || 
        (c.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesJob = jobFilter === 'all' || c.jobId === jobFilter;
      return matchesSearch && matchesJob;
    });
  };

  // Calculate totals
  const totalCandidates = Object.values(stages).reduce((sum, s) => sum + s.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Pipeline</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            {totalCandidates} candidates
          </p>
        </div>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto border-white/10 text-gray-400 hover:text-white"
          onClick={() => { setLoading(true); fetchPipeline(); }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search candidates, jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/10 text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {jobFilter === 'all' ? 'All Jobs' : allJobs.find(j => j.id === jobFilter)?.title || 'Job'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0a0a0f] border-white/10 max-h-60 overflow-y-auto">
            <DropdownMenuItem
              onClick={() => setJobFilter('all')}
              className={`text-gray-300 hover:text-white cursor-pointer ${jobFilter === 'all' ? 'bg-white/10' : ''}`}
            >
              All Jobs
            </DropdownMenuItem>
            {allJobs.map(job => (
              <DropdownMenuItem
                key={job.id}
                onClick={() => setJobFilter(job.id)}
                className={`text-gray-300 hover:text-white cursor-pointer ${jobFilter === job.id ? 'bg-white/10' : ''}`}
              >
                {job.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
        {Object.entries(STAGE_CONFIG).map(([stageKey, config]) => {
          const stage = stages[stageKey] || { candidates: [], count: 0 };
          const filteredCandidates = filterCandidates(stage.candidates);
          const isDropTarget = dragOverStage === stageKey && draggedCandidate?.stage !== stageKey;

          return (
            <div
              key={stageKey}
              className={`flex-shrink-0 w-[280px] sm:w-80 snap-start rounded-xl transition-all duration-300 ${
                isDropTarget ? 'ring-2 ring-cyber-blue ring-opacity-50 scale-[1.02]' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stageKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stageKey)}
            >
              {/* Column Header - Glass Style */}
              <div className={`relative overflow-hidden rounded-t-xl border ${config.borderColor} bg-white/5 backdrop-blur-md px-4 py-3`}>
                <div className={`absolute inset-0 opacity-20 ${config.bgColor}`} />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={config.color}>{config.icon}</span>
                    <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
                  </div>
                  <Badge variant="outline" className={`bg-black/30 ${config.color} ${config.borderColor} backdrop-blur-sm`}>
                    {filteredCandidates.length}
                  </Badge>
                </div>
              </div>

              {/* Column Content - Glass Style */}
              <div className="bg-black/20 backdrop-blur-sm border border-t-0 border-white/10 rounded-b-xl p-3 min-h-[500px] max-h-[70vh] overflow-y-auto space-y-3">
                <AnimatePresence>
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No candidates</p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate, idx) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        stageKey={stageKey}
                        isUpdating={updating === candidate.id}
                        onDragStart={handleDragStart}
                        index={idx}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({
  candidate,
  stageKey,
  isUpdating,
  onDragStart,
  index,
}: {
  candidate: PipelineCandidate;
  stageKey: string;
  isUpdating: boolean;
  onDragStart: (e: React.DragEvent, candidate: PipelineCandidate) => void;
  index: number;
}) {
  const config = STAGE_CONFIG[stageKey];
  const callContext = STAGE_CALL_CONTEXT[stageKey] || 'applications';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.02 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, candidate)}
      className={`group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/20 ${
        isUpdating ? 'opacity-50' : ''
      }`}
    >
      {/* Inner Glow Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Content (z-10 to stay above gradient) */}
      <div className="relative z-10">
        {/* Drag Handle & Header */}
        <div className="flex items-start gap-3">
          <div className="text-gray-600 group-hover:text-gray-400 transition-colors mt-1">
            <GripVertical className="h-4 w-4" />
          </div>
          
          <Link href={`/recruiter/talent/${candidate.candidateId}`} className="flex-shrink-0">
            <Avatar className="h-10 w-10 hover:ring-2 hover:ring-cyber-blue/50 transition-all">
              <AvatarImage src={candidate.candidateAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm">
                {candidate.candidateName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/recruiter/talent/${candidate.candidateId}`}>
              <h4 className="text-white font-medium text-sm truncate hover:text-cyber-blue transition-colors">
                {candidate.candidateName}
              </h4>
            </Link>
            <p className="text-gray-500 text-xs truncate">{candidate.candidateEmail}</p>
          </div>

          {/* Days in Stage Badge */}
          <Badge 
            variant="outline" 
            className={`text-xs ${
              candidate.daysInStage > 7 ? 'bg-red-500/10 text-bpoc-red border-red-500/30' :
              candidate.daysInStage > 3 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-white/5 text-gray-400 border-white/20'
            }`}
          >
            {candidate.daysInStage === 0 ? 'Today' : `${candidate.daysInStage}d`}
          </Badge>
        </div>

        {/* Job Info */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <Briefcase className="h-3 w-3 flex-shrink-0 text-cyber-blue" />
          <span className="truncate">{candidate.jobTitle}</span>
          {candidate.clientName && (
            <>
              <span>•</span>
              <span className="truncate text-gray-500">{candidate.clientName}</span>
            </>
          )}
        </div>

        {/* Location */}
        {candidate.candidateLocation && (
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{candidate.candidateLocation}</span>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {/* Interview count */}
          {candidate.interviewCount > 0 && (
            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
              <Video className="h-3 w-3 mr-1" />
              {candidate.interviewCount} interview{candidate.interviewCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {/* Recordings */}
          {candidate.hasRecordings && (
            <Link href="/recruiter/interviews/recordings">
              <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyber-blue border-cyan-500/30 cursor-pointer hover:bg-cyan-500/20">
                <Play className="h-3 w-3 mr-1" />
                {candidate.recordingsCount} recording{candidate.recordingsCount !== 1 ? 's' : ''}
              </Badge>
            </Link>
          )}

          {/* Offer */}
          {candidate.hasOffer && (
            <Badge variant="outline" className={`text-xs ${
              candidate.offerStatus === 'accepted' ? 'bg-green-500/10 text-neon-green border-green-500/30' :
              candidate.offerStatus === 'rejected' ? 'bg-red-500/10 text-bpoc-red border-red-500/30' :
              'bg-emerald-500/10 text-neon-green border-emerald-500/30'
            }`}>
              <Gift className="h-3 w-3 mr-1" />
              {candidate.offerCurrency} {candidate.offerAmount?.toLocaleString()}
            </Badge>
          )}

          {/* Interview outcome */}
          {candidate.interviewOutcome && (
            <Badge variant="outline" className={`text-xs ${
              candidate.interviewOutcome === 'passed' ? 'bg-emerald-500/10 text-neon-green border-emerald-500/30' :
              'bg-red-500/10 text-bpoc-red border-red-500/30'
            }`}>
              {candidate.interviewOutcome === 'passed' ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Passed</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Failed</>
              )}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
          {/* Video Call */}
          <VideoCallButton
            candidateUserId={candidate.candidateId}
            candidateName={candidate.candidateName}
            candidateEmail={candidate.candidateEmail}
            candidateAvatar={candidate.candidateAvatar}
            jobId={candidate.jobId}
            jobTitle={candidate.jobTitle}
            applicationId={candidate.id}
            variant="icon"
            context={callContext}
          />

          {/* Email */}
          <a href={`mailto:${candidate.candidateEmail}`}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
              <Mail className="h-4 w-4" />
            </Button>
          </a>

          {/* View Profile */}
          <Link href={`/recruiter/talent/${candidate.candidateId}`}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
              <User className="h-4 w-4" />
            </Button>
          </Link>

          {/* View Recordings */}
          {candidate.hasRecordings && (
            <Link href="/recruiter/interviews/recordings">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-cyber-blue hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full">
                <Play className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
