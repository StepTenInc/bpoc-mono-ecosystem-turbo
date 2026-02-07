'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Progress } from '@/components/shared/ui/progress';
import { 
  Loader2, Search, FileText, Users, CheckCircle, Clock, 
  AlertCircle, User, Briefcase, Calendar, ChevronRight,
  FileCheck, XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import Link from 'next/link';

interface OnboardingCandidate {
  id: string;
  candidateId: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  company: string;
  jobId: string;
  completionPercent: number;
  isComplete: boolean;
  contractSigned: boolean;
  employmentStarted: boolean;
  startDate: string | null;
  createdAt: string;
  checklist: {
    personalInfo: string;
    govId: string;
    education: string;
    medical: string;
    dataPrivacy: string;
    resume: string;
    signature: string;
    emergencyContact: string;
  };
}

export default function RecruiterOnboardingPage() {
  const { user } = useAuth();
  const [onboardings, setOnboardings] = useState<OnboardingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'complete' | 'started'>('all');

  useEffect(() => {
    if (user?.id) fetchOnboardings();
  }, [user?.id]);

  const fetchOnboardings = async () => {
    try {
      const token = await getSessionToken();
      const res = await fetch('/api/recruiter/onboarding', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOnboardings(data.onboardings || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = onboardings.filter((o) => {
    const name = `${o.firstName} ${o.lastName}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                          o.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'in_progress': return !o.isComplete && !o.employmentStarted;
      case 'complete': return o.isComplete && !o.employmentStarted;
      case 'started': return o.employmentStarted;
      default: return true;
    }
  });

  const stats = {
    total: onboardings.length,
    inProgress: onboardings.filter(o => !o.isComplete && !o.employmentStarted).length,
    complete: onboardings.filter(o => o.isComplete && !o.employmentStarted).length,
    started: onboardings.filter(o => o.employmentStarted).length,
  };

  const getStatusBadge = (o: OnboardingCandidate) => {
    if (o.employmentStarted) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✓ Started</Badge>;
    }
    if (o.isComplete) {
      return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Ready to Start</Badge>;
    }
    if (o.completionPercent >= 50) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">In Progress</Badge>;
    }
    return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Just Started</Badge>;
  };

  const getChecklistStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'submitted':
      case 'pending_review':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <div className="h-4 w-4 rounded-full border border-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Onboarding</h1>
        <p className="text-gray-400 mt-1">Track and manage candidate onboarding progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card 
          className={`bg-white/5 border-white/10 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-purple-500' : 'hover:bg-white/10'}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-400">Total</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white/5 border-white/10 cursor-pointer transition-all ${filter === 'in_progress' ? 'ring-2 ring-orange-500' : 'hover:bg-white/10'}`}
          onClick={() => setFilter('in_progress')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.inProgress}</p>
            <p className="text-sm text-gray-400">In Progress</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white/5 border-white/10 cursor-pointer transition-all ${filter === 'complete' ? 'ring-2 ring-cyan-500' : 'hover:bg-white/10'}`}
          onClick={() => setFilter('complete')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{stats.complete}</p>
            <p className="text-sm text-gray-400">Ready to Start</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white/5 border-white/10 cursor-pointer transition-all ${filter === 'started' ? 'ring-2 ring-emerald-500' : 'hover:bg-white/10'}`}
          onClick={() => setFilter('started')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.started}</p>
            <p className="text-sm text-gray-400">Employment Started</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search by name, position, or company..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <FileCheck className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Onboardings</h3>
            <p className="text-gray-400">
              {searchQuery ? 'No results match your search.' : 'When candidates accept offers, they will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((onboarding) => (
            <Card key={onboarding.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {onboarding.firstName[0]}{onboarding.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {onboarding.firstName} {onboarding.lastName}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        {onboarding.position} at {onboarding.company}
                      </p>
                      {onboarding.startDate && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Start: {new Date(onboarding.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(onboarding)}
                    <Link href={`/recruiter/applications/${onboarding.applicationId}`}>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        View <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{onboarding.completionPercent}%</span>
                  </div>
                  <Progress value={onboarding.completionPercent} className="h-2" />
                </div>

                {/* Checklist icons */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1" title="Personal Info">
                    {getChecklistStatus(onboarding.checklist.personalInfo)}
                    <span className="text-xs text-gray-500">Personal</span>
                  </div>
                  <div className="flex items-center gap-1" title="Gov IDs">
                    {getChecklistStatus(onboarding.checklist.govId)}
                    <span className="text-xs text-gray-500">IDs</span>
                  </div>
                  <div className="flex items-center gap-1" title="Education">
                    {getChecklistStatus(onboarding.checklist.education)}
                    <span className="text-xs text-gray-500">Edu</span>
                  </div>
                  <div className="flex items-center gap-1" title="Medical">
                    {getChecklistStatus(onboarding.checklist.medical)}
                    <span className="text-xs text-gray-500">Med</span>
                  </div>
                  <div className="flex items-center gap-1" title="Signature">
                    {getChecklistStatus(onboarding.checklist.signature)}
                    <span className="text-xs text-gray-500">Sign</span>
                  </div>
                  {onboarding.contractSigned && (
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs">Contract Signed</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
