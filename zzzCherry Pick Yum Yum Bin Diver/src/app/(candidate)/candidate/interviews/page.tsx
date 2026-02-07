'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Briefcase,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  CalendarPlus,
  Bell,
  Sparkles,
  Lightbulb,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  type: string;
  status: string;
  outcome?: string;
  scheduledAt?: string;
  duration: number;
  meetingLink?: string;
  participantJoinUrl?: string;
  notes?: string;
  createdAt: string;
}

export default function CandidateInterviewsPage() {
  const { session } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!session?.access_token) return;

      try {
        const response = await fetch('/api/candidate/interviews', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setInterviews(data.interviews || []);
        }
      } catch (error) {
        console.error('Failed to fetch interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [session]);

  const getStatusDisplay = (interview: Interview) => {
    const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
      scheduled: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertCircle, label: 'Interview Requested' },
      confirmed: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Calendar, label: 'Confirmed' },
      in_progress: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock, label: 'In Progress' },
      completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Cancelled' },
      no_show: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle, label: 'No Show' },
      rescheduled: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Calendar, label: 'Rescheduled' },
    };
    const config = statusConfig[interview.status] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'screening' ? Phone : Video;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Interviews</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">View your scheduled and upcoming interviews</p>
        </div>
        <Link href="/candidate/applications">
          <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 w-full sm:w-auto min-h-[44px]">
            <Briefcase className="h-4 w-4 mr-2" />
            View Applications
          </Button>
        </Link>
      </div>

      {/* Preparation Tips Banner */}
      {!loading && interviews.filter(i => i.scheduledAt && i.status === 'scheduled').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Lightbulb className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Interview Preparation Tips</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Test your camera and microphone 10 minutes before</li>
                <li>• Have a quiet, well-lit space ready</li>
                <li>• Review the job description and prepare questions</li>
                <li>• Keep your resume nearby for reference</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {interviews.filter(i => i.status === 'scheduled' && !i.scheduledAt).length}
            </p>
            <p className="text-gray-400 text-sm">Awaiting Schedule</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {interviews.filter(i => i.status === 'scheduled' && i.scheduledAt).length}
            </p>
            <p className="text-gray-400 text-sm">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {interviews.filter(i => i.status === 'completed').length}
            </p>
            <p className="text-gray-400 text-sm">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interview Hero Card */}
      {!loading && interviews.length > 0 && (() => {
        // Find the next upcoming interview
        const upcomingInterviews = interviews
          .filter(i => i.scheduledAt && i.status === 'scheduled' && new Date(i.scheduledAt) > new Date())
          .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

        const nextInterview = upcomingInterviews[0];

        if (!nextInterview) return null;

        const interviewDate = new Date(nextInterview.scheduledAt!);
        const now = new Date();
        const hoursUntil = Math.floor((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        const minutesUntil = Math.floor((interviewDate.getTime() - now.getTime()) / (1000 * 60));
        const isToday = interviewDate.toDateString() === now.toDateString();
        const isSoon = minutesUntil <= 30 && minutesUntil > 0;
        const isNow = minutesUntil <= 5 && minutesUntil >= -30;

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-xl border-2 p-6 ${isNow
              ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/50 animate-pulse'
              : isSoon
                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/50'
                : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30'
              }`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-3 sm:p-4 rounded-xl flex-shrink-0 ${isNow ? 'bg-emerald-500/30' : isSoon ? 'bg-orange-500/30' : 'bg-cyan-500/20'}`}>
                  <Video className={`h-6 w-6 sm:h-8 sm:w-8 ${isNow ? 'text-emerald-400' : isSoon ? 'text-orange-400' : 'text-cyan-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isNow ? (
                      <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-500/50 animate-pulse">
                        <Sparkles className="h-3 w-3 mr-1" />
                        STARTING NOW
                      </Badge>
                    ) : isSoon ? (
                      <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/50">
                        <Bell className="h-3 w-3 mr-1" />
                        Starting in {minutesUntil} min
                      </Badge>
                    ) : isToday ? (
                      <Badge className="bg-cyan-500/30 text-cyan-300 border-cyan-500/50">
                        TODAY
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-500/30 text-purple-300 border-purple-500/50">
                        UPCOMING
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-white">{nextInterview.jobTitle}</h3>
                  <p className="text-gray-400">{nextInterview.company}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {interviewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-400">
                      {nextInterview.duration} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Preparation Page Link */}
                <Link href={`/candidate/interviews/${nextInterview.id}/prep`}>
                  <Button
                    variant="outline"
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 w-full sm:w-auto"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Prepare
                  </Button>
                </Link>

                {/* Add to Calendar Button */}
                <Button
                  variant="outline"
                  className="border-white/20 text-gray-300 hover:bg-white/10"
                  onClick={() => {
                    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nextInterview.jobTitle + ' Interview')}&dates=${interviewDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(interviewDate.getTime() + nextInterview.duration * 60000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent('Interview with ' + nextInterview.company)}`;
                    window.open(googleCalUrl, '_blank');
                  }}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>

                {/* Join Button */}
                {(nextInterview.participantJoinUrl || nextInterview.meetingLink) && (
                  <Button
                    className={`${isNow
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700'
                      } text-white px-6`}
                    onClick={() => window.open(nextInterview.participantJoinUrl || nextInterview.meetingLink!, '_blank')}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {isNow ? 'Join Now!' : 'Join Meeting'}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Interviews List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Interviews Yet</h3>
            <p className="text-gray-400 mb-4">When recruiters request an interview, it will appear here.</p>
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => window.location.href = '/candidate/jobs'}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(() => {
            // Find the hero interview ID to exclude it from the list
            const upcomingInterviews = interviews
              .filter(i => i.scheduledAt && i.status === 'scheduled' && new Date(i.scheduledAt) > new Date())
              .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
            const heroInterviewId = upcomingInterviews[0]?.id;
            
            // Filter out the hero interview from the list
            const listInterviews = interviews.filter(i => i.id !== heroInterviewId);
            
            return listInterviews.map((interview, index) => {
            const TypeIcon = getTypeIcon(interview.type);

            return (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-white/10 transition-all ${interview.status === 'scheduled' && !interview.scheduledAt
                  ? 'bg-orange-500/5 border-orange-500/30'
                  : 'bg-white/5 hover:border-cyan-500/30'
                  }`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`p-3 rounded-xl ${interview.status === 'scheduled' && !interview.scheduledAt
                          ? 'bg-orange-500/20'
                          : 'bg-cyan-500/20'
                          }`}>
                          <TypeIcon className={`h-6 w-6 ${interview.status === 'scheduled' && !interview.scheduledAt
                            ? 'text-orange-400'
                            : 'text-cyan-400'
                            }`} />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-xl font-semibold text-white mb-1">{interview.jobTitle}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                            <Building2 className="h-4 w-4" />
                            <span>{interview.company}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20 capitalize">
                              {interview.type} Interview
                            </Badge>
                            {getStatusDisplay(interview)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {interview.scheduledAt ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white font-medium">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(interview.scheduledAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Clock className="h-4 w-4" />
                              {new Date(interview.scheduledAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              <span>• {interview.duration} min</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-orange-400 text-sm font-medium">
                            Awaiting schedule confirmation
                          </p>
                        )}
                        {(interview.participantJoinUrl || interview.meetingLink) && interview.status === 'scheduled' && (
                          <Button
                            size="sm"
                            className="mt-3 bg-gradient-to-r from-cyan-500 to-purple-600"
                            onClick={() => window.open(interview.participantJoinUrl || interview.meetingLink!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Join Meeting
                          </Button>
                        )}
                      </div>
                    </div>
                    {interview.status === 'scheduled' && !interview.scheduledAt && (
                      <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-orange-300 text-sm">
                          🎉 <span className="font-medium">Great news!</span> The recruiter has requested an interview with you.
                          You&apos;ll be notified once the time is confirmed.
                        </p>
                      </div>
                    )}
                    {interview.outcome && (
                      <div className={`mt-4 p-3 rounded-lg ${interview.outcome === 'passed'
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                        }`}>
                        <p className={`text-sm ${interview.outcome === 'passed' ? 'text-emerald-300' : 'text-red-300'
                          }`}>
                          {interview.outcome === 'passed'
                            ? '✅ Congratulations! You passed this interview stage.'
                            : 'Thank you for your interest. Unfortunately, you were not selected to proceed.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          });
          })()}
        </div>
      )}
    </div>
  );
}
