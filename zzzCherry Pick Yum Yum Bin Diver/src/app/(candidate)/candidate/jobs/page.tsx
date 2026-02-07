'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  CheckCircle,
  Loader2,
  ChevronRight,
  Filter,
  X,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Zap,
  AlertCircle,
  ChevronUp,
  ExternalLink,
  Bookmark,
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/shared/ui/toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  company: string;
  agency: string;
  workType: string;
  workArrangement: string;
  shift: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  createdAt: string;
}

interface MatchData {
  overall_score: number;
  breakdown: {
    skills_score: number;
    salary_score: number;
    experience_score: number;
    arrangement_score: number;
    shift_score: number;
    location_score: number;
    urgency_score: number;
  };
  match_reasons: string[];
  concerns: string[];
  reasoning: string;
  missing_skills?: string[];
  can_refresh: boolean;
  next_refresh_at?: string;
}

// Enhanced Match Score Badge Component
function EnhancedMatchBadge({ score, size = 'default' }: { score: number; size?: 'compact' | 'default' | 'large' }) {
  const getMatchData = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Excellent Match',
        emoji: '🎯',
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
        bgGlow: 'bg-emerald-500/20',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        celebration: true,
      };
    } else if (score >= 60) {
      return {
        label: 'Good Match',
        emoji: '✨',
        gradient: 'from-blue-400 via-cyan-500 to-sky-500',
        bgGlow: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/40',
        celebration: false,
      };
    } else if (score >= 40) {
      return {
        label: 'Fair Match',
        emoji: '💡',
        gradient: 'from-yellow-400 via-amber-500 to-orange-500',
        bgGlow: 'bg-yellow-500/20',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/40',
        celebration: false,
      };
    } else {
      return {
        label: 'Explore',
        emoji: '📊',
        gradient: 'from-gray-400 via-gray-500 to-slate-500',
        bgGlow: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-500/40',
        celebration: false,
      };
    }
  };

  const matchData = getMatchData(score);

  if (size === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${matchData.borderColor} ${matchData.bgGlow} backdrop-blur-sm`}>
        <span className="text-lg">{matchData.emoji}</span>
        <span className={`text-sm font-black ${matchData.textColor}`}>{score}%</span>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {matchData.celebration && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${matchData.gradient} blur-xl opacity-50`}
          />
        )}
        <div className={`relative px-6 py-4 rounded-2xl border-2 ${matchData.borderColor} ${matchData.bgGlow} backdrop-blur-xl`}>
          <div className="flex items-center gap-3">
            <motion.span
              animate={matchData.celebration ? {
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.6,
                repeat: matchData.celebration ? Infinity : 0,
                repeatDelay: 3,
              }}
              className="text-4xl"
            >
              {matchData.emoji}
            </motion.span>
            <div>
              <div className={`text-4xl font-black ${matchData.textColor} leading-none mb-1`}>
                {score}%
              </div>
              <div className={`text-xs font-bold ${matchData.textColor} uppercase tracking-wider opacity-80`}>
                {matchData.label}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${matchData.borderColor} ${matchData.bgGlow} backdrop-blur-sm`}>
      <span className="text-2xl">{matchData.emoji}</span>
      <div>
        <div className={`text-xl font-black ${matchData.textColor} leading-none`}>{score}%</div>
        <div className={`text-[10px] font-bold ${matchData.textColor} uppercase tracking-wide opacity-70`}>{matchData.label}</div>
      </div>
    </div>
  );
}

// Progress Bar Component
function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-black text-white">{score}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${color} relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>
      </div>
    </div>
  );
}

export default function CandidateJobsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Job matching state
  const [matches, setMatches] = useState<Map<string, MatchData>>(new Map());
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [refreshingMatch, setRefreshingMatch] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [generatingMatches, setGeneratingMatches] = useState(false);

  // Filter states
  const [workType, setWorkType] = useState(searchParams.get('workType') || '');
  const [workArrangement, setWorkArrangement] = useState(searchParams.get('workArrangement') || '');
  const [shift, setShift] = useState(searchParams.get('shift') || '');
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experienceLevel') || '');
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salaryMin') || '');
  const [salaryMax, setSalaryMax] = useState(searchParams.get('salaryMax') || '');
  const [sortBy, setSortBy] = useState<'match' | 'latest' | 'salary'>('match');

  // Fetch existing applications
  useEffect(() => {
    const fetchExistingApplications = async () => {
      if (!session?.access_token) return;

      try {
        const response = await fetch('/api/candidate/applications', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const appliedJobIds = new Set<string>(
            data.applications?.map((app: { jobId: string }) => app.jobId) || []
          );
          setAppliedJobs(appliedJobIds);
        }
      } catch (error) {
        console.error('Failed to fetch existing applications:', error);
      }
    };

    fetchExistingApplications();
  }, [session?.access_token]);

  // Fetch job matches
  useEffect(() => {
    const fetchMatches = async () => {
      if (!session?.access_token) return;

      setMatchesLoading(true);
      try {
        const response = await fetch('/api/candidate/matches', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const matchesMap = new Map();

          data.matches?.forEach((match: MatchData & { job_id: string }) => {
            matchesMap.set(match.job_id, match);
          });

          setMatches(matchesMap);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchMatches();
  }, [session?.access_token]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('search', searchQuery);
    if (workType) params.set('workType', workType);
    if (workArrangement) params.set('workArrangement', workArrangement);
    if (shift) params.set('shift', shift);
    if (experienceLevel) params.set('experienceLevel', experienceLevel);
    if (salaryMin) params.set('salaryMin', salaryMin);
    if (salaryMax) params.set('salaryMax', salaryMax);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '/candidate/jobs';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, workType, workArrangement, shift, experienceLevel, salaryMin, salaryMax, router]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (searchQuery) params.set('search', searchQuery);
        if (workType) params.set('workType', workType);
        if (workArrangement) params.set('workArrangement', workArrangement);
        if (shift) params.set('shift', shift);
        if (experienceLevel) params.set('experienceLevel', experienceLevel);
        if (salaryMin) params.set('salaryMin', salaryMin);
        if (salaryMax) params.set('salaryMax', salaryMax);

        const response = await fetch(`/api/jobs/public?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setJobs(data.jobs || []);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchQuery, workType, workArrangement, shift, experienceLevel, salaryMin, salaryMax]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setWorkType('');
    setWorkArrangement('');
    setShift('');
    setExperienceLevel('');
    setSalaryMin('');
    setSalaryMax('');
  };

  const removeFilter = (filterName: string) => {
    switch (filterName) {
      case 'workType': setWorkType(''); break;
      case 'workArrangement': setWorkArrangement(''); break;
      case 'shift': setShift(''); break;
      case 'experienceLevel': setExperienceLevel(''); break;
      case 'salaryMin': setSalaryMin(''); break;
      case 'salaryMax': setSalaryMax(''); break;
      case 'search': setSearchQuery(''); break;
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (workType) count++;
    if (workArrangement) count++;
    if (shift) count++;
    if (experienceLevel) count++;
    if (salaryMin) count++;
    if (salaryMax) count++;
    return count;
  };

  const getActiveFilters = () => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (workType) filters.push({ key: 'workType', label: 'Work Type', value: formatWorkType(workType) });
    if (workArrangement) filters.push({ key: 'workArrangement', label: 'Work Arrangement', value: formatWorkArrangement(workArrangement) });
    if (shift) filters.push({ key: 'shift', label: 'Shift', value: formatShift(shift) });
    if (experienceLevel) filters.push({ key: 'experienceLevel', label: 'Experience', value: formatExperienceLevel(experienceLevel) });
    if (salaryMin) filters.push({ key: 'salaryMin', label: 'Min Salary', value: `PHP ${parseInt(salaryMin).toLocaleString()}` });
    if (salaryMax) filters.push({ key: 'salaryMax', label: 'Max Salary', value: `PHP ${parseInt(salaryMax).toLocaleString()}` });
    return filters;
  };

  const handleApply = async (jobId: string) => {
    if (!session?.access_token) {
      toast.error('Please sign in to apply for jobs');
      return;
    }

    setApplying(jobId);

    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedJobs(prev => new Set([...prev, jobId]));
        toast.success('Application submitted successfully! 🎉');
      } else {
        toast.error(data.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      toast.error('Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const formatSalary = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `${job.currency} ${job.salaryMin.toLocaleString()}+`;
    }
    return 'Competitive';
  };

  const formatWorkArrangement = (arrangement?: string) => {
    if (!arrangement) return '';
    const formats: Record<string, string> = {
      'remote': 'Remote',
      'on-site': 'On-Site',
      'onsite': 'On-Site',
      'hybrid': 'Hybrid',
      'office': 'Office',
    };
    return formats[arrangement.toLowerCase()] || arrangement.charAt(0).toUpperCase() + arrangement.slice(1);
  };

  const formatWorkType = (workType?: string) => {
    if (!workType) return '';
    const formats: Record<string, string> = {
      'full_time': 'Full Time',
      'full-time': 'Full Time',
      'fulltime': 'Full Time',
      'part_time': 'Part Time',
      'part-time': 'Part Time',
      'parttime': 'Part Time',
      'contract': 'Contract',
      'freelance': 'Freelance',
      'internship': 'Internship',
    };
    return formats[workType.toLowerCase()] || workType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatShift = (shift?: string) => {
    if (!shift) return '';
    const formats: Record<string, string> = {
      'day': 'Day Shift',
      'night': 'Night Shift',
      'both': 'Day/Night Shift',
      'flexible': 'Flexible',
      'rotating': 'Rotating',
    };
    return formats[shift.toLowerCase()] || shift.charAt(0).toUpperCase() + shift.slice(1) + ' Shift';
  };

  const formatExperienceLevel = (level?: string) => {
    if (!level) return '';
    const formats: Record<string, string> = {
      'entry_level': 'Entry Level',
      'entry-level': 'Entry Level',
      'mid_level': 'Mid Level',
      'mid-level': 'Mid Level',
      'senior_level': 'Senior Level',
      'senior-level': 'Senior Level',
    };
    return formats[level.toLowerCase()] || level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleRefreshMatch = async (jobId: string) => {
    if (!session?.access_token) return;

    setRefreshingMatch(jobId);
    try {
      const response = await fetch('/api/candidate/matches/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedMatches = new Map(matches);
        updatedMatches.set(jobId, {
          ...data.match,
          can_refresh: false,
          last_refreshed_at: new Date().toISOString(),
        });
        setMatches(updatedMatches);

        toast.success('Match score updated! 🎯');
      } else if (response.status === 429) {
        toast.error(data.message || 'You can refresh once per day');
      } else {
        toast.error(data.error || 'Failed to refresh match');
      }
    } catch (error) {
      console.error('Failed to refresh match:', error);
      toast.error('Failed to refresh match');
    } finally {
      setRefreshingMatch(null);
    }
  };

  // Generate matches for current user
  const handleGenerateMatches = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to generate matches');
      return;
    }

    setGeneratingMatches(true);
    try {
      const response = await fetch('/api/candidate/matches/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Generated ${data.generated} job matches! 🎯`);

        // Refetch matches
        const matchResponse = await fetch('/api/candidate/matches', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          const matchesMap = new Map();
          matchData.matches?.forEach((match: MatchData & { job_id: string }) => {
            matchesMap.set(match.job_id, match);
          });
          setMatches(matchesMap);
        }
      } else {
        toast.error(data.error || 'Failed to generate matches');
      }
    } catch (error) {
      console.error('Failed to generate matches:', error);
      toast.error('Failed to generate matches');
    } finally {
      setGeneratingMatches(false);
    }
  };

  const toggleCard = (jobId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedCards(newExpanded);
  };

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match' && session?.access_token) {
      const matchA = matches.get(a.id)?.overall_score || 0;
      const matchB = matches.get(b.id)?.overall_score || 0;
      return matchB - matchA;
    } else if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'salary') {
      return (b.salaryMax || 0) - (a.salaryMax || 0);
    }
    return 0;
  });

  const activeFilterCount = getActiveFilterCount();
  const activeFilters = getActiveFilters();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-none">
                Your Perfect{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Match
                </span>
              </h1>
              <p className="text-gray-400 text-lg mt-1">
                {session?.access_token ? (
                  <>AI-powered matching • {jobs.length} opportunities</>
                ) : (
                  <>Browse {jobs.length} BPO opportunities</>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Sort Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search by title, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 sm:h-14 bg-white/5 border-white/10 text-white text-lg placeholder:text-gray-500 rounded-2xl focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'latest' | 'salary')}
              className="h-14 px-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            >
              {session?.access_token && <option value="match">Best Match</option>}
              <option value="latest">Latest</option>
              <option value="salary">Highest Salary</option>
            </select>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="h-14 px-6 border-white/10 text-white hover:bg-white/10 rounded-2xl font-semibold"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2.5 py-0.5 text-xs rounded-full bg-cyan-500 text-white font-black">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardContent className="p-4 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Work Type */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                        Work Type
                      </label>
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value)}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="">All Types</option>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>

                    {/* Work Arrangement */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                        Work Arrangement
                      </label>
                      <select
                        value={workArrangement}
                        onChange={(e) => setWorkArrangement(e.target.value)}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="">All Arrangements</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-Site</option>
                      </select>
                    </div>

                    {/* Shift */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                        Shift
                      </label>
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="">All Shifts</option>
                        <option value="day">Day Shift</option>
                        <option value="night">Night Shift</option>
                        <option value="both">Day/Night Shift</option>
                      </select>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                        Experience Level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="">All Levels</option>
                        <option value="entry_level">Entry Level</option>
                        <option value="mid_level">Mid Level</option>
                        <option value="senior_level">Senior Level</option>
                      </select>
                    </div>

                    {/* Minimum Salary */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                        Min Salary (PHP)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 25000"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-medium"
                      />
                    </div>

                    {/* Maximum Salary */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                        Max Salary (PHP)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 50000"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {activeFilterCount > 0 && (
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Badges */}
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-3"
          >
            {activeFilters.map((filter) => (
              <motion.div
                key={filter.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Badge
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 pl-4 pr-2 py-2 flex items-center gap-3 text-sm font-semibold rounded-xl"
                >
                  <span>
                    {filter.label}: <span className="font-black">{filter.value}</span>
                  </span>
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="hover:bg-cyan-500/20 rounded-full p-1 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Matches Banner - show when logged in, jobs exist, but no matches */}
        {session?.access_token && !matchesLoading && matches.size === 0 && jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-3xl overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/20">
                    <Sparkles className="h-8 w-8 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Get Your AI Match Scores</h3>
                    <p className="text-gray-400">
                      See how well you match with each job opportunity based on your skills and experience.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateMatches}
                  disabled={generatingMatches}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-xl whitespace-nowrap"
                >
                  {generatingMatches ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Generate Matches
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Loader2 className="h-12 w-12 text-cyan-400" />
            </motion.div>
            <p className="text-gray-400 mt-4 text-lg font-semibold">Finding your perfect matches...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">No Jobs Found</h3>
              <p className="text-gray-400 text-lg">Try adjusting your filters or check back later for new opportunities.</p>
              {activeFilterCount > 0 && (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="mt-6 border-white/10 text-white hover:bg-white/5"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedJobs.map((job, index) => {
              const match = matches.get(job.id);
              const isExpanded = expandedCards.has(job.id);
              const hasApplied = appliedJobs.has(job.id);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <Card
                    className={`
                      group relative bg-gradient-to-br from-white/5 to-white/[0.02] border-2 backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-500
                      ${match && match.overall_score >= 80
                        ? 'border-emerald-500/40 hover:border-emerald-500/60 hover:shadow-[0_0_60px_rgba(16,185,129,0.15)]'
                        : 'border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)]'
                      }
                    `}
                  >
                    {/* Celebration glow for excellent matches */}
                    {match && match.overall_score >= 80 && (
                      <motion.div
                        animate={{
                          opacity: [0.1, 0.3, 0.1],
                          scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 pointer-events-none"
                      />
                    )}

                    <CardContent className="p-4 sm:p-8">
                      {/* Collapsed View */}
                      <div className="space-y-6">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-4 mb-3">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-8 h-8 text-cyan-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl sm:text-3xl font-black text-white mb-1 leading-tight">
                                  {job.title}
                                </h3>
                                <div className="flex items-center gap-3 text-gray-400">
                                  <span className="font-semibold">{job.company}</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {formatWorkArrangement(job.workArrangement)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Info Bar */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-semibold px-3 py-1.5">
                                {formatWorkType(job.workType)}
                              </Badge>
                              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold px-3 py-1.5">
                                {formatShift(job.shift)}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm sm:text-lg">
                                <DollarSign className="w-5 h-5" />
                                {formatSalary(job)}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-400 leading-relaxed line-clamp-2 mb-4">
                              {job.description}
                            </p>

                            {/* Match Preview (if authenticated) */}
                            {match && !isExpanded && (
                              <div className="space-y-3">
                                {match.match_reasons.slice(0, 2).map((reason, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="flex items-start gap-2"
                                  >
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-300">{reason}</span>
                                  </motion.div>
                                ))}
                                {match.concerns && match.concerns.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-start gap-2"
                                  >
                                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-300">
                                      Consider: {match.concerns[0]}
                                    </span>
                                  </motion.div>
                                )}
                              </div>
                            )}

                            {/* Skills Tags */}
                            {!isExpanded && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {job.skills.slice(0, 5).map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="outline"
                                    className="bg-white/5 text-gray-400 border-white/20 hover:bg-white/10 hover:text-white transition-colors font-medium"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 5 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-white/5 text-gray-400 border-white/20 font-semibold"
                                  >
                                    +{job.skills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Column - Match Score & Actions */}
                          <div className="flex flex-col items-end gap-4">
                            {match && (
                              <EnhancedMatchBadge score={match.overall_score} />
                            )}

                            <div className="flex flex-col gap-2 w-full sm:w-48">
                              {hasApplied ? (
                                <Button disabled className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl h-12 font-bold">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Applied
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleApply(job.id)}
                                  disabled={applying === job.id}
                                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-xl h-12 font-black text-base shadow-lg hover:shadow-xl transition-all"
                                >
                                  {applying === job.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <>
                                      Apply Now
                                      <ChevronRight className="h-5 w-5 ml-1" />
                                    </>
                                  )}
                                </Button>
                              )}

                              <Button
                                onClick={() => toggleCard(job.id)}
                                variant="outline"
                                className="w-full border-white/10 text-white hover:bg-white/10 rounded-xl h-12 font-semibold"
                              >
                                {isExpanded ? (
                                  <>
                                    Collapse
                                    <ChevronUp className="h-4 w-4 ml-2" />
                                  </>
                                ) : (
                                  <>
                                    View Details
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-6 pt-6 border-t border-white/10"
                            >
                              {/* AI Match Insights */}
                              {match && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* Why You Match */}
                                  <div className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                      <Sparkles className="w-5 h-5 text-cyan-400" />
                                      <h4 className="text-lg font-black text-white uppercase tracking-wide">
                                        Why You Match
                                      </h4>
                                    </div>

                                    <p className="text-gray-300 mb-4 leading-relaxed italic">
                                      "{match.reasoning}"
                                    </p>

                                    <div className="space-y-2">
                                      {match.match_reasons.map((reason, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                          <span className="text-sm font-medium text-gray-300">{reason}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {match.concerns && match.concerns.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                        {match.concerns.map((concern, i) => (
                                          <div key={i} className="flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-300">{concern}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Match Breakdown */}
                                  <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                      <Award className="w-5 h-5 text-purple-400" />
                                      <h4 className="text-lg font-black text-white uppercase tracking-wide">
                                        Match Breakdown
                                      </h4>
                                    </div>

                                    <div className="space-y-4">
                                      <ScoreBar
                                        label="Skills"
                                        score={match.breakdown.skills_score}
                                        color="from-cyan-400 via-blue-500 to-indigo-600"
                                      />
                                      <ScoreBar
                                        label="Salary"
                                        score={match.breakdown.salary_score}
                                        color="from-emerald-400 via-green-500 to-teal-600"
                                      />
                                      <ScoreBar
                                        label="Experience"
                                        score={match.breakdown.experience_score}
                                        color="from-purple-400 via-violet-500 to-indigo-600"
                                      />
                                      <ScoreBar
                                        label="Arrangement"
                                        score={match.breakdown.arrangement_score}
                                        color="from-pink-400 via-rose-500 to-red-600"
                                      />
                                      <ScoreBar
                                        label="Shift"
                                        score={match.breakdown.shift_score}
                                        color="from-orange-400 via-amber-500 to-yellow-600"
                                      />
                                      <ScoreBar
                                        label="Location"
                                        score={match.breakdown.location_score}
                                        color="from-blue-400 via-indigo-500 to-purple-600"
                                      />
                                    </div>

                                    {/* Missing Skills Section */}
                                    {match.missing_skills && match.missing_skills.length > 0 && (
                                      <div className="mt-6 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2 mb-3">
                                          <AlertCircle className="w-4 h-4 text-amber-400" />
                                          <h5 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                                            Skills to Develop
                                          </h5>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-3">
                                          You're missing: {match.missing_skills.join(', ')}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {match.missing_skills.map((skill) => (
                                            <Badge
                                              key={skill}
                                              variant="outline"
                                              className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
                                            >
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Refresh Match Button */}
                                    <Button
                                      onClick={() => handleRefreshMatch(job.id)}
                                      disabled={!match.can_refresh || refreshingMatch === job.id}
                                      variant="outline"
                                      className="w-full mt-6 border-white/10 text-white hover:bg-white/5 rounded-xl h-10 font-semibold disabled:opacity-50"
                                      title={
                                        match.can_refresh
                                          ? 'Refresh match score'
                                          : `Next refresh: ${match.next_refresh_at ? new Date(match.next_refresh_at).toLocaleString() : 'Available in 24h'}`
                                      }
                                    >
                                      {refreshingMatch === job.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                      )}
                                      {match.can_refresh ? 'Refresh Match Score' : 'Available in 24h'}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Job Details */}
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-black text-white uppercase tracking-wide mb-4">
                                  Job Details
                                </h4>

                                <div className="prose prose-invert max-w-none">
                                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {job.description}
                                  </p>
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                      Required Skills
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {job.skills.map((skill) => (
                                        <Badge
                                          key={skill}
                                          className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-medium"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                      Job Info
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-400">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>Posted {new Date(job.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        <span>{job.agency || 'Direct Hire'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
