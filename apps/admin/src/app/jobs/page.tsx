'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Pause,
  Eye,
  Loader2,
  ExternalLink,
  Bot,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from '@/components/shared/ui/toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';

interface AIValidation {
  score: number;
  summary: string;
}

interface Job {
  id: string;
  title: string;
  slug?: string;
  company: string;
  agencyId: string;
  agencyName: string;
  location: string;
  salary: string;
  type: string;
  status: 'active' | 'paused' | 'closed' | 'pending_approval' | 'rejected';
  approvalStatus?: 'pending_review' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  applicantsCount: number;
  createdAt: string;
  aiValidation?: AIValidation;
  aiValidatedAt?: string;
  approvedAt?: string;
}

interface Stats {
  total: number;
  active: number;
  paused: number;
  closed: number;
  aiApproved: number;
  pendingReview: number;
  rejected: number;
  withApplicants: number;
  totalApplicants: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    paused: 0,
    closed: 0,
    aiApproved: 0,
    pendingReview: 0,
    rejected: 0,
    withApplicants: 0,
    totalApplicants: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [reviewJob, setReviewJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs?search=${searchQuery}&status=${statusFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setJobs(data.jobs.map((j: Record<string, unknown>) => ({
          id: j.id,
          title: j.title,
          slug: j.slug,
          company: j.company || 'Unknown',
          agencyId: j.agencyId,
          agencyName: j.agencyName || 'Direct',
          location: j.location || 'Remote',
          salary: j.salary || 'Not specified',
          type: j.type || 'full_time',
          status: j.status || 'active',
          approvalStatus: j.approvalStatus,
          rejection_reason: j.rejection_reason || null,
          applicantsCount: j.applicantsCount || 0,
          createdAt: j.createdAt,
          aiValidation: j.aiValidation as AIValidation | undefined,
          aiValidatedAt: j.aiValidatedAt as string | undefined,
          approvedAt: j.approvedAt as string | undefined,
        })));
        
        // Set stats from API response
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: Job['status']) => {
    const styles: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle }> = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle },
      paused: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: Pause },
      closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: XCircle },
      pending_approval: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', icon: Clock },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: XCircle },
    };
    const style = styles[status] || styles.closed;
    const Icon = style.icon;
    const label = status === 'pending_approval' ? 'Pending' : status;
    return (
      <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} capitalize`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getAIScoreBadge = (job: Job) => {
    if (!job.aiValidation?.score) return null;
    const score = job.aiValidation.score;
    
    let colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score < 60) {
      colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
    } else if (score < 75) {
      colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    
    return (
      <Badge variant="outline" className={`${colorClass} font-mono text-xs`}>
        <Bot className="h-3 w-3 mr-1" />
        AI: {score}
      </Badge>
    );
  };

  const getTypeBadge = (type: Job['type']) => {
    return (
      <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20 capitalize">
        {String(type).replace(/[_-]/g, ' ')}
      </Badge>
    );
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.company || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter || 
      (statusFilter === 'pending_review' && job.approvalStatus === 'pending_review');
    return matchesSearch && matchesStatus;
  });

  // Pipeline component for visual flow
  const PipelineBox = ({ 
    count, 
    label, 
    colorClass, 
    icon: Icon,
    onClick,
    active
  }: { 
    count: number; 
    label: string; 
    colorClass: string;
    icon: typeof CheckCircle;
    onClick?: () => void;
    active?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[120px] p-4 rounded-xl border transition-all ${colorClass} ${
        onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
      } ${active ? 'ring-2 ring-white/30' : ''}`}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <Icon className="h-5 w-5" />
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <p className="text-xs opacity-80 text-center">{label}</p>
    </button>
  );

  const PipelineArrow = () => (
    <div className="flex items-center justify-center px-1">
      <ArrowRight className="h-5 w-5 text-gray-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Bot className="h-8 w-8 text-cyan-400" />
            AI Job Pipeline
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Watch jobs flow through AI validation automatically</p>
        </div>
        {stats.pendingReview > 0 && (
          <button 
            onClick={() => setStatusFilter('pending_review')}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg self-start hover:bg-amber-500/30 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
            <span className="text-amber-300 font-medium text-sm">{stats.pendingReview} needs review</span>
          </button>
        )}
      </div>

      {/* AI Validation Pipeline - Visual Flow */}
      <Card className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border-white/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Validation Pipeline</h2>
          </div>
          
          {/* Pipeline Flow */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
            {/* AI Approved */}
            <PipelineBox
              count={stats.aiApproved}
              label="AI Approved"
              colorClass="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              icon={CheckCircle}
              onClick={() => setStatusFilter('active')}
              active={statusFilter === 'active'}
            />
            
            <PipelineArrow />
            
            {/* Pending Review */}
            <PipelineBox
              count={stats.pendingReview}
              label="Pending Review"
              colorClass={`bg-amber-500/10 border-amber-500/30 text-amber-400 ${stats.pendingReview > 0 ? 'animate-pulse' : ''}`}
              icon={AlertTriangle}
              onClick={() => setStatusFilter('pending_review')}
              active={statusFilter === 'pending_review'}
            />
            
            <PipelineArrow />
            
            {/* Rejected */}
            <PipelineBox
              count={stats.rejected}
              label="Rejected"
              colorClass="bg-red-500/10 border-red-500/30 text-red-400"
              icon={XCircle}
              onClick={() => setStatusFilter('rejected')}
              active={statusFilter === 'rejected'}
            />
            
            <div className="hidden md:block w-px h-12 bg-gray-700 mx-4" />
            <div className="md:hidden w-full h-px bg-gray-700 my-2" />
            
            {/* Active */}
            <PipelineBox
              count={stats.active}
              label="Live on Platform"
              colorClass="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              icon={Briefcase}
              onClick={() => setStatusFilter('active')}
              active={statusFilter === 'active'}
            />
            
            <PipelineArrow />
            
            {/* With Applicants */}
            <PipelineBox
              count={stats.withApplicants}
              label="With Applicants"
              colorClass="bg-purple-500/10 border-purple-500/30 text-purple-400"
              icon={Users}
            />
          </div>
          
          {/* Total Applicants - Bottom stat */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <span className="text-gray-400">Total Applicants:</span>
              <span className="text-white font-bold">{stats.totalApplicants}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">Total Jobs:</span>
              <span className="text-white font-bold">{stats.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending_review">⚠️ Pending Review</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
          {statusFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="text-gray-400 hover:text-white"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Jobs Found</h3>
            <p className="text-gray-400">Jobs will appear here when agencies create them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`border-white/10 hover:border-cyan-500/30 transition-all ${
                job.approvalStatus === 'pending_review' 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : 'bg-white/5'
              }`}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white truncate">{job.title}</h3>
                        {getStatusBadge(job.status)}
                        {getAIScoreBadge(job)}
                        {getTypeBadge(job.type)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{job.salary}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                        <span className="text-gray-500">
                          Agency: <span className="text-cyan-400">{job.agencyName}</span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Users className="h-4 w-4" />
                          {job.applicantsCount} applicants
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        {job.aiValidatedAt && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Bot className="h-4 w-4" />
                            AI validated {new Date(job.aiValidatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View AI Summary button */}
                      {job.aiValidation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                          onClick={() => setReviewJob(job)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                      
                      {/* View on site link */}
                      {job.slug && job.status === 'active' && (
                        <Link 
                          href={`/jobs/${job.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                      
                      {/* Status indicator */}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.approvalStatus === 'pending_review' ? 'Flagged' : 'Auto'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* AI Review Modal */}
      <Dialog open={!!reviewJob} onOpenChange={() => setReviewJob(null)}>
        <DialogContent className="bg-[#1a1a1f] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" />
              AI Validation Summary
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {reviewJob?.title} at {reviewJob?.company}
            </DialogDescription>
          </DialogHeader>
          
          {reviewJob?.aiValidation && (
            <div className="space-y-4 py-4">
              {/* Score */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <span className="text-gray-400">AI Score</span>
                <div className={`text-2xl font-bold ${
                  reviewJob.aiValidation.score >= 75 ? 'text-emerald-400' :
                  reviewJob.aiValidation.score >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {reviewJob.aiValidation.score}/100
                </div>
              </div>
              
              {/* Summary */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Analysis Summary</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {reviewJob.aiValidation.summary || 'No summary available.'}
                </p>
              </div>
              
              {/* Timestamps */}
              <div className="flex gap-4 text-xs text-gray-500">
                {reviewJob.aiValidatedAt && (
                  <span>Validated: {new Date(reviewJob.aiValidatedAt).toLocaleString()}</span>
                )}
                {reviewJob.approvedAt && (
                  <span>Approved: {new Date(reviewJob.approvedAt).toLocaleString()}</span>
                )}
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Decision:</span>
                {reviewJob.approvalStatus === 'approved' && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" /> Auto-Approved
                  </Badge>
                )}
                {reviewJob.approvalStatus === 'pending_review' && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Flagged for Review
                  </Badge>
                )}
                {reviewJob.approvalStatus === 'rejected' && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <XCircle className="h-3 w-3 mr-1" /> Rejected
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
