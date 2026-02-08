'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  Gift,
  Briefcase,
  Calendar,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Building2,
  Sparkles
} from 'lucide-react';

interface JobDashboardData {
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    status: string;
    postedAt: string;
    salaryRange: {
      min: number | null;
      max: number | null;
      currency: string;
      type: string;
    };
    workType: string;
    workArrangement: string;
    shift: string;
    experienceLevel: string;
  };
  client: {
    name: string;
    timezone?: string;
  };
  statistics: {
    totalApplicants: number;
    shortlisted: number;
    released_to_client: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
  releasedCandidates: Array<{
    application_id: string;
    candidate_id: string;
    candidateSlug: string;
    fullName: string;
    headline: string;
    avatar: string | null;
    status: string;
    released_at: string;
    profile_url: string;
  }>;
  upcomingInterviews: Array<{
    id: string;
    candidate_name: string;
    scheduledAt: string;
    scheduledAtClientLocal?: string;
    scheduledAtPh?: string;
    duration: number;
    status: string;
    canJoin: boolean;
    joinUrl: string;
  }>;
}

// Format date for dual timezone display
function formatDualTimezone(scheduledAt: string, clientLocalDisplay?: string, phDisplay?: string) {
  if (clientLocalDisplay && phDisplay) {
    return { client: clientLocalDisplay, ph: phDisplay };
  }
  // Fallback to basic formatting
  const date = new Date(scheduledAt);
  return {
    client: date.toLocaleString(),
    ph: date.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) + ' PHT',
  };
}

const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  colorClass 
}: { 
  icon: typeof Users; 
  value: number; 
  label: string; 
  colorClass: string;
}) => (
  <div className={`p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group`}>
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  </div>
);

export default function ClientJobDashboard() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<JobDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/client/jobs/${token}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load dashboard');
        }
        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 text-cyan-400 animate-spin relative" />
          </div>
          <p className="mt-6 text-gray-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact your recruiter.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Client Portal</h1>
                  <p className="text-xs text-gray-400">Powered by BPOC.io</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                data.job.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${data.job.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                {data.job.status === 'active' ? 'Active' : 'Closed'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Job Hero Section */}
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl items-center justify-center border border-white/10">
              <Building2 className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{data.job.title}</h2>
              <p className="text-gray-400 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {data.client.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistics Grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Recruitment Pipeline</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <StatCard
              icon={Users}
              value={data.statistics.totalApplicants}
              label="Total Applicants"
              colorClass="bg-blue-500/20 text-blue-400"
            />
            <StatCard
              icon={UserCheck}
              value={data.statistics.shortlisted}
              label="Shortlisted"
              colorClass="bg-purple-500/20 text-purple-400"
            />
            <StatCard
              icon={Gift}
              value={data.statistics.released_to_client}
              label="Released to You"
              colorClass="bg-emerald-500/20 text-emerald-400"
            />
            <StatCard
              icon={Calendar}
              value={data.statistics.interviewed}
              label="Interviewed"
              colorClass="bg-amber-500/20 text-amber-400"
            />
            <StatCard
              icon={CheckCircle}
              value={data.statistics.offered}
              label="Offered"
              colorClass="bg-orange-500/20 text-orange-400"
            />
            <StatCard
              icon={Briefcase}
              value={data.statistics.hired}
              label="Hired"
              colorClass="bg-cyan-500/20 text-cyan-400"
            />
          </div>
        </div>

        {/* Upcoming Interviews */}
        {data.upcomingInterviews.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Upcoming Interviews</h3>
              <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-1 rounded-full">
                {data.upcomingInterviews.length} scheduled
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {data.upcomingInterviews.map((interview) => {
                const times = formatDualTimezone(
                  interview.scheduled_at,
                  interview.scheduled_atClientLocal,
                  interview.scheduled_atPh
                );
                return (
                  <div 
                    key={interview.id} 
                    className="p-5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{interview.candidate_name}</p>
                          <p className="text-sm text-cyan-400">
                            {times.client} (Your time)
                          </p>
                          <p className="text-xs text-gray-500">
                            {times.ph} • {interview.duration} min
                          </p>
                        </div>
                      </div>
                      <Link
                        href={interview.joinUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Join Interview
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Released Candidates */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Candidates Released to You</h3>
            <span className="ml-auto bg-purple-500/20 text-purple-400 text-xs font-medium px-2 py-1 rounded-full">
              {data.releasedCandidates.length} candidates
            </span>
          </div>
          
          {data.releasedCandidates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-600" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No candidates yet</h4>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Your recruiter is reviewing applications and will share the best matches with you soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-5">
              {data.releasedCandidates.map((candidate) => (
                <Link
                  key={candidate.application_id}
                  href={candidate.profileUrl}
                  className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {candidate.avatar ? (
                        <img
                          src={candidate.avatar}
                          alt={candidate.fullName}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 group-hover:border-purple-500/30 transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-lg group-hover:border-purple-500/30 transition-colors">
                          {candidate.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                          {candidate.fullName}
                        </p>
                        <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-400 truncate mb-3">{candidate.headline}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/20">
                          {candidate.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(candidate.released_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Powered by BPOC.io</p>
                <p className="text-xs text-gray-500">The BPO Recruitment Platform</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} BPOC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
