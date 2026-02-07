'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Video,
  Clock,
  CheckCircle,
  Circle,
  Building2,
  Calendar,
  Briefcase,
  Lightbulb,
  AlertCircle,
  ExternalLink,
  FileText,
  Wifi,
  Volume2,
  MonitorPlay,
  ChevronLeft,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from '@/components/shared/ui/toast';

interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  type: string;
  status: string;
  scheduledAt?: string;
  duration: number;
  meetingLink?: string;
  participantJoinUrl?: string;
  notes?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
}

export default function InterviewPrepPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'resume', label: 'Resume reviewed and ready', icon: FileText, completed: false },
    { id: 'internet', label: 'Internet connection tested', icon: Wifi, completed: false },
    { id: 'quiet', label: 'Quiet, professional space prepared', icon: MonitorPlay, completed: false },
    { id: 'audio', label: 'Microphone and audio tested', icon: Volume2, completed: false },
  ]);

  const interviewId = params?.id as string;

  useEffect(() => {
    const fetchInterview = async () => {
      if (!session?.access_token || !interviewId) return;

      try {
        const response = await fetch('/api/candidate/interviews', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await response.json();

        if (response.ok) {
          const foundInterview = (data.interviews || []).find((i: Interview) => i.id === interviewId);
          if (foundInterview) {
            setInterview(foundInterview);
          } else {
            toast.error('Interview not found');
            router.push('/candidate/interviews');
          }
        }
      } catch (error) {
        console.error('Failed to fetch interview:', error);
        toast.error('Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [session, interviewId, router]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const allChecked = completedCount === checklist.length;

  // Check if interview is within 5 minutes
  const canJoin = () => {
    if (!interview?.scheduledAt) return false;
    const now = new Date();
    const scheduledTime = new Date(interview.scheduledAt);
    const minutesUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
    return minutesUntil <= 5 && minutesUntil >= -30; // Can join 5 min before or up to 30 min after
  };

  const getTimeUntilInterview = () => {
    if (!interview?.scheduledAt) return null;
    const now = new Date();
    const scheduledTime = new Date(interview.scheduledAt);
    const minutesUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
    const hoursUntil = Math.floor(minutesUntil / 60);

    if (minutesUntil < 0) return 'Interview time has passed';
    if (minutesUntil < 60) return `${minutesUntil} minutes`;
    if (hoursUntil < 24) return `${hoursUntil} hours`;
    const daysUntil = Math.floor(hoursUntil / 24);
    return `${daysUntil} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Interview not found</p>
      </div>
    );
  }

  const interviewDate = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
  const joinEnabled = canJoin() && allChecked;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/candidate/interviews">
        <Button variant="ghost" className="text-gray-400 hover:text-white -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Interviews
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Interview Preparation</h1>
          <p className="text-gray-400">Get ready for your upcoming interview</p>
        </div>
        {interviewDate && (
          <div className="text-right">
            <div className="flex items-center gap-2 text-white font-medium mb-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              {interviewDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="h-4 w-4" />
              {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <span>• {interview.duration} min</span>
            </div>
            <Badge className="mt-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {getTimeUntilInterview()} until interview
            </Badge>
          </div>
        )}
      </div>

      {/* Interview Details Card */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-xl bg-cyan-500/20">
              <Video className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{interview.jobTitle}</h2>
              <div className="flex items-center gap-2 text-gray-300 mb-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{interview.company}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20 capitalize">
                  {interview.type.replace(/_/g, ' ')} Interview
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {interview.duration} minutes
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Preparation Checklist */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-orange-400" />
              Preparation Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                    item.completed
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-white/5 border-white/10 hover:border-cyan-500/30"
                  )}
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                  <Icon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    item.completed ? "text-emerald-400" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "font-medium",
                    item.completed ? "text-emerald-300 line-through" : "text-white"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              );
            })}

            {/* Progress */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Preparation Progress</span>
                <span className="text-sm font-bold text-white">{completedCount}/{checklist.length}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / checklist.length) * 100}%` }}
                  className={cn(
                    "h-full rounded-full",
                    allChecked
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : "bg-gradient-to-r from-cyan-500 to-purple-500"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Tips */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Interview Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Research the Company</h4>
                  <p className="text-sm text-gray-400">
                    Familiarize yourself with {interview.company}'s mission, values, and recent news.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Users className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Prepare Questions</h4>
                  <p className="text-sm text-gray-400">
                    Have 2-3 thoughtful questions ready about the role, team, or company culture.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Briefcase className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Review Job Description</h4>
                  <p className="text-sm text-gray-400">
                    Match your experience and skills to the key requirements of the position.
                  </p>
                </div>
              </div>
            </div>

            {interview.notes && (
              <div className="pt-3 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-cyan-400" />
                  Interviewer Notes
                </h4>
                <p className="text-sm text-gray-400">{interview.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Join Interview Section */}
      <Card className={cn(
        "border-2 transition-all",
        joinEnabled
          ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/50"
          : "bg-white/5 border-white/10"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {joinEnabled ? 'Ready to Join!' : 'Join Interview'}
              </h3>
              <p className="text-gray-400 text-sm">
                {!allChecked
                  ? 'Complete the checklist above to enable the join button'
                  : !canJoin()
                    ? `You can join ${getTimeUntilInterview()} before your interview starts`
                    : 'Your interview is ready. Click the button below to join.'}
              </p>
            </div>
            <Button
              size="lg"
              disabled={!joinEnabled}
              onClick={() => {
                if (interview.participantJoinUrl || interview.meetingLink) {
                  window.open(interview.participantJoinUrl || interview.meetingLink!, '_blank');
                } else {
                  toast.error('Meeting link not available');
                }
              }}
              className={cn(
                "px-8 py-6 text-lg font-bold",
                joinEnabled
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30 animate-pulse"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              )}
            >
              <Video className="h-5 w-5 mr-2" />
              Join Interview Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
