'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FileText, Search, Clock, Video, CheckCircle, XCircle, Eye, Loader2, Briefcase,
  User, Mail, MoreVertical, Filter, ChevronDown, Star, Brain, MapPin, Phone, Gift,
  MessageSquare, Calendar, Award, Sparkles, ExternalLink, Check, Minus, ArrowRight
} from 'lucide-react';
import { VideoCallButton } from '@/components/video';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
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
import Link from 'next/link';

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateAvatar?: string;
  candidateLocation?: string;
  jobId: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
  recruiterNotes?: string;
  hasResume: boolean;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  hasAiAnalysis: boolean;
  aiScore?: number;
  matchScore?: number;
  skills: string[];
  experienceYears?: number;
  hasOffer: boolean;
  offerStatus?: string;
  // Recruiter gate + review tracking
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  releasedToClient?: boolean;
  releasedAt?: string | null;
  releasedBy?: string | null;
  sharePrescreenVideo?: boolean;
  sharePrescreenNotes?: boolean;
}

// Status step configuration for the pipeline stepper
const PIPELINE_STEPS = [
  { key: 'invited', label: 'Invited', icon: Gift },
  { key: 'submitted', label: 'Applied', icon: FileText },
  { key: 'under_review', label: 'Reviewing', icon: Eye },
  { key: 'shortlisted', label: 'Shortlisted', icon: Star },
  { key: 'interview_scheduled', label: 'Interview', icon: Video },
  { key: 'offer_sent', label: 'Offer', icon: Sparkles },
  { key: 'hired', label: 'Hired', icon: Award },
];

// Status Stepper Component
function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = PIPELINE_STEPS.findIndex(s => s.key === currentStatus);
  const isRejected = currentStatus === 'rejected';
  
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = !isRejected && index < currentIndex;
        const isCurrent = !isRejected && index === currentIndex;
        const isPast = isCompleted || isCurrent;
        
        return (
          <React.Fragment key={step.key}>
            <div
              className={`
                flex items-center justify-center w-6 h-6 rounded-full transition-all
                ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                ${isCurrent ? 'bg-orange-500 text-white ring-2 ring-orange-500/30' : ''}
                ${!isPast ? 'bg-white/5 text-gray-500' : ''}
                ${isRejected ? 'bg-red-500/20 text-red-400' : ''}
              `}
              title={step.label}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <StepIcon className="h-3 w-3" />
              )}
            </div>
            {index < PIPELINE_STEPS.length - 1 && (
              <div 
                className={`w-4 h-0.5 ${
                  isCompleted ? 'bg-emerald-500' : 
                  isCurrent ? 'bg-gradient-to-r from-orange-500 to-gray-600' :
                  'bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Score Ring Component
function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-400' };
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-400' };
    return { stroke: '#ef4444', text: 'text-red-400' };
  };
  
  const colors = getColor(score);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={colors.stroke}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colors.text}`}>
        {score}
      </div>
    </div>
  );
}

export default function RecruiterApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [notesSaving, setNotesSaving] = useState<string | null>(null);
  const [notesJustSaved, setNotesJustSaved] = useState<Record<string, boolean>>({});
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; appId?: string; candidateName?: string }>({ open: false });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (user?.id) fetchApplications();
  }, [user?.id]);

  const fetchApplications = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/applications?detailed=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      const data = await response.json();
      if (response.ok) setApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInterview = async (applicationId: string, candidateName: string) => {
    setActionLoading(applicationId);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ applicationId, interviewType: 'screening' }),
      });
      
      if (response.ok) {
        toast.success(`Interview scheduled for ${candidateName}! 🎉`);
        fetchApplications();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to schedule interview');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string, candidateName: string) => {
    setActionLoading(applicationId);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/applications/status', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });
      
      if (response.ok) {
        const statusMessages: Record<string, string> = {
          under_review: `Now reviewing ${candidateName}'s application`,
          shortlisted: `${candidateName} has been shortlisted! ⭐`,
          rejected: `${candidateName}'s application declined`,
        };
        toast.success(statusMessages[newStatus] || 'Status updated');
        fetchApplications();
      }
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (applicationId: string, candidateName: string) => {
    setRejectReason('');
    setRejectDialog({ open: true, appId: applicationId, candidateName });
  };

  const handleReject = async () => {
    const applicationId = rejectDialog.appId;
    const candidateName = rejectDialog.candidateName || 'candidate';
    if (!applicationId) return;
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setRejecting(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          rejected_by: 'recruiter',
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`${candidateName} rejected`);
        setRejectDialog({ open: false });
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to reject application');
      }
    } catch (e) {
      console.error('Reject failed:', e);
      toast.error('Failed to reject application');
    } finally {
      setRejecting(false);
    }
  };

  const handleSaveNotes = async (applicationId: string) => {
    setNotesSaving(applicationId);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/applications/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          applicationId,
          notes: notesDraft[applicationId] ?? '',
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Recruiter notes saved');
        setNotesJustSaved((prev) => ({ ...prev, [applicationId]: true }));
        setTimeout(() => {
          setNotesJustSaved((prev) => ({ ...prev, [applicationId]: false }));
        }, 1500);
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to save notes');
      }
    } catch (e) {
      console.error('Failed to save notes:', e);
      toast.error('Failed to save notes');
    } finally {
      setNotesSaving(null);
    }
  };

  const handleBulkAction = async (action: 'review' | 'shortlist' | 'reject') => {
    const statusMap = {
      review: 'under_review',
      shortlist: 'shortlisted',
      reject: 'rejected',
    };
    const newStatus = statusMap[action];
    
    for (const id of selectedIds) {
      const app = applications.find(a => a.id === id);
      if (app) {
        await handleUpdateStatus(id, newStatus, app.candidateName);
      }
    }
    
    setSelectedIds(new Set());
    setBulkMode(false);
    toast.success(`Updated ${selectedIds.size} applications`);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      invited: {
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/30',
        icon: <Gift className="h-4 w-4" />,
        label: 'Invited'
      },
      submitted: { 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/10 border-blue-500/30',
        icon: <FileText className="h-4 w-4" />,
        label: 'New'
      },
      under_review: { 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        icon: <Eye className="h-4 w-4" />,
        label: 'Reviewing'
      },
      shortlisted: { 
        color: 'text-purple-400', 
        bg: 'bg-purple-500/10 border-purple-500/30',
        icon: <Star className="h-4 w-4" />,
        label: 'Shortlisted'
      },
      interview_scheduled: { 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/10 border-orange-500/30',
        icon: <Video className="h-4 w-4" />,
        label: 'Interview'
      },
      interviewed: { 
        color: 'text-amber-400', 
        bg: 'bg-amber-500/10 border-amber-500/30',
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Interviewed'
      },
      offer_sent: { 
        color: 'text-pink-400', 
        bg: 'bg-pink-500/10 border-pink-500/30',
        icon: <Sparkles className="h-4 w-4" />,
        label: 'Offer Sent'
      },
      hired: { 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: <Award className="h-4 w-4" />,
        label: 'Hired 🎉'
      },
      rejected: { 
        color: 'text-red-400', 
        bg: 'bg-red-500/10 border-red-500/30',
        icon: <XCircle className="h-4 w-4" />,
        label: 'Declined'
      },
    };
    return configs[status] || configs.submitted;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const applied = new Date(date);
    const diffMs = now.getTime() - applied.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return applied.toLocaleDateString();
  };

  const statuses = ['all', 'invited', 'submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'hired', 'rejected'];
  
  const filtered = applications.filter(a => {
    const matchesSearch = (a.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: applications.length,
    invited: applications.filter(a => a.status === 'invited').length,
    new: applications.filter(a => a.status === 'submitted').length,
    reviewing: applications.filter(a => ['under_review', 'shortlisted'].includes(a.status)).length,
    interviewing: applications.filter(a => a.status === 'interview_scheduled').length,
    hired: applications.filter(a => a.status === 'hired').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Applications</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Review and manage your pipeline</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedIds(new Set());
            }}
            className={`whitespace-nowrap border-white/10 ${bulkMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Check className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}</span>
            <span className="sm:hidden">Bulk</span>
          </Button>
          <Link href="/recruiter/talent">
            <Button variant="outline" size="sm" className="whitespace-nowrap border-white/10 text-gray-400 hover:text-white">
              <User className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Browse Talent Pool</span>
              <span className="sm:hidden">Talent</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {bulkMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="bg-[#0a0a0f]/95 backdrop-blur-xl border-orange-500/30 shadow-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-white font-medium">
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleBulkAction('review')}
                    className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review All
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleBulkAction('shortlist')}
                    className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Shortlist All
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleBulkAction('reject')}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline All
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedIds(new Set())}
                  className="text-gray-400"
                >
                  Clear
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'white/5', textColor: 'white', borderColor: 'white/10' },
          { label: 'Invited', value: stats.invited, color: 'indigo-500/5', textColor: 'indigo-400', borderColor: 'indigo-500/20' },
          { label: 'New', value: stats.new, color: 'blue-500/5', textColor: 'blue-400', borderColor: 'blue-500/20' },
          { label: 'Reviewing', value: stats.reviewing, color: 'purple-500/5', textColor: 'purple-400', borderColor: 'purple-500/20' },
          { label: 'Interviewing', value: stats.interviewing, color: 'orange-500/5', textColor: 'orange-400', borderColor: 'orange-500/20' },
          { label: 'Hired', value: stats.hired, color: 'emerald-500/5', textColor: 'emerald-400', borderColor: 'emerald-500/20' },
        ].map((stat) => (
          <Card key={stat.label} className={`bg-${stat.color} backdrop-blur-xl border-${stat.borderColor}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold text-${stat.textColor}`}>{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {bulkMode && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {selectedIds.size === filtered.length ? (
              <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : selectedIds.size > 0 ? (
              <div className="w-5 h-5 rounded bg-orange-500/50 flex items-center justify-center">
                <Minus className="h-3 w-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded border-2 border-gray-500" />
            )}
            <span className="text-sm">Select All</span>
          </button>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, email, or job..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10 bg-white/5 border-white/10 text-white" 
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/10 text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {statusFilter === 'all' ? 'All Status' : getStatusConfig(statusFilter).label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0a0a0f] border-white/10">
            {statuses.map((status) => (
              <DropdownMenuItem 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-gray-300 hover:text-white cursor-pointer ${statusFilter === status ? 'bg-white/10' : ''}`}
              >
                {status === 'all' ? 'All Status' : getStatusConfig(status).label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
            <p className="text-gray-400 mb-6">
              Applications will appear when candidates apply to your jobs.
            </p>
            <Link href="/recruiter/jobs">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600">
                <Briefcase className="h-4 w-4 mr-2" />
                View Your Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => {
            const statusConfig = getStatusConfig(app.status);
            const isExpanded = expandedApp === app.id;
            const isSelected = selectedIds.has(app.id);
            const currentNotes = app.recruiterNotes ?? '';
            const draftNotes = notesDraft[app.id] ?? currentNotes;
            const notesDirty = (draftNotes ?? '') !== (currentNotes ?? '');
            
            return (
              <motion.div 
                key={app.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.02 }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/recruiter/applications/${app.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') router.push(`/recruiter/applications/${app.id}`);
                  }}
                  className={`
                  bg-white/5 backdrop-blur-xl border-white/10 transition-all overflow-hidden
                  ${isSelected ? 'border-orange-500/50 bg-orange-500/5' : 'hover:border-orange-500/30'}
                  group
                  cursor-pointer
                `}
                >
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Checkbox in bulk mode */}
                        {bulkMode && (
                          <button
                            onClick={() => toggleSelect(app.id)}
                            className="mt-1"
                          >
                            {isSelected ? (
                              <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded border-2 border-gray-500 group-hover:border-orange-500/50 transition-colors" />
                            )}
                          </button>
                        )}

                        {/* Avatar with Score Ring */}
                        <div className="relative">
                          <Link href={`/recruiter/talent/${app.candidateId}`}>
                            <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all">
                              <AvatarImage src={app.candidateAvatar} />
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-lg">
                                {app.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          {app.aiScore && (
                            <div className="absolute -bottom-1 -right-1">
                              <ScoreRing score={app.aiScore} size={28} />
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Link href={`/recruiter/applications/${app.id}`} className="hover:text-orange-400 transition-colors">
                              <h3 className="text-white font-semibold text-lg">{app.candidateName}</h3>
                            </Link>
                            <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.color} text-xs`}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-none">{app.jobTitle}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                              {getTimeAgo(app.appliedAt)}
                            </span>
                            {app.candidateLocation && (
                              <span className="flex items-center gap-1 hidden sm:flex">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                {app.candidateLocation}
                              </span>
                            )}
                          </div>

                          {/* Status Stepper */}
                          <div className="mb-3">
                            <StatusStepper currentStatus={app.status} />
                          </div>

                          {/* Quick Info Badges */}
                          <div className="flex flex-wrap gap-2">
                            {app.hasResume && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Resume
                              </Badge>
                            )}
                            {app.experienceYears && (
                              <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20 text-xs">
                                {app.experienceYears}+ years
                              </Badge>
                            )}
                            {app.matchScore && (
                              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs font-bold">
                                <Target className="h-3 w-3 mr-1" />
                                {app.matchScore}% match
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0 sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
                          {/* Review button - only for submitted status */}
                          {app.status === 'submitted' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateStatus(app.id, 'under_review', app.candidateName)}
                              className="h-8 px-3 min-w-[100px] justify-center bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                              disabled={actionLoading === app.id}
                            >
                              {actionLoading === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                  <Eye className="h-4 w-4 mr-1.5" />
                                  Review
                                </>
                              )}
                            </Button>
                          )}
                          
                          {/* Shortlist button - only for under_review status */}
                          {app.status === 'under_review' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateStatus(app.id, 'shortlisted', app.candidateName)}
                              className="h-8 px-3 min-w-[100px] justify-center bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                              disabled={actionLoading === app.id}
                            >
                              {actionLoading === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                  <Star className="h-4 w-4 mr-1.5" />
                                  Shortlist
                                </>
                              )}
                            </Button>
                          )}

                          {/* Call, Schedule, Reject - for under_review and shortlisted (in that order) */}
                          {(app.status === 'under_review' || app.status === 'shortlisted') && (
                            <>
                              <VideoCallButton
                                candidateUserId={app.candidateId}
                                candidateName={app.candidateName}
                                candidateEmail={app.candidateEmail}
                                candidateAvatar={app.candidateAvatar}
                                jobId={app.jobId}
                                jobTitle={app.jobTitle}
                                applicationId={app.id}
                                variant="compact"
                                context="applications"
                                className="h-8 px-3 min-w-[100px]"
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleRequestInterview(app.id, app.candidateName)}
                                className="h-8 px-3 min-w-[100px] justify-center bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                                disabled={actionLoading === app.id}
                              >
                                {actionLoading === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                  <>
                                    <Calendar className="h-4 w-4 mr-1.5" />
                                    Schedule
                                  </>
                                )}
                              </Button>
                            </>
                          )}

                          {/* Reject button - for all active statuses (last in order) */}
                          {app.status !== 'hired' && app.status !== 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => openReject(app.id, app.candidateName)}
                              className="h-8 px-3 min-w-[100px] justify-center bg-red-500 hover:bg-red-600 text-white"
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Reject
                            </Button>
                          )}
                          
                          {app.status === 'interview_scheduled' && (
                            <Link href="/recruiter/interviews">
                              <Button size="sm" className="h-8 px-3 min-w-[120px] justify-center bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30">
                                <Video className="h-4 w-4 mr-1.5" />
                                View Interview
                              </Button>
                            </Link>
                          )}

                          {app.status === 'hired' && (
                            <Link href="/recruiter/placements">
                              <Button size="sm" className="h-8 px-3 min-w-[120px] justify-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30">
                                <Award className="h-4 w-4 mr-1.5" />
                                View Placement
                              </Button>
                            </Link>
                          )}

                          {/* More Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-white/10 w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/recruiter/talent/${app.candidateId}`} className="text-gray-300 hover:text-white cursor-pointer flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  View Full Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-300 hover:text-white cursor-pointer">
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-gray-300 hover:text-white cursor-pointer"
                                onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              {app.status !== 'hired' && app.status !== 'rejected' && (
                                <DropdownMenuItem 
                                  className="text-red-400 hover:text-red-300 cursor-pointer"
                                  onClick={() => openReject(app.id, app.candidateName)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Decline Application
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10 overflow-hidden"
                        >
                          <div className="p-4 sm:p-5 bg-black/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                              <div>
                                <h4 className="text-white font-medium mb-3">Contact Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${app.candidateEmail}`} className="text-orange-400 hover:text-orange-300">
                                      {app.candidateEmail}
                                    </a>
                                  </div>
                                  {app.candidatePhone && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <Phone className="h-4 w-4" />
                                      {app.candidatePhone}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-3">Skills</h4>
                                <div className="flex flex-wrap gap-1">
                                  {app.skills?.slice(0, 6).map((skill) => (
                                    <Badge key={skill} variant="outline" className="bg-white/5 text-gray-300 border-white/20 text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {app.skills?.length > 6 && (
                                    <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/20 text-xs">
                                      +{app.skills.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-white font-medium mb-3">Recruiter Notes</h4>
                                <div className="space-y-2">
                                  <textarea
                                    value={draftNotes}
                                    onChange={(e) =>
                                      setNotesDraft((prev) => ({ ...prev, [app.id]: e.target.value }))
                                    }
                                    placeholder="Add recruiter notes..."
                                    rows={4}
                                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                  />
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                      {app.reviewedAt ? `Reviewed: ${new Date(app.reviewedAt).toLocaleString()}` : 'Not reviewed yet'}
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveNotes(app.id)}
                                      disabled={notesSaving === app.id || !notesDirty}
                                      className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30"
                                    >
                                      {notesSaving === app.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : notesJustSaved[app.id] ? (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Saved
                                        </>
                                      ) : (
                                        'Save Notes'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                              <div className="flex items-center gap-2">
                                {app.resumeUrl && (
                                  <a href={app.resumeUrl} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                                      <FileText className="h-4 w-4 mr-2" />
                                      {app.resumeFileName ? 'Resume' : 'Open Resume'}
                                    </Button>
                                  </a>
                                )}
                                <Link href={`/recruiter/talent/${app.candidateId}`}>
                                  <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                                    View Complete Profile
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Application</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will set the application status to <span className="text-red-300 font-medium">rejected</span> and store the reason in the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-gray-300">
              Rejection reason <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason..."
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialog({ open: false })} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
