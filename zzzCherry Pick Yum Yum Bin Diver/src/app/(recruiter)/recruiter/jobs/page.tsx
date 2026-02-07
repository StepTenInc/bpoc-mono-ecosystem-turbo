'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Eye,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  PauseCircle,
  ExternalLink,
  Copy,
  TrendingUp,
  Share2,
  Sparkles,
  Target,
  Filter,
  ChevronDown,
  Play,
  BarChart3,
  Zap,
  FileText,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
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

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  rejectionReason?: string | null;
  workType: string;
  workArrangement: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  views: number;
  applicantsCount: number;
  createdAt: string;
  clientName: string;
  shortlistedCount?: number;
  interviewsCount?: number;
  conversionRate?: number;
  isUrgent?: boolean;
  expiresAt?: string;
}

export default function RecruiterJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user?.id, statusFilter]);

  const fetchJobs = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/jobs?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 30) {
      return `${Math.floor(diffDays / 30)}mo ago`;
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          icon: CheckCircle,
          className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
      case 'paused':
        return {
          label: 'Paused',
          icon: PauseCircle,
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
      case 'closed':
        return {
          label: 'Closed',
          icon: XCircle,
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
      case 'draft':
        return {
          label: 'Draft',
          icon: FileText,
          className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          className: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'pending_approval':
        return {
          label: 'Pending Approval',
          icon: Clock,
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
      default:
        return {
          label: status,
          icon: Briefcase,
          className: 'bg-white/10 text-gray-400 border-white/10'
        };
    }
  };

  const formatWorkType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSalary = (min?: number, max?: number, currency: string = 'PHP') => {
    if (!min && !max) return 'Negotiable';
    const format = (n: number) => n.toLocaleString();
    if (min && max) return `${currency} ${format(min)} - ${format(max)}`;
    if (min) return `${currency} ${format(min)}+`;
    return `Up to ${currency} ${format(max!)}`;
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/jobs/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Job link copied!');
  };

  const filteredJobs = jobs.filter(job =>
    (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.clientName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalViews = jobs.reduce((acc, j) => acc + j.views, 0);
  const totalApplicants = jobs.reduce((acc, j) => acc + j.applicantsCount, 0);
  const avgConversion = jobs.length > 0
    ? jobs.reduce((acc, j) => acc + (j.conversionRate || 0), 0) / jobs.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-orange-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Jobs
          </motion.h1>
          <motion.p
            className="text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Manage your job postings and track performance
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/recruiter/jobs/create">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-orange-500/10 backdrop-blur-xl border-orange-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{jobs.length}</p>
                  <p className="text-gray-400 text-sm">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/10 backdrop-blur-xl border-emerald-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{activeJobs}</p>
                  <p className="text-gray-400 text-sm">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-cyan-500/10 backdrop-blur-xl border-cyan-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/10 backdrop-blur-xl border-purple-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{totalApplicants}</p>
                  <p className="text-gray-400 text-sm">Applicants</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs or clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white min-w-[160px] focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="border-white/10 text-gray-400 hover:text-white min-w-[120px]"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {viewMode === 'grid' ? 'List' : 'Grid'} View
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Jobs List/Grid */}
      {filteredJobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-16 text-center">
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full blur-xl" />
                <div className="relative bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full p-6 border border-orange-500/20">
                  <Briefcase className="h-12 w-12 text-orange-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Jobs Yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create your first job posting to start receiving applications from top talent
              </p>
              <Link href="/recruiter/jobs/create">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job, index) => {
            const statusConfig = getStatusConfig(job.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-all group overflow-hidden relative">
                  {job.isUrgent && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-red-500 to-transparent h-1 w-32" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardContent className="p-6 relative z-10">
                    {/* Rejection Reason Banner */}
                    {job.status === 'rejected' && job.rejectionReason && (
                      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-red-400 font-semibold mb-1">Job Posting Rejected</h4>
                            <p className="text-gray-300 text-sm">{job.rejectionReason}</p>
                            <p className="text-gray-400 text-xs mt-2">Please edit and resubmit your job posting with the necessary corrections.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pending Approval Banner */}
                    {job.status === 'pending_approval' && (
                      <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-yellow-400 font-semibold mb-1">Awaiting Admin Approval</h4>
                            <p className="text-gray-300 text-sm">Your job posting is currently under review by our admin team. You'll be notified once it's approved.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                            <Briefcase className="h-6 w-6 text-orange-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <Link href={`/recruiter/jobs/${job.id}`}>
                                <h3 className="text-xl font-semibold text-white hover:text-orange-400 transition-colors">
                                  {job.title}
                                </h3>
                              </Link>
                              <Badge variant="outline" className={statusConfig.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {job.isUrgent && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                            </div>

                            {/* Client & Meta */}
                            <div className="flex items-center gap-4 mb-3 flex-wrap">
                              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Building2 className="h-4 w-4 text-purple-400" />
                                <span className="text-sm text-purple-300 font-medium">{job.clientName}</span>
                              </div>
                              <span className="text-gray-500 text-sm">•</span>
                              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                Posted {getTimeAgo(job.createdAt)}
                              </span>
                              {job.expiresAt && (
                                <>
                                  <span className="text-gray-500 text-sm">•</span>
                                  <span className="text-sm text-yellow-400 flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Expires {getTimeAgo(job.expiresAt)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Job Details */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-cyan-400" />
                                {formatWorkType(job.workArrangement)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-blue-400" />
                                {formatWorkType(job.workType)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <DollarSign className="h-4 w-4 text-green-400" />
                                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        {/* Performance Stats */}
                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
                              <Eye className="h-4 w-4" />
                              <span className="text-xl font-semibold">{job.views}</span>
                            </div>
                            <p className="text-xs text-gray-500">Views</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                              <Users className="h-4 w-4" />
                              <span className="text-xl font-semibold">{job.applicantsCount}</span>
                            </div>
                            <p className="text-xs text-gray-500">Applicants</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-xl font-semibold">{job.conversionRate || 0}%</span>
                            </div>
                            <p className="text-xs text-gray-500">Rate</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link href={`/recruiter/applications?jobId=${job.id}`}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/20"
                            >
                              <Users className="h-4 w-4 mr-1.5" />
                              View Applications
                            </Button>
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-white/10 w-56">
                              <DropdownMenuItem
                                onClick={() => window.location.href = `/recruiter/jobs/${job.id}/edit`}
                                className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Job
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/jobs/${job.slug}`, '_blank')}
                                className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Public Page
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCopyLink(job.slug)}
                                className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Job Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share on Social Media
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              {job.status === 'active' && (
                                <DropdownMenuItem className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 cursor-pointer">
                                  <PauseCircle className="h-4 w-4 mr-2" />
                                  Pause Job
                                </DropdownMenuItem>
                              )}
                              {job.status === 'paused' && (
                                <DropdownMenuItem className="text-green-400 hover:text-green-300 hover:bg-green-500/10 cursor-pointer">
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Job
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Job
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
