'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Clock,
  CheckCircle,
  Loader2,
  TrendingUp,
  Gift,
  Video,
  FileText,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { CandidateApplicationCard } from '@/components/candidate/CandidateApplicationCard';
import { InterviewTimeResponseModal } from '@/components/candidate/InterviewTimeResponseModal';
import { getSessionToken } from '@/lib/auth-helpers';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  salary?: { min: number; max: number; currency: string };
  workType?: string;
  workArrangement?: string;
  rejectionReason?: string;
  offerAcceptanceDate?: string;
  firstDayDate?: string;
  startedStatus?: 'hired' | 'started' | 'no_show';
  hasNewActivity?: boolean;
  releasedToClient?: boolean;
  releasedAt?: string | null;
}

interface InterviewProposal {
  id: string;
  applicationId: string;
  jobTitle: string;
  interviewType: string;
  duration: number;
  proposedTimes: Array<{ date: string; time: string }>;
  notes?: string;
  status: string;
  createdAt: string;
}

export default function CandidateApplicationsPage() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [interviewProposals, setInterviewProposals] = useState<InterviewProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<InterviewProposal | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/candidate/applications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Fetch profile completion status
  const fetchProfileStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/candidates/${session.user.id}/profile`);
      const data = await response.json();

      if (response.ok && data.profile) {
        // Profile is complete if completion percentage is 100 or profile_completed flag is true
        const isComplete = data.profile.profile_completion_percentage === 100 || data.profile.profile_completed === true;
        setProfileComplete(isComplete);
      }
    } catch (error) {
      console.error('Failed to fetch profile status:', error);
    }
  }, [session?.user?.id]);

  // Fetch interview proposals
  const fetchInterviewProposals = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const token = await getSessionToken();
      const response = await fetch('/api/candidate/interviews/proposals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterviewProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Failed to fetch interview proposals:', error);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchApplications();
    fetchProfileStatus();
    fetchInterviewProposals();
  }, [fetchApplications, fetchProfileStatus, fetchInterviewProposals]);

  const handleProposalResponse = () => {
    setSelectedProposal(null);
    fetchInterviewProposals();
    fetchApplications();
  };

  // Count applications by category
  const stats = {
    total: applications.length,
    invited: applications.filter(a => a.status === 'invited').length,
    inReview: applications.filter(a => ['under_review', 'for_verification'].includes(a.status)).length,
    interviews: applications.filter(a => ['interview_scheduled', 'initial_interview', 'shortlisted'].includes(a.status)).length,
    offers: applications.filter(a => ['offer_sent', 'hired', 'passed'].includes(a.status)).length,
  };

  // Group applications
  const activeApplications = applications.filter(a =>
    !['rejected', 'hired', 'withdrawn'].includes(a.status)
  );
  const offerApplications = applications.filter(a =>
    ['offer_sent', 'passed'].includes(a.status)
  );
  const hiredApplications = applications.filter(a =>
    a.status === 'hired'
  );
  const pastApplications = applications.filter(a =>
    ['rejected', 'withdrawn'].includes(a.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Applications</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your job application journey</p>
        </div>
        <Link href="/candidate/jobs">
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 w-full sm:w-auto min-h-[44px]">
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-gray-400" />
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <p className="text-gray-400 text-sm">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <p className="text-2xl font-bold text-indigo-400">{stats.invited}</p>
            </div>
            <p className="text-gray-400 text-sm">Invited</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-cyan-400" />
              <p className="text-2xl font-bold text-cyan-400">{stats.inReview}</p>
            </div>
            <p className="text-gray-400 text-sm">In Review</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Video className="h-4 w-4 text-orange-400" />
              <p className="text-2xl font-bold text-orange-400">{stats.interviews}</p>
            </div>
            <p className="text-gray-400 text-sm">Interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-emerald-400" />
              <p className="text-2xl font-bold text-emerald-400">{stats.offers}</p>
            </div>
            <p className="text-gray-400 text-sm">Offers</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Interview Proposals */}
      {interviewProposals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            Action Required: Interview Time Proposals ({interviewProposals.length})
          </h2>
          <div className="space-y-3">
            {interviewProposals.map((proposal) => (
              <Card key={proposal.id} className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-orange-400" />
                        <h3 className="font-semibold text-white text-sm sm:text-base">{proposal.jobTitle}</h3>
                        <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                          Pending Response
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        Interview Type: {proposal.interviewType.replace(/_/g, ' ')} - {proposal.duration} minutes
                      </p>
                      <p className="text-sm text-gray-400">
                        {proposal.proposedTimes.length} time slot{proposal.proposedTimes.length !== 1 ? 's' : ''} proposed
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedProposal(proposal)}
                      className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0 w-full sm:w-auto min-h-[44px]"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Respond
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <Card className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/30">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-10 w-10 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Your Journey</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Your dream job is waiting! Browse available positions and submit your first application.
            </p>
            <Link href="/candidate/jobs">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Explore Job Opportunities
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* 🎁 Offers & Hired - Priority Display */}
          {(offerApplications.length > 0 || hiredApplications.length > 0) && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-400" />
                Offers & Hired ({offerApplications.length + hiredApplications.length})
              </h2>
              <div className="space-y-4">
                {[...hiredApplications, ...offerApplications].map((app) => (
                  <CandidateApplicationCard key={app.id} application={app} onRefresh={fetchApplications} profileComplete={profileComplete} />
                ))}
              </div>
            </div>
          )}

          {/* 🔄 Active Applications */}
          {activeApplications.filter(a => !['offer_sent', 'passed'].includes(a.status)).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                Active Applications ({activeApplications.filter(a => !['offer_sent', 'passed'].includes(a.status)).length})
              </h2>
              <div className="space-y-4">
                {activeApplications
                  .filter(a => !['offer_sent', 'passed'].includes(a.status))
                  .map((app) => (
                    <CandidateApplicationCard key={app.id} application={app} onRefresh={fetchApplications} profileComplete={profileComplete} />
                  ))}
              </div>
            </div>
          )}

          {/* ❌ Past Applications */}
          {pastApplications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                Past Applications ({pastApplications.length})
              </h2>
              <div className="space-y-4">
                {pastApplications.map((app) => (
                  <CandidateApplicationCard key={app.id} application={app} onRefresh={fetchApplications} profileComplete={profileComplete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interview Time Response Modal */}
      {selectedProposal && (
        <InterviewTimeResponseModal
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onSuccess={handleProposalResponse}
          proposalId={selectedProposal.id}
          proposedTimes={selectedProposal.proposedTimes}
          interviewType={selectedProposal.interviewType}
          duration={selectedProposal.duration}
          notes={selectedProposal.notes}
        />
      )}
    </div>
  );
}
