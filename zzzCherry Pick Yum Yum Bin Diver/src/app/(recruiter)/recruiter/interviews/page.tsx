'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, Search, Clock, Video, Phone, CheckCircle, XCircle, Loader2, Briefcase, Gift, DollarSign, X,
  MoreVertical, User, Mail, CalendarClock, PhoneCall
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/components/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';
import { VideoCallButton } from '@/components/video';
import { useVideoCall } from '@/contexts/VideoCallContext';

interface Interview {
  id: string;
  applicationId: string;
  candidateId: string; // User ID for video calls
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId?: string;
  jobTitle: string;
  type: string;
  status: string;
  outcome?: string;
  scheduledAt?: string;
  duration: number;
  createdAt: string;
  // Offer tracking
  hasOffer: boolean;
  offerStatus?: string;
  offerId?: string;
  // Optional video room created for this interview (client rounds, etc)
  roomId?: string | null;
  roomStatus?: string | null;
  roomUrl?: string | null;
  roomName?: string | null;
  callType?: string | null;
  scheduledFor?: string | null;
}

export default function RecruiterInterviewsPage() {
  const { user } = useAuth();
  const { joinCall } = useVideoCall();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [offerModal, setOfferModal] = useState<Interview | null>(null);
  const [offerSalary, setOfferSalary] = useState('');

  useEffect(() => {
    if (user?.id) fetchInterviews();
  }, [user?.id]);

  const fetchInterviews = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      const data = await response.json();
      if (response.ok) setInterviews(data.interviews || []);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOutcome = async (interviewId: string, outcome: string, candidateName: string) => {
    setActionLoading(interviewId);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/interviews', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ interviewId, outcome, status: 'completed' }),
      });
      if (response.ok) {
        toast.success(outcome === 'passed' ? `${candidateName} marked as passed! 🎉` : 'Interview marked as failed');
        fetchInterviews();
      } else {
        toast.error('Failed to update interview');
      }
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to update interview');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartRoomNow = async (roomId?: string | null) => {
    if (!roomId) return;
    try {
      await joinCall(roomId);
    } catch (e) {
      console.error('Failed to start room:', e);
      toast.error('Failed to start call');
    }
  };

  const handleSendOffer = async () => {
    if (!offerModal || !offerSalary) return;
    setActionLoading(offerModal.id);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/offers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ applicationId: offerModal.applicationId, salaryOffered: parseFloat(offerSalary) }),
      });
      if (response.ok) {
        toast.success(`Offer sent to ${offerModal.candidateName}! 🎉`);
        setOfferModal(null);
        setOfferSalary('');
        window.location.href = '/recruiter/offers';
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to send offer');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (interview: Interview) => {
    if (interview.outcome === 'passed') {
      return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Passed ✓' };
    }
    if (interview.outcome === 'failed') {
      return { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Not Passed' };
    }
    if (interview.status === 'completed') {
      return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Completed' };
    }
    if (interview.status === 'pending_scheduling') {
      return { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: '🔔 Client Request' };
    }
    if (interview.status === 'scheduled') {
      return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Scheduled' };
    }
    return { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: interview.status };
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const filtered = interviews.filter(i =>
    (i.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group interviews - include pending_scheduling (client requests) and scheduled
  const clientRequests = filtered.filter(i => i.status === 'pending_scheduling');
  const pending = filtered.filter(i => i.status === 'scheduled' && !i.outcome);
  const passed = filtered.filter(i => i.outcome === 'passed' && !i.hasOffer);
  const offerSent = filtered.filter(i => i.outcome === 'passed' && i.hasOffer);
  const completed = filtered.filter(i => i.status === 'completed' || i.outcome === 'failed');

  const stats = {
    total: interviews.length,
    clientRequests: interviews.filter(i => i.status === 'pending_scheduling').length,
    pending: interviews.filter(i => i.status === 'scheduled' && !i.outcome).length,
    passed: interviews.filter(i => i.outcome === 'passed').length,
    completed: interviews.filter(i => i.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Interviews</h1>
        <p className="text-gray-400 mt-1">Manage interview schedules and outcomes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total</p>
          </CardContent>
        </Card>
        {stats.clientRequests > 0 && (
          <Card className="bg-purple-500/10 border-purple-500/30 animate-pulse">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.clientRequests}</p>
              <p className="text-purple-300 text-sm">🔔 Client Requests</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.pending}</p>
            <p className="text-gray-400 text-sm">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.passed}</p>
            <p className="text-gray-400 text-sm">Passed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.completed}</p>
            <p className="text-gray-400 text-sm">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search candidates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Interviews</h3>
            <p className="text-gray-400">Request interviews from the Applications page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* CLIENT REQUESTS - Top Priority */}
          {clientRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-purple-400" />
                🔔 Client Interview Requests ({clientRequests.length})
              </h2>
              <p className="text-sm text-purple-300/70">Clients have requested interviews with these candidates. Coordinate with the candidate to confirm a time.</p>
              {clientRequests.map((interview, i) => {
                const statusConfig = getStatusConfig(interview);
                return (
                  <motion.div key={interview.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm">
                                {interview.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{interview.candidateName}</p>
                              <p className="text-sm text-gray-400">{interview.jobTitle}</p>
                              <p className="text-xs text-purple-300 mt-1">
                                Proposed: {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleDateString() + ' at ' + new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
                            <Link href={`/recruiter/applications/${interview.applicationId}`}>
                              <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                                Coordinate
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Scheduled Interviews */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" />
                Scheduled ({pending.length})
              </h2>
              {pending.map((interview, i) => {
                const statusConfig = getStatusConfig(interview);
                return (
                  <motion.div key={interview.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-orange-500/5 border-orange-500/30 hover:border-orange-500/50 transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-sm">
                                {interview.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-semibold">{interview.candidateName}</h3>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                                <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20 capitalize text-xs">
                                  {interview.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400 text-sm mt-1">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {interview.jobTitle}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  {getTimeAgo(interview.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Start Video Call - Interview Rounds */}
                            <VideoCallButton
                              candidateUserId={interview.candidateId}
                              candidateName={interview.candidateName}
                              candidateEmail={interview.candidateEmail}
                              candidateAvatar={interview.candidateAvatar}
                              jobId={interview.jobId}
                              jobTitle={interview.jobTitle}
                              applicationId={interview.applicationId}
                              variant="compact"
                              context="interviews"
                            />

                            {/* Start existing client interview room now (ignores scheduled time while testing) */}
                            {interview.roomId && interview.roomStatus !== 'ended' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartRoomNow(interview.roomId)}
                                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                                title={interview.callType ? `Start ${interview.callType}` : 'Start call'}
                              >
                                <PhoneCall className="h-4 w-4 mr-1" />
                                Start Now
                              </Button>
                            )}
                            
                            {/* Mark as Passed */}
                            <Button 
                              size="sm" 
                              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30" 
                              onClick={() => handleOutcome(interview.id, 'passed', interview.candidateName)} 
                              disabled={actionLoading === interview.id}
                            >
                              {actionLoading === interview.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Pass
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-400 hover:bg-red-500/10" 
                              onClick={() => handleOutcome(interview.id, 'failed', interview.candidateName)} 
                              disabled={actionLoading === interview.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Passed - Ready for Offer */}
          {passed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Passed - Ready for Offer ({passed.length})
              </h2>
              {passed.map((interview, i) => (
                <motion.div key={interview.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm">
                              {interview.candidateName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-semibold">{interview.candidateName}</h3>
                              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                ✓ Passed
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{interview.jobTitle}</p>
                          </div>
                        </div>
                        
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700" 
                          onClick={() => setOfferModal(interview)}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Make Offer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Offer Sent */}
          {offerSent.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-400" />
                Offer Sent - Awaiting Response ({offerSent.length})
              </h2>
              {offerSent.map((interview, i) => {
                const offerStatusText = interview.offerStatus === 'accepted' ? 'Accepted! 🎉' : 
                                        interview.offerStatus === 'rejected' ? 'Declined' : 
                                        'Pending Response';
                const offerBadgeColor = interview.offerStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        interview.offerStatus === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        'bg-pink-500/20 text-pink-400 border-pink-500/30';
                return (
                  <motion.div key={interview.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-pink-500/5 border-pink-500/30">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-sm">
                                {interview.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-semibold">{interview.candidateName}</h3>
                                <Badge variant="outline" className={offerBadgeColor}>
                                  {offerStatusText}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{interview.jobTitle}</p>
                            </div>
                          </div>
                          
                          <Link href="/recruiter/offers">
                            <Button variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
                              <Gift className="h-4 w-4 mr-2" />
                              View Offer
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Completed/Failed */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                Completed ({completed.length})
              </h2>
              {completed.map((interview, i) => {
                const statusConfig = getStatusConfig(interview);
                return (
                  <motion.div key={interview.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-gray-600 text-white text-sm">
                                {interview.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-semibold">{interview.candidateName}</h3>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{interview.jobTitle}</p>
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm">{getTimeAgo(interview.createdAt)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Send Job Offer</h2>
              <Button variant="ghost" size="sm" onClick={() => setOfferModal(null)} className="text-gray-400"><X className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-gray-400 text-sm mb-1">Candidate</p>
                <p className="text-white font-medium">{offerModal.candidateName}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-gray-400 text-sm mb-1">Position</p>
                <p className="text-white font-medium">{offerModal.jobTitle}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Monthly Salary (PHP) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="number" 
                    placeholder="50000" 
                    value={offerSalary} 
                    onChange={(e) => setOfferSalary(e.target.value)} 
                    className="pl-10 bg-white/5 border-white/10 text-white" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1 border-white/10 text-gray-400" onClick={() => setOfferModal(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700" 
                  onClick={handleSendOffer} 
                  disabled={!offerSalary || actionLoading === offerModal.id}
                >
                  {actionLoading === offerModal.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Send Offer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
