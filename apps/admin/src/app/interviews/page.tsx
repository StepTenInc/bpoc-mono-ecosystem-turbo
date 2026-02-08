'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Clock,
  Video,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';

interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  company?: string;
  agency?: string;
  releasedToClient?: boolean;
  type: string;
  status: string;
  outcome?: string;
  scheduledAt?: string;
  duration: number;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    try {
      const response = await fetch(`/api/admin/interviews?status=${statusFilter}`);
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

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ElementType }> = {
      scheduled: { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Calendar },
      confirmed: { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle },
      in_progress: { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock },
      completed: { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
      cancelled: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      no_show: { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertCircle },
      rescheduled: { bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Calendar },
    };
    const style = styles[status] || styles.scheduled;
    const Icon = style.icon;
    return (
      <Badge variant="outline" className={`${style.bg} capitalize`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { icon: React.ElementType; label: string; color: string }> = {
      screening: { icon: Phone, label: 'BPOC Screening', color: 'text-cyan-400' },
      technical: { icon: Video, label: 'BPOC Technical', color: 'text-purple-400' },
      behavioral: { icon: Users, label: 'BPOC Behavioral', color: 'text-blue-400' },
      final: { icon: MapPin, label: 'Client Interview', color: 'text-pink-400' },
      client: { icon: MapPin, label: 'Client Interview', color: 'text-pink-400' },
    };
    const { icon: Icon, label, color } = config[type] || { icon: Video, label: type, color: 'text-gray-400' };
    return (
      <Badge variant="outline" className={`bg-white/5 ${color} border-white/20`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getOutcomeBadge = (outcome: string) => {
    if (outcome === 'passed') {
      return (
        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const filteredInterviews = interviews.filter(i =>
    (i.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.agency || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count by status
  const statusCounts = interviews.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const passedCount = interviews.filter(i => i.outcome === 'passed').length;
  const clientInterviewCount = interviews.filter(i => ['final', 'client'].includes(i.type)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Interviews</h1>
          <p className="text-gray-400 mt-1">Monitor interview schedules and outcomes across all agencies</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-400">View Only</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-cyan-400">{statusCounts['scheduled'] || 0}</p>
            <p className="text-gray-400 text-xs">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{statusCounts['completed'] || 0}</p>
            <p className="text-gray-400 text-xs">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-purple-400">{passedCount}</p>
            <p className="text-gray-400 text-xs">Passed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-pink-400">{clientInterviewCount}</p>
            <p className="text-gray-400 text-xs">Client Interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-red-400">{statusCounts['cancelled'] || statusCounts['no_show'] || 0}</p>
            <p className="text-gray-400 text-xs">Cancelled/No-show</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search interviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      {/* Interviews List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading interviews...</p>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Interviews Yet</h3>
            <p className="text-gray-400">Interviews will appear here when recruiters schedule them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`border-white/10 transition-all ${
                interview.outcome === 'passed' ? 'bg-emerald-500/5 border-emerald-500/20' :
                ['final', 'client'].includes(interview.type) ? 'bg-pink-500/5 border-pink-500/20' :
                'bg-white/5 hover:border-cyan-500/30'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={interview.candidateAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm">
                          {interview.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-white font-medium">{interview.candidateName}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Briefcase className="h-3 w-3" />
                          <span>{interview.jobTitle}</span>
                          {interview.agency && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-cyan-400">{interview.agency}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Schedule info */}
                      <div className="text-right text-sm">
                        {interview.scheduledAt ? (
                          <>
                            <div className="flex items-center gap-1 text-white">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {new Date(interview.scheduledAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="h-3 w-3" />
                              {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <span>({interview.duration} min)</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Not scheduled</span>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        {getTypeBadge(interview.type)}
                        {getStatusBadge(interview.status)}
                        {interview.outcome && getOutcomeBadge(interview.outcome)}
                      </div>
                      
                      {/* Released indicator */}
                      {interview.releasedToClient && (
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                          Released
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/5">
        <p>Interview scheduling and outcomes are managed by recruiters in the Agency Portal</p>
      </div>
    </div>
  );
}
